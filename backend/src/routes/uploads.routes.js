import { Router } from "express";
import { presignUploadController } from "../controllers/uploads.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { validate } from "../middlewares/validate.js";
import { presignUploadSchema } from "../validators/schemas.js";

const router = Router();

router.use(authenticate);

const presignLimiter = rateLimit({
	windowMs: 60_000,
	max: 30,
	keyPrefix: "uploads:presign",
	message: "Too many upload requests. Please try again shortly.",
});

router.post(
	"/presign",
	presignLimiter,
	requireRole(
		"STUDENT",
		"TRAINER",
		"INSTITUTION_COORDINATOR",
		"ADMIN",
		"SUPER_ADMIN",
	),
	validate({ body: presignUploadSchema }),
	(req, res, next) => presignUploadController(req, res).catch(next),
);

export default router;
