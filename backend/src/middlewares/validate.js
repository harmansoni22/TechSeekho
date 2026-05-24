import { ZodError } from "zod";
import { AppError } from "../utils/appError.js";

/**
 * Generic zod validation middleware.
 *
 * Usage:
 *   router.post(
 *     "/path",
 *     validate({ body: someBodySchema, query: someQuerySchema }),
 *     handler,
 *   );
 *
 * On success the parsed (and coerced) values are written back to
 * req.body / req.query / req.params so downstream handlers see normalized
 * data. On failure a 400 AppError is thrown with field-level details in
 * the error code's metadata.
 *
 * We intentionally do NOT validate headers or cookies — those are auth
 * concerns handled elsewhere.
 */
export function validate({ body, query, params } = {}) {
	return (req, _res, next) => {
		try {
			if (body) req.body = body.parse(req.body ?? {});
			if (query) {
				// Express 5: req.query is a getter on a frozen ParsedQs. Re-assigning
				// via Object.defineProperty avoids "Cannot assign to read only".
				const parsed = query.parse(req.query ?? {});
				Object.defineProperty(req, "query", {
					configurable: true,
					enumerable: true,
					writable: true,
					value: parsed,
				});
			}
			if (params) req.params = params.parse(req.params ?? {});
			return next();
		} catch (err) {
			if (err instanceof ZodError) {
				const issue = err.issues[0];
				const path = issue.path.join(".") || "(root)";
				return next(
					new AppError(
						`Invalid input at ${path}: ${issue.message}`,
						400,
						"VALIDATION_FAILED",
					),
				);
			}
			return next(err);
		}
	};
}
