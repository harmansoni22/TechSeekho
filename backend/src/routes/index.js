import { Router } from "express";
import aiRoutes from "./ai.routes.js";
import coursesRoutes from "./courses.routes.js";
import healthRoutes from "./health.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/courses", coursesRoutes);
router.use("/ai", aiRoutes);

export default router;
