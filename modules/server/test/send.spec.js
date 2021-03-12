const chai = require('chai')
const fs = require('fs')
const io = require("socket.io-client")
const axios = require('axios');

const { startServer } = require('../build/index');

const expect = chai.expect

describe('Stream Server Tests', () => {

    var address = null
    var server = null

    before( async () => {
        const _server = await startServer()
        address = 'http://localhost:' + _server.port
        server = _server.server
    })

    after( async () => {
        await server.close()
    })

    it('should connect to http server', async () => {
        const response = await axios.get(address)
        expect(response.status).to.equal(200)
    })
  
    it('should connect to socket server', (done) => {
        const socket = io(address)
        socket.on("connect", () => {
            done()
        });
    })

    it('should be able to stream file to server', async () => {
        const file = __dirname + '/files/sound-wav.wav'
    })
})