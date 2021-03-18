import { Server as SocketServer, Socket } from "socket.io"
import _ from 'lodash'

import { logger } from './logger'
import { StreamingSpeechClient } from "./speech"

const startSockets = function(io: SocketServer) {

  io.on('connection', (socket) => {
    logger.info(`${socket.id}: socket connected`)
    
    var speechClient : StreamingSpeechClient = new StreamingSpeechClient()
    speechClient.on('result', (result) => {
      socket.emit('speech/result', result)
    })
    speechClient.on('error', (err) => {
      logger.error(`${socket.id}: audio stream err: §${err}`)
      socket.emit('error', err)
    })
    speechClient.on('ended', () => {
      socket.emit('speech/ended')
    })

    socket.on('audio/start', (msg) => {
      try {
        if (!_.has(msg,'language')) {
          throw Error("Msg does not contain language/sampleRate.")
        }
        speechClient.start({languageCode: msg.language, sampleRate: msg.sampleRate})
        logger.info(`${socket.id}: receiving audio stream`)
      } catch(err) {
        socket.emit('error', err.message)
        logger.error(err.message)
      }
    })

    socket.on('audio/data', (data) => {
      try {
        speechClient?.push(data)
      } catch(err) {
        socket.emit('error', err.message)
        logger.error(err.message)
      }
    })

    socket.on('audio/stop', () => {
      try {
        speechClient?.stop()
        logger.info(`${socket.id}: audio stream stopped`)
      } catch(err) {
        socket.emit('error', err.message)
        logger.error(err.message)
      }
    })

    // cleanup
    socket.on('disconnect', function() {
      logger.info(`${socket.id}: socket disconnected`)
      speechClient?.clear()
      speechClient.removeAllListeners()
    });

  })
}

export { startSockets }