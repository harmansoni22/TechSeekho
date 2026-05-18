import { Router } from "express";
import {
	createAssessmentController,
	getAssessmentController,
	listAssessmentsController,
	reviewAssessmentSubmissionController,
	submitAssessmentController,
	updateAssessmentController,
} from "../controllers/assessments.controller.js";
import { authenticate, requireOperationalAccess, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);
router.use(requireOperationalAccess);


router.get(
	"/",
	requireRole("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listAssessmentsController(req, res).catch(next),
);
router.post(
	"/",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => createAssessmentController(req, res).catch(next),
);
router.get(
	"/:id",
	requireRole("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => getAssessmentController(req, res).catch(next),
);
router.patch(
	"/:id",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => updateAssessmentController(req, res).catch(next),
);
router.post("/:id/submit", requireRole("STUDENT"), (req, res, next) =>
	submitAssessmentController(req, res).catch(next),
);
router.patch(
	"/submissions/:submissionId/review",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) =>
		reviewAssessmentSubmissionController(req, res).catch(next),
);

export default router;
