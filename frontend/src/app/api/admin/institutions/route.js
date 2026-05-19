import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

const BACKEND = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function forward(method, path, body) {
	const session = await getServerSession(authOptions);
	if (!session) {
		return NextResponse.json(
			{ error: "Authentication required" },
			{ status: 401 },
		);
	}

	const response = await fetch(`${BACKEND()}${path}`, {
		method,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${session.accessToken}`,
		},
		cache: "no-store",
		...(body ? { body: JSON.stringify(body) } : {}),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		return NextResponse.json(
			{ error: errorData.message || `Request failed (${response.status})` },
			{ status: response.status },
		);
	}

	const data = await response.json();
	return NextResponse.json(data);
}

export async function GET() {
	try {
		return await forward("GET", "/institutions");
	} catch (error) {
		console.error("Institutions API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(req) {
	try {
		const body = await req.json().catch(() => ({}));
		return await forward("POST", "/institutions", body);
	} catch (error) {
		console.error("Institutions POST error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
