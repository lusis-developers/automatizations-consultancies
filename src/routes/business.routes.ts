import express from "express";
import { editBusinessData, receiveConsultancyData, sendDataUploadReminders } from "../controllers/businesses.controller";
import { upload } from "../middlewares/upload.middleware";

const router = express.Router();

router.post(
  "/business/consultancy-data/:businessId",
  upload.any(),
  receiveConsultancyData,
);

router.patch(
  "business/edit/:businessId",
  editBusinessData,
)

router.post(
  "/business/send-upload-reminders",
  sendDataUploadReminders
);

export default router;
