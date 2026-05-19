"use client";

import { useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";
import {
    PageEmpty,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { useAuthedResource } from "@/features/dashboard/hooks/useAuthedResource";

/**
 * Super-admin: immutable audit trail of privileged actions.
 *
 * Backend status: requires AuditLog table + middleware on sensitive mutations.
 * Until then the page falls back to BackendPending. The query parameters are
 * read from local state so we can wire filters before the API exists.
 */

const PAGE_SIZE = 50;

const AuditLogsPage = () => {
    const [actor, setActor] = useState("");
    const [action, setAction] = useState("ALL");

    const query = new URLSearchParams();
    if (actor) query.set("actor", actor);
    if (action && action !== "ALL") query.set("action", action);
    query.set("limit", String(PAGE_SIZE));

    const { data, loading, error, refetch } = useAuthedResource(
        `/admin/audit-logs?${query.toString()}`,
    );

    const events = Array.isArray(data)
        ? data
        : Array.isArray(data?.events)
          ? data.events
          : null;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Trail · Audit Logs"
                title="Nothing happens without a record."
                subtitle="Every privileged write — role grants, config changes, institution charters, suspensions — leaves a tamper-evident trace here."
            />

            {loading ? (
                <PageLoading label="Loading audit trail" />
            ) : error ? (
                <BackendPending
                    whatItDoes="Tail of the audit log with filters by actor, action type, target entity, and date range. Each row expands to show before/after diff for state changes, IP + UA of the actor, and a permalink for incident reports."
                    endpoints={[
                        {
                            method: "GET",
                            path: "/admin/audit-logs?actor=…&action=…",
                            purpose: "list events (paginated, indexed)",
                        },
                        {
                            method: "GET",
                            path: "/admin/audit-logs/:id",
                            purpose: "event detail with diff",
                        },
                    ]}
                    previewSlots={[
                        "Filters",
                        "Event row",
                        "Event row",
                        "Event row",
                    ]}
                    note="Requires AuditLog{id, actorId, action, entityType, entityId, institutionId?, metadata Json, ip, ua, createdAt}, indexed on (actorId, createdAt) and (entityType, entityId)."
                />
            ) : !events || events.length === 0 ? (
                <Panel eyebrow="Trail" title="No events recorded yet.">
                    <PageEmpty
                        title="Audit log is empty"
                        description="Privileged actions will appear here as they happen."
                    />
                </Panel>
            ) : (
                <Panel
                    eyebrow="Trail"
                    title={`${events.length} most recent events`}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="search"
                                value={actor}
                                onChange={(e) => setActor(e.target.value)}
                                placeholder="Filter by actor…"
                                className="rounded-md border px-3 py-1.5 text-xs"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    color: "var(--dashboard-fg)",
                                    backgroundColor: "var(--dashboard-surface)",
                                }}
                            />
                            <select
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                className="rounded-md border px-3 py-1.5 text-xs"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    color: "var(--dashboard-fg)",
                                    backgroundColor: "var(--dashboard-surface)",
                                }}
                            >
                                <option value="ALL">All actions</option>
                                <option value="ROLE_GRANT">Role granted</option>
                                <option value="ROLE_REVOKE">
                                    Role revoked
                                </option>
                                <option value="CONFIG_CHANGE">
                                    Config changed
                                </option>
                                <option value="INSTITUTION_CHARTER">
                                    Institution chartered
                                </option>
                                <option value="USER_SUSPEND">
                                    User suspended
                                </option>
                            </select>
                            <button
                                type="button"
                                onClick={refetch}
                                className="rounded-md px-3 py-1.5 text-xs font-semibold"
                                style={{
                                    backgroundColor: "var(--role-accent)",
                                    color: "var(--role-accent-ink)",
                                }}
                            >
                                Refresh
                            </button>
                        </div>
                    }
                >
                    <ol className="space-y-3">
                        {events.map((e, idx) => (
                            <li
                                key={e.id ?? idx}
                                className="rounded-lg border px-4 py-3"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p
                                        className="font-mono text-xs uppercase tracking-wider"
                                        style={{ color: "var(--role-accent)" }}
                                    >
                                        {e.action || "—"}
                                    </p>
                                    <span
                                        className="text-[11px]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {e.createdAt || ""}
                                    </span>
                                </div>
                                <p
                                    className="mt-1 text-sm"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    <span
                                        style={{ color: "var(--role-accent)" }}
                                    >
                                        {e.actorEmail || e.actorId || "system"}
                                    </span>{" "}
                                    →{" "}
                                    <span
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {e.entityType
                                            ? `${e.entityType}#${e.entityId}`
                                            : "—"}
                                    </span>
                                </p>
                            </li>
                        ))}
                    </ol>
                </Panel>
            )}
        </div>
    );
};

export default AuditLogsPage;
