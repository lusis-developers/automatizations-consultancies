import express from "express";
import { getClientAndBusiness, getClientById, getClientsController } from "../controllers/client.controller";

const router = express.Router();

router.get("/client/:clientId/business/:businessId", getClientAndBusiness);

router.get('/clients', getClientsController)

router.get('/client/:clientId', getClientById)

export default router;
