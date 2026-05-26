import { Router } from "express";
import {
	createLearningModuleController,
	createLearningPathController,
	enrollInLearningPathController,
	listLearningPathsController,
	updateLearningModuleController,
	updateModuleProgressController,
} from "../controllers/modules.controller.js";
import {
	authenticate,
	requireOperationalAccess,
	requireRole,
} from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
	createLearningModuleSchema,
	createLearningPathSchema,
	updateLearningModuleSchema,
	updateModuleProgressSchema,
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
	(req, res, next) => listLearningPathsController(req, res).catch(next),
);
router.post(
	"/",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: createLearningPathSchema }),
	(req, res, next) => createLearningPathController(req, res).catch(next),
);
router.post(
	"/:pathId/modules",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: createLearningModuleSchema }),
	(req, res, next) => createLearningModuleController(req, res).catch(next),
);
router.patch(
	"/items/:moduleId",
	requireRole("TRAINER", "ADMIN", "SUPER_ADMIN"),
	validate({ body: updateLearningModuleSchema }),
	(req, res, next) => updateLearningModuleController(req, res).catch(next),
);
router.post("/:pathId/enroll", requireRole("STUDENT"), (req, res, next) =>
	enrollInLearningPathController(req, res).catch(next),
);
router.patch(
	"/items/:moduleId/progress",
	requireRole("STUDENT"),
	validate({ body: updateModuleProgressSchema }),
	(req, res, next) => updateModuleProgressController(req, res).catch(next),
);

export default router;
