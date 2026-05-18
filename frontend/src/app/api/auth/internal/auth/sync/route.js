import { auth } from "@/auth";

export async function POST() {
    try {
        const session = await auth();

        if (!session?.provider || !session?.accessToken) {
            return Response.json(
                { success: false, message: "No OAuth session found." },
                { status: 401 }
            )
        }

        const backendRes = await fetch(`${process.env.BACKEND_URL}/api/auth/oauth/sync`, {
            method: "POST",
            headers: {
                "Content-Type": "Application/json",
            },
            body: JSON.stringify({
                provider: session.provider,
                accessToken: session.accessToken,
                idToken: session.idToken || null,
            }),
            cache: "no-store",
        })

        const data = await backendRes.json();

        if (!backendRes.ok) {
            return Response.json(
                { success: false, message: data.message || "Backend sync failed." },
                { status: backendRes.status },
            )
        }

        const response = Response.json(
            { success: true, user: data.user },
            { status: 200 }
        )

        response.cookies.set("app_token", data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        return Response.json(
            { success: false, message: error.message || "Something went wrong while syncing. Internal Server Error." },
            { status: 500 }
        )
    }
}
