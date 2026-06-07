"use client";

/**
 * Shared UI primitives for the SUPER_ADMIN governance pages (Phase 3B).
 *
 * These are intentionally small, design-system-aligned building blocks (CSS
 * variables, not new component libraries) used by the Global User Directory,
 * Admin Management, Trainer Management, and Institution Lifecycle pages.
 *
 * Polish comes later — the brief is "functional first". Keep these primitives
 * minimal and dependency-free.
 */

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

// Lifecycle palette covers both user (ACTIVE/INACTIVE/SUSPENDED/TERMINATED)
// and institution (ACTIVE/SUSPENDED/ARCHIVED/PENDING_APPROVAL) states.
//
// Token-driven, NOT hardcoded: the fg colors pull from the theme-aware
// --dashboard-success/-warning/-danger/-muted + --role-accent tokens that
// themeApplier publishes per theme. The previous static light-mode hex
// (#047857, #475569, …) failed WCAG AA badly on the default dark theme (every
// badge < 3.4:1; ARCHIVED ~1.65:1). Literal fallbacks keep it safe if a token
// is ever missing. INACTIVE/ARCHIVED have no semantic token, so they share the
// neutral --dashboard-muted (both mean "no action required").
const LIFECYCLE_TONES = {
    ACTIVE: {
        bg: "var(--dashboard-success-soft, rgba(16, 185, 129, 0.12))",
        fg: "var(--dashboard-success, #047857)",
    },
    INACTIVE: {
        bg: "color-mix(in srgb, var(--dashboard-muted) 16%, transparent)",
        fg: "var(--dashboard-muted, #475569)",
    },
    SUSPENDED: {
        bg: "var(--dashboard-warning-soft, rgba(245, 158, 11, 0.16))",
        fg: "var(--dashboard-warning, #b45309)",
    },
    TERMINATED: {
        bg: "color-mix(in srgb, var(--dashboard-danger, #dc2626) 14%, transparent)",
        fg: "var(--dashboard-danger, #b91c1c)",
    },
    ARCHIVED: {
        bg: "color-mix(in srgb, var(--dashboard-muted) 18%, transparent)",
        fg: "var(--dashboard-muted, #334155)",
    },
    PENDING_APPROVAL: {
        bg: "var(--role-accent-soft)",
        fg: "var(--role-accent)",
    },
};

export function LifecycleBadge({ status }) {
    const tone = LIFECYCLE_TONES[status] || LIFECYCLE_TONES.INACTIVE;
    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
        >
            {status || "—"}
        </span>
    );
}

// Inline banner for surfacing backend errors (notably 409 conflicts) and
// success/info confirmations. tone: "error" | "info".
export function Banner({ tone = "info", children, onDismiss }) {
    if (!children) return null;
    const isError = tone === "error";
    return (
        <div
            className="flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm"
            style={
                isError
                    ? {
                          borderColor:
                              "color-mix(in srgb, var(--dashboard-danger, #dc2626) 40%, transparent)",
                          backgroundColor:
                              "color-mix(in srgb, var(--dashboard-danger, #dc2626) 12%, transparent)",
                          color: "var(--dashboard-danger, #b91c1c)",
                      }
                    : {
                          borderColor: "var(--dashboard-border)",
                          backgroundColor: "var(--role-accent-soft)",
                          color: "var(--role-accent)",
                      }
            }
        >
            <span className="min-w-0">{children}</span>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                    className="shrink-0 text-xs font-semibold"
                    style={{ cursor: "pointer", color: "inherit" }}
                >
                    ✕
                </button>
            )}
        </div>
    );
}

// Lightweight centered modal shell. The caller owns all content + footer.
export function Modal({ title, description, onClose, children, footer }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop is a real button so click-to-close is keyboard-accessible
                and doesn't require click handlers on non-interactive divs. */}
            <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="absolute inset-0 h-full w-full border-0"
                style={{
                    backgroundColor: "rgba(15, 23, 42, 0.45)",
                    cursor: "default",
                }}
            />
            <div
                role="dialog"
                aria-modal="true"
                className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border shadow-xl"
                style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                }}
            >
                <div
                    className="flex items-start justify-between gap-4 border-b px-6 py-4"
                    style={{ borderColor: "var(--dashboard-border)" }}
                >
                    <div className="min-w-0">
                        <h2
                            className="font-display text-lg"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            {title}
                        </h2>
                        {description && (
                            <p
                                className="mt-1 text-xs"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="shrink-0 text-sm font-semibold"
                        style={{
                            color: "var(--dashboard-muted)",
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>
                <div className="px-6 py-4">{children}</div>
                {footer && (
                    <div
                        className="flex flex-wrap justify-end gap-2 border-t px-6 py-4"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

// Reason textarea — backend audit logging expects a reason on every sensitive
// mutation, so this is a first-class control rather than an afterthought.
export function ReasonField({
    value,
    onChange,
    label = "Reason",
    placeholder = "Why are you taking this action? (recorded in the audit log)",
    required = true,
    rows = 3,
}) {
    return (
        <label className="block text-sm">
            <span
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
                {required ? " *" : ""}
            </span>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                    color: "var(--dashboard-fg)",
                }}
            />
        </label>
    );
}

// Shared primary/secondary button styles so the pages stay consistent without
// pulling in a button component. Returns inline style objects.
export const btnPrimary = {
    backgroundColor: "var(--role-accent)",
    color: "var(--role-accent-ink)",
};

export const btnDanger = {
    borderColor:
        "color-mix(in srgb, var(--dashboard-danger, #dc2626) 40%, transparent)",
    color: "var(--dashboard-danger, #b91c1c)",
};

export const btnNeutral = {
    borderColor: "var(--dashboard-border)",
    color: "var(--dashboard-fg)",
};

// The api() client throws `Error("API error 409: <raw response body>")`, where
// the body is the backend envelope `{ success:false, error:{ code, message } }`.
// Dig out the human-readable message (and code) so governance pages surface
// conflicts like RESPONSIBILITY_TRANSFER_REQUIRED clearly instead of raw JSON.
export function extractErrorMessage(err, fallback = "Something went wrong") {
    const raw = err?.message;
    if (!raw) return fallback;
    const brace = raw.indexOf("{");
    if (brace !== -1) {
        try {
            const parsed = JSON.parse(raw.slice(brace));
            const inner = parsed?.error;
            if (inner?.message) {
                return inner.code
                    ? `${inner.message} (${inner.code})`
                    : inner.message;
            }
        } catch {
            // Not a JSON envelope — fall through to the raw message.
        }
    }
    return raw;
}
