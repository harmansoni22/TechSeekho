"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
    COORD_ICONS,
    HealthBar,
    ProjectionTag,
    pluralize,
    RankBadge,
    WinStat,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

/**
 * Coordinator Students — read-only enrolment projection.
 *
 * Counts come straight from school-scoped /batches. Cohorts rank by enrolment,
 * fullest first. There is no assign/remove control: roster changes are an
 * admin/trainer action. Empty cohorts stay visible, just lower and calmer.
 */
export default function CoordinatorStudentsPage() {
    const [batches, setBatches] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const res = await api("/batches");
            setBatches(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const model = useMemo(() => {
        if (!batches) return null;
        const rows = batches
            .map((b) => ({
                id: b.id,
                name: b.name,
                course: b.course?.title ?? "—",
                institution: b.institution?.name ?? "—",
                students: b._count?.students ?? b.students?.length ?? 0,
            }))
            .sort((a, b) => b.students - a.students);
        const total = rows.reduce((s, r) => s + r.students, 0);
        const withStudents = rows.filter((r) => r.students > 0);
        const empty = rows.filter((r) => r.students === 0);
        const max = rows[0]?.students ?? 0;
        const avg = withStudents.length
            ? Math.round(total / withStudents.length)
            : 0;
        return { rows, total, withStudents, empty, max, avg };
    }, [batches]);

    if (error)
        return (
            <PageError
                title="Couldn't load students"
                message={error}
                onRetry={load}
            />
        );
    if (!model) return <PageLoading label="Loading enrolment" />;

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Students"
                title="Who's enrolled, and where."
                subtitle="A read-only projection of enrolment across your cohorts, fullest first. To enrol or move a student, an admin or trainer makes the change."
                actions={<ProjectionTag />}
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <WinStat
                    label="Students enrolled"
                    value={model.total}
                    sub="across your school"
                    tier={model.total > 0 ? "strong" : "setup"}
                    icon={COORD_ICONS.users}
                />
                <WinStat
                    label="Cohorts with students"
                    value={model.withStudents.length}
                    sub={`of ${pluralize(model.rows.length, "cohort")}`}
                    icon={COORD_ICONS.stack}
                />
                <WinStat
                    label="Fullest cohort"
                    value={model.max}
                    sub={model.rows[0]?.name ?? "—"}
                    tier={model.max > 0 ? "strong" : "setup"}
                    icon={COORD_ICONS.spark}
                />
                <WinStat
                    label="Avg cohort size"
                    value={model.avg}
                    sub="where students are enrolled"
                />
            </section>

            {model.rows.length === 0 ? (
                <PageEmpty
                    title="No cohorts in scope"
                    description="Enrolment appears here once your school has a batch."
                />
            ) : (
                <Panel
                    eyebrow="Enrolment"
                    title="Cohorts, fullest first"
                    padded={false}
                >
                    <ul>
                        {model.withStudents.map((r, i) => (
                            <li
                                key={r.id}
                                className="flex items-center gap-4 border-b px-6 py-4 last:border-b-0"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                <RankBadge n={i + 1} />
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="truncate font-display text-base"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {r.name}
                                    </p>
                                    <p
                                        className="mt-0.5 truncate text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {r.institution} · {r.course}
                                    </p>
                                    <div className="mt-2 max-w-sm">
                                        <HealthBar
                                            value={
                                                model.max
                                                    ? (r.students / model.max) *
                                                      100
                                                    : 0
                                            }
                                            tier="strong"
                                        />
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p
                                        className="font-display text-2xl leading-none"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {r.students}
                                    </p>
                                    <p
                                        className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        students
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {model.empty.length > 0 && (
                        <div
                            className="border-t px-6 py-4"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            <p
                                className="text-[11px] uppercase tracking-[0.16em]"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                Awaiting first enrolment
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {model.empty.map((r) => (
                                    <span
                                        key={r.id}
                                        className="rounded-full border px-3 py-1 text-xs"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {r.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </Panel>
            )}
        </div>
    );
}
