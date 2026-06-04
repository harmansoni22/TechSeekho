"use client";

import { useCallback, useEffect, useState } from "react";
import {
    MetricBar,
    MiniBars,
    Pill,
    RangePicker,
} from "@/features/dashboard/admin/adminShared";
import { fetchAdminAnalytics } from "@/features/dashboard/api/adminDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

export default function AdminAnalyticsPage() {
    const [range, setRange] = useState("30d");
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        setData(null);
        try {
            setData(await fetchAdminAnalytics({ range }));
        } catch (err) {
            setError(err.message);
        }
    }, [range]);

    useEffect(() => {
        load();
    }, [load]);

    if (error)
        return (
            <PageError
                title="Couldn't load analytics"
                message={error}
                onRetry={load}
            />
        );
    if (!data) return <PageLoading label="Loading analytics" />;

    const totals = data.totals ?? {};
    const rates = data.rates ?? {};
    const batchPerformance = data.batchPerformance ?? [];
    const trainerActivity = data.trainerActivity ?? [];

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Operations · Analytics"
                title="Operational health, measured."
                subtitle="Every figure here is computed from raw operational data — submissions, attendance, enrolments — never a curated projection store."
                actions={<RangePicker range={range} setRange={setRange} />}
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                    label={`New students (${range})`}
                    value={totals.newStudents ?? 0}
                />
                <StatTile
                    label={`Submissions (${range})`}
                    value={totals.submissions ?? 0}
                />
                <StatTile
                    label="Submission completion"
                    value={
                        rates.submissionCompletion == null
                            ? "—"
                            : `${rates.submissionCompletion}%`
                    }
                />
                <StatTile
                    label="Attendance presence"
                    value={
                        rates.attendancePresence == null
                            ? "—"
                            : `${rates.attendancePresence}%`
                    }
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <TrendPanel
                    title="New students"
                    series={data.series?.newStudents}
                    total={totals.newStudents}
                />
                <TrendPanel
                    title="Submissions"
                    series={data.series?.submissions}
                    total={totals.submissions}
                />
                <TrendPanel
                    title="Attendance records"
                    series={data.series?.attendance}
                    total={totals.attendance}
                />
            </section>

            <Panel
                eyebrow="Batches"
                title="Batch performance"
                description="Attendance presence and delivery volume per batch."
                padded={false}
            >
                {batchPerformance.length === 0 ? (
                    <div className="px-6 py-8">
                        <PageEmpty title="No batches in scope" />
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
                                        Batch
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        State
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Students
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Assignments
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Attendance
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {batchPerformance.map((b) => (
                                    <tr
                                        key={b.id}
                                        className="border-t"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td className="px-6 py-3">
                                            <div
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {b.name}
                                            </div>
                                            <div
                                                className="text-xs"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {b.institutionName ?? "—"}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <Pill
                                                tone={
                                                    b.isActive
                                                        ? "success"
                                                        : "muted"
                                                }
                                            >
                                                {b.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Pill>
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {b.students}
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {b.assignments}
                                        </td>
                                        <td className="px-6 py-3">
                                            {b.attendanceRate == null ? (
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    no data
                                                </span>
                                            ) : (
                                                <div className="w-32">
                                                    <div
                                                        className="mb-1 text-xs"
                                                        style={{
                                                            color: "var(--dashboard-fg)",
                                                        }}
                                                    >
                                                        {b.attendanceRate}%
                                                    </div>
                                                    <MetricBar
                                                        value={b.attendanceRate}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            <Panel
                eyebrow="People"
                title="Trainer load"
                description="Batch assignments per trainer — spot over- and under-utilisation."
            >
                {trainerActivity.length === 0 ? (
                    <PageEmpty title="No trainers assigned yet" />
                ) : (
                    <ul className="space-y-3">
                        {trainerActivity.map((t) => (
                            <li key={t.name}>
                                <div className="flex items-center justify-between text-sm">
                                    <span
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {t.name}
                                    </span>
                                    <span
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {t.batches} batch
                                        {t.batches === 1 ? "" : "es"}
                                    </span>
                                </div>
                                <div className="mt-1">
                                    <MetricBar
                                        value={Math.min(
                                            100,
                                            (t.batches /
                                                Math.max(
                                                    1,
                                                    trainerActivity[0].batches,
                                                )) *
                                                100,
                                        )}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
}

function TrendPanel({ title, series, total }) {
    const data = Array.isArray(series) ? series : [];
    return (
        <Panel eyebrow="Trend" title={title}>
            {total ? (
                <>
                    <MiniBars series={data} height="h-24" />
                    <p
                        className="mt-3 text-xs"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {total} in window
                    </p>
                </>
            ) : (
                <p
                    className="text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    No activity in this window.
                </p>
            )}
        </Panel>
    );
}
