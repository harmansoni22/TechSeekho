import prisma from "../config/db.js";

import { AppError } from "../utils/appError.js";

import { verifyToken } from "../utils/auth.js";

async function getActiveUser(decoded) {
	if (!decoded?.id) {
		return null;
	}

	const user =
		await prisma.user.findUnique({
			where: {
				id: decoded.id,
			},

			select: {
				id: true,

				fullName: true,

				email: true,
				phone: true,

				status: true,

				isEmailVerified: true,
				isPhoneVerified: true,

				roleAssignments: {
					select: {
						institutionId: true,

						role: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

	if (
		!user ||
		user.status !== "ACTIVE"
	) {
		return null;
	}

	// Deduplicate roles
	const roles = [
		...new Set(
			user.roleAssignments.map(
				(assignment) =>
					assignment.role.name
			)
		),
	];

	return {
		id: user.id,

		name: user.fullName,

		email: user.email,
		phone: user.phone,

		status: user.status,

		isEmailVerified:
			user.isEmailVerified,

		isPhoneVerified:
			user.isPhoneVerified,

		roles,

		roleAssignments:
			user.roleAssignments.map(
				(assignment) => ({
					role:
						assignment.role.name,

					institutionId:
						assignment.institutionId,
				})
			),
	};
}

function extractBearerToken(
	authHeader
) {
	if (!authHeader) {
		return null;
	}

	if (
		!authHeader.startsWith(
			"Bearer "
		)
	) {
		return null;
	}

	return authHeader.substring(7);
}

export async function authenticate(
	req,
	_res,
	next
) {
	try {
		const token =
			extractBearerToken(
				req.headers.authorization
			);

		if (!token) {
			throw new AppError(
				"Access token required",
				401
			);
		}

		const decoded =
			verifyToken(token);

		if (!decoded) {
			throw new AppError(
				"Invalid or expired token",
				401
			);
		}

		const user =
			await getActiveUser(
				decoded
			);

		if (!user) {
			throw new AppError(
				"Invalid, inactive, or expired session",
				401
			);
		}

		if (
			user.roles.length === 0
		) {
			throw new AppError(
				"No role is assigned to this account",
				403
			);
		}

		req.user = user;

		next();
	} catch (error) {
		next(error);
	}
}

export async function optionalAuth(
	req,
	_res,
	next
) {
	try {
		const token =
			extractBearerToken(
				req.headers.authorization
			);

		if (!token) {
			return next();
		}

		const decoded =
			verifyToken(token);

		if (!decoded) {
			return next();
		}

		req.user =
			await getActiveUser(
				decoded
			);

		next();
	} catch (error) {
		next(error);
	}
}

export function requireRole(
	...allowedRoles
) {
	return (
		req,
		_res,
		next
	) => {
		if (!req.user) {
			throw new AppError(
				"Authentication required",
				401
			);
		}

		const userRoles =
			req.user.roles || [];

		const hasRequiredRole =
			allowedRoles.some(
				(role) =>
					userRoles.includes(
						role
					)
			);

		if (!hasRequiredRole) {
			throw new AppError(
				"Insufficient permissions",
				403
			);
		}

		next();
	};
}

export const requireAnyRole =
	requireRole;

export function requireInstitutionScope(
	req,
	_res,
	next
) {
	if (!req.user) {
		throw new AppError(
			"Authentication required",
			401
		);
	}

	// Global bypass
	if (
		req.user.roles.includes(
			"SUPER_ADMIN"
		)
	) {
		return next();
	}

	const institutionId =
		req.params.institutionId ||
		req.body.institutionId ||
		req.query.institutionId;

	// No institution context available
	if (!institutionId) {
		return next();
	}

	const hasScope = (
		req.user.roleAssignments ||
		[]
	).some(
		(assignment) =>
			assignment.institutionId ===
			institutionId
	);

	if (!hasScope) {
		throw new AppError(
			"Insufficient institution permissions",
			403
		);
	}

	next();
}

export function requireOperationalAccess(
	req,
	_res,
	next
) {
	if (!req.user) {
		throw new AppError(
			"Authentication required",
			401
		);
	}

	// Super admin bypass
	if (
		req.user.roles.includes(
			"SUPER_ADMIN"
		)
	) {
		return next();
	}

	const hasInstitutionLinkedRole =
		(
			req.user
				.roleAssignments || []
		).some((assignment) =>
			Boolean(
				assignment.institutionId
			)
		);

	if (
		!hasInstitutionLinkedRole
	) {
		throw new AppError(
			"Operational access requires institution approval",
			403,
			"ONBOARDING_REQUIRED"
		);
	}

	next();
}
