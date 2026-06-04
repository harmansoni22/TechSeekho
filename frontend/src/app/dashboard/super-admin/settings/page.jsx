"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { useDashboardTheme } from "@/features/dashboard/context/DashboardThemeContext";

/**
 * SUPER_ADMIN — personal Settings.
 *
 * Personal preferences live here. Platform-wide behaviour belongs on the
 * Platform Configuration page — keep that boundary strict.
 *
 * Theme is the only preference that currently has a real persistence layer
 * (localStorage via DashboardThemeContext). Account-level preferences (digest
 * cadence, device fingerprint notifications, session length) are deferred
 * until a /me/preferences endpoint ships — the panel below names the
 * platform-level defaults so the user has accurate expectations.
 */

const SuperAdminSettingsPage = () => {
    const { themeKey, themes, setThemeKey } = useDashboardTheme();

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Account · Settings"
                title="Personal preferences."
                subtitle="Everything here affects only your view of TechSeekho. To change platform-wide behaviour, use Platform Configuration."
            />

            <Panel
                eyebrow="Appearance"
                title="Theme"
                description="Picks the underlying dashboard palette. The role accent (crimson) is layered on top regardless of theme — that boundary is intentional and lives in features/dashboard/theme/."
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
                    eyebrow="Security defaults"
                    title="What the platform already enforces"
                    description="These values come from the runtime configuration. See Platform Configuration for the live snapshot."
                >
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="Session lifetime"
                            hint="From JWT_EXPIRES_IN (default 7 days)"
                        />
                        <SettingRow
                            label="Session source"
                            hint="Backend-issued JWT carried by NextAuth"
                        />
                        <SettingRow
                            label="Profile refresh throttle"
                            hint="2 minutes between background refreshes"
                        />
                    </ul>
                </Panel>

                <Panel
                    eyebrow="Notifications"
                    title="Personal preferences"
                    description="When the /me/preferences endpoint ships, these toggles become real. Until then your notifications follow the platform-wide defaults."
                >
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="Privileged action alerts"
                            hint="Audit-worthy events emitted to your channel"
                        />
                        <SettingRow
                            label="Incident pages"
                            hint="P1/P2 only — never marketing"
                        />
                        <SettingRow
                            label="Weekly digest"
                            hint="Sundays, 9am IST"
                        />
                    </ul>
                </Panel>
            </section>
        </div>
    );
};

const SettingRow = ({ label, hint }) => (
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

export default SuperAdminSettingsPage;
