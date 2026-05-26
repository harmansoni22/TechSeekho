"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import Card from "@/app/components/ui/Card";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";

const StudentCourses = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/student/courses", {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch courses");
            }

            const result = await response.json();
            setCourses(result.data);
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
            fetchCourses();
        }
    }, [fetchCourses, status, router]);

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
                title="Your courses could not load."
                message={error}
                onRetry={fetchCourses}
                homeHref="/dashboard/student"
                homeLabel="Student home"
            />
        );
    }

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="My Courses"
                subtitle="Track your progress across all enrolled courses"
            />

            <div className="grid gap-6">
                {courses.map((course) => (
                    <Card
                        key={course.id}
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
                                        className="text-xl font-semibold mb-2"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {course.title}
                                    </h3>
                                    <p
                                        className="text-sm mb-4"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {course.description}
                                    </p>
                                    <div className="flex items-center space-x-4 text-sm">
                                        <span
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            Course: {course.course.title}
                                        </span>
                                        <span
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            Enrolled:{" "}
                                            {new Date(
                                                course.enrolledAt,
                                            ).toLocaleDateString()}
                                        </span>
                                        {course.completedAt && (
                                            <span
                                                style={{
                                                    color: "var(--dashboard-accent)",
                                                }}
                                            >
                                                Completed:{" "}
                                                {new Date(
                                                    course.completedAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div
                                        className="text-2xl font-bold mb-2"
                                        style={{
                                            color: "var(--dashboard-primary)",
                                        }}
                                    >
                                        {Math.round(course.progress)}%
                                    </div>
                                    <div
                                        className="text-sm"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        Complete
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="w-full progress-track rounded-full h-3">
                                    <div
                                        className="h-3 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${course.progress}%`,
                                            backgroundColor:
                                                "var(--dashboard-primary)",
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Modules */}
                            <div className="mt-6">
                                <h4
                                    className="font-medium mb-3"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    Modules ({course.modules.length})
                                </h4>
                                <div className="space-y-2">
                                    {course.modules
                                        .slice(0, 3)
                                        .map((module) => (
                                            <div
                                                key={module.id}
                                                className="flex items-center justify-between p-3 rounded-lg border"
                                                style={{
                                                    borderColor:
                                                        "var(--dashboard-border)",
                                                    backgroundColor:
                                                        "var(--dashboard-surface)",
                                                }}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                                                        style={{
                                                            backgroundColor:
                                                                module.completedAt
                                                                    ? "var(--dashboard-primary)"
                                                                    : "var(--dashboard-muted)",
                                                            color: "white",
                                                        }}
                                                    >
                                                        {module.completedAt
                                                            ? "✓"
                                                            : module.order}
                                                    </div>
                                                    <div>
                                                        <div
                                                            className="font-medium text-sm"
                                                            style={{
                                                                color: "var(--dashboard-fg)",
                                                            }}
                                                        >
                                                            {module.title}
                                                        </div>
                                                        {module.duration && (
                                                            <div
                                                                className="text-xs"
                                                                style={{
                                                                    color: "var(--dashboard-muted)",
                                                                }}
                                                            >
                                                                {
                                                                    module.duration
                                                                }{" "}
                                                                minutes
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-16 progress-track rounded-full h-2">
                                                        <div
                                                            className="h-2 rounded-full"
                                                            style={{
                                                                width: `${module.progress}%`,
                                                                backgroundColor:
                                                                    module.completedAt
                                                                        ? "var(--dashboard-primary)"
                                                                        : "var(--dashboard-accent)",
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span
                                                        className="text-xs font-medium"
                                                        style={{
                                                            color: "var(--dashboard-fg)",
                                                        }}
                                                    >
                                                        {module.progress}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    {course.modules.length > 3 && (
                                        <div className="text-center pt-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        `/dashboard/student/learning/${course.pathId}`,
                                                    )
                                                }
                                                className="cursor-pointer text-sm font-medium hover:underline focus:outline-none focus:ring-2"
                                                style={{
                                                    color: "var(--dashboard-primary)",
                                                }}
                                            >
                                                View all {course.modules.length}{" "}
                                                modules →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/student/learning/${course.pathId}`,
                                        )
                                    }
                                    className="cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-95 focus:outline-none focus:ring-2"
                                    style={{
                                        backgroundColor:
                                            "var(--dashboard-primary)",
                                        color: "var(--dashboard-primary-fg)",
                                    }}
                                >
                                    Continue Learning
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/student/learning/${course.pathId}`,
                                        )
                                    }
                                    className="cursor-pointer px-4 py-2 rounded-lg font-medium border transition-colors hover:opacity-95 focus:outline-none focus:ring-2"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
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

            {courses.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <h3
                        className="text-xl font-semibold mb-2"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        No Courses Yet
                    </h3>
                    <p
                        className="text-sm mb-6"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        You haven't enrolled in any courses yet. Start your
                        learning journey today!
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            router.push("/dashboard/student/learning")
                        }
                        className="cursor-pointer px-6 py-3 rounded-lg font-medium transition-colors hover:opacity-95 focus:outline-none focus:ring-2"
                        style={{
                            backgroundColor: "var(--dashboard-primary)",
                            color: "var(--dashboard-primary-fg)",
                        }}
                    >
                        Browse Courses
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentCourses;
