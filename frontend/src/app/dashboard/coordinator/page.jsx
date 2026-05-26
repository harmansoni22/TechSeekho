"use client";

import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";
import { api } from "@/lib/api";

/**
 * Coordinator overview.
 *
 * Coordinator is a projection-only role: the page displays counts and a
 * rollup of institution state but never offers write actions. All writes
 * belong to ADMIN/TRAINER.
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

    const activeBatches = data.batches.filter((b) => b.isActive !== false);
    const totalStudents = data.batches.reduce(
        (sum, b) => sum + (b.students?.length ?? b._count?.students ?? 0),
        0,
    );

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Programme Operations · Overview"
                title="Conducting cohorts, trainers, and daily rhythm."
                subtitle="Coordinators see operational truth as projections — the underlying data is owned by trainers and admins. Use this page to spot what's drifting before it becomes a problem."
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                    label="Institutions in scope"
                    value={data.institutions.length}
                />
                <StatTile label="Active batches" value={activeBatches.length} />
                <StatTile
                    label="Total batches"
                    value={data.batches.length}
                    footnote="Includes upcoming and closed"
                />
                <StatTile
                    label="Enrolled students"
                    value={totalStudents}
                    footnote="Across batches in scope"
                />
            </section>

            <Panel
                eyebrow="Institutions"
                title="Where you're projecting"
                description={
                    data.institutions.length === 0
                        ? "No institutions are linked to your account yet — ask an admin to assign you."
                        : `${data.institutions.length} institution${
                              data.institutions.length === 1 ? "" : "s"
                          } in your scope.`
                }
            >
                {data.institutions.length > 0 && (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {data.institutions.map((inst) => (
                            <li
                                key={inst.id}
                                className="rounded-lg border px-4 py-3"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor: "var(--dashboard-surface)",
                                }}
                            >
                                <div
                                    className="font-display text-base"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {inst.name}
                                </div>
                                <div
                                    className="mt-1 text-xs uppercase tracking-[0.18em]"
                                    style={{ color: "var(--role-accent)" }}
                                >
                                    {inst.type}
                                </div>
                                <div
                                    className="mt-2 text-xs"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {inst.city || "—"}
                                    {inst.state ? `, ${inst.state}` : ""}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
}
