import crypto from "node:crypto";
import env from "../config/env.js";
import { AppError } from "../utils/appError.js";

/**
 * Upload presign scaffold.
 *
 * This endpoint is the *only* sanctioned way for clients to obtain a URL
 * they can later POST as `fileUrl` on a submission. It validates the
 * intent (kind, mime type, size) and returns a deterministic object key
 * that the future R2 client will sign.
 *
 * For now (no R2 SDK wired in yet) we return:
 *   - the object key the client should use
 *   - a stable upload URL placeholder pointing at the configured R2 host
 *
 * Once the R2 SDK is wired up the placeholder becomes a real PUT presign;
 * the client contract does not change. See utils/fileUrl.js for the
 * matching enforcement on the submission side.
 */

const ALLOWED_MIME = {
	SUBMISSION: new Set([
		"application/pdf",
		"application/zip",
		"application/x-zip-compressed",
		"text/plain",
		"text/markdown",
		"image/png",
		"image/jpeg",
		"image/webp",
	]),
	AVATAR: new Set(["image/png", "image/jpeg", "image/webp"]),
};

const MAX_FILENAME_LENGTH = 255;
const SAFE_FILENAME = /^[A-Za-z0-9._-]+$/;

export async function presignUploadController(req, res) {
	const { kind, filename, contentType, sizeBytes } = req.body;

	const allowed = ALLOWED_MIME[kind];
	if (!allowed) {
		throw new AppError("Unsupported upload kind", 400, "UNSUPPORTED_KIND");
	}
	if (!allowed.has(String(contentType).toLowerCase())) {
		throw new AppError(
			`contentType ${contentType} is not permitted for ${kind}`,
			400,
			"UNSUPPORTED_CONTENT_TYPE",
		);
	}

	if (filename.length > MAX_FILENAME_LENGTH || !SAFE_FILENAME.test(filename)) {
		throw new AppError(
			"filename must be ≤255 chars and contain only letters, digits, '.', '_', '-'",
			400,
			"INVALID_FILENAME",
		);
	}

	if (sizeBytes > env.maxUploadBytes) {
		throw new AppError(
			`file exceeds maximum allowed size of ${env.maxUploadBytes} bytes`,
			413,
			"UPLOAD_TOO_LARGE",
		);
	}

	// Deterministic key: tenant + actor + kind + nonce + safe filename. The
	// nonce prevents accidental overwrites of two files with the same name.
	const institutionId =
		(req.user?.roleAssignments || [])
			.map((a) => a.institutionId)
			.find(Boolean) || "global";

	const nonce = crypto.randomBytes(8).toString("hex");
	const key = `${kind.toLowerCase()}/${institutionId}/${req.user.id}/${Date.now()}-${nonce}-${filename}`;

	// Placeholder URL — replaced by the R2 presign once the SDK is integrated.
	const primaryHost = env.trustedUploadHosts[0] || "";
	const uploadUrl = primaryHost ? `https://${primaryHost}/${key}` : null;

	return res.status(200).json({
		data: {
			key,
			uploadUrl,
			method: "PUT",
			expiresInSeconds: 300,
			maxBytes: env.maxUploadBytes,
			// The fileUrl the client should submit after a successful upload.
			fileUrl: uploadUrl,
			pipelineReady: Boolean(primaryHost),
		},
	});
}
