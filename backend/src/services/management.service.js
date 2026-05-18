import prisma from "../config/db.js";

import { AppError } from "../utils/appError.js";

import {
	assertCanAccessBatch,
	assertCanManageBatch,
	isPrivileged,
} from "./access.service.js";

function isSuperAdmin(user) {
	return user.roles.includes(
		"SUPER_ADMIN"
	);
}

function isInstitutionAdmin(user) {
	return user.roles.includes(
		"ADMIN"
	);
}

function isCoordinator(user) {
	return user.roles.includes(
		"INSTITUTION_COORDINATOR"
	);
}

function requireInstitutionManager(
	user
) {
	if (
		isSuperAdmin(user) ||
		isInstitutionAdmin(user) ||
		isCoordinator(user)
	) {
		return;
	}

	throw new AppError(
		"Insufficient permissions",
		403
	);
}

function getAccessibleInstitutionIds(
	user
) {
	return (
		user.roleAssignments || []
	)
		.map(
			(assignment) =>
				assignment.institutionId
		)
		.filter(Boolean);
}

async function assertInstitutionAccess(
	user,
	institutionId
) {
	if (isSuperAdmin(user)) {
		return;
	}

	const accessibleInstitutionIds =
		getAccessibleInstitutionIds(
			user
		);

	if (
		!accessibleInstitutionIds.includes(
			institutionId
		)
	) {
		throw new AppError(
			"Institution access denied",
			403
		);
	}
}

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

export async function listInstitutions(
	user
) {
	requireInstitutionManager(
		user
	);

	// Super admin sees all
	if (isSuperAdmin(user)) {
		return prisma.institution.findMany({
			orderBy: {
				createdAt: "desc",
			},

			include: {
				batches: {
					select: {
						id: true,
						name: true,
						courseId: true,
					},
				},
			},
		});
	}

	const institutionIds =
		getAccessibleInstitutionIds(
			user
		);

	return prisma.institution.findMany({
		where: {
			id: {
				in: institutionIds,
			},
		},

		orderBy: {
			createdAt: "desc",
		},

		include: {
			batches: {
				select: {
					id: true,
					name: true,
					courseId: true,
				},
			},
		},
	});
}

export async function createInstitution(
	user,
	payload
) {
	if (!isSuperAdmin(user)) {
		throw new AppError(
			"Only super admins can create institutions",
			403
		);
	}

	if (
		!payload.name ||
		!payload.type
	) {
		throw new AppError(
			"Institution name and type are required",
			400
		);
	}

	return prisma.institution.create({
		data: {
			name: payload.name,

			type: payload.type,

			city:
				payload.city || null,

			state:
				payload.state || null,

			address:
				payload.address ||
				null,

			contactEmail:
				payload.contactEmail ||
				null,

			contactPhone:
				payload.contactPhone ||
				null,

			isActive:
				payload.isActive ??
				true,
		},
	});
}

export async function updateInstitution(
	user,
	id,
	payload
) {
	await assertInstitutionAccess(
		user,
		id
	);

	return prisma.institution.update({
		where: { id },

		data: {
			name: payload.name,

			type: payload.type,

			city: payload.city,

			state: payload.state,

			address:
				payload.address,

			contactEmail:
				payload.contactEmail,

			contactPhone:
				payload.contactPhone,

			isActive:
				payload.isActive,
		},
	});
}

