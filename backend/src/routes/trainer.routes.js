import { Router } from "express";
import { getTrainerOverviewController } from "../controllers/trainer.controller.js";
import {
	authenticate,
	requireOperationalAccess,
	requireRole,
} from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);
router.use(requireOperationalAccess);

// SUPER_ADMIN is included for observability — the service falls back to a
// global trainer-style aggregation. Coordinator/Admin/Student are excluded
// because they have their own dashboards.
router.get(
	"/overview",
	requireRole("TRAINER", "SUPER_ADMIN"),
	(req, res, next) => getTrainerOverviewController(req, res).catch(next),
);

export default router;
