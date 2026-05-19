"use client";

/**
 * Editorial KPI tile.
 *
 * Renders a label, large numeric value (display serif), a contextual delta
 * with directional treatment, and an optional footnote. Designed to be
 * dropped into the role hero band without needing per-role styling.
 *
 * Numeric `value` is rendered via Intl.NumberFormat — pass strings if you
 * need to preserve formatting (e.g. "₹4.2L").
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

const StatTile = ({
    label,
    value,
    delta,
    deltaDir = "up", // "up" | "down" | "flat"
    footnote,
    hint,
}) => {
    const displayValue =
        typeof value === "number"
            ? new Intl.NumberFormat().format(value)
            : (value ?? "—");

    const deltaColor =
        deltaDir === "down"
            ? "var(--dashboard-danger, #dc2626)"
            : deltaDir === "flat"
              ? "var(--dashboard-muted)"
              : "var(--role-accent)";

    return (
        <div
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border px-5 py-5 transition-all hover:-translate-y-[2px]"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
            }}
        >
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
                    style={{ color: "var(--dashboard-fg)", fontWeight: 400 }}
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

            {/* Decorative bottom rule that reveals on hover */}
            <span
                className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                style={{ backgroundColor: "var(--role-accent)" }}
            />
        </div>
    );
};

export default StatTile;
