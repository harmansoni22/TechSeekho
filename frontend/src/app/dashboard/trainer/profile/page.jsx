"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import {
    fetchTrainerBatches,
    fetchTrainerOverview,
} from "@/features/dashboard/api/trainerDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { api } from "@/lib/api";

/**
 * TRAINER — Profile.
 *
 * Identity from `/auth/profile`; teaching stats from `/trainer/overview`;
 * assigned batches from `/batches`. Mutations (email/MFA/avatar) are not
 * exposed here yet — they need dedicated endpoints with re-auth gating.
 * Today this page is the canonical "what does the platform know about me?"
 * view, kept honest by reading from the same endpoints that drive operational
 * pages.
 */

function formatDate(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

export default function TrainerProfilePage() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState(null);
    const [overview, setOverview] = useState(null);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [profResp, ov, bs] = await Promise.all([
                api("/auth/profile"),
                fetchTrainerOverview().catch(() => null),
                fetchTrainerBatches().catch(() => []),
            ]);
            setProfile(profResp?.user ?? profResp?.data?.user ?? null);
            setOverview(ov);
            setBatches(Array.isArray(bs) ? bs : []);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <PageLoading label="Loading profile" />;
    if (error && !profile)
        return (
            <PageError
                title="Could not load profile"
                message={error}
                onRetry={load}
            />
        );

    const sessionUser = session?.user ?? {};
    const view = profile || {
        name: sessionUser.name,
        email: sessionUser.email,
        roles: sessionUser.roles || [],
    };
    const initial = (view.name || "T").trim().charAt(0).toUpperCase();
    const counts = overview?.counts ?? {};
    const workload = overview?.workload ?? {};

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Account · Profile"
                title={
                    view.name
                        ? `Hello, ${String(view.name).split(" ")[0]}`
                        : "Your profile"
                }
                subtitle="Your trainer identity and the work it touches. Edits to email, password, or MFA happen behind the re-auth window — not on this page."
            />

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
                                style={{ color: "var(--dashboard-muted)" }}
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
                        <KV label="Status" value={view.status || "ACTIVE"} />
                        <KV label="Joined" value={formatDate(view.createdAt)} />
                    </dl>
                </Panel>

                <Panel eyebrow="Roles" title="Granted">
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
                        Only an admin can change your batch assignments. If a
                        batch looks wrong, escalate to your institution admin.
                    </p>
                </Panel>
            </section>

            <section className="grid gap-6 lg:grid-cols-4">
                <StatRow
                    label="Batches"
                    value={counts.batches ?? 0}
                    hint={`${counts.activeBatches ?? 0} active`}
                />
                <StatRow label="Students" value={counts.students ?? 0} />
                <StatRow
                    label="Institutions"
                    value={counts.institutions ?? 0}
                />
                <StatRow
                    label="Pending review"
                    value={workload.submissionsPendingReview ?? 0}
                />
            </section>

            <Panel
                eyebrow="Roster"
                title={`Assigned batches (${batches.length})`}
                description="Every batch you're currently teaching. Only an admin can change this list."
                padded={false}
            >
                {batches.length === 0 ? (
                    <div className="px-6 py-8">
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            You're not assigned to any batches yet.
                        </p>
                    </div>
                ) : (
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {batches.map((b) => (
                            <li
                                key={b.id}
                                className="flex items-center justify-between gap-3 px-6 py-3"
                            >
                                <div className="min-w-0">
                                    <p
                                        className="truncate text-sm font-medium"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {b.name}
                                    </p>
                                    <p
                                        className="truncate text-[11px]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {b.course?.title || "—"} ·{" "}
                                        {b.institution?.name || "—"}
                                    </p>
                                </div>
                                <span
                                    className="shrink-0 text-[11px]"
                                    style={{
                                        color: "var(--dashboard-muted)",
                                    }}
                                >
                                    {formatDate(b.startDate)} →{" "}
                                    {b.endDate ? formatDate(b.endDate) : "open"}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
}

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

const StatRow = ({ label, value, hint }) => (
    <div
        className="rounded-xl border px-4 py-4"
        style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
        }}
    >
        <p
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </p>
        <p
            className="mt-2 font-display text-2xl"
            style={{ color: "var(--dashboard-fg)", fontWeight: 500 }}
        >
            {new Intl.NumberFormat().format(Number(value) || 0)}
        </p>
        {hint && (
            <p
                className="mt-1 text-xs"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {hint}
            </p>
        )}
    </div>
);
