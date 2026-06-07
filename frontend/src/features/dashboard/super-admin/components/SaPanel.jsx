"use client";

/**
 * Super Admin command-center panel.
 *
 * SA-owned successor to the shared Panel. Same prop surface (eyebrow / title /
 * description / actions / children / padded / className / style) so route
 * migration is a near drop-in swap, but with the SA signature: sharper corners
 * (rounded-lg), a denser header, and an accent tick on the eyebrow so grouped
 * sections read as one operational system distinct from the editorial panels
 * other roles use.
 */
const SaPanel = ({
    eyebrow,
    title,
    description,
    actions,
    children,
    padded = true,
    className = "",
    style = {},
}) => {
    const hasHeader = eyebrow || title || actions || description;
    return (
        <section
            className={`relative scrollbar-none h-full overflow-x-hidden rounded-lg border ${className}`}
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
                ...style,
            }}
        >
            {hasHeader && (
                <header
                    className="flex flex-col gap-3 border-b px-6 py-4 md:flex-row md:items-end md:justify-between"
                    style={{ borderColor: "var(--dashboard-border)" }}
                >
                    <div className="min-w-0">
                        {eyebrow && (
                            <p
                                className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em]"
                                style={{ color: "var(--role-accent)" }}
                            >
                                <span
                                    className="inline-block h-2 w-[2px]"
                                    style={{
                                        backgroundColor: "var(--role-accent)",
                                    }}
                                    aria-hidden="true"
                                />
                                {eyebrow}
                            </p>
                        )}
                        {title && (
                            <h2
                                className="font-display text-lg md:text-xl"
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

export default SaPanel;
