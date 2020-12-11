#!/usr/bin/env python

import argparse
from google.cloud import speech
import io

def transcribe(filePath, language):
  # Imports the Google Cloud client library

  # Instantiates a client
  client = speech.SpeechClient()

  with io.open(filePath, "rb") as audio_file:
    content = audio_file.read()

    # The name of the audio file to transcribe

    audio = speech.RecognitionAudio(content=content)

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code=language,
    )

    # Detects speech in the audio file
    response = client.recognize(config=config, audio=audio)

    for result in response.results:
      print(result)

if __name__ == "__main__":
  parser = argparse.ArgumentParser(
      description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
  )
  parser.add_argument("path", help="file to transcribe")
  parser.add_argument("--lang", dest="lang", help="language of file", default="en")
  args = parser.parse_args()
  transcribe(filePath=args.path,language=args.lang)