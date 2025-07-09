import express from "express";
import {
	assignMeetingController,
	confirmStrategyMeeting,
	getAllMeetings,
	getClientAndBusiness,
	getClientById,
	getClientMeetingStatus,
	getClientsController,
	getUnassignedMeetingsController,
	handleAppointmentWebhook,
} from "../controllers/client.controller";

const router = express.Router();

router.get("/client/:clientId/business/:businessId", getClientAndBusiness);

router.get("/clients", getClientsController);

router.get("/client/:clientId", getClientById);

router.post("/webhoook/client/appointment", handleAppointmentWebhook);

router.get("/clients/:clientId/meeting-status", getClientMeetingStatus);

router.post(
	"/client/:clientId/confirm-strategy-meeting",
	confirmStrategyMeeting
);

router.get("/client/:clientId/all-meetings", getAllMeetings);

router.get("/client/meeting/unassigned", getUnassignedMeetingsController);

router.patch("/client/meetings/:meetingId/asign", assignMeetingController);

export default router;
