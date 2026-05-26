"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";

const STATUS_LABEL = {
    PENDING: "Not started",
    SUBMITTED: "Submitted",
    REVIEWED: "Reviewed",
};

const StudentAssignmentsPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAssignments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/student/assignments", {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch assignments");
            }
            const result = await response.json();
            setAssignments(result.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }
        if (status === "authenticated") {
            fetchAssignments();
        }
    }, [fetchAssignments, status, router]);

    const buckets = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const today = [];
        const pending = [];
        const completed = [];

        for (const a of assignments) {
            const submissionStatus = a.submission?.status ?? "PENDING";
            const due = a.dueDate ? new Date(a.dueDate) : null;
            if (submissionStatus !== "PENDING") {
                completed.push(a);
            } else if (due && due >= startOfToday && due <= endOfToday) {
                today.push(a);
            } else {
                pending.push(a);
            }
        }
        return { today, pending, completed };
    }, [assignments]);

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <ErrorScreen
                dashboard
                type="network"
                title="Assignments could not load."
                message={error}
                onRetry={fetchAssignments}
                homeHref="/dashboard/student"
                homeLabel="Student home"
            />
        );
    }

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="My Assignments"
                subtitle="Work issued by your trainer for the current batch"
            />

            <AssignmentBucket
                title="Due today"
                description="Submit before end of day"
                items={buckets.today}
                emptyMessage="Nothing due today."
                emphasis
            />
            <AssignmentBucket
                title="Pending"
                description="Not yet submitted"
                items={buckets.pending}
                emptyMessage="No outstanding assignments."
            />
            <AssignmentBucket
                title="Completed"
                description="Submitted or reviewed"
                items={buckets.completed}
                emptyMessage="No submitted work yet."
            />
        </div>
    );
};

const AssignmentBucket = ({
    title,
    description,
    items,
    emptyMessage,
    emphasis = false,
}) => (
    <Panel title={title} description={description}>
        {items.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                {emptyMessage}
            </p>
        ) : (
            <ul className="space-y-3">
                {items.map((a) => (
                    <AssignmentRow
                        key={a.id}
                        assignment={a}
                        emphasis={emphasis}
                    />
                ))}
            </ul>
        )}
    </Panel>
);

const AssignmentRow = ({ assignment, emphasis }) => {
    const submissionStatus = assignment.submission?.status ?? "PENDING";
    const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const overdue = submissionStatus === "PENDING" && due && due < new Date();

    const statusStyle =
        submissionStatus === "REVIEWED"
            ? {
                  backgroundColor:
                      "color-mix(in srgb, var(--dashboard-surface) 70%, var(--dashboard-primary) 30%)",
                  color: "var(--dashboard-primary)",
              }
            : submissionStatus === "SUBMITTED"
              ? {
                    backgroundColor:
                        "color-mix(in srgb, var(--dashboard-surface) 70%, var(--dashboard-accent) 30%)",
                    color: "var(--dashboard-accent)",
                }
              : overdue
                ? {
                      backgroundColor:
                          "color-mix(in srgb, var(--dashboard-surface) 70%, #ef4444 30%)",
                      color: "#ef4444",
                  }
                : {
                      backgroundColor:
                          "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-muted) 20%)",
                      color: "var(--dashboard-muted)",
                  };

    return (
        <li>
            <Link
                href={`/dashboard/student/assignments/${assignment.id}`}
                className="block cursor-pointer rounded-lg border p-4 transition hover:opacity-95 focus:outline-none focus:ring-2"
                style={{
                    borderColor: emphasis
                        ? "var(--dashboard-primary)"
                        : "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                }}
                aria-label={`Open assignment ${assignment.title}`}
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h4
                            className="text-base font-semibold"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            {assignment.title}
                        </h4>
                        {assignment.description && (
                            <p
                                className="mt-1 text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {assignment.description}
                            </p>
                        )}
                        <div
                            className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {assignment.course?.title && (
                                <span>Course: {assignment.course.title}</span>
                            )}
                            {assignment.createdBy && (
                                <span>By: {assignment.createdBy}</span>
                            )}
                            {due && (
                                <span
                                    style={{
                                        color: overdue
                                            ? "#ef4444"
                                            : "var(--dashboard-muted)",
                                    }}
                                >
                                    Due {due.toLocaleDateString()}
                                    {overdue && " (overdue)"}
                                </span>
                            )}
                        </div>
                        {assignment.submission?.feedback && (
                            <p
                                className="mt-3 rounded border p-3 text-sm"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor:
                                        "color-mix(in srgb, var(--dashboard-surface) 90%, var(--dashboard-primary) 10%)",
                                    color: "var(--dashboard-fg)",
                                }}
                            >
                                <span
                                    className="block text-[10px] font-medium uppercase tracking-wide"
                                    style={{
                                        color: "var(--dashboard-primary)",
                                    }}
                                >
                                    Trainer feedback
                                </span>
                                {assignment.submission.feedback}
                            </p>
                        )}
                    </div>
                    <span
                        className="cursor-default rounded-full px-3 py-1 text-xs font-semibold"
                        style={statusStyle}
                    >
                        {overdue && submissionStatus === "PENDING"
                            ? "Overdue"
                            : (STATUS_LABEL[submissionStatus] ??
                              submissionStatus)}
                    </span>
                </div>
            </Link>
        </li>
    );
};

export default StudentAssignmentsPage;
