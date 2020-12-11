import Koa from 'koa'

const port = 3000

const app = new Koa()

const server = app.listen(port, () => {
  console.log(`server listening on port ${port}`)
})
