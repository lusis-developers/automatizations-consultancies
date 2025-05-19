import express from 'express'
import { getClient } from '../controllers/client.controller'

const router = express.Router()

router.get('/client/:clientId', getClient)

export default router