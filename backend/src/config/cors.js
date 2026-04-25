import { AppError } from "../utils/appError.js";
import env from "./env.js";

const allowedOrigins = new Set(env.corsOrigins);

const corsOptions = {
	credentials: true,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	maxAge: 600,
	origin(origin, callback) {
		if (!origin) {
			if (env.corsAllowNoOrigin) return callback(null, true);
			return callback(
				new AppError("CORS origin is required.", 403, "CORS_ORIGIN_REQUIRED"),
			);
		}

		if (allowedOrigins.has(origin)) {
			return callback(null, true);
		}

		return callback(
			new AppError("CORS origin is not allowed.", 403, "CORS_ORIGIN_BLOCKED"),
		);
	},
};

export default corsOptions;
