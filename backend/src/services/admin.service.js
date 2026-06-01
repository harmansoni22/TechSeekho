import prisma from "../config/db.js";
import env from "../config/env.js";
import { AppError } from "../utils/appError.js";
import { isSuperAdmin } from "./access.service.js";
import { audit } from "./audit.service.js";

function requireSuperAdmin(user) {
	if (!isSuperAdmin(user)) {
		throw new AppError("Super admin access required", 403);
	}
}

function thirtyDaysAgo() {
	const d = new Date();
	d.setDate(d.getDate() - 30);
	return d;
}

function daysAgo(n) {
	const d = new Date();
	d.setDate(d.getDate() - n);
	d.setHours(0, 0, 0, 0);
	return d;
}

function startOfDayUTC(d) {
	const x = new Date(d);
	x.setUTCHours(0, 0, 0, 0);
	return x;
}

const ELEVATED_ROLES = new Set([
	"SUPER_ADMIN",
	"ADMIN",
	"INSTITUTION_COORDINATOR",
]);

export async function getPlatformOverview(user) {
	requireSuperAdmin(user);

	const since = thirtyDaysAgo();

	const [
		institutionCount,
		activeInstitutionCount,
		userCount,
		activeUserCount,
		studentCount,
		trainerCount,
		batchCount,
		activeBatchCount,
		assignmentCount,
		submissionsLast30d,
		submissionsPendingReview,
		assessmentCount,
		attendanceLast30d,
		roleCounts,
		recentInstitutions,
		recentBatches,
		recentSubmissions,
	] = await Promise.all([
		prisma.institution.count(),
		prisma.institution.count({ where: { isActive: true } }),
		prisma.user.count(),
		prisma.user.count({ where: { status: "ACTIVE" } }),
		prisma.studentProfile.count(),
		prisma.trainerProfile.count(),
		prisma.batch.count(),
		prisma.batch.count({ where: { isActive: true } }),
		prisma.assignment.count(),
		prisma.submission.count({ where: { submittedAt: { gte: since } } }),
		prisma.submission.count({ where: { status: "PENDING" } }),
		prisma.assessment.count(),
		prisma.attendance.groupBy({
			by: ["status"],
			where: { date: { gte: since } },
			_count: { _all: true },
		}),
		prisma.roleAssignment.groupBy({
			by: ["roleId"],
			_count: { _all: true },
		}),
		prisma.institution.findMany({
			orderBy: { createdAt: "desc" },
			take: 5,
			select: {
				id: true,
				name: true,
				type: true,
				city: true,
				state: true,
				isActive: true,
				createdAt: true,
				_count: { select: { batches: true, roleAssignments: true } },
			},
		}),
		prisma.batch.findMany({
			orderBy: { createdAt: "desc" },
			take: 5,
			select: {
				id: true,
				name: true,
				isActive: true,
				startDate: true,
				institution: { select: { id: true, name: true } },
				course: { select: { id: true, title: true } },
				_count: { select: { students: true, trainers: true } },
			},
		}),
		prisma.submission.findMany({
			orderBy: { createdAt: "desc" },
			take: 8,
			select: {
				id: true,
				status: true,
				submittedAt: true,
				createdAt: true,
				assignment: { select: { id: true, title: true } },
				student: {
					select: {
						id: true,
						user: { select: { fullName: true } },
					},
				},
				institution: { select: { id: true, name: true } },
			},
		}),
	]);

	const roles = await prisma.role.findMany({
		select: { id: true, name: true },
	});
	const roleIdToName = new Map(roles.map((r) => [r.id, r.name]));
	const countsByRole = roleCounts.reduce((acc, row) => {
		const name = roleIdToName.get(row.roleId) || "UNKNOWN";
		acc[name] = (acc[name] || 0) + row._count._all;
		return acc;
	}, {});

	const attendanceTotals = attendanceLast30d.reduce(
		(acc, row) => {
			acc[row.status] = row._count._all;
			acc.total += row._count._all;
			return acc;
		},
		{ PRESENT: 0, ABSENT: 0, LATE: 0, total: 0 },
	);

	const attendanceRate30d =
		attendanceTotals.total > 0
			? Math.round(
					((attendanceTotals.PRESENT + attendanceTotals.LATE) /
						attendanceTotals.total) *
						100,
				)
			: null;

	return {
		generatedAt: new Date().toISOString(),

		kpis: [
			{
				label: "Institutions",
				value: institutionCount,
				hint: `${activeInstitutionCount} active`,
			},
			{ label: "Users", value: userCount, hint: `${activeUserCount} active` },
			{
				label: "Batches",
				value: batchCount,
				hint: `${activeBatchCount} active`,
			},
			{
				label: "Attendance (30d)",
				value: attendanceRate30d === null ? "—" : `${attendanceRate30d}%`,
				hint: `${attendanceTotals.total} records`,
			},
		],

		entities: {
			institutions: { total: institutionCount, active: activeInstitutionCount },
			users: { total: userCount, active: activeUserCount },
			students: studentCount,
			trainers: trainerCount,
			batches: { total: batchCount, active: activeBatchCount },
			assignments: {
				total: assignmentCount,
				submittedLast30d: submissionsLast30d,
				pendingReview: submissionsPendingReview,
			},
			assessments: { total: assessmentCount },
		},

		countsByRole,

		attendance30d: {
			...attendanceTotals,
			ratePercent: attendanceRate30d,
		},

		recent: {
			institutions: recentInstitutions.map((i) => ({
				id: i.id,
				name: i.name,
				type: i.type,
				city: i.city,
				state: i.state,
				isActive: i.isActive,
				createdAt: i.createdAt,
				batchCount: i._count.batches,
				memberCount: i._count.roleAssignments,
			})),
			batches: recentBatches.map((b) => ({
				id: b.id,
				name: b.name,
				isActive: b.isActive,
				startDate: b.startDate,
				institutionName: b.institution?.name || null,
				courseTitle: b.course?.title || null,
				studentCount: b._count.students,
				trainerCount: b._count.trainers,
			})),
			submissions: recentSubmissions.map((s) => ({
				id: s.id,
				status: s.status,
				submittedAt: s.submittedAt,
				createdAt: s.createdAt,
				assignmentTitle: s.assignment?.title || null,
				studentName: s.student?.user?.fullName || null,
				institutionName: s.institution?.name || null,
			})),
		},
	};
}

