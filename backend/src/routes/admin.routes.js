import { Router } from "express";
import { getPlatformOverviewController } from "../controllers/admin.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.get("/platform/overview", requireRole("SUPER_ADMIN"), (req, res, next) =>
	getPlatformOverviewController(req, res).catch(next),
);

export default router;
