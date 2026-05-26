import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { courses } from "../src/data/courses.data.js";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Static definitions
// ---------------------------------------------------------------------------

const ROLE_DEFS = [
	{ name: "SUPER_ADMIN", description: "Full platform access" },
	{ name: "ADMIN", description: "Institution management access" },
	{ name: "TRAINER", description: "Trainer access" },
	{
		name: "INSTITUTION_COORDINATOR",
		description: "Institute Coordinator access",
	},
	{ name: "STUDENT", description: "Student access" },
];

const INSTITUTION_DEFS = [
	{
		key: "lahore",
		name: "TechSeekho Academy Lahore",
		type: "COLLEGE",
		city: "Lahore",
		state: "Punjab",
		contactEmail: "lahore@techseekho.com",
		contactPhone: "+924235901234",
	},
	{
		key: "karachi",
		name: "TechSeekho Academy Karachi",
		type: "COLLEGE",
		city: "Karachi",
		state: "Sindh",
		contactEmail: "karachi@techseekho.com",
		contactPhone: "+922135901234",
	},
];

// institutionKey: null  → global role assignment (SUPER_ADMIN only)
// institutionKey: set   → scoped role assignment to that institution
//
// All non-SUPER_ADMIN users must have institutionKey set so that
// requireOperationalAccess() passes (it checks for any non-null institutionId
// in the user's roleAssignments).
const USER_DEFS = [
	// ── SUPER ADMIN (global — institutionId null is intentional) ─────────────
	{
		fullName: "Ahmad Karimi",
		email: "superadmin@techseekho.dev",
		password: "Ahmad@TechSeekho2026",
		role: "SUPER_ADMIN",
		institutionKey: null,
	},

	// ── TechSeekho Academy Lahore ─────────────────────────────────────────────
	{
		fullName: "Zara Noor",
		email: "admin.lahore@techseekho.dev",
		password: "Zara@TechSeekho2026",
		role: "ADMIN",
		institutionKey: "lahore",
		designation: "Campus Director",
	},
	{
		fullName: "Hamza Butt",
		email: "coordinator.lahore@techseekho.dev",
		password: "Hamza@TechSeekho2026",
		role: "INSTITUTION_COORDINATOR",
		institutionKey: "lahore",
	},
	{
		fullName: "Faisal Khan",
		email: "trainer1.lahore@techseekho.dev",
		password: "Faisal@TechSeekho2026",
		role: "TRAINER",
		institutionKey: "lahore",
		specialization: "Full Stack Development",
		experienceYears: 5,
	},
	{
		fullName: "Sana Riaz",
		email: "trainer2.lahore@techseekho.dev",
		password: "Sana@TechSeekho2026",
		role: "TRAINER",
		institutionKey: "lahore",
		specialization: "Data Science & AI",
		experienceYears: 4,
	},
	{
		fullName: "Ali Hassan",
		email: "student1.lahore@techseekho.dev",
		password: "Ali@TechSeekho2026",
		role: "STUDENT",
		institutionKey: "lahore",
		enrollmentNumber: "LHR-2026-001",
	},
	{
		fullName: "Ayesha Malik",
		email: "student2.lahore@techseekho.dev",
		password: "Ayesha@TechSeekho2026",
		role: "STUDENT",
		institutionKey: "lahore",
		enrollmentNumber: "LHR-2026-002",
	},
	{
		fullName: "Bilal Ahmed",
		email: "student3.lahore@techseekho.dev",
		password: "Bilal@TechSeekho2026",
		role: "STUDENT",
		institutionKey: "lahore",
		enrollmentNumber: "LHR-2026-003",
	},
	{
		fullName: "Fatima Javed",
		email: "student4.lahore@techseekho.dev",
		password: "Fatima@TechSeekho2026",
		role: "STUDENT",
		institutionKey: "lahore",
		enrollmentNumber: "LHR-2026-004",
	},

	// ── TechSeekho Academy Karachi ────────────────────────────────────────────
	{
		fullName: "Omar Siddiq",
		email: "admin.karachi@techseekho.dev",
		password: "Omar@TechSeekho2026",
		role: "ADMIN",
		institutionKey: "karachi",
		designation: "Campus Director",
	},
	{
		fullName: "Nadia Iqbal",
		email: "coordinator.karachi@techseekho.dev",
		password: "Nadia@TechSeekho2026",
		role: "INSTITUTION_COORDINATOR",
		institutionKey: "karachi",
	},
	{
		fullName: "Tariq Hussain",
		email: "trainer.karachi@techseekho.dev",
		password: "Tariq@TechSeekho2026",
		role: "TRAINER",
		institutionKey: "karachi",
		specialization: "Cloud & DevOps",
		experienceYears: 6,
	},
	{
		fullName: "Maryam Shah",
		email: "student1.karachi@techseekho.dev",
		password: "Maryam@TechSeekho2026",
		role: "STUDENT",
		institutionKey: "karachi",
		enrollmentNumber: "KHI-2026-001",
	},
	{
		fullName: "Usman Ali",
		email: "student2.karachi@techseekho.dev",
		password: "Usman@TechSeekho2026",
		role: "STUDENT",
		institutionKey: "karachi",
		enrollmentNumber: "KHI-2026-002",
	},
	{
		fullName: "Sobia Farooq",
		email: "student3.karachi@techseekho.dev",
		password: "Sobia@TechSeekho2026",
		role: "STUDENT",
		institutionKey: "karachi",
		enrollmentNumber: "KHI-2026-003",
	},
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Uses findFirst + conditional create instead of upsert because PostgreSQL
// treats NULL != NULL in unique constraints, so compound-unique upsert on
// (userId, roleId, NULL) is unreliable across Postgres versions.
async function assignRole(userId, roleId, institutionId) {
	const existing = await prisma.roleAssignment.findFirst({
		where: { userId, roleId, institutionId },
	});
	if (!existing) {
		await prisma.roleAssignment.create({
			data: { userId, roleId, institutionId },
		});
	}
}

async function findOrCreateInstitution(def) {
	let inst = await prisma.institution.findFirst({
		where: { name: def.name },
	});
	if (!inst) {
		inst = await prisma.institution.create({
			data: {
				name: def.name,
				type: def.type,
				city: def.city,
				state: def.state,
				contactEmail: def.contactEmail,
				contactPhone: def.contactPhone,
				isActive: true,
			},
		});
	}
	return inst;
}

async function findOrCreateBatch({ name, institutionId, courseId, startDate }) {
	let batch = await prisma.batch.findFirst({
		where: { name, institutionId },
	});
	if (!batch) {
		batch = await prisma.batch.create({
			data: {
				name,
				institutionId,
				courseId,
				startDate: new Date(startDate),
				isActive: true,
			},
		});
	}
	return batch;
}

// ---------------------------------------------------------------------------
// Operational seed templates and factories
// ---------------------------------------------------------------------------

const PATH_MODULE_TITLES = [
	"Module 1 · Orientation & toolchain",
	"Module 2 · Core concepts",
	"Module 3 · Hands-on workflow",
	"Module 4 · Building blocks",
	"Module 5 · Mini project",
	"Module 6 · Integration & polish",
];

// dueOffsetDays is relative to "today" at seed time. Negative = past.
const ASSIGNMENT_TEMPLATES = [
	{
		slug: "m1-practice",
		title: "Module 1 · Practice set",
		description: "Work through the orientation drills and submit your notes.",
		dueOffsetDays: -14,
	},
	{
		slug: "m2-exercises",
		title: "Module 2 · Exercises",
		description: "Hands-on exercises covering the core concepts of Module 2.",
		dueOffsetDays: -7,
	},
	{
		slug: "m3-design",
		title: "Module 3 · Mini design doc",
		description: "Write a short design doc explaining your approach.",
		dueOffsetDays: -2,
	},
	{
		slug: "today-drill",
		title: "Quick drill · today",
		description: "Short focused drill due end of day.",
		dueOffsetDays: 0,
	},
	{
		slug: "m4-build",
		title: "Module 4 · Build task",
		description: "Implement the build task described in the module.",
		dueOffsetDays: 4,
	},
	{
		slug: "m5-capstone-pitch",
		title: "Module 5 · Capstone pitch",
		description: "Pitch your capstone idea to your trainer for sign-off.",
		dueOffsetDays: 10,
	},
];

const ASSESSMENT_TEMPLATES = [
	{
		slug: "diagnostic",
		title: "Diagnostic quiz",
		type: "QUIZ",
		status: "CLOSED",
		startsOffsetDays: -10,
		dueOffsetDays: -10,
	},
	{
		slug: "midterm",
		title: "Mid-term test",
		type: "TEST",
		status: "PUBLISHED",
		startsOffsetDays: 5,
		dueOffsetDays: 5,
	},
	{
		slug: "capstone",
		title: "Capstone project",
		type: "PROJECT",
		status: "PUBLISHED",
		startsOffsetDays: 14,
		dueOffsetDays: 28,
	},
];

const ANNOUNCEMENT_TEMPLATES = [
	{
		slug: "welcome",
		title: "Welcome to the batch",
		content:
			"Welcome to your TechSeekho cohort. Module 1 onboarding kicks off this week — bring a working laptop and your institutional ID.",
		offsetDays: -20,
	},
	{
		slug: "m1-due",
		title: "Module 1 practice set — submit by Friday",
		content:
			"Please push your Module 1 practice notes to the platform before Friday 6pm. Late submissions need trainer approval.",
		offsetDays: -13,
	},
	{
		slug: "labs",
		title: "Lab schedule for next week",
		content:
			"Lab sessions next week run Tuesday and Thursday afternoons. Bring your project notebooks.",
		offsetDays: -7,
	},
	{
		slug: "midterm-prep",
		title: "Mid-term in two weeks",
		content:
			"The mid-term test covers Modules 1–3. We'll do a review session next Monday.",
		offsetDays: -2,
	},
	{
		slug: "office-hours",
		title: "Trainer office hours this week",
		content:
			"Office hours run daily from 4–5pm on the campus lab floor. Bring questions on your active assignments.",
		offsetDays: -1,
	},
];

const ACHIEVEMENT_DEFS = [
	{
		title: "First submission",
		description: "Submitted your first assignment.",
		icon: "🚀",
		badgeColor: "#22c55e",
		points: 50,
	},
	{
		title: "Perfect attendance week",
		description: "Marked PRESENT every session for a full week.",
		icon: "📅",
		badgeColor: "#f59e0b",
		points: 100,
	},
	{
		title: "Module master",
		description: "Completed every module in the current learning path.",
		icon: "🏆",
		badgeColor: "#3b82f6",
		points: 150,
	},
	{
		title: "Early bird",
		description: "Submitted three assignments before the due date.",
		icon: "🌅",
		badgeColor: "#8b5cf6",
		points: 75,
	},
];

// Returns { title → achievementId }
async function seedAchievementCatalogue() {
	const map = {};
	for (const def of ACHIEVEMENT_DEFS) {
		const existing = await prisma.achievement.findFirst({
			where: { title: def.title },
		});
		const row = existing
			? await prisma.achievement.update({
					where: { id: existing.id },
					data: {
						description: def.description,
						icon: def.icon,
						badgeColor: def.badgeColor,
						points: def.points,
					},
				})
			: await prisma.achievement.create({ data: def });
		map[def.title] = row.id;
	}
	return map;
}

// Deterministic helpers ──────────────────────────────────────────────────────

function addDays(base, days) {
	const d = new Date(base);
	d.setDate(d.getDate() + days);
	return d;
}

// PRESENT-heavy attendance pattern with predictable late/absent days per
// student so each re-seed produces the same records.
function attendanceStatusFor(studentIndex, dayOffset) {
	const cycle = (Math.abs(dayOffset) + studentIndex) % 7;
	if (cycle === 0) return "ABSENT";
	if (cycle === 3) return "LATE";
	return "PRESENT";
}

// Submission status profile by student index. Ensures we get mixed states.
function submissionStatusFor(studentIndex, assignmentIndex, dueOffsetDays) {
	// Future assignments → no submission yet.
	if (dueOffsetDays > 0 && studentIndex !== 0) return null;
	// First student is "the keen one" — submits everything early.
	if (studentIndex === 0) {
		return assignmentIndex === 5
			? "SUBMITTED"
			: assignmentIndex < 3
				? "REVIEWED"
				: "SUBMITTED";
	}
	// Second student lags a little.
	if (studentIndex === 1) {
		return assignmentIndex < 2
			? "REVIEWED"
			: assignmentIndex === 3
				? null
				: "SUBMITTED";
	}
	// Others have a varied pattern.
	if (assignmentIndex === 0) return "REVIEWED";
	if (assignmentIndex === 1) return "SUBMITTED";
	if (assignmentIndex === 2 && studentIndex % 2 === 0) return "SUBMITTED";
	return null;
}

async function seedBatchOperationalData(
	batch,
	studentsInBatch,
	trainersInBatch,
	achievementMap,
) {
	if (trainersInBatch.length === 0) {
		console.log(`  no trainers assigned to ${batch.name}, skipping`);
		return;
	}
	if (studentsInBatch.length === 0) {
		console.log(`  no students enrolled in ${batch.name}, skipping`);
		return;
	}

	const primaryTrainerProfile = trainersInBatch[0].profile;
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Wipe batch-scoped operational data so this seed is re-runnable.
	await prisma.assessmentSubmission.deleteMany({
		where: { assessment: { batchId: batch.id } },
	});
	await prisma.submission.deleteMany({
		where: { assignment: { batchId: batch.id } },
	});
	await prisma.assignment.deleteMany({ where: { batchId: batch.id } });
	await prisma.assessment.deleteMany({ where: { batchId: batch.id } });
	await prisma.attendance.deleteMany({ where: { batchId: batch.id } });
	await prisma.announcement.deleteMany({ where: { batchId: batch.id } });

	// LearningPath + modules (1 path per batch, shared course).
	let path = await prisma.learningPath.findFirst({
		where: {
			title: `${batch.name} learning path`,
			courseId: batch.courseId,
			institutionId: batch.institutionId,
		},
	});
	if (!path) {
		path = await prisma.learningPath.create({
			data: {
				title: `${batch.name} learning path`,
				description: `Module sequence followed by ${batch.name}.`,
				courseId: batch.courseId,
				institutionId: batch.institutionId,
				estimatedHours: 36,
				difficulty: "INTERMEDIATE",
			},
		});
	}

	const moduleRows = [];
	for (let i = 0; i < PATH_MODULE_TITLES.length; i += 1) {
		const moduleTitle = PATH_MODULE_TITLES[i];
		let module = await prisma.learningModule.findFirst({
			where: { pathId: path.id, order: i + 1 },
		});
		if (module) {
			module = await prisma.learningModule.update({
				where: { id: module.id },
				data: {
					title: moduleTitle,
					description: `Material and exercises for ${moduleTitle.toLowerCase()}.`,
					duration: 45 + (i % 3) * 15,
					isRequired: true,
				},
			});
		} else {
			module = await prisma.learningModule.create({
				data: {
					pathId: path.id,
					order: i + 1,
					title: moduleTitle,
					description: `Material and exercises for ${moduleTitle.toLowerCase()}.`,
					duration: 45 + (i % 3) * 15,
					isRequired: true,
				},
			});
		}
		moduleRows.push(module);
	}

	// Enroll each student in the path; deterministically progress through
	// modules (first student furthest along, last student earliest).
	for (let i = 0; i < studentsInBatch.length; i += 1) {
		const studentProfile = studentsInBatch[i].profile; // StudentProfile
		const completedModuleCount = Math.max(0, moduleRows.length - i - 1); // 5, 4, 3, 2 for 4 students
		const enrollment = await prisma.pathEnrollment.upsert({
			where: {
				studentId_pathId: { studentId: studentProfile.id, pathId: path.id },
			},
			update: {
				progress: (completedModuleCount / moduleRows.length) * 100,
				completedAt:
					completedModuleCount >= moduleRows.length ? new Date() : null,
			},
			create: {
				studentId: studentProfile.id,
				pathId: path.id,
				progress: (completedModuleCount / moduleRows.length) * 100,
				completedAt:
					completedModuleCount >= moduleRows.length ? new Date() : null,
			},
		});

		for (let m = 0; m < moduleRows.length; m += 1) {
			const moduleId = moduleRows[m].id;
			const isCompleted = m < completedModuleCount;
			const isInProgress = m === completedModuleCount;
			const progressValue = isCompleted ? 100 : isInProgress ? 40 : 0;
			await prisma.moduleProgress.upsert({
				where: {
					enrollmentId_moduleId: {
						enrollmentId: enrollment.id,
						moduleId,
					},
				},
				update: {
					progress: progressValue,
					startedAt: progressValue > 0 ? addDays(today, -(m + 1) * 3) : null,
					completedAt: isCompleted ? addDays(today, -m * 2) : null,
				},
				create: {
					enrollmentId: enrollment.id,
					moduleId,
					progress: progressValue,
					startedAt: progressValue > 0 ? addDays(today, -(m + 1) * 3) : null,
					completedAt: isCompleted ? addDays(today, -m * 2) : null,
				},
			});
		}
	}

	// Assignments + Submissions.
	for (let a = 0; a < ASSIGNMENT_TEMPLATES.length; a += 1) {
		const tpl = ASSIGNMENT_TEMPLATES[a];
		const dueDate = addDays(today, tpl.dueOffsetDays);
		const assignment = await prisma.assignment.create({
			data: {
				title: tpl.title,
				description: tpl.description,
				institutionId: batch.institutionId,
				batchId: batch.id,
				courseId: batch.courseId,
				createdById: primaryTrainerProfile.id,
				dueDate,
			},
		});

		for (let s = 0; s < studentsInBatch.length; s += 1) {
			const status = submissionStatusFor(s, a, tpl.dueOffsetDays);
			if (!status) continue;
			const submittedAt = addDays(dueDate, status === "REVIEWED" ? -2 : -1);
			const reviewedAt = status === "REVIEWED" ? addDays(dueDate, 1) : null;
			await prisma.submission.create({
				data: {
					assignmentId: assignment.id,
					studentId: studentsInBatch[s].profile.id,
					institutionId: batch.institutionId,
					submissionText: `Submitted by student ${s + 1} for ${tpl.title}.`,
					status,
					submittedAt,
					reviewedAt,
					feedback:
						status === "REVIEWED"
							? "Solid effort. Watch the edge cases discussed in class."
							: null,
					score: status === "REVIEWED" ? 80 + ((s * 7 + a * 3) % 15) : null,
					maxScore: 100,
				},
			});
		}
	}

	// Assessments + Submissions for past assessments.
	for (let i = 0; i < ASSESSMENT_TEMPLATES.length; i += 1) {
		const tpl = ASSESSMENT_TEMPLATES[i];
		const assessment = await prisma.assessment.create({
			data: {
				title: tpl.title,
				description: `${tpl.title} for ${batch.name}.`,
				type: tpl.type,
				status: tpl.status,
				institutionId: batch.institutionId,
				batchId: batch.id,
				courseId: batch.courseId,
				createdById: primaryTrainerProfile.id,
				maxScore: 100,
				startsAt: addDays(today, tpl.startsOffsetDays),
				dueDate: addDays(today, tpl.dueOffsetDays),
			},
		});
		if (tpl.status === "CLOSED") {
			for (let s = 0; s < studentsInBatch.length; s += 1) {
				await prisma.assessmentSubmission.create({
					data: {
						assessmentId: assessment.id,
						studentId: studentsInBatch[s].profile.id,
						answers: { note: "Auto-seeded submission" },
						score: 72 + ((s * 11) % 22),
						feedback: "Good baseline — keep building on this.",
						submittedAt: addDays(today, tpl.dueOffsetDays),
						reviewedAt: addDays(today, tpl.dueOffsetDays + 2),
					},
				});
			}
		}
	}

	// Attendance for last 30 days.
	for (let s = 0; s < studentsInBatch.length; s += 1) {
		const studentProfile = studentsInBatch[s].profile;
		for (let d = 1; d <= 30; d += 1) {
			const date = addDays(today, -d);
			await prisma.attendance.create({
				data: {
					batchId: batch.id,
					studentId: studentProfile.id,
					date,
					status: attendanceStatusFor(s, d),
				},
			});
		}
	}

	// Announcements (use first trainer's user as author).
	const authorUserId = trainersInBatch[0].user.id;
	for (const tpl of ANNOUNCEMENT_TEMPLATES) {
		await prisma.announcement.create({
			data: {
				title: tpl.title,
				content: tpl.content,
				institutionId: batch.institutionId,
				batchId: batch.id,
				authorId: authorUserId,
				createdAt: addDays(today, tpl.offsetDays),
			},
		});
	}

	// Per-student personal data: streak, daily goals (last 7 days), activities,
	// achievements (a few each, deterministic by student index).
	for (let s = 0; s < studentsInBatch.length; s += 1) {
		const studentProfile = studentsInBatch[s].profile;
		const currentStreak = 7 - s; // 7, 6, 5, 4 for 4 students
		const longestStreak = Math.max(currentStreak, 12 - s);
		await prisma.studentStreak.upsert({
			where: { studentId: studentProfile.id },
			update: {
				currentStreak,
				longestStreak,
				lastActiveDate: today,
			},
			create: {
				studentId: studentProfile.id,
				currentStreak,
				longestStreak,
				lastActiveDate: today,
			},
		});

		for (let d = 0; d < 7; d += 1) {
			const date = addDays(today, -d);
			const lessonsTarget = 1;
			const lessonsCompleted = d === 0 ? 0 : 1;
			const minutesTarget = 30;
			const minutesSpent = d === 0 ? 12 + s * 4 : 35 + ((s * 5) % 15);
			await prisma.dailyGoal.upsert({
				where: {
					studentId_date: {
						studentId: studentProfile.id,
						date,
					},
				},
				update: {
					lessonsTarget,
					lessonsCompleted,
					minutesTarget,
					minutesSpent,
					isCompleted: minutesSpent >= minutesTarget,
				},
				create: {
					studentId: studentProfile.id,
					date,
					lessonsTarget,
					lessonsCompleted,
					minutesTarget,
					minutesSpent,
					isCompleted: minutesSpent >= minutesTarget,
				},
			});
		}

		await prisma.studentActivity.deleteMany({
			where: { studentId: studentProfile.id },
		});
		const activityRows = [
			{
				type: "COURSE_ENROLLED",
				description: `Enrolled in ${path.title}.`,
				offset: -25,
			},
			{
				type: "LESSON_COMPLETED",
				description: `Completed ${PATH_MODULE_TITLES[0]}.`,
				offset: -18,
			},
			{
				type: "ASSIGNMENT_SUBMITTED",
				description: `Submitted ${ASSIGNMENT_TEMPLATES[0].title}.`,
				offset: -14,
			},
			{
				type: "LESSON_COMPLETED",
				description: `Completed ${PATH_MODULE_TITLES[1]}.`,
				offset: -10,
			},
			{
				type: "ASSIGNMENT_SUBMITTED",
				description: `Submitted ${ASSIGNMENT_TEMPLATES[1].title}.`,
				offset: -6,
			},
		];
		for (const act of activityRows) {
			await prisma.studentActivity.create({
				data: {
					studentId: studentProfile.id,
					type: act.type,
					description: act.description,
					createdAt: addDays(today, act.offset),
				},
			});
		}

		// Award two achievements to most students; the latecomer gets one.
		const awardTitles =
			s === studentsInBatch.length - 1
				? ["First submission"]
				: ["First submission", "Early bird"];
		for (const title of awardTitles) {
			const achievementId = achievementMap[title];
			if (!achievementId) continue;
			await prisma.userAchievement.upsert({
				where: {
					studentId_achievementId: {
						studentId: studentProfile.id,
						achievementId,
					},
				},
				update: {},
				create: {
					studentId: studentProfile.id,
					achievementId,
				},
			});
		}
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	// 1. Roles -------------------------------------------------------------------
	console.log("Seeding roles...");
	const roleMap = {}; // { roleName → roleId }
	for (const role of ROLE_DEFS) {
		const r = await prisma.role.upsert({
			where: { name: role.name },
			update: { description: role.description },
			create: role,
		});
		roleMap[r.name] = r.id;
	}

	// 2. Courses -----------------------------------------------------------------
	console.log("Seeding courses...");
	for (const course of courses) {
		await prisma.course.upsert({
			where: { slug: course.slug },
			update: {
				title: course.title,
				shortDescription: course.shortDescription,
				description: course.description,
				bannerImage: course.bannerImage ?? null,
				enrollmentStatus: course.enrollmentStatus,
				price: course.price ?? 0,
				startsAt: course.startsAt ? new Date(course.startsAt) : null,
				endDate: course.endDate ? new Date(course.endDate) : null,
			},
			create: {
				slug: course.slug,
				title: course.title,
				shortDescription: course.shortDescription,
				description: course.description,
				bannerImage: course.bannerImage ?? null,
				enrollmentStatus: course.enrollmentStatus,
				price: course.price ?? 0,
				startsAt: course.startsAt ? new Date(course.startsAt) : null,
				endDate: course.endDate ? new Date(course.endDate) : null,
			},
		});
	}

	// Grab two courses for batch seeding (same course is used if only one exists).
	const availableCourses = await prisma.course.findMany({
		take: 2,
		orderBy: { createdAt: "asc" },
	});
	if (availableCourses.length === 0) {
		throw new Error(
			"No courses found after seeding — courses.data.js may be empty",
		);
	}
	const courseForLahore = availableCourses[0];
	const courseForKarachi = availableCourses[1] ?? availableCourses[0];

	// 3. Institutions ------------------------------------------------------------
	console.log("Seeding institutions...");
	const institutionMap = {}; // { key → institution }
	for (const def of INSTITUTION_DEFS) {
		institutionMap[def.key] = await findOrCreateInstitution(def);
		console.log(`  ${def.name}`);
	}

	// 4. Users, profiles, and role assignments -----------------------------------
	console.log("Seeding users...");
	const userMap = {}; // { email → { user, profile } }

	for (const def of USER_DEFS) {
		const passwordHash = await bcrypt.hash(def.password, 10);
		const institutionId = def.institutionKey
			? institutionMap[def.institutionKey].id
			: null;

		const user = await prisma.user.upsert({
			where: { email: def.email },
			update: { fullName: def.fullName, passwordHash },
			create: {
				fullName: def.fullName,
				email: def.email,
				passwordHash,
				isEmailVerified: true,
				status: "ACTIVE",
			},
		});

		// institutionId is null for SUPER_ADMIN (intentional global scope).
		// All other roles must have institutionId set so requireOperationalAccess passes.
		await assignRole(user.id, roleMap[def.role], institutionId);

		let profile = null;

		if (def.role === "STUDENT") {
			profile = await prisma.studentProfile.upsert({
				where: { userId: user.id },
				update: { enrollmentNumber: def.enrollmentNumber },
				create: { userId: user.id, enrollmentNumber: def.enrollmentNumber },
			});
		}

		if (def.role === "TRAINER") {
			profile = await prisma.trainerProfile.upsert({
				where: { userId: user.id },
				update: {
					specialization: def.specialization ?? null,
					experienceYears: def.experienceYears ?? null,
				},
				create: {
					userId: user.id,
					specialization: def.specialization ?? null,
					experienceYears: def.experienceYears ?? null,
				},
			});
		}

		if (def.role === "ADMIN") {
			await prisma.adminProfile.upsert({
				where: { userId: user.id },
				update: { designation: def.designation ?? null },
				create: { userId: user.id, designation: def.designation ?? null },
			});
		}

		// INSTITUTION_COORDINATOR and SUPER_ADMIN have no dedicated profile model.

		userMap[def.email] = { user, profile };
		console.log(
			`  ${def.email}  [${def.role}${institutionId ? ` @ ${def.institutionKey}` : " — global"}]`,
		);
	}

	// 5. Batches -----------------------------------------------------------------
	console.log("Seeding batches...");
	const lahoreBatch = await findOrCreateBatch({
		name: "Full Stack Bootcamp — Batch A",
		institutionId: institutionMap.lahore.id,
		courseId: courseForLahore.id,
		startDate: "2026-01-06",
	});
	console.log(`  Lahore batch: ${lahoreBatch.name}`);

	const karachiBatch = await findOrCreateBatch({
		name: "Full Stack Bootcamp — Batch A",
		institutionId: institutionMap.karachi.id,
		courseId: courseForKarachi.id,
		startDate: "2026-02-03",
	});
	console.log(`  Karachi batch: ${karachiBatch.name}`);

	// 6. Trainer → batch assignments ---------------------------------------------
	// BatchTrainer.trainerId references TrainerProfile.id, not User.id.
	console.log("Assigning trainers to batches...");
	for (const def of USER_DEFS.filter((u) => u.role === "TRAINER")) {
		const batch = def.institutionKey === "lahore" ? lahoreBatch : karachiBatch;
		const profile = userMap[def.email].profile; // TrainerProfile
		if (!profile) continue;

		await prisma.batchTrainer.upsert({
			where: {
				batchId_trainerId: { batchId: batch.id, trainerId: profile.id },
			},
			update: {},
			create: { batchId: batch.id, trainerId: profile.id },
		});
		console.log(`  ${def.email} → ${def.institutionKey} batch`);
	}

	// 7. Student → batch enrollment (via StudentProfile.currentBatchId) ---------
	console.log("Enrolling students into batches...");
	for (const def of USER_DEFS.filter((u) => u.role === "STUDENT")) {
		const batch = def.institutionKey === "lahore" ? lahoreBatch : karachiBatch;
		await prisma.studentProfile.update({
			where: { userId: userMap[def.email].user.id },
			data: { currentBatchId: batch.id },
		});
		console.log(`  ${def.email} → ${def.institutionKey} batch`);
	}

	// 8. Operational data ─────────────────────────────────────────────────────
	// Achievements first (global catalogue), then per-batch path/modules/
	// assignments/assessments/attendance/announcements, then per-student
	// streak/goals/activities/awards. Each step is deterministic and safe to
	// re-run (delete-then-create at the batch grain).
	console.log("Seeding achievements catalogue...");
	const achievementMap = await seedAchievementCatalogue();

	const batchSeedJobs = [
		{ batch: lahoreBatch, institutionKey: "lahore" },
		{ batch: karachiBatch, institutionKey: "karachi" },
	];
	for (const job of batchSeedJobs) {
		const studentsInBatch = USER_DEFS.filter(
			(u) => u.role === "STUDENT" && u.institutionKey === job.institutionKey,
		).map((u) => userMap[u.email]);
		const trainersInBatch = USER_DEFS.filter(
			(u) => u.role === "TRAINER" && u.institutionKey === job.institutionKey,
		).map((u) => userMap[u.email]);
		console.log(`Seeding operational data for ${job.batch.name}...`);
		await seedBatchOperationalData(
			job.batch,
			studentsInBatch,
			trainersInBatch,
			achievementMap,
		);
	}

	// ---------------------------------------------------------------------------
	// Credential summary
	// ---------------------------------------------------------------------------
	console.log("\n========== Seed Completed ==========");
	console.log("Dev accounts (all passwords: [FirstName]@TechSeekho2026)\n");
	console.log("SUPER_ADMIN (global)");
	console.log("  superadmin@techseekho.dev          Ahmad@TechSeekho2026\n");
	console.log("TechSeekho Academy Lahore");
	console.log(
		"  admin.lahore@techseekho.dev         Zara@TechSeekho2026   [ADMIN]",
	);
	console.log(
		"  coordinator.lahore@techseekho.dev   Hamza@TechSeekho2026  [INSTITUTION_COORDINATOR]",
	);
	console.log(
		"  trainer1.lahore@techseekho.dev      Faisal@TechSeekho2026 [TRAINER]",
	);
	console.log(
		"  trainer2.lahore@techseekho.dev      Sana@TechSeekho2026   [TRAINER]",
	);
	console.log(
		"  student1.lahore@techseekho.dev      Ali@TechSeekho2026    [STUDENT] LHR-2026-001",
	);
	console.log(
		"  student2.lahore@techseekho.dev      Ayesha@TechSeekho2026 [STUDENT] LHR-2026-002",
	);
	console.log(
		"  student3.lahore@techseekho.dev      Bilal@TechSeekho2026  [STUDENT] LHR-2026-003",
	);
	console.log(
		"  student4.lahore@techseekho.dev      Fatima@TechSeekho2026 [STUDENT] LHR-2026-004\n",
	);
	console.log("TechSeekho Academy Karachi");
	console.log(
		"  admin.karachi@techseekho.dev        Omar@TechSeekho2026   [ADMIN]",
	);
	console.log(
		"  coordinator.karachi@techseekho.dev  Nadia@TechSeekho2026  [INSTITUTION_COORDINATOR]",
	);
	console.log(
		"  trainer.karachi@techseekho.dev      Tariq@TechSeekho2026  [TRAINER]",
	);
	console.log(
		"  student1.karachi@techseekho.dev     Maryam@TechSeekho2026 [STUDENT] KHI-2026-001",
	);
	console.log(
		"  student2.karachi@techseekho.dev     Usman@TechSeekho2026  [STUDENT] KHI-2026-002",
	);
	console.log(
		"  student3.karachi@techseekho.dev     Sobia@TechSeekho2026  [STUDENT] KHI-2026-003",
	);
	console.log("\n=====================================");
}

main()
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
