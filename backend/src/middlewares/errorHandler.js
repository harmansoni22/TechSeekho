import env from "../config/env.js";

export default function errorHandler(err, _req, res, next) {
	if (res.headersSent) return next(err);

	const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
	const isServerError = statusCode >= 500;
	const code =
		err?.code || (isServerError ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED");

	const message =
		isServerError && !env.exposeErrorDetails
			? "Internal Server Error"
			: err?.message || "Unexpected error";

	const payload = {
		success: false,
		error: {
			code,
			message,
		},
	};

	if (env.exposeErrorDetails && err?.stack) {
		payload.error.stack = err.stack;
	}

	res.status(statusCode).json(payload);
}
