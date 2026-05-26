"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    enrollInLearningPath,
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
 * Path detail — shows the path's metadata, ordered modules, and overall
 * enrollment status. The catalog lives behind `GET /modules` and per-student
 * progress lives behind `GET /student/courses`, so we fetch both and merge.
 *
 * Enrolling is a single POST and we re-fetch `/student/courses` after so the
 * page reflects the new enrollment without a hard reload.
 */
const PathDetailPage = () => {
    const { pathId } = useParams();
    const router = useRouter();

    const [paths, setPaths] = useState(null);
    const [enrollments, setEnrollments] = useState(null);
    const [error, setError] = useState(null);
    const [enrolling, setEnrolling] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is the explicit re-fetch trigger after enroll.
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
                setError(err?.message ?? "Could not load this path");
            });
        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    const path = useMemo(
        () => (paths ?? []).find((p) => p.id === pathId) ?? null,
        [paths, pathId],
    );
    const enrollment = useMemo(
        () => (enrollments ?? []).find((e) => e.pathId === pathId) ?? null,
        [enrollments, pathId],
    );

    const onEnroll = async () => {
        if (enrolling || !path) return;
        setEnrolling(true);
        try {
            await enrollInLearningPath(path.id);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setError(err?.message ?? "Could not enroll in this path");
        } finally {
            setEnrolling(false);
        }
    };

    const loading = paths === null || enrollments === null;

    if (error) {
        return (
            <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
                <TopBar title="Path" subtitle="Loading…" />
                <PageError
                    title="Could not load this path"
                    message={error}
                    onRetry={() => setReloadKey((k) => k + 1)}
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
                <TopBar title="Path" subtitle="Loading…" />
                <PageLoading label="Loading path" />
            </div>
        );
    }

    if (!path) {
        return (
            <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
                <TopBar
                    title="Path not found"
                    subtitle="This learning path may have been retired"
                />
                <PageEmpty
                    title="That path doesn't exist anymore"
                    description="It may have been retired, or you may not have access to it."
                    action={
                        <button
                            type="button"
                            onClick={() =>
                                router.push("/dashboard/student/learning")
                            }
                            className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Back to paths
                        </button>
                    }
                />
            </div>
        );
    }

    const modules = path.modules ?? [];
    const isEnrolled = Boolean(enrollment);
    const overallProgress = enrollment?.progress ?? 0;
    const requiredCount = modules.filter((m) => m.isRequired).length;
    const totalHours = path.estimatedHours;

    const progressByModuleId = new Map(
        (enrollment?.modules ?? []).map((m) => [m.id, m]),
    );

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title={path.title}
                subtitle={
                    path.course?.title
                        ? `${path.course.title} · ${modules.length} module${modules.length === 1 ? "" : "s"}`
                        : `${modules.length} module${modules.length === 1 ? "" : "s"}`
                }
            />

            <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                    href="/dashboard/student/learning"
                    className="cursor-pointer rounded-md border px-3 py-1 text-xs font-medium transition hover:opacity-90 focus:outline-none focus:ring-2"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        color: "var(--dashboard-fg)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    ← All paths
                </Link>
                {path.difficulty ? (
                    <span
                        className="cursor-default rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                            backgroundColor: "var(--dashboard-border)",
                            color: "var(--dashboard-muted)",
                        }}
                    >
                        {path.difficulty}
                    </span>
                ) : null}
                {totalHours ? (
                    <span
                        className="cursor-default rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                            backgroundColor: "var(--dashboard-border)",
                            color: "var(--dashboard-muted)",
                        }}
                    >
                        {totalHours}h estimated
                    </span>
                ) : null}
                <span
                    className="cursor-default rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
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

            <Panel
                eyebrow="Overview"
                title="About this path"
                description={path.description ?? undefined}
                actions={
                    isEnrolled ? null : (
                        <button
                            type="button"
                            onClick={onEnroll}
                            disabled={enrolling}
                            className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            {enrolling ? "Enrolling…" : "Enroll"}
                        </button>
                    )
                }
            >
                {isEnrolled ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="progress-track h-2 flex-1 overflow-hidden rounded-full"
                                aria-hidden="true"
                            >
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${Math.max(0, Math.min(100, overallProgress))}%`,
                                        backgroundColor: "var(--role-accent)",
                                    }}
                                />
                            </div>
                            <span
                                className="cursor-default text-xs font-semibold"
                                style={{ color: "var(--dashboard-fg)" }}
                            >
                                {Math.round(overallProgress)}%
                            </span>
                        </div>
                        <p
                            className="text-xs"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Progress is computed from your required modules.
                            Optional modules don't count toward the overall %.
                        </p>
                    </div>
                ) : (
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Enrolling unlocks progress tracking and module marking.
                        Required modules count toward your overall completion;
                        optional modules are available to explore freely.
                        {requiredCount > 0
                            ? ` This path has ${requiredCount} required module${requiredCount === 1 ? "" : "s"}.`
                            : ""}
                    </p>
                )}
            </Panel>

            <Panel
                eyebrow="Modules"
                title="In order"
                description="Tap a module to read its content and mark it complete."
            >
                {modules.length === 0 ? (
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        No modules have been added to this path yet.
                    </p>
                ) : (
                    <ol className="space-y-2">
                        {modules.map((module, idx) => {
                            const progressRow = progressByModuleId.get(
                                module.id,
                            );
                            const moduleProgress = progressRow?.progress ?? 0;
                            const done = moduleProgress >= 100;
                            return (
                                <li key={module.id}>
                                    <Link
                                        href={`/dashboard/student/learning/${path.id}/modules/${module.id}`}
                                        className="group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition hover:opacity-95 focus:outline-none focus:ring-2"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                            backgroundColor:
                                                "var(--dashboard-surface)",
                                        }}
                                    >
                                        <span
                                            className="cursor-default inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                            style={{
                                                backgroundColor: done
                                                    ? "var(--role-accent)"
                                                    : "var(--dashboard-border)",
                                                color: done
                                                    ? "var(--role-accent-ink)"
                                                    : "var(--dashboard-muted)",
                                            }}
                                            aria-hidden="true"
                                        >
                                            {done ? "✓" : idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="truncate text-sm font-semibold"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {module.title}
                                                </span>
                                                {!module.isRequired ? (
                                                    <span
                                                        className="cursor-default rounded-full px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide"
                                                        style={{
                                                            backgroundColor:
                                                                "var(--dashboard-border)",
                                                            color: "var(--dashboard-muted)",
                                                        }}
                                                    >
                                                        Optional
                                                    </span>
                                                ) : null}
                                            </div>
                                            {module.description ? (
                                                <p
                                                    className="truncate text-xs"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {module.description}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="hidden flex-col items-end gap-1 sm:flex">
                                            {module.duration ? (
                                                <span
                                                    className="cursor-default text-[10px] uppercase tracking-wide"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {module.duration} min
                                                </span>
                                            ) : null}
                                            <span
                                                className="cursor-default text-xs font-semibold"
                                                style={{
                                                    color: done
                                                        ? "var(--role-accent)"
                                                        : "var(--dashboard-fg)",
                                                }}
                                            >
                                                {isEnrolled
                                                    ? `${Math.round(moduleProgress)}%`
                                                    : "Preview"}
                                            </span>
                                        </div>
                                        <span
                                            className="text-sm transition group-hover:translate-x-0.5"
                                            style={{
                                                color: "var(--role-accent)",
                                            }}
                                            aria-hidden="true"
                                        >
                                            →
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </Panel>
        </div>
    );
};

export default PathDetailPage;
