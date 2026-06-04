"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
    AllClear,
    COORD_ICONS,
    computeBatchHealth,
    HealthBar,
    Icon,
    institutionsFromBatches,
    MetaItem,
    ProjectionTag,
    pluralize,
    RankBadge,
    TierChip,
    tierOf,
    WinStat,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

/**
 * Coordinator Overview — a projection-only command surface.
 *
 * Reads two school-scoped endpoints (/institutions, /batches) and leads with
 * wins: strongest cohorts first, students in care, staffing and activity. The
 * calm "a few to set up" block sits lower — every batch stays visible, nothing
 * is hidden or invented. No write control appears anywhere.
 */
export default function CoordinatorOverview() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const [institutions, batches] = await Promise.all([
                api("/institutions").catch(() => ({ data: [] })),
                api("/batches").catch(() => ({ data: [] })),
            ]);
            setData({
                institutions: Array.isArray(institutions?.data)
                    ? institutions.data
                    : [],
                batches: Array.isArray(batches?.data) ? batches.data : [],
            });
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const model = useMemo(() => {
        if (!data) return null;
        const ranked = data.batches
            .map((b) => ({ batch: b, health: computeBatchHealth(b) }))
            .sort(
                (a, b) =>
                    tierOf(a.health.tier).rank - tierOf(b.health.tier).rank ||
                    b.health.enrolled - a.health.enrolled,
            );
        const performing = ranked.filter((r) =>
            ["strong", "steady"].includes(r.health.tier),
        );
        const toSetUp = ranked.filter((r) =>
            ["watch", "setup"].includes(r.health.tier),
        );
        const totalStudents = data.batches.reduce(
            (s, b) => s + (b._count?.students ?? 0),
            0,
        );
        const activeBatches = data.batches.filter(
            (b) => b.isActive !== false,
        ).length;
        const staffed = data.batches.filter(
            (b) => (b._count?.trainers ?? 0) > 0,
        ).length;
        const strong = ranked.filter((r) => r.health.tier === "strong").length;
        const schools = data.institutions.length
            ? data.institutions
            : institutionsFromBatches(data.batches);
        return {
            ranked,
            performing,
            toSetUp,
            totalStudents,
            activeBatches,
            staffed,
            strong,
            schools,
        };
    }, [data]);

    if (error) {
        return (
            <PageError
                title="Couldn't load your overview"
                message={error}
                onRetry={load}
            />
        );
    }
    if (!model) return <PageLoading label="Loading your school" />;

    const schoolName =
        model.schools.length === 1
            ? model.schools[0].name
            : model.schools.length > 1
              ? `${model.schools.length} institutions`
              : "your institution";

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Overview"
                title="Your school, at a glance."
                subtitle={`A live, read-only projection of every cohort at ${schoolName}. Strongest first — the operational record stays owned by trainers and admins.`}
                actions={<ProjectionTag />}
            />

            {/* Wins band — positive signals lead the page. */}
            <section className="dash-reveal dash-reveal-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <WinStat
                    label="Strong cohorts"
                    value={model.strong}
                    sub={`of ${pluralize(model.ranked.length, "cohort")} in scope`}
                    tier={model.strong > 0 ? "strong" : "setup"}
                    icon={COORD_ICONS.spark}
                />
                <WinStat
                    label="Students in your care"
                    value={model.totalStudents}
                    sub="across every batch"
                    icon={COORD_ICONS.users}
                />
                <WinStat
                    label="Active batches"
                    value={model.activeBatches}
                    sub={`${model.staffed} fully staffed`}
                    icon={COORD_ICONS.stack}
                />
                <WinStat
                    label="Institutions"
                    value={model.schools.length}
                    sub="in your scope"
                    icon={COORD_ICONS.building}
                />
            </section>

            {/* Performing well — ranked, positive on top. */}
            <section className="dash-reveal dash-reveal-3">
                <Panel
                    eyebrow="Performing well"
                    title="Cohorts carrying momentum"
                    description="Ranked by health — staffed, active, and enrolled lead."
                    padded={false}
                >
                    {model.performing.length === 0 ? (
                        <div className="px-6 py-8">
                            <p
                                className="text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                Cohorts appear here as they get a trainer and
                                students. Everything currently in scope is in
                                the set-up list below.
                            </p>
                        </div>
                    ) : (
                        <ul>
                            {model.performing.slice(0, 6).map((row, i) => (
                                <CohortRow
                                    key={row.batch.id}
                                    rank={i + 1}
                                    batch={row.batch}
                                    health={row.health}
                                />
                            ))}
                        </ul>
                    )}
                    {model.performing.length > 6 && (
                        <div
                            className="border-t px-6 py-3 text-right text-xs"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-muted)",
                            }}
                        >
                            +{model.performing.length - 6} more in Batches
                        </div>
                    )}
                </Panel>
            </section>

            {/* A few to set up — honest, calm, lower. Only if any. */}
            {model.toSetUp.length > 0 && (
                <section className="dash-reveal dash-reveal-4">
                    <Panel
                        eyebrow="A few to set up"
                        title={pluralize(
                            model.toSetUp.length,
                            "cohort still getting ready",
                            "cohorts still getting ready",
                        )}
                        description="Not problems — just batches waiting on a trainer, students, or activation. Flagging for whoever owns the fix."
                        padded={false}
                    >
                        <ul
                            className="divide-y"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {model.toSetUp.map((row) => (
                                <li
                                    key={row.batch.id}
                                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5"
                                >
                                    <div className="min-w-0">
                                        <p
                                            className="truncate text-sm font-semibold"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {row.batch.name}
                                        </p>
                                        <p
                                            className="truncate text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {row.batch.institution?.name ?? "—"}
                                            {row.batch.course?.title
                                                ? ` · ${row.batch.course.title}`
                                                : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {row.health.gaps.map((g) => (
                                            <span
                                                key={g}
                                                className="rounded-full px-2 py-0.5 text-[10px]"
                                                style={{
                                                    backgroundColor:
                                                        "color-mix(in srgb, var(--dashboard-muted) 14%, transparent)",
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {g}
                                            </span>
                                        ))}
                                        <TierChip tier={row.health.tier} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </section>
            )}

            {/* Institutions in scope — real type / city / state. */}
            <section className="dash-reveal dash-reveal-5">
                <Panel
                    eyebrow="Your scope"
                    title="Institutions you project for"
                    description={
                        model.schools.length === 0
                            ? "No institution is linked to your account yet — ask an admin to assign you."
                            : `You can only ever see ${pluralize(model.schools.length, "school", "schools")} below — never another campus.`
                    }
                >
                    {model.schools.length === 0 ? (
                        <AllClear
                            title="Awaiting assignment"
                            description="Once a super-admin links you to an institution, its cohorts populate this dashboard automatically."
                        />
                    ) : (
                        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {model.schools.map((inst) => {
                                const batchCount =
                                    inst.batches?.length ??
                                    data.batches.filter(
                                        (b) => b.institution?.id === inst.id,
                                    ).length;
                                return (
                                    <li
                                        key={inst.id}
                                        className="rounded-xl border px-4 py-4"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                            backgroundColor:
                                                "var(--dashboard-surface)",
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div
                                                className="font-display text-base"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {inst.name}
                                            </div>
                                            <span
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                                                style={{
                                                    backgroundColor:
                                                        "var(--role-accent-soft)",
                                                    color: "var(--role-accent)",
                                                }}
                                            >
                                                <Icon
                                                    path={COORD_ICONS.building}
                                                    className="h-4 w-4"
                                                />
                                            </span>
                                        </div>
                                        {inst.type && (
                                            <div
                                                className="mt-1 text-[10px] uppercase tracking-[0.18em]"
                                                style={{
                                                    color: "var(--role-accent)",
                                                }}
                                            >
                                                {inst.type}
                                            </div>
                                        )}
                                        <div
                                            className="mt-2 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {[inst.city, inst.state]
                                                .filter(Boolean)
                                                .join(", ") || "—"}
                                        </div>
                                        <dl className="mt-4 flex gap-6">
                                            <MetaItem
                                                label="Batches"
                                                value={batchCount}
                                            />
                                        </dl>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Panel>
            </section>
        </div>
    );
}

function CohortRow({ rank, batch, health }) {
    return (
        <li
            className="flex items-center gap-4 border-b px-6 py-4 last:border-b-0"
            style={{ borderColor: "var(--dashboard-border)" }}
        >
            <RankBadge n={rank} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p
                        className="truncate font-display text-base"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {batch.name}
                    </p>
                    <TierChip tier={health.tier} />
                </div>
                <p
                    className="mt-0.5 truncate text-xs"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {batch.institution?.name ?? "—"}
                    {batch.course?.title ? ` · ${batch.course.title}` : ""}
                </p>
                <div className="mt-2 max-w-xs">
                    <HealthBar value={health.score} tier={health.tier} />
                </div>
            </div>
            <div className="hidden shrink-0 text-right sm:block">
                <p
                    className="font-display text-lg leading-none"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    {health.enrolled}
                </p>
                <p
                    className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {pluralize(health.trainers, "trainer")}
                </p>
            </div>
        </li>
    );
}
