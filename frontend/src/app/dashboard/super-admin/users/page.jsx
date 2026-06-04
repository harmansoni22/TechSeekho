"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    fetchUsers,
    setUserStatus,
} from "@/features/dashboard/api/superAdmin.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
    Banner,
    btnDanger,
    btnNeutral,
    btnPrimary,
    extractErrorMessage,
    formatDate,
    LifecycleBadge,
    Modal,
    ReasonField,
} from "@/features/dashboard/super-admin/governanceShared";

/**
 * SUPER_ADMIN — Global User Directory (Phase 3B governance).
 *
 * Cross-institution view of every user and lifecycle state. Backed by
 * `GET /admin/users`. Status changes write through `PATCH /admin/users/:id/status`
 * (suspend / reactivate / deactivate), each requiring an audit reason.
 *
 * Termination is NOT done here — admins and trainers terminate through their
 * dedicated management pages because those flows enforce responsibility
 * transfer / batch reassignment.
 */

const ROLE_FILTERS = [
    { value: "", label: "All roles" },
    { value: "SUPER_ADMIN", label: "Super admins" },
    { value: "ADMIN", label: "Admins" },
    { value: "INSTITUTION_COORDINATOR", label: "Coordinators" },
    { value: "TRAINER", label: "Trainers" },
    { value: "STUDENT", label: "Students" },
];

