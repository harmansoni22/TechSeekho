import { getSession } from "next-auth/react";

const URL = process.env.NEXT_PUBLIC_BACKEND; // External backend

/**
 * Central authenticated API client.
 * - Uses NextAuth session.accessToken as the single auth source of truth.
 * - Automatically attaches Authorization header when available.
 * - Never reads localStorage.authToken.
 */
export async function api(path, options = {}) {
	const isAbsolutePath = /^https?:\/\//i.test(path);
	const url = isAbsolutePath ? path : URL ? `${URL}${path}` : path;

	console.log("[api] resolving session");
	let token = null;
	try {
		const session = await getSession();
		console.log("[api] session", session);
		token = session?.accessToken ?? null;
	} catch (e) {
		// non-fatal: unauthenticated/SSR timing edge cases
		console.error("[api] getSession failed", e);
	}

	console.log("[api] request", url);

	let res;
	try {
		res = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : null),
				...(options.headers || {}),
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown network error";
		console.error(`[api] failed] Network error calling ${url}: ${message}`);
		throw new Error(`Network error calling ${url}: ${message}`);
	}

	console.log("[api] response status", res.status);

	if (!res.ok) {
		const errorText = await res.text().catch(() => "");
		throw new Error(`API error ${res.status}: ${errorText}`);
	}

	// Avoid hard crashes on empty/non-JSON responses.
	const contentType = res.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		return res.json();
	}

	const text = await res.text().catch(() => "");
	try {
		return text ? JSON.parse(text) : {};
	} catch {
		return { message: text };
	}
}


// Backward compatibility exports (no localStorage token anymore)
export function setAuthToken(_token) {
	// intentionally no-op
}

export function removeAuthToken() {
	// intentionally no-op
}

export function getAuthToken() {
	return null;
}

