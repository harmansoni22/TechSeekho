import { Router } from "express";
import aiRoutes from "./ai.routes.js";
import assessmentsRoutes from "./assessments.routes.js";
import assignmentsRoutes from "./assignments.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import authRoutes from "./auth.routes.js";
import coursesRoutes from "./courses.routes.js";
import healthRoutes from "./health.routes.js";
import managementRoutes from "./management.routes.js";
import modulesRoutes from "./modules.routes.js";
import oauthRoutes from "./oauth.routes.js";
import productsRoutes from "./products.routes.js";
import studentRoutes from "./student.routes.js";
import usersRoutes from "./users.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/oauth", oauthRoutes);
router.use("/courses", coursesRoutes);
router.use("/assignments", assignmentsRoutes);
router.use("/assessments", assessmentsRoutes);
router.use("/modules", modulesRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/", managementRoutes);
router.use("/products", productsRoutes);
router.use("/ai", aiRoutes);
router.use("/student", studentRoutes);
router.use("/users", usersRoutes);

export default router;
