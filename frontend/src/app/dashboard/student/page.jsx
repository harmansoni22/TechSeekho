"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import Card from "@/app/components/ui/Card";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";

const StudentDashboard = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/student/dashboard", {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data");
            }

            const result = await response.json();
            setDashboardData(result.data);
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
            fetchDashboardData();
        }
    }, [fetchDashboardData, status, router]);

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
                title="Your dashboard could not load."
                message={error}
                onRetry={fetchDashboardData}
                homeHref="/dashboard"
                homeLabel="Dashboard home"
            />
        );
    }

    if (!dashboardData) {
        return (
            <ErrorScreen
                dashboard
                type="empty"
                title="No dashboard data yet."
                description="Your learning overview will appear here once activity is available."
                homeHref="/dashboard"
                homeLabel="Dashboard home"
            />
        );
    }

    const {
        kpis,
        dailyGoals,
        currentStreak,
        quickAccessLessons,
        topCourses,
        recentActivity,
        trainers = [],
        announcements = [],
        todayAssignments = [],
        upcomingAssessments = [],
        attendanceSummary,
    } = dashboardData;

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="My Learning Dashboard"
                subtitle="Track your progress, consistency, and course momentum"
                user={dashboardData.student}
            />

            {/* KPIs Section */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => (
                    <Card
                        key={item.label}
                        className="border"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            backgroundColor: "var(--dashboard-surface)",
                        }}
                    >
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {item.label}
                        </p>
                        <p
                            className="mt-2 text-2xl font-semibold"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            {item.value}
                        </p>
                        <p
                            className="mt-1 text-xs font-medium"
                            style={{ color: "var(--dashboard-accent)" }}
                        >
                            {item.delta}
                        </p>
                    </Card>
                ))}
            </section>

            {/* Daily Goals and Streak */}
            <section className="grid gap-4 lg:grid-cols-2">
                <Card
                    className="border"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    <h3
                        className="text-lg font-semibold"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        Daily Goals
                    </h3>
                    <div className="mt-4 space-y-3">
                        {dailyGoals.map((goal) => (
                            <div
                                key={goal.label}
                                className="flex items-center justify-between"
                            >
                                <span
                                    className="text-sm"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {goal.label}
                                </span>
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-20 rounded-full h-2"
                                        style={{
                                            backgroundColor:
                                                "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-muted) 20%)",
                                        }}
                                    >
                                        <div
                                            className="h-2 rounded-full"
                                            style={{
                                                width: `${goal.progress}%`,
                                                backgroundColor:
                                                    "var(--dashboard-accent)",
                                            }}
                                        ></div>
                                    </div>
                                    <span
                                        className="text-xs font-medium"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {goal.progress}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card
                    className="border"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    <h3
                        className="text-lg font-semibold"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        Learning Streak
                    </h3>
                    <div className="mt-4 text-center">
                        <p
                            className="text-4xl font-bold"
                            style={{ color: "var(--dashboard-accent)" }}
                        >
                            {currentStreak} days
                        </p>
                        <p
                            className="text-sm mt-2"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {dashboardData.longestStreak
                                ? `Longest streak so far: ${dashboardData.longestStreak} days.`
                                : "Keep showing up — your longest streak will track here."}
                        </p>
                        <div className="mt-4 flex justify-center gap-2">
                            {Array.from({ length: 7 }, (_, i) => {
                                const active = i < Math.min(currentStreak, 7);
                                return (
                                    <span
                                        key={`streak-day-${i + 1}`}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                                        style={{
                                            backgroundColor: active
                                                ? "rgba(249, 115, 22, 0.16)"
                                                : "rgba(148, 163, 184, 0.16)",
                                        }}
                                        title={`Day ${i + 1} ${active ? "active" : "inactive"}`}
                                    >
                                        <span
                                            className="text-xl"
                                            style={{
                                                color: active
                                                    ? "var(--dashboard-primary)"
                                                    : "var(--dashboard-muted)",
                                            }}
                                        >
                                            🔥
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </section>

            {/* Quick Access to Current Lessons */}
            <Card
                className="border"
                style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                }}
            >
                <h3
                    className="text-lg font-semibold"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    Continue Learning
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quickAccessLessons.map((lesson) => (
                        <button
                            type="button"
                            key={lesson.id}
                            className="rounded-lg border p-4 text-left cursor-pointer hover:shadow-md transition-shadow"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                            onClick={() =>
                                router.push(
                                    `/dashboard/student/learning/${lesson.courseId}/modules/${lesson.id}`,
                                )
                            }
                        >
                            <h4
                                className="font-medium"
                                style={{ color: "var(--dashboard-fg)" }}
                            >
                                {lesson.title}
                            </h4>
                            <p
                                className="text-sm mt-1"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {lesson.course} • {lesson.progress}% complete
                            </p>
                            <div
                                className="mt-2 w-full rounded-full h-2"
                                style={{
                                    backgroundColor:
                                        "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-muted) 20%)",
                                }}
                            >
                                <div
                                    className="h-2 rounded-full"
                                    style={{
                                        width: `${lesson.progress}%`,
                                        backgroundColor:
                                            "var(--dashboard-primary)",
                                    }}
                                ></div>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            {/* My Courses and Recent Activity */}
            <section className="grid gap-4 lg:grid-cols-2">
                <Card
                    className="border"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    <h3
                        className="text-lg font-semibold"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        My Courses
                    </h3>
                    <div className="mt-4 space-y-3">
                        {topCourses.map((course) => (
                            <div
                                key={course.id}
                                className="rounded-lg border p-3"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    boxShadow: "var(--dashboard-shadow)",
                                }}
                            >
                                <p
                                    className="font-medium"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {course.name}
                                </p>
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {course.enrollments} lessons •{" "}
                                    {course.completion}% completed
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card
                    className="border"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    <h3
                        className="text-lg font-semibold"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        Recent Learning Activity
                    </h3>
                    <ul
                        className="mt-4 space-y-3 text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {recentActivity.map((item) => (
                            <li
                                key={item}
                                className="rounded-lg border px-3 py-2"
                                style={{
                                    backgroundColor:
                                        "color-mix(in srgb, var(--dashboard-surface) 88%, var(--dashboard-primary) 12%)",
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                {item}
                            </li>
                        ))}
                    </ul>
                </Card>
            </section>

            {/* What's next: today's assignments + upcoming assessments */}
            <section className="grid gap-4 lg:grid-cols-2">
                <Panel
                    eyebrow="Today"
                    title="Due today"
                    description="Trainer-issued assignments with today's deadline"
                >
                    {todayAssignments.length === 0 ? (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Nothing due today.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {todayAssignments.map((a) => (
                                <li
                                    key={a.id}
                                    className="rounded-lg border p-3"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                    }}
                                >
                                    <p
                                        className="text-sm font-semibold"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {a.title}
                                    </p>
                                    <p
                                        className="mt-1 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.courseTitle}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    eyebrow="Coming up"
                    title="Upcoming assessments"
                    description="Scheduled in the next 30 days"
                >
                    {upcomingAssessments.length === 0 ? (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            No assessments scheduled.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {upcomingAssessments.map((a) => {
                                const when = a.startsAt
                                    ? new Date(a.startsAt)
                                    : a.dueDate
                                      ? new Date(a.dueDate)
                                      : null;
                                return (
                                    <li
                                        key={a.id}
                                        className="rounded-lg border p-3"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                            backgroundColor:
                                                "var(--dashboard-surface)",
                                        }}
                                    >
                                        <div className="flex items-baseline justify-between gap-3">
                                            <p
                                                className="text-sm font-semibold"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {a.title}
                                            </p>
                                            <span
                                                className="text-[10px] uppercase tracking-wide"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {a.type}
                                            </span>
                                        </div>
                                        <p
                                            className="mt-1 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {a.courseTitle}
                                            {when
                                                ? ` • ${when.toLocaleDateString()}`
                                                : ""}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Panel>
            </section>

            {/* Announcements + Trainers */}
            <section className="grid gap-4 lg:grid-cols-2">
                <Panel
                    eyebrow="From your batch"
                    title="Announcements"
                    description="Latest posts from your trainer and coordinator"
                >
                    {announcements.length === 0 ? (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            No announcements yet.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {announcements.map((a) => (
                                <li
                                    key={a.id}
                                    className="rounded-lg border p-3"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                    }}
                                >
                                    <p
                                        className="text-sm font-semibold"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {a.title}
                                    </p>
                                    <p
                                        className="mt-1 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.authorName}
                                        {a.createdAt
                                            ? ` • ${new Date(a.createdAt).toLocaleDateString()}`
                                            : ""}
                                    </p>
                                    <p
                                        className="mt-2 text-sm"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {a.content}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    eyebrow="Trainers"
                    title="Assigned to your batch"
                    description="The people running your sessions"
                >
                    {trainers.length === 0 ? (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            No trainer assigned yet.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {trainers.map((t) => (
                                <li
                                    key={t.id}
                                    className="rounded-lg border p-3"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                    }}
                                >
                                    <p
                                        className="text-sm font-semibold"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {t.fullName}
                                    </p>
                                    {t.specialization && (
                                        <p
                                            className="mt-1 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {t.specialization}
                                            {t.experienceYears
                                                ? ` • ${t.experienceYears} yrs`
                                                : ""}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </section>

            {/* Attendance summary */}
            {attendanceSummary && attendanceSummary.total > 0 && (
                <Panel
                    eyebrow="Attendance"
                    title={`${attendanceSummary.rate}% attendance rate`}
                    description={`Across the last ${attendanceSummary.total} sessions`}
                >
                    <dl className="grid gap-4 sm:grid-cols-3">
                        <AttendanceTile
                            label="Present"
                            value={attendanceSummary.present}
                            color="var(--dashboard-accent)"
                        />
                        <AttendanceTile
                            label="Late"
                            value={attendanceSummary.late}
                            color="var(--dashboard-primary)"
                        />
                        <AttendanceTile
                            label="Absent"
                            value={attendanceSummary.absent}
                            color="#ef4444"
                        />
                    </dl>
                </Panel>
            )}
        </div>
    );
};

const AttendanceTile = ({ label, value, color }) => (
    <div
        className="rounded-lg border p-4"
        style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
        }}
    >
        <dt
            className="text-[10px] uppercase tracking-[0.24em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </dt>
        <dd className="mt-1 text-2xl font-semibold" style={{ color }}>
            {value}
        </dd>
    </div>
);

export default StudentDashboard;
