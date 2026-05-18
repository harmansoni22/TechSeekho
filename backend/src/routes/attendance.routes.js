import { Router } from "express";
import {
	bulkMarkAttendanceController,
	listAttendanceController,
	markAttendanceController,
} from "../controllers/attendance.controller.js";
import { authenticate, requireOperationalAccess, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);
router.use(requireOperationalAccess);


router.get(
	"/",
	requireRole("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listAttendanceController(req, res).catch(next),
);
router.post(
	"/",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => markAttendanceController(req, res).catch(next),
);
router.post(
	"/bulk",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => bulkMarkAttendanceController(req, res).catch(next),
);

export default router;
