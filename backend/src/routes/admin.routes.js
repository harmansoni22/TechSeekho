import { Router } from "express";
import {
	getInstitutionDetailController,
	getPlatformAnalyticsController,
	getPlatformConfigController,
	getPlatformOverviewController,
	grantRoleAssignmentController,
	listAdminsController,
	listAuditLogsController,
	listRolesController,
	revokeRoleAssignmentController,
	setUserStatusController,
} from "../controllers/admin.controller.js";
import {
	createAdminController,
	listTrainersController,
	listUsersController,
	setInstitutionStatusController,
	setTrainerStatusController,
	terminateAdminController,
	terminateTrainerController,
} from "../controllers/governance.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
	adminListingQuerySchema,
	adminTerminationSchema,
	analyticsQuerySchema,
	auditLogQuerySchema,
	createAdminSchema,
	grantRoleAssignmentSchema,
	idParamSchema,
	institutionStatusSchema,
	trainerDirectoryQuerySchema,
	trainerStatusSchema,
	trainerTerminationSchema,
	updateUserStatusSchema,
	userDirectoryQuerySchema,
	userIdParamSchema,
} from "../validators/schemas.js";

const router = Router();

// Every endpoint here is platform-governance territory and is SUPER_ADMIN-only.
// The auth + role gate is set per-route so we never accidentally inherit a
// looser policy if someone reorders middleware.
router.use(authenticate);

router.get("/platform/overview", requireRole("SUPER_ADMIN"), (req, res, next) =>
	getPlatformOverviewController(req, res).catch(next),
);

router.get(
	"/platform/analytics",
	requireRole("SUPER_ADMIN"),
	validate({ query: analyticsQuerySchema }),
	(req, res, next) => getPlatformAnalyticsController(req, res).catch(next),
);

router.get("/platform/config", requireRole("SUPER_ADMIN"), (req, res, next) =>
	getPlatformConfigController(req, res).catch(next),
);

router.get("/institutions/:id", requireRole("SUPER_ADMIN"), (req, res, next) =>
	getInstitutionDetailController(req, res).catch(next),
);

router.get(
	"/admins",
	requireRole("SUPER_ADMIN"),
	validate({ query: adminListingQuerySchema }),
	(req, res, next) => listAdminsController(req, res).catch(next),
);

router.get("/roles", requireRole("SUPER_ADMIN"), (req, res, next) =>
	listRolesController(req, res).catch(next),
);

router.post(
	"/role-assignments",
	requireRole("SUPER_ADMIN"),
	validate({ body: grantRoleAssignmentSchema }),
	(req, res, next) => grantRoleAssignmentController(req, res).catch(next),
);

router.delete(
	"/role-assignments/:id",
	requireRole("SUPER_ADMIN"),
	(req, res, next) => revokeRoleAssignmentController(req, res).catch(next),
);

router.patch(
	"/users/:id/status",
	requireRole("SUPER_ADMIN"),
	validate({ body: updateUserStatusSchema }),
	(req, res, next) => setUserStatusController(req, res).catch(next),
);

router.get(
	"/audit-logs",
	requireRole("SUPER_ADMIN"),
	validate({ query: auditLogQuerySchema }),
	(req, res, next) => listAuditLogsController(req, res).catch(next),
);

// ---- GOVERNANCE (Phase 3) ----

// Institution lifecycle (ACTIVE / SUSPENDED / ARCHIVED).
router.patch(
	"/institutions/:id/status",
	requireRole("SUPER_ADMIN"),
	validate({ params: idParamSchema, body: institutionStatusSchema }),
	(req, res, next) => setInstitutionStatusController(req, res).catch(next),
);

// Global cross-institution user directory.
router.get(
	"/users",
	requireRole("SUPER_ADMIN"),
	validate({ query: userDirectoryQuerySchema }),
	(req, res, next) => listUsersController(req, res).catch(next),
);

// Provision an institution admin.
router.post(
	"/admins",
	requireRole("SUPER_ADMIN"),
	validate({ body: createAdminSchema }),
	(req, res, next) => createAdminController(req, res).catch(next),
);

// Admin termination with responsibility transfer (no orphan institutions).
router.post(
	"/admins/:userId/terminate",
	requireRole("SUPER_ADMIN"),
	validate({ params: userIdParamSchema, body: adminTerminationSchema }),
	(req, res, next) => terminateAdminController(req, res).catch(next),
);

// Trainer lifecycle.
router.get(
	"/trainers",
	requireRole("SUPER_ADMIN"),
	validate({ query: trainerDirectoryQuerySchema }),
	(req, res, next) => listTrainersController(req, res).catch(next),
);

router.patch(
	"/trainers/:userId/status",
	requireRole("SUPER_ADMIN"),
	validate({ params: userIdParamSchema, body: trainerStatusSchema }),
	(req, res, next) => setTrainerStatusController(req, res).catch(next),
);

// Trainer termination with batch reassignment (no orphan batches).
router.post(
	"/trainers/:userId/terminate",
	requireRole("SUPER_ADMIN"),
	validate({ params: userIdParamSchema, body: trainerTerminationSchema }),
	(req, res, next) => terminateTrainerController(req, res).catch(next),
);

export default router;
