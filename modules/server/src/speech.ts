
import speech, { SpeechClient } from '@google-cloud/speech';
import { EventEmitter } from 'events';
import Pumpify from 'pumpify';
import { merge, Observable, of, Subject, timer } from 'rxjs';
import { takeUntil, switchMap, mapTo } from 'rxjs/operators';

import { logger } from './logger'

const STREAM_TIMEOUT = 2000 // after what time the stream ends if no data is received
const MAX_STREAM_TIME = 60000 // maximal recording duration

function resetOnIdleTimeout(timeout: number, maxTime: number, $reset: Observable<void>, $stop: Observable<void>) {
  return merge($reset, of(0), timer(maxTime).pipe(mapTo('maxtime')))
    .pipe(switchMap((res) => {
      return (res == 'maxtime') ? of(res) : timer(timeout).pipe(mapTo('timeout'))
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

    let transcript : string[] = []

    this.recognizeStream = this.speechClient.streamingRecognize({ config, interimResults: false })
      .on('error', (err) => this.emit('error', JSON.stringify(err)) )
      .on('end', () => { 
        this.emit('result', JSON.stringify(transcript)) 
        this.emit('ended') 
        this.clear()
      })
      .on('data', data => { 
        let text = data.results[0] && data.results[0].alternatives[0] ? data.results[0].alternatives[0].transcript : null
        transcript.push(text)
      })

    resetOnIdleTimeout(STREAM_TIMEOUT, MAX_STREAM_TIME, this.$resetTimeout, this.$stopTimeout).subscribe((res) => {
      if (res == 'maxtime') {
        this.emit('warn', `stream ended, reached maximum stream time of ${MAX_STREAM_TIME}ms`)
        this.stop()
      } else {
        this.emit('error', `stream ended, no data received for ${STREAM_TIMEOUT}ms`)
        this.clear()
      }
    })
  }

  push(chunk : Buffer) {
    this.recognizeStream?.write(chunk)
    this.emit('listening')
    this.$resetTimeout.next();
  }

  stop() {
    this.$stopTimeout.next();
    this.recognizeStream?.end()
    this.emit('stopped')
  }

  clear() {
    this.recognizeStream?.removeAllListeners()
    this.recognizeStream?.end()
    this.recognizeStream = null;
    this.$stopTimeout.next();
  }
}

export { StreamingSpeechClient }