import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";

async function getStudentProfileByUserId(userId) {
	const student = await prisma.studentProfile.findUnique({
		where: { userId },
		select: { id: true },
	});

	if (!student) {
		throw new AppError("Student profile not found", 404);
	}

	return student;
}

export async function getStudentDashboardData(userId) {
	// Get student profile with related data
	const student = await prisma.studentProfile.findUnique({
		where: { userId },
		include: {
			user: {
				select: {
					fullName: true,
					email: true,
					avatarUrl: true,
				},
			},
			currentBatch: {
				include: {
					course: true,
					institution: true,
					trainers: {
						include: {
							trainer: {
								include: {
									user: {
										select: {
											fullName: true,
											email: true,
											avatarUrl: true,
										},
									},
								},
							},
						},
					},
					announcements: {
						orderBy: { createdAt: "desc" },
						take: 5,
						include: {
							author: {
								select: { fullName: true },
							},
						},
					},
				},
			},
			attendanceRecords: {
				orderBy: { date: "desc" },
				take: 30,
			},
			pathEnrollments: {
				include: {
					path: {
						include: {
							course: true,
							modules: {
								orderBy: { order: "asc" },
							},
						},
					},
					moduleProgress: {
						include: {
							module: true,
						},
					},
				},
			},
			streak: true,
			dailyGoals: {
				where: {
					date: {
						gte: new Date(new Date().setHours(0, 0, 0, 0)),
						lte: new Date(new Date().setHours(23, 59, 59, 999)),
					},
				},
				orderBy: { date: "desc" },
			},
			activities: {
				orderBy: { createdAt: "desc" },
				take: 10,
			},
			achievements: {
				include: {
					achievement: true,
				},
				orderBy: { unlockedAt: "desc" },
				take: 5,
			},
		},
	});

	if (!student) {
		throw new AppError("Student profile not found", 404);
	}

	// Get KPIs
	const totalEnrollments = student.pathEnrollments.length;
	const completedEnrollments = student.pathEnrollments.filter(
		(e) => e.completedAt,
	).length;
	const currentStreak = student.streak?.currentStreak || 0;
	const totalAchievements = student.achievements.length;

	// Get today's daily goal
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const dailyGoal = student.dailyGoals.find(
		(goal) => goal.date.toDateString() === today.toDateString(),
	) || {
		lessonsTarget: 1,
		lessonsCompleted: 0,
		minutesTarget: 30,
		minutesSpent: 0,
		isCompleted: false,
	};

	// Get recent activity
	const recentActivity = student.activities.map((activity) => ({
		id: activity.id,
		type: activity.type,
		description: activity.description,
		createdAt: activity.createdAt,
		metadata: activity.metadata,
	}));

	// Get courses with progress
	const coursesWithProgress = student.pathEnrollments.map((enrollment) => ({
		id: enrollment.path.id,
		title: enrollment.path.title,
		description: enrollment.path.description,
		course: enrollment.path.course,
		progress: enrollment.progress,
		enrolledAt: enrollment.enrolledAt,
		completedAt: enrollment.completedAt,
		modules: enrollment.path.modules.map((module) => {
			const progress = enrollment.moduleProgress.find(
				(p) => p.moduleId === module.id,
			);
			return {
				id: module.id,
				title: module.title,
				description: module.description,
				duration: module.duration,
				order: module.order,
				isRequired: module.isRequired,
				progress: progress?.progress || 0,
				startedAt: progress?.startedAt,
				completedAt: progress?.completedAt,
			};
		}),
	}));

	// Get quick access lessons (incomplete modules from active courses)
	const quickAccessLessons = coursesWithProgress
		.filter((course) => !course.completedAt)
		.flatMap((course) =>
			course.modules
				.filter((module) => !module.completedAt && module.isRequired)
				.slice(0, 2) // Take first 2 incomplete modules per course
				.map((module) => ({
					id: module.id,
					title: module.title,
					course: course.course.title,
					progress: module.progress,
					duration: module.duration,
					courseId: course.id,
				})),
		)
		.slice(0, 6); // Limit to 6 total lessons

	// Get achievements
	const achievements = student.achievements.map((userAchievement) => ({
		id: userAchievement.achievement.id,
		title: userAchievement.achievement.title,
		description: userAchievement.achievement.description,
		icon: userAchievement.achievement.icon,
		badgeColor: userAchievement.achievement.badgeColor,
		points: userAchievement.achievement.points,
		unlockedAt: userAchievement.unlockedAt,
	}));

	// Trainer roster for the current batch (joined via BatchTrainer → TrainerProfile → User).
	const trainers = (student.currentBatch?.trainers ?? []).map((bt) => ({
		id: bt.trainer.id,
		fullName: bt.trainer.user.fullName,
		email: bt.trainer.user.email,
		avatarUrl: bt.trainer.user.avatarUrl,
		specialization: bt.trainer.specialization,
		experienceYears: bt.trainer.experienceYears,
	}));

	// Announcements posted to the current batch (most recent 5).
	const announcements = (student.currentBatch?.announcements ?? []).map(
		(a) => ({
			id: a.id,
			title: a.title,
			content: a.content,
			authorName: a.author?.fullName ?? null,
			createdAt: a.createdAt,
		}),
	);

	// Attendance summary across the last 30 sessions.
	const attendanceCounts = (student.attendanceRecords ?? []).reduce(
		(acc, r) => {
			if (r.status === "PRESENT") acc.present += 1;
			else if (r.status === "LATE") acc.late += 1;
			else if (r.status === "ABSENT") acc.absent += 1;
			return acc;
		},
		{ present: 0, late: 0, absent: 0 },
	);
	const totalAttendance =
		attendanceCounts.present + attendanceCounts.late + attendanceCounts.absent;
	const attendanceSummary = {
		...attendanceCounts,
		total: totalAttendance,
		rate:
			totalAttendance > 0
				? Math.round(
						((attendanceCounts.present + attendanceCounts.late) * 100) /
							totalAttendance,
					)
				: 0,
	};

	// Today's assignments + upcoming assessments are fetched alongside the
	// main dashboard read so trainers issuing work see it surface immediately
	// on the next dashboard refresh. Both are scoped to the student's batch.
	let todayAssignments = [];
	let upcomingAssessments = [];
	if (student.currentBatchId) {
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);
		const endOfToday = new Date();
		endOfToday.setHours(23, 59, 59, 999);
		const now = new Date();
		const oneMonthOut = new Date();
		oneMonthOut.setDate(oneMonthOut.getDate() + 30);

		const [todays, upcoming] = await Promise.all([
			prisma.assignment.findMany({
				where: {
					batchId: student.currentBatchId,
					dueDate: { gte: startOfToday, lte: endOfToday },
				},
				select: {
					id: true,
					title: true,
					dueDate: true,
					course: { select: { title: true } },
				},
				orderBy: { dueDate: "asc" },
			}),
			prisma.assessment.findMany({
				where: {
					batchId: student.currentBatchId,
					status: "PUBLISHED",
					OR: [
						{ startsAt: { gte: now, lte: oneMonthOut } },
						{ startsAt: null, dueDate: { gte: now, lte: oneMonthOut } },
					],
				},
				select: {
					id: true,
					title: true,
					type: true,
					startsAt: true,
					dueDate: true,
					course: { select: { title: true } },
				},
				orderBy: [
					{ startsAt: { sort: "asc", nulls: "last" } },
					{ dueDate: "asc" },
				],
				take: 5,
			}),
		]);
		todayAssignments = todays.map((a) => ({
			id: a.id,
			title: a.title,
			dueDate: a.dueDate,
			courseTitle: a.course?.title,
		}));
		upcomingAssessments = upcoming.map((a) => ({
			id: a.id,
			title: a.title,
			type: a.type,
			startsAt: a.startsAt,
			dueDate: a.dueDate,
			courseTitle: a.course?.title,
		}));
	}

	return {
		student: {
			id: student.id,
			fullName: student.user.fullName,
			email: student.user.email,
			avatarUrl: student.user.avatarUrl,
			enrollmentNumber: student.enrollmentNumber,
			joinedAt: student.joinedAt,
			currentBatch: student.currentBatch,
		},
		kpis: [
			{
				label: "Active Courses",
				value: totalEnrollments - completedEnrollments,
				delta: `+${completedEnrollments} completed`,
			},
			{
				label: "Learning Streak",
				value: `${currentStreak} days`,
				delta: "Keep it up!",
			},
			{
				label: "Achievements",
				value: totalAchievements,
				delta: `+${Math.floor(currentStreak / 7)} this month`,
			},
			{
				label: "Study Time Today",
				value: `${dailyGoal.minutesSpent}m`,
				delta: `${dailyGoal.minutesTarget - dailyGoal.minutesSpent}m to goal`,
			},
		],
		dailyGoals: [
			{
				label: "Lessons Completed",
				progress: Math.min(
					(dailyGoal.lessonsCompleted / dailyGoal.lessonsTarget) * 100,
					100,
				),
			},
			{
				label: "Study Time",
				progress: Math.min(
					(dailyGoal.minutesSpent / dailyGoal.minutesTarget) * 100,
					100,
				),
			},
		],
		currentStreak,
		longestStreak: student.streak?.longestStreak ?? 0,
		topCourses: coursesWithProgress.slice(0, 3).map((course) => ({
			id: course.id,
			name: course.title,
			enrollments: course.modules.length,
			completion: Math.round(course.progress),
		})),
		recentActivity: recentActivity
			.slice(0, 5)
			.map((activity) => activity.description),
		quickAccessLessons,
		achievements,
		courses: coursesWithProgress,
		trainers,
		announcements,
		todayAssignments,
		upcomingAssessments,
		attendanceSummary,
	};
}

