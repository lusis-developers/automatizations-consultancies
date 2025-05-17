import express from 'express'
import { receivePaymentController } from '../controllers/payments/receivePayment.controller'

const router = express.Router()


router.post('/webhook/receive-payment', receivePaymentController)

export default router