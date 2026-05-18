import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { getStudentProfileOrThrow, isPrivileged } from "./access.service.js";

export async function listLearningPaths(user, filters = {}) {
	const where = {};
	if (filters.courseId) where.courseId = filters.courseId;
	if (!isPrivileged(user) && user.roles.includes("STUDENT")) {
		where.isActive = true;
	}

	return prisma.learningPath.findMany({
		where,
		include: {
			course: { select: { id: true, slug: true, title: true } },
			modules: { orderBy: { order: "asc" } },
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function createLearningPath(user, payload) {
	if (!isPrivileged(user) && !user.roles.includes("TRAINER")) {
		throw new AppError("Insufficient permissions", 403);
	}

	const {
		title,
		description,
		courseId,
		institutionId,
		estimatedHours,
		difficulty,
	} = payload;
	if (!title || !courseId) {
		throw new AppError("Title and courseId are required", 400);
	}

	return prisma.learningPath.create({
		data: {
			title,
			description: description || null,
			courseId,
			institutionId: institutionId || null,
			estimatedHours: estimatedHours ?? null,
			difficulty: difficulty || null,
		},
		include: { modules: true },
	});
}

export async function createLearningModule(user, pathId, payload) {
	if (!isPrivileged(user) && !user.roles.includes("TRAINER")) {
		throw new AppError("Insufficient permissions", 403);
	}

	const path = await prisma.learningPath.findUnique({ where: { id: pathId } });
	if (!path) throw new AppError("Learning path not found", 404);

	if (!payload.title) throw new AppError("Module title is required", 400);

	const lastModule = await prisma.learningModule.findFirst({
		where: { pathId },
		orderBy: { order: "desc" },
		select: { order: true },
	});

	return prisma.learningModule.create({
		data: {
			title: payload.title,
			description: payload.description || null,
			pathId,
			order: payload.order ?? (lastModule?.order ?? 0) + 1,
			content: payload.content || null,
			videoUrl: payload.videoUrl || null,
			duration: payload.duration ?? null,
			isRequired: payload.isRequired ?? true,
		},
	});
}

export async function updateLearningModule(user, moduleId, payload) {
	if (!isPrivileged(user) && !user.roles.includes("TRAINER")) {
		throw new AppError("Insufficient permissions", 403);
	}

	const module = await prisma.learningModule.findUnique({
		where: { id: moduleId },
	});
	if (!module) throw new AppError("Learning module not found", 404);

	return prisma.learningModule.update({
		where: { id: moduleId },
		data: {
			title: payload.title,
			description: payload.description,
			order: payload.order,
			content: payload.content,
			videoUrl: payload.videoUrl,
			duration: payload.duration,
			isRequired: payload.isRequired,
		},
	});
}

export async function enrollInLearningPath(user, pathId) {
	const student = await getStudentProfileOrThrow(user.id);
	const path = await prisma.learningPath.findUnique({
		where: { id: pathId },
		include: { modules: true },
	});

	if (!path || !path.isActive) {
		throw new AppError("Learning path not found", 404);
	}

	return prisma.pathEnrollment.upsert({
		where: {
			studentId_pathId: {
				studentId: student.id,
				pathId,
			},
		},
		update: {},
		create: {
			studentId: student.id,
			pathId,
			moduleProgress: {
				create: path.modules.map((module) => ({
					moduleId: module.id,
					progress: 0,
				})),
			},
		},
		include: {
			path: { include: { modules: { orderBy: { order: "asc" } } } },
			moduleProgress: true,
		},
	});
}

export async function updateModuleProgressForUser(user, moduleId, progress) {
	const numericProgress = Number(progress);
	if (
		!Number.isFinite(numericProgress) ||
		numericProgress < 0 ||
		numericProgress > 100
	) {
		throw new AppError("Progress must be between 0 and 100", 400);
	}

	const student = await getStudentProfileOrThrow(user.id);
	const module = await prisma.learningModule.findUnique({
		where: { id: moduleId },
		select: { id: true, pathId: true, title: true },
	});
	if (!module) throw new AppError("Learning module not found", 404);

	const enrollment = await prisma.pathEnrollment.findUnique({
		where: {
			studentId_pathId: {
				studentId: student.id,
				pathId: module.pathId,
			},
		},
	});
	if (!enrollment)
		throw new AppError("Student is not enrolled in this path", 403);

	const savedProgress = await prisma.moduleProgress.upsert({
		where: {
			enrollmentId_moduleId: {
				enrollmentId: enrollment.id,
				moduleId,
			},
		},
		update: {
			progress: numericProgress,
			startedAt: numericProgress > 0 ? new Date() : undefined,
			completedAt: numericProgress >= 100 ? new Date() : null,
		},
		create: {
			enrollmentId: enrollment.id,
			moduleId,
			progress: numericProgress,
			startedAt: numericProgress > 0 ? new Date() : null,
			completedAt: numericProgress >= 100 ? new Date() : null,
		},
	});

	const modules = await prisma.learningModule.findMany({
		where: { pathId: module.pathId, isRequired: true },
		select: { id: true },
	});
	const progressRows = await prisma.moduleProgress.findMany({
		where: {
			enrollmentId: enrollment.id,
			moduleId: { in: modules.map((row) => row.id) },
		},
	});

	const total = progressRows.reduce((sum, row) => sum + row.progress, 0);
	const overallProgress = modules.length ? total / modules.length : 0;

	await prisma.pathEnrollment.update({
		where: { id: enrollment.id },
		data: {
			progress: overallProgress,
			completedAt: overallProgress >= 100 ? new Date() : null,
		},
	});

	if (numericProgress >= 100) {
		await prisma.studentActivity.create({
			data: {
				studentId: student.id,
				type: "LESSON_COMPLETED",
				description: `Completed module: ${module.title}`,
				metadata: { moduleId, enrollmentId: enrollment.id },
			},
		});
	}

	return savedProgress;
}
