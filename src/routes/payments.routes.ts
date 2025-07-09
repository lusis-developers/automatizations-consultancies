import express from "express";
import {
  generatePagopluxPaymentLinkController,
  receivePaymentController,
  getTransactionsController,
  getPagopluxPaymentIntentsController,
  getPaymentsSummaryController,
  deleteTransactionController,
} from "../controllers/payments.controllers";

const router = express.Router();

router.post(
  "/pagoplux/generate-payment-link",
  generatePagopluxPaymentLinkController,
);

router.post("/webhook/receive-payment", receivePaymentController);

router.get("/clients/:clientId/transactions", getTransactionsController);

router.get("/pagoplux/payment-intents", getPagopluxPaymentIntentsController);

router.get("/payments/summary", getPaymentsSummaryController);

router.delete("/transactions/:transactionId", deleteTransactionController);

export default router;
