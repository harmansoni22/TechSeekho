import crypto from "node:crypto";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import env from "../config/env.js";

if (!env.jwtSecret) {
	throw new Error(
		"JWT secret is required"
	);
}

const JWT_SECRET =
	env.jwtSecret;

const JWT_EXPIRES_IN =
	env.jwtExpiresIn ||
	"7d";

const JWT_ISSUER =
	"techseekho-api";

const JWT_AUDIENCE =
	"techseekho-app";

export async function hashPassword(
	password
) {
	const saltRounds = 12;

	return bcrypt.hash(
		password,
		saltRounds
	);
}

export async function verifyPassword(
	password,
	hashedPassword
) {
	if (!hashedPassword) {
		return false;
	}

	return bcrypt.compare(
		password,
		hashedPassword
	);
}

export function generateToken(
	payload
) {
	return jwt.sign(
		payload,
		JWT_SECRET,
		{
			expiresIn:
				JWT_EXPIRES_IN,

			issuer:
				JWT_ISSUER,

			audience:
				JWT_AUDIENCE,
		}
	);
}

export function verifyToken(
	token
) {
	try {
		return jwt.verify(
			token,
			JWT_SECRET,
			{
				issuer:
					JWT_ISSUER,

				audience:
					JWT_AUDIENCE,
			}
		);
	} catch {
		return null;
	}
}

export function generateOTP() {
	return crypto
		.randomInt(
			100000,
			999999
		)
		.toString();
}

export function hashOtp(otp) {
	return crypto
		.createHash("sha256")
		.update(String(otp))
		.digest("hex");
}

export function isOTPExpired(
	expiry
) {
	return new Date() > expiry;
}

export function normalizeEmail(
	email
) {
	if (
		typeof email !==
		"string"
	) {
		return null;
	}

	const normalized =
		email
			.trim()
			.toLowerCase();

	return normalized || null;
}

export function normalizePhone(
	phone
) {
	if (
		typeof phone !==
		"string"
	) {
		return null;
	}

	const trimmed =
		phone.trim();

	if (!trimmed) {
		return null;
	}

	const hasPlus =
		trimmed.startsWith("+");

	const digits =
		trimmed.replace(
			/\D/g,
			""
		);

	if (
		digits.length < 8 ||
		digits.length > 15
	) {
		return null;
	}

	return hasPlus
		? `+${digits}`
		: digits;
}
