"use client";

import { useState } from "react";
import {
    downloadCSV,
    Field,
    FormMessage,
    GhostButton,
    inputStyle,
    Modal,
    Pill,
    PrimaryButton,
    parseCSV,
} from "@/features/dashboard/admin/adminShared";
import { bulkCreateStudents } from "@/features/dashboard/api/adminDashboard.api";

/**
 * Bulk student onboarding modal. Parses a CSV client-side, previews the valid
 * rows, posts them to the bulk endpoint, then surfaces per-row results with
 * one-time credentials (exportable as CSV). Extracted from the students page to
 * keep that file focused on the roster view.
 */
export default function BulkImportModal({
    institutionId,
    batches,
    onClose,
    onDone,
}) {
    const [rows, setRows] = useState([]);
    const [batchId, setBatchId] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [parseNote, setParseNote] = useState(null);

    function handleFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => ingest(String(reader.result || ""));
        reader.readAsText(file);
    }

    function ingest(text) {
        setError(null);
        try {
            const parsed = parseCSV(text);
            const mapped = parsed
                .map((r) => ({
                    fullName: r.fullname || r.name || r["full name"] || "",
                    email: r.email || "",
                    phone: r.phone || r.mobile || "",
                    enrollmentNumber:
                        r.enrollmentnumber ||
                        r.enrollment ||
                        r["enrollment number"] ||
                        "",
                }))
                .filter((r) => r.fullName || r.email || r.phone);
            const valid = mapped.filter(
                (r) => r.fullName && (r.email || r.phone),
            );
            setRows(mapped);
            setParseNote(
                `${mapped.length} row(s) parsed · ${valid.length} valid (need a name + email/phone).`,
            );
        } catch {
            setError("Could not parse that file. Use a CSV with a header row.");
        }
    }

    const validRows = rows.filter((r) => r.fullName && (r.email || r.phone));

    async function submit() {
        setBusy(true);
        setError(null);
        try {
            const res = await bulkCreateStudents({
                institutionId,
                batchId: batchId || undefined,
                students: validRows.map((r) => ({
                    fullName: r.fullName,
                    email: r.email || undefined,
                    phone: r.phone || undefined,
                    enrollmentNumber: r.enrollmentNumber || undefined,
                })),
            });
            setResults(res);
            onDone?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    function exportCredentials() {
        const ok = (results?.results ?? []).filter((r) => r.ok);
        downloadCSV(
            "student-credentials.csv",
            ["fullName", "identifier", "enrollmentNumber", "temporaryPassword"],
            ok.map((r) => [
                r.fullName,
                r.identifier,
                r.enrollmentNumber,
                r.temporaryPassword,
            ]),
        );
    }

    return (
        <Modal
            title="Bulk import students"
            description="Upload a CSV with columns: fullName, email, phone, enrollmentNumber. Each row needs a name plus an email or phone."
            onClose={onClose}
            wide
            footer={
                results ? (
                    <>
                        <GhostButton onClick={exportCredentials}>
                            Download credentials CSV
                        </GhostButton>
                        <PrimaryButton onClick={onClose}>Done</PrimaryButton>
                    </>
                ) : (
                    <>
                        <GhostButton onClick={onClose} disabled={busy}>
                            Cancel
                        </GhostButton>
                        <PrimaryButton
                            onClick={submit}
                            disabled={busy || validRows.length === 0}
                        >
                            {busy
                                ? "Importing…"
                                : `Import ${validRows.length} student(s)`}
                        </PrimaryButton>
                    </>
                )
            }
        >
            {results ? (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <Pill tone="success">{results.created} created</Pill>
                        {results.failed > 0 && (
                            <Pill tone="danger">{results.failed} failed</Pill>
                        )}
                    </div>
                    <p
                        className="text-xs"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Download the credentials CSV now — temporary passwords
                        are shown only once.
                    </p>
                    <div
                        className="max-h-64 overflow-y-auto rounded-lg border"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        <table className="w-full text-left text-xs">
                            <tbody>
                                {results.results.map((r) => (
                                    <tr
                                        key={`${r.row}-${r.identifier}`}
                                        className="border-t"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td className="px-3 py-2">{r.row}</td>
                                        <td
                                            className="px-3 py-2"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {r.fullName || "—"}
                                        </td>
                                        <td className="px-3 py-2">
                                            {r.ok ? (
                                                <span className="font-mono">
                                                    {r.temporaryPassword}
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        color: "rgb(185,28,28)",
                                                    }}
                                                >
                                                    {r.error}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="CSV file">
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleFile}
                                className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                                style={inputStyle}
                            />
                        </Field>
                        <Field label="Place all in batch (optional)">
                            <select
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                className="mt-1.5 w-full rounded-md border px-3 py-2"
                                style={inputStyle}
                            >
                                <option value="">No batch yet</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    {parseNote && (
                        <p
                            className="text-xs"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {parseNote}
                        </p>
                    )}
                    {validRows.length > 0 && (
                        <div
                            className="max-h-48 overflow-y-auto rounded-lg border"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            <table className="w-full text-left text-xs">
                                <tbody>
                                    {validRows.slice(0, 50).map((r, i) => (
                                        <tr
                                            key={`${r.email || r.phone}-${i}`}
                                            className="border-t"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                            }}
                                        >
                                            <td
                                                className="px-3 py-2"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {r.fullName}
                                            </td>
                                            <td
                                                className="px-3 py-2"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {r.email || r.phone}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <FormMessage error={error} />
                </div>
            )}
        </Modal>
    );
}
