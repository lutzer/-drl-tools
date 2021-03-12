import express from 'express'
import { createServer, Server as HttpServer } from 'http'
import { Server as SocketServer } from "socket.io";
import path from 'path'
import fs from 'fs'
import wav from 'wav'

import { config } from './config'

function startServer() : Promise<{ server: HttpServer, port: Number}> {
  return new Promise( (resolve) => {
    const app = express()
    const http = createServer(app)
    const io = new SocketServer(http)

    io.on('connection', (socket) => {
      console.log('user connected')
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
 https://github.com/miguelgrinberg/socketio-examples/tree/master/audio
 https://blog.takeer.com/streaming-binary-data-using-socket-io/
 https://stackoverflow.com/questions/48627210/how-to-stream-data-over-socket-io-to-client
 https://github.com/dialogflow/selfservicekiosk-audio-streaming/blob/master/examples/simpleserver.js
 https://medium.com/google-cloud/building-a-web-server-which-receives-a-browser-microphone-stream-and-uses-dialogflow-or-the-speech-62b47499fc71
 https://nodesource.com/blog/understanding-streams-in-nodejs/

*/