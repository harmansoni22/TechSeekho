"use client";

import { useSession } from "next-auth/react";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";
import { useDashboardTheme } from "@/features/dashboard/context/DashboardThemeContext";

const NOTIFICATION_PREFS = [
    {
        key: "announcements",
        label: "Batch announcements",
        description:
            "Email me when my trainer or coordinator posts a new announcement to my batch.",
    },
    {
        key: "assignments",
        label: "Assignment deadlines",
        description: "Remind me one day before an assignment is due.",
    },
    {
        key: "assessments",
        label: "Upcoming assessments",
        description: "Remind me one day before a scheduled assessment.",
    },
];

const StudentSettingsPage = () => {
    const { data: session } = useSession();
    const { themeKey, themes, setThemeKey } = useDashboardTheme();
    const themeEntries = Object.entries(themes ?? {});

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="Settings"
                subtitle="Theme, account, and notification preferences"
            />

            <Panel
                eyebrow="Appearance"
                title="Dashboard theme"
                description="Applies across every dashboard page. Stored locally."
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {themeEntries.map(([key, theme]) => {
                        const isActive = key === themeKey;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setThemeKey(key)}
                                aria-pressed={isActive}
                                aria-label={`Use ${theme.label} theme${isActive ? " (current)" : ""}`}
                                className={`rounded-lg border p-4 text-left transition hover:opacity-95 focus:outline-none focus:ring-2 ${isActive ? "cursor-default" : "cursor-pointer"}`}
                                style={{
                                    borderColor: isActive
                                        ? "var(--dashboard-primary)"
                                        : "var(--dashboard-border)",
                                    backgroundColor: "var(--dashboard-surface)",
                                    boxShadow: isActive
                                        ? "var(--dashboard-shadow)"
                                        : "none",
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-sm font-semibold"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {theme.label}
                                    </span>
                                    <span
                                        className="text-[10px] uppercase tracking-wide"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {theme.mode}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <ThemeSwatch
                                        color={theme.tokens.background}
                                    />
                                    <ThemeSwatch color={theme.tokens.surface} />
                                    <ThemeSwatch color={theme.tokens.primary} />
                                    <ThemeSwatch color={theme.tokens.accent} />
                                </div>
                                {isActive && (
                                    <p
                                        className="mt-3 text-[10px] uppercase tracking-[0.24em]"
                                        style={{
                                            color: "var(--dashboard-primary)",
                                        }}
                                    >
                                        Active
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
            </Panel>

            <Panel
                eyebrow="Account"
                title="Sign-in details"
                description="Read-only — change requests go through your institution admin"
            >
                <dl className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                        label="Full name"
                        value={session?.user?.name || "—"}
                    />
                    <SettingsField
                        label="Email"
                        value={session?.user?.email || "—"}
                    />
                </dl>
            </Panel>

            <Panel
                eyebrow="Notifications"
                title="What we email you about"
                description="Wired UI — delivery is gated on the notification service landing"
            >
                <ul className="space-y-3">
                    {NOTIFICATION_PREFS.map((pref) => (
                        <li
                            key={pref.key}
                            className="flex cursor-not-allowed items-start justify-between gap-4 rounded-lg border p-4 opacity-90"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                            aria-disabled="true"
                            title="Coming soon — notification delivery is not wired yet"
                        >
                            <div>
                                <h4
                                    className="text-sm font-semibold"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {pref.label}
                                </h4>
                                <p
                                    className="mt-1 text-xs"
                                    style={{
                                        color: "var(--dashboard-muted)",
                                    }}
                                >
                                    {pref.description}
                                </p>
                            </div>
                            <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                                style={{
                                    backgroundColor:
                                        "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-muted) 20%)",
                                    color: "var(--dashboard-muted)",
                                }}
                            >
                                Coming soon
                            </span>
                        </li>
                    ))}
                </ul>
            </Panel>

            <Panel
                eyebrow="Privacy"
                title="Your data"
                description="What we keep and what your institution can see"
            >
                <ul
                    className="list-disc space-y-2 pl-5 text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    <li>
                        Your institution admin, coordinator, and assigned
                        trainer can see your attendance, submissions, and
                        assessment scores.
                    </li>
                    <li>
                        Sensitive changes (role reassignments, batch transfers,
                        graded-work re-reviews) are written to an audit log.
                    </li>
                    <li>
                        Theme preference is stored on this device only and is
                        not visible to anyone else.
                    </li>
                </ul>
            </Panel>
        </div>
    );
};

const ThemeSwatch = ({ color }) => (
    <span
        className="inline-block h-5 w-5 rounded-full border"
        style={{
            backgroundColor: color,
            borderColor: "var(--dashboard-border)",
        }}
    />
);

const SettingsField = ({ label, value }) => (
    <div>
        <dt
            className="text-[10px] uppercase tracking-[0.24em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </dt>
        <dd
            className="mt-1 text-base font-medium"
            style={{ color: "var(--dashboard-fg)" }}
        >
            {value}
        </dd>
    </div>
);

export default StudentSettingsPage;
