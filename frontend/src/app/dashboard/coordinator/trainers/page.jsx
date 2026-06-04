"use client";

import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
    AllClear,
    COORD_ICONS,
    Icon,
    institutionsFromBatches,
    ProjectionTag,
    pluralize,
    RankBadge,
    TierChip,
    WinStat,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

/**
 * Coordinator Trainers — real, read-only.
 *
 * Builds the trainer roster from school-scoped reads: /batches for the cohort
 * set, /batches/:id for who delivers each one, and /institutions/:id/members
 * to include trainers not yet on a batch. Ranked by delivery load (most active
 * first). Assignment is an admin action — there is no control to do it here.
 */
export default function CoordinatorTrainersPage() {
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

            const details = await Promise.all(
                batches.map((b) =>
                    api(`/batches/${b.id}`)
                        .then((r) => r?.data ?? null)
                        .catch(() => null),
                ),
            );

            const instIds = institutionsFromBatches(batches).map((i) => i.id);
            const memberLists = await Promise.all(
                instIds.map((id) =>
                    api(`/institutions/${id}/members?role=TRAINER`)
                        .then((r) => (Array.isArray(r?.data) ? r.data : []))
                        .catch(() => []),
                ),
            );

            const map = new Map();
            const upsert = (id, patch) => {
                const cur = map.get(id) ?? {
                    id,
                    name: "—",
                    email: "—",
                    specialization: null,
                    batches: [],
                };
                map.set(id, { ...cur, ...patch(cur) });
            };

            for (const d of details) {
                if (!d) continue;
                for (const bt of d.trainers ?? []) {
                    const t = bt.trainer;
                    if (!t?.id) continue;
                    upsert(t.id, (cur) => ({
                        name: t.user?.fullName || cur.name,
                        email: t.user?.email || cur.email,
                        specialization: t.specialization || cur.specialization,
                        batches: [...cur.batches, { id: d.id, name: d.name }],
                    }));
                }
            }

            for (const m of memberLists.flat()) {
                if (!m?.profileId) continue;
                upsert(m.profileId, (cur) => ({
                    name: cur.name === "—" ? m.fullName || "—" : cur.name,
                    email: cur.email === "—" ? m.email || "—" : cur.email,
                    specialization: cur.specialization || m.specialization,
                }));
            }

            const trainers = [...map.values()].map((t) => ({
                ...t,
                batchCount: t.batches.length,
            }));
            const engaged = trainers
                .filter((t) => t.batchCount > 0)
                .sort(
                    (a, b) =>
                        b.batchCount - a.batchCount ||
                        a.name.localeCompare(b.name),
                );
            const available = trainers
                .filter((t) => t.batchCount === 0)
                .sort((a, b) => a.name.localeCompare(b.name));
            const cohortsCovered = details.filter(
                (d) => d && (d.trainers?.length ?? 0) > 0,
            ).length;

            setModel({
                trainers,
                engaged,
                available,
                cohortsCovered,
                totalBatches: batches.length,
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
                title="Couldn't load trainers"
                message={error}
                onRetry={load}
            />
        );
    if (!model) return <PageLoading label="Building trainer roster" />;

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Trainers"
                title="Who's delivering, and how much."
                subtitle="A read-only roll-up of trainer assignments across your cohorts, busiest first. Assignment is an admin action — this is the live picture, not a control panel."
                actions={<ProjectionTag />}
            />

            <section className="grid gap-4 sm:grid-cols-3">
                <WinStat
                    label="Active trainers"
                    value={model.engaged.length}
                    sub="delivering at least one cohort"
                    tier={model.engaged.length > 0 ? "strong" : "setup"}
                    icon={COORD_ICONS.spark}
                />
                <WinStat
                    label="Cohorts covered"
                    value={`${model.cohortsCovered}/${model.totalBatches}`}
                    sub="have a trainer assigned"
                    tier={
                        model.totalBatches > 0 &&
                        model.cohortsCovered === model.totalBatches
                            ? "strong"
                            : "steady"
                    }
                    icon={COORD_ICONS.stack}
                />
                <WinStat
                    label="On roster"
                    value={model.trainers.length}
                    sub="trainers in your school"
                    icon={COORD_ICONS.users}
                />
            </section>

            <Panel
                eyebrow="Delivery load"
                title="Trainers, busiest first"
                description="Ranked by the number of cohorts each trainer carries."
                padded={false}
            >
                {model.engaged.length === 0 ? (
                    <AllClear
                        title="No active assignments yet"
                        description="As soon as a trainer is assigned to one of your cohorts, they rank in here by delivery load."
                    />
                ) : (
                    <ul>
                        {model.engaged.map((t, i) => (
                            <TrainerRow key={t.id} rank={i + 1} trainer={t} />
                        ))}
                    </ul>
                )}
            </Panel>

            {model.available.length > 0 && (
                <Panel
                    eyebrow="Bench"
                    title={pluralize(
                        model.available.length,
                        "trainer available",
                        "trainers available",
                    )}
                    description="On your school's roster but not yet on a cohort."
                    padded={false}
                >
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {model.available.map((t) => (
                            <li
                                key={t.id}
                                className="flex items-center justify-between gap-3 px-6 py-3.5"
                            >
                                <div className="min-w-0">
                                    <p
                                        className="truncate text-sm font-semibold"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {t.name}
                                    </p>
                                    <p
                                        className="truncate text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {t.specialization || t.email}
                                    </p>
                                </div>
                                <TierChip tier="steady" />
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </div>
    );
}

function TrainerRow({ rank, trainer }) {
    const shown = trainer.batches.slice(0, 3);
    const extra = trainer.batches.length - shown.length;
    return (
        <li
            className="flex items-center gap-4 border-b px-6 py-4 last:border-b-0"
            style={{ borderColor: "var(--dashboard-border)" }}
        >
            <RankBadge n={rank} />
            <div className="min-w-0 flex-1">
                <p
                    className="truncate font-display text-base"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    {trainer.name}
                </p>
                <p
                    className="mt-0.5 truncate text-xs"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {trainer.specialization
                        ? `${trainer.specialization} · ${trainer.email}`
                        : trainer.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {shown.map((b) => (
                        <span
                            key={b.id}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                            style={{
                                backgroundColor: "var(--role-accent-soft)",
                                color: "var(--role-accent)",
                            }}
                        >
                            <Icon
                                path={COORD_ICONS.stack}
                                className="h-3 w-3"
                            />
                            {b.name}
                        </span>
                    ))}
                    {extra > 0 && (
                        <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            +{extra} more
                        </span>
                    )}
                </div>
            </div>
            <div className="hidden shrink-0 text-right sm:block">
                <p
                    className="font-display text-2xl leading-none"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    {trainer.batchCount}
                </p>
                <p
                    className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {trainer.batchCount === 1 ? "cohort" : "cohorts"}
                </p>
            </div>
        </li>
    );
}
