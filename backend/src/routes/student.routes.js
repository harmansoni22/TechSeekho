import { Router } from "express";
import {
	getAchievements,
	getAssignments,
	getAttendance,
	getCourses,
	getDashboard,
	updateProgress,
} from "../controllers/student.controller.js";
import { authenticate, requireOperationalAccess, requireRole } from "../middlewares/auth.js";

const router = Router();

// All student routes require authentication, role, and operational access
router.use(authenticate);
router.use(requireOperationalAccess);
router.use(requireRole("STUDENT"));


router.get("/dashboard", (req, res, next) =>
	getDashboard(req, res).catch(next),
);
router.get("/courses", (req, res, next) => getCourses(req, res).catch(next));
router.put("/progress", (req, res, next) =>
	updateProgress(req, res).catch(next),
);
router.get("/assignments", (req, res, next) =>
	getAssignments(req, res).catch(next),
);
router.get("/attendance", (req, res, next) =>
	getAttendance(req, res).catch(next),
);
router.get("/achievements", (req, res, next) =>
	getAchievements(req, res).catch(next),
);

export default router;
