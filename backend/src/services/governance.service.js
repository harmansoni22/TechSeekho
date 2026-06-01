import crypto from "node:crypto";

import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { hashPassword, normalizeEmail, normalizePhone } from "../utils/auth.js";
import { isSuperAdmin } from "./access.service.js";
import { audit } from "./audit.service.js";

/**
 * Super-admin governance surface (Phase 3).
 *
 * This module owns the *owner/governor* operations that sit above day-to-day
 * institution administration: institution lifecycle, the global cross-tenant
 * user directory, provisioning of new ADMINs, trainer lifecycle, and the two
 * irreversible termination workflows.
 *
 * Hard rules enforced here (not just by Zod):
 *   - No hard deletes. Lifecycle is expressed via status; historical rows
 *     (role assignments, batch assignments) are preserved.
 *   - No orphan institutions. Terminating an ADMIN who is the sole active admin
 *     of an institution requires a responsibility transfer to another user.
 *   - No orphan batches. Terminating a TRAINER who is the sole active trainer of
 *     a batch requires a reassignment to another active trainer.
 *   - Every mutation is audit-logged with the operator-supplied reason.
 */

function requireSuperAdmin(user) {
	if (!isSuperAdmin(user)) {
		throw new AppError("Super admin access required", 403);
	}
}

// Readable, high-entropy temporary password (mirrors onboarding.service.js).
// The provisioned admin is expected to reset on first login.
const PWD_ALPHABET =
	"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
