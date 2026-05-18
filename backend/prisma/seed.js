import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
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
	{ name: "SUPER_ADMIN",          description: "Full platform access" },
	{ name: "ADMIN",                description: "Institution management access" },
	{ name: "TRAINER",              description: "Trainer access" },
	{ name: "INSTITUTE_CORDINATOR", description: "Institute Coordinator access" },
	{ name: "STUDENT",              description: "Student access" },
];

const INSTITUTION_DEFS = [
	{
		key:          "lahore",
		name:         "TechSeekho Academy Lahore",
		type:         "COLLEGE",
		city:         "Lahore",
		state:        "Punjab",
		contactEmail: "lahore@techseekho.com",
		contactPhone: "+924235901234",
	},
	{
		key:          "karachi",
		name:         "TechSeekho Academy Karachi",
		type:         "COLLEGE",
		city:         "Karachi",
		state:        "Sindh",
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
		fullName:       "Ahmad Karimi",
		email:          "superadmin@techseekho.dev",
		password:       "Ahmad@TechSeekho2026",
		role:           "SUPER_ADMIN",
		institutionKey: null,
	},

	// ── TechSeekho Academy Lahore ─────────────────────────────────────────────
	{
		fullName:       "Zara Noor",
		email:          "admin.lahore@techseekho.dev",
		password:       "Zara@TechSeekho2026",
		role:           "ADMIN",
		institutionKey: "lahore",
		designation:    "Campus Director",
	},
	{
		fullName:       "Hamza Butt",
		email:          "coordinator.lahore@techseekho.dev",
		password:       "Hamza@TechSeekho2026",
		role:           "INSTITUTE_CORDINATOR",
		institutionKey: "lahore",
	},
	{
		fullName:        "Faisal Khan",
		email:           "trainer1.lahore@techseekho.dev",
		password:        "Faisal@TechSeekho2026",
		role:            "TRAINER",
		institutionKey:  "lahore",
		specialization:  "Full Stack Development",
		experienceYears: 5,
	},
	{
		fullName:        "Sana Riaz",
		email:           "trainer2.lahore@techseekho.dev",
		password:        "Sana@TechSeekho2026",
		role:            "TRAINER",
		institutionKey:  "lahore",
		specialization:  "Data Science & AI",
		experienceYears: 4,
	},
	{
		fullName:         "Ali Hassan",
		email:            "student1.lahore@techseekho.dev",
		password:         "Ali@TechSeekho2026",
		role:             "STUDENT",
		institutionKey:   "lahore",
		enrollmentNumber: "LHR-2026-001",
	},
	{
		fullName:         "Ayesha Malik",
		email:            "student2.lahore@techseekho.dev",
		password:         "Ayesha@TechSeekho2026",
		role:             "STUDENT",
		institutionKey:   "lahore",
		enrollmentNumber: "LHR-2026-002",
	},
	{
		fullName:         "Bilal Ahmed",
		email:            "student3.lahore@techseekho.dev",
		password:         "Bilal@TechSeekho2026",
		role:             "STUDENT",
		institutionKey:   "lahore",
		enrollmentNumber: "LHR-2026-003",
	},
	{
		fullName:         "Fatima Javed",
		email:            "student4.lahore@techseekho.dev",
		password:         "Fatima@TechSeekho2026",
		role:             "STUDENT",
		institutionKey:   "lahore",
		enrollmentNumber: "LHR-2026-004",
	},

	// ── TechSeekho Academy Karachi ────────────────────────────────────────────
	{
		fullName:       "Omar Siddiq",
		email:          "admin.karachi@techseekho.dev",
		password:       "Omar@TechSeekho2026",
		role:           "ADMIN",
		institutionKey: "karachi",
		designation:    "Campus Director",
	},
	{
		fullName:       "Nadia Iqbal",
		email:          "coordinator.karachi@techseekho.dev",
		password:       "Nadia@TechSeekho2026",
		role:           "INSTITUTE_CORDINATOR",
		institutionKey: "karachi",
	},
	{
		fullName:        "Tariq Hussain",
		email:           "trainer.karachi@techseekho.dev",
		password:        "Tariq@TechSeekho2026",
		role:            "TRAINER",
		institutionKey:  "karachi",
		specialization:  "Cloud & DevOps",
		experienceYears: 6,
	},
	{
		fullName:         "Maryam Shah",
		email:            "student1.karachi@techseekho.dev",
		password:         "Maryam@TechSeekho2026",
		role:             "STUDENT",
		institutionKey:   "karachi",
		enrollmentNumber: "KHI-2026-001",
	},
	{
		fullName:         "Usman Ali",
		email:            "student2.karachi@techseekho.dev",
		password:         "Usman@TechSeekho2026",
		role:             "STUDENT",
		institutionKey:   "karachi",
		enrollmentNumber: "KHI-2026-002",
	},
	{
		fullName:         "Sobia Farooq",
		email:            "student3.karachi@techseekho.dev",
		password:         "Sobia@TechSeekho2026",
		role:             "STUDENT",
		institutionKey:   "karachi",
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
				name:         def.name,
				type:         def.type,
				city:         def.city,
				state:        def.state,
				contactEmail: def.contactEmail,
				contactPhone: def.contactPhone,
				isActive:     true,
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
				isActive:  true,
			},
		});
	}
	return batch;
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
			where:  { name: role.name },
			update: { description: role.description },
			create: role,
		});
		roleMap[r.name] = r.id;
	}

	// 2. Courses -----------------------------------------------------------------
	console.log("Seeding courses...");
	for (const course of courses) {
		await prisma.course.upsert({
			where:  { slug: course.slug },
			update: {
				title:            course.title,
				shortDescription: course.shortDescription,
				description:      course.description,
				bannerImage:      course.bannerImage ?? null,
				enrollmentStatus: course.enrollmentStatus,
				price:            course.price ?? 0,
				startsAt:         course.startsAt ? new Date(course.startsAt) : null,
				endDate:          course.endDate  ? new Date(course.endDate)  : null,
			},
			create: {
				slug:             course.slug,
				title:            course.title,
				shortDescription: course.shortDescription,
				description:      course.description,
				bannerImage:      course.bannerImage ?? null,
				enrollmentStatus: course.enrollmentStatus,
				price:            course.price ?? 0,
				startsAt:         course.startsAt ? new Date(course.startsAt) : null,
				endDate:          course.endDate  ? new Date(course.endDate)  : null,
			},
		});
	}

	// Grab two courses for batch seeding (same course is used if only one exists).
	const availableCourses = await prisma.course.findMany({
		take:    2,
		orderBy: { createdAt: "asc" },
	});
	if (availableCourses.length === 0) {
		throw new Error("No courses found after seeding — courses.data.js may be empty");
	}
	const courseForLahore  = availableCourses[0];
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
		const passwordHash  = await bcrypt.hash(def.password, 10);
		const institutionId = def.institutionKey
			? institutionMap[def.institutionKey].id
			: null;

		const user = await prisma.user.upsert({
			where:  { email: def.email },
			update: { fullName: def.fullName, passwordHash },
			create: {
				fullName:        def.fullName,
				email:           def.email,
				passwordHash,
				isEmailVerified: true,
				status:          "ACTIVE",
			},
		});

		// institutionId is null for SUPER_ADMIN (intentional global scope).
		// All other roles must have institutionId set so requireOperationalAccess passes.
		await assignRole(user.id, roleMap[def.role], institutionId);

		let profile = null;

		if (def.role === "STUDENT") {
			profile = await prisma.studentProfile.upsert({
				where:  { userId: user.id },
				update: { enrollmentNumber: def.enrollmentNumber },
				create: { userId: user.id, enrollmentNumber: def.enrollmentNumber },
			});
		}

		if (def.role === "TRAINER") {
			profile = await prisma.trainerProfile.upsert({
				where:  { userId: user.id },
				update: {
					specialization:  def.specialization  ?? null,
					experienceYears: def.experienceYears ?? null,
				},
				create: {
					userId:          user.id,
					specialization:  def.specialization  ?? null,
					experienceYears: def.experienceYears ?? null,
				},
			});
		}

		if (def.role === "ADMIN") {
			await prisma.adminProfile.upsert({
				where:  { userId: user.id },
				update: { designation: def.designation ?? null },
				create: { userId: user.id, designation: def.designation ?? null },
			});
		}

		// INSTITUTE_CORDINATOR and SUPER_ADMIN have no dedicated profile model.

		userMap[def.email] = { user, profile };
		console.log(
			`  ${def.email}  [${def.role}${institutionId ? ` @ ${def.institutionKey}` : " — global"}]`,
		);
	}

	// 5. Batches -----------------------------------------------------------------
	console.log("Seeding batches...");
	const lahoreBatch = await findOrCreateBatch({
		name:          "Full Stack Bootcamp — Batch A",
		institutionId: institutionMap.lahore.id,
		courseId:      courseForLahore.id,
		startDate:     "2026-01-06",
	});
	console.log(`  Lahore batch: ${lahoreBatch.name}`);

	const karachiBatch = await findOrCreateBatch({
		name:          "Full Stack Bootcamp — Batch A",
		institutionId: institutionMap.karachi.id,
		courseId:      courseForKarachi.id,
		startDate:     "2026-02-03",
	});
	console.log(`  Karachi batch: ${karachiBatch.name}`);

	// 6. Trainer → batch assignments ---------------------------------------------
	// BatchTrainer.trainerId references TrainerProfile.id, not User.id.
	console.log("Assigning trainers to batches...");
	for (const def of USER_DEFS.filter((u) => u.role === "TRAINER")) {
		const batch   = def.institutionKey === "lahore" ? lahoreBatch : karachiBatch;
		const profile = userMap[def.email].profile; // TrainerProfile
		if (!profile) continue;

		await prisma.batchTrainer.upsert({
			where:  { batchId_trainerId: { batchId: batch.id, trainerId: profile.id } },
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
			data:  { currentBatchId: batch.id },
		});
		console.log(`  ${def.email} → ${def.institutionKey} batch`);
	}

	// ---------------------------------------------------------------------------
	// Credential summary
	// ---------------------------------------------------------------------------
	console.log("\n========== Seed Completed ==========");
	console.log("Dev accounts (all passwords: [FirstName]@TechSeekho2026)\n");
	console.log("SUPER_ADMIN (global)");
	console.log("  superadmin@techseekho.dev          Ahmad@TechSeekho2026\n");
	console.log("TechSeekho Academy Lahore");
	console.log("  admin.lahore@techseekho.dev         Zara@TechSeekho2026   [ADMIN]");
	console.log("  coordinator.lahore@techseekho.dev   Hamza@TechSeekho2026  [INSTITUTE_CORDINATOR]");
	console.log("  trainer1.lahore@techseekho.dev      Faisal@TechSeekho2026 [TRAINER]");
	console.log("  trainer2.lahore@techseekho.dev      Sana@TechSeekho2026   [TRAINER]");
	console.log("  student1.lahore@techseekho.dev      Ali@TechSeekho2026    [STUDENT] LHR-2026-001");
	console.log("  student2.lahore@techseekho.dev      Ayesha@TechSeekho2026 [STUDENT] LHR-2026-002");
	console.log("  student3.lahore@techseekho.dev      Bilal@TechSeekho2026  [STUDENT] LHR-2026-003");
	console.log("  student4.lahore@techseekho.dev      Fatima@TechSeekho2026 [STUDENT] LHR-2026-004\n");
	console.log("TechSeekho Academy Karachi");
	console.log("  admin.karachi@techseekho.dev        Omar@TechSeekho2026   [ADMIN]");
	console.log("  coordinator.karachi@techseekho.dev  Nadia@TechSeekho2026  [INSTITUTE_CORDINATOR]");
	console.log("  trainer.karachi@techseekho.dev      Tariq@TechSeekho2026  [TRAINER]");
	console.log("  student1.karachi@techseekho.dev     Maryam@TechSeekho2026 [STUDENT] KHI-2026-001");
	console.log("  student2.karachi@techseekho.dev     Usman@TechSeekho2026  [STUDENT] KHI-2026-002");
	console.log("  student3.karachi@techseekho.dev     Sobia@TechSeekho2026  [STUDENT] KHI-2026-003");
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
