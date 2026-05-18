import { AppError } from "../utils/appError.js";

const buckets = new Map();

function getClientKey(req, keyPrefix) {
	const forwardedFor = req.headers["x-forwarded-for"];
	const ip = Array.isArray(forwardedFor)
		? forwardedFor[0]
		: forwardedFor?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress;

	return `${keyPrefix}:${ip || "unknown"}`;
}

export function rateLimit({
	windowMs = 60_000,
	max = 60,
	keyPrefix = "global",
	message = "Too many requests. Please try again later.",
} = {}) {
	return (req, res, next) => {
		const now = Date.now();
		const key = getClientKey(req, keyPrefix);
		const bucket = buckets.get(key);

		if (!bucket || bucket.resetAt <= now) {
			buckets.set(key, { count: 1, resetAt: now + windowMs });
			res.setHeader("RateLimit-Limit", String(max));
			res.setHeader("RateLimit-Remaining", String(Math.max(max - 1, 0)));
			res.setHeader(
				"RateLimit-Reset",
				String(Math.ceil((now + windowMs) / 1000)),
			);
			return next();
		}

		bucket.count += 1;
		const remaining = Math.max(max - bucket.count, 0);

		res.setHeader("RateLimit-Limit", String(max));
		res.setHeader("RateLimit-Remaining", String(remaining));
		res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

		if (bucket.count > max) {
			res.setHeader(
				"Retry-After",
				String(Math.ceil((bucket.resetAt - now) / 1000)),
			);
			return next(new AppError(message, 429, "RATE_LIMITED"));
		}

		return next();
	};
}

setInterval(() => {
	const now = Date.now();
	for (const [key, bucket] of buckets.entries()) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
}, 60_000).unref();
