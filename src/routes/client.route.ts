import express from "express";
import { confirmStrategyMeeting, getAllMeetings, getClientAndBusiness, getClientById, getClientMeetingStatus, getClientsController, handleAppointmentWebhook } from "../controllers/client.controller";

const router = express.Router();

router.get("/client/:clientId/business/:businessId", getClientAndBusiness);

router.get('/clients', getClientsController)

router.get('/client/:clientId', getClientById)

router.post('/webhoook/client/appointment', handleAppointmentWebhook)

router.get(
  '/clients/:clientId/meeting-status', getClientMeetingStatus
);

router.post(
  '/client/:clientId/confirm-strategy-meeting', confirmStrategyMeeting
)

router.get(
  '/client/:clientId/all-meetings', getAllMeetings
)

export default router;
