"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    fetchAdmins,
    revokeRoleAssignment,
    setUserStatus,
} from "@/features/dashboard/api/superAdmin.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * SUPER_ADMIN — directory of every user holding an elevated role
 * (SUPER_ADMIN / ADMIN / INSTITUTION_COORDINATOR).
 *
 * Backed by `GET /admin/admins` (SUPER_ADMIN-gated server-side). Row actions
 * write through `DELETE /admin/role-assignments/:id` and
 * `PATCH /admin/users/:id/status` — every mutation flows through the audit log.
 *
 * To grant a new role to a user, use the Role Management page; this page is
 * the read + per-row governance surface.
 */

const ROLE_FILTERS = [
    { value: "", label: "All elevated roles" },
    { value: "SUPER_ADMIN", label: "Super admins" },
    { value: "ADMIN", label: "Institution admins" },
    { value: "INSTITUTION_COORDINATOR", label: "Coordinators" },
];

const ROLE_LABELS = {
    SUPER_ADMIN: "Super admin",
    ADMIN: "Admin",
    INSTITUTION_COORDINATOR: "Coordinator",
    TRAINER: "Trainer",
    STUDENT: "Student",
};

function formatDate(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

const AdminsPage = () => {
    const [roleFilter, setRoleFilter] = useState("");
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyKey, setBusyKey] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionInfo, setActionInfo] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchAdmins({
                role: roleFilter || undefined,
                q: search || undefined,
                limit: 100,
            });
            setData(result);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [roleFilter, search]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleRevoke(assignmentId, label) {
        if (busyKey) return;
        const ok = confirm(
            `Revoke ${label}? The user loses this access immediately.`,
        );
        if (!ok) return;
        setBusyKey(`revoke:${assignmentId}`);
        setActionError(null);
        setActionInfo(null);
        try {
            await revokeRoleAssignment(assignmentId);
            setActionInfo(`Revoked ${label}.`);
            await load();
        } catch (err) {
            setActionError(err?.message || "Failed to revoke");
        } finally {
            setBusyKey(null);
        }
    }

    async function handleStatusToggle(userId, currentStatus) {
        if (busyKey) return;
        const target = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        const verb = target === "SUSPENDED" ? "Suspend" : "Reactivate";
        const ok = confirm(`${verb} this user?`);
        if (!ok) return;
        setBusyKey(`status:${userId}`);
        setActionError(null);
        setActionInfo(null);
        try {
            await setUserStatus(userId, target);
            setActionInfo(`${verb}d user.`);
            await load();
        } catch (err) {
            setActionError(err?.message || `Failed to ${verb.toLowerCase()}`);
        } finally {
            setBusyKey(null);
        }
    }

    const admins = useMemo(() => data?.admins ?? [], [data]);
    const totalCount = data?.total ?? admins.length;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="People · Admins"
                title="The people who hold the keys."
                subtitle="Operators with elevated access across the platform. Audit who has what and, when scope changes, revoke before re-granting — every action is recorded."
            />

            <Panel
                eyebrow="Filter"
                title="Refine the roster"
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            setRoleFilter("");
                            setSearch("");
                        }}
                        className="rounded-md border px-3 py-1.5 text-xs font-medium"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                            cursor: "pointer",
                        }}
                    >
                        Clear
                    </button>
                }
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                        <span
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Role
                        </span>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                                color: "var(--dashboard-fg)",
                                cursor: "pointer",
                            }}
                        >
                            {ROLE_FILTERS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block text-sm">
                        <span
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Name or email
                        </span>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="search…"
                            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                                color: "var(--dashboard-fg)",
                            }}
                        />
                    </label>
                </div>
            </Panel>

            {actionError && (
                <p
                    className="rounded-md border px-4 py-3 text-sm"
                    style={{
                        borderColor: "#fecaca",
                        backgroundColor: "rgba(254, 226, 226, 0.6)",
                        color: "#b91c1c",
                    }}
                >
                    {actionError}
                </p>
            )}
            {actionInfo && (
                <p
                    className="rounded-md border px-4 py-3 text-sm"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--role-accent-soft)",
                        color: "var(--role-accent)",
                    }}
                >
                    {actionInfo}
                </p>
            )}

            {loading ? (
                <PageLoading label="Loading admin roster" />
            ) : error ? (
                <PageError
                    title="Could not load admins"
                    message={error}
                    onRetry={load}
                />
            ) : admins.length === 0 ? (
                <Panel
                    eyebrow="Roster"
                    title="No admins match this filter"
                    description="Adjust the filter, or use Role Management to provision the first elevated role."
                >
                    <PageEmpty title="Empty roster" />
                </Panel>
            ) : (
                <Panel
                    eyebrow="Roster"
                    title={`${admins.length} of ${totalCount}`}
                    description="Each row is one user; the chips below the name enumerate every active elevated role assignment for that user."
                    padded={false}
                >
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {admins.map((admin) => (
                            <li key={admin.id} className="px-6 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p
                                                className="truncate font-display text-base"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {admin.fullName ||
                                                    "Unnamed user"}
                                            </p>
                                            <StatusPill status={admin.status} />
                                        </div>
                                        <p
                                            className="mt-0.5 truncate text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {admin.email || "—"}{" "}
                                            {admin.phone
                                                ? `· ${admin.phone}`
                                                : ""}
                                            {" · "}
                                            <span className="font-mono">
                                                {admin.id.slice(0, 8)}
                                            </span>
                                        </p>
                                        <p
                                            className="mt-1 text-[11px]"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            Joined {formatDate(admin.createdAt)}
                                            {admin.lastLoginAt
                                                ? ` · last seen ${formatDate(admin.lastLoginAt)}`
                                                : " · never signed in"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleStatusToggle(
                                                admin.id,
                                                admin.status,
                                            )
                                        }
                                        disabled={
                                            busyKey === `status:${admin.id}`
                                        }
                                        className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
                                        style={{
                                            borderColor:
                                                admin.status === "ACTIVE"
                                                    ? "#fecaca"
                                                    : "var(--dashboard-border)",
                                            color:
                                                admin.status === "ACTIVE"
                                                    ? "#b91c1c"
                                                    : "var(--dashboard-fg)",
                                            cursor:
                                                busyKey === `status:${admin.id}`
                                                    ? "wait"
                                                    : "pointer",
                                        }}
                                    >
                                        {admin.status === "ACTIVE"
                                            ? "Suspend"
                                            : "Reactivate"}
                                    </button>
                                </div>

                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {admin.assignments.map((a) => (
                                        <li
                                            key={a.assignmentId}
                                            className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                                backgroundColor:
                                                    "var(--role-accent-soft)",
                                            }}
                                        >
                                            <span
                                                className="text-[10px] font-semibold uppercase tracking-wider"
                                                style={{
                                                    color: "var(--role-accent)",
                                                }}
                                            >
                                                {ROLE_LABELS[a.role] ?? a.role}
                                            </span>
                                            <span
                                                className="text-xs"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {a.institutionName ||
                                                    (a.role === "SUPER_ADMIN"
                                                        ? "Global"
                                                        : "—")}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRevoke(
                                                        a.assignmentId,
                                                        `${ROLE_LABELS[a.role] ?? a.role}${a.institutionName ? ` at ${a.institutionName}` : ""}`,
                                                    )
                                                }
                                                disabled={
                                                    busyKey ===
                                                    `revoke:${a.assignmentId}`
                                                }
                                                aria-label="Revoke assignment"
                                                className="text-[11px] font-semibold transition-colors disabled:opacity-60"
                                                style={{
                                                    color: "#b91c1c",
                                                    cursor:
                                                        busyKey ===
                                                        `revoke:${a.assignmentId}`
                                                            ? "wait"
                                                            : "pointer",
                                                }}
                                            >
                                                {busyKey ===
                                                `revoke:${a.assignmentId}`
                                                    ? "…"
                                                    : "Revoke"}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </div>
    );
};

const StatusPill = ({ status }) => {
    const map = {
        ACTIVE: { bg: "rgba(16, 185, 129, 0.12)", fg: "#047857" },
        INACTIVE: { bg: "rgba(148, 163, 184, 0.18)", fg: "#475569" },
        SUSPENDED: { bg: "rgba(220, 38, 38, 0.12)", fg: "#b91c1c" },
    };
    const tone = map[status] || map.INACTIVE;
    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
        >
            {status}
        </span>
    );
};

export default AdminsPage;
