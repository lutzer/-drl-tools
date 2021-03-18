var mic = require('mic')
var fs = require('fs')
var player = require('play-sound')(opts = {})
var { FileWriter } = require('wav')

const sleep = function(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        },time)
    })
}

const FILENAME = './output.wav'
const RATE = 16000
const CHANNELS = 2
 
const record = async function() {
    var micInstance = mic({
        rate: RATE,
        channels: CHANNELS,
        debug: true,
        exitOnSilence: 0,
	device: 'hw:1'
    });
    var micInputStream = micInstance.getAudioStream();
     
    var outputFileStream = new FileWriter(FILENAME, {
        sampleRate: RATE,
        channels: CHANNELS
    });
     
    micInputStream.pipe(outputFileStream);

    micInstance.start();
    console.log('recording...')
    await sleep(5000)
    micInstance.stop()
    console.log('stopped recording')
}

const playback = async function() {
    return new Promise( (resolve, reject) => {
        player.play(FILENAME, function(err){
            if (err)
                reject(err)
            else
                resolve()
        })
    })
    
}

record().then(() => {
    return playback()
}).then(() => {
    console.log('done')
}).catch((err) => {
    console.error(err)
})
