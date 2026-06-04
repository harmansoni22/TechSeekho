"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPlatformConfig } from "@/features/dashboard/api/superAdmin.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * SUPER_ADMIN — Platform Configuration.
 *
 * Reads from `GET /admin/platform/config`. Today the backend exposes the
 * authoritative operational settings (rate limits, AI provider, audit log
 * state, etc.) as a read-only snapshot derived from `config/env.js`. This
 * is intentional: persistent platform-config with a two-person mutation
 * rule is a separate migration. Until then this page is the trustworthy
 * "what is the platform currently running with?" view.
 *
 * The page renders the snapshot directly — no fake toggles, no aspirational
 * controls. When the persistent settings model lands, the same panel layout
 * accommodates editable rows via the existing `state` field.
 */

const STATE_TONE = {
    on: { bg: "rgba(16, 185, 129, 0.12)", fg: "#047857", label: "On" },
    off: { bg: "rgba(148, 163, 184, 0.18)", fg: "#475569", label: "Off" },
    warn: { bg: "rgba(217, 119, 6, 0.16)", fg: "#92400e", label: "Watch" },
};

const PlatformConfigPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchPlatformConfig();
            setData(result);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="System · Platform Configuration"
                title="The dials TechSeekho is running on."
                subtitle="A live read-out of the platform's operational settings. These values are derived from the server environment — any drift between this page and reality is a deployment problem, not a UI problem."
            />

            {loading ? (
                <PageLoading label="Loading platform configuration" />
            ) : error ? (
                <PageError
                    title="Could not load platform configuration"
                    message={error}
                    onRetry={load}
                />
            ) : !data ? null : (
                <>
                    <section className="grid gap-6 lg:grid-cols-2">
                        {(data.groups ?? []).map((group) => (
                            <Panel
                                key={group.key}
                                eyebrow={group.key.toUpperCase()}
                                title={group.title}
                            >
                                <ul
                                    className="divide-y"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    {group.items.map((item) => (
                                        <li
                                            key={item.name}
                                            className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div className="min-w-0">
                                                <p
                                                    className="text-sm font-medium"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {item.name}
                                                </p>
                                                {item.hint && (
                                                    <p
                                                        className="text-[11px]"
                                                        style={{
                                                            color: "var(--dashboard-muted)",
                                                        }}
                                                    >
                                                        {item.hint}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className="break-all text-xs"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {item.value}
                                                </span>
                                                {item.state && (
                                                    <span
                                                        className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                                        style={{
                                                            backgroundColor:
                                                                STATE_TONE[
                                                                    item.state
                                                                ]?.bg,
                                                            color: STATE_TONE[
                                                                item.state
                                                            ]?.fg,
                                                        }}
                                                    >
                                                        {STATE_TONE[item.state]
                                                            ?.label ??
                                                            item.state}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Panel>
                        ))}
                    </section>

                    <Panel
                        eyebrow="Operating note"
                        title="Why this is read-only"
                        description="A future migration introduces a PlatformSetting table and a two-person mutation rule (proposer ≠ approver). Until then changes are made by redeploy. Treat any divergence between this snapshot and production behavior as an incident."
                    >
                        <ul
                            className="ml-4 list-disc space-y-1.5 text-sm"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            <li>
                                Rate limits and CORS origins are immutable for
                                the runtime; changes require a re-deploy.
                            </li>
                            <li>
                                AI provider/model fall back automatically when
                                an inference provider rejects the request — the
                                primary candidate is the value above.
                            </li>
                            <li>
                                "Trusted upload hosts" is the SSRF allowlist
                                applied at the `fileUrl` validation step. An
                                empty list disables uploads outright.
                            </li>
                            <li>
                                Generated{" "}
                                {data.generatedAt
                                    ? new Date(
                                          data.generatedAt,
                                      ).toLocaleString()
                                    : "—"}
                            </li>
                        </ul>
                    </Panel>
                </>
            )}
        </div>
    );
};

export default PlatformConfigPage;
