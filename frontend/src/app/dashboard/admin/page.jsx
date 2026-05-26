"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";
import { api } from "@/lib/api";

export default function AdminOverview() {
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

    const active = data.institutions.filter((i) => i.isActive !== false);
    const inactive = data.institutions.length - active.length;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Oversight · Overview"
                title="Steward of partner institutions and outcomes."
                subtitle="Manage the institutions you administer, the batches that run inside them, and the people who deliver and consume the programs."
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                    label="Institutions"
                    value={data.institutions.length}
                    footnote={`${active.length} active${
                        inactive > 0 ? ` · ${inactive} inactive` : ""
                    }`}
                />
                <StatTile label="Batches" value={data.batches.length} />
                <StatTile
                    label="Active batches"
                    value={
                        data.batches.filter((b) => b.isActive !== false).length
                    }
                />
                <StatTile
                    label="Upcoming"
                    value={
                        data.batches.filter(
                            (b) =>
                                b.startDate &&
                                new Date(b.startDate) > new Date(),
                        ).length
                    }
                />
            </section>

            <Panel
                eyebrow="Institutions"
                title="Where you operate"
                description={
                    data.institutions.length === 0
                        ? "No institutions linked yet. Ask a super admin to assign you."
                        : null
                }
                actions={
                    data.institutions.length > 0 ? (
                        <Link
                            href="/dashboard/admin/institutions"
                            className="rounded-md px-3 py-1.5 text-xs font-semibold"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Manage institutions
                        </Link>
                    ) : null
                }
            >
                {data.institutions.length > 0 && (
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                                    className="mt-1 text-[10px] uppercase tracking-[0.2em]"
                                    style={{ color: "var(--role-accent)" }}
                                >
                                    {inst.type}
                                    {inst.isActive === false
                                        ? " · inactive"
                                        : ""}
                                </div>
                                <div
                                    className="mt-2 text-xs"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {inst.batches?.length ?? 0} batches
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
}
