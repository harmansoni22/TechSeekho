import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { hashPassword, verifyPassword } from "../utils/auth.js";

export async function getAllUsers(user, { page = 1, limit = 50 } = {}) {
	const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
	const currentPage = Math.max(Number(page) || 1, 1);
	const skip = (currentPage - 1) * take;

	const where = {};

	if (!user.roles.includes("SUPER_ADMIN")) {
		const institutionIds = (user.roleAssignments || [])
			.map((a) => a.institutionId)
			.filter(Boolean);

		if (institutionIds.length === 0) {
			return { users: [], total: 0, page: currentPage, limit: take };
		}

		where.roleAssignments = {
			some: { institutionId: { in: institutionIds } },
		};
	}

	const [rows, total] = await prisma.$transaction([
		prisma.user.findMany({
			where,
			select: {
				id: true,
				fullName: true,
				email: true,
				phone: true,
				status: true,
				isEmailVerified: true,
				isPhoneVerified: true,
				createdAt: true,
				roleAssignments: {
					select: {
						role: {
							select: {
								name: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take,
		}),
		prisma.user.count({ where }),
	]);

	return {
		users: rows.map((u) => ({
			id: u.id,
			name: u.fullName,
			email: u.email,
			phone: u.phone,
			status: u.status,
			isEmailVerified: u.isEmailVerified,
			isPhoneVerified: u.isPhoneVerified,
			createdAt: u.createdAt,
			roles: u.roleAssignments.map((ra) => ra.role.name),
		})),
		total,
		page: currentPage,
		limit: take,
	};
}

export async function findUserByEmail(email) {
	return prisma.user.findUnique({
		where: { email },
		include: {
			roleAssignments: {
				include: {
					role: true,
				},
			},
		},
	});
}

export async function findUserByPhone(phone) {
	return prisma.user.findUnique({
		where: { phone },
		include: {
			roleAssignments: {
				include: {
					role: true,
				},
			},
		},
	});
}

export async function findUserById(id) {
	const user = await prisma.user.findUnique({
		where: { id },
		select: {
			id: true,
			fullName: true,
			email: true,
			phone: true,
			status: true,
			isEmailVerified: true,
			isPhoneVerified: true,
			createdAt: true,
			roleAssignments: {
				select: {
					role: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	});

	if (!user) return null;

	return {
		id: user.id,
		name: user.fullName,
		email: user.email,
		phone: user.phone,
		status: user.status,
		isEmailVerified: user.isEmailVerified,
		isPhoneVerified: user.isPhoneVerified,
		createdAt: user.createdAt,
		roles: user.roleAssignments.map((ra) => ra.role.name),
	};
}

export async function createUser(
	{ fullName, email, phone, password, verifiedContactType },
	tx,
) {
	const client = tx ?? prisma;

	const existingEmailUser = email
		? await client.user.findUnique({ where: { email } })
		: null;
	if (existingEmailUser) {
		throw new AppError("User with this email already exists", 409);
	}

	const existingPhoneUser = phone
		? await client.user.findUnique({ where: { phone } })
		: null;
	if (existingPhoneUser) {
		throw new AppError("User with this phone number already exists", 409);
	}

	const passwordHash = await hashPassword(password);

	const studentRole = await client.role.findUnique({
		where: { name: "STUDENT" },
	});

	if (!studentRole) {
		throw new AppError("STUDENT role not found", 500);
	}

	const user = await client.user.create({
		data: {
			fullName,
			email,
			phone,
			passwordHash,
			isEmailVerified: verifiedContactType === "EMAIL",
			isPhoneVerified: verifiedContactType === "PHONE",
			status: "ACTIVE",
			studentProfile: {
				create: {},
			},
			roleAssignments: {
				create: {
					roleId: studentRole.id,
				},
			},
		},
		select: {
			id: true,
			fullName: true,
			email: true,
			phone: true,
			status: true,
			isEmailVerified: true,
			isPhoneVerified: true,
			createdAt: true,
			roleAssignments: {
				select: {
					role: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	});

	return {
		id: user.id,
		name: user.fullName,
		email: user.email,
		phone: user.phone,
		status: user.status,
		isEmailVerified: user.isEmailVerified,
		isPhoneVerified: user.isPhoneVerified,
		createdAt: user.createdAt,
		roles: user.roleAssignments.map((ra) => ra.role.name),
	};
}

export async function authenticateUser(
	identifier,
	password,
	useMobile = false,
) {
	const user = useMobile
		? await findUserByPhone(identifier)
		: await findUserByEmail(identifier);

	if (!user) {
		throw new AppError("Invalid credentials", 401);
	}

	const isValidPassword = await verifyPassword(password, user.passwordHash);
	if (!isValidPassword) {
		throw new AppError("Invalid credentials", 401);
	}

	if (user.status !== "ACTIVE") {
		throw new AppError("Account is not active", 403);
	}

	return {
		id: user.id,
		name: user.fullName,
		email: user.email,
		phone: user.phone,
		roles: user.roleAssignments.map((ra) => ra.role.name),
		status: user.status,
	};
}
