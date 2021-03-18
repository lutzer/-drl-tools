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
 
const record = async function() {
    var micInstance = mic({
        rate: 16000,
        channels: 1,
        debug: true,
        exitOnSilence: 0
    });
    var micInputStream = micInstance.getAudioStream();
     
    var outputFileStream = new FileWriter(FILENAME, {
        sampleRate: 16000,
        channels: 1
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