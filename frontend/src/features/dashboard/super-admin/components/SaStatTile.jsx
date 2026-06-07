"use client";

/**
 * Super Admin command-center KPI tile.
 *
 * SA-owned successor to the shared StatTile. Same prop surface (label / value /
 * delta / deltaDir / footnote / hint) for drop-in migration, but with the SA
 * signature: a persistent left accent rule (not a hover reveal), tabular
 * numerals so figures align in a metrics row, and tighter density — reading as
 * an operations readout rather than an editorial KPI card.
 *
 * Numeric `value` is rendered via Intl.NumberFormat — pass strings to preserve
 * custom formatting (e.g. "₹4.2L").
 */
const ArrowUp = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M7 14l5-5 5 5" />
    </svg>
);

const ArrowDown = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M7 10l5 5 5-5" />
    </svg>
);

const SaStatTile = ({ label, value, delta, deltaDir = "up", footnote, hint }) => {
    const displayValue =
        typeof value === "number"
            ? new Intl.NumberFormat().format(value)
            : (value ?? "—");

    // Up = success-green (not --role-accent: accent is neutral gray in some
    // themes, which reads as "flat" not "positive"). Down = danger, flat = muted.
    const deltaColor =
        deltaDir === "down"
            ? "var(--dashboard-danger, #dc2626)"
            : deltaDir === "flat"
              ? "var(--dashboard-muted)"
              : "var(--dashboard-success, #047857)";

    return (
        <div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-lg border pl-5 pr-4 py-4"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
            }}
        >
            {/* SA signature: persistent left accent rule */}
            <span
                className="pointer-events-none absolute inset-y-3 left-0 w-[2px] rounded-full"
                style={{ backgroundColor: "var(--role-accent)" }}
                aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-3">
                <p
                    className="text-[11px] uppercase tracking-[0.18em]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {label}
                </p>
                {hint && (
                    <span
                        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                        style={{
                            backgroundColor: "var(--role-accent-soft)",
                            color: "var(--role-accent)",
                        }}
                    >
                        {hint}
                    </span>
                )}
            </div>

            <div className="mt-3 flex items-baseline gap-2">
                <p
                    className="font-display text-[2.25rem] leading-none tracking-tight"
                    style={{
                        color: "var(--dashboard-fg)",
                        fontWeight: 400,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {displayValue}
                </p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                {delta != null && (
                    <span
                        className="inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: deltaColor }}
                    >
                        {deltaDir === "up" && <ArrowUp />}
                        {deltaDir === "down" && <ArrowDown />}
                        {delta}
                    </span>
                )}
                {footnote && (
                    <span
                        className="text-xs"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {footnote}
                    </span>
                )}
            </div>
        </div>
    );
};

export default SaStatTile;
