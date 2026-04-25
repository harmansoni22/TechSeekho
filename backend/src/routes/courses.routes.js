import { Router } from "express";
import {
	getCourse,
	listCourseReviews,
	listCourses,
} from "../controllers/courses.controller.js";
import {
	validateCourseId,
	validateCourseSlug,
} from "../validators/courses.validators.js";

const router = Router();

router.get("/", (req, res, next) => listCourses(req, res).catch(next));
router.get("/:id/reviews", validateCourseId, (req, res, next) =>
	listCourseReviews(req, res, next).catch(next),
);
router.get("/:slug", validateCourseSlug, (req, res, next) =>
	getCourse(req, res, next).catch(next),
);

export default router;
