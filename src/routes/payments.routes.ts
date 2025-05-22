import express from "express";
import {
  generatePagopluxPaymentLinkController,
  receivePaymentController,
  getTransactionsController,
  getPagopluxPaymentIntentsController,
  getPaymentsSummaryController,
} from "../controllers/payments.controllers";

const router = express.Router();

router.post(
  "/pagoplux/generate-payment-link",
  generatePagopluxPaymentLinkController,
);

router.post("/webhook/receive-payment", receivePaymentController);

router.post("/transactions", getTransactionsController);

router.get("/pagoplux/payment-intents", getPagopluxPaymentIntentsController);

router.get("/payments/summary", getPaymentsSummaryController);

export default router;
