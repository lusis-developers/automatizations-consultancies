import express from "express";
import { deleteMeeting } from "../controllers/meeting.controller";

const router = express.Router()

router.delete('/meeting/:meetingId', deleteMeeting)

export default router