import { Router } from "express";
import { listUsers } from "../controllers/users.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", requireRole("ADMIN", "SUPER_ADMIN"), (req, res, next) =>
	listUsers(req, res).catch(next),
);

export default router;
