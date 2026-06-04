"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
    formatDate,
    Pill,
    StatusPill,
} from "@/features/dashboard/admin/adminShared";
import { fetchAdminOverview } from "@/features/dashboard/api/adminDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

export default function AdminOverview() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            setData(await fetchAdminOverview());
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (error) {
        return (
            <PageError
                title="Couldn't load overview"
                message={error}
                onRetry={load}
            />
        );
    }
    if (!data) return <PageLoading label="Loading overview" />;

    const institutions = data.scope?.institutions ?? [];
    const kpis = Array.isArray(data.kpis) ? data.kpis : [];
    const attendance = data.attendance30d ?? {};
    const onboarding = data.onboarding ?? {};
    const assignments = data.assignments ?? {};
    const pendingActions = data.pendingActions ?? [];
    const alerts = data.alerts ?? [];
    const recentAnnouncements = data.recentAnnouncements ?? [];
    const recentSubmissions = data.recentSubmissions ?? [];

    const scopeLabel =
        institutions.length === 0
            ? "No institution assigned"
            : institutions.length === 1
              ? institutions[0].name
              : `${institutions.length} institutions`;

    if (institutions.length === 0) {
        return (
            <div className="space-y-8">
                <RoleHero
                    eyebrow="Institutional Operations · Overview"
                    title="Your campus operations, at a glance."
                    subtitle="Run the institutions you administer — batches, people, attendance, and delivery."
                />
                <PageEmpty
                    title="No institution in your scope"
                    description="Ask a super-admin to grant your ADMIN role an institution. Once assigned, your operational dashboard appears here."
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Operations · Overview"
                title="Your campus operations, at a glance."
                subtitle={`Operational truth for ${scopeLabel}. Use the action queue below to keep delivery on track.`}
                actions={
                    <>
                        <Link
                            href="/dashboard/admin/students"
                            className="rounded-md border px-3 py-2 text-xs font-semibold"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                            }}
                        >
                            Onboard students
                        </Link>
                        <Link
                            href="/dashboard/admin/batches"
                            className="rounded-md px-3 py-2 text-xs font-semibold"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Manage batches
                        </Link>
                    </>
                }
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((k) => (
                    <StatTile
                        key={k.label}
                        label={k.label}
                        value={k.value}
                        footnote={k.hint}
                    />
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Panel
                    eyebrow="Action queue"
                    title="Pending operational actions"
                    description={
                        pendingActions.length === 0
                            ? "Nothing needs your attention right now."
                            : "Highest-leverage items first."
                    }
                >
                    {pendingActions.length === 0 ? (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            All onboarding is complete and no reviews are backed
                            up.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {pendingActions.map((a) => (
                                <li key={`${a.kind}-${a.label}`}>
                                    <Link
                                        href={a.href || "#"}
                                        className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors hover:opacity-90"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <span
                                            className="text-sm"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {a.label}
                                        </span>
                                        <span
                                            className="shrink-0 text-xs font-semibold"
                                            style={{
                                                color: "var(--role-accent)",
                                            }}
                                        >
                                            Resolve →
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    eyebrow="Health"
                    title="Operational alerts"
                    description={
                        alerts.length === 0
                            ? "No active alerts across your institutions."
                            : null
                    }
                >
                    {alerts.length === 0 ? (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Attendance and institution health look good.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {alerts.map((al) => (
                                <li
                                    key={`${al.kind}-${al.label}`}
                                    className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <span className="flex items-center gap-2">
                                        <Pill
                                            tone={
                                                al.severity === "warning"
                                                    ? "warning"
                                                    : "info"
                                            }
                                        >
                                            {al.severity}
                                        </Pill>
                                        <span
                                            className="text-sm"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {al.label}
                                        </span>
                                    </span>
                                    {al.href && (
                                        <Link
                                            href={al.href}
                                            className="shrink-0 text-xs font-semibold"
                                            style={{
                                                color: "var(--role-accent)",
                                            }}
                                        >
                                            View →
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </section>

            <section className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <Panel
                        eyebrow="Operations"
                        title="Attendance · last 30 days"
                        description="Presence across all batches in your institutions."
                    >
                        {!attendance.total ? (
                            <PageEmpty title="No attendance recorded in this window" />
                        ) : (
                            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                                <div
                                    className="flex flex-col items-center justify-center rounded-xl border px-4 py-6"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "color-mix(in srgb, var(--dashboard-surface) 92%, var(--role-accent) 8%)",
                                    }}
                                >
                                    <p
                                        className="text-[11px] uppercase tracking-[0.24em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        Presence
                                    </p>
                                    <p
                                        className="mt-2 font-display text-5xl tracking-tight"
                                        style={{
                                            color: "var(--role-accent)",
                                            fontWeight: 400,
                                        }}
                                    >
                                        {attendance.ratePercent ?? "—"}
                                        <span className="align-top text-2xl">
                                            %
                                        </span>
                                    </p>
                                    <p
                                        className="mt-1 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {attendance.total} records
                                    </p>
                                </div>
                                <dl className="grid grid-cols-3 gap-3">
                                    <AttendanceCell
                                        label="Present"
                                        value={attendance.PRESENT}
                                        tone="success"
                                    />
                                    <AttendanceCell
                                        label="Late"
                                        value={attendance.LATE}
                                        tone="warning"
                                    />
                                    <AttendanceCell
                                        label="Absent"
                                        value={attendance.ABSENT}
                                        tone="danger"
                                    />
                                </dl>
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="lg:col-span-2">
                    <Panel eyebrow="Onboarding · 30d" title="Growth this month">
                        <dl className="space-y-3 text-sm">
                            <KeyValue
                                label="New students"
                                value={onboarding.studentsLast30d}
                            />
                            <KeyValue
                                label="New trainers"
                                value={onboarding.trainersLast30d}
                            />
                            <KeyValue
                                label="New batches"
                                value={onboarding.batchesLast30d}
                            />
                            <KeyValue
                                label="Assignments submitted"
                                value={assignments.submittedLast30d}
                            />
                            <KeyValue
                                label="Pending reviews"
                                value={assignments.pendingReview}
                                emphasis
                            />
                        </dl>
                    </Panel>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Panel
                    eyebrow="Communications"
                    title="Recent announcements"
                    actions={
                        <Link
                            href="/dashboard/admin/announcements"
                            className="text-xs font-semibold"
                            style={{ color: "var(--role-accent)" }}
                        >
                            All →
                        </Link>
                    }
                >
                    {recentAnnouncements.length === 0 ? (
                        <PageEmpty title="No announcements yet" />
                    ) : (
                        <ul className="space-y-3">
                            {recentAnnouncements.map((a) => (
                                <li
                                    key={a.id}
                                    className="rounded-lg border px-3 py-3"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <p
                                        className="font-display text-sm font-medium"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {a.title}
                                    </p>
                                    <p
                                        className="mt-0.5 text-[11px] uppercase tracking-[0.18em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {[
                                            a.batchName,
                                            a.authorName,
                                            formatDate(a.createdAt),
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    eyebrow="Activity"
                    title="Recent submissions"
                    actions={
                        <Link
                            href="/dashboard/admin/assignments"
                            className="text-xs font-semibold"
                            style={{ color: "var(--role-accent)" }}
                        >
                            Oversight →
                        </Link>
                    }
                >
                    {recentSubmissions.length === 0 ? (
                        <PageEmpty title="No submissions yet" />
                    ) : (
                        <ul className="space-y-3">
                            {recentSubmissions.map((s) => (
                                <li
                                    key={s.id}
                                    className="rounded-lg border px-3 py-3"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p
                                            className="truncate font-display text-sm font-medium"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {s.assignmentTitle ||
                                                "Untitled assignment"}
                                        </p>
                                        <StatusPill status={s.status} />
                                    </div>
                                    <p
                                        className="mt-1 text-[11px] uppercase tracking-[0.18em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {[
                                            s.studentName || "Unknown",
                                            formatDate(
                                                s.submittedAt || s.createdAt,
                                            ),
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </section>
        </div>
    );
}

function AttendanceCell({ label, value, tone }) {
    const toneFg =
        tone === "success"
            ? "#047857"
            : tone === "warning"
              ? "#92400e"
              : "#b91c1c";
    const toneBg =
        tone === "success"
            ? "rgba(16, 185, 129, 0.10)"
            : tone === "warning"
              ? "rgba(217, 119, 6, 0.10)"
              : "rgba(220, 38, 38, 0.10)";
    return (
        <div
            className="rounded-xl border px-3 py-4 text-center"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: toneBg,
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
                style={{ color: toneFg, fontWeight: 500 }}
            >
                {new Intl.NumberFormat().format(Number(value) || 0)}
            </p>
        </div>
    );
}

function KeyValue({ label, value, emphasis = false }) {
    return (
        <div className="flex items-center justify-between">
            <dt style={{ color: "var(--dashboard-muted)" }}>{label}</dt>
            <dd
                className={
                    emphasis ? "font-display text-lg" : "text-sm font-medium"
                }
                style={{
                    color: emphasis
                        ? "var(--role-accent)"
                        : "var(--dashboard-fg)",
                }}
            >
                {value != null
                    ? new Intl.NumberFormat().format(Number(value) || 0)
                    : "—"}
            </dd>
        </div>
    );
}
