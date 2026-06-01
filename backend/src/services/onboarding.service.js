import crypto from "node:crypto";

import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { hashPassword, normalizeEmail, normalizePhone } from "../utils/auth.js";
import { isSuperAdmin } from "./access.service.js";
import { audit } from "./audit.service.js";

/**
 * Institution member onboarding — the ADMIN's identity-provisioning surface.
 *
 * Trainers must NOT provision student identities; that responsibility lives
 * here, behind ADMIN / SUPER_ADMIN role gates and institution scoping. Every
 * mutation is audit-logged. Generated credentials are returned to the caller
 * exactly once (we never store the plaintext) so the admin can hand them off.
 */

function getAssignedInstitutionIds(user) {
	return Array.from(
		new Set(
			(user.roleAssignments || []).map((a) => a.institutionId).filter(Boolean),
		),
	);
}

async function assertInstitutionAccess(user, institutionId) {
	if (isSuperAdmin(user)) return;
	if (!getAssignedInstitutionIds(user).includes(institutionId)) {
		throw new AppError("Institution access denied", 403);
	}
}

async function getInstitutionOrThrow(institutionId) {
	const institution = await prisma.institution.findUnique({
		where: { id: institutionId },
		select: { id: true, name: true },
	});
	if (!institution) {
		throw new AppError("Institution not found", 404, "INSTITUTION_NOT_FOUND");
	}
	return institution;
}

// Readable, high-entropy temporary password. Excludes ambiguous characters so
// it can be dictated over the phone. The admin is expected to require a reset
// on first login (handled by the existing OTP/login flow).
const PWD_ALPHABET =
	"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
function generateTempPassword(length = 12) {
	const bytes = crypto.randomBytes(length);
	let out = "";
	for (let i = 0; i < length; i += 1) {
		out += PWD_ALPHABET[bytes[i] % PWD_ALPHABET.length];
	}
	// Guarantee a symbol + digit so it satisfies common downstream policies.
	return `${out.slice(0, length - 2)}#${(bytes[0] % 10).toString()}`;
}

function institutionPrefix(name) {
	const letters = (name || "")
		.replace(/[^A-Za-z]/g, "")
		.slice(0, 3)
		.toUpperCase();
	return letters || "STU";
}

function generateEnrollmentNumber(institutionName) {
	const year = new Date().getFullYear();
	const suffix = crypto.randomInt(1000, 9999);
	return `${institutionPrefix(institutionName)}-${year}-${suffix}`;
}

async function getRoleIdOrThrow(name) {
	const role = await prisma.role.findUnique({
		where: { name },
		select: { id: true },
	});
	if (!role) {
		throw new AppError(`${name} role not found`, 500, "ROLE_NOT_FOUND");
	}
	return role.id;
}

/**
 * Create a single student account inside one institution.
 *
 * Identity (email/phone) is provisioned by the admin; the student receives a
 * generated temporary password and, optionally, an immediate batch placement.
 * Returns the created profile plus the one-time credentials.
 */
