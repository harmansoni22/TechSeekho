import {
	getAllCourses,
	getCourseBySlug,
	getCourseReviewsById,
} from "../services/courses.service.js";
import { AppError } from "../utils/appError.js";

export async function listCourses(_req, res) {
	const courses = await getAllCourses();
	return res.status(200).json(courses);
}

export async function getCourse(req, res, next) {
	const { slug } = req.params;
	const course = await getCourseBySlug(slug);

	if (!course) {
		return next(new AppError("Course not found.", 404, "COURSE_NOT_FOUND"));
	}

	return res.status(200).json(course);
}

export async function listCourseReviews(req, res, next) {
	const { id } = req.params;
	const reviewPayload = await getCourseReviewsById(id);

	if (!reviewPayload) {
		return next(new AppError("Course not found.", 404, "COURSE_NOT_FOUND"));
	}

	return res.status(200).json(reviewPayload);
}
