"use client";

import { useSession } from "next-auth/react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * SUPER_ADMIN profile page.
 *
 * Reads the user identity from the next-auth session so the page renders
 * immediately without a network round-trip. Mutations (changing email,
 * uploading avatar, rotating MFA) go through the backend's existing profile
 * endpoint, which is gated to the authenticated user.
 *
 * SECURITY: never store the access token in component state and never log
 * the session. Sensitive actions (MFA rotation, session revocation) should
 * re-prompt the user for their password — those flows live in the
 * BackendPending block below.
 */
const SuperAdminProfilePage = () => {
    const { data: session } = useSession();
    const user = session?.user ?? {};
    const initial = (user.name || "S").trim().charAt(0).toUpperCase();
    const grantedRoles = (user.roles || []).join(", ");

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Account · Profile"
                title={
                    user.name
                        ? `Hello, ${user.name.split(" ")[0]}`
                        : "Your profile"
                }
                subtitle="The details TechSeekho uses to identify you. Keep them accurate — they appear on every audit entry and outbound notification."
            />

            <section className="dash-reveal dash-reveal-2 grid gap-6 md:grid-cols-3">
                <Panel eyebrow="Identity" title="Who you are">
                    <div className="flex items-center gap-4">
                        <span
                            className="inline-flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                                fontWeight: 500,
                            }}
                        >
                            {initial}
                        </span>
                        <div className="min-w-0">
                            <p
                                className="font-display text-lg"
                                style={{ color: "var(--dashboard-fg)" }}
                            >
                                {user.name || "—"}
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {user.email || "no email on file"}
                            </p>
                        </div>
                    </div>
                </Panel>

                <Panel
                    eyebrow="Authority"
                    title="Role grants"
                    className="md:col-span-2"
                >
                    <div className="flex flex-wrap gap-2">
                        {grantedRoles ? (
                            (user.roles || []).map((r) => (
                                <span
                                    key={r}
                                    className="inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                                    style={{
                                        backgroundColor:
                                            "var(--role-accent-soft)",
                                        color: "var(--role-accent)",
                                    }}
                                >
                                    {r}
                                </span>
                            ))
                        ) : (
                            <span
                                className="text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                No roles attached to this session.
                            </span>
                        )}
                    </div>
                    <p
                        className="mt-4 text-xs"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Roles are the source of truth for every authorization
                        check in TechSeekho. A change here propagates within one
                        session refresh.
                    </p>
                </Panel>
            </section>

            <BackendPending
                whatItDoes="Edit your display name, rotate your avatar, swap your contact email (with verification), rotate MFA / passkeys, and review every device currently signed into your account. Sensitive mutations require a password re-prompt."
                endpoints={[
                    {
                        method: "PATCH",
                        path: "/auth/profile",
                        purpose: "name + avatar",
                    },
                    {
                        method: "POST",
                        path: "/auth/email/change",
                        purpose: "request email change (sends verification)",
                    },
                    {
                        method: "POST",
                        path: "/auth/mfa/rotate",
                        purpose: "rotate TOTP secret / passkey",
                    },
                    {
                        method: "GET",
                        path: "/auth/sessions",
                        purpose: "active devices",
                    },
                    {
                        method: "DELETE",
                        path: "/auth/sessions/:id",
                        purpose: "revoke one device",
                    },
                ]}
                previewSlots={[
                    "Edit profile",
                    "Active sessions",
                    "Security log",
                ]}
                note="Profile mutations live behind a 2-minute re-auth window. The session.accessToken is the single auth source — never call /auth/* without it."
            />
        </div>
    );
};

export default SuperAdminProfilePage;
