
import speech, { SpeechClient } from '@google-cloud/speech';
import { EventEmitter } from 'events';
import Pumpify from 'pumpify';
import { merge, Observable, of, Subject, timer } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { logger } from './logger'

const STREAM_TIMEOUT = 2000 // after what time the stream ends if no data is received

function resetOnIdleTimeout(timeout: number, $reset: Observable<void>, $stop: Observable<void>) {
  return merge($reset,of(0)).pipe(switchMap(() => {
    return timer(timeout)
  }), takeUntil($stop));
}

class StreamingSpeechClient extends EventEmitter {

  speechClient: SpeechClient
  recognizeStream : Pumpify | null

  $resetTimeout : Subject<void>
  $stopTimeout : Subject<void>

  constructor() {
    super()
    this.speechClient = new speech.SpeechClient();
    this.recognizeStream = null
    this.$resetTimeout = new Subject()
    this.$stopTimeout = new Subject()
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

    resetOnIdleTimeout(STREAM_TIMEOUT, this.$resetTimeout, this.$stopTimeout).subscribe(() => {
      this.emit('error', `stream ended, no data received for ${STREAM_TIMEOUT}ms`)
      this.clear()
    })
  }

  push(chunk : Buffer) {
    this.recognizeStream?.write(chunk)
    this.emit('listening')
    this.$resetTimeout.next();
  }

  stop() {
    this.recognizeStream?.end()
    this.emit('stopped')
    this.$stopTimeout.next();
  }

  clear() {
    this.recognizeStream?.removeAllListeners()
    this.recognizeStream?.end()
    this.recognizeStream = null;
    this.$stopTimeout.next();
  }
}

export { StreamingSpeechClient }