import express from "express";
import { unifiedSearchController } from "../controllers/search.controller";

const router = express.Router();

router.get("/search", unifiedSearchController);

export default router;