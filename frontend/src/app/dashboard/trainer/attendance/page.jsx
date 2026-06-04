"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    bulkMarkAttendance,
    fetchAttendance,
    fetchBatchDetail,
    fetchTrainerBatches,
} from "@/features/dashboard/api/trainerDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * TRAINER — Attendance.
 *
 * Pick a batch + date → load the student roster (from batch detail) and any
 * existing attendance records for that day → pick a status per student →
 * submit as a single `POST /attendance/bulk` request.
 *
 * Behavior decisions:
 *  - Trainer can only see batches they're assigned to (`/batches` is server-
 *    side scoped via `BatchTrainer`).
 *  - Bulk submit is atomic on the backend (single transaction); the page
 *    surfaces success or the first error.
 *  - Re-loading the same date overwrites — the `attendance.upsert` call in
 *    the service treats `(batchId, studentId, date)` as unique.
 */

const STATUS_OPTIONS = [
    { value: "PRESENT", label: "Present", tone: "success" },
    { value: "LATE", label: "Late", tone: "warning" },
    { value: "ABSENT", label: "Absent", tone: "danger" },
];

function toISODate(date) {
    if (!date) return "";
    try {
        return new Date(date).toISOString().slice(0, 10);
    } catch {
        return "";
    }
}

function todayISO() {
    return toISODate(new Date());
}

function statusTone(status) {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt?.tone ?? "muted";
}

function toneFg(tone) {
    if (tone === "success") return "#047857";
    if (tone === "warning") return "#92400e";
    if (tone === "danger") return "#b91c1c";
    return "var(--dashboard-muted)";
}
function toneBg(tone) {
    if (tone === "success") return "rgba(16, 185, 129, 0.14)";
    if (tone === "warning") return "rgba(217, 119, 6, 0.14)";
    if (tone === "danger") return "rgba(220, 38, 38, 0.14)";
    return "rgba(148, 163, 184, 0.18)";
}

