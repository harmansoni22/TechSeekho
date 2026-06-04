"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Pill } from "@/features/dashboard/admin/adminShared";
import { fetchAdminOverview } from "@/features/dashboard/api/adminDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";
import { api } from "@/lib/api";

function formatTimestamp(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return "—";
    }
}

export default function AdminProfilePage() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState(null);
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [profileRes, overviewRes] = await Promise.all([
                api("/auth/profile"),
                fetchAdminOverview().catch(() => null),
            ]);
            setProfile(profileRes?.user ?? profileRes?.data?.user ?? null);
            setOverview(overviewRes);
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
    const initial = (view.name || "A").trim().charAt(0).toUpperCase();
    const institutions = overview?.scope?.institutions ?? [];
    const counts = overview?.counts ?? {};

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Operations · Profile"
                title={
                    view.name
                        ? `Hello, ${String(view.name).split(" ")[0]}`
                        : "Your profile"
                }
                subtitle="Your identity, the institutions you administer, and the scale of the operation you run. Every audit-log row carries this identity."
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
                    <section className="grid gap-6 md:grid-cols-3">
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
                                        style={{ color: "var(--dashboard-fg)" }}
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
                                    label="Account created"
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
                                            <Pill tone="accent">{r}</Pill>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p
                                className="mt-4 text-xs"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                Your role and institution scope are granted by a
                                super-admin. They cannot be changed here.
                            </p>
                        </Panel>
                    </section>

                    <Panel
                        eyebrow="Scope"
                        title="Institutions you administer"
                        description="Everything you do is bounded to these institutions."
                    >
                        {institutions.length === 0 ? (
                            <p
                                className="text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                No institution assigned yet — ask a super-admin
                                to scope your role.
                            </p>
                        ) : (
                            <ul className="flex flex-wrap gap-2">
                                {institutions.map((i) => (
                                    <li key={i.id}>
                                        <span
                                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {i.name}
                                            <Pill
                                                tone={
                                                    i.isActive
                                                        ? "success"
                                                        : "muted"
                                                }
                                            >
                                                {i.type}
                                            </Pill>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatTile
                            label="Batches"
                            value={counts.batches ?? 0}
                            footnote={`${counts.activeBatches ?? 0} active`}
                        />
                        <StatTile
                            label="Students"
                            value={counts.students ?? 0}
                        />
                        <StatTile
                            label="Trainers"
                            value={counts.trainers ?? 0}
                        />
                        <StatTile
                            label="Institutions"
                            value={counts.institutions ?? institutions.length}
                        />
                    </section>
                </>
            )}
        </div>
    );
}

function KV({ label, value, mono = false }) {
    return (
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
}
