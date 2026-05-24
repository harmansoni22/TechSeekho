import { z } from "zod";

/**
 * Centralized request schemas.
 *
 * Keep each schema small and feature-aligned. Avoid schema gymnastics here —
 * these are perimeter checks, not domain rules. Domain invariants stay in
 * the service layer (institution scoping, role checks, transitions).
 */

const cuidLike = z.string().min(1).max(64);

const trimmedString = (max) =>
	z
		.string()
		.transform((s) => s.trim())
		.refine((s) => s.length > 0 && s.length <= max, {
			message: `must be 1–${max} characters`,
		});

const optionalTrimmed = (max) =>
	z
		.string()
		.transform((s) => s.trim())
		.refine((s) => s.length <= max, { message: `max ${max} characters` })
		.transform((s) => (s.length === 0 ? null : s))
		.nullable()
		.optional();

const isoDate = z
	.string()
	.refine((s) => !Number.isNaN(new Date(s).getTime()), {
		message: "must be a valid ISO date",
	});

// ---- AUTH ----

const otpDigits = z.string().regex(/^\d{4,8}$/, "must be a 4–8 digit OTP");
const passwordField = z.string().min(8).max(128);

export const registerRequestOtpSchema = z.object({
	fullName: trimmedString(120),
	email: z.string().email().optional(),
	phone: z.string().min(8).max(20).optional(),
	password: passwordField,
});

export const registerVerifyOtpSchema = registerRequestOtpSchema.extend({
	otp: otpDigits,
});

export const loginRequestOtpSchema = z.object({
	identifier: trimmedString(255),
	password: z.string().min(1).max(128),
	useMobile: z.boolean().optional(),
});

export const loginVerifyOtpSchema = loginRequestOtpSchema.extend({
	otp: otpDigits,
});

export const oauthLoginSchema = z.object({
	provider: z.enum(["google", "github", "Google", "GitHub"]),
	providerAccountId: trimmedString(255),
	email: z.string().email(),
	fullName: trimmedString(255),
	avatarUrl: z.string().url().max(2_048).optional(),
	idToken: z.string().min(8).max(8_192).optional(),
	accessToken: z.string().min(8).max(8_192).optional(),
});

// ---- INSTITUTIONS ----

const institutionTypes = z.enum(["SCHOOL", "COLLEGE", "GOVERNMENT", "PRIVATE"]);

export const createInstitutionSchema = z.object({
	name: trimmedString(255),
	type: institutionTypes,
	city: optionalTrimmed(120),
	state: optionalTrimmed(120),
	address: optionalTrimmed(500),
	contactEmail: z.string().email().max(255).optional().nullable(),
	contactPhone: optionalTrimmed(40),
	isActive: z.boolean().optional(),
});

export const updateInstitutionSchema = z.object({
	name: trimmedString(255).optional(),
	type: institutionTypes.optional(),
	city: optionalTrimmed(120),
	state: optionalTrimmed(120),
	address: optionalTrimmed(500),
	contactEmail: z
		.union([z.string().email().max(255), z.literal(""), z.null()])
		.optional(),
	contactPhone: optionalTrimmed(40),
	isActive: z.boolean().optional(),
});

// ---- BATCHES ----

export const createBatchSchema = z.object({
	name: trimmedString(120),
	institutionId: cuidLike,
	courseId: cuidLike,
	startDate: isoDate,
	endDate: isoDate.optional(),
	isActive: z.boolean().optional(),
});

export const updateBatchSchema = z.object({
	name: trimmedString(120).optional(),
	startDate: isoDate.optional(),
	endDate: isoDate.optional(),
	isActive: z.boolean().optional(),
});

export const assignTrainerSchema = z.object({
	trainerId: cuidLike,
});

export const assignStudentSchema = z.object({
	studentId: cuidLike,
});

// ---- ATTENDANCE ----

const attendanceStatus = z.enum(["PRESENT", "ABSENT", "LATE"]);

export const markAttendanceSchema = z.object({
	batchId: cuidLike,
	studentId: cuidLike,
	date: isoDate.optional(),
	status: attendanceStatus,
});

export const bulkAttendanceSchema = z.object({
	batchId: cuidLike,
	date: isoDate.optional(),
	records: z
		.array(
			z.object({
				studentId: cuidLike,
				status: attendanceStatus,
			}),
		)
		.min(1)
		.max(500),
});

export const attendanceQuerySchema = z.object({
	batchId: cuidLike.optional(),
	studentId: cuidLike.optional(),
	date: isoDate.optional(),
	limit: z.coerce.number().int().min(1).max(500).optional(),
});

// ---- ASSIGNMENTS ----

export const createAssignmentSchema = z.object({
	title: trimmedString(255),
	description: optionalTrimmed(5_000),
	batchId: cuidLike,
	courseId: cuidLike,
	dueDate: isoDate.optional(),
});

// Submission payloads — submissionText is bounded; fileUrl is validated
// separately against the trusted-host allowlist in services.
export const submitAssignmentSchema = z
	.object({
		submissionText: optionalTrimmed(20_000),
		fileUrl: z.string().url().max(2_048).optional().nullable(),
	})
	.refine(
		(v) => Boolean(v.submissionText) || Boolean(v.fileUrl),
		{ message: "submissionText or fileUrl is required" },
	);

export const reviewSubmissionSchema = z
	.object({
		feedback: optionalTrimmed(5_000),
		score: z.union([z.number(), z.string(), z.null()]).optional(),
		maxScore: z.union([z.number(), z.string()]).optional(),
	})
	.transform((v) => ({
		...v,
		score:
			v.score === null || v.score === undefined || v.score === ""
				? null
				: Number(v.score),
		maxScore:
			v.maxScore === undefined || v.maxScore === ""
				? undefined
				: Number(v.maxScore),
	}));

// ---- ANNOUNCEMENTS ----

export const createAnnouncementSchema = z.object({
	title: trimmedString(255),
	content: trimmedString(10_000),
	batchId: cuidLike,
});

// ---- UPLOADS ----

export const presignUploadSchema = z.object({
	kind: z.enum(["SUBMISSION", "AVATAR"]),
	filename: trimmedString(255),
	contentType: trimmedString(120),
	sizeBytes: z.coerce.number().int().min(1),
});
