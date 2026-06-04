"use client";

import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
    ATTENDANCE_TARGET,
    attendanceRate,
    COORD_ICONS,
    computeBatchHealth,
    HealthBar,
    ProjectionTag,
    pluralize,
    RankBadge,
    WinStat,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

const SUB_SEGMENTS = [
    { key: "REVIEWED", label: "Reviewed", color: "#10b981" },
    { key: "SUBMITTED", label: "Awaiting review", color: "#f59e0b" },
    { key: "PENDING", label: "Not submitted", color: "var(--dashboard-muted)" },
];

/**
 * Coordinator Analytics — real, read-only.
 *
 * Every figure is computed live from school-scoped reads: /batches,
 * /attendance?batchId= (per cohort), and /assignments/submissions (scoped to
 * the coordinator's institutions). Positive signals lead; cohorts rank by
 * attendance, highest first. No number here is fabricated — empty inputs read
 * as "—", never as zero-dressed-as-data.
 */
export default function CoordinatorAnalyticsPage() {
    const [model, setModel] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        setModel(null);
        try {
            const batchesRes = await api("/batches");
            const batches = Array.isArray(batchesRes?.data)
                ? batchesRes.data
                : [];

            const [attLists, submissionsRes] = await Promise.all([
                Promise.all(
                    batches.map((b) =>
                        api(
                            `/attendance?batchId=${encodeURIComponent(b.id)}&limit=300`,
                        )
                            .then((r) => (Array.isArray(r?.data) ? r.data : []))
                            .catch(() => []),
                    ),
                ),
                api("/assignments/submissions")
                    .then((r) => (Array.isArray(r?.data) ? r.data : []))
                    .catch(() => []),
            ]);

            const cohortRows = batches
                .map((b, i) => ({
                    batch: b,
                    att: attendanceRate(attLists[i]),
                    health: computeBatchHealth(b),
                }))
                .sort(
                    (a, b) =>
                        (b.att.rate ?? -1) - (a.att.rate ?? -1) ||
                        b.health.enrolled - a.health.enrolled,
                );

            const overallAtt = attendanceRate(attLists.flat());
            const students = batches.reduce(
                (s, b) => s + (b._count?.students ?? 0),
                0,
            );
            const strong = cohortRows.filter(
                (r) => r.health.tier === "strong",
            ).length;

            const subCounts = { PENDING: 0, SUBMITTED: 0, REVIEWED: 0 };
            for (const s of submissionsRes) {
                if (subCounts[s.status] !== undefined) subCounts[s.status] += 1;
            }
            const subTotal = submissionsRes.length;
            const reviewedShare = subTotal
                ? Math.round((subCounts.REVIEWED / subTotal) * 100)
                : null;

            setModel({
                cohortRows,
                overallAtt,
                students,
                strong,
                cohorts: batches.length,
                subCounts,
                subTotal,
                reviewedShare,
            });
        } catch (err) {
            setError(err.message);
        }
    }, []);

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
    if (!model) return <PageLoading label="Crunching the numbers" />;

    const attendedRows = model.cohortRows.filter((r) => r.att.rate !== null);

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Analytics"
                title="Your school's signal, distilled."
                subtitle="Read-only aggregates computed live from raw operational data — attendance, submissions, enrolment. The projection never touches the record."
                actions={<ProjectionTag />}
            />

            {model.cohorts === 0 ? (
                <PageEmpty
                    title="Nothing to chart yet"
                    description="Analytics populate as soon as your school runs its first cohort."
                />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <WinStat
                            label="Avg attendance"
                            value={
                                model.overallAtt.rate === null
                                    ? "—"
                                    : `${model.overallAtt.rate}%`
                            }
                            sub={
                                model.overallAtt.rate === null
                                    ? "no sessions yet"
                                    : `${pluralize(model.overallAtt.total, "mark")} counted`
                            }
                            tier={
                                model.overallAtt.rate === null
                                    ? "setup"
                                    : model.overallAtt.rate >= ATTENDANCE_TARGET
                                      ? "strong"
                                      : "watch"
                            }
                            icon={COORD_ICONS.pulse}
                        />
                        <WinStat
                            label="Work reviewed"
                            value={
                                model.reviewedShare === null
                                    ? "—"
                                    : `${model.reviewedShare}%`
                            }
                            sub={
                                model.subTotal
                                    ? `${model.subCounts.REVIEWED} of ${model.subTotal} submissions`
                                    : "no submissions yet"
                            }
                            tier={
                                model.reviewedShare === null
                                    ? "setup"
                                    : model.reviewedShare >= 75
                                      ? "strong"
                                      : "steady"
                            }
                            icon={COORD_ICONS.check}
                        />
                        <WinStat
                            label="Students engaged"
                            value={model.students}
                            sub={`across ${pluralize(model.cohorts, "cohort")}`}
                            icon={COORD_ICONS.users}
                        />
                        <WinStat
                            label="Strong cohorts"
                            value={`${model.strong}/${model.cohorts}`}
                            sub="staffed, active, enrolled"
                            tier={model.strong > 0 ? "strong" : "steady"}
                            icon={COORD_ICONS.spark}
                        />
                    </section>

                    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                        <Panel
                            eyebrow="Attendance"
                            title="By cohort, highest first"
                            description="Live attended share per cohort. Cohorts with no sessions yet sit at the end."
                            padded={false}
                        >
                            {attendedRows.length === 0 ? (
                                <div className="px-6 py-8">
                                    <p
                                        className="text-sm"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        No attendance has been marked in any
                                        cohort yet. Rates appear here the moment
                                        a trainer records a session.
                                    </p>
                                </div>
                            ) : (
                                <ul>
                                    {model.cohortRows.map((r, i) => (
                                        <li
                                            key={r.batch.id}
                                            className="flex items-center gap-4 border-b px-6 py-3.5 last:border-b-0"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                            }}
                                        >
                                            <RankBadge n={i + 1} />
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="truncate text-sm font-semibold"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {r.batch.name}
                                                </p>
                                                <div className="mt-1.5">
                                                    <HealthBar
                                                        value={r.att.rate ?? 0}
                                                        tier={
                                                            r.att.rate === null
                                                                ? "setup"
                                                                : r.att.rate >=
                                                                    ATTENDANCE_TARGET
                                                                  ? "strong"
                                                                  : "watch"
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <span
                                                className="w-16 shrink-0 text-right font-display text-base"
                                                style={{
                                                    color:
                                                        r.att.rate === null
                                                            ? "var(--dashboard-muted)"
                                                            : "var(--dashboard-fg)",
                                                }}
                                            >
                                                {r.att.rate === null
                                                    ? "—"
                                                    : `${r.att.rate}%`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>

                        <Panel
                            eyebrow="Submissions"
                            title="Throughput"
                            description="Where assignment work sits right now."
                        >
                            {model.subTotal === 0 ? (
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    No submissions in your school yet. Once
                                    students start submitting, the reviewed
                                    share and backlog show here.
                                </p>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex h-3 overflow-hidden rounded-full">
                                        {SUB_SEGMENTS.map((seg) => {
                                            const v = model.subCounts[seg.key];
                                            const pct = model.subTotal
                                                ? (v / model.subTotal) * 100
                                                : 0;
                                            if (pct === 0) return null;
                                            return (
                                                <div
                                                    key={seg.key}
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor:
                                                            seg.color,
                                                    }}
                                                    title={`${seg.label}: ${v}`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <ul className="space-y-2.5">
                                        {SUB_SEGMENTS.map((seg) => (
                                            <li
                                                key={seg.key}
                                                className="flex items-center justify-between gap-3 text-sm"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                seg.color,
                                                        }}
                                                    />
                                                    <span
                                                        style={{
                                                            color: "var(--dashboard-fg)",
                                                        }}
                                                    >
                                                        {seg.label}
                                                    </span>
                                                </span>
                                                <span
                                                    className="font-display text-base"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {model.subCounts[seg.key]}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p
                                        className="border-t pt-3 text-[11px]"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {model.subCounts.SUBMITTED > 0
                                            ? `${pluralize(model.subCounts.SUBMITTED, "submission")} awaiting a trainer's review.`
                                            : "No review backlog — trainers are caught up."}
                                    </p>
                                </div>
                            )}
                        </Panel>
                    </div>
                </>
            )}
        </div>
    );
}
