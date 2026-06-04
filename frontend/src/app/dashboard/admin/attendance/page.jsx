"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    GhostButton,
    MetricBar,
    MiniBars,
    Modal,
    Pill,
    RangePicker,
} from "@/features/dashboard/admin/adminShared";
import {
    fetchAdminAnalytics,
    fetchAttendance,
} from "@/features/dashboard/api/adminDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

const LOW_THRESHOLD = 75;

export default function AdminAttendancePage() {
    const [range, setRange] = useState("30d");
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [drillBatch, setDrillBatch] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        setData(null);
        try {
            setData(await fetchAdminAnalytics({ range }));
        } catch (err) {
            setError(err.message);
        }
    }, [range]);

    useEffect(() => {
        load();
    }, [load]);

    const batches = useMemo(() => {
        const list = data?.batchPerformance ?? [];
        // Surface batches with attendance data; sort lowest presence first so the
        // operational gaps float to the top.
        return [...list].sort((a, b) => {
            const ra = a.attendanceRate ?? 999;
            const rb = b.attendanceRate ?? 999;
            return ra - rb;
        });
    }, [data]);

    if (error)
        return (
            <PageError
                title="Couldn't load attendance"
                message={error}
                onRetry={load}
            />
        );
    if (!data) return <PageLoading label="Loading attendance" />;

    const presence = data.rates?.attendancePresence;
    const totalRecords = data.totals?.attendance ?? 0;
    const tracked = batches.filter((b) => b.attendanceRate != null);
    const lowCount = tracked.filter(
        (b) => b.attendanceRate < LOW_THRESHOLD,
    ).length;
    const series = data.series?.attendance ?? [];

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Operations · Attendance"
                title="Where presence is slipping."
                subtitle="Read-only oversight built on raw attendance records. Trainers mark attendance; you monitor completion and chase the gaps."
                actions={<RangePicker range={range} setRange={setRange} />}
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                    label={`Presence (${range})`}
                    value={presence == null ? "—" : `${presence}%`}
                    footnote={`${totalRecords} records`}
                />
                <StatTile label="Batches tracked" value={tracked.length} />
                <StatTile
                    label="Below 75%"
                    value={lowCount}
                    footnote={lowCount > 0 ? "need attention" : "all healthy"}
                />
                <StatTile
                    label="Untracked batches"
                    value={batches.length - tracked.length}
                    footnote="no records yet"
                />
            </section>

            <Panel
                eyebrow="Trend"
                title={`Daily attendance volume · ${range}`}
                description="Records marked per day across your institutions."
            >
                {series.length === 0 || totalRecords === 0 ? (
                    <PageEmpty title="No attendance recorded in this window" />
                ) : (
                    <MiniBars series={series} />
                )}
            </Panel>

            <Panel
                eyebrow="By batch"
                title="Attendance completion"
                description="Lowest presence first. Open a batch to find inactive students."
                padded={false}
            >
                {tracked.length === 0 ? (
                    <div className="px-6 py-8">
                        <PageEmpty title="No batches with attendance yet" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr
                                    className="text-[10px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    <th className="px-6 py-3 font-medium">
                                        Batch
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Students
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Presence
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Flag
                                    </th>
                                    <th className="px-6 py-3 text-right font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map((b) => (
                                    <tr
                                        key={b.id}
                                        className="border-t"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td className="px-6 py-3">
                                            <div
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {b.name}
                                            </div>
                                            <div
                                                className="text-xs"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {b.institutionName ?? "—"}
                                            </div>
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {b.students}
                                        </td>
                                        <td className="px-3 py-3">
                                            {b.attendanceRate == null ? (
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    no data
                                                </span>
                                            ) : (
                                                <div className="w-32">
                                                    <div
                                                        className="mb-1 text-xs"
                                                        style={{
                                                            color: "var(--dashboard-fg)",
                                                        }}
                                                    >
                                                        {b.attendanceRate}%
                                                    </div>
                                                    <MetricBar
                                                        value={b.attendanceRate}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            {b.attendanceRate == null ? (
                                                <Pill tone="muted">—</Pill>
                                            ) : b.attendanceRate <
                                              LOW_THRESHOLD ? (
                                                <Pill tone="danger">Low</Pill>
                                            ) : b.attendanceRate < 85 ? (
                                                <Pill tone="warning">
                                                    Watch
                                                </Pill>
                                            ) : (
                                                <Pill tone="success">
                                                    Healthy
                                                </Pill>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <GhostButton
                                                onClick={() => setDrillBatch(b)}
                                            >
                                                Students
                                            </GhostButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {drillBatch && (
                <BatchAttendanceModal
                    batch={drillBatch}
                    onClose={() => setDrillBatch(null)}
                />
            )}
        </div>
    );
}

function BatchAttendanceModal({ batch, onClose }) {
    const [records, setRecords] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetchAttendance({
                    batchId: batch.id,
                    limit: 500,
                });
                if (!cancelled) setRecords(Array.isArray(res) ? res : []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [batch.id]);

    // Roll records into a per-student presence summary.
    const perStudent = useMemo(() => {
        const map = new Map();
        for (const r of records ?? []) {
            const id = r.student?.id ?? r.studentId;
            const name = r.student?.user?.fullName ?? "Student";
            const e = map.get(id) || {
                name,
                present: 0,
                late: 0,
                absent: 0,
                total: 0,
            };
            if (r.status === "PRESENT") e.present += 1;
            else if (r.status === "LATE") e.late += 1;
            else e.absent += 1;
            e.total += 1;
            map.set(id, e);
        }
        return Array.from(map.values())
            .map((e) => ({
                ...e,
                rate:
                    e.total > 0
                        ? Math.round(((e.present + e.late) / e.total) * 100)
                        : null,
            }))
            .sort((a, b) => (a.rate ?? 999) - (b.rate ?? 999));
    }, [records]);

    return (
        <Modal
            title={batch.name}
            description="Per-student presence across the loaded window. Lowest first — these are your inactive students."
            onClose={onClose}
            wide
            footer={<GhostButton onClick={onClose}>Close</GhostButton>}
        >
            {error ? (
                <p className="text-sm" style={{ color: "rgb(185,28,28)" }}>
                    {error}
                </p>
            ) : records === null ? (
                <PageLoading label="Loading records" />
            ) : perStudent.length === 0 ? (
                <PageEmpty title="No attendance records for this batch" />
            ) : (
                <div
                    className="max-h-96 overflow-y-auto rounded-lg border"
                    style={{ borderColor: "var(--dashboard-border)" }}
                >
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr
                                className="text-[10px] uppercase tracking-[0.18em]"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                <th className="px-4 py-2 font-medium">
                                    Student
                                </th>
                                <th className="px-3 py-2 font-medium">
                                    Present
                                </th>
                                <th className="px-3 py-2 font-medium">Late</th>
                                <th className="px-3 py-2 font-medium">
                                    Absent
                                </th>
                                <th className="px-4 py-2 font-medium">Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {perStudent.map((s) => (
                                <tr
                                    key={s.name}
                                    className="border-t"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <td
                                        className="px-4 py-2"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {s.name}
                                    </td>
                                    <td className="px-3 py-2">{s.present}</td>
                                    <td className="px-3 py-2">{s.late}</td>
                                    <td className="px-3 py-2">{s.absent}</td>
                                    <td className="px-4 py-2">
                                        {s.rate == null ? (
                                            "—"
                                        ) : (
                                            <span
                                                style={{
                                                    color:
                                                        s.rate < LOW_THRESHOLD
                                                            ? "rgb(185,28,28)"
                                                            : "var(--dashboard-fg)",
                                                }}
                                            >
                                                {s.rate}%
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
}
