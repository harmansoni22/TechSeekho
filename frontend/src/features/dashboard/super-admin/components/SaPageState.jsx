"use client";

import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

/**
 * Super Admin command-center fetch-lifecycle visuals.
 *
 * SA-owned successors to the shared PageState (PageLoading / PageError /
 * PageEmpty), exported under SA names so the loading / error / empty states on
 * the 15 SA routes share one consistent treatment that matches the command
 * center. Same prop surface as the shared widgets for drop-in migration.
 */

export const SaPageLoading = ({ label = "Loading" }) => (
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

export const SaPageError = ({
    title = "Something went wrong",
    message,
    onRetry,
}) => (
    <div className="flex min-h-[50vh] items-center justify-center">
        <div
            className="relative max-w-md overflow-hidden rounded-lg border px-8 py-10 text-center"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
            }}
        >
            <span
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                style={{ backgroundColor: "var(--dashboard-danger, #dc2626)" }}
                aria-hidden="true"
            />
            <div
                className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold"
                style={{
                    backgroundColor:
                        "color-mix(in srgb, var(--dashboard-danger, #dc2626) 12%, transparent)",
                    color: "var(--dashboard-danger, #dc2626)",
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

export const SaPageEmpty = ({ title, description, action }) => (
    <div
        className="relative overflow-hidden rounded-lg border px-6 py-10 text-center"
        style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
        }}
    >
        <span
            className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
            style={{ backgroundColor: "var(--role-accent)" }}
            aria-hidden="true"
        />
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
