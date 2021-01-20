import argparse
from google.cloud import texttospeech
import pyaudio

SAMPLE_RATE = 44100

# Instantiates a client
client = texttospeech.TextToSpeechClient()

def speak(text, language, speaking_rate = 0.9):
  input_text = texttospeech.SynthesisInput(text=text)

  voice = texttospeech.VoiceSelectionParams(
    language_code=language, 
    ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL)

  audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.LINEAR16,
        sample_rate_hertz=SAMPLE_RATE,
        speaking_rate=speaking_rate
        )

  response = client.synthesize_speech(
    request={"input" : input_text, "voice" : voice, "audio_config" : audio_config}
  )

  pya = pyaudio.PyAudio()
  stream = pya.open(format=pya.get_format_from_width(width=2), channels=1, rate=SAMPLE_RATE, output=True)
  ## remove the first 44 bytes from stream
  stream.write(response.audio_content[44:])
  stream.stop_stream()
  stream.close()
  pya.terminate()


if __name__ == "__main__":
  parser = argparse.ArgumentParser(
      description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
  )
  parser.add_argument("text", help="text to speak")
  parser.add_argument("--lang", dest="lang", help="language of text", default="en")
  args = parser.parse_args()
  speak(text=args.text,language=args.lang)