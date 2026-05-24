import Redis from "ioredis";
import env from "./env.js";

/**
 * Singleton ioredis client.
 *
 * Returns null when REDIS_URL is not configured — callers must treat the
 * client as optional and degrade gracefully (e.g. the rate limiter falls
 * back to its in-memory bucket store). Connection errors are logged but
 * do not crash the process; the client retries internally.
 */

let client = null;
let warnedNoUrl = false;

export function getRedis() {
	if (!env.redisUrl) {
		if (!warnedNoUrl) {
			console.warn(
				"[redis] REDIS_URL not set — features that depend on Redis will degrade to in-memory.",
			);
			warnedNoUrl = true;
		}
		return null;
	}

	if (client) return client;

	client = new Redis(env.redisUrl, {
		// Keep startup fast: do not block boot on Redis.
		lazyConnect: false,
		// Bound the retry budget so a misconfigured URL fails loudly.
		maxRetriesPerRequest: 2,
		enableOfflineQueue: false,
		retryStrategy(times) {
			// Exponential backoff, capped at 5s. After 20 attempts, stop.
			if (times > 20) return null;
			return Math.min(times * 200, 5_000);
		},
	});

	client.on("error", (err) => {
		// Avoid log floods — ioredis emits 'error' on every failed reconnect.
		if (!client.__loggedError) {
			console.error("[redis] connection error:", err.message);
			client.__loggedError = true;
		}
	});

	client.on("ready", () => {
		client.__loggedError = false;
	});

	return client;
}

export async function closeRedis() {
	if (client) {
		try {
			await client.quit();
		} catch {
			// no-op
		}
		client = null;
	}
}
