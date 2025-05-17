import express from 'express'
import type { Response } from 'express'

import http from 'http'
import cors from 'cors'
import routerApi from './routes'
import { globalErrorHandler } from './middlewares/globalErrorHandler.middleware'


export default function createApp() {
  const app = express()

  const server = http.createServer(app)

  const whitelist = [
    'http://localhost:8100'
  ]

  app.use(cors({ origin: whitelist }))

  app.use(express.json())

  app.get('/', (_req, res: Response) => {
    res.send('Automatizactions from bakano is aliveeee :)')
  })

  routerApi(app)

  app.use(globalErrorHandler)

  return { app, server }
  
}