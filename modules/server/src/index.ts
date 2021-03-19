import express from 'express'
import { createServer, Server as HttpServer } from 'http'
import { Server as SocketServer } from "socket.io";
import path from 'path'

import { config } from './config'
import { startSockets } from './sockets'

function startServer() : Promise<{ server: HttpServer, port: Number}> {
  return new Promise( (resolve) => {
    const app = express()
    const http = createServer(app)
    const io = new SocketServer(http)

    startSockets(io);

    app.get('/', (req, res) => {
      res.send('Speech to text server running.')
      // res.sendFile(path.resolve(__dirname, "../static/index.html"));
    })

    const server = http.listen(config.port, () => {
      resolve({server: server, port: config.port})
    })
  })
}

export { startServer }