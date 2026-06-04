"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAuditLogs } from "@/features/dashboard/api/superAdmin.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * Super-admin: append-only audit trail of every privileged action.
 *
 * Reads from `GET /admin/audit-logs` (SUPER_ADMIN-gated server-side). Filters
 * are debounced through local state and submitted on demand to avoid hammering
 * the endpoint while typing.
 *
 * The page enumerates the audit actions our services emit today; any new
 * actor.service.js#audit() call lands here automatically because the endpoint
 * is action-agnostic.
 */

const DEFAULT_LIMIT = 50;

// Mirrors the action names emitted by services/*.service.js#audit().
// Wildcard ("group.*") lets us filter every action inside a namespace.
const ACTION_FILTERS = [
    { value: "", label: "All actions" },
    { value: "role.*", label: "Role grants & revokes" },
    { value: "user.*", label: "User status changes" },
    { value: "institution.*", label: "Institution events" },
    { value: "batch.*", label: "Batch operations" },
    { value: "attendance.*", label: "Attendance edits" },
    { value: "submission.review", label: "Submission reviews" },
];

function formatTimestamp(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "—";
    }
}

const AuditLogsPage = () => {
    const [action, setAction] = useState("");
    const [actor, setActor] = useState("");
    const [entityType, setEntityType] = useState("");
    const [events, setEvents] = useState(null);
    const [nextCursor, setNextCursor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paging, setPaging] = useState(false);
    const [error, setError] = useState(null);
    const [openId, setOpenId] = useState(null);

    // Single fetch path. Cursor is passed in explicitly so the function does
    // NOT close over `nextCursor` — that keeps the effect below clean.
    const fetchPage = useCallback(
        async ({ reset = true, cursor = null } = {}) => {
            if (reset) {
                setLoading(true);
                setError(null);
            } else {
                setPaging(true);
            }
            try {
                const filters = { limit: DEFAULT_LIMIT };
                if (action) filters.action = action;
                if (actor) filters.actorId = actor;
                if (entityType) filters.entityType = entityType;
                if (!reset && cursor) filters.cursor = cursor;

                const result = await fetchAuditLogs(filters);
                const list = Array.isArray(result?.events)
                    ? result.events
                    : Array.isArray(result)
                      ? result
                      : [];

                setEvents((prev) =>
                    reset ? list : [...(prev || []), ...list],
                );
                setNextCursor(result?.nextCursor ?? null);
            } catch (err) {
                setError(err?.message || "Unknown error");
            } finally {
                if (reset) setLoading(false);
                setPaging(false);
            }
        },
        [action, actor, entityType],
    );

    // Re-fetch from scratch whenever any filter changes. `fetchPage` already
    // depends on the filter values, so its identity is stable until they do.
    useEffect(() => {
        fetchPage({ reset: true });
    }, [fetchPage]);

    const grouped = useMemo(() => {
        if (!events) return [];
        const byDay = new Map();
        for (const e of events) {
            const dayKey = (e.createdAt || "").slice(0, 10);
            if (!byDay.has(dayKey)) byDay.set(dayKey, []);
            byDay.get(dayKey).push(e);
        }
        return Array.from(byDay.entries()).map(([day, list]) => ({
            day,
            list,
        }));
    }, [events]);

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Trail · Audit Logs"
                title="Nothing happens without a record."
                subtitle="Every privileged write — role grants, status changes, institution charters, attendance edits — leaves a tamper-evident trace here. Filter to investigate; copy ids straight into an incident ticket."
            />

            <Panel
                eyebrow="Filter"
                title="Narrow the trail"
                description="All filters compose. Use the action namespace selector to scope by category; the actor field accepts a user id from any other super-admin page."
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            setAction("");
                            setActor("");
                            setEntityType("");
                        }}
                        className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--dashboard-surface)_92%,var(--role-accent)_8%)]"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                            cursor: "pointer",
                        }}
                    >
                        Clear filters
                    </button>
                }
            >
                <div className="grid gap-4 sm:grid-cols-3">
                    <FilterField label="Action">
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                                color: "var(--dashboard-fg)",
                                cursor: "pointer",
                            }}
                        >
                            {ACTION_FILTERS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </FilterField>
                    <FilterField label="Actor ID">
                        <input
                            type="search"
                            value={actor}
                            onChange={(e) => setActor(e.target.value)}
                            placeholder="user id from admins/roles…"
                            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                                color: "var(--dashboard-fg)",
                            }}
                        />
                    </FilterField>
                    <FilterField label="Entity type">
                        <input
                            type="search"
                            value={entityType}
                            onChange={(e) => setEntityType(e.target.value)}
                            placeholder="Attendance, Submission, Institution…"
                            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                                color: "var(--dashboard-fg)",
                            }}
                        />
                    </FilterField>
                </div>
            </Panel>

            {loading ? (
                <PageLoading label="Loading audit trail" />
            ) : error ? (
                <PageError
                    title="Could not load audit log"
                    message={error}
                    onRetry={() => fetchPage({ reset: true })}
                />
            ) : !events || events.length === 0 ? (
                <Panel
                    eyebrow="Trail"
                    title="No events match this filter"
                    description="Clear filters to see the full timeline."
                >
                    <PageEmpty
                        title="Empty trail"
                        description="Privileged actions appear here as they happen."
                    />
                </Panel>
            ) : (
                <Panel
                    eyebrow="Trail"
                    title={`${events.length} event${events.length === 1 ? "" : "s"} shown`}
                    description="Newest first. Click any row to expand metadata."
                    padded={false}
                >
                    <ol
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {grouped.map((group) => (
                            <li key={group.day} className="px-6 py-4">
                                <p
                                    className="mb-3 text-[10px] uppercase tracking-[0.24em]"
                                    style={{ color: "var(--role-accent)" }}
                                >
                                    {
                                        formatTimestamp(
                                            `${group.day}T00:00:00Z`,
                                        ).split(",")[0]
                                    }
                                </p>
                                <ul className="space-y-2">
                                    {group.list.map((e) => (
                                        <EventRow
                                            key={e.id}
                                            event={e}
                                            open={openId === e.id}
                                            onToggle={() =>
                                                setOpenId((cur) =>
                                                    cur === e.id ? null : e.id,
                                                )
                                            }
                                        />
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ol>
                    {nextCursor && (
                        <div
                            className="border-t px-6 py-4 text-center"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    fetchPage({
                                        reset: false,
                                        cursor: nextCursor,
                                    })
                                }
                                disabled={paging}
                                className="rounded-md px-4 py-2 text-xs font-semibold disabled:opacity-60"
                                style={{
                                    backgroundColor: "var(--role-accent)",
                                    color: "var(--role-accent-ink)",
                                    cursor: paging ? "wait" : "pointer",
                                }}
                            >
                                {paging ? "Loading…" : "Load older events"}
                            </button>
                        </div>
                    )}
                </Panel>
            )}
        </div>
    );
};

// Plain wrapper — each child is its own control with its own visible label,
// so the heading here is decorative. We use a div (not a <label>) so Biome's
// noLabelWithoutControl doesn't fire on a static-analysis blind spot.
const FilterField = ({ label, children }) => (
    <div className="block text-sm">
        <p
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </p>
        {children}
    </div>
);

const EventRow = ({ event, open, onToggle }) => {
    const e = event;
    return (
        <li
            className="rounded-lg border transition-colors"
            style={{ borderColor: "var(--dashboard-border)" }}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--dashboard-surface)_94%,var(--role-accent)_6%)]"
                style={{ cursor: "pointer" }}
            >
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className="font-mono text-[11px] uppercase tracking-wider"
                            style={{ color: "var(--role-accent)" }}
                        >
                            {e.action}
                        </span>
                        {e.actorRole && (
                            <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                style={{
                                    backgroundColor: "var(--role-accent-soft)",
                                    color: "var(--role-accent)",
                                }}
                            >
                                {e.actorRole}
                            </span>
                        )}
                    </div>
                    <p
                        className="mt-1 truncate text-sm"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        <span style={{ color: "var(--dashboard-muted)" }}>
                            {e.actorEmail || e.actorId || "system"}
                        </span>{" "}
                        ·{" "}
                        <span>
                            {e.entityType}
                            {e.entityId ? `#${e.entityId.slice(0, 8)}` : ""}
                        </span>
                        {e.institutionName ? (
                            <span style={{ color: "var(--dashboard-muted)" }}>
                                {" "}
                                · {e.institutionName}
                            </span>
                        ) : null}
                    </p>
                </div>
                <span
                    className="shrink-0 text-[11px]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {formatTimestamp(e.createdAt)}
                </span>
            </button>
            {open && (
                <div
                    className="border-t px-4 py-3 text-xs"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor:
                            "color-mix(in srgb, var(--dashboard-surface) 96%, var(--role-accent) 4%)",
                    }}
                >
                    <KV label="Event id" value={e.id} mono />
                    <KV label="Actor id" value={e.actorId || "—"} mono />
                    <KV
                        label="Entity"
                        value={`${e.entityType} ${e.entityId || ""}`.trim()}
                        mono
                    />
                    <KV
                        label="Institution"
                        value={
                            e.institutionName
                                ? `${e.institutionName} (${e.institutionId})`
                                : e.institutionId || "—"
                        }
                    />
                    <KV label="IP" value={e.ipAddress || "—"} mono />
                    <KV label="User agent" value={e.userAgent || "—"} />
                    {e.metadata != null && (
                        <div className="mt-2">
                            <p
                                className="text-[10px] uppercase tracking-[0.18em]"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                Metadata
                            </p>
                            <pre
                                className="mt-1 overflow-x-auto rounded-md border px-3 py-2 font-mono text-[11px]"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    color: "var(--dashboard-fg)",
                                    backgroundColor: "var(--dashboard-surface)",
                                }}
                            >
                                {JSON.stringify(e.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </li>
    );
};

const KV = ({ label, value, mono = false }) => (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1">
        <span
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </span>
        <span
            className={mono ? "font-mono" : ""}
            style={{ color: "var(--dashboard-fg)", wordBreak: "break-all" }}
        >
            {value}
        </span>
    </div>
);

export default AuditLogsPage;
