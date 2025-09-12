import express from "express";
import { getBusinessChecklist, updateChecklistItem, moveToNextPhase, getChecklistProgress } from "../controllers/checklist.controller";

const router = express.Router();

// Get checklist for a business
router.get(
	"/checklist/:businessId",
	getBusinessChecklist
);

// Get checklist progress summary
router.get(
	"/checklist/:businessId/progress",
	getChecklistProgress
);

// Update checklist item status
router.patch(
	"/checklist/:businessId/phase/:phaseId/item/:itemId",
	updateChecklistItem
);

// Move to next phase
router.post(
	"/checklist/:businessId/next-phase",
	moveToNextPhase
);

export default router;