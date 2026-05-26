"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    fetchLearningPaths,
    fetchStudentAssignments,
    fetchStudentCourses,
    updateModuleProgress,
} from "@/features/dashboard/api/studentDashboard.api";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState.jsx";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";
import PracticeEditor from "@/features/dashboard/components/ui/widgets/PracticeEditor.jsx";

/**
 * Module detail — the leaf of the learning experience.
 *
 * Pulls three data sources in parallel:
 *   - GET /modules → catalog (so we can fetch a module the student hasn't
 *                   enrolled in yet, e.g. for preview)
 *   - GET /student/courses → per-module progress for enrolled paths
 *   - GET /student/assignments → assignments are scoped to course, not module;
 *     we filter by course id for "linked assignments"
 *
 * The Try-It practice block is rendered when the module's `content` field is
 * shaped `{ html?, css?, js? }`. If `content` is plain string or empty, we
 * skip the editor and link out to Skill Labs instead — no fake practice data.
 */
const ModuleDetailPage = () => {
    const { pathId, moduleId } = useParams();
    const router = useRouter();

    const [paths, setPaths] = useState(null);
    const [enrollments, setEnrollments] = useState(null);
    const [assignments, setAssignments] = useState(null);
    const [error, setError] = useState(null);
    const [marking, setMarking] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is the explicit re-fetch trigger after marking complete.
    useEffect(() => {
        let cancelled = false;
        setError(null);
        setPaths(null);
        setEnrollments(null);
        setAssignments(null);
        Promise.all([
            fetchLearningPaths(),
            fetchStudentCourses(),
            fetchStudentAssignments().catch(() => []),
        ])
            .then(([pathsRes, coursesRes, assignmentsRes]) => {
                if (cancelled) return;
                setPaths(Array.isArray(pathsRes) ? pathsRes : []);
                setEnrollments(Array.isArray(coursesRes) ? coursesRes : []);
                setAssignments(
                    Array.isArray(assignmentsRes) ? assignmentsRes : [],
                );
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.message ?? "Could not load this module");
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
    const moduleData = useMemo(
        () => (path?.modules ?? []).find((m) => m.id === moduleId) ?? null,
        [path, moduleId],
    );
    const moduleProgress = useMemo(
        () =>
            (enrollment?.modules ?? []).find((m) => m.id === moduleId) ?? null,
        [enrollment, moduleId],
    );

    const { prevModule, nextModule } = useMemo(() => {
        if (!path?.modules?.length)
            return { prevModule: null, nextModule: null };
        const ordered = [...path.modules].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        const idx = ordered.findIndex((m) => m.id === moduleId);
        return {
            prevModule: idx > 0 ? ordered[idx - 1] : null,
            nextModule:
                idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null,
        };
    }, [path, moduleId]);

    const linkedAssignments = useMemo(() => {
        if (!assignments || !path?.courseId) return [];
        return assignments.filter((a) => a.courseId === path.courseId);
    }, [assignments, path]);

    const practiceSnippet = useMemo(() => {
        const content = moduleData?.content;
        if (!content || typeof content !== "object") return null;
        const html = typeof content.html === "string" ? content.html : "";
        const css = typeof content.css === "string" ? content.css : "";
        const js = typeof content.js === "string" ? content.js : "";
        if (!html && !css && !js) return null;
        return { html, css, js };
    }, [moduleData]);

    const onMarkComplete = async () => {
        if (marking || !moduleData || !enrollment) return;
        setMarking(true);
        try {
            await updateModuleProgress(moduleData.id, 100);
            setReloadKey((k) => k + 1);
        } catch (err) {
            setError(err?.message ?? "Could not update progress");
        } finally {
            setMarking(false);
        }
    };

    const loading =
        paths === null || enrollments === null || assignments === null;

    if (error) {
        return (
            <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
                <TopBar title="Module" subtitle="Error" />
                <PageError
                    title="Could not load this module"
                    message={error}
                    onRetry={() => setReloadKey((k) => k + 1)}
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
                <TopBar title="Module" subtitle="Loading…" />
                <PageLoading label="Loading module" />
            </div>
        );
    }

    if (!path || !moduleData) {
        return (
            <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
                <TopBar
                    title="Module not found"
                    subtitle="The module may have been removed from this path"
                />
                <Panel eyebrow="Not found" title="That module isn't here">
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        It may have been removed, reordered, or you may not have
                        access to its parent path.
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            router.push("/dashboard/student/learning")
                        }
                        className="mt-4 cursor-pointer rounded-md px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                        }}
                    >
                        Back to paths
                    </button>
                </Panel>
            </div>
        );
    }

    const isEnrolled = Boolean(enrollment);
    const currentProgress = moduleProgress?.progress ?? 0;
    const isDone = currentProgress >= 100;

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title={moduleData.title}
                subtitle={`${path.title} · Module ${moduleData.order ?? "?"}`}
            />

            <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                    href={`/dashboard/student/learning/${path.id}`}
                    className="cursor-pointer rounded-md border px-3 py-1 text-xs font-medium transition hover:opacity-90 focus:outline-none focus:ring-2"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        color: "var(--dashboard-fg)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    ← {path.title}
                </Link>
                {moduleData.duration ? (
                    <span
                        className="cursor-default rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                            backgroundColor: "var(--dashboard-border)",
                            color: "var(--dashboard-muted)",
                        }}
                    >
                        {moduleData.duration} min
                    </span>
                ) : null}
                <span
                    className="cursor-default rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                        backgroundColor: moduleData.isRequired
                            ? "var(--role-accent-soft)"
                            : "var(--dashboard-border)",
                        color: moduleData.isRequired
                            ? "var(--role-accent)"
                            : "var(--dashboard-muted)",
                    }}
                >
                    {moduleData.isRequired ? "Required" : "Optional"}
                </span>
                {isEnrolled ? (
                    <span
                        className="cursor-default rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                            backgroundColor: isDone
                                ? "var(--role-accent)"
                                : "var(--dashboard-border)",
                            color: isDone
                                ? "var(--role-accent-ink)"
                                : "var(--dashboard-muted)",
                        }}
                    >
                        {isDone
                            ? "Completed"
                            : `${Math.round(currentProgress)}%`}
                    </span>
                ) : null}
            </div>

            <Panel
                eyebrow="Lesson"
                title={moduleData.title}
                description={moduleData.description ?? undefined}
                actions={
                    isEnrolled ? (
                        <button
                            type="button"
                            onClick={onMarkComplete}
                            disabled={marking || isDone}
                            className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                                backgroundColor: isDone
                                    ? "var(--dashboard-border)"
                                    : "var(--role-accent)",
                                color: isDone
                                    ? "var(--dashboard-muted)"
                                    : "var(--role-accent-ink)",
                            }}
                            aria-label={
                                isDone
                                    ? "Already completed"
                                    : marking
                                      ? "Marking complete…"
                                      : "Mark this module complete"
                            }
                        >
                            {isDone
                                ? "Already done"
                                : marking
                                  ? "Marking…"
                                  : "Mark complete"}
                        </button>
                    ) : (
                        <Link
                            href={`/dashboard/student/learning/${path.id}`}
                            className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Enroll to track
                        </Link>
                    )
                }
            >
                {moduleData.videoUrl ? (
                    <div className="mb-4">
                        <a
                            href={moduleData.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition hover:opacity-90 focus:outline-none focus:ring-2"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                        >
                            ▶ Watch the lesson video
                        </a>
                    </div>
                ) : null}

                {typeof moduleData.content === "string" &&
                moduleData.content.trim() ? (
                    <article
                        className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {moduleData.content}
                    </article>
                ) : !practiceSnippet ? (
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        No written content has been added to this module yet.
                        Use the video above if available, or head to{" "}
                        <Link
                            href="/dashboard/student/skill-labs"
                            className="cursor-pointer font-semibold underline"
                            style={{ color: "var(--role-accent)" }}
                        >
                            Skill Labs
                        </Link>{" "}
                        to practice freely.
                    </p>
                ) : null}
            </Panel>

            {practiceSnippet ? (
                <Panel
                    eyebrow="Try it"
                    title="Practice this lesson"
                    description="Edits run inside a sandboxed iframe — your work is saved locally per module."
                >
                    <PracticeEditor
                        storageKey={`techseekho_module_practice_v1:${moduleData.id}`}
                        initial={practiceSnippet}
                        compact
                    />
                </Panel>
            ) : null}

            {linkedAssignments.length > 0 ? (
                <Panel
                    eyebrow="Linked assignments"
                    title="From this course"
                    description="Assignments tied to the course this module belongs to."
                >
                    <ul className="grid gap-2 sm:grid-cols-2">
                        {linkedAssignments.map((a) => (
                            <li key={a.id}>
                                <Link
                                    href={`/dashboard/student/assignments/${a.id}`}
                                    className="block cursor-pointer rounded-lg border p-3 transition hover:opacity-95 focus:outline-none focus:ring-2"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                    }}
                                >
                                    <p
                                        className="truncate text-sm font-semibold"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {a.title}
                                    </p>
                                    {a.dueDate ? (
                                        <p
                                            className="cursor-default text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            Due{" "}
                                            {new Date(
                                                a.dueDate,
                                            ).toLocaleDateString("en-IN")}
                                        </p>
                                    ) : null}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Panel>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
                {prevModule ? (
                    <Link
                        href={`/dashboard/student/learning/${path.id}/modules/${prevModule.id}`}
                        className="block cursor-pointer rounded-lg border p-3 transition hover:opacity-95 focus:outline-none focus:ring-2"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            backgroundColor: "var(--dashboard-surface)",
                        }}
                    >
                        <p
                            className="cursor-default text-[10px] uppercase tracking-[0.2em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            ← Previous module
                        </p>
                        <p
                            className="mt-1 truncate text-sm font-semibold"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            {prevModule.title}
                        </p>
                    </Link>
                ) : (
                    <div aria-hidden="true" />
                )}
                {nextModule ? (
                    <Link
                        href={`/dashboard/student/learning/${path.id}/modules/${nextModule.id}`}
                        className="block cursor-pointer rounded-lg border p-3 text-right transition hover:opacity-95 focus:outline-none focus:ring-2"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            backgroundColor: "var(--dashboard-surface)",
                        }}
                    >
                        <p
                            className="cursor-default text-[10px] uppercase tracking-[0.2em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Next module →
                        </p>
                        <p
                            className="mt-1 truncate text-sm font-semibold"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            {nextModule.title}
                        </p>
                    </Link>
                ) : null}
            </div>
        </div>
    );
};

export default ModuleDetailPage;
