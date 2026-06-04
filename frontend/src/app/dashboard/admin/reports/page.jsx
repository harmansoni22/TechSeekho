"use client";

import { useState } from "react";
import {
    downloadCSV,
    formatDate,
    GhostButton,
    RangePicker,
} from "@/features/dashboard/admin/adminShared";
import {
    fetchAdminAnalytics,
    fetchInstitutionPeople,
    fetchInstitutions,
} from "@/features/dashboard/api/adminDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * Institution reporting. Reports are generated on demand from raw operational
 * data and exported as CSV — reproducible by re-running with the same range.
 * We deliberately avoid a server-side "rendered report" store; the inputs are
 * the source of truth, the CSV is a view.
 */
const REPORTS = [
    {
        key: "batch-performance",
        title: "Batch performance",
        blurb: "Every batch with student count, assignment volume, and attendance presence.",
        async build(range) {
            const a = await fetchAdminAnalytics({ range });
            return {
                filename: `batch-performance-${range}.csv`,
                headers: [
                    "Batch",
                    "Institution",
                    "Active",
                    "Students",
                    "Assignments",
                    "AttendanceRate%",
                ],
                rows: (a.batchPerformance ?? []).map((b) => [
                    b.name,
                    b.institutionName ?? "",
                    b.isActive ? "yes" : "no",
                    b.students,
                    b.assignments,
                    b.attendanceRate ?? "",
                ]),
            };
        },
    },
    {
        key: "attendance-summary",
        title: "Attendance summary",
        blurb: "Presence rate per batch over the selected window — your low-attendance shortlist.",
        async build(range) {
            const a = await fetchAdminAnalytics({ range });
            return {
                filename: `attendance-summary-${range}.csv`,
                headers: [
                    "Batch",
                    "Institution",
                    "Students",
                    "AttendanceRate%",
                ],
                rows: (a.batchPerformance ?? [])
                    .filter((b) => b.attendanceRate != null)
                    .sort((x, y) => x.attendanceRate - y.attendanceRate)
                    .map((b) => [
                        b.name,
                        b.institutionName ?? "",
                        b.students,
                        b.attendanceRate,
                    ]),
            };
        },
    },
    {
        key: "student-roster",
        title: "Student roster",
        blurb: "All students across your institutions with enrolment, batch, and status.",
        async build() {
            const institutions = await fetchInstitutions();
            const rows = [];
            for (const inst of institutions) {
                const res = await fetchInstitutionPeople({
                    institutionId: inst.id,
                    role: "STUDENT",
                });
                for (const p of res.people ?? []) {
                    rows.push([
                        p.fullName,
                        p.email ?? "",
                        p.phone ?? "",
                        p.enrollmentNumber ?? "",
                        inst.name,
                        p.currentBatchName ?? "Unassigned",
                        p.status,
                    ]);
                }
            }
            return {
                filename: "student-roster.csv",
                headers: [
                    "Name",
                    "Email",
                    "Phone",
                    "Enrollment",
                    "Institution",
                    "Batch",
                    "Status",
                ],
                rows,
            };
        },
    },
    {
        key: "trainer-roster",
        title: "Trainer roster",
        blurb: "All trainers with specialization, experience, workload, and status.",
        async build() {
            const institutions = await fetchInstitutions();
            const rows = [];
            for (const inst of institutions) {
                const res = await fetchInstitutionPeople({
                    institutionId: inst.id,
                    role: "TRAINER",
                });
                for (const p of res.people ?? []) {
                    rows.push([
                        p.fullName,
                        p.email ?? "",
                        p.phone ?? "",
                        p.specialization ?? "",
                        p.experienceYears ?? "",
                        inst.name,
                        p.batchCount ?? 0,
                        p.status,
                    ]);
                }
            }
            return {
                filename: "trainer-roster.csv",
                headers: [
                    "Name",
                    "Email",
                    "Phone",
                    "Specialization",
                    "ExperienceYears",
                    "Institution",
                    "Batches",
                    "Status",
                ],
                rows,
            };
        },
    },
];

export default function AdminReportsPage() {
    const [range, setRange] = useState("30d");
    const [busyKey, setBusyKey] = useState(null);
    const [error, setError] = useState(null);
    const [lastRun, setLastRun] = useState({});

    async function generate(report) {
        setBusyKey(report.key);
        setError(null);
        try {
            const { filename, headers, rows } = await report.build(range);
            if (rows.length === 0) {
                setError(`No data for "${report.title}" yet.`);
                return;
            }
            downloadCSV(filename, headers, rows);
            setLastRun((prev) => ({
                ...prev,
                [report.key]: new Date().toISOString(),
            }));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyKey(null);
        }
    }

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Operations · Reports"
                title="Exportable operational reports."
                subtitle="Generate CSV reports from live operational data. Each report is reproducible — re-run with the same window to get the same view. Nothing is written back to operational tables."
                actions={<RangePicker range={range} setRange={setRange} />}
            />

            {error && (
                <div
                    className="rounded-lg border px-4 py-3 text-sm"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        color: "rgb(185, 28, 28)",
                    }}
                >
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {REPORTS.map((r) => (
                    <Panel
                        key={r.key}
                        eyebrow="Report"
                        title={r.title}
                        description={r.blurb}
                        actions={
                            <GhostButton
                                onClick={() => generate(r)}
                                disabled={busyKey === r.key}
                            >
                                {busyKey === r.key
                                    ? "Generating…"
                                    : "Download CSV"}
                            </GhostButton>
                        }
                    >
                        <p
                            className="text-xs"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {r.key.includes("roster")
                                ? "Reflects current roster state."
                                : `Computed over the selected ${range} window.`}
                            {lastRun[r.key]
                                ? ` · Last generated ${formatDate(lastRun[r.key])}`
                                : ""}
                        </p>
                    </Panel>
                ))}
            </div>
        </div>
    );
}
