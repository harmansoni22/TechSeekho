"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchLearningPaths } from "@/features/dashboard/api/trainerDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * TRAINER — Modules.
 *
 * Lists every learning path visible to the trainer (`/modules` is scoped
 * server-side to the trainer's institutions and global paths). Click any
 * path to expand its ordered modules — that's the operational reading view.
 *
 * Mutations (create/edit modules) require institution-scoped authoring rights
 * and are not exposed inline here yet; the existing `POST /modules/:pathId/modules`
 * endpoint is the foundation for a future authoring flow.
 */

function totalDuration(modules) {
    if (!modules) return 0;
    return modules.reduce((sum, m) => sum + (Number(m.duration) || 0), 0);
}

export default function TrainerModulesPage() {
    const [paths, setPaths] = useState(null);
    const [error, setError] = useState(null);
    const [openId, setOpenId] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const list = await fetchLearningPaths();
            setPaths(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err?.message || "Unknown error");
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Group paths by course for cleaner navigation.
    const grouped = useMemo(() => {
        if (!paths) return [];
        const map = new Map();
        for (const p of paths) {
            const courseId = p.course?.id || "__no-course__";
            if (!map.has(courseId)) {
                map.set(courseId, {
                    courseId,
                    title: p.course?.title || "Unassigned",
                    paths: [],
                });
            }
            map.get(courseId).paths.push(p);
        }
        return Array.from(map.values());
    }, [paths]);

    if (error)
        return (
            <PageError
                title="Couldn't load modules"
                message={error}
                onRetry={load}
            />
        );
    if (paths === null) return <PageLoading label="Loading learning paths" />;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · Modules"
                title="Curriculum that lives inside your courses."
                subtitle="Each learning path holds an ordered set of modules. Click a path to inspect its module list — operational view only, authoring lives in a separate flow."
            />

            {grouped.length === 0 ? (
                <PageEmpty
                    title="No learning paths visible"
                    description="Paths appear here once they're authored for the courses or institutions you teach."
                />
            ) : (
                <div className="space-y-8">
                    {grouped.map((group) => (
                        <section key={group.courseId} className="space-y-4">
                            <h2
                                className="font-display text-lg"
                                style={{ color: "var(--dashboard-fg)" }}
                            >
                                {group.title}
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {group.paths.map((p) => {
                                    const open = openId === p.id;
                                    const moduleCount = p.modules?.length ?? 0;
                                    const totalMin = totalDuration(p.modules);
                                    return (
                                        <Panel
                                            key={p.id}
                                            eyebrow={
                                                p.difficulty || "Any level"
                                            }
                                            title={p.title}
                                            description={
                                                p.description || undefined
                                            }
                                        >
                                            <p
                                                className="text-xs uppercase tracking-[0.18em]"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {moduleCount} module
                                                {moduleCount === 1 ? "" : "s"}
                                                {p.estimatedHours
                                                    ? ` · ${p.estimatedHours}h est.`
                                                    : totalMin
                                                      ? ` · ${Math.round(totalMin / 60)}h content`
                                                      : ""}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenId((cur) =>
                                                        cur === p.id
                                                            ? null
                                                            : p.id,
                                                    )
                                                }
                                                disabled={moduleCount === 0}
                                                className="mt-3 rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                                                style={{
                                                    borderColor:
                                                        "var(--dashboard-border)",
                                                    color: "var(--dashboard-fg)",
                                                    cursor:
                                                        moduleCount === 0
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                {open
                                                    ? "Hide modules"
                                                    : `Show ${moduleCount} module${moduleCount === 1 ? "" : "s"}`}
                                            </button>
                                            {open && moduleCount > 0 && (
                                                <ol
                                                    className="mt-4 space-y-2 border-t pt-3"
                                                    style={{
                                                        borderColor:
                                                            "var(--dashboard-border)",
                                                    }}
                                                >
                                                    {p.modules.map((m, idx) => (
                                                        <li
                                                            key={m.id}
                                                            className="flex items-start gap-3 text-sm"
                                                        >
                                                            <span
                                                                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                                                                style={{
                                                                    backgroundColor:
                                                                        "var(--role-accent-soft)",
                                                                    color: "var(--role-accent)",
                                                                }}
                                                            >
                                                                {idx + 1}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p
                                                                    className="truncate font-medium"
                                                                    style={{
                                                                        color: "var(--dashboard-fg)",
                                                                    }}
                                                                >
                                                                    {m.title}
                                                                </p>
                                                                {(m.duration ||
                                                                    m.isRequired ===
                                                                        false) && (
                                                                    <p
                                                                        className="text-[11px]"
                                                                        style={{
                                                                            color: "var(--dashboard-muted)",
                                                                        }}
                                                                    >
                                                                        {m.duration
                                                                            ? `${m.duration} min`
                                                                            : ""}
                                                                        {m.isRequired ===
                                                                        false
                                                                            ? " · optional"
                                                                            : ""}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ol>
                                            )}
                                        </Panel>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
