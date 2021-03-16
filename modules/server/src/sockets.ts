import path from "path"
import { Server as SocketServer, Socket } from "socket.io"
import wav from 'wav'

import { logger } from './logger'
import { Mode } from "./index";
import { StreamingSpeechClient } from "./speech"

const startSockets = function(io: SocketServer, mode : Mode) {

  if (mode == 'transcribe') {
    io.on('connection', (socket) => {
      logger.info(`${socket.id}: socket connected`)
      
      var speechClient : StreamingSpeechClient = new StreamingSpeechClient()
      speechClient.on('result', (result) => {
        socket.emit('speech/result', result)
      })
      speechClient.on('error', (err) => {
        logger.error(`${socket.id}: audio stream err: §${err}`)
        socket.emit('speech/error', err)
      })
      speechClient.on('ended', () => {
        socket.emit('speech/ended')
      })

      socket.on('audio/start', (msg) => {
        speechClient.start({languageCode: msg.language, sampleRate: msg.sampleRate})
        logger.info(`${socket.id}: receiving audio stream`)
      })

      socket.on('audio/data', (data) => {
        speechClient?.push(data)
      })

      socket.on('audio/stop', () => {
        speechClient?.stop()
        logger.info(`${socket.id}: audio stream from stopped`)
      })

      // cleanup
      socket.on('disconnect', function() {
        logger.info(`${socket.id}: socket disconnected`)
        speechClient?.clear()
        speechClient.removeAllListeners()
      });

    })
  } else {
    io.on('connection', (socket) => {
      logger.info(`${socket.id}: socket connected`)

      var fileWriter : wav.FileWriter | null

      socket.on('audio/start', (msg) => {
        const filePath = path.resolve(__dirname, `../data/track_${socket.id}.wav`)
        fileWriter = new wav.FileWriter(filePath, {
          channels: 1,
          sampleRate: msg.sampleRate,
          bitDepth: msg.bitDepth
        });
        fileWriter.on('end', () => {
          socket.emit('file/received')
        })
        logger.info(`${socket.id}: start write to ${filePath}`)
      })

      socket.on('audio/data', (data) => {
        fileWriter?.write(data)
      })

      socket.on('audio/stop', () => {
        fileWriter?.end()
        logger.info(`${socket.id}: stop`)
      })

      // cleanup
      socket.on('disconnect', function() {
        fileWriter?.end()
        fileWriter?.removeAllListeners()
        fileWriter = null
      });
    })
  }
}

export { startSockets }