"use client";

/**
 * Compact, operational page header for dashboard inner pages.
 *
 * This is the lightweight successor to `RoleHero`. Where RoleHero is a tall
 * editorial banner (4–5xl serif title, grain, decorative ornament, ~8–12rem
 * tall), PageHeader is a dense status bar (~64–88px) that spends vertical
 * space on work, not decoration — matching the Super Admin command-center
 * overview. It is a strict superset of RoleHero's props (`eyebrow`, `title`,
 * `subtitle`, `actions`) so migrating a page is a near drop-in swap.
 *
 * Token-only: every color comes from the dashboard/role CSS variables, so it
 * tracks the theme picker (light / dark / high-contrast) automatically. The
 * role accent appears only on the eyebrow — role identity is signalled by
 * hierarchy and copy, not by repainting the chrome (see ARCHITECTURE.md §15.5
 * and docs/dashboard-redesign/02-DESIGN-LANGUAGE.md §5).
 *
 * Props:
 *   eyebrow     small uppercase kicker (role/section label)
 *   title       page title (display serif, but compact)
 *   subtitle    one-line supporting copy (alias: description)
 *   status      optional { tone: "ok"|"info"|"warning"|"critical", label }
 *   actions     right-aligned action node (buttons / links)
 *   meta        small muted node under the actions (e.g. "Updated …" + refresh)
 */

// Status tones map onto theme tokens (success/warning added in themePresets);
// danger + accent already exist. No bespoke palette — this is reuse.
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

const StatusChip = ({ tone = "ok", label }) => {
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

const PageHeader = ({
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
            className="rounded-xl border"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
            }}
        >
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                        {eyebrow && (
                            <p
                                className="text-[10px] uppercase tracking-[0.22em]"
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
                        <StatusChip tone={status.tone} label={status.label} />
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

export default PageHeader;
