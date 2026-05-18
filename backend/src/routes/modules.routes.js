import { Router } from "express";
import {
	createLearningModuleController,
	createLearningPathController,
	enrollInLearningPathController,
	listLearningPathsController,
	updateLearningModuleController,
	updateModuleProgressController,
} from "../controllers/modules.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.get(
	"/",
	requireRole("STUDENT", "TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => listLearningPathsController(req, res).catch(next),
);
router.post(
	"/",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => createLearningPathController(req, res).catch(next),
);
router.post(
	"/:pathId/modules",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => createLearningModuleController(req, res).catch(next),
);
router.patch(
	"/items/:moduleId",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	(req, res, next) => updateLearningModuleController(req, res).catch(next),
);
router.post("/:pathId/enroll", requireRole("STUDENT"), (req, res, next) =>
	enrollInLearningPathController(req, res).catch(next),
);
router.patch(
	"/items/:moduleId/progress",
	requireRole("STUDENT"),
	(req, res, next) => updateModuleProgressController(req, res).catch(next),
);

export default router;
