import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { validateFileUrl } from "../utils/fileUrl.js";

import {
	assertCanAccessBatch,
	assertCanManageBatch,
	getStudentProfileOrThrow,
	getTrainerProfileOrThrow,
	isPrivileged,
} from "./access.service.js";
import { audit } from "./audit.service.js";

const assignmentInclude = {
	batch: {
		select: {
			id: true,
			name: true,
			institutionId: true,
		},
	},

	course: {
		select: {
			id: true,
			slug: true,
			title: true,
		},
	},

	createdBy: {
		select: {
			id: true,

			user: {
				select: {
					id: true,
					fullName: true,
					email: true,
				},
			},
		},
	},
};

async function getBatchOrThrow(batchId) {
	const batch = await prisma.batch.findUnique({
		where: { id: batchId },

		select: {
			id: true,
			institutionId: true,
		},
	});

	if (!batch) {
		throw new AppError(
			"Batch not found",
			404
		);
	}

	return batch;
}

export async function listAssignments(
	user,
	filters = {}
) {
	const where = {};

	// Explicit batch access validation
	if (filters.batchId) {
		await assertCanAccessBatch(
			user,
			filters.batchId
		);

		where.batchId = filters.batchId;
	}

	if (filters.courseId) {
		where.courseId = filters.courseId;
	}

	// Student scope
	if (
		user.roles.includes("STUDENT") &&
		!isPrivileged(user)
	) {
		const student =
			await getStudentProfileOrThrow(
				user.id
			);

		if (!student.currentBatchId) {
			return [];
		}

		where.batchId =
			student.currentBatchId;
	}

	// Trainer scope
	if (
		user.roles.includes("TRAINER") &&
		!isPrivileged(user)
	) {
		const trainer =
			await getTrainerProfileOrThrow(
				user.id
			);

		const batchLinks =
			await prisma.batchTrainer.findMany({
				where: {
					trainerId: trainer.id,
				},

				select: {
					batchId: true,
				},
			});

		where.batchId = {
			in: batchLinks.map(
				(link) => link.batchId
			),
		};
	}

	return prisma.assignment.findMany({
		where,

		include: assignmentInclude,

		orderBy: [
			{ dueDate: "asc" },
			{ createdAt: "desc" },
		],
	});
}

export async function getAssignment(
	user,
	id
) {
	const assignment =
		await prisma.assignment.findUnique({
			where: { id },

			include: {
				...assignmentInclude,

				submissions: {
					include: {
						student: {
							include: {
								user: {
									select: {
										id: true,
										fullName: true,
										email: true,
									},
								},
							},
						},
					},
				},
			},
		});

	if (!assignment) {
		throw new AppError(
			"Assignment not found",
			404
		);
	}

	await assertCanAccessBatch(
		user,
		assignment.batchId
	);

	// Students can only see their own submissions
	if (
		user.roles.includes("STUDENT") &&
		!isPrivileged(user)
	) {
		const student =
			await getStudentProfileOrThrow(
				user.id
			);

		return {
			...assignment,

			submissions:
				assignment.submissions.filter(
					(submission) =>
						submission.studentId ===
						student.id
				),
		};
	}

	return assignment;
}

export async function createAssignment(
	user,
	payload
) {
	const {
		title,
		description,
		batchId,
		courseId,
		dueDate,
	} = payload;

	if (
		!title ||
		!batchId ||
		!courseId
	) {
		throw new AppError(
			"Title, batchId, and courseId are required",
			400
		);
	}

	await assertCanManageBatch(
		user,
		batchId
	);

	// NEVER trust institutionId from client
	const batch =
		await getBatchOrThrow(batchId);

	const trainer =
		user.roles.includes("TRAINER")
			? await getTrainerProfileOrThrow(
					user.id
			  )
			: payload.createdById
				? await prisma.trainerProfile.findUnique(
						{
							where: {
								id: payload.createdById,
							},
						}
				  )
				: null;

	if (!trainer) {
		throw new AppError(
			"A valid trainer profile is required",
			400
		);
	}

	return prisma.assignment.create({
		data: {
			title,

			description:
				description || null,

			batchId,

			courseId,

			// Server-derived ownership
			institutionId:
				batch.institutionId,

			createdById: trainer.id,

			dueDate: dueDate
				? new Date(dueDate)
				: null,
		},

		include: assignmentInclude,
	});
}

