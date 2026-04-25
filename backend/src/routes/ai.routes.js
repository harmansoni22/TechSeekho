import { Router } from "express";
import { sendChatMessage } from "../controllers/ai.controller.js";
import { validateChatMessage } from "../validators/ai.validators.js";

const router = Router();

router.post("/chat", validateChatMessage, sendChatMessage);

export default router;
