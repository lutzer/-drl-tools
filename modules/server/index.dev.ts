import { startServer } from './src/index'
import { logger } from './src/logger'

startServer().then( ({port}) => {
    logger.info(`http server listening on localhost:${port}`)
})
