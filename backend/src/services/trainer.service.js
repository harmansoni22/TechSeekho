import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { getTrainerProfileOrThrow, isPrivileged } from "./access.service.js";

/**
 * Trainer-scoped aggregations.
 *
 * Every read here is bounded by the trainer's `BatchTrainer` assignments — no
 * institution-wide visibility, no cross-batch leakage. SUPER_ADMIN is allowed
 * to call these endpoints for observability but receives a global view scoped
 * by the same logic the trainer would see; the route layer is the role gate.
 *
 * The single endpoint backing this service (`GET /trainer/overview`) replaces
 * the 4+ round-trips an operationally rich trainer dashboard would otherwise
 * issue on first paint.
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

async function resolveTrainerBatchIds(user) {
	// SUPER_ADMIN observability: no trainer profile to scope to — fall back
	// to "all batches in the system" so the page still works for them.
	if (isPrivileged(user) && !user.roles.includes("TRAINER")) {
		const allBatches = await prisma.batch.findMany({
			select: { id: true },
		});
		return { trainerId: null, batchIds: allBatches.map((b) => b.id) };
	}

	const trainer = await getTrainerProfileOrThrow(user.id);
	const links = await prisma.batchTrainer.findMany({
		where: { trainerId: trainer.id },
		select: { batchId: true },
	});

	return {
		trainerId: trainer.id,
		batchIds: links.map((l) => l.batchId),
	};
}

export async function getTrainerOverview(user) {
	if (!user.roles.includes("TRAINER") && !user.roles.includes("SUPER_ADMIN")) {
		throw new AppError("Trainer access required", 403, "TRAINER_REQUIRED");
	}

	const { trainerId, batchIds } = await resolveTrainerBatchIds(user);

	if (batchIds.length === 0) {
		return {
			generatedAt: new Date().toISOString(),
			trainerId,
			batches: [],
			counts: {
				batches: 0,
				students: 0,
				activeBatches: 0,
				institutions: 0,
			},
			workload: {
				assignments: 0,
				submissionsPendingReview: 0,
				submittedLast7d: 0,
			},
			attendance30d: {
				PRESENT: 0,
				ABSENT: 0,
				LATE: 0,
				total: 0,
				ratePercent: null,
			},
			upcomingDeadlines: [],
			recentSubmissions: [],
			recentAnnouncements: [],
		};
	}

	const last7d = startOfDaysAgo(7);
	const last30d = startOfDaysAgo(30);
	const next14d = endOfDaysAhead(14);

	const [
		batchRows,
		assignmentTotal,
		submissionsPending,
		submissionsSubmitted7d,
		attendanceWindow,
		upcomingAssignments,
		recentSubmissions,
		recentAnnouncements,
	] = await Promise.all([
		prisma.batch.findMany({
			where: { id: { in: batchIds } },
			select: {
				id: true,
				name: true,
				isActive: true,
				startDate: true,
				endDate: true,
				institution: { select: { id: true, name: true } },
				course: { select: { id: true, title: true } },
				_count: { select: { students: true } },
			},
			orderBy: { startDate: "desc" },
		}),
		prisma.assignment.count({ where: { batchId: { in: batchIds } } }),
		prisma.submission.count({
			where: {
				status: "SUBMITTED",
				assignment: { batchId: { in: batchIds } },
			},
		}),
		prisma.submission.count({
			where: {
				submittedAt: { gte: last7d },
				assignment: { batchId: { in: batchIds } },
			},
		}),
		prisma.attendance.groupBy({
			by: ["status"],
			where: {
				date: { gte: last30d },
				batchId: { in: batchIds },
			},
			_count: { _all: true },
		}),
		prisma.assignment.findMany({
			where: {
				batchId: { in: batchIds },
				dueDate: { gte: new Date(), lte: next14d },
			},
			select: {
				id: true,
				title: true,
				dueDate: true,
				batch: { select: { id: true, name: true } },
				_count: { select: { submissions: true } },
			},
			orderBy: { dueDate: "asc" },
			take: 6,
		}),
		prisma.submission.findMany({
			where: {
				assignment: { batchId: { in: batchIds } },
			},
			select: {
				id: true,
				status: true,
				submittedAt: true,
				createdAt: true,
				score: true,
				maxScore: true,
				assignment: {
					select: {
						id: true,
						title: true,
						batch: { select: { id: true, name: true } },
					},
				},
				student: {
					select: {
						id: true,
						user: { select: { fullName: true } },
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: 8,
		}),
		prisma.announcement.findMany({
			where: { batchId: { in: batchIds } },
			select: {
				id: true,
				title: true,
				createdAt: true,
				batch: { select: { id: true, name: true } },
				author: { select: { id: true, fullName: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 5,
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

	const totalStudents = batchRows.reduce(
		(sum, b) => sum + (b._count?.students ?? 0),
		0,
	);
	const activeBatches = batchRows.filter((b) => b.isActive).length;
	const institutions = new Set(
		batchRows.map((b) => b.institution?.id).filter(Boolean),
	).size;

	return {
		generatedAt: new Date().toISOString(),
		trainerId,
		counts: {
			batches: batchRows.length,
			activeBatches,
			students: totalStudents,
			institutions,
		},
		workload: {
			assignments: assignmentTotal,
			submissionsPendingReview: submissionsPending,
			submittedLast7d: submissionsSubmitted7d,
		},
		attendance30d: {
			...attendanceTotals,
			ratePercent: attendanceRate,
		},
		batches: batchRows.map((b) => ({
			id: b.id,
			name: b.name,
			isActive: b.isActive,
			startDate: b.startDate,
			endDate: b.endDate,
			courseTitle: b.course?.title ?? null,
			institutionName: b.institution?.name ?? null,
			studentCount: b._count?.students ?? 0,
		})),
		upcomingDeadlines: upcomingAssignments.map((a) => ({
			id: a.id,
			title: a.title,
			dueDate: a.dueDate,
			batchId: a.batch?.id ?? null,
			batchName: a.batch?.name ?? null,
			submissionCount: a._count?.submissions ?? 0,
		})),
		recentSubmissions: recentSubmissions.map((s) => ({
			id: s.id,
			status: s.status,
			submittedAt: s.submittedAt,
			createdAt: s.createdAt,
			score: s.score,
			maxScore: s.maxScore,
			assignmentId: s.assignment?.id ?? null,
			assignmentTitle: s.assignment?.title ?? null,
			batchId: s.assignment?.batch?.id ?? null,
			batchName: s.assignment?.batch?.name ?? null,
			studentName: s.student?.user?.fullName ?? null,
		})),
		recentAnnouncements: recentAnnouncements.map((a) => ({
			id: a.id,
			title: a.title,
			createdAt: a.createdAt,
			batchId: a.batch?.id ?? null,
			batchName: a.batch?.name ?? null,
			authorName: a.author?.fullName ?? null,
		})),
	};
}
