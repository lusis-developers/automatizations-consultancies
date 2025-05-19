import express from 'express'
import { receiveConsultancyData } from '../controllers/businesses.controller'
import { upload } from '../middlewares/upload.middleware'

const router = express.Router()

router.post('/business/consultancy-data', upload.any(), receiveConsultancyData)

export default router