import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { isSuperAdmin } from "./access.service.js";

/**
 * Institution-scoped ADMIN aggregations.
 *
 * These are the operational read surfaces for the campus admin dashboard. They
 * are deliberately separate from `admin.service.js` (which is SUPER_ADMIN /
 * platform-governance territory). Everything here is bounded by the
 * institutions the calling admin is assigned to via `RoleAssignment` — there is
 * no cross-institution leakage.
 *
 * SUPER_ADMIN is allowed to call these endpoints for observability and, when
 * no `institutionId` filter is supplied, sees every institution.
 */

function startOfTodayUTC() {
	const d = new Date();
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

function startOfDaysAgo(n) {
	const d = startOfTodayUTC();
	d.setUTCDate(d.getUTCDate() - n);
	return d;
}

function endOfDaysAhead(n) {
	const d = startOfTodayUTC();
	d.setUTCDate(d.getUTCDate() + n + 1);
	return d;
}

function getAssignedInstitutionIds(user) {
	return Array.from(
		new Set(
			(user.roleAssignments || []).map((a) => a.institutionId).filter(Boolean),
		),
	);
}

/**
 * Resolve the institution scope for an admin request.
 *
 * - SUPER_ADMIN with no filter → all institutions.
 * - SUPER_ADMIN with a filter → that institution (must exist).
 * - ADMIN → intersection of their assigned institutions and the optional
 *   filter. Requesting an institution they don't manage is a 403.
 */
async function resolveInstitutionScope(user, institutionIdFilter) {
	if (isSuperAdmin(user)) {
		if (institutionIdFilter) {
			const exists = await prisma.institution.findUnique({
				where: { id: institutionIdFilter },
				select: { id: true },
			});
			if (!exists) {
				throw new AppError(
					"Institution not found",
					404,
					"INSTITUTION_NOT_FOUND",
				);
			}
			return [institutionIdFilter];
		}
		const all = await prisma.institution.findMany({ select: { id: true } });
		return all.map((i) => i.id);
	}

	const assigned = getAssignedInstitutionIds(user);
	if (assigned.length === 0) {
		return [];
	}
	if (institutionIdFilter) {
		if (!assigned.includes(institutionIdFilter)) {
			throw new AppError("Institution access denied", 403);
		}
		return [institutionIdFilter];
	}
	return assigned;
}

function summarizeAttendance(rows) {
	const totals = rows.reduce(
		(acc, row) => {
			acc[row.status] = row._count._all;
			acc.total += row._count._all;
			return acc;
		},
		{ PRESENT: 0, ABSENT: 0, LATE: 0, total: 0 },
	);
	const ratePercent =
		totals.total > 0
			? Math.round(((totals.PRESENT + totals.LATE) / totals.total) * 100)
			: null;
	return { ...totals, ratePercent };
}

const EMPTY_OVERVIEW = (generatedAt) => ({
	generatedAt,
	scope: { institutionIds: [], institutions: [] },
	kpis: [
		{ label: "Active batches", value: 0, hint: "of 0" },
		{ label: "Students", value: 0, hint: "0 unassigned" },
		{ label: "Trainers", value: 0, hint: "0 unassigned" },
		{ label: "Attendance (30d)", value: "—", hint: "0 records" },
	],
	counts: {
		institutions: 0,
		activeInstitutions: 0,
		batches: 0,
		activeBatches: 0,
		students: 0,
		trainers: 0,
	},
	onboarding: { studentsLast30d: 0, trainersLast30d: 0, batchesLast30d: 0 },
	attendance30d: {
		PRESENT: 0,
		ABSENT: 0,
		LATE: 0,
		total: 0,
		ratePercent: null,
	},
	assignments: { total: 0, submittedLast30d: 0, pendingReview: 0 },
	pendingActions: [],
	alerts: [],
	recentAnnouncements: [],
	recentSubmissions: [],
});

/**
 * Single first-paint payload for the admin overview dashboard. Replaces the
 * handful of round-trips a rich operational landing page would otherwise need.
 */
export async function getAdminOverview(user, filters = {}) {
	const generatedAt = new Date().toISOString();
	const institutionIds = await resolveInstitutionScope(
		user,
		filters.institutionId,
	);

	if (institutionIds.length === 0) {
		return EMPTY_OVERVIEW(generatedAt);
	}

	const since30d = startOfDaysAgo(30);
	const next7d = endOfDaysAhead(7);

	const [
		institutions,
		activeInstitutionCount,
		batchCount,
		activeBatchCount,
		studentCount,
		unassignedStudentCount,
		trainerCount,
		batchesLast30d,
		studentsLast30d,
		trainersLast30d,
		attendanceWindow,
		assignmentCount,
		submittedLast30d,
		pendingReview,
		emptyBatches,
		recentAnnouncements,
		recentSubmissions,
		lowAttendanceBatches,
	] = await Promise.all([
		prisma.institution.findMany({
			where: { id: { in: institutionIds } },
			select: { id: true, name: true, type: true, isActive: true },
			orderBy: { name: "asc" },
		}),
		prisma.institution.count({
			where: { id: { in: institutionIds }, isActive: true },
		}),
		prisma.batch.count({ where: { institutionId: { in: institutionIds } } }),
		prisma.batch.count({
			where: { institutionId: { in: institutionIds }, isActive: true },
		}),
		prisma.studentProfile.count({
			where: { currentBatch: { institutionId: { in: institutionIds } } },
		}),
		// Students who hold a role in one of these institutions but are not yet
		// in any batch — the onboarding backlog.
		prisma.studentProfile.count({
			where: {
				currentBatchId: null,
				user: {
					roleAssignments: {
						some: {
							institutionId: { in: institutionIds },
							role: { name: "STUDENT" },
						},
					},
				},
			},
		}),
		prisma.trainerProfile.count({
			where: {
				user: {
					roleAssignments: {
						some: {
							institutionId: { in: institutionIds },
							role: { name: "TRAINER" },
						},
					},
				},
			},
		}),
		prisma.batch.count({
			where: {
				institutionId: { in: institutionIds },
				createdAt: { gte: since30d },
			},
		}),
		prisma.roleAssignment.count({
			where: {
				institutionId: { in: institutionIds },
				role: { name: "STUDENT" },
				assignedAt: { gte: since30d },
			},
		}),
		prisma.roleAssignment.count({
			where: {
				institutionId: { in: institutionIds },
				role: { name: "TRAINER" },
				assignedAt: { gte: since30d },
			},
		}),
		prisma.attendance.groupBy({
			by: ["status"],
			where: {
				date: { gte: since30d },
				batch: { institutionId: { in: institutionIds } },
			},
			_count: { _all: true },
		}),
		prisma.assignment.count({
			where: { institutionId: { in: institutionIds } },
		}),
		prisma.submission.count({
			where: {
				institutionId: { in: institutionIds },
				submittedAt: { gte: since30d },
			},
		}),
		prisma.submission.count({
			where: { institutionId: { in: institutionIds }, status: "SUBMITTED" },
		}),
		prisma.batch.findMany({
			where: {
				institutionId: { in: institutionIds },
				isActive: true,
				students: { none: {} },
			},
			select: { id: true, name: true },
			take: 5,
		}),
		prisma.announcement.findMany({
			where: { institutionId: { in: institutionIds } },
			orderBy: { createdAt: "desc" },
			take: 5,
			select: {
				id: true,
				title: true,
				createdAt: true,
				batch: { select: { id: true, name: true } },
				author: { select: { id: true, fullName: true } },
			},
		}),
		prisma.submission.findMany({
			where: { institutionId: { in: institutionIds } },
			orderBy: { createdAt: "desc" },
			take: 8,
			select: {
				id: true,
				status: true,
				submittedAt: true,
				createdAt: true,
				assignment: { select: { id: true, title: true } },
				student: {
					select: { id: true, user: { select: { fullName: true } } },
				},
			},
		}),
		// Active batches with attendance recorded in the window: flag any whose
		// presence rate dips below 75%.
		prisma.attendance.groupBy({
			by: ["batchId", "status"],
			where: {
				date: { gte: since30d },
				batch: { institutionId: { in: institutionIds } },
			},
			_count: { _all: true },
		}),
	]);

	const attendance30d = summarizeAttendance(attendanceWindow);

	// Roll the per-batch attendance group-by into a presence rate per batch.
	const perBatch = new Map();
	for (const row of lowAttendanceBatches) {
		const entry = perBatch.get(row.batchId) || {
			present: 0,
			late: 0,
			absent: 0,
			total: 0,
		};
		if (row.status === "PRESENT") entry.present += row._count._all;
		else if (row.status === "LATE") entry.late += row._count._all;
		else entry.absent += row._count._all;
		entry.total += row._count._all;
		perBatch.set(row.batchId, entry);
	}
	const lowBatchIds = [];
	for (const [batchId, e] of perBatch.entries()) {
		if (e.total >= 10) {
			const rate = Math.round(((e.present + e.late) / e.total) * 100);
			if (rate < 75) lowBatchIds.push({ batchId, rate });
		}
	}
	const lowBatchNames = lowBatchIds.length
		? await prisma.batch.findMany({
				where: { id: { in: lowBatchIds.map((b) => b.batchId) } },
				select: { id: true, name: true },
			})
		: [];
	const lowBatchNameMap = new Map(lowBatchNames.map((b) => [b.id, b.name]));

	// Pending operational actions — the admin's to-do list, highest leverage first.
	const pendingActions = [];
	if (unassignedStudentCount > 0) {
		pendingActions.push({
			kind: "UNASSIGNED_STUDENTS",
			label: `${unassignedStudentCount} student${unassignedStudentCount === 1 ? "" : "s"} not in a batch`,
			count: unassignedStudentCount,
			href: "/dashboard/admin/students",
		});
	}
	if (pendingReview > 0) {
		pendingActions.push({
			kind: "PENDING_REVIEWS",
			label: `${pendingReview} submission${pendingReview === 1 ? "" : "s"} awaiting trainer review`,
			count: pendingReview,
			href: "/dashboard/admin/assignments",
		});
	}
	for (const b of emptyBatches) {
		pendingActions.push({
			kind: "EMPTY_BATCH",
			label: `Batch "${b.name}" has no students`,
			count: 1,
			href: "/dashboard/admin/batches",
		});
	}

	// Health alerts — surfaced separately from the actionable queue.
	const alerts = [];
	for (const b of lowBatchIds) {
		alerts.push({
			severity: "warning",
			kind: "LOW_ATTENDANCE",
			label: `${lowBatchNameMap.get(b.batchId) || "A batch"} attendance is ${b.rate}% (30d)`,
			href: "/dashboard/admin/attendance",
		});
	}
	if (activeInstitutionCount < institutions.length) {
		alerts.push({
			severity: "info",
			kind: "INACTIVE_INSTITUTION",
			label: `${institutions.length - activeInstitutionCount} institution(s) marked inactive`,
			href: "/dashboard/admin/institutions",
		});
	}

	return {
		generatedAt,
		scope: {
			institutionIds,
			institutions,
		},
		kpis: [
			{
				label: "Active batches",
				value: activeBatchCount,
				hint: `of ${batchCount}`,
			},
			{
				label: "Students",
				value: studentCount,
				hint: `${unassignedStudentCount} unassigned`,
			},
			{
				label: "Trainers",
				value: trainerCount,
				hint: `${batchCount} batches`,
			},
			{
				label: "Attendance (30d)",
				value:
					attendance30d.ratePercent === null
						? "—"
						: `${attendance30d.ratePercent}%`,
				hint: `${attendance30d.total} records`,
			},
		],
		counts: {
			institutions: institutions.length,
			activeInstitutions: activeInstitutionCount,
			batches: batchCount,
			activeBatches: activeBatchCount,
			students: studentCount,
			trainers: trainerCount,
		},
		onboarding: {
			studentsLast30d,
			trainersLast30d,
			batchesLast30d,
		},
		attendance30d,
		assignments: {
			total: assignmentCount,
			submittedLast30d,
			pendingReview,
		},
		pendingActions,
		alerts,
		recentAnnouncements: recentAnnouncements.map((a) => ({
			id: a.id,
			title: a.title,
			createdAt: a.createdAt,
			batchName: a.batch?.name ?? null,
			authorName: a.author?.fullName ?? null,
		})),
		recentSubmissions: recentSubmissions.map((s) => ({
			id: s.id,
			status: s.status,
			submittedAt: s.submittedAt,
			createdAt: s.createdAt,
			assignmentTitle: s.assignment?.title ?? null,
			studentName: s.student?.user?.fullName ?? null,
		})),
		// next-7-day deadline window reserved for the page; cheap to omit for now.
		_windows: { next7d: next7d.toISOString() },
	};
}

// ---------------------------------------------------------------------------
// Analytics — time-series + per-batch performance, institution-scoped.
// ---------------------------------------------------------------------------

function rangeDays(range) {
	if (range === "7d") return 7;
	if (range === "90d") return 90;
	return 30;
}

function emptyDailyBuckets(days) {
	const out = [];
	for (let i = days - 1; i >= 0; i -= 1) {
		const d = startOfDaysAgo(i);
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

export async function getAdminAnalytics(user, filters = {}) {
	const generatedAt = new Date().toISOString();
	const institutionIds = await resolveInstitutionScope(
		user,
		filters.institutionId,
	);

	const days = rangeDays(filters.range);

	if (institutionIds.length === 0) {
		return {
			generatedAt,
			range: filters.range || "30d",
			days,
			scope: { institutionIds: [] },
			series: {
				submissions: emptyDailyBuckets(days),
				attendance: emptyDailyBuckets(days),
				newStudents: emptyDailyBuckets(days),
			},
			totals: {
				submissions: 0,
				attendance: 0,
				newStudents: 0,
				assignments: 0,
			},
			rates: { submissionCompletion: null, attendancePresence: null },
			batchPerformance: [],
			trainerActivity: [],
		};
	}

	const since = startOfDaysAgo(days - 1);

	const [
		submissions,
		attendance,
		newStudents,
		assignmentsCreated,
		batches,
		trainerLinks,
	] = await Promise.all([
		prisma.submission.findMany({
			where: {
				institutionId: { in: institutionIds },
				createdAt: { gte: since },
			},
			select: { id: true, createdAt: true, status: true },
		}),
		prisma.attendance.findMany({
			where: {
				date: { gte: since },
				batch: { institutionId: { in: institutionIds } },
			},
			select: { id: true, date: true, status: true },
		}),
		prisma.roleAssignment.findMany({
			where: {
				institutionId: { in: institutionIds },
				role: { name: "STUDENT" },
				assignedAt: { gte: since },
			},
			select: { id: true, assignedAt: true },
		}),
		prisma.assignment.count({
			where: {
				institutionId: { in: institutionIds },
				createdAt: { gte: since },
			},
		}),
		prisma.batch.findMany({
			where: { institutionId: { in: institutionIds } },
			select: {
				id: true,
				name: true,
				isActive: true,
				institution: { select: { name: true } },
				_count: { select: { students: true, assignments: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 60,
		}),
		prisma.batchTrainer.findMany({
			where: { batch: { institutionId: { in: institutionIds } } },
			select: {
				trainer: {
					select: {
						id: true,
						user: { select: { fullName: true } },
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

	// Per-batch attendance presence over the window for the performance table.
	const batchIds = batches.map((b) => b.id);
	const attendanceByBatch = batchIds.length
		? await prisma.attendance.groupBy({
				by: ["batchId", "status"],
				where: { date: { gte: since }, batchId: { in: batchIds } },
				_count: { _all: true },
			})
		: [];
	const batchAtt = new Map();
	for (const row of attendanceByBatch) {
		const e = batchAtt.get(row.batchId) || { present: 0, total: 0 };
		if (row.status !== "ABSENT") e.present += row._count._all;
		e.total += row._count._all;
		batchAtt.set(row.batchId, e);
	}

	const trainerCounts = new Map();
	for (const link of trainerLinks) {
		const id = link.trainer?.id;
		if (!id) continue;
		const e = trainerCounts.get(id) || {
			name: link.trainer.user?.fullName ?? "Trainer",
			batches: 0,
		};
		e.batches += 1;
		trainerCounts.set(id, e);
	}

	return {
		generatedAt,
		range: filters.range || "30d",
		days,
		scope: { institutionIds },
		series: {
			submissions: bucketByDay(submissions, "createdAt", days),
			attendance: bucketByDay(attendance, "date", days),
			newStudents: bucketByDay(newStudents, "assignedAt", days),
		},
		totals: {
			submissions: submissions.length,
			attendance: attendance.length,
			newStudents: newStudents.length,
			assignments: assignmentsCreated,
		},
		rates: {
			submissionCompletion: submissionRate,
			attendancePresence: attendanceRate,
		},
		batchPerformance: batches.map((b) => {
			const e = batchAtt.get(b.id);
			const rate =
				e && e.total > 0 ? Math.round((e.present / e.total) * 100) : null;
			return {
				id: b.id,
				name: b.name,
				institutionName: b.institution?.name ?? null,
				isActive: b.isActive,
				students: b._count.students,
				assignments: b._count.assignments,
				attendanceRate: rate,
			};
		}),
		trainerActivity: Array.from(trainerCounts.values())
			.sort((a, b) => b.batches - a.batches)
			.slice(0, 10),
	};
}
