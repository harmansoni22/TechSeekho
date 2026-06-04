"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchTrainerBatches } from "@/features/dashboard/api/trainerDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * TRAINER — My Courses.
 *
 * Derived view: groups the trainer's batches by course. No new endpoint —
 * `/batches` already returns the course relation, scoped server-side to the
 * trainer's `BatchTrainer` assignments. Click into any batch for the full
 * operational detail.
 */

export default function TrainerCoursesPage() {
    const [batches, setBatches] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const list = await fetchTrainerBatches();
            setBatches(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err?.message || "Unknown error");
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Group: courseId → { course meta, batches[] }
    const grouped = useMemo(() => {
        if (!batches) return [];
        const map = new Map();
        for (const b of batches) {
            const courseId = b.course?.id || "__no-course__";
            if (!map.has(courseId)) {
                map.set(courseId, {
                    courseId,
                    title: b.course?.title || "Uncategorized",
                    slug: b.course?.slug || null,
                    batches: [],
                    studentCount: 0,
                    institutions: new Set(),
                });
            }
            const entry = map.get(courseId);
            entry.batches.push(b);
            entry.studentCount += b._count?.students ?? 0;
            if (b.institution?.id) entry.institutions.add(b.institution.id);
        }
        return Array.from(map.values()).map((g) => ({
            ...g,
            institutionCount: g.institutions.size,
        }));
    }, [batches]);

    if (error)
        return (
            <PageError
                title="Couldn't load courses"
                message={error}
                onRetry={load}
            />
        );
    if (batches === null) return <PageLoading label="Loading courses" />;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · My Courses"
                title="The courses you're delivering."
                subtitle="Grouped from your assigned batches. Each course can run across several batches and institutions; expand any card to jump into a specific batch."
            />

            {grouped.length === 0 ? (
                <PageEmpty
                    title="No courses to deliver yet"
                    description="A course shows up here once you're assigned to at least one batch teaching it."
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {grouped.map((g) => (
                        <Panel
                            key={g.courseId}
                            eyebrow="Course"
                            title={g.title}
                            description={`${g.batches.length} batch${g.batches.length === 1 ? "" : "es"} · ${g.studentCount} student${g.studentCount === 1 ? "" : "s"} · ${g.institutionCount} institution${g.institutionCount === 1 ? "" : "s"}`}
                            padded={false}
                        >
                            <ul
                                className="divide-y"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                {g.batches.map((b) => (
                                    <li key={b.id} className="px-6 py-3">
                                        <Link
                                            href={`/dashboard/trainer/batches/${b.id}`}
                                            className="flex items-center justify-between gap-2 hover:underline"
                                        >
                                            <span
                                                className="truncate text-sm font-medium"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {b.name}
                                            </span>
                                            <span
                                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor:
                                                        b.isActive === false
                                                            ? "rgba(148, 163, 184, 0.18)"
                                                            : "rgba(16, 185, 129, 0.12)",
                                                    color:
                                                        b.isActive === false
                                                            ? "var(--dashboard-muted)"
                                                            : "#047857",
                                                }}
                                            >
                                                {b.isActive === false
                                                    ? "Inactive"
                                                    : "Active"}
                                            </span>
                                        </Link>
                                        <p
                                            className="mt-0.5 truncate text-[11px]"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {b.institution?.name || "—"}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ))}
                </div>
            )}
        </div>
    );
}
