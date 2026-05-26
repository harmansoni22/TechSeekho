import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
	const counts = {
		institutions: await prisma.institution.count(),
		batches: await prisma.batch.count(),
		users: await prisma.user.count(),
		roleAssignments: await prisma.roleAssignment.count(),
		studentProfiles: await prisma.studentProfile.count(),
		trainerProfiles: await prisma.trainerProfile.count(),
		batchTrainers: await prisma.batchTrainer.count(),
		learningPaths: await prisma.learningPath.count(),
		learningModules: await prisma.learningModule.count(),
		pathEnrollments: await prisma.pathEnrollment.count(),
		moduleProgress: await prisma.moduleProgress.count(),
		assignments: await prisma.assignment.count(),
		submissions: await prisma.submission.count(),
		assessments: await prisma.assessment.count(),
		assessmentSubmissions: await prisma.assessmentSubmission.count(),
		attendances: await prisma.attendance.count(),
		announcements: await prisma.announcement.count(),
		streaks: await prisma.studentStreak.count(),
		dailyGoals: await prisma.dailyGoal.count(),
		activities: await prisma.studentActivity.count(),
		achievements: await prisma.achievement.count(),
		userAchievements: await prisma.userAchievement.count(),
	};

	console.log("Row counts:");
	for (const [k, v] of Object.entries(counts)) {
		console.log(`  ${k.padEnd(24)} ${v}`);
	}

	// Spot-check a student's dashboard footprint
	const ali = await prisma.user.findFirst({
		where: { email: "student1.lahore@techseekho.dev" },
		include: {
			studentProfile: {
				include: {
					currentBatch: {
						include: {
							trainers: { include: { trainer: { include: { user: true } } } },
							announcements: true,
							assignments: { include: { submissions: true } },
							assessments: true,
						},
					},
					attendanceRecords: true,
					pathEnrollments: { include: { moduleProgress: true } },
					streak: true,
					achievements: true,
					activities: true,
					dailyGoals: true,
				},
			},
		},
	});

	if (!ali?.studentProfile?.currentBatch) {
		console.error("\nSpot-check failed: Ali has no batch.");
		process.exit(1);
	}

	const sp = ali.studentProfile;
	const batch = sp.currentBatch;
	const submissionsForAli = batch.assignments.flatMap((a) =>
		a.submissions.filter((s) => s.studentId === sp.id),
	);
	const reviewed = submissionsForAli.filter((s) => s.status === "REVIEWED");
	console.log("\nSpot-check (student1.lahore):");
	console.log(`  batch:                   ${batch.name}`);
	console.log(`  batch trainers:          ${batch.trainers.length}`);
	console.log(`  batch announcements:     ${batch.announcements.length}`);
	console.log(`  batch assignments:       ${batch.assignments.length}`);
	console.log(`  batch assessments:       ${batch.assessments.length}`);
	console.log(`  Ali's submissions:       ${submissionsForAli.length}`);
	console.log(`  Ali's reviewed subs:     ${reviewed.length}`);
	console.log(`  Ali's attendance:        ${sp.attendanceRecords.length}`);
	console.log(`  Ali's path enrollments:  ${sp.pathEnrollments.length}`);
	const modProg = sp.pathEnrollments.flatMap((e) => e.moduleProgress);
	console.log(`  Ali's module progress:   ${modProg.length}`);
	console.log(
		`  Ali's streak (cur/long): ${sp.streak?.currentStreak}/${sp.streak?.longestStreak}`,
	);
	console.log(`  Ali's achievements:      ${sp.achievements.length}`);
	console.log(`  Ali's activities:        ${sp.activities.length}`);
	console.log(`  Ali's daily goals:       ${sp.dailyGoals.length}`);

	const expected = {
		institutions: 2,
		batches: 2,
		batchTrainers: 3,
		studentProfiles: 7,
		trainerProfiles: 3,
		learningPaths: 2,
		learningModules: 12,
		pathEnrollments: 7,
		announcements: 10,
	};
	let drift = 0;
	for (const [k, v] of Object.entries(expected)) {
		if (counts[k] !== v) {
			console.error(`\nDRIFT: ${k} expected ${v}, got ${counts[k]}`);
			drift += 1;
		}
	}
	if (drift === 0) console.log("\nAll counts match expected.");
	else {
		console.error(`\n${drift} count drift(s) detected.`);
		process.exit(1);
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
