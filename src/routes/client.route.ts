import express from 'express'
import { getClientAndBusiness } from '../controllers/client.controller'

const router = express.Router()

router.get('/client/:clientId/business/:businessId', getClientAndBusiness)

export default router