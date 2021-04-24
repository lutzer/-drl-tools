#!/usr/bin/env python

# Copyright 2017 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START speech_transcribe_streaming_mic]
from __future__ import division

import re
import sys
import argparse
import pyaudio
from google.cloud import speech
from six.moves import queue
import threading
import time
import json

# Audio recording parameters
RATE = 16000
CHUNK = int(RATE / 10)  # 100ms

class MicrophoneStream(object):
  """Opens a recording stream as a generator yielding the audio chunks."""

  def __init__(self, rate, chunk):
      self._rate = rate
      self._chunk = chunk

      # Create a thread-safe buffer of audio data
      self._buff = queue.Queue()
      self.closed = True

  def __enter__(self):
      self._audio_interface = pyaudio.PyAudio()
      self._audio_stream = self._audio_interface.open(
          format=pyaudio.paInt16,
          channels=1,
          rate=self._rate,
          input=True,
          frames_per_buffer=self._chunk,
          stream_callback=self._fill_buffer,
      )

      self.closed = False

      return self

  def __exit__(self, type, value, traceback):
      self._audio_stream.stop_stream()
      self._audio_stream.close()
      self.closed = True
      # Signal the generator to terminate so that the client's
      # streaming_recognize method will not block the process termination.
      self._buff.put(None)
      self._audio_interface.terminate()

  def _fill_buffer(self, in_data, frame_count, time_info, status_flags):
      """Continuously collect data from the audio stream, into the buffer."""
      self._buff.put(in_data)
      return None, pyaudio.paContinue

  def generator(self):
      while not self.closed:
          # Use a blocking get() to ensure there's at least one chunk of
          # data, and stop iteration if the chunk is None, indicating the
          # end of the audio stream.
          chunk = self._buff.get()
          if chunk is None:
              return
          data = [chunk]

          # Now consume whatever other data's still buffered.
          while True:
              try:
                  chunk = self._buff.get(block=False)
                  if chunk is None:
                      return
                  data.append(chunk)
              except queue.Empty:
                  break

          yield b"".join(data)

def parseSpeechResponse(response):
  data = []
  for result in response.results:
    for alternative in result.alternatives:
      data.append({
        "transcript" : alternative.transcript,
        "confidence" : alternative.confidence
      })
  return data

class SpeechTranscribeThread (threading.Thread):
  def __init__(self, client, streaming_config, requests):
      threading.Thread.__init__(self)

      self.client = client
      self.streaming_config = streaming_config
      self.requests = requests

      self.running = False

      self.lastChangeTime = 0
      self.startTime = 0
      self.receivedInput = False

      self.output = []

  def run(self):
      self.running = True
      self.startTime = time.time()
      self.lastChangeTime = self.startTime

      responses = self.client.streaming_recognize(self.streaming_config, self.requests)

      for response in responses:
        if not response.results:
          continue

        self.lastChangeTime = time.time()
        self.receivedInput = True
      
        if response.results[0].is_final:
          self.output.append(parseSpeechResponse(response))
          continue

        if not self.running:
          self.output.append(parseSpeechResponse(response))
          break


  def stop(self):
    self.running = False

def record(language, duration, timeout, wait):
  client = speech.SpeechClient()
  config = speech.RecognitionConfig(
      encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
      sample_rate_hertz=RATE,
      language_code=language,
      max_alternatives=10,
      enable_automatic_punctuation=True
  )

  streaming_config = speech.StreamingRecognitionConfig(
      config=config, interim_results=True
  )

  with MicrophoneStream(RATE, CHUNK) as stream:
      audio_generator = stream.generator()
      requests = (
          speech.StreamingRecognizeRequest(audio_content=content)
          for content in audio_generator
      )
      thread = SpeechTranscribeThread(client, streaming_config, requests)
      thread.start()

      while True:
        currentTime = time.time()
        if wait > 0 and not thread.receivedInput:
          # intial wait time before there was any input
          if currentTime > (thread.startTime + wait):
            break
        else:
          # if there was any input or no initial wait configgured
          if timeout > 0 and (currentTime > thread.lastChangeTime + timeout):
            break
          if duration > 0 and currentTime > (thread.startTime + duration):
            break
        time.sleep(0.1)
      stream.closed = True
      thread.join()
      
      sys.stdout.write(json.dumps(thread.output))

def main():
  parser = argparse.ArgumentParser(
      description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
  )
  parser.add_argument("--wait", dest="wait", help="initial waiting time for first word", default=5, type=int)
  parser.add_argument("--duration", dest="duration", help="maximum recording duration in seconds", default=0, type=int)
  parser.add_argument("--timeout", dest="timeout", help="stop recording after beeing silent for spceified time in seconds.", default=3, type=int)
  parser.add_argument("--lang", dest="lang", help="language of file", default="en")
  args = parser.parse_args()
  record(language = args.lang, duration = args.duration, timeout = args.timeout, wait = args.wait)

if __name__ == "__main__":
  main()