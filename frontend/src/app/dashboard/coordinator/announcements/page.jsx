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
    pluralize,
    WinStat,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Coordinator Announcements — read-only.
 *
 * The backend scopes /announcements to the coordinator's institutions, so the
 * feed only ever shows this school. Coordinators don't author — there is no
 * compose box. Most recent first.
 */
export default function CoordinatorAnnouncementsPage() {
    const [items, setItems] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const res = await api("/announcements");
            setItems(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const stats = useMemo(() => {
        if (!items) return null;
        const now = Date.now();
        const thisWeek = items.filter(
            (a) => now - new Date(a.createdAt).getTime() <= WEEK_MS,
        ).length;
        const batches = new Set(items.map((a) => a.batch?.id).filter(Boolean))
            .size;
        return { thisWeek, batches };
    }, [items]);

    if (error)
        return (
            <PageError
                title="Couldn't load announcements"
                message={error}
                onRetry={load}
            />
        );
    if (items === null) return <PageLoading label="Loading announcements" />;

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Announcements"
                title="What's being said across your cohorts."
                subtitle="A read-only feed of everything trainers and admins post to your school's batches. To post, ask the assigned trainer or your admin."
                actions={<ProjectionTag />}
            />

            {items.length === 0 ? (
                <PageEmpty
                    title="No announcements yet"
                    description="When a trainer or admin posts to a batch in your school, it appears here — newest first."
                />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-3">
                        <WinStat
                            label="This week"
                            value={stats.thisWeek}
                            sub="posted in the last 7 days"
                            tier={stats.thisWeek > 0 ? "strong" : "setup"}
                            icon={COORD_ICONS.spark}
                        />
                        <WinStat
                            label="Total in feed"
                            value={items.length}
                            sub="across your school"
                            icon={COORD_ICONS.flag}
                        />
                        <WinStat
                            label="Cohorts reached"
                            value={stats.batches}
                            sub="have an announcement"
                            icon={COORD_ICONS.stack}
                        />
                    </section>

                    <Panel
                        eyebrow="Feed"
                        title={pluralize(
                            items.length,
                            "announcement",
                            "announcements",
                        )}
                        padded={false}
                    >
                        <ul
                            className="divide-y"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {items.map((a) => (
                                <li key={a.id} className="px-6 py-5">
                                    <div className="flex items-start gap-3">
                                        <span
                                            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                            style={{
                                                backgroundColor:
                                                    "var(--role-accent-soft)",
                                                color: "var(--role-accent)",
                                            }}
                                        >
                                            <Icon
                                                path={COORD_ICONS.flag}
                                                className="h-4 w-4"
                                            />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className="font-display text-base"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {a.title}
                                            </p>
                                            <p
                                                className="mt-1.5 text-sm leading-relaxed"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {a.content}
                                            </p>
                                            <div
                                                className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {a.batch?.name && (
                                                    <span
                                                        className="rounded-full px-2 py-0.5"
                                                        style={{
                                                            backgroundColor:
                                                                "var(--role-accent-soft)",
                                                            color: "var(--role-accent)",
                                                        }}
                                                    >
                                                        {a.batch.name}
                                                    </span>
                                                )}
                                                <span>
                                                    {a.author?.fullName ?? "—"}
                                                </span>
                                                <span aria-hidden="true">
                                                    ·
                                                </span>
                                                <span>
                                                    {formatStamp(a.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </>
            )}
        </div>
    );
}