export async function getStudentCourses(userId) {
	const student = await getStudentProfileByUserId(userId);

	const enrollments = await prisma.pathEnrollment.findMany({
		where: { studentId: student.id },
		include: {
			path: {
				include: {
					course: true,
					modules: {
						orderBy: { order: "asc" },
					},
				},
			},
			moduleProgress: {
				include: {
					module: true,
				},
			},
		},
		orderBy: { enrolledAt: "desc" },
	});

	return enrollments.map((enrollment) => ({
		id: enrollment.id,
		pathId: enrollment.pathId,
		title: enrollment.path.title,
		description: enrollment.path.description,
		course: enrollment.path.course,
		progress: enrollment.progress,
		enrolledAt: enrollment.enrolledAt,
		completedAt: enrollment.completedAt,
		modules: enrollment.path.modules.map((module) => {
			const progress = enrollment.moduleProgress.find(
				(p) => p.moduleId === module.id,
			);
			return {
				id: module.id,
				title: module.title,
				description: module.description,
				duration: module.duration,
				order: module.order,
				isRequired: module.isRequired,
				progress: progress?.progress || 0,
				startedAt: progress?.startedAt,
				completedAt: progress?.completedAt,
			};
		}),
	}));
}

export async function updateModuleProgress(userId, moduleId, progress) {
	const student = await getStudentProfileByUserId(userId);

	// Find the enrollment and module
	const enrollment = await prisma.pathEnrollment.findFirst({
		where: {
			studentId: student.id,
			path: {
				modules: {
					some: { id: moduleId },
				},
			},
		},
		include: {
			path: {
				include: {
					modules: {
						where: { id: moduleId },
					},
				},
			},
		},
	});

	if (!enrollment) {
		throw new AppError("No active enrollment found", 404);
	}

	if (enrollment.path.modules.length === 0) {
		throw new AppError("Module not found", 404);
	}

	// Update or create module progress
	const moduleProgress = await prisma.moduleProgress.upsert({
		where: {
			enrollmentId_moduleId: {
				enrollmentId: enrollment.id,
				moduleId: moduleId,
			},
		},
		update: {
			progress: Math.min(progress, 100),
			startedAt: progress > 0 ? new Date() : undefined,
			completedAt: progress >= 100 ? new Date() : undefined,
		},
		create: {
			enrollmentId: enrollment.id,
			moduleId: moduleId,
			progress: Math.min(progress, 100),
			startedAt: progress > 0 ? new Date() : undefined,
			completedAt: progress >= 100 ? new Date() : undefined,
		},
	});

	// Update overall enrollment progress
	const allModules = await prisma.learningModule.findMany({
		where: { pathId: enrollment.pathId },
	});

	const allProgress = await prisma.moduleProgress.findMany({
		where: {
			enrollmentId: enrollment.id,
			moduleId: { in: allModules.map((m) => m.id) },
		},
	});

	const totalProgress = allProgress.reduce((sum, p) => sum + p.progress, 0);
	const overallProgress =
		allModules.length > 0 ? totalProgress / allModules.length : 0;

	await prisma.pathEnrollment.update({
		where: { id: enrollment.id },
		data: {
			progress: overallProgress,
			completedAt: overallProgress >= 100 ? new Date() : null,
		},
	});

	// Create activity log
	if (progress >= 100) {
		await prisma.studentActivity.create({
			data: {
				studentId: student.id,
				type: "LESSON_COMPLETED",
				description: `Completed module: ${enrollment.path.modules[0].title}`,
				metadata: {
					moduleId,
					enrollmentId: enrollment.id,
				},
			},
		});
	}

	return moduleProgress;
}

