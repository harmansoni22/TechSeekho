import { Router } from "express";
import {
	bulkCreateStudentsController,
	createStudentController,
	createTrainerController,
	getAdminAnalyticsController,
	getAdminOverviewController,
	listInstitutionPeopleController,
	setMemberStatusController,
} from "../controllers/adminOps.controller.js";
import {
	authenticate,
	requireOperationalAccess,
	requireRole,
} from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
	adminAnalyticsQuerySchema,
	adminOverviewQuerySchema,
	bulkCreateStudentsSchema,
	createStudentSchema,
	createTrainerSchema,
	institutionPeopleQuerySchema,
	setMemberStatusSchema,
} from "../validators/schemas.js";

const router = Router();

// Institution-scoped operational surface for the campus ADMIN. SUPER_ADMIN is
// allowed through for observability; service-layer scoping does the rest. This
// is intentionally NOT mounted under /admin (that prefix is SUPER_ADMIN-only
// platform governance).
router.use(authenticate);
router.use(requireRole("ADMIN", "SUPER_ADMIN"));
router.use(requireOperationalAccess);

router.get(
	"/overview",
	validate({ query: adminOverviewQuerySchema }),
	(req, res, next) => getAdminOverviewController(req, res).catch(next),
);

router.get(
	"/analytics",
	validate({ query: adminAnalyticsQuerySchema }),
	(req, res, next) => getAdminAnalyticsController(req, res).catch(next),
);

router.get(
	"/people",
	validate({ query: institutionPeopleQuerySchema }),
	(req, res, next) => listInstitutionPeopleController(req, res).catch(next),
);

router.post(
	"/students",
	validate({ body: createStudentSchema }),
	(req, res, next) => createStudentController(req, res).catch(next),
);

router.post(
	"/students/bulk",
	validate({ body: bulkCreateStudentsSchema }),
	(req, res, next) => bulkCreateStudentsController(req, res).catch(next),
);

router.post(
	"/trainers",
	validate({ body: createTrainerSchema }),
	(req, res, next) => createTrainerController(req, res).catch(next),
);

router.patch(
	"/members/:userId/status",
	validate({ body: setMemberStatusSchema }),
	(req, res, next) => setMemberStatusController(req, res).catch(next),
);

export default router;
