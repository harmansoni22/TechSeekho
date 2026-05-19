"use client";

import { useEffect, useState } from "react";
import { useRoleTheme } from "@/features/dashboard/context/RoleThemeContext";

/**
 * Editorial page header used at the top of every role dashboard page.
 *
 * Renders: kicker (role label), display-serif title, supporting subtitle,
 * a "live" pulse dot, today's date, and an optional right-hand actions slot.
 * Reads the active role theme from RoleThemeContext so the accent matches.
 */
const RoleHero = ({
    eyebrow,
    title,
    subtitle,
    actions = null,
    showLive = true,
}) => {
    const { theme } = useRoleTheme();
    const [dateLabel, setDateLabel] = useState("");

    useEffect(() => {
        setDateLabel(
            new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }),
        );
    }, []);

    return (
        <header
            className="grain-overlay dash-reveal dash-reveal-1 relative overflow-hidden rounded-2xl border px-6 py-8 md:px-10 md:py-12"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor:
                    "color-mix(in srgb, var(--dashboard-surface) 96%, var(--role-accent) 4%)",
                backgroundImage: "var(--role-glow)",
            }}
        >
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                    <div
                        className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.28em]"
                        style={{ color: "var(--role-accent)" }}
                    >
                        {showLive && (
                            <span
                                className="dash-live-dot relative inline-flex h-1.5 w-1.5 items-center justify-center rounded-full"
                                style={{
                                    backgroundColor: "var(--role-accent)",
                                }}
                                aria-hidden="true"
                            />
                        )}
                        <span>{eyebrow ?? theme?.label}</span>
                    </div>
                    <h1
                        className="font-display text-4xl font-light leading-[1.05] md:text-5xl md:leading-[1.02]"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p
                            className="mt-4 max-w-xl text-base leading-relaxed md:text-[15px]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                    {dateLabel && (
                        <div
                            className="text-xs tracking-wide"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {dateLabel}
                        </div>
                    )}
                    {actions && (
                        <div className="flex flex-wrap gap-2">{actions}</div>
                    )}
                </div>
            </div>

            {/* Decorative corner ornament */}
            <svg
                className="pointer-events-none absolute right-0 top-0 h-44 w-44 opacity-[0.07]"
                viewBox="0 0 200 200"
                aria-hidden="true"
                style={{ color: "var(--role-accent)" }}
            >
                <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                />
                <circle
                    cx="100"
                    cy="100"
                    r="60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                />
                <circle
                    cx="100"
                    cy="100"
                    r="30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                />
                <line
                    x1="0"
                    y1="100"
                    x2="200"
                    y2="100"
                    stroke="currentColor"
                    strokeWidth="0.3"
                />
                <line
                    x1="100"
                    y1="0"
                    x2="100"
                    y2="200"
                    stroke="currentColor"
                    strokeWidth="0.3"
                />
            </svg>
        </header>
    );
};

export default RoleHero;
