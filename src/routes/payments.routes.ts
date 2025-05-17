import express from 'express'
import { generatePagopluxPaymentLinkController, receivePaymentController } from '../controllers/payments.controllers'


const router = express.Router()


router.post('/pagoplux/generate-payment-link', generatePagopluxPaymentLinkController)

router.post('/webhook/receive-payment', receivePaymentController)

export default router