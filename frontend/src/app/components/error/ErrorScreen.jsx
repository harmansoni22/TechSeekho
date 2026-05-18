"use client";

import {
    AlertTriangle,
    Home,
    RefreshCcw,
    SearchX,
    ServerCrash,
    ShieldAlert,
    WifiOff,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const ICONS = {
    error: AlertTriangle,
    global: ServerCrash,
    notFound: SearchX,
    network: WifiOff,
    auth: ShieldAlert,
    empty: SearchX,
};

const COPY = {
    error: {
        kicker: "Something went wrong",
        title: "We hit an unexpected problem.",
        description:
            "The page could not finish loading. Try again, or head back to a stable area.",
    },
    global: {
        kicker: "Application error",
        title: "TechSeekho needs a quick refresh.",
        description:
            "A critical page error interrupted this view. Refreshing usually gets you moving again.",
    },
    notFound: {
        kicker: "Error 404",
        title: "This page is not available.",
        description:
            "The link may be outdated, moved, or mistyped. Return home and continue from there.",
    },
    network: {
        kicker: "Connection problem",
        title: "We could not load this data.",
        description:
            "The server did not respond with the information this page needs.",
    },
    auth: {
        kicker: "Access required",
        title: "Please sign in to continue.",
        description:
            "Your session is missing or expired. Sign in again to reopen this area.",
    },
    empty: {
        kicker: "Nothing to show",
        title: "No data is available yet.",
        description:
            "This section is ready, but there is not enough information to display right now.",
    },
};

export default function ErrorScreen({
    type = "error",
    title,
    description,
    message,
    homeHref = "/",
    homeLabel = "Go home",
    backHref,
    backLabel = "Go back",
    onRetry,
    retryLabel = "Try again",
    showHome = true,
    className,
    dashboard = false,
}) {
    const content = COPY[type] || COPY.error;
    const Icon = ICONS[type] || ICONS.error;
    const resolvedTitle = title || content.title;
    const resolvedDescription = description || content.description;
    const safeMessage = typeof message === "string" ? message : "";

    return (
        <section
            className={cn(
                "flex min-h-[60vh] items-center justify-center px-4 py-10 text-center",
                dashboard && "min-h-[calc(100vh-3rem)]",
                className,
            )}
            style={{
                color: dashboard ? "var(--dashboard-fg)" : "var(--foreground)",
            }}
        >
            <div className="w-full max-w-2xl">
                <div
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border"
                    style={{
                        borderColor: dashboard
                            ? "var(--dashboard-border)"
                            : "rgba(15, 23, 42, 0.14)",
                        background: dashboard
                            ? "color-mix(in srgb, var(--dashboard-surface) 84%, var(--dashboard-primary) 16%)"
                            : "rgba(255, 255, 255, 0.82)",
                        color: dashboard
                            ? "var(--dashboard-primary)"
                            : "#3f5efb",
                    }}
                >
                    <Icon aria-hidden="true" className="h-7 w-7" />
                </div>

                <p
                    className="mt-5 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{
                        color: dashboard
                            ? "var(--dashboard-primary)"
                            : "#3f5efb",
                    }}
                >
                    {content.kicker}
                </p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">
                    {resolvedTitle}
                </h1>
                <p
                    className="mx-auto mt-4 max-w-xl text-sm leading-6 md:text-base"
                    style={{
                        color: dashboard
                            ? "var(--dashboard-muted)"
                            : "var(--theme-muted)",
                    }}
                >
                    {resolvedDescription}
                </p>

                {safeMessage && (
                    <p
                        className="mx-auto mt-5 max-w-xl rounded-lg border px-4 py-3 text-sm"
                        style={{
                            borderColor: dashboard
                                ? "var(--dashboard-border)"
                                : "rgba(15, 23, 42, 0.12)",
                            background: dashboard
                                ? "var(--dashboard-surface)"
                                : "rgba(255, 255, 255, 0.72)",
                            color: dashboard
                                ? "var(--dashboard-muted)"
                                : "#475569",
                        }}
                    >
                        {safeMessage}
                    </p>
                )}

                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition hover:opacity-90"
                            style={{
                                background: dashboard
                                    ? "var(--dashboard-primary)"
                                    : "#3f5efb",
                                color: "#ffffff",
                            }}
                        >
                            <RefreshCcw
                                aria-hidden="true"
                                className="h-4 w-4"
                            />
                            {retryLabel}
                        </button>
                    )}

                    {backHref && (
                        <Link
                            href={backHref}
                            className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-semibold transition hover:opacity-80"
                            style={{
                                borderColor: dashboard
                                    ? "var(--dashboard-border)"
                                    : "rgba(15, 23, 42, 0.16)",
                                background: dashboard
                                    ? "var(--dashboard-surface)"
                                    : "rgba(255, 255, 255, 0.78)",
                                color: dashboard
                                    ? "var(--dashboard-fg)"
                                    : "#0f172a",
                            }}
                        >
                            {backLabel}
                        </Link>
                    )}

                    {showHome && (
                        <Link
                            href={homeHref}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-semibold transition hover:opacity-80"
                            style={{
                                borderColor: dashboard
                                    ? "var(--dashboard-border)"
                                    : "rgba(15, 23, 42, 0.16)",
                                background: dashboard
                                    ? "var(--dashboard-surface)"
                                    : "rgba(255, 255, 255, 0.78)",
                                color: dashboard
                                    ? "var(--dashboard-fg)"
                                    : "#0f172a",
                            }}
                        >
                            <Home aria-hidden="true" className="h-4 w-4" />
                            {homeLabel}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
