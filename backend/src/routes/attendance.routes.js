import { Router } from "express";
import {
	bulkMarkAttendanceController,
	listAttendanceController,
	markAttendanceController,
} from "../controllers/attendance.controller.js";
import {
	authenticate,
	requireOperationalAccess,
	requireRole,
} from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
	attendanceQuerySchema,
	bulkAttendanceSchema,
	markAttendanceSchema,
} from "../validators/schemas.js";

const router = Router();

router.use(authenticate);
router.use(requireOperationalAccess);

router.get(
	"/",
	requireRole(
		"STUDENT",
		"TRAINER",
		"INSTITUTION_COORDINATOR",
		"ADMIN",
		"SUPER_ADMIN",
	),
	validate({ query: attendanceQuerySchema }),
	(req, res, next) => listAttendanceController(req, res).catch(next),
);
// Coordinator can VIEW attendance for projection but cannot MARK it.
// Marking is an operational write owned by trainers and admins.
router.post(
	"/",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: markAttendanceSchema }),
	(req, res, next) => markAttendanceController(req, res).catch(next),
);
router.post(
	"/bulk",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: bulkAttendanceSchema }),
	(req, res, next) => bulkMarkAttendanceController(req, res).catch(next),
);

export default router;