const STATUS_FILTERS = [
    { value: "", label: "All statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "TERMINATED", label: "Terminated" },
];

const ROLE_LABELS = {
    SUPER_ADMIN: "Super admin",
    ADMIN: "Admin",
    INSTITUTION_COORDINATOR: "Coordinator",
    TRAINER: "Trainer",
    STUDENT: "Student",
};

// Status transitions a super-admin can apply from this directory.
const STATUS_ACTIONS = {
    ACTIVE: [
        { target: "SUSPENDED", label: "Suspend", danger: true },
        { target: "INACTIVE", label: "Deactivate", danger: false },
    ],
    SUSPENDED: [{ target: "ACTIVE", label: "Reactivate", danger: false }],
    INACTIVE: [{ target: "ACTIVE", label: "Reactivate", danger: false }],
    TERMINATED: [],
};

const UsersPage = () => {
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionInfo, setActionInfo] = useState(null);

    // Pending status change awaiting a reason in the modal.
    const [pending, setPending] = useState(null); // { user, target, label }
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchUsers({
                role: roleFilter || undefined,
                status: statusFilter || undefined,
                q: search || undefined,
                limit: 100,
            });
            setData(result);
        } catch (err) {
            setError(extractErrorMessage(err, "Unknown error"));
        } finally {
            setLoading(false);
        }
    }, [roleFilter, statusFilter, search]);

    useEffect(() => {
        load();
    }, [load]);

    function openStatusChange(user, target, label) {
        setActionError(null);
        setActionInfo(null);
        setReason("");
        setPending({ user, target, label });
    }

    async function confirmStatusChange() {
        if (!pending) return;
        if (!reason.trim()) {
            setActionError("A reason is required.");
            return;
        }
        setSubmitting(true);
        setActionError(null);
        try {
            await setUserStatus(pending.user.id, pending.target, reason.trim());
            setActionInfo(
                `${pending.label}d ${pending.user.fullName || "user"}.`,
            );
            setPending(null);
            await load();
        } catch (err) {
            setActionError(extractErrorMessage(err, "Action failed"));
        } finally {
            setSubmitting(false);
        }
    }

    const users = useMemo(() => data?.users ?? [], [data]);
    const total = data?.total ?? users.length;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Governance · Users"
                title="Every account, every state."
                subtitle="The cross-institution directory of all platform users. Suspend, reactivate, or deactivate any account — every change is recorded with your reason in the audit log."
            />

            <Panel
                eyebrow="Filter"
                title="Find people"
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            setRoleFilter("");
                            setStatusFilter("");
                            setSearch("");
                        }}
                        className="rounded-md border px-3 py-1.5 text-xs font-medium"
                        style={{ ...btnNeutral, cursor: "pointer" }}
                    >
                        Clear
                    </button>
                }
            >
                <div className="grid gap-4 sm:grid-cols-3">
                    <SelectField
                        label="Role"
                        value={roleFilter}
                        onChange={setRoleFilter}
                        options={ROLE_FILTERS}
                    />
                    <SelectField
                        label="Status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={STATUS_FILTERS}
                    />
                    <label className="block text-sm">
                        <span
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Name, email or phone
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

            <Banner tone="error" onDismiss={() => setActionError(null)}>
                {!pending && actionError}
            </Banner>
            <Banner tone="info" onDismiss={() => setActionInfo(null)}>
                {actionInfo}
            </Banner>

            {loading ? (
                <PageLoading label="Loading user directory" />
            ) : error ? (
                <PageError
                    title="Could not load users"
                    message={error}
                    onRetry={load}
                />
            ) : users.length === 0 ? (
                <Panel eyebrow="Directory" title="No users match this filter">
                    <PageEmpty title="Empty" />
                </Panel>
            ) : (
                <Panel
                    eyebrow="Directory"
                    title={`${users.length} of ${total}`}
                    description="Each row is one account with its current lifecycle status and active role assignments."
                    padded={false}
                >
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {users.map((u) => (
                            <li key={u.id} className="px-6 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p
                                                className="truncate font-display text-base"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {u.fullName || "Unnamed user"}
                                            </p>
                                            <LifecycleBadge status={u.status} />
                                        </div>
                                        <p
                                            className="mt-0.5 truncate text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {u.email || "—"}
                                            {u.phone ? ` · ${u.phone}` : ""}
                                            {" · "}
                                            <span className="font-mono">
                                                {u.id.slice(0, 8)}
                                            </span>
                                        </p>
                                        <p
                                            className="mt-1 text-[11px]"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            Joined {formatDate(u.createdAt)}
                                            {u.lastLoginAt
                                                ? ` · last seen ${formatDate(u.lastLoginAt)}`
                                                : " · never signed in"}
                                            {u.statusReason
                                                ? ` · note: ${u.statusReason}`
                                                : ""}
                                        </p>
                                        <ul className="mt-2 flex flex-wrap gap-1.5">
                                            {u.roles.length === 0 ? (
                                                <li
                                                    className="text-[11px]"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    No active roles
                                                </li>
                                            ) : (
                                                u.roles.map((r) => (
                                                    <li
                                                        key={r.assignmentId}
                                                        className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px]"
                                                        style={{
                                                            borderColor:
                                                                "var(--dashboard-border)",
                                                            backgroundColor:
                                                                "var(--role-accent-soft)",
                                                        }}
                                                    >
                                                        <span
                                                            className="font-semibold uppercase tracking-wider"
                                                            style={{
                                                                color: "var(--role-accent)",
                                                            }}
                                                        >
                                                            {ROLE_LABELS[
                                                                r.role
                                                            ] ?? r.role}
                                                        </span>
                                                        <span
                                                            style={{
                                                                color: "var(--dashboard-fg)",
                                                            }}
                                                        >
                                                            {r.institutionName ||
                                                                (r.role ===
                                                                "SUPER_ADMIN"
                                                                    ? "Global"
                                                                    : "—")}
                                                        </span>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        {(STATUS_ACTIONS[u.status] ?? []).map(
                                            (a) => (
                                                <button
                                                    key={a.target}
                                                    type="button"
                                                    onClick={() =>
                                                        openStatusChange(
                                                            u,
                                                            a.target,
                                                            a.label,
                                                        )
                                                    }
                                                    className="rounded-md border px-3 py-1.5 text-xs font-medium"
                                                    style={{
                                                        ...(a.danger
                                                            ? btnDanger
                                                            : btnNeutral),
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {a.label}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            {pending && (
                <Modal
                    title={`${pending.label} ${pending.user.fullName || "user"}`}
                    description="This change is recorded in the audit log with your reason."
                    onClose={() => !submitting && setPending(null)}
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setPending(null)}
                                disabled={submitting}
                                className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
                                style={{ ...btnNeutral, cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmStatusChange}
                                disabled={submitting}
                                className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                                style={{ ...btnPrimary, cursor: "pointer" }}
                            >
                                {submitting
                                    ? "Applying…"
                                    : `Confirm ${pending.label.toLowerCase()}`}
                            </button>
                        </>
                    }
                >
                    {actionError && (
                        <div className="mb-3">
                            <Banner tone="error">{actionError}</Banner>
                        </div>
                    )}
                    <ReasonField value={reason} onChange={setReason} />
                </Modal>
            )}
        </div>
    );
};

const SelectField = ({ label, value, onChange, options }) => (
    <label className="block text-sm">
        <span
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </span>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                color: "var(--dashboard-fg)",
                cursor: "pointer",
            }}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </label>
);

export default UsersPage;
