import path from "path";
import { Server as SocketServer } from "socket.io";

import speech from '@google-cloud/speech';
import Pumpify from "pumpify";

import { logger } from './logger'

const startSockets = function(io: SocketServer) {

    io.on('connection', (socket) => {
        logger.info(`${socket.id}: socket connected`)
  
        const filePath = path.resolve(__dirname, `../data/track_${socket.id}.wav`)
        
        const speechClient = new speech.SpeechClient();
        var recognizeStream: Pumpify | null = null
  
        socket.on('audio/start', (msg) => {
          
          //see https://github.com/googleapis/nodejs-speech/blob/master/protos/google/cloud/speech/v1p1beta1/cloud_speech.proto#L196
          const config = {
            encoding: 1, 
            sampleRateHertz: msg.sampleRate,
            languageCode: 'en-US',
            audioChannelCount: 1
          }
          recognizeStream = speechClient.streamingRecognize({ config: config, interimResults: false })
            .on('error', (err) => logger.error(err) )
            .on('data', data => { 
              socket.emit('audio/result', JSON.stringify(data.results))
            })
          logger.info(`${socket.id}: receiving audio stream`)
        })
  
        socket.on('audio/data', (data) => {
          // var left = convertFloat32ToInt16(data)
          recognizeStream?.write(data)
        })
  
        socket.on('audio/stop', () => {
          recognizeStream?.end()
          socket.emit('audio/received')
          logger.info(`${socket.id}: audio stream from stopped`)
        })

      })
}

export { startSockets }