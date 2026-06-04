"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { useDashboardTheme } from "@/features/dashboard/context/DashboardThemeContext";
import { ProjectionTag } from "@/features/dashboard/coordinator/coordinatorShared";

/**
 * Coordinator Settings — personal view preferences only.
 *
 * Theme is the one preference with a real persistence layer today (localStorage
 * via DashboardThemeContext) so it is genuinely interactive. Operational rules
 * and notification toggles are named honestly as platform defaults rather than
 * faked with controls that don't save — and none of them touch school data.
 */
export default function CoordinatorSettingsPage() {
    const { themeKey, themes, setThemeKey } = useDashboardTheme();

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Settings"
                title="Your view, your way."
                subtitle="Personal display preferences only — these change how you see TechSeekho, never how your school operates."
                actions={<ProjectionTag label="View settings" />}
            />

            <Panel
                eyebrow="Appearance"
                title="Theme"
                description="Sets your dashboard palette. Saved to this device."
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
                    eyebrow="How your view is governed"
                    title="The rules you operate under"
                    description="Enforced by the platform — shown so you know your boundaries."
                >
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="Read-only by design"
                            hint="You project operational truth; you never write attendance, rosters, or marks"
                        />
                        <SettingRow
                            label="Single-school scope"
                            hint="You can only ever see institutions assigned to your coordinator role — never another campus"
                        />
                        <SettingRow
                            label="Live, not cached"
                            hint="Every page recomputes from raw operational data each time you open it"
                        />
                    </ul>
                </Panel>

                <Panel
                    eyebrow="Notifications"
                    title="Personal preferences"
                    description="When the preferences endpoint ships these become editable. Until then they follow platform defaults."
                >
                    <ul className="space-y-3 text-sm">
                        <SettingRow
                            label="Low-attendance heads-up"
                            hint="When a cohort dips below the 75% target"
                        />
                        <SettingRow
                            label="New-cohort digest"
                            hint="When a batch is added to your school"
                        />
                        <SettingRow
                            label="Review-backlog nudge"
                            hint="When submissions pile up awaiting a trainer"
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