// ---------------------------------------------------------------------------
// Institution detail (aggregated view of one institution)
// ---------------------------------------------------------------------------

export async function getInstitutionDetail(user, institutionId) {
	requireSuperAdmin(user);

	const since = thirtyDaysAgo();

	const institution = await prisma.institution.findUnique({
		where: { id: institutionId },
		select: {
			id: true,
			name: true,
			type: true,
			city: true,
			state: true,
			address: true,
			contactEmail: true,
			contactPhone: true,
			isActive: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!institution) {
		throw new AppError("Institution not found", 404, "INSTITUTION_NOT_FOUND");
	}

	const [
		batches,
		roleAssignments,
		assignmentTotals,
		submissionsSubmitted30d,
		submissionsPendingReview,
		attendanceWindow,
		recentAnnouncements,
	] = await Promise.all([
		prisma.batch.findMany({
			where: { institutionId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				isActive: true,
				startDate: true,
				endDate: true,
				course: { select: { id: true, title: true } },
				_count: { select: { students: true, trainers: true } },
			},
		}),
		prisma.roleAssignment.findMany({
			where: { institutionId },
			select: {
				id: true,
				assignedAt: true,
				role: { select: { name: true } },
				user: {
					select: { id: true, fullName: true, email: true, status: true },
				},
			},
			orderBy: { assignedAt: "desc" },
			take: 50,
		}),
		prisma.assignment.count({ where: { institutionId } }),
		prisma.submission.count({
			where: { institutionId, submittedAt: { gte: since } },
		}),
		prisma.submission.count({
			where: { institutionId, status: "PENDING" },
		}),
		prisma.attendance.groupBy({
			by: ["status"],
			where: { date: { gte: since }, batch: { institutionId } },
			_count: { _all: true },
		}),
		prisma.announcement.findMany({
			where: { institutionId },
			orderBy: { createdAt: "desc" },
			take: 5,
			select: {
				id: true,
				title: true,
				createdAt: true,
				author: { select: { id: true, fullName: true } },
				batch: { select: { id: true, name: true } },
			},
		}),
	]);

	const attendanceTotals = attendanceWindow.reduce(
		(acc, row) => {
			acc[row.status] = row._count._all;
			acc.total += row._count._all;
			return acc;
		},
		{ PRESENT: 0, ABSENT: 0, LATE: 0, total: 0 },
	);

	const attendanceRate =
		attendanceTotals.total > 0
			? Math.round(
					((attendanceTotals.PRESENT + attendanceTotals.LATE) /
						attendanceTotals.total) *
						100,
				)
			: null;

	const peopleByRole = roleAssignments.reduce((acc, row) => {
		const name = row.role?.name || "UNKNOWN";
		acc[name] = (acc[name] || 0) + 1;
		return acc;
	}, {});

	const activeBatches = batches.filter((b) => b.isActive).length;
	const totalStudents = batches.reduce((acc, b) => acc + b._count.students, 0);
	const totalTrainers = batches.reduce((acc, b) => acc + b._count.trainers, 0);

	return {
		institution,
		summary: {
			batches: { total: batches.length, active: activeBatches },
			students: totalStudents,
			trainers: totalTrainers,
			assignments: {
				total: assignmentTotals,
				submittedLast30d: submissionsSubmitted30d,
				pendingReview: submissionsPendingReview,
			},
			attendance30d: { ...attendanceTotals, ratePercent: attendanceRate },
			peopleByRole,
		},
		batches: batches.map((b) => ({
			id: b.id,
			name: b.name,
			isActive: b.isActive,
			startDate: b.startDate,
			endDate: b.endDate,
			courseTitle: b.course?.title || null,
			studentCount: b._count.students,
			trainerCount: b._count.trainers,
		})),
		members: roleAssignments.map((ra) => ({
			assignmentId: ra.id,
			role: ra.role?.name,
			assignedAt: ra.assignedAt,
			userId: ra.user?.id,
			fullName: ra.user?.fullName,
			email: ra.user?.email,
			status: ra.user?.status,
		})),
		recentAnnouncements: recentAnnouncements.map((a) => ({
			id: a.id,
			title: a.title,
			createdAt: a.createdAt,
			authorName: a.author?.fullName || null,
			batchName: a.batch?.name || null,
		})),
	};
}

// ---------------------------------------------------------------------------
// Admins listing — users with elevated role assignments
// ---------------------------------------------------------------------------

export async function listAdmins(user, filters = {}) {
	requireSuperAdmin(user);

	const role =
		filters.role && ELEVATED_ROLES.has(filters.role) ? filters.role : null;

	// Default scope: every elevated role (super admin, admin, coordinator).
	const roleWhere = role
		? { name: role }
		: { name: { in: Array.from(ELEVATED_ROLES) } };

	const q = (filters.q || "").trim();

	const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 200);
	const page = Math.max(Number(filters.page) || 1, 1);
	const skip = (page - 1) * limit;

	const where = {
		roleAssignments: { some: { role: roleWhere } },
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
				lastLoginAt: true,
				createdAt: true,
				roleAssignments: {
					where: { role: roleWhere },
					select: {
						id: true,
						assignedAt: true,
						role: { select: { name: true } },
						institution: { select: { id: true, name: true } },
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.user.count({ where }),
	]);

	return {
		admins: rows.map((u) => ({
			id: u.id,
			fullName: u.fullName,
			email: u.email,
			phone: u.phone,
			status: u.status,
			lastLoginAt: u.lastLoginAt,
			createdAt: u.createdAt,
			assignments: u.roleAssignments.map((ra) => ({
				assignmentId: ra.id,
				role: ra.role?.name,
				institutionId: ra.institution?.id ?? null,
				institutionName: ra.institution?.name ?? null,
				assignedAt: ra.assignedAt,
			})),
		})),
		total,
		page,
		limit,
	};
}

// ---------------------------------------------------------------------------
// Role catalog
// ---------------------------------------------------------------------------

export async function listRoles(user) {
	requireSuperAdmin(user);

	return prisma.role.findMany({
		orderBy: { name: "asc" },
		select: { id: true, name: true, description: true },
	});
}

// ---------------------------------------------------------------------------
// Role assignment grant / revoke
// ---------------------------------------------------------------------------

export async function grantRoleAssignment(user, payload, req) {
	requireSuperAdmin(user);

	const { userId, role, institutionId } = payload;

	if (role !== "SUPER_ADMIN" && !institutionId) {
		throw new AppError(
			"institutionId is required for non-SUPER_ADMIN roles",
			400,
			"INSTITUTION_REQUIRED",
		);
	}

	const [targetUser, roleRow] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, status: true, fullName: true, email: true },
		}),
		prisma.role.findUnique({
			where: { name: role },
			select: { id: true, name: true },
		}),
	]);

	if (!targetUser) {
		throw new AppError("User not found", 404, "USER_NOT_FOUND");
	}
	if (!roleRow) {
		throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
	}

	let institution = null;
	if (institutionId) {
		institution = await prisma.institution.findUnique({
			where: { id: institutionId },
			select: { id: true, name: true, isActive: true },
		});
		if (!institution) {
			throw new AppError("Institution not found", 404, "INSTITUTION_NOT_FOUND");
		}
	}

	// NULL ≠ NULL in Postgres unique constraint — check by hand for SUPER_ADMIN.
	const existing = await prisma.roleAssignment.findFirst({
		where: {
			userId,
			roleId: roleRow.id,
			institutionId: institution?.id ?? null,
		},
		select: { id: true },
	});

	if (existing) {
		throw new AppError(
			"Role already assigned to this user for this scope",
			409,
			"ROLE_ALREADY_ASSIGNED",
		);
	}

	const created = await prisma.roleAssignment.create({
		data: {
			userId,
			roleId: roleRow.id,
			institutionId: institution?.id ?? null,
		},
		select: {
			id: true,
			assignedAt: true,
			role: { select: { name: true } },
			institution: { select: { id: true, name: true } },
		},
	});

	audit({
		actor: user,
		action: "role.grant",
		entityType: "RoleAssignment",
		entityId: created.id,
		institutionId: institution?.id ?? null,
		metadata: {
			targetUserId: userId,
			role: roleRow.name,
		},
		req,
	});

	return {
		assignmentId: created.id,
		userId,
		role: created.role?.name,
		institutionId: created.institution?.id ?? null,
		institutionName: created.institution?.name ?? null,
		assignedAt: created.assignedAt,
	};
}