export async function submitAssignment(
	user,
	assignmentId,
	payload
) {
	const assignment =
		await prisma.assignment.findUnique({
			where: { id: assignmentId },

			select: {
				id: true,
				batchId: true,
				institutionId: true,
			},
		});

	if (!assignment) {
		throw new AppError(
			"Assignment not found",
			404
		);
	}

	const student =
		await getStudentProfileOrThrow(
			user.id
		);

	if (
		student.currentBatchId !==
		assignment.batchId
	) {
		throw new AppError(
			"Assignment is not available for this student",
			403
		);
	}

	if (!payload.submissionText && !payload.fileUrl) {
		throw new AppError(
			"submissionText or fileUrl is required",
			400,
		);
	}

	// Reject arbitrary external URLs. validateFileUrl returns null on empty
	// input and throws on anything that isn't on the trusted-host allowlist.
	const safeFileUrl = validateFileUrl(payload.fileUrl);

	return prisma.submission.upsert({
		where: {
			assignmentId_studentId: {
				assignmentId,
				studentId: student.id,
			},
		},
		update: {
			submissionText: payload.submissionText || null,
			fileUrl: safeFileUrl,
			status: "SUBMITTED",
			submittedAt: new Date(),
		},
		create: {
			assignmentId,
			studentId: student.id,
			// NEVER trust payload ownership
			institutionId: assignment.institutionId,
			submissionText: payload.submissionText || null,
			fileUrl: safeFileUrl,
			status: "SUBMITTED",
			submittedAt: new Date(),
		},
	});
}

export async function reviewSubmission(
	user,
	submissionId,
	payload
) {
	const submission = await prisma.submission.findUnique({
		where: { id: submissionId },
		select: {
			id: true,
			status: true,
			score: true,
			assignmentId: true,
			studentId: true,
			institutionId: true,
			assignment: { select: { batchId: true } },
		},
	});

	if (!submission) {
		throw new AppError("Submission not found", 404);
	}

	await assertCanManageBatch(user, submission.assignment.batchId);

	const maxScore =
		typeof payload.maxScore === "number" && payload.maxScore > 0
			? Math.floor(payload.maxScore)
			: 100;

	let score = null;
	if (payload.score !== undefined && payload.score !== null && payload.score !== "") {
		const parsed = Number(payload.score);
		if (!Number.isFinite(parsed) || parsed < 0) {
			throw new AppError("score must be a non-negative number", 400);
		}
		if (parsed > maxScore) {
			throw new AppError(
				`score cannot exceed maxScore (${maxScore})`,
				400,
			);
		}
		score = Math.floor(parsed);
	}

	const updated = await prisma.submission.update({
		where: { id: submissionId },
		data: {
			status: "REVIEWED",
			feedback: payload.feedback?.trim() || null,
			score,
			maxScore,
			reviewedAt: new Date(),
		},
		include: {
			student: {
				include: {
					user: {
						select: { id: true, fullName: true, email: true },
					},
				},
			},
			assignment: {
				select: { id: true, title: true, batchId: true },
			},
		},
	});

	audit({
		actor: user,
		action:
			submission.status === "REVIEWED"
				? "submission.re_review"
				: "submission.review",
		entityType: "Submission",
		entityId: submissionId,
		institutionId: submission.institutionId ?? null,
		metadata: {
			assignmentId: submission.assignmentId,
			studentId: submission.studentId,
			previousStatus: submission.status,
			previousScore: submission.score ?? null,
			nextScore: score,
			maxScore,
		},
	});

	return updated;
}

export async function listSubmissionsForReview(user, filters = {}) {
	// Only trainers/admins/coordinators should reach this endpoint (enforced
	// by the route). Scope the result to batches the caller can manage.
	const where = {};

	if (filters.assignmentId) {
		const assignment = await prisma.assignment.findUnique({
			where: { id: filters.assignmentId },
			select: { batchId: true },
		});
		if (!assignment) {
			throw new AppError("Assignment not found", 404);
		}
		await assertCanManageBatch(user, assignment.batchId);
		where.assignmentId = filters.assignmentId;
	} else if (filters.batchId) {
		await assertCanManageBatch(user, filters.batchId);
		where.assignment = { batchId: filters.batchId };
	} else if (user.roles.includes("TRAINER") && !isPrivileged(user)) {
		// Default: a trainer sees submissions only for their assigned batches.
		const trainer = await getTrainerProfileOrThrow(user.id);
		const batchLinks = await prisma.batchTrainer.findMany({
			where: { trainerId: trainer.id },
			select: { batchId: true },
		});
		where.assignment = {
			batchId: { in: batchLinks.map((b) => b.batchId) },
		};
	} else if (!isPrivileged(user)) {
		// ADMIN / COORDINATOR — scope to their institutions.
		const institutionIds = (user.roleAssignments || [])
			.map((a) => a.institutionId)
			.filter(Boolean);
		if (institutionIds.length === 0) return [];
		where.institutionId = { in: institutionIds };
	}

	if (filters.status) {
		where.status = filters.status;
	}

	return prisma.submission.findMany({
		where,
		include: {
			assignment: {
				select: {
					id: true,
					title: true,
					dueDate: true,
					batch: { select: { id: true, name: true } },
				},
			},
			student: {
				include: {
					user: {
						select: { id: true, fullName: true, email: true },
					},
				},
			},
		},
		orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
		take: filters.limit ? Math.min(Number(filters.limit), 200) : 200,
	});
}