export async function createInstitutionStudent(user, payload, req) {
	const institutionId = payload.institutionId;
	await assertInstitutionAccess(user, institutionId);
	const institution = await getInstitutionOrThrow(institutionId);

	const email = normalizeEmail(payload.email);
	const phone = normalizePhone(payload.phone);
	if (!email && !phone) {
		throw new AppError(
			"An email or phone is required",
			400,
			"CONTACT_REQUIRED",
		);
	}

	if (email) {
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			throw new AppError(
				"A user with this email already exists",
				409,
				"EMAIL_TAKEN",
			);
		}
	}
	if (phone) {
		const existing = await prisma.user.findUnique({ where: { phone } });
		if (existing) {
			throw new AppError(
				"A user with this phone already exists",
				409,
				"PHONE_TAKEN",
			);
		}
	}

	// If a batch placement is requested, it must belong to this institution.
	let batchId = null;
	if (payload.batchId) {
		const batch = await prisma.batch.findUnique({
			where: { id: payload.batchId },
			select: { id: true, institutionId: true },
		});
		if (!batch || batch.institutionId !== institutionId) {
			throw new AppError(
				"Batch does not belong to this institution",
				400,
				"BATCH_INSTITUTION_MISMATCH",
			);
		}
		batchId = batch.id;
	}

	const tempPassword = generateTempPassword();
	const passwordHash = await hashPassword(tempPassword);
	const studentRoleId = await getRoleIdOrThrow("STUDENT");
	const enrollmentNumber =
		payload.enrollmentNumber?.trim() ||
		generateEnrollmentNumber(institution.name);

	const created = await prisma.user.create({
		data: {
			fullName: payload.fullName.trim(),
			email,
			phone,
			passwordHash,
			isEmailVerified: false,
			isPhoneVerified: false,
			status: "ACTIVE",
			studentProfile: {
				create: { enrollmentNumber, currentBatchId: batchId },
			},
			roleAssignments: { create: { roleId: studentRoleId, institutionId } },
		},
		select: {
			id: true,
			fullName: true,
			email: true,
			phone: true,
			status: true,
			createdAt: true,
			studentProfile: {
				select: { id: true, enrollmentNumber: true, currentBatchId: true },
			},
		},
	});

	audit({
		actor: user,
		action: "student.onboard",
		entityType: "User",
		entityId: created.id,
		institutionId,
		metadata: {
			enrollmentNumber,
			hasEmail: Boolean(email),
			hasPhone: Boolean(phone),
			assignedBatchId: batchId,
		},
		req,
	});

	return {
		user: {
			id: created.id,
			fullName: created.fullName,
			email: created.email,
			phone: created.phone,
			status: created.status,
			createdAt: created.createdAt,
			profileId: created.studentProfile?.id ?? null,
			enrollmentNumber: created.studentProfile?.enrollmentNumber ?? null,
			currentBatchId: created.studentProfile?.currentBatchId ?? null,
		},
		credentials: {
			identifier: email || phone,
			temporaryPassword: tempPassword,
		},
	};
}

/**
 * Bulk student onboarding. Each row is processed independently so one bad row
 * (duplicate email, missing contact) doesn't abort the whole import. Returns a
 * per-row result set with generated credentials for the successes.
 */
export async function bulkCreateInstitutionStudents(user, payload, req) {
	const institutionId = payload.institutionId;
	await assertInstitutionAccess(user, institutionId);

	const rows = Array.isArray(payload.students) ? payload.students : [];
	if (rows.length === 0) {
		throw new AppError("No student rows provided", 400, "NO_ROWS");
	}

	const results = [];
	let created = 0;

	for (let i = 0; i < rows.length; i += 1) {
		const row = rows[i];
		try {
			const result = await createInstitutionStudent(
				user,
				{
					institutionId,
					fullName: row.fullName,
					email: row.email,
					phone: row.phone,
					enrollmentNumber: row.enrollmentNumber,
					batchId: row.batchId || payload.batchId,
				},
				req,
			);
			created += 1;
			results.push({
				row: i + 1,
				ok: true,
				fullName: result.user.fullName,
				identifier: result.credentials.identifier,
				enrollmentNumber: result.user.enrollmentNumber,
				temporaryPassword: result.credentials.temporaryPassword,
			});
		} catch (err) {
			results.push({
				row: i + 1,
				ok: false,
				fullName: row.fullName || null,
				identifier: row.email || row.phone || null,
				error: err instanceof AppError ? err.message : "Failed to create",
			});
		}
	}

	audit({
		actor: user,
		action: "student.bulk_onboard",
		entityType: "User",
		entityId: null,
		institutionId,
		metadata: {
			attempted: rows.length,
			created,
			failed: rows.length - created,
		},
		req,
	});

	return {
		attempted: rows.length,
		created,
		failed: rows.length - created,
		results,
	};
}

/**
 * Create a single trainer account inside one institution. Batch assignment is a
 * separate step (existing `assignTrainerToBatch`) so a trainer can be onboarded
 * before their first batch exists.
 */
