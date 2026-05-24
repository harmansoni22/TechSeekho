import prisma from "../config/db.js";
import { findUserByEmail } from "../services/users.service.js";
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

async function verifyProviderToken(provider, { idToken, accessToken, providerAccountId, email }) {
	const p = String(provider || "").toLowerCase();

	// Helper to safely normalize email for comparison
	const normalizedExpectedEmail = normalizeEmail(email);

	try {
		if (p === "google") {
			if (idToken) {
				const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
				const r = await fetchWithTimeout(tokenInfoUrl);
				if (!r.ok) return false;
				const info = await r.json();
				const sub = String(info.sub || "");
				const infoEmail = normalizeEmail(info.email);
				if (sub === String(providerAccountId) || (infoEmail && infoEmail === normalizedExpectedEmail)) {
					return true;
				}
				return false;
			}

			if (accessToken) {
				const r = await fetchWithTimeout("https://www.googleapis.com/oauth2/v3/userinfo", {
					headers: { Authorization: `Bearer ${accessToken}` },
				});
				if (!r.ok) return false;
				const info = await r.json();
				const sub = String(info.sub || "");
				const infoEmail = normalizeEmail(info.email);
				if (sub === String(providerAccountId) || (infoEmail && infoEmail === normalizedExpectedEmail)) {
					return true;
				}
				return false;
			}

			return false;
		}

		if (p === "github") {
			// GitHub provides accessToken (no id_token). Verify via /user and /user/emails
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
			const login = String(info.login || "");
			if (ghId === String(providerAccountId) || login === String(providerAccountId)) {
				// try to verify email if available
				let primaryEmail = info.email || null;
				if (!primaryEmail) {
					const r2 = await fetchWithTimeout("https://api.github.com/user/emails", {
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"User-Agent": "techseekho-app",
						},
					});
					if (r2.ok) {
						const emails = await r2.json();
						const primary = (Array.isArray(emails) && (emails.find(e => e.primary) || emails[0])) || null;
						if (primary) primaryEmail = primary.email;
					}
				}

				if (primaryEmail && normalizeEmail(primaryEmail) !== normalizedExpectedEmail) {
					return false;
				}

				return true;
			}

			return false;
		}

		// Unknown provider: do not verify here
		return false;
	} catch (err) {
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
		throw new AppError("OAuth token verification failed", 401, "OAUTH_VERIFICATION_FAILED");
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
