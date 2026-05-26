"use client";

import Panel from "./Panel.jsx";

const STATUS_META = {
    PLANNED: { label: "Planned", tone: "muted" },
    IN_DESIGN: { label: "In design", tone: "accent" },
    IN_PROGRESS: { label: "In progress", tone: "primary" },
    AVAILABLE: { label: "Available", tone: "accent" },
};

const toneToStyle = (tone) => {
    if (tone === "primary") {
        return {
            backgroundColor:
                "color-mix(in srgb, var(--dashboard-surface) 70%, var(--dashboard-primary) 30%)",
            color: "var(--dashboard-primary)",
        };
    }
    if (tone === "accent") {
        return {
            backgroundColor: "var(--role-accent-soft, rgba(148,163,184,0.18))",
            color: "var(--role-accent, var(--dashboard-accent))",
        };
    }
    return {
        backgroundColor:
            "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-muted) 20%)",
        color: "var(--dashboard-muted)",
    };
};

/**
 * Reusable "Coming Soon" surface used by feature pages that are intentionally
 * scaffolded ahead of their backend implementation.
 *
 * Renders three sections:
 *   1. Hero — eyebrow chip, title, subtitle, summary paragraph.
 *   2. Roadmap — vertical timeline of milestone items with status pills.
 *   3. Preview — caller-supplied children for page-specific placeholder UI
 *      (e.g. ranking cards on the leaderboard, discussion mockups on community).
 *
 * Status values accepted on roadmap items: PLANNED, IN_DESIGN, IN_PROGRESS,
 * AVAILABLE. Unknown values fall back to PLANNED.
 */
const ComingSoon = ({
    eyebrow = "Coming soon",
    title,
    subtitle,
    summary,
    roadmap = [],
    children,
}) => {
    return (
        <div className="space-y-5">
            <Panel eyebrow={eyebrow} title={title} description={subtitle}>
                {summary && (
                    <p
                        className="max-w-3xl text-sm leading-relaxed"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {summary}
                    </p>
                )}
            </Panel>

            {roadmap.length > 0 && (
                <Panel
                    title="Delivery roadmap"
                    description="What lands first, what comes next"
                >
                    <ol className="space-y-3">
                        {roadmap.map((item, index) => {
                            const meta =
                                STATUS_META[item.status] ?? STATUS_META.PLANNED;
                            const pillStyle = toneToStyle(meta.tone);
                            return (
                                <li
                                    key={item.title}
                                    className="flex gap-4 rounded-lg border p-4"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                    }}
                                >
                                    <span
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                        style={{
                                            backgroundColor:
                                                "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-muted) 20%)",
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4
                                                className="text-sm font-semibold"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {item.title}
                                            </h4>
                                            <span
                                                className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                                                style={pillStyle}
                                            >
                                                {meta.label}
                                            </span>
                                        </div>
                                        {item.description && (
                                            <p
                                                className="mt-1 text-sm"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </Panel>
            )}

            {children}
        </div>
    );
};

export default ComingSoon;