export async function createInstitutionTrainer(user, payload, req) {
	const institutionId = payload.institutionId;
	await assertInstitutionAccess(user, institutionId);
	await getInstitutionOrThrow(institutionId);

	const email = normalizeEmail(payload.email);
	const phone = normalizePhone(payload.phone);
	if (!email && !phone) {
		throw new AppError(
			"An email or phone is required",
			400,
			"CONTACT_REQUIRED",
		);
	}

	if (email) {
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			throw new AppError(
				"A user with this email already exists",
				409,
				"EMAIL_TAKEN",
			);
		}
	}
	if (phone) {
		const existing = await prisma.user.findUnique({ where: { phone } });
		if (existing) {
			throw new AppError(
				"A user with this phone already exists",
				409,
				"PHONE_TAKEN",
			);
		}
	}

	const tempPassword = generateTempPassword();
	const passwordHash = await hashPassword(tempPassword);
	const trainerRoleId = await getRoleIdOrThrow("TRAINER");

	const experienceYears =
		payload.experienceYears === undefined || payload.experienceYears === null
			? null
			: Number(payload.experienceYears);

	const createdUser = await prisma.user.create({
		data: {
			fullName: payload.fullName.trim(),
			email,
			phone,
			passwordHash,
			isEmailVerified: false,
			isPhoneVerified: false,
			status: "ACTIVE",
			trainerProfile: {
				create: {
					specialization: payload.specialization?.trim() || null,
					bio: payload.bio?.trim() || null,
					experienceYears: Number.isFinite(experienceYears)
						? experienceYears
						: null,
				},
			},
			roleAssignments: { create: { roleId: trainerRoleId, institutionId } },
		},
		select: {
			id: true,
			fullName: true,
			email: true,
			phone: true,
			status: true,
			createdAt: true,
			trainerProfile: {
				select: { id: true, specialization: true, experienceYears: true },
			},
		},
	});

	audit({
		actor: user,
		action: "trainer.onboard",
		entityType: "User",
		entityId: createdUser.id,
		institutionId,
		metadata: {
			hasEmail: Boolean(email),
			hasPhone: Boolean(phone),
			specialization: createdUser.trainerProfile?.specialization ?? null,
		},
		req,
	});

	return {
		user: {
			id: createdUser.id,
			fullName: createdUser.fullName,
			email: createdUser.email,
			phone: createdUser.phone,
			status: createdUser.status,
			createdAt: createdUser.createdAt,
			profileId: createdUser.trainerProfile?.id ?? null,
			specialization: createdUser.trainerProfile?.specialization ?? null,
			experienceYears: createdUser.trainerProfile?.experienceYears ?? null,
		},
		credentials: {
			identifier: email || phone,
			temporaryPassword: tempPassword,
		},
	};
}

/**
 * Institution roster with rich, page-ready fields. Scoped to one institution
 * the caller can access. `role` selects STUDENT or TRAINER; optional `q`
 * (name/email/enrollment), `status`, and `batchId` filters narrow the result.
 */
