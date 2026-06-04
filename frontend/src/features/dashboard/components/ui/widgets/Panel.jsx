"use client";

/**
 * Editorial card/panel used to group sections within a dashboard page.
 *
 * Renders an optional eyebrow + title + description + right-hand actions
 * slot, the children content, and a subtle role-accent rule. Use this for
 * the major narrative blocks on each role page (Recent Activity,
 * Institution Snapshot, Cohort Heatmap, etc.).
 */
const Panel = ({
    eyebrow,
    title,
    description,
    actions,
    children,
    padded = true,
    className = "",
    style = {},
}) => {
    return (
        <section
            className={`relative scrollbar-none overflow-x-hidden h-full rounded-xl border ${className}`}
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
                ...style,
            }}
        >
            {(eyebrow || title || actions || description) && (
                <header
                    className="flex flex-col gap-3 border-b px-6 py-5 md:flex-row md:items-end md:justify-between"
                    style={{ borderColor: "var(--dashboard-border)" }}
                >
                    <div>
                        {eyebrow && (
                            <p
                                className="text-[10px] uppercase tracking-[0.24em]"
                                style={{ color: "var(--role-accent)" }}
                            >
                                {eyebrow}
                            </p>
                        )}
                        {title && (
                            <h2
                                className="font-display text-xl md:text-2xl"
                                style={{
                                    color: "var(--dashboard-fg)",
                                    fontWeight: 500,
                                }}
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
                    </div>
                    {actions && (
                        <div className="flex flex-wrap gap-2">{actions}</div>
                    )}
                </header>
            )}
            <div className={padded ? "px-6 py-5" : ""}>{children}</div>
        </section>
    );
};

export default Panel;
