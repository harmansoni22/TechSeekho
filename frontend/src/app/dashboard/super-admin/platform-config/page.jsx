"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * Super-admin: platform-wide configuration.
 *
 * Today these values live in environment variables. A future PlatformSetting
 * table + admin-only mutation API would let us tune flags/limits without a
 * redeploy. This page is the design target for that work.
 */
const PlatformConfigPage = () => {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="System · Platform Configuration"
                title="The dials you reach for once a quarter."
                subtitle="Feature flags, rate limits, default policies. Treat changes here as deployments — they affect every institution simultaneously."
            />

            <section className="grid gap-6 lg:grid-cols-3">
                <Panel eyebrow="Flags" title="Feature gates">
                    <ul className="space-y-3 text-sm">
                        <ConfigRow
                            name="AI study companion"
                            value="Beta"
                            hint="Students only"
                            disabled
                        />
                        <ConfigRow
                            name="Mentor matching"
                            value="Enabled"
                            disabled
                        />
                        <ConfigRow
                            name="Public leaderboard"
                            value="Cohort-only"
                            disabled
                        />
                    </ul>
                </Panel>

                <Panel eyebrow="Limits" title="Rate & quota">
                    <ul className="space-y-3 text-sm">
                        <ConfigRow
                            name="API calls / min"
                            value="600"
                            hint="per token"
                            disabled
                        />
                        <ConfigRow
                            name="File upload size"
                            value="25 MB"
                            disabled
                        />
                        <ConfigRow
                            name="Concurrent sessions"
                            value="3"
                            hint="per user"
                            disabled
                        />
                    </ul>
                </Panel>

                <Panel eyebrow="Defaults" title="New institution policy">
                    <ul className="space-y-3 text-sm">
                        <ConfigRow
                            name="Onboarding period"
                            value="14 days"
                            disabled
                        />
                        <ConfigRow
                            name="Default theme"
                            value="Light"
                            disabled
                        />
                        <ConfigRow
                            name="Auto-archive batches"
                            value="90 days idle"
                            disabled
                        />
                    </ul>
                </Panel>
            </section>

            <BackendPending
                whatItDoes="Toggle a feature flag, set a rate limit, change a default policy. Each change is reviewed (two-person rule), versioned, and surfaced in the audit trail. Until the backend ships, the rows above are read-only and reflect environment defaults."
                endpoints={[
                    {
                        method: "GET",
                        path: "/admin/platform-config",
                        purpose: "current values",
                    },
                    {
                        method: "PATCH",
                        path: "/admin/platform-config/:key",
                        purpose: "propose change",
                    },
                    {
                        method: "POST",
                        path: "/admin/platform-config/:key/approve",
                        purpose: "approve change (different user)",
                    },
                ]}
                previewSlots={[
                    "Approval queue",
                    "Pending change",
                    "Recent history",
                ]}
                note="Two-person rule: the user proposing a change cannot approve it. Both events go to the audit log."
            />
        </div>
    );
};

const ConfigRow = ({ name, value, hint, disabled }) => (
    <li className="flex items-center justify-between gap-3">
        <div>
            <p
                className="text-sm font-medium"
                style={{ color: "var(--dashboard-fg)" }}
            >
                {name}
            </p>
            {hint && (
                <p
                    className="text-[11px]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {hint}
                </p>
            )}
        </div>
        <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{
                backgroundColor: disabled
                    ? "var(--dashboard-border)"
                    : "var(--role-accent-soft)",
                color: disabled
                    ? "var(--dashboard-muted)"
                    : "var(--role-accent)",
            }}
        >
            {value}
        </span>
    </li>
);

export default PlatformConfigPage;