export async function getStudentAssignments(userId) {
	const student = await prisma.studentProfile.findUnique({
		where: { userId },
		include: {
			currentBatch: {
				include: {
					assignments: {
						include: {
							course: true,
							createdBy: {
								include: {
									user: {
										select: {
											fullName: true,
										},
									},
								},
							},
						},
						orderBy: { dueDate: "asc" },
					},
				},
			},
			submissions: {
				include: {
					assignment: {
						include: {
							course: true,
						},
					},
				},
			},
		},
	});

	if (!student || !student.currentBatch) {
		return [];
	}

	const assignments = student.currentBatch.assignments.map((assignment) => {
		const submission = student.submissions.find(
			(s) => s.assignmentId === assignment.id,
		);
		return {
			id: assignment.id,
			title: assignment.title,
			description: assignment.description,
			dueDate: assignment.dueDate,
			course: assignment.course,
			createdBy: assignment.createdBy.user.fullName,
			submission: submission
				? {
						id: submission.id,
						status: submission.status,
						submittedAt: submission.submittedAt,
						feedback: submission.feedback,
					}
				: null,
		};
	});

	return assignments;
}

export async function getStudentAttendance(userId) {
	const student = await prisma.studentProfile.findUnique({
		where: { userId },
		include: {
			currentBatch: true,
		},
	});

	if (!student || !student.currentBatch) {
		return [];
	}

	const attendances = await prisma.attendance.findMany({
		where: {
			studentId: student.id,
			batchId: student.currentBatch.id,
		},
		orderBy: { date: "desc" },
		take: 30,
	});

	return attendances.map((attendance) => ({
		id: attendance.id,
		date: attendance.date,
		status: attendance.status,
		markedAt: attendance.markedAt,
	}));
}

export async function getStudentAchievements(userId) {
	const student = await getStudentProfileByUserId(userId);

	const achievements = await prisma.userAchievement.findMany({
		where: { studentId: student.id },
		include: {
			achievement: true,
		},
		orderBy: { unlockedAt: "desc" },
	});

	return achievements.map((userAchievement) => ({
		id: userAchievement.achievement.id,
		title: userAchievement.achievement.title,
		description: userAchievement.achievement.description,
		icon: userAchievement.achievement.icon,
		badgeColor: userAchievement.achievement.badgeColor,
		points: userAchievement.achievement.points,
		unlockedAt: userAchievement.unlockedAt,
	}));
}
