import { startServer } from './src/index'
import { config } from './src/config'

startServer('file').then( ({port}) => {
    console.log(`http server listening on localhost:${port}`)
})
