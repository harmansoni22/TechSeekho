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
    TierChip,
    tierOf,
    WinStat,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

function blendedTier(score) {
    if (score >= 80) return "strong";
    if (score >= 60) return "steady";
    if (score >= 40) return "watch";
    return "setup";
}

/**
 * Coordinator Progress — real, read-only.
 *
 * Each cohort's standing is computed from school-scoped reads only: /batches
 * (enrolment, staffing, activation) blended with the real attendance rate from
 * /attendance?batchId=. Cohorts rank best-first. We do NOT invent module-
 * completion numbers — when no coordinator-scoped completion feed exists, the
 * page says so rather than fabricate a bar.
 */
export default function CoordinatorProgressPage() {
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

            const attLists = await Promise.all(
                batches.map((b) =>
                    api(
                        `/attendance?batchId=${encodeURIComponent(b.id)}&limit=300`,
                    )
                        .then((r) => (Array.isArray(r?.data) ? r.data : []))
                        .catch(() => []),
                ),
            );

            const rows = batches
                .map((b, i) => {
                    const health = computeBatchHealth(b);
                    const att = attendanceRate(attLists[i]);
                    const blended =
                        att.rate === null
                            ? health.score
                            : Math.round(0.5 * health.score + 0.5 * att.rate);
                    return {
                        batch: b,
                        health,
                        att,
                        blended,
                        tier: blendedTier(blended),
                    };
                })
                .sort(
                    (a, b) =>
                        b.blended - a.blended ||
                        b.health.enrolled - a.health.enrolled,
                );

            const withAttendance = rows.filter((r) => r.att.rate !== null);
            const avgAttendance = withAttendance.length
                ? Math.round(
                      withAttendance.reduce((s, r) => s + r.att.rate, 0) /
                          withAttendance.length,
                  )
                : null;
            const onTrack = rows.filter((r) => r.tier === "strong").length;
            const studentsActive = rows
                .filter((r) => r.health.active)
                .reduce((s, r) => s + r.health.enrolled, 0);
            const staffed = rows.filter((r) => r.health.staffed).length;

            setModel({
                rows,
                avgAttendance,
                onTrack,
                studentsActive,
                staffed,
                total: rows.length,
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
                title="Couldn't load progress"
                message={error}
                onRetry={load}
            />
        );
    if (!model) return <PageLoading label="Computing cohort progress" />;

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Progress"
                title="Where every cohort stands."
                subtitle="A read-only projection that blends roster readiness with real attendance. Best-standing cohorts first. The raw record stays owned by trainers."
                actions={<ProjectionTag />}
            />

            {model.total === 0 ? (
                <PageEmpty
                    title="No cohorts to track yet"
                    description="Progress appears here as soon as your school has a batch with students."
                />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <WinStat
                            label="On track"
                            value={`${model.onTrack}/${model.total}`}
                            sub="cohorts in strong standing"
                            tier={model.onTrack > 0 ? "strong" : "steady"}
                            icon={COORD_ICONS.pulse}
                        />
                        <WinStat
                            label="Avg attendance"
                            value={
                                model.avgAttendance === null
                                    ? "—"
                                    : `${model.avgAttendance}%`
                            }
                            sub={
                                model.avgAttendance === null
                                    ? "no sessions recorded yet"
                                    : `target ${ATTENDANCE_TARGET}%`
                            }
                            tier={
                                model.avgAttendance === null
                                    ? "setup"
                                    : model.avgAttendance >= ATTENDANCE_TARGET
                                      ? "strong"
                                      : "watch"
                            }
                        />
                        <WinStat
                            label="Students progressing"
                            value={model.studentsActive}
                            sub="in active cohorts"
                        />
                        <WinStat
                            label="Cohorts staffed"
                            value={`${model.staffed}/${model.total}`}
                            sub="have a trainer"
                            tier={
                                model.staffed === model.total
                                    ? "strong"
                                    : "steady"
                            }
                        />
                    </section>

                    <Panel
                        eyebrow="Standing"
                        title="Cohorts, best first"
                        description="Readiness blends staffing, activation, and enrolment; attendance is the live marked rate."
                        padded={false}
                    >
                        <ul>
                            {model.rows.map((r, i) => (
                                <li
                                    key={r.batch.id}
                                    className="flex flex-col gap-3 border-b px-6 py-4 last:border-b-0 md:flex-row md:items-center md:gap-6"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-4">
                                        <RankBadge n={i + 1} />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p
                                                    className="truncate font-display text-base"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {r.batch.name}
                                                </p>
                                                <TierChip tier={r.tier} />
                                            </div>
                                            <p
                                                className="mt-0.5 truncate text-xs"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {r.batch.institution?.name ??
                                                    "—"}
                                                {r.batch.course?.title
                                                    ? ` · ${r.batch.course.title}`
                                                    : ""}{" "}
                                                ·{" "}
                                                {pluralize(
                                                    r.health.enrolled,
                                                    "student",
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid flex-1 gap-3 sm:grid-cols-2 md:max-w-md">
                                        <ProgressMeter
                                            label="Readiness"
                                            value={r.health.score}
                                            tier={tierOf(r.health.tier).key}
                                            caption={`${r.health.score}%`}
                                        />
                                        <ProgressMeter
                                            label="Attendance"
                                            value={r.att.rate ?? 0}
                                            tier={
                                                r.att.rate === null
                                                    ? "setup"
                                                    : r.att.rate >=
                                                        ATTENDANCE_TARGET
                                                      ? "strong"
                                                      : "watch"
                                            }
                                            caption={
                                                r.att.rate === null
                                                    ? "no sessions yet"
                                                    : `${r.att.rate}%`
                                            }
                                            empty={r.att.rate === null}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <p
                            className="border-t px-6 py-3 text-[11px]"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-muted)",
                            }}
                        >
                            Readiness and attendance are computed live from raw
                            operational data. Module-by-module completion will
                            join this view once a coordinator-scoped completion
                            feed is available — until then it is intentionally
                            left blank rather than estimated.
                        </p>
                    </Panel>
                </>
            )}
        </div>
    );
}

function ProgressMeter({ label, value, tier, caption, empty }) {
    return (
        <div>
            <div className="flex items-center justify-between gap-2">
                <span
                    className="text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {label}
                </span>
                <span
                    className="text-[11px]"
                    style={{
                        color: empty
                            ? "var(--dashboard-muted)"
                            : "var(--dashboard-fg)",
                    }}
                >
                    {caption}
                </span>
            </div>
            <div className="mt-1.5">
                {empty ? (
                    <div
                        className="progress-track h-1.5 w-full rounded-full opacity-60"
                        role="presentation"
                    />
                ) : (
                    <HealthBar value={value} tier={tier} height={6} />
                )}
            </div>
        </div>
    );
}
