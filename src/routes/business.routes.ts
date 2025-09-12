import express from "express";
import { deleteBusinessAndNotifyController, editBusinessData, receiveConsultancyData, sendDataUploadReminders, addHandoffData } from "../controllers/businesses.controller";
import { upload } from "../middlewares/upload.middleware";
import { addManagerToBusiness, getBusinessManagers, removeManagerFromBusiness } from "../controllers/manager.controller";

const router = express.Router();

router.post(
  "/business/consultancy-data/:businessId",
  upload.any(),
  receiveConsultancyData,
);

router.patch(
  "/business/edit/:businessId",
  editBusinessData,
)

router.post(
  "/business/send-upload-reminders",
  sendDataUploadReminders
);


router.post(
  "/business/:businessId/managers",
  addManagerToBusiness
)

router.get(
  "/business/:businessId/managers",
  getBusinessManagers
)

router.delete(
  "/business/:businessId/managers/:managerId",
  removeManagerFromBusiness
)

router.post(
  "/business/:businessId/handoff",
  addHandoffData
)

router.delete(
  "/business/:businessId",
  deleteBusinessAndNotifyController
)

export default router;
