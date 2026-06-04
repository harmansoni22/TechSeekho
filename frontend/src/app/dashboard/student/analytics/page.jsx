"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import { AnalyticsSkeleton } from "@/features/dashboard/components/ui/skeletons/DashboardSkeletons";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";
import { api } from "@/lib/api";

const StudentAnalyticsPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [bundle, setBundle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [dashRes, assignRes, attendRes] = await Promise.all([
                fetch("/api/student/dashboard", {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken}`,
                    },
                }),
                fetch("/api/student/assignments", {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken}`,
                    },
                }),
                api("/student/attendance"),
            ]);
            if (!dashRes.ok) throw new Error("Dashboard fetch failed");
            if (!assignRes.ok) throw new Error("Assignments fetch failed");
            const dashJson = await dashRes.json();
            const assignJson = await assignRes.json();
            setBundle({
                dashboard: dashJson.data,
                assignments: assignJson.data ?? [],
                attendance: attendRes.data ?? [],
            });
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
            fetchAll();
        }
    }, [fetchAll, status, router]);

    const summary = useMemo(() => {
        if (!bundle) return null;
        const attendance = bundle.attendance;
        const attendanceCounts = attendance.reduce(
            (acc, r) => {
                if (r.status === "PRESENT") acc.present += 1;
                else if (r.status === "LATE") acc.late += 1;
                else if (r.status === "ABSENT") acc.absent += 1;
                return acc;
            },
            { present: 0, late: 0, absent: 0 },
        );
        const totalAttendance = attendance.length;
        const attendanceRate =
            totalAttendance > 0
                ? Math.round(
                      ((attendanceCounts.present + attendanceCounts.late) *
                          100) /
                          totalAttendance,
                  )
                : 0;

        const assignments = bundle.assignments;
        const assignmentCounts = assignments.reduce(
            (acc, a) => {
                const s = a.submission?.status ?? "PENDING";
                acc[s] = (acc[s] ?? 0) + 1;
                return acc;
            },
            { PENDING: 0, SUBMITTED: 0, REVIEWED: 0 },
        );
        const totalAssignments = assignments.length;
        const submitted =
            assignmentCounts.SUBMITTED + assignmentCounts.REVIEWED;
        const completionRate =
            totalAssignments > 0
                ? Math.round((submitted * 100) / totalAssignments)
                : 0;

        const courses = bundle.dashboard.courses ?? [];
        return {
            attendanceCounts,
            totalAttendance,
            attendanceRate,
            assignmentCounts,
            totalAssignments,
            completionRate,
            courses,
        };
    }, [bundle]);

    if (status === "loading" || loading) {
        return <AnalyticsSkeleton />;
    }

    if (error || !summary) {
        return (
            <ErrorScreen
                dashboard
                type="network"
                title="Analytics could not load."
                message={error || "No analytics data."}
                onRetry={fetchAll}
                homeHref="/dashboard/student"
                homeLabel="Student home"
            />
        );
    }

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="My Analytics"
                subtitle="Operational performance — attendance, work, and progress"
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Attendance rate"
                    value={`${summary.attendanceRate}%`}
                    footnote={`${summary.totalAttendance} sessions tracked`}
                />
                <KpiCard
                    label="Assignment completion"
                    value={`${summary.completionRate}%`}
                    footnote={`${summary.totalAssignments} issued`}
                />
                <KpiCard
                    label="Reviewed by trainer"
                    value={String(summary.assignmentCounts.REVIEWED)}
                    footnote="Submissions with feedback"
                />
                <KpiCard
                    label="Active courses"
                    value={String(
                        summary.courses.filter((c) => !c.completedAt).length,
                    )}
                    footnote={`${summary.courses.length} total enrolled`}
                />
            </section>

            <Panel
                eyebrow="Attendance"
                title="Last 30 sessions"
                description="Present + late counts towards your attendance rate"
            >
                <AttendanceBreakdown counts={summary.attendanceCounts} />
            </Panel>

            <Panel
                eyebrow="Assignments"
                title="Work status breakdown"
                description="From the assignments issued to your batch"
            >
                <AssignmentBreakdown
                    counts={summary.assignmentCounts}
                    total={summary.totalAssignments}
                />
            </Panel>

            <Panel
                eyebrow="Courses"
                title="Progress per learning path"
                description="Module completion across the paths you are enrolled in"
            >
                {summary.courses.length === 0 ? (
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        You have no learning-path enrollments yet. Your trainer
                        will create one for the path your batch is following.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {summary.courses.map((c) => (
                            <li
                                key={c.id}
                                className="rounded-lg border p-4"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor: "var(--dashboard-surface)",
                                }}
                            >
                                <div className="flex items-baseline justify-between">
                                    <p
                                        className="text-sm font-semibold"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {c.title}
                                    </p>
                                    <span
                                        className="text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {Math.round(c.progress)}%
                                    </span>
                                </div>
                                <div className="progress-track mt-2 h-2 w-full rounded-full">
                                    <div
                                        className="h-2 rounded-full"
                                        style={{
                                            width: `${c.progress}%`,
                                            backgroundColor:
                                                "var(--dashboard-primary)",
                                        }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
};

const KpiCard = ({ label, value, footnote }) => (
    <div
        className="rounded-xl border p-4"
        style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
            boxShadow: "var(--dashboard-shadow)",
        }}
    >
        <p
            className="text-[10px] uppercase tracking-[0.24em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </p>
        <p
            className="mt-2 text-2xl font-semibold"
            style={{ color: "var(--dashboard-fg)" }}
        >
            {value}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--dashboard-muted)" }}>
            {footnote}
        </p>
    </div>
);

const AttendanceBreakdown = ({ counts }) => {
    const total = counts.present + counts.late + counts.absent;
    const row = (label, value, color) => {
        const pct = total > 0 ? Math.round((value * 100) / total) : 0;
        return (
            <li>
                <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--dashboard-fg)" }}>
                        {label}
                    </span>
                    <span style={{ color: "var(--dashboard-muted)" }}>
                        {value} ({pct}%)
                    </span>
                </div>
                <div className="progress-track mt-1 h-2 w-full rounded-full">
                    <div
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                </div>
            </li>
        );
    };
    if (total === 0) {
        return (
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                No attendance recorded yet for your batch.
            </p>
        );
    }
    return (
        <ul className="space-y-3">
            {row("Present", counts.present, "var(--dashboard-accent)")}
            {row("Late", counts.late, "var(--dashboard-primary)")}
            {row("Absent", counts.absent, "#ef4444")}
        </ul>
    );
};

const AssignmentBreakdown = ({ counts, total }) => {
    const row = (label, value, color) => {
        const pct = total > 0 ? Math.round((value * 100) / total) : 0;
        return (
            <li>
                <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--dashboard-fg)" }}>
                        {label}
                    </span>
                    <span style={{ color: "var(--dashboard-muted)" }}>
                        {value} ({pct}%)
                    </span>
                </div>
                <div className="progress-track mt-1 h-2 w-full rounded-full">
                    <div
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                </div>
            </li>
        );
    };
    if (total === 0) {
        return (
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                No assignments issued to your batch yet.
            </p>
        );
    }
    return (
        <ul className="space-y-3">
            {row(
                "Not started",
                counts.PENDING,
                "color-mix(in srgb, var(--dashboard-surface) 60%, var(--dashboard-muted) 40%)",
            )}
            {row("Submitted", counts.SUBMITTED, "var(--dashboard-accent)")}
            {row("Reviewed", counts.REVIEWED, "var(--dashboard-primary)")}
        </ul>
    );
};

export default StudentAnalyticsPage;
