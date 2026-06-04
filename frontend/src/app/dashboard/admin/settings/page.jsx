"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { useDashboardTheme } from "@/features/dashboard/context/DashboardThemeContext";

/**
 * ADMIN — personal Settings.
 *
 * Theme is the only preference with a real persistence layer today
 * (localStorage via DashboardThemeContext). Operational/notification toggles
 * are surfaced as the platform defaults the admin operates under until a
 * `/me/preferences` endpoint ships — we name them honestly rather than fake a
 * save.
 */
export default function AdminSettingsPage() {
    const { themeKey, themes, setThemeKey } = useDashboardTheme();

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Operations · Settings"
                title="Your admin experience."
                subtitle="Personal preferences only — these affect how you see TechSeekho, not how your institution operates."
            />

            <Panel
                eyebrow="Appearance"
                title="Theme"
                description="Sets the dashboard palette. The admin role accent is layered on top regardless of theme."
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
                    eyebrow="Operational defaults"
                    title="How your campus is governed"
                    description="Enforced by the platform — shown here so you know the rules you operate under."
                >
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="Institution scope"
                            hint="You can only act on institutions assigned to your ADMIN role"
                        />
                        <SettingRow
                            label="Audit logging"
                            hint="Onboarding, status changes, and batch edits are recorded against your identity"
                        />
                        <SettingRow
                            label="Student provisioning"
                            hint="Only admins create student/trainer accounts — trainers cannot"
                        />
                    </ul>
                </Panel>

                <Panel
                    eyebrow="Notifications"
                    title="Personal preferences"
                    description="When the /me/preferences endpoint ships, these become editable. Until then they follow platform defaults."
                >
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="Pending-review alerts"
                            hint="When submissions back up in your batches"
                        />
                        <SettingRow
                            label="Low-attendance alerts"
                            hint="When a batch dips below 75% presence"
                        />
                        <SettingRow
                            label="Onboarding digest"
                            hint="Weekly summary of new students and trainers"
                        />
                    </ul>
                </Panel>
            </section>
        </div>
    );
}

function SettingRow({ label, hint }) {
    return (
        <li className="flex items-start justify-between gap-3">
            <div>
                <p
                    className="text-sm font-medium"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    {label}
                </p>
                <p
                    className="text-[11px]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {hint}
                </p>
            </div>
        </li>
    );
}
