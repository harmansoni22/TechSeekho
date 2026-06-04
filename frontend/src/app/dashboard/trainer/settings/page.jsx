"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { useDashboardTheme } from "@/features/dashboard/context/DashboardThemeContext";

/**
 * TRAINER — Settings.
 *
 * Personal preferences only. Theme is the single preference with real
 * persistence today (localStorage via DashboardThemeContext). Notification
 * preferences are documented as platform-wide defaults until a
 * `/me/preferences` endpoint ships — keeping the user honest about what is
 * actually configurable rather than showing dead toggles.
 */
export default function TrainerSettingsPage() {
    const { themeKey, themes, setThemeKey } = useDashboardTheme();

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Account · Settings"
                title="Personal preferences."
                subtitle="What you can change here only affects your own view. To change platform-wide behaviour, escalate to your institution admin."
            />

            <Panel
                eyebrow="Appearance"
                title="Theme"
                description="Pick the underlying dashboard palette. The trainer accent is layered on top regardless of theme."
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(themes).map(([key, t]) => {
                        const active = key === themeKey;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setThemeKey(key)}
                                aria-pressed={active}
                                className="group rounded-xl border p-4 text-left transition-all"
                                style={{
                                    borderColor: active
                                        ? "var(--role-accent)"
                                        : "var(--dashboard-border)",
                                    backgroundColor: "var(--dashboard-surface)",
                                    boxShadow: active
                                        ? "0 8px 26px var(--role-accent-soft)"
                                        : "none",
                                    cursor: "pointer",
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-flex h-5 w-5 rounded-full ring-2"
                                        style={{
                                            backgroundColor: t.tokens.primary,
                                            boxShadow: `0 0 0 2px ${t.tokens.surface}`,
                                        }}
                                    />
                                    <span
                                        className="inline-flex h-5 w-5 rounded-full"
                                        style={{
                                            backgroundColor: t.tokens.accent,
                                        }}
                                    />
                                    <p
                                        className="ml-auto text-[11px] uppercase tracking-[0.18em]"
                                        style={{
                                            color: active
                                                ? "var(--role-accent)"
                                                : "var(--dashboard-muted)",
                                        }}
                                    >
                                        {active ? "Active" : t.mode}
                                    </p>
                                </div>
                                <p
                                    className="mt-3 font-display text-base"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {t.label}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </Panel>

            <section className="grid gap-6 md:grid-cols-2">
                <Panel
                    eyebrow="Defaults"
                    title="Session & security"
                    description="What the platform enforces for every trainer right now."
                >
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="Session lifetime"
                            hint="JWT_EXPIRES_IN (default 7 days)"
                        />
                        <SettingRow
                            label="Session source"
                            hint="Backend-issued JWT carried by NextAuth"
                        />
                        <SettingRow
                            label="Profile refresh"
                            hint="At most every 2 minutes"
                        />
                        <SettingRow
                            label="Operational access"
                            hint="Requires an institution-linked role"
                        />
                    </ul>
                </Panel>

                <Panel
                    eyebrow="Notifications"
                    title="Personal preferences"
                    description="When the /me/preferences endpoint ships these become editable; until then they follow platform defaults."
                >
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="New submission alerts"
                            hint="When a student turns work in"
                        />
                        <SettingRow
                            label="Attendance reminders"
                            hint="Before a class window starts"
                        />
                        <SettingRow
                            label="Weekly batch digest"
                            hint="Saturdays — engagement summary"
                        />
                    </ul>
                </Panel>
            </section>
        </div>
    );
}

const SettingRow = ({ label, hint }) => (
    <li>
        <p
            className="text-sm font-medium"
            style={{ color: "var(--dashboard-fg)" }}
        >
            {label}
        </p>
        <p className="text-[11px]" style={{ color: "var(--dashboard-muted)" }}>
            {hint}
        </p>
    </li>
);
