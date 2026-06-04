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
    formatStamp,
    Icon,
    ProjectionTag,
    WinStat,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Coordinator Community — read-only.
 *
 * A single honest activity stream for the school, woven from two real, scoped
 * sources: announcements (/announcements) and cohort milestones (batch start
 * dates from /batches). Nothing is invented — every row restates a real record.
 * Positive highlights lead.
 */
export default function CoordinatorCommunityPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const [annRes, batchRes] = await Promise.all([
                api("/announcements").catch(() => ({ data: [] })),
                api("/batches").catch(() => ({ data: [] })),
            ]);
            setData({
                announcements: Array.isArray(annRes?.data) ? annRes.data : [],
                batches: Array.isArray(batchRes?.data) ? batchRes.data : [],
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
        const now = Date.now();

        const annEvents = data.announcements.map((a) => ({
            id: `ann-${a.id}`,
            kind: "announcement",
            date: a.createdAt,
            title: a.title,
            body: a.content,
            meta: [a.batch?.name, a.author?.fullName]
                .filter(Boolean)
                .join(" · "),
        }));

        const cohortEvents = data.batches
            .filter((b) => b.startDate)
            .map((b) => {
                const started = new Date(b.startDate).getTime() <= now;
                return {
                    id: `batch-${b.id}`,
                    kind: "cohort",
                    date: b.startDate,
                    title: `${b.name} ${started ? "started" : "is scheduled"}`,
                    body: null,
                    meta: [b.institution?.name, b.course?.title]
                        .filter(Boolean)
                        .join(" · "),
                };
            });

        const feed = [...annEvents, ...cohortEvents]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 14);

        const cohortsRunning = data.batches.filter(
            (b) => b.isActive !== false,
        ).length;
        const buzz = data.announcements.filter(
            (a) => now - new Date(a.createdAt).getTime() <= WEEK_MS,
        ).length;
        const students = data.batches.reduce(
            (s, b) => s + (b._count?.students ?? 0),
            0,
        );

        return { feed, cohortsRunning, buzz, students };
    }, [data]);

    if (error)
        return (
            <PageError
                title="Couldn't load community"
                message={error}
                onRetry={load}
            />
        );
    if (!model) return <PageLoading label="Gathering activity" />;

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Community"
                title="The pulse of your school."
                subtitle="A read-only stream of announcements and cohort milestones across your institution. Every entry is a real record — nothing is editable here."
                actions={<ProjectionTag />}
            />

            <section className="grid gap-4 sm:grid-cols-3">
                <WinStat
                    label="Cohorts running"
                    value={model.cohortsRunning}
                    sub="active right now"
                    tier={model.cohortsRunning > 0 ? "strong" : "setup"}
                    icon={COORD_ICONS.stack}
                />
                <WinStat
                    label="Buzz this week"
                    value={model.buzz}
                    sub="announcements in 7 days"
                    tier={model.buzz > 0 ? "strong" : "setup"}
                    icon={COORD_ICONS.spark}
                />
                <WinStat
                    label="In the community"
                    value={model.students}
                    sub="students enrolled"
                    icon={COORD_ICONS.users}
                />
            </section>

            {model.feed.length === 0 ? (
                <PageEmpty
                    title="Nothing's happened yet"
                    description="As cohorts start and trainers post announcements, the activity stream fills in here."
                />
            ) : (
                <Panel
                    eyebrow="Activity"
                    title="Recent across your school"
                    padded={false}
                >
                    <ul>
                        {model.feed.map((e, i) => (
                            <li
                                key={e.id}
                                className="flex gap-4 px-6 py-4"
                                style={{
                                    borderTop:
                                        i === 0
                                            ? "none"
                                            : "1px solid var(--dashboard-border)",
                                }}
                            >
                                <div className="flex flex-col items-center">
                                    <span
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                                        style={{
                                            backgroundColor:
                                                e.kind === "cohort"
                                                    ? "rgba(16, 185, 129, 0.12)"
                                                    : "var(--role-accent-soft)",
                                            color:
                                                e.kind === "cohort"
                                                    ? "#047857"
                                                    : "var(--role-accent)",
                                        }}
                                    >
                                        <Icon
                                            path={
                                                e.kind === "cohort"
                                                    ? COORD_ICONS.stack
                                                    : COORD_ICONS.flag
                                            }
                                            className="h-4 w-4"
                                        />
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="text-sm font-semibold"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {e.title}
                                    </p>
                                    {e.body && (
                                        <p
                                            className="mt-1 line-clamp-2 text-sm"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {e.body}
                                        </p>
                                    )}
                                    <p
                                        className="mt-1.5 text-[11px]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {e.meta ? `${e.meta} · ` : ""}
                                        {formatStamp(e.date)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </div>
    );
}
