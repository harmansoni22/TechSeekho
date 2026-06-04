"use client";

/**
 * Shared UI + helpers for the institution-scoped ADMIN dashboard.
 *
 * These primitives are reused across every admin operational page (students,
 * trainers, batches, attendance, assignments, announcements) so the pages stay
 * thin and the interaction language (modals, pills, fields, CSV export) is
 * consistent. They honour the dashboard theme tokens — no hardcoded palette.
 */

import { cloneElement, useEffect, useId, useRef } from "react";

export const inputStyle = {
    borderColor: "var(--dashboard-border)",
    backgroundColor: "var(--dashboard-surface)",
    color: "var(--dashboard-fg)",
};

export function formatDate(value) {
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

export function formatDateTime(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "—";
    }
}

// ── primitives ───────────────────────────────────────────────────────────────

export function PrimaryButton({ children, className = "", ...rest }) {
    return (
        <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            style={{
                backgroundColor: "var(--role-accent)",
                color: "var(--role-accent-ink)",
                cursor: "pointer",
            }}
            {...rest}
        >
            {children}
        </button>
    );
}

export function GhostButton({ children, className = "", ...rest }) {
    return (
        <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            style={{
                borderColor: "var(--dashboard-border)",
                color: "var(--dashboard-fg)",
                cursor: "pointer",
            }}
            {...rest}
        >
            {children}
        </button>
    );
}

const PILL_TONES = {
    accent: { bg: "var(--role-accent-soft)", fg: "var(--role-accent)" },
    success: { bg: "rgba(16, 185, 129, 0.14)", fg: "rgb(5, 150, 105)" },
    warning: { bg: "rgba(217, 119, 6, 0.14)", fg: "rgb(180, 83, 9)" },
    danger: { bg: "rgba(220, 38, 38, 0.14)", fg: "rgb(185, 28, 28)" },
    muted: { bg: "rgba(148, 163, 184, 0.16)", fg: "var(--dashboard-muted)" },
    info: { bg: "rgba(2, 132, 199, 0.14)", fg: "rgb(7, 89, 133)" },
};

export function Pill({ children, tone = "muted" }) {
    const t = PILL_TONES[tone] ?? PILL_TONES.muted;
    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: t.bg, color: t.fg }}
        >
            {children}
        </span>
    );
}

const STATUS_TONE = {
    ACTIVE: "success",
    INACTIVE: "muted",
    SUSPENDED: "danger",
    PRESENT: "success",
    LATE: "warning",
    ABSENT: "danger",
    SUBMITTED: "info",
    REVIEWED: "success",
    PENDING: "warning",
};

export function StatusPill({ status }) {
    const key = String(status || "").toUpperCase();
    return <Pill tone={STATUS_TONE[key] ?? "muted"}>{status || "—"}</Pill>;
}

export function MetricBar({ value }) {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    return (
        <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--dashboard-border)" }}
        >
            <div
                className="h-full rounded-full transition-all"
                style={{
                    width: `${pct}%`,
                    backgroundColor: "var(--role-accent)",
                }}
            />
        </div>
    );
}

/**
 * Lightweight daily bar chart for {date, count}[] series. No charting library —
 * pure flex bars honouring the role accent. Used by the analytics, attendance,
 * and assignments oversight pages.
 */
export function MiniBars({ series, height = "h-32" }) {
    const data = Array.isArray(series) ? series : [];
    const max = Math.max(1, ...data.map((d) => Number(d.count) || 0));
    return (
        <div className={`flex items-end gap-1 ${height}`} aria-hidden="true">
            {data.map((d) => {
                const count = Number(d.count) || 0;
                return (
                    <div
                        key={d.date}
                        className="flex-1 rounded-t"
                        title={`${d.date}: ${count}`}
                        style={{
                            height: `${Math.max(2, (count / max) * 100)}%`,
                            backgroundColor:
                                count > 0
                                    ? "var(--role-accent)"
                                    : "var(--dashboard-border)",
                            opacity: count > 0 ? 0.85 : 0.4,
                        }}
                    />
                );
            })}
        </div>
    );
}

/**
 * Range selector (7d / 30d / 90d) used by the analytics and oversight pages.
 */
export function RangePicker({ range, setRange }) {
    const ranges = [
        { key: "7d", label: "7 days" },
        { key: "30d", label: "30 days" },
        { key: "90d", label: "90 days" },
    ];
    return (
        <div className="flex gap-1">
            {ranges.map((r) => (
                <button
                    key={r.key}
                    type="button"
                    onClick={() => setRange(r.key)}
                    className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                    style={{
                        borderColor:
                            range === r.key
                                ? "var(--role-accent)"
                                : "var(--dashboard-border)",
                        color:
                            range === r.key
                                ? "var(--role-accent)"
                                : "var(--dashboard-fg)",
                        cursor: "pointer",
                    }}
                >
                    {r.label}
                </button>
            ))}
        </div>
    );
}

export function Field({ label, children, className = "", hint }) {
    const controlId = useId();
    return (
        <label htmlFor={controlId} className={`block text-sm ${className}`}>
            <span
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </span>
            {cloneElement(children, { id: controlId })}
            {hint && (
                <span
                    className="mt-1 block text-[11px]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {hint}
                </span>
            )}
        </label>
    );
}

