export default function LoadingSpinner({ label = "Loading" }) {
    return (
        <output
            className="flex items-center gap-3 text-sm"
            style={{ color: "var(--dashboard-muted, var(--theme-muted))" }}
            aria-live="polite"
        >
            <span
                className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
            />
            <span>{label}</span>
        </output>
    );
}
