import express from "express";
import * as aiAssistantController from "../controllers/aiAssistantController.js";

const router = express.Router();

router.post("/chat", aiAssistantController.handleChat);

export default router;
