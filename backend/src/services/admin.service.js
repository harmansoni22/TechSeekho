import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { isSuperAdmin } from "./access.service.js";

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

	// Resolve role names for counts
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