export async function revokeRoleAssignment(user, assignmentId, req) {
	requireSuperAdmin(user);

	const existing = await prisma.roleAssignment.findUnique({
		where: { id: assignmentId },
		select: {
			id: true,
			userId: true,
			institutionId: true,
			role: { select: { name: true } },
		},
	});

	if (!existing) {
		throw new AppError(
			"Role assignment not found",
			404,
			"ROLE_ASSIGNMENT_NOT_FOUND",
		);
	}

	// Safety net: forbid revoking the very last SUPER_ADMIN — otherwise the
	// platform becomes ungoverned.
	if (existing.role?.name === "SUPER_ADMIN") {
		const superAdminCount = await prisma.roleAssignment.count({
			where: { role: { name: "SUPER_ADMIN" } },
		});
		if (superAdminCount <= 1) {
			throw new AppError(
				"Cannot revoke the last remaining SUPER_ADMIN",
				409,
				"LAST_SUPER_ADMIN",
			);
		}
	}

	// Self-revoke for SUPER_ADMIN — disallowed (defensive UX guardrail).
	if (existing.userId === user.id && existing.role?.name === "SUPER_ADMIN") {
		throw new AppError(
			"You cannot revoke your own SUPER_ADMIN role",
			403,
			"SELF_REVOKE_DENIED",
		);
	}

	await prisma.roleAssignment.delete({ where: { id: assignmentId } });

	audit({
		actor: user,
		action: "role.revoke",
		entityType: "RoleAssignment",
		entityId: assignmentId,
		institutionId: existing.institutionId,
		metadata: {
			targetUserId: existing.userId,
			role: existing.role?.name,
		},
		req,
	});

	return { revoked: true };
}

