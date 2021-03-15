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

    async function connectSocket() {
        return new Promise((resolve, reject) => {
            const socket = io(address)
            socket.on("connect", () => {
                resolve(socket)
            });
            socket.on('error', () => {
                reject()
            })
        })
    }

    it('should connect to http server', async () => {
        const response = await axios.get(address)
        expect(response.status).to.equal(200)
    })
  
    it('should connect to socket server', async () => {
        const socket = await connectSocket()
        expect(socket.connected).to.be.true
    })

    it('should be able to stream file to server', async () => {
        const socket = await connectSocket()
        const filepath = __dirname + '/files/sound-wav.wav'
        const fileStream = fs.createReadStream(filepath, { highWaterMark: 8 * 1024 });
        fileStream.on('open', function () {
            socket.emit('audio/start', { sampleRate: 44100, bitDepth: 16 })
        });
        fileStream.on('data', (chunk) => {
            socket.emit('audio/data', chunk)
        })
        fileStream.on('end',function() {
            socket.emit('audio/stop')
        });
        return new Promise((resolve, reject) => {
            socket.on('audio/received', () => {
                resolve()
            })
        })
    }).timeout(5000)

    it('should be able to transcribe audio file', async () => {
        const socket = await connectSocket()
        const filepath = __dirname + '/files/my_name_is_siidra.wav'
        const fileStream = fs.createReadStream(filepath, { highWaterMark: 8 * 1024 });
        fileStream.on('open', function () {
            socket.emit('audio/start', { sampleRate: 44100, bitDepth: 16 })
        });
        fileStream.on('data', (chunk) => {
            socket.emit('audio/data', chunk)
        })
        fileStream.on('end',function() {
            socket.emit('audio/stop')
        });
        return new Promise((resolve, reject) => {
            socket.on('audio/result', (data) => {
                const result = JSON.parse(data)
                expect(result[0].alternatives[0].transcript).to.equal('hello my name is Steven')
                resolve()
            })
        })
    }).timeout(6000)
})