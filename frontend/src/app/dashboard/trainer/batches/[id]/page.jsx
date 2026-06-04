"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
    fetchAssignments,
    fetchAttendance,
    fetchBatchDetail,
} from "@/features/dashboard/api/trainerDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

/**
 * TRAINER — Batch detail.
 *
 * Aggregated view of one batch the trainer is assigned to. The backend's
 * `/batches/:id` already enforces `assertCanAccessBatch` for the trainer; we
 * fan out to `/assignments?batchId=` and `/attendance?batchId=` for the
 * operational metrics. No new endpoints needed.
 */

function formatDate(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

function summarizeAttendance(rows) {
    const acc = { PRESENT: 0, LATE: 0, ABSENT: 0, total: 0 };
    for (const r of rows || []) {
        if (acc[r.status] != null) {
            acc[r.status] += 1;
            acc.total += 1;
        }
    }
    const rate =
        acc.total > 0
            ? Math.round(((acc.PRESENT + acc.LATE) / acc.total) * 100)
            : null;
    return { ...acc, ratePercent: rate };
}

export default function TrainerBatchDetailPage() {
    const params = useParams();
    const id = params?.id;

    const [batch, setBatch] = useState(null);
    const [assignments, setAssignments] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [b, a, att] = await Promise.all([
                fetchBatchDetail(id),
                fetchAssignments({ batchId: id }).catch(() => []),
                fetchAttendance({ batchId: id, limit: 100 }).catch(() => []),
            ]);
            setBatch(b);
            setAssignments(Array.isArray(a) ? a : []);
            setAttendance(Array.isArray(att) ? att : []);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <PageLoading label="Loading batch detail" />;
    if (error)
        return (
            <PageError
                title="Could not load batch"
                message={error}
                onRetry={load}
            />
        );
    if (!batch)
        return (
            <PageEmpty
                title="Batch not found"
                description="It may have been deleted or you may no longer be assigned to it."
            />
        );

    const students = Array.isArray(batch.students) ? batch.students : [];
    const trainers = Array.isArray(batch.trainers) ? batch.trainers : [];
    const att = summarizeAttendance(attendance);
    const upcoming = (assignments || [])
        .filter((a) => {
            if (!a.dueDate) return false;
            const d = new Date(a.dueDate);
            return !Number.isNaN(d.getTime()) && d.getTime() >= Date.now();
        })
        .slice(0, 5);
    const overdue = (assignments || []).filter((a) => {
        if (!a.dueDate) return false;
        const d = new Date(a.dueDate);
        return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
    }).length;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow={`Batch · ${batch.course?.title || ""}`}
                title={batch.name}
                subtitle={`${batch.institution?.name || ""} · ${formatDate(batch.startDate)} → ${batch.endDate ? formatDate(batch.endDate) : "open"}`}
                actions={
                    <>
                        <Link
                            href="/dashboard/trainer/batches"
                            className="rounded-md border px-3 py-2 text-xs font-medium"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                            }}
                        >
                            ← All batches
                        </Link>
                        <Link
                            href={`/dashboard/trainer/attendance?batchId=${batch.id}`}
                            className="rounded-md px-3 py-2 text-xs font-semibold"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Mark attendance
                        </Link>
                    </>
                }
            />

            <section className="dash-reveal dash-reveal-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Students" value={students.length} />
                <StatTile label="Trainers" value={trainers.length} />
                <StatTile
                    label="Assignments"
                    value={(assignments || []).length}
                    footnote={overdue ? `${overdue} overdue` : "all on track"}
                />
                <StatTile
                    label="Attendance"
                    value={
                        att.ratePercent == null ? "—" : `${att.ratePercent}%`
                    }
                    footnote={`${att.total} records (last 100)`}
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-5">
                <Panel
                    eyebrow="Roster"
                    title={`Students (${students.length})`}
                    description="Active students in this batch."
                    className="lg:col-span-3"
                    padded={false}
                >
                    {students.length === 0 ? (
                        <div className="px-6 py-10">
                            <PageEmpty title="No students assigned yet" />
                        </div>
                    ) : (
                        <ul
                            className="divide-y"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {students.map((s) => (
                                <li
                                    key={s.id}
                                    className="flex items-center justify-between gap-3 px-6 py-3"
                                >
                                    <div className="min-w-0">
                                        <p
                                            className="truncate text-sm font-medium"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {s.user?.fullName || "—"}
                                        </p>
                                        <p
                                            className="truncate text-[11px]"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {s.user?.email || "—"}
                                            {s.enrollmentNumber
                                                ? ` · #${s.enrollmentNumber}`
                                                : ""}
                                        </p>
                                    </div>
                                    <span
                                        className="shrink-0 text-[11px]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        Joined {formatDate(s.joinedAt)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <div className="space-y-6 lg:col-span-2">
                    <Panel
                        eyebrow="Faculty"
                        title="Trainers"
                        description="All instructors assigned to this batch."
                        padded={false}
                    >
                        {trainers.length === 0 ? (
                            <div className="px-6 py-8">
                                <PageEmpty title="No trainers assigned" />
                            </div>
                        ) : (
                            <ul
                                className="divide-y"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                {trainers.map((bt) => (
                                    <li key={bt.id} className="px-6 py-3">
                                        <p
                                            className="text-sm font-medium"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {bt.trainer?.user?.fullName || "—"}
                                        </p>
                                        <p
                                            className="text-[11px]"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {bt.trainer?.user?.email || ""}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel
                        eyebrow="Attendance"
                        title="Last 100 records"
                        description="Per-status breakdown."
                    >
                        {att.total === 0 ? (
                            <PageEmpty title="No attendance recorded yet" />
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                <AttendanceCell
                                    label="Present"
                                    value={att.PRESENT}
                                    tone="success"
                                />
                                <AttendanceCell
                                    label="Late"
                                    value={att.LATE}
                                    tone="warning"
                                />
                                <AttendanceCell
                                    label="Absent"
                                    value={att.ABSENT}
                                    tone="danger"
                                />
                            </div>
                        )}
                    </Panel>
                </div>
            </section>

            <Panel
                eyebrow="Workload"
                title="Upcoming assignments"
                description="Soonest deadlines for this batch."
                actions={
                    <Link
                        href="/dashboard/trainer/assignments"
                        className="text-xs font-semibold"
                        style={{ color: "var(--role-accent)" }}
                    >
                        All assignments →
                    </Link>
                }
                padded={false}
            >
                {upcoming.length === 0 ? (
                    <div className="px-6 py-8">
                        <PageEmpty title="No upcoming work" />
                    </div>
                ) : (
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {upcoming.map((a) => (
                            <li key={a.id} className="px-6 py-3">
                                <Link
                                    href={`/dashboard/trainer/assignments/${a.id}`}
                                    className="flex items-center justify-between gap-3 hover:underline"
                                >
                                    <span
                                        className="truncate text-sm font-medium"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {a.title}
                                    </span>
                                    <span
                                        className="shrink-0 text-[11px]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        Due {formatDate(a.dueDate)}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
}

const AttendanceCell = ({ label, value, tone }) => {
    const fg =
        tone === "success"
            ? "#047857"
            : tone === "warning"
              ? "#92400e"
              : "#b91c1c";
    const bg =
        tone === "success"
            ? "rgba(16, 185, 129, 0.10)"
            : tone === "warning"
              ? "rgba(217, 119, 6, 0.10)"
              : "rgba(220, 38, 38, 0.10)";
    return (
        <div
            className="rounded-lg border px-3 py-3 text-center"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: bg,
            }}
        >
            <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </p>
            <p
                className="mt-1 font-display text-2xl"
                style={{ color: fg, fontWeight: 500 }}
            >
                {new Intl.NumberFormat().format(Number(value) || 0)}
            </p>
        </div>
    );
};
