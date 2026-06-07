"use client";

/**
 * Super Admin command-center page header.
 *
 * The SA-owned successor to the shared PageHeader. It keeps PageHeader's prop
 * surface (eyebrow / title / subtitle|description / status / actions / meta) so
 * migrating a route is a near drop-in swap, but gives Super Admin a distinct
 * operational signature: a left accent spine, sharper corners, and a denser
 * status bar — the "operations console" look, not the editorial hero other
 * roles use.
 *
 * Token-only: every color comes from the dashboard/role CSS variables, so it
 * tracks the theme picker (light / dark / high-contrast) automatically. Role
 * identity is signalled by hierarchy + the accent spine, never by repainting
 * the chrome.
 *
 * Props:
 *   eyebrow     small uppercase kicker (section label)
 *   title       page title (display serif, compact)
 *   subtitle    one-line supporting copy (alias: description)
 *   status      optional { tone: "ok"|"info"|"warning"|"critical", label }
 *   actions     right-aligned action node (buttons / links)
 *   meta        small muted node under the actions (e.g. "Updated …" + refresh)
 */

const STATUS_TONES = {
    ok: {
        fg: "var(--dashboard-success, #047857)",
        bg: "var(--dashboard-success-soft, rgba(16, 185, 129, 0.12))",
    },
    info: {
        fg: "var(--role-accent)",
        bg: "var(--role-accent-soft)",
    },
    warning: {
        fg: "var(--dashboard-warning, #b45309)",
        bg: "var(--dashboard-warning-soft, rgba(245, 158, 11, 0.16))",
    },
    critical: {
        fg: "var(--dashboard-danger, #dc2626)",
        bg: "color-mix(in srgb, var(--dashboard-danger, #dc2626) 12%, transparent)",
    },
};

const SaStatusChip = ({ tone = "ok", label }) => {
    const t = STATUS_TONES[tone] ?? STATUS_TONES.ok;
    return (
        <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: t.bg, color: t.fg }}
        >
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.fg }}
                aria-hidden="true"
            />
            {label}
        </span>
    );
};

const SaPageHeader = ({
    eyebrow,
    title,
    subtitle,
    description,
    status,
    actions = null,
    meta = null,
}) => {
    const supporting = subtitle ?? description;
    return (
        <header
            className="relative overflow-hidden rounded-lg border"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
            }}
        >
            {/* SA command-center signature: left accent spine */}
            <span
                className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
                style={{ backgroundColor: "var(--role-accent)" }}
                aria-hidden="true"
            />
            <div className="flex flex-wrap items-start justify-between gap-4 py-4 pl-6 pr-5 md:pr-6">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                        {eyebrow && (
                            <p
                                className="text-[10px] font-medium uppercase tracking-[0.24em]"
                                style={{ color: "var(--role-accent)" }}
                            >
                                {eyebrow}
                            </p>
                        )}
                        {title && (
                            <h1
                                className="font-display text-lg leading-tight md:text-xl"
                                style={{
                                    color: "var(--dashboard-fg)",
                                    fontWeight: 500,
                                }}
                            >
                                {title}
                            </h1>
                        )}
                        {supporting && (
                            <p
                                className="mt-1 max-w-2xl text-sm leading-relaxed"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {supporting}
                            </p>
                        )}
                    </div>
                    {status && (
                        <SaStatusChip tone={status.tone} label={status.label} />
                    )}
                </div>

                {(actions || meta) && (
                    <div className="flex flex-col items-start gap-2 md:items-end">
                        {actions && (
                            <div className="flex flex-wrap items-center gap-2">
                                {actions}
                            </div>
                        )}
                        {meta && (
                            <div
                                className="text-[11px]"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {meta}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default SaPageHeader;
