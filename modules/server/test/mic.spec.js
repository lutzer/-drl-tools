const chai = require('chai')
const io = require("socket.io-client")
const mic = require('mic');
const sinon = require("sinon");
var fs = require('fs');

const { startServer } = require('../build/index');
const { logger } = require('../build/logger');
const { SocketAudioStream } = require('../build/sockets')

logger.transports.forEach((t) => (t.silent = true));

const expect = chai.expect

const sleep = function(timeout) {
    return new Promise( (resolve) => {
        setTimeout(() => resolve() , timeout)
    })
}

describe('Mic Stream Tests', () => {

    const SAMPLE_RATE = 44100

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

    it('open a mic stream without error', async () => {
        const micInstance = mic({
            rate: '44100',
            channels: '1',
            debug: false,
            exitOnSilence: 0
        });
        const micInputStream = micInstance.getAudioStream();
        const callbackSpy = sinon.spy()
        micInputStream.on('error', callbackSpy);

        micInstance.start()
        await sleep(1000)
        micInstance.stop()
        expect(callbackSpy.called).to.equal(false)
    }).timeout(2000)

    it('records a mic stream', async () => {
        const micInstance = mic({
            rate: SAMPLE_RATE,
            channels: 1,
            debug: false,
            exitOnSilence: 0
        });
        const micInputStream = micInstance.getAudioStream();

        const callbackSpy = sinon.spy()
        micInputStream.on('data', callbackSpy);

        micInstance.start()
        await sleep(1000)
        micInstance.stop()
        expect(callbackSpy.called).to.equal(true)
    }).timeout(10000)

    it('records a mic stream and sends it to socket and receives result', async () => {
        const socket = await connectSocket()
        const micInstance = mic({
            rate: SAMPLE_RATE,
            channels: 1,
            debug: false,
            exitOnSilence: 0
        });
        const micInputStream = micInstance.getAudioStream();
        socket.emit('audio/start', { sampleRate: SAMPLE_RATE, language: 'de' })
        micInputStream.on('data', (chunk) => {
            socket.emit('audio/data', chunk)
        })
        micInputStream.on('end', () => {
            socket.emit('audio/stop')
        })

        console.log('start listening.')
        micInstance.start()
        await sleep(5000)
        console.log('stop listening.')
        micInstance.stop()
        await new Promise((resolve, reject) => {
            socket.on('speech/result', (data) => {
                const result = JSON.parse(data)
                expect(result[0].alternatives).to.not.be.empty
                resolve()
            })
        })
        socket.close()
    }).timeout(10000)
})