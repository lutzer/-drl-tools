import express from 'express'
import { createServer, Server as HttpServer } from 'http'
import { Server as SocketServer } from "socket.io";
import path from 'path'
import fs from 'fs'
import wav from 'wav'
import speech, { SpeechClient } from '@google-cloud/speech';
import { Readable } from 'stream'

import { config } from './config'
import Pumpify from 'pumpify';

function convertFloat32ToInt16(buffer : any) {
  var l = buffer.length;
  var buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l])*0x7FFF;
  }
  return buf.buffer;
}

function startServer() : Promise<{ server: HttpServer, port: Number}> {
  return new Promise( (resolve) => {
    const app = express()
    const http = createServer(app)
    const io = new SocketServer(http)

    // io.on('connection', (socket) => {
    //   console.log('user connected')

    //   const speechClient = new speech.SpeechClient();
    //   const inputStream = new Readable();

    //   // see https://github.com/googleapis/nodejs-speech/blob/master/protos/google/cloud/speech/v1p1beta1/cloud_speech.proto#L196
    

    //   // inputStream.pipe(recognizeStream)

    //   // const filePath = path.resolve(__dirname, `../data/track_${socket.id}.wav`)

    //   var recognizeStream : Pumpify | null

    //   socket.on('audio/start', (msg) => {
    //     console.log("start", msg)
    //     const config = {
    //       encoding: 1,
    //       sampleRateHertz: msg.sampleRate,
    //       languageCode: 'en-US',
    //       audioChannelCount: 1
    //     }
    //     recognizeStream = speechClient.streamingRecognize({ config: config, interimResults: true })
    //       .on('error', (err) => console.log(err))
    //       .on('end', () => console.log('end') )
    //       .on('data', data => { console.log(data) })
    //   })

    //   socket.on('audio/data', (data) => {
    //     // console.log(data)
    //     recognizeStream?.write(data)
    //   })

    //   socket.on('audio/stop', () => {
    //     console.log('stop')
    //     recognizeStream?.end()
    //   })
    // })


    io.on('connection', (socket) => {
      console.log('user connected')

      const filePath = path.resolve(__dirname, `../data/track_${socket.id}.wav`)
      var fileWriter : wav.FileWriter | undefined


      socket.on('audio/start', (msg) => {
        fileWriter = new wav.FileWriter(filePath, {
          channels: 1,
          sampleRate: msg.sampleRate,
          bitDepth: msg.bitDepth
        });
        fileWriter.on('end', () => {
          socket.emit('audio/received')
          console.log('end')
        })
        console.log('start')
      })

      socket.on('audio/data', (data) => {
        // var left = convertFloat32ToInt16(data)
        fileWriter?.write(data)
        console.log('data')
      })

      socket.on('audio/stop', () => {
        fileWriter?.end()
        console.log('stop')
      })
    })

    app.get('/', (req, res) => {
      res.sendFile(path.resolve(__dirname, "../static/index.html"));
    })

    const server = http.listen(config.port, () => {
      resolve({server: server, port: config.port})
    })
  })
}

export { startServer }

/*
 LINKS:
 https://cloud.google.com/speech-to-text/docs/streaming-recognize
 https://subvisual.com/blog/posts/39-tutorial-html-audio-capture-streaming-to-node-js-no-browser-extensions/
 https://github.com/miguelgrinberg/socketio-examples/tree/master/audio
 https://blog.takeer.com/streaming-binary-data-using-socket-io/
 https://stackoverflow.com/questions/48627210/how-to-stream-data-over-socket-io-to-client
 https://github.com/dialogflow/selfservicekiosk-audio-streaming/blob/master/examples/simpleserver.js
 https://medium.com/google-cloud/building-a-web-server-which-receives-a-browser-microphone-stream-and-uses-dialogflow-or-the-speech-62b47499fc71
 https://nodesource.com/blog/understanding-streams-in-nodejs/

*/