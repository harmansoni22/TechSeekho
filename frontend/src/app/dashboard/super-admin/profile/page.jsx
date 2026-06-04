"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { api } from "@/lib/api";

/**
 * SUPER_ADMIN — Profile.
 *
 * Identity reads from `/auth/profile` (canonical) with the NextAuth session
 * as an instant fallback so the page is not blank during the first paint.
 *
 * Sensitive mutations (email change, MFA rotation, session revocation) are
 * intentionally not wired in this iteration — those flows live behind the
 * password re-prompt window and require dedicated endpoints. The form below
 * exists strictly to display the canonical record + last-login telemetry.
 */

function formatTimestamp(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return "—";
    }
}

const SuperAdminProfilePage = () => {
    const { data: session } = useSession();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await api("/auth/profile");
            const user = resp?.user ?? resp?.data?.user ?? null;
            setProfile(user);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const sessionUser = session?.user ?? {};
    const view = profile || {
        name: sessionUser.name,
        email: sessionUser.email,
        roles: sessionUser.roles || [],
    };
    const initial = (view.name || "S").trim().charAt(0).toUpperCase();

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Account · Profile"
                title={
                    view.name
                        ? `Hello, ${String(view.name).split(" ")[0]}`
                        : "Your profile"
                }
                subtitle="The details TechSeekho uses to identify you. Every audit-log row carries this identity — keep it accurate."
            />

            {loading ? (
                <PageLoading label="Loading profile" />
            ) : error && !profile ? (
                <PageError
                    title="Could not load profile"
                    message={error}
                    onRetry={load}
                />
            ) : (
                <>
                    <section className="dash-reveal dash-reveal-2 grid gap-6 md:grid-cols-3">
                        <Panel
                            eyebrow="Identity"
                            title="Who you are"
                            className="md:col-span-2"
                        >
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
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {view.name || "—"}
                                    </p>
                                    <p
                                        className="text-sm"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {view.email || "no email on file"}
                                    </p>
                                </div>
                            </div>

                            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                                <KV label="User id" value={view.id} mono />
                                <KV label="Phone" value={view.phone || "—"} />
                                <KV
                                    label="Email verified"
                                    value={view.isEmailVerified ? "Yes" : "No"}
                                />
                                <KV
                                    label="Status"
                                    value={view.status || "ACTIVE"}
                                />
                                <KV
                                    label="Created"
                                    value={formatTimestamp(view.createdAt)}
                                />
                            </dl>
                        </Panel>

                        <Panel eyebrow="Authority" title="Role grants">
                            {(view.roles || []).length === 0 ? (
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    No roles attached to this session.
                                </p>
                            ) : (
                                <ul className="flex flex-wrap gap-2">
                                    {(view.roles || []).map((r) => (
                                        <li key={r}>
                                            <span
                                                className="inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor:
                                                        "var(--role-accent-soft)",
                                                    color: "var(--role-accent)",
                                                }}
                                            >
                                                {r}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p
                                className="mt-4 text-xs"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                Roles are the source of truth for every
                                authorization check in TechSeekho. To change
                                them, use Role Management — never edit them
                                here.
                            </p>
                        </Panel>
                    </section>

                    <Panel
                        eyebrow="Security"
                        title="Account guardrails"
                        description="Sensitive mutations live behind a password re-prompt. The endpoints for email change, MFA rotation, and session revocation are out of scope for this iteration; this panel summarizes what is enforced today."
                    >
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <KV
                                label="Session token source"
                                value="NextAuth → backend JWT (HS256)"
                            />
                            <KV
                                label="JWT issuer"
                                value="techseekho-api"
                                mono
                            />
                            <KV
                                label="JWT audience"
                                value="techseekho-app"
                                mono
                            />
                            <KV
                                label="Password hashing"
                                value="bcrypt · 12 rounds"
                            />
                            <KV
                                label="OAuth account behavior"
                                value="Credentials login disabled (sentinel hash)"
                            />
                            <KV
                                label="Operational access requirement"
                                value="SUPER_ADMIN bypass / institution role"
                            />
                        </dl>
                    </Panel>
                </>
            )}
        </div>
    );
};

const KV = ({ label, value, mono = false }) => (
    <div>
        <dt
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </dt>
        <dd
            className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}
            style={{ color: "var(--dashboard-fg)", wordBreak: "break-all" }}
        >
            {value ?? "—"}
        </dd>
    </div>
);

export default SuperAdminProfilePage;