// ---------------------------------------------------------------------------
// User status change (suspend / reactivate / deactivate)
// ---------------------------------------------------------------------------

export async function setUserStatus(user, targetUserId, status, reason, req) {
	requireSuperAdmin(user);

	if (!["ACTIVE", "INACTIVE", "SUSPENDED", "TERMINATED"].includes(status)) {
		throw new AppError("Invalid status", 400, "INVALID_STATUS");
	}

	// TERMINATED is a permanent, irreversible lifecycle state. It must run
	// through the dedicated termination workflow (Phase 3) which first verifies
	// that responsibilities (batches, pending reviews, institution ownership)
	// have been transferred. It is deliberately not reachable from this
	// reversible-status endpoint.
	if (status === "TERMINATED") {
		throw new AppError(
			"Termination must go through the termination workflow with responsibility transfer",
			409,
			"USE_TERMINATION_WORKFLOW",
		);
	}

	if (targetUserId === user.id && status !== "ACTIVE") {
		throw new AppError(
			"You cannot suspend or deactivate your own account",
			403,
			"SELF_STATUS_DENIED",
		);
	}

	const before = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: { id: true, status: true },
	});
	if (!before) {
		throw new AppError("User not found", 404, "USER_NOT_FOUND");
	}

	// A terminated account is permanently disabled; no reversible status change
	// may resurrect or re-flag it from here.
	if (before.status === "TERMINATED") {
		throw new AppError(
			"This account is terminated and cannot change status",
			409,
			"ACCOUNT_TERMINATED",
		);
	}

	if (before.status === status) {
		return { id: before.id, status: before.status, unchanged: true };
	}

	const updated = await prisma.user.update({
		where: { id: targetUserId },
		data: {
			status,
			statusReason: reason ?? null,
			statusChangedAt: new Date(),
			statusChangedById: user.id,
		},
		select: { id: true, status: true, fullName: true },
	});

	audit({
		actor: user,
		action:
			status === "SUSPENDED"
				? "user.suspend"
				: status === "INACTIVE"
					? "user.deactivate"
					: "user.reactivate",
		entityType: "User",
		entityId: targetUserId,
		institutionId: null,
		reason: reason ?? null,
		metadata: { previousStatus: before.status, nextStatus: updated.status },
		req,
	});

	return updated;
}

