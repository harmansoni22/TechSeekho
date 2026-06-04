"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPlatformAnalytics } from "@/features/dashboard/api/superAdmin.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

/**
 * SUPER_ADMIN — Platform Analytics.
 *
 * Reads from `GET /admin/platform/analytics?range=…`. The backend returns
 * pre-bucketed daily series so the frontend doesn't have to know about
 * timezones. We render every series as a small inline sparkbar; no external
 * chart dependency is introduced — that's deliberate, to keep this page
 * cheap to maintain and consistent with the rest of the dashboard.
 */

const RANGE_OPTIONS = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
];

const SERIES_DEFS = [
    {
        key: "newUsers",
        label: "New users",
        description: "Sign-ups per day",
    },
    {
        key: "newInstitutions",
        label: "New institutions",
        description: "Charters per day",
    },
    {
        key: "newBatches",
        label: "New batches",
        description: "Batches created",
    },
    {
        key: "assignmentsCreated",
        label: "Assignments created",
        description: "By trainers, per day",
    },
    {
        key: "submissions",
        label: "Submissions",
        description: "Student submissions per day",
    },
    {
        key: "attendance",
        label: "Attendance records",
        description: "Marks per day",
    },
];

const PlatformAnalyticsPage = () => {
    const [range, setRange] = useState("30d");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchPlatformAnalytics({ range });
            setData(result);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Insight · Platform Analytics"
                title="Trends, not totals."
                subtitle="Snapshot metrics live on the overview. Here we read the movement — daily activity, attendance discipline, submission velocity, institutional growth."
                actions={
                    <div
                        className="inline-flex rounded-md border"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {RANGE_OPTIONS.map((opt) => {
                            const active = opt.value === range;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setRange(opt.value)}
                                    className="px-3 py-2 text-xs font-semibold transition-colors"
                                    style={{
                                        backgroundColor: active
                                            ? "var(--role-accent)"
                                            : "transparent",
                                        color: active
                                            ? "var(--role-accent-ink)"
                                            : "var(--dashboard-fg)",
                                        cursor: "pointer",
                                    }}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                }
            />

            {loading ? (
                <PageLoading label="Loading analytics" />
            ) : error ? (
                <PageError
                    title="Could not load analytics"
                    message={error}
                    onRetry={load}
                />
            ) : !data ? (
                <PageEmpty
                    title="No analytics yet"
                    description="Operational telemetry will appear here as it accrues."
                />
            ) : (
                <>
                    <section className="dash-reveal dash-reveal-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatTile
                            label="New users"
                            value={data.totals?.newUsers ?? 0}
                            footnote={`Over the last ${data.days} days`}
                        />
                        <StatTile
                            label="New institutions"
                            value={data.totals?.newInstitutions ?? 0}
                            footnote="Chartered in window"
                        />
                        <StatTile
                            label="Submission completion"
                            value={
                                data.rates?.submissionCompletion == null
                                    ? "—"
                                    : `${data.rates.submissionCompletion}%`
                            }
                            footnote="Reviewed ÷ submitted"
                        />
                        <StatTile
                            label="Attendance presence"
                            value={
                                data.rates?.attendancePresence == null
                                    ? "—"
                                    : `${data.rates.attendancePresence}%`
                            }
                            footnote="Non-absent ÷ marked"
                        />
                    </section>

                    <section className="dash-reveal dash-reveal-3 grid gap-6 lg:grid-cols-2">
                        {SERIES_DEFS.map((s) => (
                            <Panel
                                key={s.key}
                                eyebrow="Series"
                                title={s.label}
                                description={s.description}
                            >
                                <Sparkbars
                                    series={data.series?.[s.key] ?? []}
                                    total={data.totals?.[s.key] ?? 0}
                                />
                            </Panel>
                        ))}
                    </section>

                    <section className="grid gap-6 lg:grid-cols-5">
                        <Panel
                            eyebrow="Distribution"
                            title="Assessments by status"
                            className="lg:col-span-2"
                        >
                            <ul className="space-y-3">
                                {Object.entries(
                                    data.assessmentsByStatus ?? {},
                                ).map(([status, count]) => (
                                    <li
                                        key={status}
                                        className="flex items-center justify-between"
                                    >
                                        <span
                                            className="text-sm"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {status}
                                        </span>
                                        <span
                                            className="text-sm font-medium"
                                            style={{
                                                color: "var(--role-accent)",
                                            }}
                                        >
                                            {new Intl.NumberFormat().format(
                                                count,
                                            )}
                                        </span>
                                    </li>
                                ))}
                                {Object.keys(data.assessmentsByStatus ?? {})
                                    .length === 0 && (
                                    <p
                                        className="text-sm"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        No assessments recorded yet.
                                    </p>
                                )}
                            </ul>
                        </Panel>

                        <Panel
                            eyebrow="Network"
                            title="Top institutions by engagement"
                            description="Sum of batch + member counts."
                            className="lg:col-span-3"
                            padded={false}
                        >
                            {data.topInstitutions?.length ? (
                                <ul
                                    className="divide-y"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    {data.topInstitutions.map((i) => (
                                        <li
                                            key={i.id}
                                            className="flex items-center justify-between px-6 py-3"
                                        >
                                            <div className="min-w-0">
                                                <p
                                                    className="truncate text-sm font-medium"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {i.name}
                                                </p>
                                                <p
                                                    className="text-[11px]"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {i.batchCount} batches ·{" "}
                                                    {i.memberCount} members
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-6 py-8">
                                    <PageEmpty title="No institutional engagement to rank yet" />
                                </div>
                            )}
                        </Panel>
                    </section>
                </>
            )}
        </div>
    );
};

const Sparkbars = ({ series, total }) => {
    const max = useMemo(
        () => Math.max(1, ...series.map((b) => Number(b.count) || 0)),
        [series],
    );
    if (!series || series.length === 0) {
        return (
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                No data in this window.
            </p>
        );
    }
    return (
        <div>
            <div className="flex items-end gap-[3px]" style={{ height: 96 }}>
                {series.map((b) => {
                    const value = Number(b.count) || 0;
                    const heightPct = (value / max) * 100;
                    return (
                        <div
                            key={b.date}
                            title={`${b.date} · ${value}`}
                            className="flex-1 rounded-t-sm transition-colors"
                            style={{
                                height: `${Math.max(heightPct, value > 0 ? 4 : 1)}%`,
                                backgroundColor:
                                    value > 0
                                        ? "var(--role-accent)"
                                        : "var(--dashboard-border)",
                                opacity: value > 0 ? 0.85 : 0.4,
                            }}
                        />
                    );
                })}
            </div>
            <div
                className="mt-2 flex items-baseline justify-between text-xs"
                style={{ color: "var(--dashboard-muted)" }}
            >
                <span>{series[0]?.date}</span>
                <span>
                    Total: {new Intl.NumberFormat().format(total)} · peak {max}
                </span>
                <span>{series[series.length - 1]?.date}</span>
            </div>
        </div>
    );
};

export default PlatformAnalyticsPage;
