import prisma from "../config/db.js";

import { AppError } from "../utils/appError.js";

import {
	assertCanAccessBatch,
	assertCanManageBatch,
	isPrivileged,
} from "./access.service.js";
import { audit } from "./audit.service.js";

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

export async function updateInstitution(user, id, payload) {
	await assertInstitutionAccess(user, id);

	const before = await prisma.institution.findUnique({
		where: { id },
		select: {
			name: true,
			type: true,
			city: true,
			state: true,
			isActive: true,
			contactEmail: true,
			contactPhone: true,
		},
	});

	if (!before) {
		throw new AppError("Institution not found", 404);
	}

	const updated = await prisma.institution.update({
		where: { id },
		data: {
			name: payload.name,
			type: payload.type,
			city: payload.city,
			state: payload.state,
			address: payload.address,
			contactEmail: payload.contactEmail,
			contactPhone: payload.contactPhone,
			isActive: payload.isActive,
		},
	});

	// Diff only fields that changed; never store the full payload.
	const changes = {};
	for (const key of Object.keys(payload)) {
		if (before[key] !== undefined && before[key] !== updated[key]) {
			changes[key] = { before: before[key], after: updated[key] };
		}
	}

	audit({
		actor: user,
		action:
			before.isActive !== updated.isActive
				? updated.isActive
					? "institution.activate"
					: "institution.deactivate"
				: "institution.update",
		entityType: "Institution",
		entityId: id,
		institutionId: id,
		metadata: { changes },
	});

	return updated;
}

export async function getBatchDetail(user, batchId) {
	// Authorization: anyone who can access the batch can view its roster.
	// Mutations (assign/remove) re-validate separately.
	await assertCanAccessBatch(user, batchId);

	const batch = await prisma.batch.findUnique({
		where: { id: batchId },
		include: {
			course: { select: { id: true, slug: true, title: true } },
			institution: { select: { id: true, name: true } },
			trainers: {
				include: {
					trainer: {
						include: {
							user: {
								select: { id: true, fullName: true, email: true, phone: true },
							},
						},
					},
				},
			},
			students: {
				include: {
					user: {
						select: { id: true, fullName: true, email: true, phone: true },
					},
				},
				orderBy: { joinedAt: "desc" },
			},
		},
	});

	if (!batch) {
		throw new AppError("Batch not found", 404);
	}

	return batch;
}

export async function removeTrainerFromBatch(user, batchId, trainerId) {
	requireInstitutionManager(user);

	const batch = await getBatchOrThrow(batchId);
	await assertInstitutionAccess(user, batch.institutionId);

	const result = await prisma.batchTrainer.deleteMany({
		where: { batchId, trainerId },
	});

	if (result.count === 0) {
		throw new AppError("Trainer is not assigned to this batch", 404);
	}

	audit({
		actor: user,
		action: "batch.remove_trainer",
		entityType: "BatchTrainer",
		entityId: null,
		institutionId: batch.institutionId,
		metadata: { batchId, trainerId },
	});

	return { removed: true };
}

export async function removeStudentFromBatch(user, batchId, studentId) {
	requireInstitutionManager(user);

	const batch = await getBatchOrThrow(batchId);
	await assertInstitutionAccess(user, batch.institutionId);

	const student = await prisma.studentProfile.findUnique({
		where: { id: studentId },
		select: { id: true, currentBatchId: true },
	});

	if (!student) {
		throw new AppError("Student not found", 404);
	}
	if (student.currentBatchId !== batchId) {
		throw new AppError("Student is not assigned to this batch", 404);
	}

	return prisma.studentProfile.update({
		where: { id: studentId },
		data: { currentBatchId: null },
		select: { id: true, currentBatchId: true },
	});
}

