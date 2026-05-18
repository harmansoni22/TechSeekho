import prisma from "../config/db.js";

import { AppError } from "../utils/appError.js";

import {
	assertCanAccessBatch,
	assertCanManageBatch,
	getStudentProfileOrThrow,
	getTrainerProfileOrThrow,
	isPrivileged,
} from "./access.service.js";

const assessmentInclude = {
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

async function getBatchOrThrow(
	batchId
) {
	const batch =
		await prisma.batch.findUnique({
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

export async function listAssessments(
	user,
	filters = {}
) {
	const where = {};

	// Explicit batch validation
	if (filters.batchId) {
		await assertCanAccessBatch(
			user,
			filters.batchId
		);

		where.batchId =
			filters.batchId;
	}

	if (filters.courseId) {
		where.courseId =
			filters.courseId;
	}

	if (filters.status) {
		where.status =
			filters.status;
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

		where.status =
			"PUBLISHED";
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
					trainerId:
						trainer.id,
				},

				select: {
					batchId: true,
				},
			});

		where.batchId = {
			in: batchLinks.map(
				(link) =>
					link.batchId
			),
		};
	}

	return prisma.assessment.findMany({
		where,

		include:
			assessmentInclude,

		orderBy: [
			{ dueDate: "asc" },
			{ createdAt: "desc" },
				],
	});
}

export async function getAssessment(
	user,
	id
) {
	const assessment =
		await prisma.assessment.findUnique({
			where: { id },

			include: {
				...assessmentInclude,

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

	if (!assessment) {
		throw new AppError(
			"Assessment not found",
			404
		);
	}

	await assertCanAccessBatch(
		user,
		assessment.batchId
	);

	// Students only see published assessments
	if (
		user.roles.includes("STUDENT") &&
		!isPrivileged(user)
	) {
		if (
			assessment.status !==
			"PUBLISHED"
		) {
			throw new AppError(
				"Assessment is not available",
				403
			);
		}

		const student =
			await getStudentProfileOrThrow(
				user.id
			);

		return {
			...assessment,

			submissions:
				assessment.submissions.filter(
					(submission) =>
						submission.studentId ===
						student.id
				),
		};
	}

	return assessment;
}

export async function createAssessment(
	user,
	payload
) {
	const {
		title,
		description,
		type,
		status,
		batchId,
		courseId,
		maxScore,
		startsAt,
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

	// NEVER trust institution ownership from client
	const batch =
		await getBatchOrThrow(
			batchId
		);

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

	return prisma.assessment.create({
		data: {
			title,

			description:
				description || null,

			type:
				type || "QUIZ",

			status:
				status || "DRAFT",

			batchId,

			courseId,

			// Server-derived ownership
			institutionId:
				batch.institutionId,

			createdById:
				trainer.id,

			maxScore:
				Number.isInteger(
					maxScore
				)
					? maxScore
					: 100,

			startsAt:
				startsAt
					? new Date(
							startsAt
					  )
					: null,

			dueDate:
				dueDate
					? new Date(
							dueDate
					  )
					: null,
		},

		include:
			assessmentInclude,
	});
}

export async function updateAssessment(
	user,
	id,
	payload
) {
	const assessment =
		await prisma.assessment.findUnique({
			where: { id },

			select: {
				batchId: true,
			},
		});

	if (!assessment) {
		throw new AppError(
			"Assessment not found",
			404
		);
	}

	await assertCanManageBatch(
		user,
		assessment.batchId
	);

	return prisma.assessment.update({
		where: { id },

		data: {
			title: payload.title,

			description:
				payload.description,

			type: payload.type,

			status: payload.status,

			maxScore:
				payload.maxScore,

			startsAt:
				payload.startsAt
					? new Date(
							payload.startsAt
					  )
					: undefined,

			dueDate:
				payload.dueDate
					? new Date(
							payload.dueDate
					  )
					: undefined,
		},

		include:
			assessmentInclude,
	});
}

export async function submitAssessment(
	user,
	assessmentId,
	payload
) {
	const assessment =
		await prisma.assessment.findUnique({
			where: {
				id: assessmentId,
			},

			select: {
				id: true,
				batchId: true,
				status: true,
				startsAt: true,
				dueDate: true,
			},
		});

	if (!assessment) {
		throw new AppError(
			"Assessment not found",
			404
		);
	}

	if (
		assessment.status !==
		"PUBLISHED"
	) {
		throw new AppError(
			"Assessment is not open for submission",
			403
		);
	}

	const now = new Date();

	if (
		assessment.startsAt &&
		assessment.startsAt > now
	) {
		throw new AppError(
			"Assessment has not started",
			403
		);
	}

	if (
		assessment.dueDate &&
		assessment.dueDate < now
	) {
		throw new AppError(
			"Assessment deadline has passed",
			403
		);
	}

	const student =
		await getStudentProfileOrThrow(
			user.id
		);

	if (
		student.currentBatchId !==
		assessment.batchId
	) {
		throw new AppError(
			"Assessment is not available for this student",
			403
		);
	}

	return prisma.assessmentSubmission.upsert({
		where: {
			assessmentId_studentId:
				{
					assessmentId,

					studentId:
						student.id,
				},
		},

		update: {
			answers:
				payload.answers ??
				undefined,

			submittedAt:
				new Date(),
		},

		create: {
			assessmentId,

			studentId:
				student.id,

			answers:
				payload.answers ??
				null,

			submittedAt:
				new Date(),
		},
	});
}

export async function reviewAssessmentSubmission(
	user,
	submissionId,
	payload
) {
	const submission =
		await prisma.assessmentSubmission.findUnique(
			{
				where: {
					id: submissionId,
				},

				include: {
					assessment: {
						select: {
							batchId: true,
							maxScore: true,
						},
					},
				},
			}
		);

	if (!submission) {
		throw new AppError(
			"Assessment submission not found",
			404
		);
	}

	await assertCanManageBatch(
		user,
		submission.assessment.batchId
	);

	if (
		payload.score !==
			undefined &&
		(payload.score < 0 ||
			payload.score >
				submission.assessment
					.maxScore)
	) {
		throw new AppError(
			"Score is outside the assessment range",
			400
		);
	}

	return prisma.assessmentSubmission.update(
		{
			where: {
				id: submissionId,
			},

			data: {
				score:
					payload.score,

				feedback:
					payload.feedback ||
					null,

				reviewedAt:
					new Date(),
			},
		}
	);
}