export default function TrainerAttendancePage() {
    const [batches, setBatches] = useState(null);
    const [error, setError] = useState(null);

    const [batchId, setBatchId] = useState("");
    const [date, setDate] = useState(todayISO());

    const [students, setStudents] = useState(null);
    const [marks, setMarks] = useState({});
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [rosterError, setRosterError] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Initial load: trainer batches.
    useEffect(() => {
        (async () => {
            try {
                const list = await fetchTrainerBatches();
                const batchList = Array.isArray(list) ? list : [];
                setBatches(batchList);
                // Auto-pick the first active batch so the page is immediately
                // useful instead of forcing the trainer through a dropdown.
                const firstActive = batchList.find((b) => b.isActive !== false);
                setBatchId(firstActive?.id ?? batchList[0]?.id ?? "");
            } catch (err) {
                setError(err?.message || "Unknown error");
                console.error(err?.message);
            }
        })();
    }, []);

    // Roster + existing attendance when batch or date changes.
    const loadRoster = useCallback(async () => {
        if (!batchId || !date) {
            setStudents(null);
            return;
        }
        setLoadingRoster(true);
        setRosterError(null);
        setFeedback(null);
        try {
            const [batch, existing] = await Promise.all([
                fetchBatchDetail(batchId),
                fetchAttendance({ batchId, date, limit: 500 }),
            ]);

            const roster = Array.isArray(batch?.students) ? batch.students : [];
            const existingList = Array.isArray(existing) ? existing : [];

            // Build a quick lookup of existing marks by studentProfileId.
            const byStudentId = new Map();
            for (const row of existingList) {
                if (row.studentId) byStudentId.set(row.studentId, row.status);
            }

            setStudents(roster);
            setMarks((prev) => {
                const next = {};
                for (const s of roster) {
                    next[s.id] =
                        byStudentId.get(s.id) ?? prev[s.id] ?? "PRESENT";
                }
                return next;
            });
        } catch (err) {
            setRosterError(err?.message || "Unknown error");
            setStudents([]);
        } finally {
            setLoadingRoster(false);
        }
    }, [batchId, date]);

    useEffect(() => {
        loadRoster();
    }, [loadRoster]);

    function setAll(status) {
        if (!students) return;
        setMarks((prev) => {
            const next = { ...prev };
            for (const s of students) next[s.id] = status;
            return next;
        });
    }

    async function submit(e) {
        e?.preventDefault?.();
        if (!batchId || !date || !students || students.length === 0) return;
        setSubmitting(true);
        setFeedback(null);
        try {
            const records = students.map((s) => ({
                studentId: s.id,
                status: marks[s.id] || "PRESENT",
            }));
            const isoDate = new Date(date).toISOString();
            await bulkMarkAttendance({ batchId, date: isoDate, records });
            setFeedback({
                tone: "ok",
                message: `Saved ${records.length} record${records.length === 1 ? "" : "s"} for ${date}.`,
            });
            // Refresh so we read back canonical state from the server.
            await loadRoster();
        } catch (err) {
            setFeedback({
                tone: "err",
                message: err?.message || "Failed to save attendance",
            });
        } finally {
            setSubmitting(false);
        }
    }

    // Summary numbers shown above the table.
    const summary = useMemo(() => {
        const acc = { PRESENT: 0, LATE: 0, ABSENT: 0 };
        if (!students) return acc;
        for (const s of students) {
            const status = marks[s.id] || "PRESENT";
            if (acc[status] != null) acc[status] += 1;
        }
        return acc;
    }, [students, marks]);

    if (error) {
        return (
            <PageError
                title="Couldn't load your batches"
                message={error}
                onRetry={() => window.location.reload()}
            />
        );
    }
    if (batches === null) return <PageLoading label="Loading batches" />;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Operations · Attendance"
                title="Mark today, audit tomorrow."
                subtitle="Bulk mark a whole batch in one save. Existing marks for the chosen day are loaded as defaults — change only what's wrong and save."
            />

            {batches.length === 0 ? (
                <PageEmpty
                    title="You're not assigned to any batches yet"
                    description="An admin needs to add you to a batch before you can mark attendance."
                />
            ) : (
                <>
                    <Panel
                        eyebrow="Pick"
                        title="Batch and date"
                        description="The roster below reflects the batch's current students."
                    >
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="Batch">
                                <select
                                    value={batchId}
                                    onChange={(e) => setBatchId(e.target.value)}
                                    className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                                    style={inputStyle}
                                >
                                    {batches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                            {b.course?.title
                                                ? ` — ${b.course.title}`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Date">
                                <input
                                    type="date"
                                    value={date}
                                    max={todayISO()}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                                    style={inputStyle}
                                />
                            </Field>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={loadRoster}
                                    disabled={loadingRoster}
                                    className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        color: "var(--dashboard-fg)",
                                        cursor: loadingRoster
                                            ? "wait"
                                            : "pointer",
                                    }}
                                >
                                    {loadingRoster ? "Loading…" : "Reload"}
                                </button>
                            </div>
                        </div>
                    </Panel>

                    {feedback && (
                        <p
                            className="rounded-md border px-4 py-3 text-sm"
                            style={{
                                borderColor:
                                    feedback.tone === "err"
                                        ? "#fecaca"
                                        : "var(--dashboard-border)",
                                backgroundColor:
                                    feedback.tone === "err"
                                        ? "rgba(254, 226, 226, 0.6)"
                                        : "var(--role-accent-soft)",
                                color:
                                    feedback.tone === "err"
                                        ? "#b91c1c"
                                        : "var(--role-accent)",
                            }}
                        >
                            {feedback.message}
                        </p>
                    )}

                    {loadingRoster ? (
                        <PageLoading label="Loading roster" />
                    ) : rosterError ? (
                        <PageError
                            title="Couldn't load the roster"
                            message={rosterError}
                            onRetry={loadRoster}
                        />
                    ) : !students || students.length === 0 ? (
                        <PageEmpty
                            title="No students in this batch yet"
                            description="An admin assigns students to batches; once they appear here, you can mark their attendance."
                        />
                    ) : (
                        <Panel
                            eyebrow="Roster"
                            title={`${students.length} student${students.length === 1 ? "" : "s"}`}
                            description={`Present ${summary.PRESENT} · Late ${summary.LATE} · Absent ${summary.ABSENT}`}
                            actions={
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setAll(opt.value)}
                                            className="rounded-md border px-3 py-1.5 text-xs font-medium"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                                color: toneFg(opt.tone),
                                                backgroundColor: toneBg(
                                                    opt.tone,
                                                ),
                                                cursor: "pointer",
                                            }}
                                        >
                                            All {opt.label.toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            }
                            padded={false}
                        >
                            <ul
                                className="divide-y"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                {students.map((s) => {
                                    const status = marks[s.id] || "PRESENT";
                                    const tone = statusTone(status);
                                    return (
                                        <li
                                            key={s.id}
                                            className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
                                        >
                                            <div className="min-w-0">
                                                <p
                                                    className="truncate text-sm font-medium"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {s.user?.fullName ||
                                                        "Unnamed student"}
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
                                            <div
                                                className="flex shrink-0 gap-1 rounded-md border p-1"
                                                style={{
                                                    borderColor:
                                                        "var(--dashboard-border)",
                                                    backgroundColor:
                                                        "var(--dashboard-surface)",
                                                }}
                                            >
                                                {STATUS_OPTIONS.map((opt) => {
                                                    const active =
                                                        status === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() =>
                                                                setMarks(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [s.id]: opt.value,
                                                                    }),
                                                                )
                                                            }
                                                            aria-pressed={
                                                                active
                                                            }
                                                            className="rounded px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                                                            style={{
                                                                color: active
                                                                    ? toneFg(
                                                                          opt.tone,
                                                                      )
                                                                    : "var(--dashboard-muted)",
                                                                backgroundColor:
                                                                    active
                                                                        ? toneBg(
                                                                              opt.tone,
                                                                          )
                                                                        : "transparent",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {status !== "PRESENT" && (
                                                <span
                                                    className="ml-2 text-[10px] uppercase tracking-wider"
                                                    style={{
                                                        color: toneFg(tone),
                                                    }}
                                                >
                                                    {status}
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            <div
                                className="flex items-center justify-end gap-2 border-t px-6 py-4"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={submitting}
                                    className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                                    style={{
                                        backgroundColor: "var(--role-accent)",
                                        color: "var(--role-accent-ink)",
                                        cursor: submitting ? "wait" : "pointer",
                                    }}
                                >
                                    {submitting ? "Saving…" : "Save attendance"}
                                </button>
                            </div>
                        </Panel>
                    )}
                </>
            )}
        </div>
    );
}

const inputStyle = {
    borderColor: "var(--dashboard-border)",
    backgroundColor: "var(--dashboard-surface)",
    color: "var(--dashboard-fg)",
};

const Field = ({ label, children }) => (
    <div className="block text-sm">
        <p
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{
                color: "var(--dashboard-muted)",
            }}
        >
            {label}
        </p>
        {children}
    </div>
);