export async function listInstitutionMembers(user, institutionId, role) {
	// Used by trainer/student pickers when assigning to a batch. We must
	// scope to institutions the caller can access — never reveal members
	// of an institution the caller is not part of.
	await assertInstitutionAccess(user, institutionId);

	const normalizedRole = String(role || "").toUpperCase();
	if (!["TRAINER", "STUDENT"].includes(normalizedRole)) {
		throw new AppError("role must be TRAINER or STUDENT", 400);
	}

	const users = await prisma.user.findMany({
		where: {
			status: "ACTIVE",
			roleAssignments: {
				some: {
					institutionId,
					role: { name: normalizedRole },
				},
			},
		},
		select: {
			id: true,
			fullName: true,
			email: true,
			phone: true,
			trainerProfile:
				normalizedRole === "TRAINER"
					? { select: { id: true, specialization: true } }
					: false,
			studentProfile:
				normalizedRole === "STUDENT"
					? {
						select: {
							id: true,
							enrollmentNumber: true,
							currentBatchId: true,
						},
					}
					: false,
		},
		orderBy: { fullName: "asc" },
	});

	return users.map((u) => ({
		userId: u.id,
		fullName: u.fullName,
		email: u.email,
		phone: u.phone,
		profileId:
			normalizedRole === "TRAINER"
				? u.trainerProfile?.id ?? null
				: u.studentProfile?.id ?? null,
		specialization: u.trainerProfile?.specialization ?? null,
		enrollmentNumber: u.studentProfile?.enrollmentNumber ?? null,
		currentBatchId: u.studentProfile?.currentBatchId ?? null,
	}));
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
	requireInstitutionManager(user);

	if (!trainerId) {
		throw new AppError("trainerId is required", 400);
	}

	const batch = await getBatchOrThrow(batchId);
	await assertInstitutionAccess(user, batch.institutionId);

	// Ensure the trainer belongs to (i.e. has a role assignment under) the
	// same institution as the batch. Without this check an institution admin
	// can rope a trainer from another institution into their batch.
	const trainer = await prisma.trainerProfile.findUnique({
		where: { id: trainerId },
		select: {
			id: true,
			user: {
				select: {
					roleAssignments: {
						select: { institutionId: true },
					},
				},
			},
		},
	});

	if (!trainer) {
		throw new AppError("Trainer not found", 404);
	}

	const trainerInstitutionIds = (trainer.user?.roleAssignments || [])
		.map((a) => a.institutionId)
		.filter(Boolean);

	if (!trainerInstitutionIds.includes(batch.institutionId)) {
		throw new AppError(
			"Trainer is not affiliated with this institution",
			403
		);
	}

	const link = await prisma.batchTrainer.upsert({
		where: {
			batchId_trainerId: { batchId, trainerId },
		},
		update: {},
		create: { batchId, trainerId },
	});

	audit({
		actor: user,
		action: "batch.assign_trainer",
		entityType: "BatchTrainer",
		entityId: link.id,
		institutionId: batch.institutionId,
		metadata: { batchId, trainerId },
	});

	return link;
}

export async function assignStudentToBatch(
	user,
	batchId,
	studentId
) {
	requireInstitutionManager(user);

	if (!studentId) {
		throw new AppError("studentId is required", 400);
	}

	const batch = await getBatchOrThrow(batchId);
	await assertInstitutionAccess(user, batch.institutionId);

	// Ensure the student belongs to the same institution as the batch.
	// Otherwise an institution admin could steal students from another
	// institution by silently moving them into one of their own batches.
	const student = await prisma.studentProfile.findUnique({
		where: { id: studentId },
		select: {
			id: true,
			currentBatch: { select: { institutionId: true } },
			user: {
				select: {
					roleAssignments: {
						select: { institutionId: true },
					},
				},
			},
		},
	});

	if (!student) {
		throw new AppError("Student not found", 404);
	}

	const studentInstitutionIds = new Set(
		[
			student.currentBatch?.institutionId,
			...(student.user?.roleAssignments || []).map((a) => a.institutionId),
		].filter(Boolean)
	);

	// Allow if super admin OR the student already has any link to the target
	// institution. A student with no institution at all (fresh signup) is also
	// allowed — onboarding flow.
	if (
		!isSuperAdmin(user) &&
		studentInstitutionIds.size > 0 &&
		!studentInstitutionIds.has(batch.institutionId)
	) {
		throw new AppError(
			"Student is not affiliated with this institution",
			403
		);
	}

	return prisma.studentProfile.update({
		where: { id: studentId },
		data: { currentBatchId: batchId },
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
