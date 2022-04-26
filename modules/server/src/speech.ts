
import speech, { SpeechClient } from '@google-cloud/speech'
import { EventEmitter } from 'events'
import Pumpify from 'pumpify'
import { merge, Observable, of, Subject, timer } from 'rxjs'
import { takeUntil, switchMap, mapTo } from 'rxjs/operators'

import { logger } from './logger'

const STREAM_DATA_TIMEOUT = 5000 // after what time the stream ends if no data is received
const MAX_DURATION = 60000

function stopOnTimeout(timeout: number, maxTime: number, initialWait: number, $reset: Observable<void>, $stop: Observable<void>) {
  timeout = timeout == 0 ? maxTime+1 : timeout
  maxTime = Math.min(MAX_DURATION, maxTime)
  return merge($reset, timer(initialWait), timer(maxTime).pipe(mapTo('maxtime')))
    .pipe(switchMap((res) => {
      return (res == 'maxtime') ? of(res) : timer(timeout).pipe(mapTo('timeout'))
    }), takeUntil($stop))
}

function stopOnNoData($reset: Observable<void>, $stop: Observable<void>) {
  return merge($reset, of(''))
    .pipe(switchMap(() => {
      return timer(STREAM_DATA_TIMEOUT)
    }), takeUntil($stop))
}

class StreamingSpeechClient extends EventEmitter {

  speechClient: SpeechClient
  recognizeStream: Pumpify | null

  $resetTimeout: Subject<void>
  $stopTimeout: Subject<void>
  $resetDataTimeout: Subject<void>

  constructor() {
    super()
    this.speechClient = new speech.SpeechClient()
    this.recognizeStream = null

    this.$resetTimeout = new Subject()
    this.$resetDataTimeout = new Subject()
    this.$stopTimeout = new Subject()
  }
  
  start({ requestId, languageCode, sampleRate, channelCount = 1, duration = 60, timeout = 5, initialWait = 0 } : { 
      requestId: string, 
      languageCode: string, 
      sampleRate: number, 
      channelCount?: number, 
      duration? : number, 
      timeout? : number, 
      initialWait?: number 
    }) : void {
    
    //see https://github.com/googleapis/nodejs-speech/blob/master/protos/google/cloud/speech/v1p1beta1/cloud_speech.proto#L196
    const config = {
      encoding: 1, 
      sampleRateHertz: sampleRate,
      languageCode: languageCode,
      audioChannelCount: channelCount,
      enableAutomaticPunctuation: true
    }

    if (this.recognizeStream) {
      this.clear()
    }

    const transcript : string[] = []

    this.recognizeStream = this.speechClient.streamingRecognize({ config, interimResults: true })
      .on('error', (err) => { 
        this.emit('error', { id: requestId, error: JSON.stringify(err) })
        logger.error(JSON.stringify(err))
      })
      .on('end', () => { 
        this.emit('ended', { id: requestId, transcript: transcript }) 
        this.clear()
      })
      .on('data', data => { 
        this.$resetTimeout.next()
        const isFinal = data.results[0] ? data.results[0].isFinal : false
        const text = data.results[0] && data.results[0].alternatives[0] ? data.results[0].alternatives[0].transcript : ""
        if (isFinal) {
          this.emit('intermediate', { id: requestId, text: text }) 
          transcript.push(text)
        }
      })

    stopOnTimeout(timeout * 1000, duration * 1000, initialWait * 1000, this.$resetTimeout, this.$stopTimeout).subscribe((res) => {
      if (res == 'maxtime') {
        logger.info(`stream ended, reached maximum stream time of ${duration}s.`)
        this.stop()
      } else if (res == 'timeout') {
        logger.info(`stream ended, nothing said since ${timeout}s.`)
        this.stop()
      }
    })

    stopOnNoData(this.$resetDataTimeout, this.$stopTimeout).subscribe( () => {
      this.emit('error', { id: requestId, error:`stream error, no data received for ${STREAM_DATA_TIMEOUT}ms.` })
      this.clear()
    })
  }

  push(chunk : Buffer) : void {
    if (this.recognizeStream?.writable)
      this.recognizeStream.write(chunk)
    this.$resetDataTimeout.next()
  }

  stop() : void {
    this.$stopTimeout.next()
    this.recognizeStream?.end()
    this.emit('stopped')
  }

  clear() : void {
    this.recognizeStream?.removeAllListeners()
    this.recognizeStream?.end()
    this.recognizeStream = null
    this.$stopTimeout.next()
  }
}

export { StreamingSpeechClient }