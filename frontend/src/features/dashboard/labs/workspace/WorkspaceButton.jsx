"use client";

/**
 * Standard workspace toolbar button.
 *
 * `variant="accent"` ⇒ filled with the dashboard accent (Save).
 * `variant="default"` ⇒ outlined surface button (Reset, Load, Console).
 *
 * `icon` is a lucide-react component — we pass the component reference, not
 * an element, so we can size it consistently here. Lucide is scoped to the
 * Skill Labs workspace; the rest of the dashboard uses inline SVGs.
 */
const WorkspaceButton = ({
    icon: Icon,
    children,
    onClick,
    variant = "default",
    ...props
}) => (
    <button
        type="button"
        onClick={onClick}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:opacity-90 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
            borderColor:
                variant === "accent"
                    ? "var(--dashboard-accent)"
                    : "var(--dashboard-border)",
            backgroundColor:
                variant === "accent"
                    ? "var(--dashboard-accent)"
                    : "var(--dashboard-surface)",
            color:
                variant === "accent"
                    ? "var(--dashboard-accent-fg)"
                    : "var(--dashboard-fg)",
        }}
        {...props}
    >
        {Icon ? <Icon size={14} aria-hidden="true" /> : null}
        {children}
    </button>
);

export default WorkspaceButton;
