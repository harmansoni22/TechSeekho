import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Prefer repo root .env (TechSeekhoApp/.env), fallback to backend-relative .env
const repoRootEnvPath = path.resolve(__dirname, "../../../.env");
const backendEnvPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: repoRootEnvPath });
// If not found, try fallback path
if (!process.env.JWT_SECRET) {
	dotenv.config({ path: backendEnvPath });
}

function parseBoolean(value, fallback = false) {
	if (typeof value !== "string") return fallback;
	const normalized = value.trim().toLowerCase();
	return ["1", "true", "yes", "on"].includes(normalized);
}

function parsePort(value, fallback = 4000) {
	const parsed = Number.parseInt(value ?? "", 10);
	if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
	return parsed;
}

function parsePositiveInteger(value, fallback) {
	const parsed = Number.parseInt(value ?? "", 10);
	if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
	return parsed;
}

function parseOrigins(value) {
	if (!value || typeof value !== "string") return [];
	return value
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const corsOrigins = parseOrigins(
	process.env.CORS_ORIGINS || "http://localhost:3000",
);

if (isProduction && corsOrigins.length === 0) {
	throw new Error("CORS_ORIGINS must be set in production.");
}

const env = Object.freeze({
	nodeEnv,
	isProduction,
	isDevelopment: nodeEnv === "development",
	port: parsePort(process.env.PORT, 4000),
	corsOrigins,
	corsAllowNoOrigin: parseBoolean(
		process.env.CORS_ALLOW_NO_ORIGIN,
		!isProduction,
	),
	jsonLimit: process.env.JSON_LIMIT || "100kb",
	trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
	exposeErrorDetails: parseBoolean(
		process.env.EXPOSE_ERROR_DETAILS,
		!isProduction,
	),
	hfToken: process.env.HF_TOKEN || "",
	hfModel: process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct",
	hfProvider: process.env.HF_PROVIDER || "together",
	jwtSecret: process.env.JWT_SECRET || "",
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
	otpExpiresMinutes: parsePositiveInteger(process.env.OTP_EXPIRES_MINUTES, 10),
	rateLimitWindowMs: parsePositiveInteger(
		process.env.RATE_LIMIT_WINDOW_MS,
		60_000,
	),
	rateLimitMax: parsePositiveInteger(process.env.RATE_LIMIT_MAX, 120),
	authRateLimitMax: parsePositiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 10),
	exposeOtpInResponse: parseBoolean(
		process.env.EXPOSE_OTP_IN_RESPONSE,
		!isProduction,
	),

	// --- Hardening additions ---
	//
	// Optional. If unset, the rate limiter falls back to in-memory which is
	// fine for single-instance dev/staging but will not enforce limits across
	// horizontally scaled instances.
	redisUrl: process.env.REDIS_URL || "",

	// Separate HMAC key for OTP hashes. If unset, derives from JWT_SECRET so
	// existing deployments do not require new env wiring on day one. Override
	// in production to allow rotating OTP secrets without invalidating JWTs.
	otpHmacSecret: process.env.OTP_HMAC_SECRET || process.env.JWT_SECRET || "",

	// Comma-separated hostnames (no scheme) accepted for client-supplied
	// submission file URLs. Empty list ⇒ reject all external URLs until R2 is
	// wired in. Add the R2 public bucket domain here once available.
	trustedUploadHosts: parseOrigins(process.env.TRUSTED_UPLOAD_HOSTS || ""),

	// Max upload size hint surfaced to the future presign endpoint. Bytes.
	maxUploadBytes: parsePositiveInteger(
		process.env.MAX_UPLOAD_BYTES,
		20 * 1024 * 1024, // 20 MB
	),

	// Audit logging — default on. Turn off only for diagnostic scenarios.
	auditLogEnabled: parseBoolean(process.env.AUDIT_LOG_ENABLED, true),
});

if (isProduction && !env.jwtSecret) {
	throw new Error("JWT_SECRET must be set in production.");
}

if (isProduction && !env.otpHmacSecret) {
	throw new Error("OTP_HMAC_SECRET (or JWT_SECRET) must be set in production.");
}

if (isProduction && !env.redisUrl) {
	// Not fatal — but rate limiting will not be effective without it.
	console.warn(
		"[env] REDIS_URL is not set in production; rate limits will not be enforced across instances.",
	);
}

export default env;
