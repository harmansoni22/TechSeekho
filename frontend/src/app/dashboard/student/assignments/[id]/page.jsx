"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    fetchLearningPaths,
    fetchStudentAssignments,
} from "@/features/dashboard/api/studentDashboard.api";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState.jsx";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";

/**
 * Assignment detail.
 *
 * The list endpoint already returns the full assignment row (title, course,
 * submission status, feedback, due date, creator) so the detail page is just
 * find-by-id from that list — no second endpoint required.
 *
 * Related modules are inferred by matching `assignment.course.id` against
 * every learning path's `courseId` and then collecting modules from those
 * paths. This gives the student a one-click bridge from an assignment back
 * to the relevant lesson.
 */

const STATUS_LABEL = {
    PENDING: "Not started",
    SUBMITTED: "Submitted",
    REVIEWED: "Reviewed",
};

const AssignmentDetailPage = () => {
    const { id } = useParams();
    const router = useRouter();

    const [assignments, setAssignments] = useState(null);
    const [paths, setPaths] = useState(null);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is the retry trigger.
    useEffect(() => {
        let cancelled = false;
        setError(null);
        setAssignments(null);
        setPaths(null);
        Promise.all([
            fetchStudentAssignments(),
            fetchLearningPaths().catch(() => []),
        ])
            .then(([assignmentsRes, pathsRes]) => {
                if (cancelled) return;
                setAssignments(
                    Array.isArray(assignmentsRes) ? assignmentsRes : [],
                );
                setPaths(Array.isArray(pathsRes) ? pathsRes : []);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.message ?? "Could not load this assignment");
            });
        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    const assignment = useMemo(
        () => (assignments ?? []).find((a) => a.id === id) ?? null,
        [assignments, id],
    );

    const relatedModules = useMemo(() => {
        if (!assignment?.course?.id || !paths) return [];
        const result = [];
        for (const path of paths) {
            if (path.courseId !== assignment.course.id) continue;
            for (const module of path.modules ?? []) {
                result.push({
                    ...module,
                    _pathId: path.id,
                    _pathTitle: path.title,
                });
            }
        }
        return result;
    }, [assignment, paths]);

    const loading = assignments === null || paths === null;

    if (error) {
        return (
            <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
                <TopBar title="Assignment" subtitle="Error" />
                <PageError
                    title="Could not load this assignment"
                    message={error}
                    onRetry={() => setReloadKey((k) => k + 1)}
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
                <TopBar title="Assignment" subtitle="Loading…" />
                <PageLoading label="Loading assignment" />
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
                <TopBar
                    title="Assignment not found"
                    subtitle="It may have been retracted by your trainer"
                />
                <PageEmpty
                    title="That assignment isn't visible to you"
                    description="It may have been deleted, scheduled for a different batch, or not yet released."
                    action={
                        <button
                            type="button"
                            onClick={() =>
                                router.push("/dashboard/student/assignments")
                            }
                            className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            All assignments
                        </button>
                    }
                />
            </div>
        );
    }

    const submissionStatus = assignment.submission?.status ?? "PENDING";
    const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const overdue = submissionStatus === "PENDING" && due && due < new Date();
    const submitted = submissionStatus !== "PENDING";

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title={assignment.title}
                subtitle={
                    assignment.course?.title
                        ? `${assignment.course.title} · Issued by ${assignment.createdBy ?? "trainer"}`
                        : `Issued by ${assignment.createdBy ?? "trainer"}`
                }
            />

            <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                    href="/dashboard/student/assignments"
                    className="cursor-pointer rounded-md border px-3 py-1 text-xs font-medium transition hover:opacity-90 focus:outline-none focus:ring-2"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        color: "var(--dashboard-fg)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    ← All assignments
                </Link>
                <span
                    className="cursor-default rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                        backgroundColor: submitted
                            ? "var(--role-accent-soft)"
                            : overdue
                              ? "color-mix(in srgb, var(--dashboard-surface) 60%, #ef4444 40%)"
                              : "var(--dashboard-border)",
                        color: submitted
                            ? "var(--role-accent)"
                            : overdue
                              ? "#ef4444"
                              : "var(--dashboard-muted)",
                    }}
                >
                    {overdue && !submitted
                        ? "Overdue"
                        : (STATUS_LABEL[submissionStatus] ?? submissionStatus)}
                </span>
                {due ? (
                    <span
                        className="cursor-default rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                            backgroundColor: "var(--dashboard-border)",
                            color: overdue
                                ? "#ef4444"
                                : "var(--dashboard-muted)",
                        }}
                    >
                        Due {due.toLocaleDateString("en-IN")}
                    </span>
                ) : null}
            </div>

            <Panel
                eyebrow="Brief"
                title="Assignment details"
                description={
                    assignment.description ??
                    "No additional description provided."
                }
            >
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <Row
                        label="Course"
                        value={assignment.course?.title ?? "—"}
                    />
                    <Row
                        label="Issued by"
                        value={assignment.createdBy ?? "—"}
                    />
                    <Row
                        label="Due"
                        value={
                            due
                                ? due.toLocaleString("en-IN", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                  })
                                : "No deadline set"
                        }
                    />
                    <Row
                        label="Your status"
                        value={
                            overdue && !submitted
                                ? "Overdue"
                                : (STATUS_LABEL[submissionStatus] ??
                                  submissionStatus)
                        }
                    />
                    {assignment.submission?.submittedAt ? (
                        <Row
                            label="Submitted on"
                            value={new Date(
                                assignment.submission.submittedAt,
                            ).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                            })}
                        />
                    ) : null}
                </dl>
            </Panel>

            {assignment.submission?.feedback ? (
                <Panel
                    eyebrow="Trainer feedback"
                    title="Notes on your submission"
                >
                    <p
                        className="whitespace-pre-wrap text-sm"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {assignment.submission.feedback}
                    </p>
                </Panel>
            ) : null}

            {relatedModules.length > 0 ? (
                <Panel
                    eyebrow="Related lessons"
                    title="From the same course"
                    description="Modules taught alongside this assignment."
                >
                    <ul className="grid gap-2 sm:grid-cols-2">
                        {relatedModules.map((m) => (
                            <li key={`${m._pathId}:${m.id}`}>
                                <Link
                                    href={`/dashboard/student/learning/${m._pathId}/modules/${m.id}`}
                                    className="block cursor-pointer rounded-lg border p-3 transition hover:opacity-95 focus:outline-none focus:ring-2"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                    }}
                                >
                                    <p
                                        className="cursor-default text-[10px] uppercase tracking-[0.2em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {m._pathTitle}
                                    </p>
                                    <p
                                        className="mt-1 truncate text-sm font-semibold"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {m.title}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Panel>
            ) : null}

            <Panel
                eyebrow="Submitting"
                title="How to submit"
                description="The submission UI is handled by your trainer in person or via the file-upload form your batch uses."
            >
                <p
                    className="text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    Once your trainer marks your submission, you'll see it here
                    with feedback. In-app file submission is coming as part of
                    the upload pipeline.
                </p>
            </Panel>
        </div>
    );
};

const Row = ({ label, value }) => (
    <div>
        <dt
            className="cursor-default text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </dt>
        <dd
            className="mt-0.5 text-sm font-medium"
            style={{ color: "var(--dashboard-fg)" }}
        >
            {value}
        </dd>
    </div>
);

export default AssignmentDetailPage;
