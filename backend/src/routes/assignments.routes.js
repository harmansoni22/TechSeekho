import { Router } from "express";
import {
	createAssignmentController,
	getAssignmentController,
	listAssignmentsController,
	reviewSubmissionController,
	submitAssignmentController,
} from "../controllers/assignments.controller.js";
import { authenticate, requireOperationalAccess, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);
router.use(requireOperationalAccess);


router.get(
	"/",
	requireRole("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listAssignmentsController(req, res).catch(next),
);
router.post(
	"/",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => createAssignmentController(req, res).catch(next),
);
router.get(
	"/:id",
	requireRole("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => getAssignmentController(req, res).catch(next),
);
router.post("/:id/submit", requireRole("STUDENT"), (req, res, next) =>
	submitAssignmentController(req, res).catch(next),
);
router.patch(
	"/submissions/:submissionId/review",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => reviewSubmissionController(req, res).catch(next),
);

export default router;
