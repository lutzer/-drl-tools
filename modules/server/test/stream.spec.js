const chai = require('chai')
const fs = require('fs')
const io = require("socket.io-client")
const axios = require('axios');
const sinon = require("sinon");

const { startServer } = require('../build/index');
const { logger } = require('../build/logger');

logger.transports.forEach((t) => (t.silent = true));

const expect = chai.expect

const sleep = function(timeout) {
    return new Promise( (resolve) => {
        setTimeout(() => resolve() , timeout)
    })
}

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
        socket.close()
    })

    it('should be able to stream file to server', async () => {
        const socket = await connectSocket()
        const filepath = __dirname + '/files/sound-wav.wav'
        const fileStream = fs.createReadStream(filepath, { highWaterMark: 8 * 1024 });
        fileStream.on('open', function () {
            socket.emit('audio/start', { sampleRate: 44100, bitDepth: 16, language: 'de', requestId: 'x' })
        });
        fileStream.on('data', (chunk) => {
            socket.emit('audio/data', chunk)
        })
        fileStream.on('end',function() {
            socket.emit('audio/stop')
        });
        await new Promise((resolve, reject) => {
            socket.on('speech/ended', () => {
                resolve()
            })
        })
        socket.close()
    }).timeout(10000)

    it('should be able to transcribe audio file', async () => {
        const socket = await connectSocket()
        const filepath = __dirname + '/files/my_name_is_siidra.wav'
        const fileStream = fs.createReadStream(filepath, { highWaterMark: 8 * 1024 });
        fileStream.on('open', function () {
            socket.emit('audio/start', { sampleRate: 44100, bitDepth: 16, language: 'en', requestId: 'x' })
        });
        fileStream.on('data', (chunk) => {
            socket.emit('audio/data', chunk)
        })
        fileStream.on('end',function() {
            socket.emit('audio/stop')
        });
        await new Promise((resolve, reject) => {
            socket.on('speech/ended', (data) => {
                expect(data.transcript.join()).to.equal('hello my name is Steven')
                resolve()
            })
        })
        socket.close()
    }).timeout(6000)

    it('should handle multpile starts but only give one result', async () => {
        const socket = await connectSocket()
        const filepath = __dirname + '/files/sound-wav.wav'
        const fileStream = fs.createReadStream(filepath, { highWaterMark: 8 * 1024 });

        const callbackSpy = sinon.spy()
        socket.on('speech/ended', callbackSpy)

        socket.emit('audio/start', { sampleRate: 44100, bitDepth: 16, language: 'en', requestId: 'x' })
        fileStream.on('open', function () {
            socket.emit('audio/start', { sampleRate: 44100, bitDepth: 16, language: 'en', requestId: 'x' })
        });
        fileStream.on('data', (chunk) => {
            socket.emit('audio/data', chunk)
        })
        fileStream.on('end',function() {
            socket.emit('audio/stop')
        });
        await sleep(5000)
        expect(callbackSpy.calledOnce).to.equal(true)
        socket.close()
    }).timeout(6000)

    it('should transcribe two audio messages', async () => {
        const socket = await connectSocket()
        const filepath = __dirname + '/files/my_name_is_siidra.wav'

        const callbackSpy = sinon.spy()
        socket.on('speech/result', callbackSpy)

        function sendFile() {
            const fileStream = fs.createReadStream(filepath, { highWaterMark: 8 * 1024 });
            socket.emit('audio/start', { sampleRate: 44100, bitDepth: 16, language: 'en', requestId: 'x' })
            fileStream.on('open', function () {
                socket.emit('audio/start', { sampleRate: 44100, bitDepth: 16, language: 'en', requestId: 'x' })
            });
            fileStream.on('data', (chunk) => {
                socket.emit('audio/data', chunk)
            })
            fileStream.on('end',function() {
                socket.emit('audio/stop')
            });
        }

        sendFile()
        await sleep(4000)
        sendFile()
        await sleep(4000)
        expect(callbackSpy.calledTwice).to.equal(true)
        socket.close()
    }).timeout(10000)
})