import { Server as SocketServer } from "socket.io"
import _ from 'lodash'

import { logger } from './logger'
import { StreamingSpeechClient } from "./speech"

const startSockets = function(io: SocketServer) {

  io.on('connection', (socket) => {
    logger.info(`${socket.id}: socket connected`)
    
    let speechClient : StreamingSpeechClient | null = new StreamingSpeechClient()

    speechClient.on('intermediate', (result) => {
      socket.emit('speech/intermediate', result)
    })
    speechClient.on('error', (err) => {
      logger.error(`${socket.id}: audio stream err: ${JSON.stringify(err)}`)
      socket.emit('error', err)
    })
    speechClient.on('ended', (result) => {
      socket.emit('speech/ended', result)
    })

    socket.on('audio/start', (msg) => {
      try {
        if (!_.has(msg,'language') || !_.has(msg,'sampleRate') || !_.has(msg,'requestId')) {
          throw Error("Msg does not contain language/sampleRate/requestId.")
        }
        speechClient?.start({
          requestId: msg.requestId,
          languageCode: msg.language, 
          sampleRate: msg.sampleRate, 
          duration: msg.duration, 
          timeout: msg.timeout,
          initialWait: msg.initialWait
        })
        logger.info(`${socket.id}: receiving audio stream`)
      } catch(err) {
        socket.emit('error', err.message)
        logger.error(err.message)
      }
    })

    socket.on('audio/data', (data) => {
        speechClient?.push(data)
    })

    socket.on('audio/stop', () => {
      speechClient?.stop()
      logger.info(`${socket.id}: audio stream stopped`)
    })

    // cleanup
    socket.on('disconnect', function() {
      logger.info(`${socket.id}: socket disconnected`)
      speechClient?.clear()
      speechClient?.removeAllListeners()
      speechClient = null
    })

  })
}

export { startSockets }