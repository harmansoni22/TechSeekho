"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { fetchTrainerOverview } from "@/features/dashboard/api/trainerDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

/**
 * TRAINER — Overview.
 *
 * One round-trip to `/trainer/overview` populates everything: assigned batches,
 * pending submissions, upcoming deadlines, 30-day attendance, recent activity.
 * The endpoint is server-scoped to the trainer's BatchTrainer assignments —
 * no client-side filtering required.
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

function daysUntil(value) {
    if (!value) return null;
    const target = new Date(value);
    if (Number.isNaN(target.getTime())) return null;
    return Math.ceil((target - Date.now()) / 86_400_000);
}

export default function TrainerOverview() {
    const { data: session } = useSession();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchTrainerOverview();
            setData(result);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <PageLoading label="Loading trainer overview" />;
    if (error)
        return (
            <PageError
                title="Couldn't load overview"
                message={error}
                onRetry={load}
            />
        );
    if (!data) return null;

    const firstName = (session?.user?.name || "").split(" ")[0] || "Trainer";
    const att = data.attendance30d;
    const noBatches = data.counts.batches === 0;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · Overview"
                title={`Good to see you, ${firstName}.`}
                subtitle="Your assigned batches and the operational work that's due next. Coordinator dashboards show projections — this is the raw teaching surface."
                actions={
                    <>
                        <Link
                            href="/dashboard/trainer/attendance"
                            className="rounded-md border px-3 py-2 text-xs font-medium"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                            }}
                        >
                            Mark attendance
                        </Link>
                        <Link
                            href="/dashboard/trainer/submissions"
                            className="rounded-md px-3 py-2 text-xs font-semibold"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Review queue
                        </Link>
                    </>
                }
            />

            {noBatches ? (
                <PageEmpty
                    title="No batches assigned to you yet"
                    description="An admin must assign you to at least one batch before the operational pages light up."
                />
            ) : (
                <>
                    <section className="dash-reveal dash-reveal-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatTile
                            label="My batches"
                            value={data.counts.batches}
                            footnote={`${data.counts.activeBatches} active`}
                        />
                        <StatTile
                            label="Students"
                            value={data.counts.students}
                            footnote={`across ${data.counts.institutions} institution${data.counts.institutions === 1 ? "" : "s"}`}
                        />
                        <StatTile
                            label="Pending review"
                            value={data.workload.submissionsPendingReview}
                            footnote={`${data.workload.submittedLast7d} submitted in last 7d`}
                        />
                        <StatTile
                            label="Attendance · 30d"
                            value={
                                att.ratePercent == null
                                    ? "—"
                                    : `${att.ratePercent}%`
                            }
                            footnote={`${att.total} records`}
                        />
                    </section>

                    <section className="dash-reveal dash-reveal-3 grid gap-6 lg:grid-cols-5">
                        <Panel
                            eyebrow="Workload"
                            title="Upcoming deadlines"
                            description="Assignments due in the next two weeks across your batches."
                            className="lg:col-span-3"
                            actions={
                                <Link
                                    href="/dashboard/trainer/assignments"
                                    className="text-xs font-semibold"
                                    style={{ color: "var(--role-accent)" }}
                                >
                                    All assignments →
                                </Link>
                            }
                            padded={false}
                        >
                            {data.upcomingDeadlines.length === 0 ? (
                                <div className="px-6 py-8">
                                    <PageEmpty
                                        title="Nothing due in the next 14 days"
                                        description="Create assignments from the Assignments page."
                                    />
                                </div>
                            ) : (
                                <ul
                                    className="divide-y"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    {data.upcomingDeadlines.map((a) => {
                                        const d = daysUntil(a.dueDate);
                                        const tone =
                                            d != null && d <= 2 ? "warn" : "ok";
                                        return (
                                            <li
                                                key={a.id}
                                                className="px-6 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <Link
                                                        href={`/dashboard/trainer/assignments/${a.id}`}
                                                        className="min-w-0 hover:underline"
                                                        style={{
                                                            color: "var(--dashboard-fg)",
                                                        }}
                                                    >
                                                        <p className="truncate font-display text-base">
                                                            {a.title}
                                                        </p>
                                                        <p
                                                            className="mt-0.5 truncate text-[11px]"
                                                            style={{
                                                                color: "var(--dashboard-muted)",
                                                            }}
                                                        >
                                                            {a.batchName || "—"}{" "}
                                                            ·{" "}
                                                            {a.submissionCount}{" "}
                                                            submission
                                                            {a.submissionCount ===
                                                            1
                                                                ? ""
                                                                : "s"}{" "}
                                                            so far
                                                        </p>
                                                    </Link>
                                                    <span
                                                        className="shrink-0 text-xs font-semibold"
                                                        style={{
                                                            color:
                                                                tone === "warn"
                                                                    ? "#92400e"
                                                                    : "var(--role-accent)",
                                                        }}
                                                    >
                                                        {d === 0
                                                            ? "due today"
                                                            : d === 1
                                                              ? "tomorrow"
                                                              : `${d}d left`}
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>

                        <Panel
                            eyebrow="Attendance"
                            title="Last 30 days"
                            description="Across every batch you teach."
                            className="lg:col-span-2"
                        >
                            {att.total === 0 ? (
                                <PageEmpty title="No attendance recorded yet" />
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    <AttendanceCell
                                        label="Present"
                                        value={att.PRESENT}
                                        tone="success"
                                    />
                                    <AttendanceCell
                                        label="Late"
                                        value={att.LATE}
                                        tone="warning"
                                    />
                                    <AttendanceCell
                                        label="Absent"
                                        value={att.ABSENT}
                                        tone="danger"
                                    />
                                </div>
                            )}
                        </Panel>
                    </section>

                    <section className="dash-reveal dash-reveal-4 grid gap-6 lg:grid-cols-2">
                        <Panel
                            eyebrow="Cohorts"
                            title="My batches"
                            description="Click into a batch for the full roster and operational metrics."
                            actions={
                                <Link
                                    href="/dashboard/trainer/batches"
                                    className="text-xs font-semibold"
                                    style={{ color: "var(--role-accent)" }}
                                >
                                    All batches →
                                </Link>
                            }
                            padded={false}
                        >
                            <ul
                                className="divide-y"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                {data.batches.slice(0, 6).map((b) => (
                                    <li key={b.id} className="px-6 py-3">
                                        <Link
                                            href={`/dashboard/trainer/batches/${b.id}`}
                                            className="flex items-center justify-between gap-2 hover:underline"
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
                                                    {b.courseTitle || "—"} ·{" "}
                                                    {b.institutionName || "—"} ·{" "}
                                                    {b.studentCount} student
                                                    {b.studentCount === 1
                                                        ? ""
                                                        : "s"}
                                                </p>
                                            </div>
                                            <span
                                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor: b.isActive
                                                        ? "rgba(16, 185, 129, 0.12)"
                                                        : "rgba(148, 163, 184, 0.18)",
                                                    color: b.isActive
                                                        ? "#047857"
                                                        : "var(--dashboard-muted)",
                                                }}
                                            >
                                                {b.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </Panel>

                        <Panel
                            eyebrow="Activity"
                            title="Recent submissions"
                            description="What students have turned in across your batches."
                            actions={
                                <Link
                                    href="/dashboard/trainer/submissions"
                                    className="text-xs font-semibold"
                                    style={{ color: "var(--role-accent)" }}
                                >
                                    Review →
                                </Link>
                            }
                            padded={false}
                        >
                            {data.recentSubmissions.length === 0 ? (
                                <div className="px-6 py-8">
                                    <PageEmpty title="No submissions yet" />
                                </div>
                            ) : (
                                <ul
                                    className="divide-y"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    {data.recentSubmissions.map((s) => (
                                        <li key={s.id} className="px-6 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p
                                                        className="truncate text-sm font-medium"
                                                        style={{
                                                            color: "var(--dashboard-fg)",
                                                        }}
                                                    >
                                                        {s.assignmentTitle ||
                                                            "—"}
                                                    </p>
                                                    <p
                                                        className="truncate text-[11px]"
                                                        style={{
                                                            color: "var(--dashboard-muted)",
                                                        }}
                                                    >
                                                        {s.studentName ||
                                                            "Unknown"}{" "}
                                                        · {s.batchName || "—"} ·{" "}
                                                        {formatDate(
                                                            s.submittedAt ||
                                                                s.createdAt,
                                                        )}
                                                    </p>
                                                </div>
                                                <StatusPill status={s.status} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    </section>

                    {data.recentAnnouncements.length > 0 && (
                        <Panel
                            eyebrow="Communication"
                            title="Recent announcements"
                            description="Latest five across batches you teach — including those authored by other trainers/admins."
                            actions={
                                <Link
                                    href="/dashboard/trainer/community"
                                    className="text-xs font-semibold"
                                    style={{ color: "var(--role-accent)" }}
                                >
                                    All announcements →
                                </Link>
                            }
                            padded={false}
                        >
                            <ul
                                className="divide-y"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                {data.recentAnnouncements.map((a) => (
                                    <li key={a.id} className="px-6 py-3">
                                        <p
                                            className="text-sm font-medium"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {a.title}
                                        </p>
                                        <p
                                            className="mt-0.5 text-[11px]"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {a.batchName || "—"} ·{" "}
                                            {a.authorName || "Unknown"} ·{" "}
                                            {formatDate(a.createdAt)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    )}
                </>
            )}
        </div>
    );
}

const AttendanceCell = ({ label, value, tone }) => {
    const fg =
        tone === "success"
            ? "#047857"
            : tone === "warning"
              ? "#92400e"
              : "#b91c1c";
    const bg =
        tone === "success"
            ? "rgba(16, 185, 129, 0.10)"
            : tone === "warning"
              ? "rgba(217, 119, 6, 0.10)"
              : "rgba(220, 38, 38, 0.10)";
    return (
        <div
            className="rounded-lg border px-3 py-3 text-center"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: bg,
            }}
        >
            <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </p>
            <p
                className="mt-1 font-display text-2xl"
                style={{ color: fg, fontWeight: 500 }}
            >
                {new Intl.NumberFormat().format(Number(value) || 0)}
            </p>
        </div>
    );
};

const StatusPill = ({ status }) => {
    const map = {
        PENDING: {
            fg: "var(--dashboard-muted)",
            bg: "rgba(148, 163, 184, 0.16)",
        },
        SUBMITTED: { fg: "#92400e", bg: "rgba(217, 119, 6, 0.14)" },
        REVIEWED: { fg: "#047857", bg: "rgba(16, 185, 129, 0.14)" },
    };
    const c = map[status] || map.PENDING;
    return (
        <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: c.bg, color: c.fg }}
        >
            {status}
        </span>
    );
};
