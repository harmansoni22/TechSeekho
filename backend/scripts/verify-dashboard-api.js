import "dotenv/config";
import prisma from "../src/config/db.js";
import { getStudentDashboardData } from "../src/services/student.service.js";

async function main() {
	const ali = await prisma.user.findFirst({
		where: { email: "student1.lahore@techseekho.dev" },
		select: { id: true, fullName: true },
	});
	if (!ali) {
		console.error("student1.lahore not found — re-run seed first.");
		process.exit(1);
	}

	const data = await getStudentDashboardData(ali.id);

	const summary = {
		studentName: data.student.fullName,
		batchName: data.student.currentBatch?.name,
		kpiCount: data.kpis.length,
		dailyGoalsCount: data.dailyGoals.length,
		currentStreak: data.currentStreak,
		longestStreak: data.longestStreak,
		quickAccessLessonsCount: data.quickAccessLessons.length,
		topCoursesCount: data.topCourses.length,
		recentActivityCount: data.recentActivity.length,
		achievementsCount: data.achievements.length,
		coursesCount: data.courses.length,
		trainersCount: data.trainers.length,
		announcementsCount: data.announcements.length,
		todayAssignmentsCount: data.todayAssignments.length,
		upcomingAssessmentsCount: data.upcomingAssessments.length,
		attendanceSummary: data.attendanceSummary,
	};

	console.log("Student dashboard service output for student1.lahore:");
	for (const [k, v] of Object.entries(summary)) {
		console.log(
			`  ${k.padEnd(28)} ${typeof v === "object" ? JSON.stringify(v) : v}`,
		);
	}

	if (data.trainers.length === 0) {
		console.error("\nFAIL: trainers empty");
		process.exit(1);
	}
	if (data.announcements.length === 0) {
		console.error("\nFAIL: announcements empty");
		process.exit(1);
	}
	if (!data.attendanceSummary || data.attendanceSummary.total === 0) {
		console.error("\nFAIL: attendance summary empty");
		process.exit(1);
	}
	if (data.longestStreak === undefined) {
		console.error("\nFAIL: longestStreak missing");
		process.exit(1);
	}

	console.log("\nDashboard service returns populated dynamic data ✓");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
