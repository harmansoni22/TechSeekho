import { AppError } from "../utils/appError.js";

export default function notFound(req, _res, next) {
	next(
		new AppError(
			`Route not found: ${req.method} ${req.originalUrl}`,
			404,
			"ROUTE_NOT_FOUND",
		),
	);
}
