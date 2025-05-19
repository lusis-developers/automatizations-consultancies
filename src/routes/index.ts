import express, { Application } from 'express'

import payments from './payments.routes'
import businesses from './business.routes'
import clients from './client.route'

function routerApi(app: Application) {
  const router = express.Router()
  
  
  app.use('/api', router)

  router.use(payments)
  router.use(businesses)
  router.use(clients)
}

export default routerApi