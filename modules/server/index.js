const { startServer } = require('./build/index')
const { logger } = require('./build/logger')

startServer().then( ({port}) => {
    logger.info(`http server listening on localhost:${port}`)
})
