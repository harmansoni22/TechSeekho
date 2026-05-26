import { Router } from "express";
import {
	createAssessmentController,
	getAssessmentController,
	listAssessmentsController,
	reviewAssessmentSubmissionController,
	submitAssessmentController,
	updateAssessmentController,
} from "../controllers/assessments.controller.js";
import {
	authenticate,
	requireOperationalAccess,
	requireRole,
} from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
	createAssessmentSchema,
	reviewAssessmentSubmissionSchema,
	submitAssessmentSchema,
	updateAssessmentSchema,
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
	(req, res, next) => listAssessmentsController(req, res).catch(next),
);
router.post(
	"/",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: createAssessmentSchema }),
	(req, res, next) => createAssessmentController(req, res).catch(next),
);
router.get(
	"/:id",
	requireRole(
		"STUDENT",
		"TRAINER",
		"INSTITUTION_COORDINATOR",
		"ADMIN",
		"SUPER_ADMIN",
	),
	(req, res, next) => getAssessmentController(req, res).catch(next),
);
router.patch(
	"/:id",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: updateAssessmentSchema }),
	(req, res, next) => updateAssessmentController(req, res).catch(next),
);
router.post(
	"/:id/submit",
	requireRole("STUDENT"),
	validate({ body: submitAssessmentSchema }),
	(req, res, next) => submitAssessmentController(req, res).catch(next),
);
router.patch(
	"/submissions/:submissionId/review",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: reviewAssessmentSubmissionSchema }),
	(req, res, next) =>
		reviewAssessmentSubmissionController(req, res).catch(next),
);

export default router;