export async function listBatches(
	user,
	filters = {}
) {
	const where = {};

	// Institution filtering
	if (filters.institutionId) {
		await assertInstitutionAccess(
			user,
			filters.institutionId
		);

		where.institutionId =
			filters.institutionId;
	}

	if (filters.courseId) {
		where.courseId =
			filters.courseId;
	}

	// Trainer scope
	if (
		!isPrivileged(user) &&
		user.roles.includes(
			"TRAINER"
		)
	) {
		const trainer =
			await prisma.trainerProfile.findUnique(
				{
					where: {
						userId: user.id,
					},

					select: {
						id: true,
					},
				}
			);

		if (!trainer) {
			return [];
		}

		where.trainers = {
			some: {
				trainerId:
					trainer.id,
			},
		};
	}

	// Student scope
	if (
		!isPrivileged(user) &&
		user.roles.includes(
			"STUDENT"
		)
	) {
		const student =
			await prisma.studentProfile.findUnique(
				{
					where: {
						userId: user.id,
					},

					select: {
						currentBatchId:
							true,
					},
				}
			);

		if (
			!student?.currentBatchId
		) {
			return [];
		}

		where.id =
			student.currentBatchId;
	}

	// Institution-scoped admin/coordinator
	if (
		!isSuperAdmin(user) &&
		(isInstitutionAdmin(
			user
		) ||
			isCoordinator(user))
	) {
		const institutionIds =
			getAccessibleInstitutionIds(
				user
			);

		where.institutionId = {
			in: institutionIds,
		};
	}

	return prisma.batch.findMany({
		where,

		include: {
			course: {
				select: {
					id: true,
					slug: true,
					title: true,
				},
			},

			institution: {
				select: {
					id: true,
					name: true,
				},
			},

			_count: {
				select: {
					students: true,
					trainers: true,
				},
			},
		},

		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function createBatch(
	user,
	payload
) {
	requireInstitutionManager(
		user
	);

	if (
		!payload.name ||
		!payload.institutionId ||
		!payload.courseId ||
		!payload.startDate
	) {
		throw new AppError(
			"name, institutionId, courseId, and startDate are required",
			400
		);
	}

	await assertInstitutionAccess(
		user,
		payload.institutionId
	);

	return prisma.batch.create({
		data: {
			name: payload.name,

			institutionId:
				payload.institutionId,

			courseId:
				payload.courseId,

			startDate:
				new Date(
					payload.startDate
				),

			endDate:
				payload.endDate
					? new Date(
							payload.endDate
					  )
					: null,

			isActive:
				payload.isActive ??
				true,
		},
	});
}

export async function updateBatch(
	user,
	id,
	payload
) {
	await assertCanManageBatch(
		user,
		id
	);

	return prisma.batch.update({
		where: { id },

		data: {
			name: payload.name,

			startDate:
				payload.startDate
					? new Date(
							payload.startDate
					  )
					: undefined,

			endDate:
				payload.endDate
					? new Date(
							payload.endDate
					  )
					: undefined,

			isActive:
				payload.isActive,
		},
	});
}

export async function assignTrainerToBatch(
	user,
	batchId,
	trainerId
) {
	requireInstitutionManager(
		user
	);

	const batch =
		await getBatchOrThrow(
			batchId
		);

	await assertInstitutionAccess(
		user,
		batch.institutionId
	);

	return prisma.batchTrainer.upsert({
		where: {
			batchId_trainerId: {
				batchId,
				trainerId,
			},
		},

		update: {},

		create: {
			batchId,
			trainerId,
		},
	});
}

export async function assignStudentToBatch(
	user,
	batchId,
	studentId
) {
	requireInstitutionManager(
		user
	);

	const batch =
		await getBatchOrThrow(
			batchId
		);

	await assertInstitutionAccess(
		user,
		batch.institutionId
	);

	return prisma.studentProfile.update({
		where: { id: studentId },

		data: {
			currentBatchId:
				batchId,
		},
	});
}

export async function listAnnouncements(
	user,
	filters = {}
) {
	if (filters.batchId) {
		await assertCanAccessBatch(
			user,
			filters.batchId
		);
	}

	return prisma.announcement.findMany({
		where: filters.batchId
			? {
					batchId:
						filters.batchId,
			  }
			: {},

		include: {
			batch: {
				select: {
					id: true,
					name: true,
				},
			},

			author: {
				select: {
					id: true,
					fullName: true,
				},
			},
		},

		orderBy: {
			createdAt: "desc",
		},

		take: filters.limit
			? Math.min(
					Number(
						filters.limit
					),
					100
			  )
			: 100,
	});
}

export async function createAnnouncement(
	user,
	payload
) {
	if (
		!payload.title ||
		!payload.content ||
		!payload.batchId
	) {
		throw new AppError(
			"title, content, and batchId are required",
			400
		);
	}

	await assertCanManageBatch(
		user,
		payload.batchId
	);

	const batch =
		await getBatchOrThrow(
			payload.batchId
		);

	return prisma.announcement.create({
		data: {
			title: payload.title,

			content:
				payload.content,

			batchId:
				payload.batchId,

			// NEVER trust client ownership
			institutionId:
				batch.institutionId,

			authorId: user.id,
		},
	});
}
