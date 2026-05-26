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

function dueDays(value) {
    if (!value) return null;
    const due = new Date(value);
    if (Number.isNaN(due.getTime())) return null;
    return Math.ceil((due - Date.now()) / 86_400_000);
}

export default function TrainerOverview() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const [batches, assignments] = await Promise.all([
                api("/batches").catch(() => ({ data: [] })),
                api("/assignments").catch(() => ({ data: [] })),
            ]);
            setData({
                batches: Array.isArray(batches?.data) ? batches.data : [],
                assignments: Array.isArray(assignments?.data)
                    ? assignments.data
                    : [],
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

    const upcoming = data.assignments
        .map((a) => ({ ...a, days: dueDays(a.dueDate) }))
        .filter((a) => a.days !== null && a.days >= 0)
        .sort((a, b) => a.days - b.days)
        .slice(0, 6);

    const overdue = data.assignments.filter((a) => {
        const d = dueDays(a.dueDate);
        return d !== null && d < 0;
    }).length;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · Overview"
                title="Shape curriculum, cohort, and craft."
                subtitle="Your assigned batches and the work that's due next. Operational data only — projections live in the coordinator dashboard."
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                    label="My batches"
                    value={data.batches.length}
                    footnote="Assigned to you"
                />
                <StatTile label="Assignments" value={data.assignments.length} />
                <StatTile
                    label="Overdue"
                    value={overdue}
                    deltaDir={overdue > 0 ? "down" : "flat"}
                />
                <StatTile
                    label="Due in 7 days"
                    value={
                        upcoming.filter((a) => a.days !== null && a.days <= 7)
                            .length
                    }
                />
            </section>

            <Panel
                eyebrow="Next up"
                title="Assignments due soon"
                description={
                    upcoming.length === 0
                        ? "Nothing scheduled. Create work from the Assignments page."
                        : null
                }
            >
                {upcoming.length > 0 && (
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {upcoming.map((a) => (
                            <li
                                key={a.id}
                                className="flex items-center justify-between gap-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p
                                        className="truncate font-display text-base"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {a.title}
                                    </p>
                                    <p
                                        className="mt-0.5 truncate text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.batch?.name ?? "—"} ·{" "}
                                        {a.course?.title ?? "—"}
                                    </p>
                                </div>
                                <span
                                    className="shrink-0 text-xs font-medium"
                                    style={{ color: "var(--role-accent)" }}
                                >
                                    {a.days === 0
                                        ? "due today"
                                        : `${a.days}d left`}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="mt-4 flex gap-3">
                    <Link
                        href="/dashboard/trainer/assignments"
                        className="rounded-md px-3 py-1.5 text-xs font-semibold"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                        }}
                    >
                        Open assignments
                    </Link>
                    <Link
                        href="/dashboard/trainer/submissions"
                        className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                        }}
                    >
                        Review submissions
                    </Link>
                </div>
            </Panel>
        </div>
    );
}
