import env from "../config/env.js";
import { AppError } from "./appError.js";

/**
 * Validate a client-supplied file URL.
 *
 * Until the presigned R2 upload pipeline lands, this is the only barrier
 * between student-submitted URLs and the rest of the system. Accept only:
 *
 *   1. http(s) URLs whose host is on the trusted allowlist (env.trustedUploadHosts).
 *
 * Reject everything else — including data:, javascript:, file:, ftp:,
 * userinfo-bearing URLs (https://attacker.com@trusted/) and absurdly long
 * strings.
 *
 * On success returns the normalized URL string. On failure throws AppError.
 */
const MAX_URL_LENGTH = 2_048;

export function validateFileUrl(rawUrl) {
	if (rawUrl == null || rawUrl === "") return null;

	if (typeof rawUrl !== "string") {
		throw new AppError("fileUrl must be a string", 400, "INVALID_FILE_URL");
	}

	if (rawUrl.length > MAX_URL_LENGTH) {
		throw new AppError("fileUrl is too long", 400, "INVALID_FILE_URL");
	}

	let parsed;
	try {
		parsed = new URL(rawUrl);
	} catch {
		throw new AppError("fileUrl is not a valid URL", 400, "INVALID_FILE_URL");
	}

	// Scheme: https only. http is allowed only when the host is on the
	// allowlist AND we're in non-production (useful for local R2 emulators).
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
		throw new AppError(
			"fileUrl must use http or https",
			400,
			"INVALID_FILE_URL",
		);
	}
	if (parsed.protocol === "http:" && env.isProduction) {
		throw new AppError(
			"fileUrl must use https in production",
			400,
			"INVALID_FILE_URL",
		);
	}

	// userinfo-bearing URLs are a classic phishing/SSRF vector.
	if (parsed.username || parsed.password) {
		throw new AppError(
			"fileUrl must not contain credentials",
			400,
			"INVALID_FILE_URL",
		);
	}

	const host = parsed.hostname.toLowerCase();
	const allowed = env.trustedUploadHosts.map((h) => h.toLowerCase());

	if (allowed.length === 0) {
		throw new AppError(
			"File uploads are not configured. Set TRUSTED_UPLOAD_HOSTS or use the presign endpoint.",
			400,
			"UPLOADS_DISABLED",
		);
	}

	// Exact host match. We intentionally do NOT support wildcard subdomains
	// here — operator intent must be explicit per host.
	if (!allowed.includes(host)) {
		throw new AppError(
			"fileUrl host is not on the trusted upload allowlist",
			400,
			"UNTRUSTED_FILE_HOST",
		);
	}

	return parsed.toString();
}