// ---------------------------------------------------------------------------
// Audit log query
// ---------------------------------------------------------------------------

export async function listAuditLogs(user, filters = {}) {
	requireSuperAdmin(user);

	const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);

	const where = {};
	if (filters.actorId) where.actorId = filters.actorId;
	if (filters.institutionId) where.institutionId = filters.institutionId;
	if (filters.entityType) where.entityType = filters.entityType;
	if (filters.action) {
		// Allow either exact match or prefix-style with trailing wildcard.
		where.action = filters.action.endsWith("*")
			? { startsWith: filters.action.slice(0, -1) }
			: filters.action;
	}
	if (filters.from || filters.to) {
		where.createdAt = {};
		if (filters.from) where.createdAt.gte = new Date(filters.from);
		if (filters.to) where.createdAt.lte = new Date(filters.to);
	}

	const events = await prisma.auditLog.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: limit + 1,
		...(filters.cursor ? { skip: 1, cursor: { id: filters.cursor } } : {}),
		select: {
			id: true,
			actorId: true,
			actorRole: true,
			action: true,
			entityType: true,
			entityId: true,
			institutionId: true,
			metadata: true,
			ipAddress: true,
			userAgent: true,
			createdAt: true,
		},
	});

	const hasMore = events.length > limit;
	const slice = hasMore ? events.slice(0, limit) : events;

	// Decorate with actor email/name in one fan-out to avoid N+1.
	const actorIds = Array.from(
		new Set(slice.map((e) => e.actorId).filter(Boolean)),
	);
	const institutionIds = Array.from(
		new Set(slice.map((e) => e.institutionId).filter(Boolean)),
	);

	const [actors, institutions] = await Promise.all([
		actorIds.length
			? prisma.user.findMany({
					where: { id: { in: actorIds } },
					select: { id: true, fullName: true, email: true },
				})
			: Promise.resolve([]),
		institutionIds.length
			? prisma.institution.findMany({
					where: { id: { in: institutionIds } },
					select: { id: true, name: true },
				})
			: Promise.resolve([]),
	]);

	const actorMap = new Map(actors.map((a) => [a.id, a]));
	const instMap = new Map(institutions.map((i) => [i.id, i]));

	return {
		events: slice.map((e) => {
			const actor = actorMap.get(e.actorId);
			const institution = instMap.get(e.institutionId);
			return {
				id: e.id,
				createdAt: e.createdAt,
				action: e.action,
				entityType: e.entityType,
				entityId: e.entityId,
				actorId: e.actorId,
				actorRole: e.actorRole,
				actorName: actor?.fullName ?? null,
				actorEmail: actor?.email ?? null,
				institutionId: e.institutionId,
				institutionName: institution?.name ?? null,
				metadata: e.metadata ?? null,
				ipAddress: e.ipAddress,
				userAgent: e.userAgent,
			};
		}),
		nextCursor: hasMore ? slice[slice.length - 1].id : null,
		limit,
	};
}

