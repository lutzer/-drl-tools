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
          # The API currently only supports 1-channel (mono) audio
          # https://goo.gl/z757pE
          channels=1,
          rate=self._rate,
          input=True,
          frames_per_buffer=self._chunk,
          # Run the audio stream asynchronously to fill the buffer object.
          # This is necessary so that the input device's buffer doesn't
          # overflow while the calling thread makes network requests, etc.
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

class SpeechTranscribeThread (threading.Thread):
  def __init__(self, client, streaming_config, requests):
      threading.Thread.__init__(self)

      self.client = client
      self.streaming_config = streaming_config
      self.requests = requests

      self.running = False
      self.lastChangeTime = 0

  def run(self):
      self.running = True
      self.startTime = time.time()
      self.lastChangeTime = self.startTime

      responses = self.client.streaming_recognize(self.streaming_config, self.requests)

      for response in responses:
        if not response.results:
          continue

        self.lastChangeTime = time.time()
      
        if response.results[0].is_final:
          print(response)
          continue

        if not self.running:
          print(response)
          break

  def stop(self):
    self.running = False

def record(language, duration, timeout):
  client = speech.SpeechClient()
  config = speech.RecognitionConfig(
      encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
      sample_rate_hertz=RATE,
      language_code=language,
      max_alternatives=10
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
        if timeout > 0 and (currentTime > thread.lastChangeTime + timeout):
          break; 
        if currentTime > (thread.startTime + duration):
          break; 
        time.sleep(0.01)
      stream.closed = True
      thread.join()


if __name__ == "__main__":
  parser = argparse.ArgumentParser(
      description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
  )
  parser.add_argument("--duration", dest="duration", help="maximum recording duration in seconds", default=60, type=int)
  parser.add_argument("--timeout", dest="timeout", help="stop recording after beeing silent for spceified time in seconds.", default=0, type=int)
  parser.add_argument("--lang", dest="lang", help="language of file", default="en")
  args = parser.parse_args()
  record(language = args.lang, duration = args.duration, timeout = args.timeout)