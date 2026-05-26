"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    fetchLearningPaths,
    fetchStudentCourses,
} from "@/features/dashboard/api/studentDashboard.api";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState.jsx";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";

/**
 * Active Learning — lists every LearningPath the student can access, with the
 * enrollment badge on paths they've already joined. Two parallel fetches
 * because the backend keeps the catalog separate from "my enrollments":
 *
 *   GET /modules          → catalog
 *   GET /student/courses  → my enrollments + per-module progress
 */
const ActiveLearningPage = () => {
    const [paths, setPaths] = useState(null);
    const [enrollments, setEnrollments] = useState(null);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is the explicit re-fetch trigger — bumping it must re-run the effect.
    useEffect(() => {
        let cancelled = false;
        setError(null);
        setPaths(null);
        setEnrollments(null);
        Promise.all([fetchLearningPaths(), fetchStudentCourses()])
            .then(([pathsRes, coursesRes]) => {
                if (cancelled) return;
                setPaths(Array.isArray(pathsRes) ? pathsRes : []);
                setEnrollments(Array.isArray(coursesRes) ? coursesRes : []);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.message ?? "Could not load learning paths");
            });
        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    const enrolledByPathId = useMemo(() => {
        const map = new Map();
        for (const e of enrollments ?? []) map.set(e.pathId, e);
        return map;
    }, [enrollments]);

    const loading = paths === null || enrollments === null;

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="Active Learning"
                subtitle="Browse learning paths and continue where you left off"
            />

            {error ? (
                <PageError
                    title="Could not load learning paths"
                    message={error}
                    onRetry={() => setReloadKey((k) => k + 1)}
                />
            ) : loading ? (
                <PageLoading label="Loading paths" />
            ) : paths.length === 0 ? (
                <PageEmpty
                    title="No learning paths are available yet"
                    description="Your trainer or coordinator hasn't published a path for your institution. Check back later or ask them directly."
                />
            ) : (
                <Panel
                    eyebrow="Catalog"
                    title="Learning paths"
                    description={`${paths.length} path${paths.length === 1 ? "" : "s"} available for your institution`}
                >
                    <ul className="grid gap-3 md:grid-cols-2">
                        {paths.map((path) => {
                            const enrollment = enrolledByPathId.get(path.id);
                            return (
                                <li key={path.id}>
                                    <PathCard
                                        path={path}
                                        enrollment={enrollment}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </Panel>
            )}
        </div>
    );
};

const PathCard = ({ path, enrollment }) => {
    const isEnrolled = Boolean(enrollment);
    const progress = enrollment?.progress ?? 0;
    const moduleCount = path.modules?.length ?? 0;
    const completedCount = (enrollment?.modules ?? []).filter(
        (m) => (m.progress ?? 0) >= 100,
    ).length;

    return (
        <Link
            href={`/dashboard/student/learning/${path.id}`}
            className="group block cursor-pointer rounded-lg border p-4 transition hover:opacity-95 focus:outline-none focus:ring-2"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p
                        className="cursor-default text-[10px] uppercase tracking-[0.2em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {path.course?.title ?? "Course"}
                    </p>
                    <h3
                        className="mt-1 font-display text-lg"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {path.title}
                    </h3>
                    {path.description ? (
                        <p
                            className="mt-1 line-clamp-2 text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {path.description}
                        </p>
                    ) : null}
                </div>
                <span
                    className="cursor-default whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                        backgroundColor: isEnrolled
                            ? "var(--role-accent-soft)"
                            : "var(--dashboard-border)",
                        color: isEnrolled
                            ? "var(--role-accent)"
                            : "var(--dashboard-muted)",
                    }}
                >
                    {isEnrolled ? "Enrolled" : "Not enrolled"}
                </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
                <div
                    className="progress-track h-1.5 flex-1 overflow-hidden rounded-full"
                    aria-hidden="true"
                >
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${Math.max(0, Math.min(100, progress))}%`,
                            backgroundColor: "var(--role-accent)",
                        }}
                    />
                </div>
                <span
                    className="cursor-default text-xs"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {isEnrolled
                        ? `${Math.round(progress)}%`
                        : `${moduleCount} module${moduleCount === 1 ? "" : "s"}`}
                </span>
            </div>

            <div
                className="mt-3 flex items-center justify-between text-xs"
                style={{ color: "var(--dashboard-muted)" }}
            >
                <span className="cursor-default">
                    {isEnrolled
                        ? `${completedCount}/${moduleCount} module${moduleCount === 1 ? "" : "s"} done`
                        : path.estimatedHours
                          ? `${path.estimatedHours}h estimated`
                          : ""}
                </span>
                <span
                    className="font-semibold transition group-hover:translate-x-0.5"
                    style={{ color: "var(--role-accent)" }}
                >
                    {isEnrolled ? "Continue →" : "View →"}
                </span>
            </div>
        </Link>
    );
};

export default ActiveLearningPage;