// ---------------------------------------------------------------------------
// Platform analytics — time-series rollups (created-at based)
// ---------------------------------------------------------------------------

function rangeDays(range) {
	if (range === "7d") return 7;
	if (range === "90d") return 90;
	return 30;
}

function emptyDailyBuckets(days) {
	const out = [];
	for (let i = days - 1; i >= 0; i -= 1) {
		const d = startOfDayUTC(daysAgo(i));
		out.push({ date: d.toISOString().slice(0, 10), count: 0 });
	}
	return out;
}

function bucketByDay(rows, dateField, days) {
	const buckets = emptyDailyBuckets(days);
	const index = new Map(buckets.map((b, i) => [b.date, i]));
	for (const row of rows) {
		const v = row[dateField];
		if (!v) continue;
		const key = new Date(v).toISOString().slice(0, 10);
		const i = index.get(key);
		if (i != null) buckets[i].count += 1;
	}
	return buckets;
}

export async function getPlatformAnalytics(user, filters = {}) {
	requireSuperAdmin(user);

	const days = rangeDays(filters.range);
	const since = daysAgo(days - 1);

	const [
		newUsers,
		newInstitutions,
		newBatches,
		submissions,
		attendance,
		assignmentsCreated,
		assessmentsByStatus,
		topInstitutions,
	] = await Promise.all([
		prisma.user.findMany({
			where: { createdAt: { gte: since } },
			select: { id: true, createdAt: true },
		}),
		prisma.institution.findMany({
			where: { createdAt: { gte: since } },
			select: { id: true, createdAt: true },
		}),
		prisma.batch.findMany({
			where: { createdAt: { gte: since } },
			select: { id: true, createdAt: true },
		}),
		prisma.submission.findMany({
			where: { createdAt: { gte: since } },
			select: { id: true, createdAt: true, status: true },
		}),
		prisma.attendance.findMany({
			where: { date: { gte: since } },
			select: { id: true, date: true, status: true },
		}),
		prisma.assignment.findMany({
			where: { createdAt: { gte: since } },
			select: { id: true, createdAt: true },
		}),
		prisma.assessment.groupBy({
			by: ["status"],
			_count: { _all: true },
		}),
		prisma.institution.findMany({
			orderBy: { createdAt: "desc" },
			take: 100,
			select: {
				id: true,
				name: true,
				_count: {
					select: {
						batches: true,
						roleAssignments: true,
					},
				},
			},
		}),
	]);

	const submissionRate = submissions.length
		? Math.round(
				(submissions.filter((s) => s.status !== "PENDING").length /
					submissions.length) *
					100,
			)
		: null;

	const attendanceRate = attendance.length
		? Math.round(
				(attendance.filter((a) => a.status !== "ABSENT").length /
					attendance.length) *
					100,
			)
		: null;

	return {
		generatedAt: new Date().toISOString(),
		range: filters.range || "30d",
		days,
		series: {
			newUsers: bucketByDay(newUsers, "createdAt", days),
			newInstitutions: bucketByDay(newInstitutions, "createdAt", days),
			newBatches: bucketByDay(newBatches, "createdAt", days),
			submissions: bucketByDay(submissions, "createdAt", days),
			assignmentsCreated: bucketByDay(assignmentsCreated, "createdAt", days),
			attendance: bucketByDay(attendance, "date", days),
		},
		totals: {
			newUsers: newUsers.length,
			newInstitutions: newInstitutions.length,
			newBatches: newBatches.length,
			submissions: submissions.length,
			assignmentsCreated: assignmentsCreated.length,
			attendance: attendance.length,
		},
		rates: {
			submissionCompletion: submissionRate,
			attendancePresence: attendanceRate,
		},
		assessmentsByStatus: assessmentsByStatus.reduce((acc, r) => {
			acc[r.status] = r._count._all;
			return acc;
		}, {}),
		topInstitutions: topInstitutions
			.map((i) => ({
				id: i.id,
				name: i.name,
				batchCount: i._count.batches,
				memberCount: i._count.roleAssignments,
			}))
			.sort(
				(a, b) => b.batchCount + b.memberCount - (a.batchCount + a.memberCount),
			)
			.slice(0, 8),
	};
}

