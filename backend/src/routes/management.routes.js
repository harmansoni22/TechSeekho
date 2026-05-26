import { Router } from "express";
import {
	assignStudentController,
	assignTrainerController,
	createAnnouncementController,
	createBatchController,
	createInstitutionController,
	getBatchDetailController,
	listAnnouncementsController,
	listBatchesController,
	listInstitutionMembersController,
	listInstitutionsController,
	removeStudentController,
	removeTrainerController,
	updateBatchController,
	updateInstitutionController,
} from "../controllers/management.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
	assignStudentSchema,
	assignTrainerSchema,
	createAnnouncementSchema,
	createBatchSchema,
	createInstitutionSchema,
	updateBatchSchema,
	updateInstitutionSchema,
} from "../validators/schemas.js";

const router = Router();

router.use(authenticate);

router.get(
	"/institutions",
	requireRole("ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listInstitutionsController(req, res).catch(next),
);
router.post(
	"/institutions",
	requireRole("ADMIN", "SUPER_ADMIN"),
	validate({ body: createInstitutionSchema }),
	(req, res, next) => createInstitutionController(req, res).catch(next),
);
router.patch(
	"/institutions/:id",
	requireRole("ADMIN", "SUPER_ADMIN"),
	validate({ body: updateInstitutionSchema }),
	(req, res, next) => updateInstitutionController(req, res).catch(next),
);

router.get(
	"/batches",
	requireRole(
		"STUDENT",
		"TRAINER",
		"INSTITUTION_COORDINATOR",
		"ADMIN",
		"SUPER_ADMIN",
	),
	(req, res, next) => listBatchesController(req, res).catch(next),
);
router.get(
	"/batches/:id",
	requireRole(
		"STUDENT",
		"TRAINER",
		"INSTITUTION_COORDINATOR",
		"ADMIN",
		"SUPER_ADMIN",
	),
	(req, res, next) => getBatchDetailController(req, res).catch(next),
);
// Coordinator is projection-only. Write actions on batches, trainers, and
// students are restricted to ADMIN / SUPER_ADMIN (and TRAINER for updates to
// their own batches, enforced by assertCanManageBatch in the service layer).
router.post(
	"/batches",
	requireRole("ADMIN", "SUPER_ADMIN"),
	validate({ body: createBatchSchema }),
	(req, res, next) => createBatchController(req, res).catch(next),
);
router.patch(
	"/batches/:id",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: updateBatchSchema }),
	(req, res, next) => updateBatchController(req, res).catch(next),
);
router.post(
	"/batches/:id/trainers",
	requireRole("ADMIN", "SUPER_ADMIN"),
	validate({ body: assignTrainerSchema }),
	(req, res, next) => assignTrainerController(req, res).catch(next),
);
router.delete(
	"/batches/:id/trainers/:trainerId",
	requireRole("ADMIN", "SUPER_ADMIN"),
	(req, res, next) => removeTrainerController(req, res).catch(next),
);
router.post(
	"/batches/:id/students",
	requireRole("ADMIN", "SUPER_ADMIN"),
	validate({ body: assignStudentSchema }),
	(req, res, next) => assignStudentController(req, res).catch(next),
);
router.delete(
	"/batches/:id/students/:studentId",
	requireRole("ADMIN", "SUPER_ADMIN"),
	(req, res, next) => removeStudentController(req, res).catch(next),
);
router.get(
	"/institutions/:id/members",
	requireRole("INSTITUTION_COORDINATOR", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listInstitutionMembersController(req, res).catch(next),
);

router.get(
	"/announcements",
	requireRole(
		"STUDENT",
		"TRAINER",
		"INSTITUTION_COORDINATOR",
		"ADMIN",
		"SUPER_ADMIN",
	),
	(req, res, next) => listAnnouncementsController(req, res).catch(next),
);
// Coordinator is projection-only: cannot author announcements.
router.post(
	"/announcements",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: createAnnouncementSchema }),
	(req, res, next) => createAnnouncementController(req, res).catch(next),
);

export default router;
