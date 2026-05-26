import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";

export function isSuperAdmin(user) {
	return user.roles.includes("SUPER_ADMIN");
}

export function isAdmin(user) {
	return user.roles.includes("ADMIN");
}

export function isCoordinator(user) {
	return user.roles.includes("INSTITUTION_COORDINATOR");
}

export function isPrivileged(user) {
	return isSuperAdmin(user);
}

export async function getStudentProfileOrThrow(userId) {
	const student = await prisma.studentProfile.findUnique({
		where: { userId },
	});

	if (!student) {
		throw new AppError("Student profile not found", 404);
	}

	return student;
}

export async function getTrainerProfileOrThrow(userId) {
	const trainer = await prisma.trainerProfile.findUnique({
		where: { userId },
	});

	if (!trainer) {
		throw new AppError("Trainer profile not found", 404);
	}

	return trainer;
}

async function getBatchOrThrow(batchId) {
	const batch = await prisma.batch.findUnique({
		where: { id: batchId },
		select: {
			id: true,
			institutionId: true,
		},
	});

	if (!batch) {
		throw new AppError("Batch not found", 404);
	}

	return batch;
}

function userHasInstitutionAccess(user, institutionId) {
	return (user.roleAssignments || []).some(
		(assignment) => assignment.institutionId === institutionId,
	);
}

export async function assertCanAccessBatch(user, batchId) {
	const batch = await getBatchOrThrow(batchId);

	// Super admin bypass
	if (isSuperAdmin(user)) {
		return true;
	}

	// Institution-scoped admin or coordinator
	if (
		(isAdmin(user) || isCoordinator(user)) &&
		userHasInstitutionAccess(user, batch.institutionId)
	) {
		return true;
	}

	// Trainer assigned to batch
	if (user.roles.includes("TRAINER")) {
		const trainer = await getTrainerProfileOrThrow(user.id);

		const assignment = await prisma.batchTrainer.findUnique({
			where: {
				batchId_trainerId: {
					batchId,
					trainerId: trainer.id,
				},
			},
		});

		if (assignment) {
			return true;
		}
	}

	// Student belongs to batch
	if (user.roles.includes("STUDENT")) {
		const student = await getStudentProfileOrThrow(user.id);

		if (student.currentBatchId === batchId) {
			return true;
		}
	}

	throw new AppError("Insufficient batch permissions", 403);
}

export async function assertCanManageBatch(user, batchId) {
	const batch = await getBatchOrThrow(batchId);

	// Super admin bypass.
	if (isSuperAdmin(user)) return true;

	// Institution-scoped admin (NOT coordinator — coordinator is projection-only).
	if (isAdmin(user) && userHasInstitutionAccess(user, batch.institutionId)) {
		return true;
	}

	// Trainer assigned to batch.
	if (user.roles.includes("TRAINER")) {
		const trainer = await getTrainerProfileOrThrow(user.id);
		const assignment = await prisma.batchTrainer.findUnique({
			where: {
				batchId_trainerId: { batchId, trainerId: trainer.id },
			},
		});
		if (assignment) return true;
	}

	throw new AppError("Insufficient batch management permissions", 403);
}
