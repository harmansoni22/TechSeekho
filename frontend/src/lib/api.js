import { getSession } from "next-auth/react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND;

/**
 * Central authenticated API client.
 * - Uses NextAuth session.accessToken as the single auth source of truth.
 * - Automatically attaches Authorization header when available.
 * - Never reads localStorage.authToken.
 */
export async function api(path, options = {}) {
	const isAbsolutePath = /^https?:\/\//i.test(path);
	const url = isAbsolutePath
		? path
		: BACKEND_URL
			? `${BACKEND_URL}${path}`
			: path;

	let token = null;
	try {
		const session = await getSession();
		token = session?.accessToken ?? null;
	} catch {
		// Unauthenticated / SSR timing — proceed without token.
	}

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
		throw new Error(`Network error calling ${url}: ${message}`);
	}

	if (!res.ok) {
		const errorText = await res.text().catch(() => "");
		throw new Error(`API error ${res.status}: ${errorText}`);
	}

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