export function FormMessage({ error, ok }) {
    if (error) {
        return (
            <p className="text-sm" style={{ color: "rgb(185, 28, 28)" }}>
                {error}
            </p>
        );
    }
    if (ok) {
        return (
            <p className="text-sm" style={{ color: "rgb(5, 150, 105)" }}>
                {ok}
            </p>
        );
    }
    return null;
}

/**
 * Accessible modal dialog. Closes on Escape and overlay click; traps initial
 * focus on the dialog. Used for onboarding forms, batch creation, and
 * confirmation prompts.
 */
export function Modal({ title, description, onClose, children, footer, wide }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape") onClose?.();
        }
        document.addEventListener("keydown", onKeyDown);
        dialogRef.current?.focus();
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <button
                type="button"
                aria-label="Dismiss dialog"
                onClick={onClose}
                className="absolute inset-0 h-full w-full cursor-default border-0"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            />
            <div
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                className={`relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-xl border outline-none ${
                    wide ? "max-w-3xl" : "max-w-lg"
                }`}
                style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                    boxShadow: "var(--dashboard-shadow)",
                }}
            >
                {(title || description) && (
                    <header
                        className="border-b px-6 py-4"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {title && (
                            <h2
                                className="font-display text-lg"
                                style={{ color: "var(--dashboard-fg)" }}
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p
                                className="mt-1 text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {description}
                            </p>
                        )}
                    </header>
                )}
                <div className="px-6 py-5">{children}</div>
                {footer && (
                    <footer
                        className="flex flex-wrap justify-end gap-2 border-t px-6 py-4"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
}

export function ConfirmDialog({
    title,
    message,
    confirmLabel = "Confirm",
    destructive = false,
    busy = false,
    onConfirm,
    onCancel,
}) {
    return (
        <Modal
            title={title}
            onClose={onCancel}
            footer={
                <>
                    <GhostButton onClick={onCancel} disabled={busy}>
                        Cancel
                    </GhostButton>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                            backgroundColor: destructive
                                ? "rgb(220, 38, 38)"
                                : "var(--role-accent)",
                            color: destructive
                                ? "white"
                                : "var(--role-accent-ink)",
                            cursor: "pointer",
                        }}
                    >
                        {busy ? "Working…" : confirmLabel}
                    </button>
                </>
            }
        >
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                {message}
            </p>
        </Modal>
    );
}

/**
 * One-time credential display. Temporary passwords are never persisted in
 * plaintext server-side, so this is the only moment the admin can capture them.
 */
export function CredentialModal({ title, credentials, onClose }) {
    return (
        <Modal
            title={title}
            description="These temporary credentials are shown only once. Share them securely; the student or trainer should reset on first login."
            onClose={onClose}
            footer={<PrimaryButton onClick={onClose}>Done</PrimaryButton>}
        >
            <ul className="space-y-3">
                {credentials.map((c) => (
                    <li
                        key={c.identifier}
                        className="rounded-lg border px-4 py-3"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        <p
                            className="font-display text-sm"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            {c.fullName}
                        </p>
                        <dl className="mt-2 grid gap-1 text-xs">
                            <CredentialRow label="Login" value={c.identifier} />
                            {c.enrollmentNumber != null && (
                                <CredentialRow
                                    label="Enrollment"
                                    value={c.enrollmentNumber}
                                />
                            )}
                            <CredentialRow
                                label="Temp password"
                                value={c.temporaryPassword}
                                mono
                            />
                        </dl>
                    </li>
                ))}
            </ul>
        </Modal>
    );
}

function CredentialRow({ label, value, mono }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt style={{ color: "var(--dashboard-muted)" }}>{label}</dt>
            <dd
                className={mono ? "font-mono" : ""}
                style={{ color: "var(--dashboard-fg)" }}
            >
                {value || "—"}
            </dd>
        </div>
    );
}

// ── CSV helpers (no dependencies) ─────────────────────────────────────────────

export function downloadCSV(filename, headers, rows) {
    const escapeCell = (v) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
        headers.map(escapeCell).join(","),
        ...rows.map((row) => row.map(escapeCell).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Minimal CSV parser supporting quoted fields and escaped quotes. Returns an
 * array of objects keyed by the (lower-cased, trimmed) header row. Sufficient
 * for admin bulk-import sheets exported from Excel/Sheets.
 */
export function parseCSV(text) {
    const rows = [];
    let field = "";
    let row = [];
    let inQuotes = false;
    const pushField = () => {
        row.push(field);
        field = "";
    };
    const pushRow = () => {
        pushField();
        rows.push(row);
        row = [];
    };
    for (let i = 0; i < text.length; i += 1) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ",") {
            pushField();
        } else if (c === "\n") {
            pushRow();
        } else if (c !== "\r") {
            field += c;
        }
    }
    if (field.length > 0 || row.length > 0) pushRow();

    const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
    if (nonEmpty.length === 0) return [];
    const headers = nonEmpty[0].map((h) => h.trim().toLowerCase());
    return nonEmpty.slice(1).map((r) => {
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = (r[idx] ?? "").trim();
        });
        return obj;
    });
}
