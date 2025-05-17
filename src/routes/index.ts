import express, { Application } from 'express'

import payments from './payments.routes'

function routerApi(app: Application) {
  const router = express.Router()
  
  
  app.use('/api', router)

  router.use(payments)
}

export default routerApi