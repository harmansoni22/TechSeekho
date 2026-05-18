import prisma from "../config/db.js";

import { AppError } from "../utils/appError.js";

import {
	assertCanAccessBatch,
	assertCanManageBatch,
	getStudentProfileOrThrow,
	isPrivileged,
} from "./access.service.js";

function startOfDay(value) {
	const date = value
		? new Date(value)
		: new Date();

	if (
		Number.isNaN(date.getTime())
	) {
		throw new AppError(
			"Invalid date",
			400
		);
	}

	date.setHours(0, 0, 0, 0);

	return date;
}

async function getStudentOrThrow(
	studentId
) {
	const student =
		await prisma.studentProfile.findUnique({
			where: { id: studentId },

			select: {
				id: true,
				currentBatchId: true,
			},
		});

	if (!student) {
		throw new AppError(
			"Student not found",
			404
		);
	}

	return student;
}

export async function listAttendance(
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

	// Explicit date normalization
	if (filters.date) {
		where.date = startOfDay(
			filters.date
		);
	}

	// STUDENT scope
	if (
		user.roles.includes("STUDENT") &&
		!isPrivileged(user)
	) {
		const student =
			await getStudentProfileOrThrow(
				user.id
			);

		where.studentId = student.id;
	}

	// Non-student filtered queries
	else if (filters.studentId) {
		const student =
			await getStudentOrThrow(
				filters.studentId
			);

		// Prevent cross-batch visibility
		if (
			filters.batchId &&
			student.currentBatchId !==
				filters.batchId
		) {
			throw new AppError(
				"Student does not belong to this batch",
				403
			);
		}

		where.studentId =
			filters.studentId;
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

		orderBy: [
			{ date: "desc" },
			{ markedAt: "desc" },
		],

		take: filters.limit
			? Math.min(
					Number(filters.limit),
					100
			  )
			: 100,
	});
}

export async function markAttendance(
	user,
	payload
) {
	const {
		batchId,
		studentId,
		date,
		status,
	} = payload;

	if (
		!batchId ||
		!studentId ||
		!status
	) {
		throw new AppError(
			"batchId, studentId, and status are required",
			400
		);
	}

	await assertCanManageBatch(
		user,
		batchId
	);

	const student =
		await getStudentOrThrow(
			studentId
		);

	if (
		student.currentBatchId !==
		batchId
	) {
		throw new AppError(
			"Student is not assigned to this batch",
			400
		);
	}

	return prisma.attendance.upsert({
		where: {
			batchId_studentId_date: {
				batchId,

				studentId,

				date: startOfDay(date),
			},
		},

		update: {
			status,

			markedAt: new Date(),
		},

		create: {
			batchId,

			studentId,

			date: startOfDay(date),

			status,
		},
	});
}

export async function bulkMarkAttendance(
	user,
	payload
) {
	const {
		batchId,
		date,
		records,
	} = payload;

	if (
		!batchId ||
		!Array.isArray(records) ||
		records.length === 0
	) {
		throw new AppError(
			"batchId and attendance records are required",
			400
		);
	}

	await assertCanManageBatch(
		user,
		batchId
	);

	const attendanceDate =
		startOfDay(date);

	// Validate ALL students belong to batch
	const studentIds = records.map(
		(record) => record.studentId
	);

	const students =
		await prisma.studentProfile.findMany({
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

	const invalidStudent =
		students.find(
			(student) =>
				student.currentBatchId !==
				batchId
		);

	if (invalidStudent) {
		throw new AppError(
			"One or more students are not assigned to this batch",
			400
		);
	}

	return prisma.$transaction(
		records.map((record) =>
			prisma.attendance.upsert({
				where: {
					batchId_studentId_date:
						{
							batchId,

							studentId:
								record.studentId,

							date:
								attendanceDate,
						},
				},

				update: {
					status: record.status,

					markedAt:
						new Date(),
				},

				create: {
					batchId,

					studentId:
						record.studentId,

					date:
						attendanceDate,

					status:
						record.status,
				},
			})
		)
	);
}