// ---------------------------------------------------------------------------
// Platform configuration — read-only snapshot of operational env settings.
//
// Persistent platform config (a PlatformSetting table + two-person rule)
// is a separate future migration. Until then this endpoint exposes the
// operational dials that already exist as env vars so the dashboard can
// stop showing static placeholders.
// ---------------------------------------------------------------------------

export async function getPlatformConfig(user) {
	requireSuperAdmin(user);

	return {
		generatedAt: new Date().toISOString(),
		persistence: "env",
		readOnly: true,
		groups: [
			{
				key: "limits",
				title: "Rate & quota",
				items: [
					{
						name: "Global rate limit",
						value: `${env.rateLimitMax} / ${Math.round(env.rateLimitWindowMs / 1000)}s`,
						hint: "per user/IP",
					},
					{
						name: "Auth endpoint rate limit",
						value: `${env.authRateLimitMax} / min`,
						hint: "/auth/*",
					},
					{
						name: "Max upload size",
						value: `${Math.round(env.maxUploadBytes / (1024 * 1024))} MB`,
					},
					{
						name: "JSON body limit",
						value: env.jsonLimit,
					},
					{
						name: "JWT lifetime",
						value: env.jwtExpiresIn,
					},
					{
						name: "OTP lifetime",
						value: `${env.otpExpiresMinutes} min`,
					},
				],
			},
			{
				key: "flags",
				title: "Operational flags",
				items: [
					{
						name: "Audit logging",
						value: env.auditLogEnabled ? "Enabled" : "Disabled",
						state: env.auditLogEnabled ? "on" : "off",
					},
					{
						name: "Distributed rate limiting (Redis)",
						value: env.redisUrl ? "Enabled" : "In-memory fallback",
						state: env.redisUrl ? "on" : "off",
					},
					{
						name: "Expose OTP in response",
						value: env.exposeOtpInResponse ? "Yes (dev)" : "No",
						state: env.exposeOtpInResponse ? "warn" : "on",
					},
					{
						name: "Trust proxy",
						value: env.trustProxy ? "Yes" : "No",
						state: env.trustProxy ? "on" : "off",
					},
					{
						name: "Expose error details",
						value: env.exposeErrorDetails ? "Yes (dev)" : "No",
						state: env.exposeErrorDetails ? "warn" : "on",
					},
				],
			},
			{
				key: "ai",
				title: "AI assistant",
				items: [
					{
						name: "Model",
						value: env.hfModel,
					},
					{
						name: "Provider",
						value: env.hfProvider,
					},
					{
						name: "Token configured",
						value: env.hfToken ? "Yes" : "No",
						state: env.hfToken ? "on" : "off",
					},
				],
			},
			{
				key: "uploads",
				title: "Uploads & SSRF",
				items: [
					{
						name: "Trusted upload hosts",
						value:
							env.trustedUploadHosts.length > 0
								? env.trustedUploadHosts.join(", ")
								: "(none — uploads disabled)",
						state: env.trustedUploadHosts.length > 0 ? "on" : "off",
					},
				],
			},
			{
				key: "environment",
				title: "Environment",
				items: [
					{ name: "Node env", value: env.nodeEnv },
					{
						name: "CORS origins",
						value: env.corsOrigins.length
							? env.corsOrigins.join(", ")
							: "(none configured)",
					},
				],
			},
		],
	};
}
