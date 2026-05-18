"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import Card from "@/app/components/ui/Card";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";

const StudentHomework = () => {
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
            setAssignments(result.data);
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

    const getStatusColor = (status) => {
        switch (status) {
            case "SUBMITTED":
                return "var(--dashboard-accent)";
            case "REVIEWED":
                return "var(--dashboard-primary)";
            default:
                return "var(--dashboard-muted)";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "PENDING":
                return "Not Started";
            case "SUBMITTED":
                return "Submitted";
            case "REVIEWED":
                return "Reviewed";
            default:
                return status;
        }
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

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

    const pendingAssignments = assignments.filter(
        (a) => !a.submission || a.submission.status === "PENDING",
    );
    const submittedAssignments = assignments.filter(
        (a) => a.submission && a.submission.status !== "PENDING",
    );

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="My Assignments"
                subtitle="Track and submit your homework assignments"
            />

            {/* Pending Assignments */}
            {pendingAssignments.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4">
                        Pending Assignments
                    </h2>
                    <div className="grid gap-4">
                        {pendingAssignments.map((assignment) => (
                            <Card
                                key={assignment.id}
                                className="border"
                                style={{
                                    borderColor: isOverdue(assignment.dueDate)
                                        ? "rgba(239, 68, 68, 0.3)"
                                        : "var(--dashboard-border)",
                                    backgroundColor: "var(--dashboard-surface)",
                                }}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3
                                                className="text-lg font-semibold mb-2"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {assignment.title}
                                            </h3>
                                            {assignment.description && (
                                                <p
                                                    className="text-sm mb-3"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {assignment.description}
                                                </p>
                                            )}
                                            <div className="flex items-center space-x-4 text-sm">
                                                <span
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    Course:{" "}
                                                    {assignment.course.title}
                                                </span>
                                                <span
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    By: {assignment.createdBy}
                                                </span>
                                                <span
                                                    style={{
                                                        color: isOverdue(
                                                            assignment.dueDate,
                                                        )
                                                            ? "rgb(239, 68, 68)"
                                                            : "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    Due:{" "}
                                                    {new Date(
                                                        assignment.dueDate,
                                                    ).toLocaleDateString()}
                                                    {isOverdue(
                                                        assignment.dueDate,
                                                    ) && " (Overdue)"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className="px-3 py-1 rounded-full text-xs font-medium mb-2"
                                                style={{
                                                    backgroundColor:
                                                        "rgba(239, 68, 68, 0.1)",
                                                    color: "rgb(239, 68, 68)",
                                                }}
                                            >
                                                {isOverdue(assignment.dueDate)
                                                    ? "Overdue"
                                                    : "Pending"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex space-x-3">
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-lg font-medium transition-colors"
                                            style={{
                                                backgroundColor:
                                                    "var(--dashboard-primary)",
                                                color: "white",
                                            }}
                                        >
                                            Submit Assignment
                                        </button>
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-lg font-medium border transition-colors"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Submitted Assignments */}
            {submittedAssignments.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4">
                        Submitted Assignments
                    </h2>
                    <div className="grid gap-4">
                        {submittedAssignments.map((assignment) => (
                            <Card
                                key={assignment.id}
                                className="border"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor: "var(--dashboard-surface)",
                                }}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3
                                                className="text-lg font-semibold mb-2"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {assignment.title}
                                            </h3>
                                            {assignment.description && (
                                                <p
                                                    className="text-sm mb-3"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {assignment.description}
                                                </p>
                                            )}
                                            <div className="flex items-center space-x-4 text-sm">
                                                <span
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    Course:{" "}
                                                    {assignment.course.title}
                                                </span>
                                                <span
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    By: {assignment.createdBy}
                                                </span>
                                                <span
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    Submitted:{" "}
                                                    {new Date(
                                                        assignment.submission
                                                            .submittedAt,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {assignment.submission.feedback && (
                                                <div
                                                    className="mt-3 p-3 rounded-lg"
                                                    style={{
                                                        backgroundColor:
                                                            "rgba(34, 197, 94, 0.1)",
                                                        border: "1px solid rgba(34, 197, 94, 0.2)",
                                                    }}
                                                >
                                                    <p
                                                        className="text-sm font-medium mb-1"
                                                        style={{
                                                            color: "rgb(34, 197, 94)",
                                                        }}
                                                    >
                                                        Feedback:
                                                    </p>
                                                    <p
                                                        className="text-sm"
                                                        style={{
                                                            color: "var(--dashboard-fg)",
                                                        }}
                                                    >
                                                        {
                                                            assignment
                                                                .submission
                                                                .feedback
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className="px-3 py-1 rounded-full text-xs font-medium mb-2"
                                                style={{
                                                    backgroundColor: `${getStatusColor(assignment.submission.status)}20`,
                                                    color: getStatusColor(
                                                        assignment.submission
                                                            .status,
                                                    ),
                                                }}
                                            >
                                                {getStatusText(
                                                    assignment.submission
                                                        .status,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex space-x-3">
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-lg font-medium border transition-colors"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            View Submission
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* No Assignments */}
            {assignments.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3
                        className="text-xl font-semibold mb-2"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        No Assignments Yet
                    </h3>
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        You don't have any assignments at the moment. Check back
                        later!
                    </p>
                </div>
            )}
        </div>
    );
};

export default StudentHomework;
