import prisma from "../config/db.js";
import env from "../config/env.js";

/**
 * Foundational audit logger.
 *
 * Designed to be cheap and fire-and-forget. A failure to write an audit row
 * MUST NOT block the operation that triggered it — institutional staff
 * cannot lose the ability to mark attendance because the audit table is
 * locked. We log errors and move on.
 *
 * Callers should pass the *minimum* sanitized metadata required to make
 * the action reconstructable. Never persist raw request bodies, never
 * persist secrets, never persist full record contents — store ids and
 * before/after deltas only.
 */

const PRIMARY_ROLE_ORDER = [
	"SUPER_ADMIN",
	"ADMIN",
	"INSTITUTION_COORDINATOR",
	"TRAINER",
	"STUDENT",
];

function pickPrimaryRole(roles = []) {
	for (const r of PRIMARY_ROLE_ORDER) {
		if (roles.includes(r)) return r;
	}
	return roles[0] || null;
}

function clientIp(req) {
	if (!req) return null;
	const forwarded = req.headers?.["x-forwarded-for"];
	const ip = Array.isArray(forwarded)
		? forwarded[0]
		: forwarded?.split(",")[0]?.trim() ||
			req.ip ||
			req.socket?.remoteAddress;
	return ip || null;
}

function safeUserAgent(req) {
	const ua = req?.headers?.["user-agent"];
	if (!ua) return null;
	return String(ua).slice(0, 500);
}

/**
 * Record an audit event.
 *
 * @param {object} params
 * @param {object|null} params.actor       Authenticated user object (req.user) or null
 * @param {string} params.action           Dotted name, e.g. "attendance.mark"
 * @param {string} params.entityType       e.g. "Attendance", "Submission"
 * @param {string|null} [params.entityId]  Affected primary key
 * @param {string|null} [params.institutionId]
 * @param {object|null} [params.metadata]  Small sanitized snapshot
 * @param {object|null} [params.req]       Express request, used for IP/UA
 */
export async function audit({
	actor,
	action,
	entityType,
	entityId = null,
	institutionId = null,
	metadata = null,
	req = null,
}) {
	if (!env.auditLogEnabled) return;

	try {
		await prisma.auditLog.create({
			data: {
				actorId: actor?.id ?? null,
				actorRole: pickPrimaryRole(actor?.roles ?? []),
				action: String(action),
				entityType: String(entityType),
				entityId,
				institutionId,
				metadata: metadata ?? undefined,
				ipAddress: clientIp(req),
				userAgent: safeUserAgent(req),
			},
		});
	} catch (err) {
		// Never throw from the audit path. The audit log being unavailable
		// is itself worth alerting on, but the calling operation must
		// continue to succeed.
		console.error(
			`[audit] failed to record ${action} on ${entityType}:`,
			err.message,
		);
	}
}
