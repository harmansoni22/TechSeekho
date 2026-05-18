import { Router } from "express";
import { sendChatMessage } from "../controllers/ai.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validateChatMessage } from "../validators/ai.validators.js";

const router = Router();

router.use(authenticate);

router.post(
	"/chat",
	requireRole("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"),
	validateChatMessage,
	sendChatMessage,
);

export default router;
