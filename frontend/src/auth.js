import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND;

async function authenticateWithBackend({ identifier, password, otp }) {
	// Must exist in-module: used by the Credentials provider authorize().
	try {
		const response = await fetch(`${backendUrl}/auth/login/verify-otp`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ identifier, password, otp }),
		});

		if (!response.ok) {
			throw new Error("Invalid credentials");
		}

		return await response.json();
	} catch (error) {
		console.error("Backend authentication error:", error);
		throw error;
	}
}


async function getUserFromBackend(token) {
    try {
        const response = await fetch(`${backendUrl}/auth/profile`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user profile");
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error("Backend user fetch error:", error);
        throw error;
    }
}

async function exchangeOAuthWithBackend({
    provider,
    providerAccountId,
    email,
    fullName,
    avatarUrl,
    accessToken,
    idToken,
}) {
    const payload = {
        provider,
        providerAccountId,
        email,
        fullName,
        avatarUrl,
    };
    if (accessToken) payload.accessToken = accessToken;
    if (idToken) payload.idToken = idToken;

    const response = await fetch(`${backendUrl}/oauth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`OAuth exchange failed (${response.status}): ${text}`);
    }

    return response.json();
}

const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                identifier: { label: "Email or mobile", type: "text" },
                password: { label: "Password", type: "password" },
                otp: { label: "OTP", type: "text" },
                postSignupToken: { label: "Post-signup token", type: "text" },
            },
            async authorize(credentials) {
                try {
                    if (credentials.postSignupToken) {
                        const profileUser = await getUserFromBackend(credentials.postSignupToken);
                        return {
                            ...profileUser,
                            name: profileUser.name || profileUser.fullName,
                            accessToken: credentials.postSignupToken,
                            id: profileUser.id,
                        };
                    }

                    const { user, token } = await authenticateWithBackend({
                        identifier: credentials.identifier,
                        password: credentials.password,
                        otp: credentials.otp,
                    });

                    return {
                        ...user,
                        accessToken: token,
                        id: user.id,
                    };
                } catch (error) {
                    console.error("Credentials authentication error:", error);
                    return null;
                }
            },
        }),
        Github({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_SECRET,
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile, user }) {
            if (account && user) {
                if (account.type === "credentials") {
                    token.accessToken = user.accessToken;
                    token.id = user.id;
                    token.name = user.name;
                    token.email = user.email;
                    token.roles = user.roles;
                    token.avatarUrl = user.avatarUrl;
                } else {
                    token.provider = account.provider;
                    token.providerAccountId = account.providerAccountId;
                    token.idToken = account.id_token || null;

                    const fullName = profile?.name || profile?.login || user.name;
                    const email = profile?.email || user.email;
                    const avatarUrl = profile?.image || profile?.avatar_url || user.image;

                    const backendExchange = await exchangeOAuthWithBackend({
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                        email,
                        fullName,
                        avatarUrl,
                        accessToken: account.access_token || null,
                        idToken: account.id_token || null,
                    });

                    if (!backendExchange?.token || !backendExchange?.user?.id) {
                        throw new Error("Backend OAuth exchange did not return token/user");
                    }

                    token.accessToken = backendExchange.token;
                    token.id = backendExchange.user.id;
                    token.name = backendExchange.user.name;
                    token.email = backendExchange.user.email;
                    token.roles = backendExchange.user.roles || [];
                    token.avatarUrl = backendExchange.user.avatarUrl;

                    token.picture = avatarUrl || token.picture || null;
                }
            }
            return token;
        },
        async session({ session, token }) {
            session.user = session.user || {};
            session.user.id = token.id;
            session.user.name = token.name;
            session.user.email = token.email;
            session.user.image = token.picture || token.avatarUrl;
            session.user.roles = token.roles || [];
            session.accessToken = token.accessToken;
            session.provider = token.provider || null;
            session.providerAccountId = token.providerAccountId || null;
            session.idToken = token.idToken || null;

            if (typeof token.accessToken === "string" && token.accessToken && token.id) {
                try {
                    const backendUser = await getUserFromBackend(token.accessToken);
                    session.user.roles = backendUser.roles || [];
                    session.user.avatarUrl = backendUser.avatarUrl;
                } catch (error) {
                    console.error("Failed to fetch fresh user data:", error);
                }
            }

            return session;
        },
    },
};

const nextAuthHandler = NextAuth(authOptions);

export const handlers = { GET: nextAuthHandler, POST: nextAuthHandler };

export async function auth() {
    const { getServerSession } = await import("next-auth/next");
    return await getServerSession(authOptions);
}

export { authOptions };
