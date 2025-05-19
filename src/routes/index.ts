import express, { Application } from 'express'

import payments from './payments.routes'
import businesses from './business.routes'

function routerApi(app: Application) {
  const router = express.Router()
  
  
  app.use('/api', router)

  router.use(payments)
  router.use(businesses)
}

export default routerApi