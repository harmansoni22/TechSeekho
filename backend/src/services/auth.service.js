import prisma from "../config/db.js";
import env from "../config/env.js";
import { AppError } from "../utils/appError.js";
import {
	generateOTP,
	generateToken,
	hashOtp,
	normalizeEmail,
	normalizePhone,
	verifyPassword,
} from "../utils/auth.js";
import {
	createUser,
	findUserByEmail,
	findUserByPhone,
} from "./users.service.js";

const CONTACT_TYPES = {
	EMAIL: "EMAIL",
	PHONE: "PHONE",
};

function getContact({ email, phone, identifier }) {
	const raw = identifier ?? null;
	const emailValue = normalizeEmail(email || (raw?.includes("@") ? raw : null));
	const phoneValue = normalizePhone(phone || (raw && !raw.includes("@") ? raw : null));

	if (emailValue) {
		return { contactType: CONTACT_TYPES.EMAIL, contactValue: emailValue };
	}

	if (phoneValue) {
		return { contactType: CONTACT_TYPES.PHONE, contactValue: phoneValue };
	}

	throw new AppError("A valid email or phone number is required", 400);
}

async function createOtp({
	userId = null,
	contactType,
	contactValue,
	purpose,
}) {
	const otp = generateOTP();
	const expiresAt = new Date(Date.now() + env.otpExpiresMinutes * 60_000);

	await prisma.contactVerification.updateMany({
		where: {
			contactType,
			contactValue,
			purpose,
			consumedAt: null,
		},
		data: { consumedAt: new Date() },
	});

	await prisma.contactVerification.create({
		data: {
			userId,
			contactType,
			contactValue,
			purpose,
			otpHash: hashOtp(otp),
			expiresAt,
		},
	});

	// Hook real email/SMS providers here. In development, returning the OTP makes
	// the local app testable without weakening production behavior.
	return {
		expiresAt,
		...(env.exposeOtpInResponse ? { otp } : {}),
	};
}

async function consumeOtp({ contactType, contactValue, purpose, otp }) {
	const verification = await prisma.contactVerification.findFirst({
		where: {
			contactType,
			contactValue,
			purpose,
			consumedAt: null,
		},
		orderBy: { createdAt: "desc" },
	});

	if (!verification) {
		throw new AppError("OTP not requested or already used", 400);
	}

	if (verification.expiresAt < new Date()) {
		await prisma.contactVerification.update({
			where: { id: verification.id },
			data: { consumedAt: new Date() },
		});
		throw new AppError("OTP has expired", 400);
	}

	if (verification.attempts >= verification.maxAttempts) {
		await prisma.contactVerification.update({
			where: { id: verification.id },
			data: { consumedAt: new Date() },
		});
		throw new AppError("OTP attempt limit exceeded", 429);
	}

	const isMatch = verification.otpHash === hashOtp(otp);

	if (!isMatch) {
		await prisma.contactVerification.update({
			where: { id: verification.id },
			data: { attempts: { increment: 1 } },
		});
		throw new AppError("Invalid OTP", 401);
	}

	await prisma.contactVerification.update({
		where: { id: verification.id },
		data: { consumedAt: new Date() },
	});
}

export async function requestSignupOtp({ fullName, email, phone, password }) {
	if (!fullName || !password) {
		throw new AppError("Full name and password are required", 400);
	}

	const contact = getContact({ email, phone });

	if (contact.contactType === CONTACT_TYPES.EMAIL) {
		const existingUser = await findUserByEmail(contact.contactValue);
		if (existingUser)
			throw new AppError("User with this email already exists", 409);
	} else {
		const existingUser = await findUserByPhone(contact.contactValue);
		if (existingUser)
			throw new AppError("User with this phone number already exists", 409);
	}

	return createOtp({ ...contact, purpose: "SIGNUP" });
}

export async function verifySignupOtp({
	fullName,
	email,
	phone,
	password,
	otp,
}) {
	if (!otp) throw new AppError("OTP is required", 400);

	const contact = getContact({ email, phone });
	await consumeOtp({ ...contact, purpose: "SIGNUP", otp });

	const user = await createUser({
		fullName,
		email:
			contact.contactType === CONTACT_TYPES.EMAIL ? contact.contactValue : null,
		phone:
			contact.contactType === CONTACT_TYPES.PHONE ? contact.contactValue : null,
		password,
		verifiedContactType: contact.contactType,
	});

	const token = generateToken({
		id: user.id,
		roles: user.roles,
	});

	return { user, token };
}

export async function requestLoginOtp({
	identifier,
	password,
	useMobile = false,
}) {
	if (!identifier || !password) {
		throw new AppError("Identifier and password are required", 400);
	}

	const contact = getContact({ identifier, useMobile });
	const user =
		contact.contactType === CONTACT_TYPES.PHONE
			? await findUserByPhone(contact.contactValue)
			: await findUserByEmail(contact.contactValue);

	if (!user || user.status !== "ACTIVE") {
		throw new AppError("Invalid credentials", 401);
	}

	const isValidPassword = await verifyPassword(password, user.passwordHash);
	if (!isValidPassword) {
		throw new AppError("Invalid credentials", 401);
	}

	return createOtp({
		userId: user.id,
		...contact,
		purpose: "LOGIN",
	});
}

export async function verifyLoginOtp({
	identifier,
	password,
	otp,
	useMobile = false,
}) {
	if (!otp) throw new AppError("OTP is required", 400);

	const contact = getContact({ identifier, useMobile });
	const user =
		contact.contactType === CONTACT_TYPES.PHONE
			? await findUserByPhone(contact.contactValue)
			: await findUserByEmail(contact.contactValue);

	if (!user || user.status !== "ACTIVE") {
		throw new AppError("Invalid credentials", 401);
	}

	const isValidPassword = await verifyPassword(password, user.passwordHash);
	if (!isValidPassword) {
		throw new AppError("Invalid credentials", 401);
	}

	await consumeOtp({ ...contact, purpose: "LOGIN", otp });

	const updatedUser = await prisma.user.update({
		where: { id: user.id },
		data: {
			lastLoginAt: new Date(),
			...(contact.contactType === CONTACT_TYPES.EMAIL
				? { isEmailVerified: true }
				: { isPhoneVerified: true }),
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
					role: { select: { name: true } },
				},
			},
		},
	});

	const roles = updatedUser.roleAssignments.map(
		(assignment) => assignment.role.name,
	);
	if (roles.length === 0) {
		throw new AppError("No role is assigned to this account", 403);
	}

	const responseUser = {
		id: updatedUser.id,
		name: updatedUser.fullName,
		email: updatedUser.email,
		phone: updatedUser.phone,
		status: updatedUser.status,
		isEmailVerified: updatedUser.isEmailVerified,
		isPhoneVerified: updatedUser.isPhoneVerified,
		roles,
	};

	const token = generateToken({
		id: responseUser.id,
		roles,
	});

	return { user: responseUser, token };
}
