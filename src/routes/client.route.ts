import express from "express";
import { getClientAndBusiness, getClientById, getClientMeetingStatus, getClientsController, handleAppointmentWebhook } from "../controllers/client.controller";

const router = express.Router();

router.get("/client/:clientId/business/:businessId", getClientAndBusiness);

router.get('/clients', getClientsController)

router.get('/client/:clientId', getClientById)

router.post('/webhoook/client/appointment', handleAppointmentWebhook)

router.get(
  '/clients/:clientId/meeting-status', getClientMeetingStatus
);

export default router;
