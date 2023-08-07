import { app } from './app'
import { env } from './env'

const port = env.PORT
const host = 'RENDER' in process.env ? '0.0.0.0' : 'localhost'

app
  .listen({
    host,
    port,
  })
  .then(function () {
    console.log('HTTP Server Running on port 3333!')
  })
