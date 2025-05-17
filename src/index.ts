import * as dotenv from 'dotenv'
import createApp from './app'

async function main () {
  dotenv.config()

  const { app, server } = createApp()

  const port: number | string = process.env.PORT || 8100

  server.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

main()