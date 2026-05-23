import { getRedis } from "../config/redis.js";
import { AppError } from "../utils/appError.js";

/**
 * Fixed-window rate limiter.
 *
 * Primary store: Redis (INCR + EXPIRE on first write). When REDIS_URL is
 * unset or the Redis call fails, falls back to a per-process in-memory
 * Map so the limiter never *blocks* legitimate traffic — but at the cost
 * of cross-instance enforcement. Operationally, you want Redis in any
 * environment that runs more than one Node process.
 *
 * The Redis fallback path is intentional: a misbehaving cache should not
 * take down the auth path. If you want hard-fail behavior, set
 * `failClosed: true` on the limiter you care about.
 */

const memoryBuckets = new Map();

function getClientKey(req, keyPrefix) {
	// Prefer authenticated user id over IP when available — it's more
	// resistant to NAT/proxy aggregation.
	if (req.user?.id) {
		return `${keyPrefix}:u:${req.user.id}`;
	}
	const forwardedFor = req.headers["x-forwarded-for"];
	const ip = Array.isArray(forwardedFor)
		? forwardedFor[0]
		: forwardedFor?.split(",")[0]?.trim() ||
			req.ip ||
			req.socket.remoteAddress;
	return `${keyPrefix}:ip:${ip || "unknown"}`;
}

async function checkRedis(key, windowMs, max) {
	const redis = getRedis();
	if (!redis) return null;

	// Single pipeline: INCR; on first hit (returns 1), set EXPIRE.
	try {
		const pipeline = redis.pipeline();
		pipeline.incr(key);
		pipeline.pttl(key);
		const results = await pipeline.exec();
		if (!results) return null;

		const count = Number(results[0]?.[1]);
		let ttlMs = Number(results[1]?.[1]);

		if (!Number.isFinite(count)) return null;

		// Either no expiry was set yet (first write) or it was somehow lost.
		if (!Number.isFinite(ttlMs) || ttlMs < 0) {
			await redis.pexpire(key, windowMs);
			ttlMs = windowMs;
		}

		return {
			count,
			resetAt: Date.now() + ttlMs,
		};
	} catch (err) {
		// Don't log per-request — the redis client already logs reconnects.
		return null;
	}
}

function checkMemory(key, windowMs) {
	const now = Date.now();
	const bucket = memoryBuckets.get(key);

	if (!bucket || bucket.resetAt <= now) {
		const next = { count: 1, resetAt: now + windowMs };
		memoryBuckets.set(key, next);
		return next;
	}

	bucket.count += 1;
	return bucket;
}

export function rateLimit({
	windowMs = 60_000,
	max = 60,
	keyPrefix = "global",
	message = "Too many requests. Please try again later.",
	failClosed = false,
} = {}) {
	return async (req, res, next) => {
		const key = getClientKey(req, keyPrefix);

		let state = await checkRedis(key, windowMs, max);

		// Fall through to in-memory only if Redis didn't return a usable result.
		if (!state) {
			if (failClosed && getRedis()) {
				// Redis configured but unreachable, and we asked to fail closed.
				return next(
					new AppError(
						"Rate limiter unavailable. Please retry shortly.",
						503,
						"RATE_LIMITER_UNAVAILABLE",
					),
				);
			}
			state = checkMemory(key, windowMs);
		}

		const remaining = Math.max(max - state.count, 0);
		res.setHeader("RateLimit-Limit", String(max));
		res.setHeader("RateLimit-Remaining", String(remaining));
		res.setHeader("RateLimit-Reset", String(Math.ceil(state.resetAt / 1000)));

		if (state.count > max) {
			res.setHeader(
				"Retry-After",
				String(Math.max(1, Math.ceil((state.resetAt - Date.now()) / 1000))),
			);
			return next(new AppError(message, 429, "RATE_LIMITED"));
		}

		return next();
	};
}

// In-memory bucket eviction. No-op when Redis is in use.
setInterval(() => {
	const now = Date.now();
	for (const [key, bucket] of memoryBuckets.entries()) {
		if (bucket.resetAt <= now) memoryBuckets.delete(key);
	}
}, 60_000).unref();
