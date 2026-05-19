"use client";

import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

/**
 * Loading / empty / error visuals used by every dashboard page so the
 * fetch lifecycle looks consistent and the role accent is honored.
 */

export const PageLoading = ({ label = "Loading" }) => (
    <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <LoadingSpinner />
            <p
                className="text-xs uppercase tracking-[0.24em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </p>
        </div>
    </div>
);

export const PageError = ({
    title = "Something went wrong",
    message,
    onRetry,
}) => (
    <div className="flex min-h-[50vh] items-center justify-center">
        <div
            className="max-w-md rounded-2xl border px-8 py-10 text-center"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
            }}
        >
            <div
                className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                    backgroundColor: "var(--role-accent-soft)",
                    color: "var(--role-accent)",
                }}
            >
                !
            </div>
            <h2
                className="font-display text-xl"
                style={{ color: "var(--dashboard-fg)" }}
            >
                {title}
            </h2>
            {message && (
                <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {message}
                </p>
            )}
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-5 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold"
                    style={{
                        backgroundColor: "var(--role-accent)",
                        color: "var(--role-accent-ink)",
                    }}
                >
                    Retry
                </button>
            )}
        </div>
    </div>
);

export const PageEmpty = ({ title, description, action }) => (
    <div
        className="rounded-xl border px-6 py-10 text-center"
        style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
        }}
    >
        <h3
            className="font-display text-lg"
            style={{ color: "var(--dashboard-fg)" }}
        >
            {title}
        </h3>
        {description && (
            <p
                className="mx-auto mt-2 max-w-md text-sm"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {description}
            </p>
        )}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
);