function generateTempPassword(length = 12) {
	const bytes = crypto.randomBytes(length);
	let out = "";
	for (let i = 0; i < length; i += 1) {
		out += PWD_ALPHABET[bytes[i] % PWD_ALPHABET.length];
	}
	return `${out.slice(0, length - 2)}#${(bytes[0] % 10).toString()}`;
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

// ---------------------------------------------------------------------------
// 1. Institution lifecycle (ACTIVE / SUSPENDED / ARCHIVED)
// ---------------------------------------------------------------------------

export async function setInstitutionStatus(
	user,
	institutionId,
	status,
	reason,
	req,
) {
	requireSuperAdmin(user);

	const before = await prisma.institution.findUnique({
		where: { id: institutionId },
		select: { id: true, name: true, status: true, isActive: true },
	});
	if (!before) {
		throw new AppError("Institution not found", 404, "INSTITUTION_NOT_FOUND");
	}

	// ARCHIVED is the institution analogue of user termination: a terminal,
	// history-preserving state. It cannot be transitioned out of.
	if (before.status === "ARCHIVED") {
		throw new AppError(
			"This institution is archived and cannot change status",
			409,
			"INSTITUTION_ARCHIVED",
		);
	}

	if (before.status === status) {
		return { id: before.id, status: before.status, unchanged: true };
	}

	const isActive = status === "ACTIVE";

	const updated = await prisma.institution.update({
		where: { id: institutionId },
		data: {
			status,
			isActive, // keep legacy mirror in sync during the migration window
			statusReason: reason,
			statusChangedAt: new Date(),
			statusChangedById: user.id,
		},
		select: { id: true, name: true, status: true, isActive: true },
	});

	const action =
		status === "ACTIVE"
			? "institution.reactivate"
			: status === "ARCHIVED"
				? "institution.archive"
				: "institution.suspend";

	audit({
		actor: user,
		action,
		entityType: "Institution",
		entityId: institutionId,
		institutionId,
		reason,
		metadata: { previousStatus: before.status, nextStatus: updated.status },
		req,
	});

	return updated;
}

// ---------------------------------------------------------------------------
// 2. Global user directory (cross-institution, every role/status)
// ---------------------------------------------------------------------------

export async function listUsers(user, filters = {}) {
	requireSuperAdmin(user);

	const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
	const page = Math.max(Number(filters.page) || 1, 1);
	const skip = (page - 1) * limit;

	const q = (filters.q || "").trim();

	const roleAssignmentFilter = {};
	if (filters.role) roleAssignmentFilter.role = { name: filters.role };
	if (filters.institutionId)
		roleAssignmentFilter.institutionId = filters.institutionId;

	const where = {
		...(filters.status ? { status: filters.status } : {}),
		...(Object.keys(roleAssignmentFilter).length
			? { roleAssignments: { some: roleAssignmentFilter } }
			: {}),
		...(q
			? {
					OR: [
						{ fullName: { contains: q, mode: "insensitive" } },
						{ email: { contains: q, mode: "insensitive" } },
						{ phone: { contains: q, mode: "insensitive" } },
					],
				}
			: {}),
	};

	const [rows, total] = await prisma.$transaction([
		prisma.user.findMany({
			where,
			select: {
				id: true,
				fullName: true,
				email: true,
				phone: true,
				status: true,
				statusReason: true,
				statusChangedAt: true,
				lastLoginAt: true,
				createdAt: true,
				roleAssignments: {
					select: {
						id: true,
						role: { select: { name: true } },
						institution: { select: { id: true, name: true } },
					},
				},
				studentProfile: { select: { id: true } },
				trainerProfile: { select: { id: true } },
				adminProfile: { select: { id: true } },
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.user.count({ where }),
	]);

	return {
		users: rows.map((u) => ({
			id: u.id,
			fullName: u.fullName,
			email: u.email,
			phone: u.phone,
			status: u.status,
			statusReason: u.statusReason,
			statusChangedAt: u.statusChangedAt,
			lastLoginAt: u.lastLoginAt,
			createdAt: u.createdAt,
			profileTypes: [
				u.studentProfile ? "STUDENT" : null,
				u.trainerProfile ? "TRAINER" : null,
				u.adminProfile ? "ADMIN" : null,
			].filter(Boolean),
			roles: u.roleAssignments.map((ra) => ({
				assignmentId: ra.id,
				role: ra.role?.name,
				institutionId: ra.institution?.id ?? null,
				institutionName: ra.institution?.name ?? null,
			})),
		})),
		total,
		page,
		limit,
	};
}

// ---------------------------------------------------------------------------
// 3. Create Admin (super-admin provisions an institution ADMIN)
// ---------------------------------------------------------------------------

export async function createAdmin(user, payload, req) {
	requireSuperAdmin(user);

	const institution = await prisma.institution.findUnique({
		where: { id: payload.institutionId },
		select: { id: true, name: true, status: true },
	});
	if (!institution) {
		throw new AppError("Institution not found", 404, "INSTITUTION_NOT_FOUND");
	}
	if (institution.status === "ARCHIVED") {
		throw new AppError(
			"Cannot provision an admin for an archived institution",
			409,
			"INSTITUTION_ARCHIVED",
		);
	}

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
	const adminRoleId = await getRoleIdOrThrow("ADMIN");

	const created = await prisma.user.create({
		data: {
			fullName: payload.fullName.trim(),
			email,
			phone,
			passwordHash,
			isEmailVerified: false,
			isPhoneVerified: false,
			status: "ACTIVE",
			adminProfile: {
				create: { designation: payload.designation ?? null },
			},
			roleAssignments: {
				create: { roleId: adminRoleId, institutionId: institution.id },
			},
		},
		select: {
			id: true,
			fullName: true,
			email: true,
			phone: true,
			status: true,
			createdAt: true,
			adminProfile: { select: { id: true, designation: true } },
		},
	});

	audit({
		actor: user,
		action: "admin.create",
		entityType: "User",
		entityId: created.id,
		institutionId: institution.id,
		reason: payload.reason ?? null,
		metadata: {
			hasEmail: Boolean(email),
			hasPhone: Boolean(phone),
			designation: created.adminProfile?.designation ?? null,
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
			profileId: created.adminProfile?.id ?? null,
			designation: created.adminProfile?.designation ?? null,
			institutionId: institution.id,
			institutionName: institution.name,
		},
		credentials: {
			identifier: email || phone,
			temporaryPassword: tempPassword,
		},
	};
}

// ---------------------------------------------------------------------------
// 4. Trainer lifecycle — directory + reversible status
// ---------------------------------------------------------------------------

export async function listTrainers(user, filters = {}) {
	requireSuperAdmin(user);

	const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
	const page = Math.max(Number(filters.page) || 1, 1);
	const skip = (page - 1) * limit;

	const q = (filters.q || "").trim();

	const trainerRoleFilter = { role: { name: "TRAINER" } };
	if (filters.institutionId)
		trainerRoleFilter.institutionId = filters.institutionId;

	const where = {
		roleAssignments: { some: trainerRoleFilter },
		...(filters.status ? { status: filters.status } : {}),
		...(q
			? {
					OR: [
						{ fullName: { contains: q, mode: "insensitive" } },
						{ email: { contains: q, mode: "insensitive" } },
					],
				}
			: {}),
	};

	const [rows, total] = await prisma.$transaction([
		prisma.user.findMany({
			where,
			select: {
				id: true,
				fullName: true,
				email: true,
				phone: true,
				status: true,
				statusReason: true,
				lastLoginAt: true,
				createdAt: true,
				trainerProfile: {
					select: {
						id: true,
						specialization: true,
						experienceYears: true,
						_count: { select: { batches: true } },
						// Batch assignments power the termination-reassignment UI: the
						// client needs each batch id + institution to build the
						// reassignment plan and detect would-be-orphaned batches.
						batches: {
							select: {
								batch: {
									select: {
										id: true,
										name: true,
										institutionId: true,
										institution: { select: { id: true, name: true } },
									},
								},
							},
						},
					},
				},
				roleAssignments: {
					where: { role: { name: "TRAINER" } },
					select: { institution: { select: { id: true, name: true } } },
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.user.count({ where }),
	]);

	return {
		trainers: rows.map((u) => ({
			id: u.id,
			fullName: u.fullName,
			email: u.email,
			phone: u.phone,
			status: u.status,
			statusReason: u.statusReason,
			lastLoginAt: u.lastLoginAt,
			createdAt: u.createdAt,
			profileId: u.trainerProfile?.id ?? null,
			specialization: u.trainerProfile?.specialization ?? null,
			experienceYears: u.trainerProfile?.experienceYears ?? null,
			batchCount: u.trainerProfile?._count?.batches ?? 0,
			batches: (u.trainerProfile?.batches ?? [])
				.map((bt) => bt.batch)
				.filter(Boolean)
				.map((b) => ({
					id: b.id,
					name: b.name,
					institutionId: b.institutionId,
					institutionName: b.institution?.name ?? null,
				})),
			institutions: u.roleAssignments
				.map((ra) => ra.institution)
				.filter(Boolean)
				.map((i) => ({ id: i.id, name: i.name })),
		})),
		total,
		page,
		limit,
	};
}

export async function setTrainerStatus(
	user,
	targetUserId,
	status,
	reason,
	req,
) {
	requireSuperAdmin(user);

	if (targetUserId === user.id) {
		throw new AppError(
			"You cannot change your own status here",
			403,
			"SELF_STATUS_DENIED",
		);
	}

	const target = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: {
			id: true,
			status: true,
			trainerProfile: { select: { id: true } },
			roleAssignments: { select: { role: { select: { name: true } } } },
		},
	});
	if (!target) {
		throw new AppError("User not found", 404, "USER_NOT_FOUND");
	}

	const isTrainer = target.roleAssignments.some(
		(ra) => ra.role?.name === "TRAINER",
	);
	if (!isTrainer || !target.trainerProfile) {
		throw new AppError("User is not a trainer", 400, "NOT_A_TRAINER");
	}

	if (target.status === "TERMINATED") {
		throw new AppError(
			"This account is terminated and cannot change status",
			409,
			"ACCOUNT_TERMINATED",
		);
	}

	if (target.status === status) {
		return { id: target.id, status: target.status, unchanged: true };
	}

	const updated = await prisma.user.update({
		where: { id: targetUserId },
		data: {
			status,
			statusReason: reason,
			statusChangedAt: new Date(),
			statusChangedById: user.id,
		},
		select: { id: true, status: true, fullName: true },
	});

	audit({
		actor: user,
		action:
			status === "SUSPENDED"
				? "trainer.suspend"
				: status === "INACTIVE"
					? "trainer.deactivate"
					: "trainer.reactivate",
		entityType: "User",
		entityId: targetUserId,
		institutionId: null,
		reason,
		metadata: { previousStatus: target.status, nextStatus: updated.status },
		req,
	});

	return updated;
}

// ---------------------------------------------------------------------------
// 5. Admin termination with responsibility-transfer enforcement
//    (no orphan institutions)
// ---------------------------------------------------------------------------

export async function terminateAdmin(
	user,
	targetUserId,
	reason,
	transfers,
	req,
) {
	requireSuperAdmin(user);

	if (targetUserId === user.id) {
		throw new AppError(
			"You cannot terminate your own account",
			403,
			"SELF_TERMINATION_DENIED",
		);
	}

	const target = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: {
			id: true,
			status: true,
			fullName: true,
			roleAssignments: {
				select: {
					institutionId: true,
					role: { select: { name: true } },
				},
			},
		},
	});
	if (!target) {
		throw new AppError("User not found", 404, "USER_NOT_FOUND");
	}
	if (target.status === "TERMINATED") {
		throw new AppError(
			"This account is already terminated",
			409,
			"ACCOUNT_TERMINATED",
		);
	}

	const adminRoles = target.roleAssignments.filter(
		(ra) => ra.role?.name === "ADMIN" && ra.institutionId,
	);
	if (adminRoles.length === 0) {
		throw new AppError("User is not an institution admin", 400, "NOT_AN_ADMIN");
	}

	const adminInstitutionIds = Array.from(
		new Set(adminRoles.map((ra) => ra.institutionId)),
	);

	// Determine which institutions this admin solely governs. An institution is
	// orphan-risk if, excluding this user, it has no other ACTIVE admin.
	const orphanRiskInstitutionIds = [];
	for (const institutionId of adminInstitutionIds) {
		const otherActiveAdmins = await prisma.roleAssignment.count({
			where: {
				institutionId,
				role: { name: "ADMIN" },
				userId: { not: targetUserId },
				user: { status: "ACTIVE" },
			},
		});
		if (otherActiveAdmins === 0) {
			orphanRiskInstitutionIds.push(institutionId);
		}
	}

	// Validate the supplied transfers.
	const transferList = Array.isArray(transfers) ? transfers : [];
	const transferByInstitution = new Map();
	for (const t of transferList) {
		if (!adminInstitutionIds.includes(t.institutionId)) {
			throw new AppError(
				"Transfer targets an institution this admin does not govern",
				400,
				"TRANSFER_INSTITUTION_INVALID",
			);
		}
		if (transferByInstitution.has(t.institutionId)) {
			throw new AppError(
				"Duplicate transfer for the same institution",
				400,
				"TRANSFER_DUPLICATE",
			);
		}
		if (t.toUserId === targetUserId) {
			throw new AppError(
				"Cannot transfer responsibility to the admin being terminated",
				400,
				"TRANSFER_SELF",
			);
		}
		transferByInstitution.set(t.institutionId, t.toUserId);
	}

	// Every orphan-risk institution MUST have a transfer. No orphan institutions.
	const missing = orphanRiskInstitutionIds.filter(
		(id) => !transferByInstitution.has(id),
	);
	if (missing.length > 0) {
		throw new AppError(
			"Responsibility transfer required: this admin is the sole active admin of one or more institutions",
			409,
			"RESPONSIBILITY_TRANSFER_REQUIRED",
		);
	}

	// Validate every transfer target is a real, ACTIVE, non-terminated user.
	const targetUserIds = Array.from(
		new Set([...transferByInstitution.values()]),
	);
	const transferTargets = await prisma.user.findMany({
		where: { id: { in: targetUserIds } },
		select: { id: true, status: true },
	});
	const targetStatusById = new Map(
		transferTargets.map((u) => [u.id, u.status]),
	);
	for (const toUserId of targetUserIds) {
		const status = targetStatusById.get(toUserId);
		if (!status) {
			throw new AppError(
				"Transfer target user not found",
				404,
				"TRANSFER_TARGET_NOT_FOUND",
			);
		}
		if (status !== "ACTIVE") {
			throw new AppError(
				"Transfer target user is not active",
				400,
				"TRANSFER_TARGET_INACTIVE",
			);
		}
	}

	const adminRoleId = await getRoleIdOrThrow("ADMIN");

	// Apply transfers + termination atomically. Historical role assignments for
	// the terminated admin are preserved (no hard delete); the TERMINATED status
	// removes them from active governance.
	const appliedTransfers = [];
	await prisma.$transaction(async (tx) => {
		for (const [institutionId, toUserId] of transferByInstitution) {
			// Ensure the new admin has an AdminProfile.
			const profile = await tx.adminProfile.findUnique({
				where: { userId: toUserId },
				select: { id: true },
			});
			if (!profile) {
				await tx.adminProfile.create({ data: { userId: toUserId } });
			}

			// Ensure the ADMIN role assignment exists (NULL≠NULL safe: institutionId
			// is non-null here, but we still check-then-create for idempotency).
			const existing = await tx.roleAssignment.findFirst({
				where: { userId: toUserId, roleId: adminRoleId, institutionId },
				select: { id: true },
			});
			if (!existing) {
				await tx.roleAssignment.create({
					data: { userId: toUserId, roleId: adminRoleId, institutionId },
				});
			}
			appliedTransfers.push({ institutionId, toUserId });
		}

		await tx.user.update({
			where: { id: targetUserId },
			data: {
				status: "TERMINATED",
				statusReason: reason,
				statusChangedAt: new Date(),
				statusChangedById: user.id,
			},
		});
	});

	audit({
		actor: user,
		action: "admin.terminate",
		entityType: "User",
		entityId: targetUserId,
		institutionId: null,
		reason,
		metadata: {
			previousStatus: target.status,
			governedInstitutions: adminInstitutionIds,
			orphanRiskInstitutions: orphanRiskInstitutionIds,
			transfers: appliedTransfers,
		},
		req,
	});

	return {
		id: targetUserId,
		status: "TERMINATED",
		transfers: appliedTransfers,
	};
}

// ---------------------------------------------------------------------------
// 6. Trainer termination with batch-reassignment enforcement
//    (no orphan batches)
// ---------------------------------------------------------------------------

export async function terminateTrainer(
	user,
	targetUserId,
	reason,
	reassignments,
	req,
) {
	requireSuperAdmin(user);

	if (targetUserId === user.id) {
		throw new AppError(
			"You cannot terminate your own account",
			403,
			"SELF_TERMINATION_DENIED",
		);
	}

	const target = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: {
			id: true,
			status: true,
			fullName: true,
			trainerProfile: { select: { id: true } },
			roleAssignments: { select: { role: { select: { name: true } } } },
		},
	});
	if (!target) {
		throw new AppError("User not found", 404, "USER_NOT_FOUND");
	}
	if (!target.trainerProfile) {
		throw new AppError("User is not a trainer", 400, "NOT_A_TRAINER");
	}
	if (target.status === "TERMINATED") {
		throw new AppError(
			"This account is already terminated",
			409,
			"ACCOUNT_TERMINATED",
		);
	}

	const trainerProfileId = target.trainerProfile.id;

	// Batches this trainer is assigned to.
	const myAssignments = await prisma.batchTrainer.findMany({
		where: { trainerId: trainerProfileId },
		select: { batchId: true },
	});
	const myBatchIds = myAssignments.map((a) => a.batchId);

	// A batch is orphan-risk if, excluding this trainer, it has no other trainer
	// whose user is ACTIVE.
	const orphanRiskBatchIds = [];
	for (const batchId of myBatchIds) {
		const otherActiveTrainers = await prisma.batchTrainer.count({
			where: {
				batchId,
				trainerId: { not: trainerProfileId },
				trainer: { user: { status: "ACTIVE" } },
			},
		});
		if (otherActiveTrainers === 0) {
			orphanRiskBatchIds.push(batchId);
		}
	}

	// Validate the supplied reassignments. toTrainerId is a USER id; we resolve
	// it to that user's TrainerProfile.
	const reassignList = Array.isArray(reassignments) ? reassignments : [];
	const reassignByBatch = new Map();
	for (const r of reassignList) {
		if (!myBatchIds.includes(r.batchId)) {
			throw new AppError(
				"Reassignment targets a batch this trainer is not assigned to",
				400,
				"REASSIGNMENT_BATCH_INVALID",
			);
		}
		if (reassignByBatch.has(r.batchId)) {
			throw new AppError(
				"Duplicate reassignment for the same batch",
				400,
				"REASSIGNMENT_DUPLICATE",
			);
		}
		if (r.toTrainerId === targetUserId) {
			throw new AppError(
				"Cannot reassign batches to the trainer being terminated",
				400,
				"REASSIGNMENT_SELF",
			);
		}
		reassignByBatch.set(r.batchId, r.toTrainerId);
	}

	// Every orphan-risk batch MUST have a reassignment. No orphan batches.
	const missing = orphanRiskBatchIds.filter((id) => !reassignByBatch.has(id));
	if (missing.length > 0) {
		throw new AppError(
			"Batch reassignment required: this trainer is the sole active trainer of one or more batches",
			409,
			"BATCH_REASSIGNMENT_REQUIRED",
		);
	}

	// Resolve + validate every reassignment target (active trainer user).
	const targetTrainerUserIds = Array.from(
		new Set([...reassignByBatch.values()]),
	);
	const targetTrainers = await prisma.user.findMany({
		where: { id: { in: targetTrainerUserIds } },
		select: {
			id: true,
			status: true,
			trainerProfile: { select: { id: true } },
		},
	});
	const trainerByUserId = new Map(targetTrainers.map((u) => [u.id, u]));
	for (const toUserId of targetTrainerUserIds) {
		const tu = trainerByUserId.get(toUserId);
		if (!tu) {
			throw new AppError(
				"Reassignment target user not found",
				404,
				"REASSIGNMENT_TARGET_NOT_FOUND",
			);
		}
		if (!tu.trainerProfile) {
			throw new AppError(
				"Reassignment target is not a trainer",
				400,
				"REASSIGNMENT_TARGET_NOT_TRAINER",
			);
		}
		if (tu.status !== "ACTIVE") {
			throw new AppError(
				"Reassignment target trainer is not active",
				400,
				"REASSIGNMENT_TARGET_INACTIVE",
			);
		}
	}

	// Apply reassignments + termination atomically. The terminated trainer's
	// BatchTrainer rows are preserved (no hard delete); TERMINATED status removes
	// them from active duty.
	const appliedReassignments = [];
	await prisma.$transaction(async (tx) => {
		for (const [batchId, toUserId] of reassignByBatch) {
			const toProfileId = trainerByUserId.get(toUserId).trainerProfile.id;
			const existing = await tx.batchTrainer.findFirst({
				where: { batchId, trainerId: toProfileId },
				select: { id: true },
			});
			if (!existing) {
				await tx.batchTrainer.create({
					data: { batchId, trainerId: toProfileId },
				});
			}
			appliedReassignments.push({ batchId, toTrainerUserId: toUserId });
		}

		await tx.user.update({
			where: { id: targetUserId },
			data: {
				status: "TERMINATED",
				statusReason: reason,
				statusChangedAt: new Date(),
				statusChangedById: user.id,
			},
		});
	});

	audit({
		actor: user,
		action: "trainer.terminate",
		entityType: "User",
		entityId: targetUserId,
		institutionId: null,
		reason,
		metadata: {
			previousStatus: target.status,
			assignedBatches: myBatchIds,
			orphanRiskBatches: orphanRiskBatchIds,
			reassignments: appliedReassignments,
		},
		req,
	});

	return {
		id: targetUserId,
		status: "TERMINATED",
		reassignments: appliedReassignments,
	};
}