export async function listInstitutionPeople(user, institutionId, filters = {}) {
	await assertInstitutionAccess(user, institutionId);

	const role = String(filters.role || "").toUpperCase();
	if (!["STUDENT", "TRAINER"].includes(role)) {
		throw new AppError("role must be STUDENT or TRAINER", 400, "INVALID_ROLE");
	}

	const q = (filters.q || "").trim();
	const status = filters.status ? String(filters.status).toUpperCase() : null;

	const where = {
		roleAssignments: { some: { institutionId, role: { name: role } } },
		...(status ? { status } : {}),
		...(q
			? {
					OR: [
						{ fullName: { contains: q, mode: "insensitive" } },
						{ email: { contains: q, mode: "insensitive" } },
					],
				}
			: {}),
	};

	const users = await prisma.user.findMany({
		where,
		select: {
			id: true,
			fullName: true,
			email: true,
			phone: true,
			status: true,
			lastLoginAt: true,
			createdAt: true,
			studentProfile:
				role === "STUDENT"
					? {
							select: {
								id: true,
								enrollmentNumber: true,
								currentBatchId: true,
								currentBatch: {
									select: { id: true, name: true, institutionId: true },
								},
							},
						}
					: false,
			trainerProfile:
				role === "TRAINER"
					? {
							select: {
								id: true,
								specialization: true,
								experienceYears: true,
								_count: { select: { batches: true } },
							},
						}
					: false,
		},
		orderBy: { createdAt: "desc" },
		take: 500,
	});

	// A student's currentBatch may technically belong to another institution if
	// they were moved; only surface the batch when it matches this institution.
	const people = users
		.map((u) => {
			if (role === "STUDENT") {
				const sp = u.studentProfile;
				const inThisInstitution =
					sp?.currentBatch?.institutionId === institutionId;
				return {
					userId: u.id,
					fullName: u.fullName,
					email: u.email,
					phone: u.phone,
					status: u.status,
					lastLoginAt: u.lastLoginAt,
					createdAt: u.createdAt,
					profileId: sp?.id ?? null,
					enrollmentNumber: sp?.enrollmentNumber ?? null,
					currentBatchId: inThisInstitution ? sp.currentBatchId : null,
					currentBatchName: inThisInstitution ? sp.currentBatch.name : null,
				};
			}
			const tp = u.trainerProfile;
			return {
				userId: u.id,
				fullName: u.fullName,
				email: u.email,
				phone: u.phone,
				status: u.status,
				lastLoginAt: u.lastLoginAt,
				createdAt: u.createdAt,
				profileId: tp?.id ?? null,
				specialization: tp?.specialization ?? null,
				experienceYears: tp?.experienceYears ?? null,
				batchCount: tp?._count?.batches ?? 0,
			};
		})
		.filter((p) => {
			if (role !== "STUDENT" || !filters.batchId) return true;
			return p.currentBatchId === filters.batchId;
		});

	return { role, institutionId, people, total: people.length };
}

/**
 * Activate / deactivate / suspend a user who holds a role inside an institution
 * the caller manages. Institution-scoped sibling of the SUPER_ADMIN-only
 * `setUserStatus` in admin.service.js.
 */
export async function setInstitutionUserStatus(
	user,
	targetUserId,
	status,
	req,
) {
	if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
		throw new AppError("Invalid status", 400, "INVALID_STATUS");
	}
	if (targetUserId === user.id) {
		throw new AppError(
			"You cannot change your own status",
			403,
			"SELF_STATUS_DENIED",
		);
	}

	const target = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: {
			id: true,
			status: true,
			roleAssignments: {
				select: { institutionId: true, role: { select: { name: true } } },
			},
		},
	});
	if (!target) {
		throw new AppError("User not found", 404, "USER_NOT_FOUND");
	}

	// The caller may only touch users who share one of their institutions and
	// who are operational members (STUDENT / TRAINER) — never other admins.
	const targetInstitutionIds = target.roleAssignments
		.map((a) => a.institutionId)
		.filter(Boolean);
	const targetRoles = target.roleAssignments.map((a) => a.role?.name);

	if (!isSuperAdmin(user)) {
		const shared = getAssignedInstitutionIds(user).some((id) =>
			targetInstitutionIds.includes(id),
		);
		if (!shared) {
			throw new AppError("User is outside your institutions", 403);
		}
		const isOperationalMember = targetRoles.some(
			(r) => r === "STUDENT" || r === "TRAINER",
		);
		const isElevated = targetRoles.some(
			(r) =>
				r === "ADMIN" || r === "SUPER_ADMIN" || r === "INSTITUTION_COORDINATOR",
		);
		if (!isOperationalMember || isElevated) {
			throw new AppError(
				"You can only change the status of students and trainers",
				403,
				"NOT_OPERATIONAL_MEMBER",
			);
		}
	}

	if (target.status === status) {
		return { id: target.id, status: target.status, unchanged: true };
	}

	const updated = await prisma.user.update({
		where: { id: targetUserId },
		data: { status },
		select: { id: true, status: true, fullName: true },
	});

	audit({
		actor: user,
		action:
			status === "SUSPENDED"
				? "member.suspend"
				: status === "INACTIVE"
					? "member.deactivate"
					: "member.reactivate",
		entityType: "User",
		entityId: targetUserId,
		institutionId: targetInstitutionIds[0] ?? null,
		metadata: { previousStatus: target.status, nextStatus: updated.status },
		req,
	});

	return updated;
}
