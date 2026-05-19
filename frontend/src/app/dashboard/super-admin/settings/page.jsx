"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { useDashboardTheme } from "@/features/dashboard/context/DashboardThemeContext";

/**
 * SUPER_ADMIN personal settings page.
 *
 * Distinct from /dashboard/super-admin/platform-config — *that* page changes
 * platform-wide behavior, *this* page is personal preferences only.
 *
 * The theme picker writes to localStorage via DashboardThemeContext; it does
 * not need a backend endpoint. The notification/security toggles below are
 * staged for the moment the user-preferences endpoint ships.
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
                description="Picks the underlying dashboard palette. The role accent (crimson) is layered on top regardless of theme."
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(themes).map(([key, t]) => {
                        const active = key === themeKey;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setThemeKey(key)}
                                className="group rounded-xl border p-4 text-left transition-all"
                                style={{
                                    borderColor: active
                                        ? "var(--role-accent)"
                                        : "var(--dashboard-border)",
                                    backgroundColor: "var(--dashboard-surface)",
                                    boxShadow: active
                                        ? "0 8px 26px var(--role-accent-soft)"
                                        : "none",
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
                    eyebrow="Notifications"
                    title="What you want to hear about"
                >
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="Privileged action alerts"
                            hint="Any audit-worthy event"
                        />
                        <SettingRow label="Incident pages" hint="P1/P2 only" />
                        <SettingRow
                            label="Weekly digest"
                            hint="Sundays, 9am IST"
                        />
                    </ul>
                </Panel>

                <Panel eyebrow="Security" title="Your account guardrails">
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="Re-auth window"
                            hint="2 minutes for sensitive writes"
                        />
                        <SettingRow
                            label="Device fingerprint"
                            hint="Notify on new browser/IP"
                        />
                        <SettingRow
                            label="Session length"
                            hint="8 hours, then re-login"
                        />
                    </ul>
                </Panel>
            </section>

            <BackendPending
                whatItDoes="Persist the toggles above to a user-preferences record so they survive devices. Theme already persists locally — these don't."
                endpoints={[
                    {
                        method: "GET",
                        path: "/me/preferences",
                        purpose: "load",
                    },
                    {
                        method: "PATCH",
                        path: "/me/preferences",
                        purpose: "update one key",
                    },
                ]}
                previewSlots={["Toggle", "Toggle", "Toggle"]}
            />
        </div>
    );
};

const SettingRow = ({ label, hint }) => (
    <li className="flex items-center justify-between">
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
        <span
            className="inline-flex h-5 w-9 items-center rounded-full px-0.5"
            style={{
                backgroundColor: "var(--dashboard-border)",
            }}
            aria-hidden="true"
        >
            <span
                className="inline-block h-4 w-4 rounded-full"
                style={{ backgroundColor: "var(--dashboard-surface)" }}
            />
        </span>
    </li>
);

export default SuperAdminSettingsPage;
