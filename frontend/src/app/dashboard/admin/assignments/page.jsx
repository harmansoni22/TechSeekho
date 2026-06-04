"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    formatDate,
    MiniBars,
    Pill,
    RangePicker,
    StatusPill,
} from "@/features/dashboard/admin/adminShared";
import {
    fetchAdminAnalytics,
    fetchSubmissions,
} from "@/features/dashboard/api/adminDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

export default function AdminAssignmentsPage() {
    const [range, setRange] = useState("30d");
    const [analytics, setAnalytics] = useState(null);
    const [pending, setPending] = useState(null);
    const [recent, setRecent] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        setAnalytics(null);
        try {
            const [a, pendingRes, recentRes] = await Promise.all([
                fetchAdminAnalytics({ range }),
                fetchSubmissions({ status: "SUBMITTED", limit: 200 }),
                fetchSubmissions({ limit: 12 }),
            ]);
            setAnalytics(a);
            setPending(Array.isArray(pendingRes) ? pendingRes : []);
            setRecent(Array.isArray(recentRes) ? recentRes : []);
        } catch (err) {
            setError(err.message);
        }
    }, [range]);

    useEffect(() => {
        load();
    }, [load]);

    const pendingByBatch = useMemo(() => {
        const map = new Map();
        for (const s of pending ?? []) {
            const id = s.assignment?.batch?.id ?? "none";
            const name = s.assignment?.batch?.name ?? "Unknown batch";
            const e = map.get(id) || { name, count: 0 };
            e.count += 1;
            map.set(id, e);
        }
        return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }, [pending]);

    if (error)
        return (
            <PageError
                title="Couldn't load assignments"
                message={error}
                onRetry={load}
            />
        );
    if (!analytics) return <PageLoading label="Loading assignments" />;

    const totalAssignments = analytics.totals?.assignments ?? 0;
    const totalSubmissions = analytics.totals?.submissions ?? 0;
    const completion = analytics.rates?.submissionCompletion;
    const pendingCount = pending?.length ?? 0;
    const series = analytics.series?.submissions ?? [];

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Operations · Assignments"
                title="Delivery completion at a glance."
                subtitle="Oversight only — trainers create assignments and grade submissions. You watch completion, chase pending reviews, and spot stalled batches."
                actions={<RangePicker range={range} setRange={setRange} />}
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Assignments" value={totalAssignments} />
                <StatTile
                    label={`Submissions (${range})`}
                    value={totalSubmissions}
                />
                <StatTile
                    label="Awaiting review"
                    value={pendingCount}
                    footnote={
                        pendingCount > 0 ? "trainer action" : "all reviewed"
                    }
                />
                <StatTile
                    label={`Completion (${range})`}
                    value={completion == null ? "—" : `${completion}%`}
                />
            </section>

            <Panel
                eyebrow="Trend"
                title={`Submissions per day · ${range}`}
                description="Submission volume across your institutions."
            >
                {series.length === 0 || totalSubmissions === 0 ? (
                    <PageEmpty title="No submissions in this window" />
                ) : (
                    <MiniBars series={series} />
                )}
            </Panel>

            <section className="grid gap-6 lg:grid-cols-2">
                <Panel
                    eyebrow="Backlog"
                    title="Pending reviews by batch"
                    description={
                        pendingByBatch.length === 0
                            ? "No submissions are waiting on review."
                            : "Batches whose trainers are behind on grading."
                    }
                >
                    {pendingByBatch.length === 0 ? (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Every submitted assignment has been reviewed.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {pendingByBatch.map((b) => (
                                <li
                                    key={b.name}
                                    className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <span
                                        className="text-sm"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {b.name}
                                    </span>
                                    <Pill
                                        tone={
                                            b.count > 5 ? "danger" : "warning"
                                        }
                                    >
                                        {b.count} pending
                                    </Pill>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    eyebrow="Capacity"
                    title="Assignments per batch"
                    description="Where delivery is concentrated."
                >
                    {(analytics.batchPerformance ?? []).length === 0 ? (
                        <PageEmpty title="No batches yet" />
                    ) : (
                        <ul className="space-y-2">
                            {[...(analytics.batchPerformance ?? [])]
                                .sort((a, b) => b.assignments - a.assignments)
                                .slice(0, 8)
                                .map((b) => (
                                    <li
                                        key={b.id}
                                        className="flex items-center justify-between gap-3 text-sm"
                                    >
                                        <span
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {b.name}
                                        </span>
                                        <span
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {b.assignments} assignment
                                            {b.assignments === 1 ? "" : "s"}
                                        </span>
                                    </li>
                                ))}
                        </ul>
                    )}
                </Panel>
            </section>

            <Panel eyebrow="Activity" title="Recent submissions" padded={false}>
                {(recent ?? []).length === 0 ? (
                    <div className="px-6 py-8">
                        <PageEmpty title="No submissions yet" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr
                                    className="text-[10px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    <th className="px-6 py-3 font-medium">
                                        Assignment
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Student
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Batch
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Submitted
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="border-t"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td
                                            className="px-6 py-3"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {s.assignment?.title ?? "—"}
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {s.student?.user?.fullName ?? "—"}
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {s.assignment?.batch?.name ?? "—"}
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusPill status={s.status} />
                                        </td>
                                        <td
                                            className="px-6 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {formatDate(
                                                s.submittedAt || s.createdAt,
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </div>
    );
}
