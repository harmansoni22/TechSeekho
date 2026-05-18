import { Router } from "express";
import {
	assignStudentController,
	assignTrainerController,
	createAnnouncementController,
	createBatchController,
	createInstitutionController,
	listAnnouncementsController,
	listBatchesController,
	listInstitutionsController,
	updateBatchController,
	updateInstitutionController,
} from "../controllers/management.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

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
	(req, res, next) => createInstitutionController(req, res).catch(next),
);
router.patch(
	"/institutions/:id",
	requireRole("ADMIN", "SUPER_ADMIN"),
	(req, res, next) => updateInstitutionController(req, res).catch(next),
);

router.get(
	"/batches",
	requireRole("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listBatchesController(req, res).catch(next),
);
router.post("/batches", requireRole("ADMIN", "SUPER_ADMIN"), (req, res, next) =>
	createBatchController(req, res).catch(next),
);
router.patch(
	"/batches/:id",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => updateBatchController(req, res).catch(next),
);
router.post(
	"/batches/:id/trainers",
	requireRole("ADMIN", "SUPER_ADMIN"),
	(req, res, next) => assignTrainerController(req, res).catch(next),
);
router.post(
	"/batches/:id/students",
	requireRole("ADMIN", "SUPER_ADMIN"),
	(req, res, next) => assignStudentController(req, res).catch(next),
);

router.get(
	"/announcements",
	requireRole("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listAnnouncementsController(req, res).catch(next),
);
router.post(
	"/announcements",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => createAnnouncementController(req, res).catch(next),
);

export default router;
