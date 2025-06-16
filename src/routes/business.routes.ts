import express from "express";
import { editBusinessData, receiveConsultancyData } from "../controllers/businesses.controller";
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

export default router;
