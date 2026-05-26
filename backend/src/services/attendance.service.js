import prisma from "../config/db.js";

import { AppError } from "../utils/appError.js";

import {
	assertCanAccessBatch,
	assertCanManageBatch,
	getStudentProfileOrThrow,
	isPrivileged,
} from "./access.service.js";
import { audit } from "./audit.service.js";

function startOfDay(value) {
	const date = value ? new Date(value) : new Date();

	if (Number.isNaN(date.getTime())) {
		throw new AppError("Invalid date", 400);
	}

	date.setHours(0, 0, 0, 0);

	return date;
}

async function getStudentOrThrow(studentId) {
	const student = await prisma.studentProfile.findUnique({
		where: { id: studentId },

		select: {
			id: true,
			currentBatchId: true,
		},
	});

	if (!student) {
		throw new AppError("Student not found", 404);
	}

	return student;
}

export async function listAttendance(user, filters = {}) {
	const where = {};

	// Explicit batch validation
	if (filters.batchId) {
		await assertCanAccessBatch(user, filters.batchId);

		where.batchId = filters.batchId;
	}

	// Explicit date normalization
	if (filters.date) {
		where.date = startOfDay(filters.date);
	}

	// STUDENT scope
	if (user.roles.includes("STUDENT") && !isPrivileged(user)) {
		const student = await getStudentProfileOrThrow(user.id);

		where.studentId = student.id;
	}

	// Non-student filtered queries. The caller MUST pass batchId so we can
	// authorize via batch membership — querying by studentId alone would let
	// any trainer/admin reach across institutions.
	else if (filters.studentId) {
		if (!filters.batchId) {
			throw new AppError("batchId is required when querying by studentId", 400);
		}

		const student = await getStudentOrThrow(filters.studentId);

		if (student.currentBatchId !== filters.batchId) {
			throw new AppError("Student does not belong to this batch", 403);
		}

		where.studentId = filters.studentId;
	}

	return prisma.attendance.findMany({
		where,

		include: {
			batch: {
				select: {
					id: true,
					name: true,
				},
			},

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

		orderBy: [{ date: "desc" }, { markedAt: "desc" }],

		take: filters.limit ? Math.min(Number(filters.limit), 100) : 100,
	});
}

export async function markAttendance(user, payload) {
	const { batchId, studentId, date, status } = payload;

	if (!batchId || !studentId || !status) {
		throw new AppError("batchId, studentId, and status are required", 400);
	}

	await assertCanManageBatch(user, batchId);

	const student = await getStudentOrThrow(studentId);

	if (student.currentBatchId !== batchId) {
		throw new AppError("Student is not assigned to this batch", 400);
	}

	const day = startOfDay(date);
	const existing = await prisma.attendance.findUnique({
		where: {
			batchId_studentId_date: { batchId, studentId, date: day },
		},
		select: { id: true, status: true },
	});

	const record = await prisma.attendance.upsert({
		where: {
			batchId_studentId_date: { batchId, studentId, date: day },
		},
		update: { status, markedAt: new Date() },
		create: { batchId, studentId, date: day, status },
	});

	const batchInfo = await prisma.batch.findUnique({
		where: { id: batchId },
		select: { institutionId: true },
	});

	audit({
		actor: user,
		action: existing ? "attendance.update" : "attendance.mark",
		entityType: "Attendance",
		entityId: record.id,
		institutionId: batchInfo?.institutionId ?? null,
		metadata: {
			batchId,
			studentId,
			date: day.toISOString(),
			previousStatus: existing?.status ?? null,
			nextStatus: status,
		},
	});

	return record;
}

export async function bulkMarkAttendance(user, payload) {
	const { batchId, date, records } = payload;

	if (!batchId || !Array.isArray(records) || records.length === 0) {
		throw new AppError("batchId and attendance records are required", 400);
	}

	await assertCanManageBatch(user, batchId);

	const attendanceDate = startOfDay(date);

	// Validate ALL students belong to batch
	const studentIds = records.map((record) => record.studentId);

	const students = await prisma.studentProfile.findMany({
		where: {
			id: {
				in: studentIds,
			},
		},

		select: {
			id: true,
			currentBatchId: true,
		},
	});

	const invalidStudent = students.find(
		(student) => student.currentBatchId !== batchId,
	);

	if (invalidStudent) {
		throw new AppError(
			"One or more students are not assigned to this batch",
			400,
		);
	}

	const result = await prisma.$transaction(
		records.map((record) =>
			prisma.attendance.upsert({
				where: {
					batchId_studentId_date: {
						batchId,
						studentId: record.studentId,
						date: attendanceDate,
					},
				},
				update: { status: record.status, markedAt: new Date() },
				create: {
					batchId,
					studentId: record.studentId,
					date: attendanceDate,
					status: record.status,
				},
			}),
		),
	);

	const batchInfo = await prisma.batch.findUnique({
		where: { id: batchId },
		select: { institutionId: true },
	});

	audit({
		actor: user,
		action: "attendance.bulk_mark",
		entityType: "Attendance",
		entityId: null,
		institutionId: batchInfo?.institutionId ?? null,
		metadata: {
			batchId,
			date: attendanceDate.toISOString(),
			recordCount: records.length,
			// Summary only — never store the full records array.
			byStatus: records.reduce((acc, r) => {
				acc[r.status] = (acc[r.status] || 0) + 1;
				return acc;
			}, {}),
		},
	});

	return result;
}
