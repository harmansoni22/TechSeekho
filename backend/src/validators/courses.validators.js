import { AppError } from "../utils/appError.js";

const COURSE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COURSE_ID_PATTERN = /^[a-z0-9]{10,50}$/;

export function validateCourseSlug(req, _res, next) {
	const { slug } = req.params;

	if (!COURSE_SLUG_PATTERN.test(slug)) {
		return next(
			new AppError("Invalid course slug.", 400, "INVALID_COURSE_SLUG"),
		);
	}

	return next();
}

export function validateCourseId(req, _res, next) {
	const { id } = req.params;

	if (!COURSE_ID_PATTERN.test(id)) {
		return next(new AppError("Invalid course id.", 400, "INVALID_COURSE_ID"));
	}

	return next();
}
