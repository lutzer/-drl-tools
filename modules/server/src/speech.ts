
import speech, { SpeechClient } from '@google-cloud/speech';
import { EventEmitter } from 'events';
import Pumpify from 'pumpify';
import { runInThisContext } from 'vm';

import { logger } from './logger'

class StreamingSpeechClient extends EventEmitter {

  speechClient: SpeechClient
  recognizeStream : Pumpify | null

  constructor() {
    super()
    this.speechClient = new speech.SpeechClient();
    this.recognizeStream = null
  }
  start({ languageCode, sampleRate, channelCount = 1 } : { languageCode: string, sampleRate: number, channelCount?: number }) {
    
    //see https://github.com/googleapis/nodejs-speech/blob/master/protos/google/cloud/speech/v1p1beta1/cloud_speech.proto#L196
    const config = {
      encoding: 1, 
      sampleRateHertz: sampleRate,
      languageCode: languageCode,
      audioChannelCount: channelCount
    }

    if (this.recognizeStream) {
      this.clear()
    }

    this.recognizeStream = this.speechClient.streamingRecognize({ config: config, interimResults: false })
      .on('error', (err) => this.emit('error', JSON.stringify(err)) )
      .on('end', () => { 
        this.emit('ended') 
        this.clear()
      })
      .on('data', data => { this.emit('result', JSON.stringify(data.results)) })
  }

  push(chunk : Buffer) {
    this.recognizeStream?.write(chunk)
    this.emit('listening')
  }

  stop() {
    this.recognizeStream?.end()
    this.emit('stopped')
  }

  clear() {
    this.recognizeStream?.removeAllListeners()
    this.recognizeStream?.end()
    this.recognizeStream = null;
  }
}

export { StreamingSpeechClient }