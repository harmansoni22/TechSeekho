"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
    ATTENDANCE_TARGET,
    attendanceRate,
    COORD_ICONS,
    formatDate,
    HealthBar,
    ProjectionTag,
    pluralize,
    TierChip,
    WinStat,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

const STATUS_TONES = {
    PRESENT: { fg: "#047857", bg: "rgba(16, 185, 129, 0.12)", order: 0 },
    LATE: { fg: "#b45309", bg: "rgba(245, 158, 11, 0.16)", order: 1 },
    ABSENT: {
        fg: "var(--dashboard-danger, #dc2626)",
        bg: "color-mix(in srgb, var(--dashboard-danger, #dc2626) 12%, transparent)",
        order: 2,
    },
};

function dayKey(value) {
    try {
        return new Date(value).toISOString().slice(0, 10);
    } catch {
        return "";
    }
}

/**
 * Coordinator Attendance — read-only projection.
 *
 * Replaces the old marking screen. A coordinator can VIEW attendance (the
 * backend allows the read and blocks the write); marking is owned by trainers
 * and admins. We lead with the trailing rate (a win when it clears target),
 * break it down by day, and list present students first.
 */
export default function CoordinatorAttendancePage() {
    const [batches, setBatches] = useState(null);
    const [batchesError, setBatchesError] = useState(null);
    const [batchId, setBatchId] = useState("");

    const [records, setRecords] = useState(null);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [recordsError, setRecordsError] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");

    const loadBatches = useCallback(async () => {
        setBatchesError(null);
        try {
            const result = await api("/batches");
            const list = Array.isArray(result?.data) ? result.data : [];
            setBatches(list);
            if (list.length && !batchId) setBatchId(list[0].id);
        } catch (err) {
            setBatchesError(err.message);
            setBatches([]);
        }
    }, [batchId]);

    useEffect(() => {
        loadBatches();
    }, [loadBatches]);

    const loadRecords = useCallback(async () => {
        if (!batchId) return;
        setRecordsLoading(true);
        setRecordsError(null);
        setSelectedDate("");
        try {
            const res = await api(
                `/attendance?batchId=${encodeURIComponent(batchId)}&limit=300`,
            );
            setRecords(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            setRecordsError(err.message);
            setRecords([]);
        } finally {
            setRecordsLoading(false);
        }
    }, [batchId]);

    useEffect(() => {
        if (batchId) loadRecords();
    }, [batchId, loadRecords]);

    const model = useMemo(() => {
        if (!records) return null;
        const overall = attendanceRate(records);
        const byDate = new Map();
        for (const r of records) {
            const k = dayKey(r.date);
            if (!k) continue;
            if (!byDate.has(k)) byDate.set(k, []);
            byDate.get(k).push(r);
        }
        const days = [...byDate.entries()]
            .map(([date, recs]) => ({ date, ...attendanceRate(recs) }))
            .sort((a, b) => (a.date < b.date ? 1 : -1));
        return { overall, days, byDate };
    }, [records]);

    const effectiveDate = selectedDate || model?.days?.[0]?.date || "";
    const dayRoster = useMemo(() => {
        if (!model || !effectiveDate) return [];
        const recs = model.byDate.get(effectiveDate) ?? [];
        return [...recs].sort(
            (a, b) =>
                (STATUS_TONES[a.status]?.order ?? 9) -
                    (STATUS_TONES[b.status]?.order ?? 9) ||
                (a.student?.user?.fullName ?? "").localeCompare(
                    b.student?.user?.fullName ?? "",
                ),
        );
    }, [model, effectiveDate]);

    if (batches === null) return <PageLoading label="Loading batches" />;
    if (batchesError)
        return (
            <PageError
                title="Could not load batches"
                message={batchesError}
                onRetry={loadBatches}
            />
        );

    const overallTier =
        model?.overall?.rate === null || model?.overall?.rate === undefined
            ? "setup"
            : model.overall.rate >= ATTENDANCE_TARGET
              ? "strong"
              : "watch";

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Attendance"
                title="How present your cohorts are."
                subtitle="A read-only projection of attendance trainers have already marked. Present and late both count as attended. Nothing here changes the record."
                actions={<ProjectionTag />}
            />

            <Panel eyebrow="View" title="Pick a cohort">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                        <span
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Batch
                        </span>
                        <select
                            value={batchId}
                            onChange={(e) => setBatchId(e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                                color: "var(--dashboard-fg)",
                            }}
                        >
                            {batches.length === 0 && (
                                <option value="">No batches</option>
                            )}
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                    {b.institution?.name
                                        ? ` — ${b.institution.name}`
                                        : ""}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block text-sm">
                        <span
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Day {model?.days?.length ? "" : "(none recorded)"}
                        </span>
                        <select
                            value={effectiveDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            disabled={!model?.days?.length}
                            className="mt-1.5 w-full rounded-md border px-3 py-2 disabled:opacity-60"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                                color: "var(--dashboard-fg)",
                            }}
                        >
                            {(model?.days ?? []).map((d) => (
                                <option key={d.date} value={d.date}>
                                    {formatDate(d.date)} · {d.rate ?? "—"}%
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </Panel>

            {batches.length === 0 ? (
                <PageEmpty
                    title="No batches in scope"
                    description="Attendance appears here once a batch is assigned to your school and a trainer starts marking."
                />
            ) : recordsLoading ? (
                <PageLoading label="Loading attendance" />
            ) : recordsError ? (
                <PageError
                    title="Could not load attendance"
                    message={recordsError}
                    onRetry={loadRecords}
                />
            ) : !model || model.overall.total === 0 ? (
                <PageEmpty
                    title="No attendance recorded yet"
                    description="Once the cohort's trainer marks a session, the rate and roster show up here automatically."
                />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <WinStat
                            label="Trailing attendance"
                            value={`${model.overall.rate}%`}
                            sub={`target ${ATTENDANCE_TARGET}% · ${pluralize(model.days.length, "day")} recorded`}
                            tier={overallTier}
                            icon={COORD_ICONS.pulse}
                        />
                        <WinStat
                            label="Present"
                            value={model.overall.present}
                            sub="marked present"
                            tier="strong"
                            icon={COORD_ICONS.check}
                        />
                        <WinStat
                            label="Late"
                            value={model.overall.late}
                            sub="still counted as attended"
                        />
                        <WinStat
                            label="Absent"
                            value={model.overall.absent}
                            sub="across the window"
                        />
                    </section>

                    <Panel
                        eyebrow="Trend"
                        title="By day"
                        description="Most recent sessions first — each bar is that day's attended share."
                        padded={false}
                    >
                        <ul
                            className="divide-y"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {model.days.map((d) => {
                                const tier =
                                    d.rate >= ATTENDANCE_TARGET
                                        ? "strong"
                                        : "watch";
                                return (
                                    <li
                                        key={d.date}
                                        className="flex items-center gap-4 px-6 py-3"
                                    >
                                        <span
                                            className="w-28 shrink-0 text-sm"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {formatDate(d.date)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <HealthBar
                                                value={d.rate ?? 0}
                                                tier={tier}
                                            />
                                        </div>
                                        <span
                                            className="w-24 shrink-0 text-right text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {d.attended}/{d.total} · {d.rate}%
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </Panel>

                    <Panel
                        eyebrow="Roster"
                        title={`Who was in — ${formatDate(effectiveDate)}`}
                        description="Present and late listed first."
                        padded={false}
                        actions={
                            <TierChip
                                tier={
                                    (model.byDate.get(effectiveDate)
                                        ? attendanceRate(
                                              model.byDate.get(effectiveDate),
                                          ).rate
                                        : 0) >= ATTENDANCE_TARGET
                                        ? "strong"
                                        : "watch"
                                }
                            />
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr
                                        className="text-[10px] uppercase tracking-[0.18em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        <th className="px-6 py-3 font-medium">
                                            Student
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 font-medium text-right">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayRoster.map((r) => {
                                        const tone =
                                            STATUS_TONES[r.status] ??
                                            STATUS_TONES.ABSENT;
                                        return (
                                            <tr
                                                key={r.id}
                                                className="border-t"
                                                style={{
                                                    borderColor:
                                                        "var(--dashboard-border)",
                                                }}
                                            >
                                                <td
                                                    className="px-6 py-3"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {r.student?.user
                                                        ?.fullName ?? "—"}
                                                </td>
                                                <td
                                                    className="px-3 py-3 text-xs"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {r.student?.user?.email ??
                                                        "—"}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span
                                                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                                                        style={{
                                                            backgroundColor:
                                                                tone.bg,
                                                            color: tone.fg,
                                                        }}
                                                    >
                                                        {r.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </>
            )}
        </div>
    );
}
