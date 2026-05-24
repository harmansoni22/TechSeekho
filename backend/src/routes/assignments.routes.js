import { Router } from "express";
import {
	createAssignmentController,
	getAssignmentController,
	listAssignmentsController,
	listSubmissionsController,
	reviewSubmissionController,
	submitAssignmentController,
} from "../controllers/assignments.controller.js";
import {
	authenticate,
	requireOperationalAccess,
	requireRole,
} from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
	createAssignmentSchema,
	reviewSubmissionSchema,
	submitAssignmentSchema,
} from "../validators/schemas.js";

const router = Router();

router.use(authenticate);
router.use(requireOperationalAccess);

router.get(
	"/",
	requireRole("STUDENT", "TRAINER", "INSTITUTION_COORDINATOR", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listAssignmentsController(req, res).catch(next),
);
router.post(
	"/",
	requireRole("TRAINER", "INSTITUTION_COORDINATOR", "ADMIN", "SUPER_ADMIN"),
	validate({ body: createAssignmentSchema }),
	(req, res, next) => createAssignmentController(req, res).catch(next),
);
router.get(
	"/submissions",
	requireRole("TRAINER", "INSTITUTION_COORDINATOR", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listSubmissionsController(req, res).catch(next),
);
router.patch(
	"/submissions/:submissionId/review",
	requireRole("TRAINER", "INSTITUTION_COORDINATOR", "ADMIN", "SUPER_ADMIN"),
	validate({ body: reviewSubmissionSchema }),
	(req, res, next) => reviewSubmissionController(req, res).catch(next),
);
router.get(
	"/:id",
	requireRole("STUDENT", "TRAINER", "INSTITUTION_COORDINATOR", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => getAssignmentController(req, res).catch(next),
);
router.post(
	"/:id/submit",
	requireRole("STUDENT"),
	validate({ body: submitAssignmentSchema }),
	(req, res, next) => submitAssignmentController(req, res).catch(next),
);

export default router;
