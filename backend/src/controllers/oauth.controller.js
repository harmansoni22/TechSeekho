import prisma from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { generateToken } from "../utils/auth.js";

function normalizeEmail(email) {
	return typeof email === "string" ? email.trim().toLowerCase() : null;
}

// Cap outbound provider calls so a slow Google/GitHub does not hold a thread.
const PROVIDER_FETCH_TIMEOUT_MS = 5_000;

async function fetchWithTimeout(url, options = {}) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), PROVIDER_FETCH_TIMEOUT_MS);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Verify that the caller actually controls the OAuth account they claim to.
 *
 * Both checks must pass:
 *   1. The provider's reported `sub`/`id` matches `providerAccountId` from the body.
 *   2. The provider's reported email matches the email in the body.
 *
 * Previously this used OR semantics, which let an attacker who controlled
 * Google account A submit a body with email=victim@example.com,
 * providerAccountId=A_sub, and their own idToken — the sub check passed and
 * the email check was short-circuited, allowing them to hijack the existing
 * victim account during the upsert.
 */
async function verifyProviderToken(
	provider,
	{ idToken, accessToken, providerAccountId, email },
) {
	const p = String(provider || "").toLowerCase();
	const expectedEmail = normalizeEmail(email);
	if (!expectedEmail) return false;

	try {
		if (p === "google") {
			let info = null;
			if (idToken) {
				const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
				const r = await fetchWithTimeout(url);
				if (!r.ok) return false;
				info = await r.json();
			} else if (accessToken) {
				const r = await fetchWithTimeout(
					"https://www.googleapis.com/oauth2/v3/userinfo",
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				);
				if (!r.ok) return false;
				info = await r.json();
			} else {
				return false;
			}

			const sub = String(info.sub || "");
			const infoEmail = normalizeEmail(info.email);
			// Google must also report email_verified=true for the id_token path
			// to be trustworthy; the userinfo path doesn't include that flag.
			const emailVerifiedOk =
				info.email_verified === undefined ||
				info.email_verified === true ||
				info.email_verified === "true";

			return (
				sub === String(providerAccountId) &&
				Boolean(infoEmail) &&
				infoEmail === expectedEmail &&
				emailVerifiedOk
			);
		}

		if (p === "github") {
			if (!accessToken) return false;

			const r = await fetchWithTimeout("https://api.github.com/user", {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"User-Agent": "techseekho-app",
				},
			});
			if (!r.ok) return false;
			const info = await r.json();
			const ghId = String(info.id || "");
			const idMatches = ghId === String(providerAccountId) && ghId.length > 0;
			if (!idMatches) return false;

			// Resolve the GitHub account's verified primary email.
			let primaryEmail = normalizeEmail(info.email);
			if (!primaryEmail) {
				const r2 = await fetchWithTimeout(
					"https://api.github.com/user/emails",
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"User-Agent": "techseekho-app",
						},
					},
				);
				if (!r2.ok) return false;
				const emails = await r2.json();
				if (!Array.isArray(emails)) return false;
				const primary =
					emails.find((e) => e.primary && e.verified) ||
					emails.find((e) => e.verified) ||
					null;
				primaryEmail = primary ? normalizeEmail(primary.email) : null;
			}

			return Boolean(primaryEmail) && primaryEmail === expectedEmail;
		}

		// Unknown provider: refuse.
		return false;
	} catch {
		return false;
	}
}

export async function oauthLogin(req, res) {
	// Security: require server-side validation; never trust client-supplied JWT.
	// This endpoint is intended to be called from NextAuth only.
	const {
		provider,
		providerAccountId,
		email,
		fullName,
		avatarUrl,
		idToken,
		accessToken,
	} = req.body || {};

	if (!provider || typeof provider !== "string") {
		throw new AppError("provider is required", 400, "OAUTH_PROVIDER_REQUIRED");
	}

	if (!providerAccountId || typeof providerAccountId !== "string") {
		throw new AppError(
			"providerAccountId is required",
			400,
			"OAUTH_ACCOUNT_ID_REQUIRED",
		);
	}

	const normalizedEmail = normalizeEmail(email);
	if (!normalizedEmail) {
		throw new AppError("email is required", 400, "OAUTH_EMAIL_REQUIRED");
	}

	// Require provider token and verify with provider (defense in depth)
	const ok = await verifyProviderToken(provider, {
		idToken,
		accessToken,
		providerAccountId,
		email: normalizedEmail,
	});

	if (!ok) {
		throw new AppError(
			"OAuth token verification failed",
			401,
			"OAUTH_VERIFICATION_FAILED",
		);
	}

	if (!fullName || typeof fullName !== "string") {
		throw new AppError("fullName is required", 400, "OAUTH_NAME_REQUIRED");
	}

	// All DB mutations for OAuth provisioning commit together. Either we
	// produce a usable user (with role + student profile) or nothing.
	const user = await prisma.$transaction(async (tx) => {
		const existing = await tx.user.findUnique({
			where: { email: normalizedEmail },
		});

		if (existing) {
			return tx.user.update({
				where: { id: existing.id },
				data: {
					fullName,
					avatarUrl: avatarUrl || existing.avatarUrl,
					isEmailVerified: true,
					// Keep existing roles/status.
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
						select: { role: { select: { name: true } } },
					},
				},
			});
		}

		const studentRole = await tx.role.findUnique({
			where: { name: "STUDENT" },
			select: { id: true },
		});

		if (!studentRole) {
			throw new AppError("STUDENT role not found", 500, "OAUTH_ROLE_MISSING");
		}

		// Sentinel non-bcrypt string — bcrypt.compare will always return false,
		// so OAuth-only users cannot log in via credentials until they set a
		// real password through a future password-reset flow.
		const dummyPasswordHash = "!oauth-disabled";

		return tx.user.create({
			data: {
				fullName,
				email: normalizedEmail,
				phone: null,
				passwordHash: dummyPasswordHash,
				avatarUrl: avatarUrl || null,
				isEmailVerified: true,
				status: "ACTIVE",
				studentProfile: { create: {} },
				roleAssignments: { create: { roleId: studentRole.id } },
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
					select: { role: { select: { name: true } } },
				},
			},
		});
	});

	const roles = user.roleAssignments.map((ra) => ra.role.name);

	// Security: enforce JWT payload consistency.
	const token = generateToken({
		id: user.id,
		email: user.email,
		phone: user.phone ?? null,
		roles,
	});

	return res.status(200).json({
		user: {
			id: user.id,
			name: user.fullName,
			email: user.email,
			phone: user.phone,
			status: user.status,
			isEmailVerified: user.isEmailVerified,
			isPhoneVerified: user.isPhoneVerified,
			createdAt: user.createdAt,
			roles,
		},
		token,
	});
}
