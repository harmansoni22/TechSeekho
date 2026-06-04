"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createAdmin,
    fetchUsers,
    setUserStatus,
    terminateAdmin,
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
 * SUPER_ADMIN — Admin Management (Phase 3B governance).
 *
 * Provisions institution ADMINs, toggles their lifecycle status, and runs the
 * termination-with-responsibility-transfer workflow.
 *
 * Backend contract:
 *   GET  /admin/users?role=ADMIN              → directory (roles[] = governed institutions)
 *   POST /admin/admins                        → provision; returns one-time credentials
 *   PATCH /admin/users/:id/status             → suspend / reactivate
 *   POST /admin/admins/:userId/terminate      → terminate; requires transfer for any
 *                                               institution this admin solely governs
 *                                               (409 RESPONSIBILITY_TRANSFER_REQUIRED)
 *
 * "No orphan institutions" is enforced server-side; this UI lets the operator
 * choose a transfer target per governed institution and surfaces the 409 when a
 * required transfer is missing.
 */

const EMPTY_CREATE = {
    fullName: "",
    email: "",
    phone: "",
    institutionId: "",
    designation: "",
    reason: "",
};

const AdminManagementPage = () => {
    const { data: session } = useSession();
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionInfo, setActionInfo] = useState(null);

    // Institution options for the create form.
    const [institutions, setInstitutions] = useState([]);

    // Create-admin form.
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState(EMPTY_CREATE);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [newCredentials, setNewCredentials] = useState(null);

    // Status-change modal.
    const [pendingStatus, setPendingStatus] = useState(null); // { user, target, label }
    const [statusReason, setStatusReason] = useState("");

    // Terminate modal.
    const [terminating, setTerminating] = useState(null); // { user, institutions: [{id,name}] }
    const [termReason, setTermReason] = useState("");
    const [transfers, setTransfers] = useState({}); // institutionId -> toUserId
    const [candidates, setCandidates] = useState([]);
    const [modalBusy, setModalBusy] = useState(false);
    const [modalError, setModalError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchUsers({
                role: "ADMIN",
                q: search || undefined,
                limit: 100,
            });
            setData(result);
        } catch (err) {
            setError(extractErrorMessage(err, "Unknown error"));
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        load();
    }, [load]);

    // Institutions for the create form (via the existing proxy route).
    const loadInstitutions = useCallback(async () => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch("/api/admin/institutions", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) return;
            const body = await res.json();
            const list = Array.isArray(body) ? body : body.data || [];
            setInstitutions(
                list.filter((i) => (i.status ?? "ACTIVE") !== "ARCHIVED"),
            );
        } catch {
            // Non-fatal: the create form just won't have institution options.
        }
    }, [session?.accessToken]);

    useEffect(() => {
        loadInstitutions();
    }, [loadInstitutions]);

    const admins = useMemo(() => data?.users ?? [], [data]);
    const total = data?.total ?? admins.length;

    function governedInstitutions(user) {
        const map = new Map();
        for (const r of user.roles || []) {
            if (r.role === "ADMIN" && r.institutionId) {
                map.set(r.institutionId, {
                    id: r.institutionId,
                    name: r.institutionName || r.institutionId,
                });
            }
        }
        return [...map.values()];
    }

    async function handleCreate(e) {
        e.preventDefault();
        setCreating(true);
        setCreateError(null);
        setNewCredentials(null);
        try {
            const payload = {
                fullName: createForm.fullName.trim(),
                institutionId: createForm.institutionId,
                email: createForm.email.trim() || undefined,
                phone: createForm.phone.trim() || undefined,
                designation: createForm.designation.trim() || undefined,
                reason: createForm.reason.trim() || undefined,
            };
            const result = await createAdmin(payload);
            setNewCredentials(result.credentials);
            setActionInfo(
                `Provisioned admin ${result.user.fullName} at ${result.user.institutionName}.`,
            );
            setCreateForm(EMPTY_CREATE);
            setShowCreate(false);
            await load();
        } catch (err) {
            setCreateError(extractErrorMessage(err, "Failed to create admin"));
        } finally {
            setCreating(false);
        }
    }

    function openStatus(user, target, label) {
        setActionError(null);
        setActionInfo(null);
        setStatusReason("");
        setModalError(null);
        setPendingStatus({ user, target, label });
    }

    async function confirmStatus() {
        if (!pendingStatus) return;
        if (!statusReason.trim()) {
            setModalError("A reason is required.");
            return;
        }
        setModalBusy(true);
        setModalError(null);
        try {
            await setUserStatus(
                pendingStatus.user.id,
                pendingStatus.target,
                statusReason.trim(),
            );
            setActionInfo(
                `${pendingStatus.label}d ${pendingStatus.user.fullName || "admin"}.`,
            );
            setPendingStatus(null);
            await load();
        } catch (err) {
            setModalError(extractErrorMessage(err, "Action failed"));
        } finally {
            setModalBusy(false);
        }
    }

    async function openTerminate(user) {
        setActionError(null);
        setActionInfo(null);
        setTermReason("");
        setTransfers({});
        setModalError(null);
        setTerminating({ user, institutions: governedInstitutions(user) });
        // Candidate transfer targets: active users other than the one being terminated.
        try {
            const result = await fetchUsers({ status: "ACTIVE", limit: 200 });
            setCandidates((result.users ?? []).filter((u) => u.id !== user.id));
        } catch {
            setCandidates([]);
        }
    }

    async function confirmTerminate() {
        if (!terminating) return;
        if (!termReason.trim()) {
            setModalError("A reason is required.");
            return;
        }
        const transferList = Object.entries(transfers)
            .filter(([, toUserId]) => toUserId)
            .map(([institutionId, toUserId]) => ({ institutionId, toUserId }));
        setModalBusy(true);
        setModalError(null);
        try {
            await terminateAdmin(
                terminating.user.id,
                termReason.trim(),
                transferList,
            );
            setActionInfo(
                `Terminated ${terminating.user.fullName || "admin"}.`,
            );
            setTerminating(null);
            await load();
        } catch (err) {
            setModalError(extractErrorMessage(err, "Termination failed"));
        } finally {
            setModalBusy(false);
        }
    }

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Governance · Admins"
                title="Provision and retire institution admins."
                subtitle="Create campus administrators, manage their lifecycle, and terminate with mandatory responsibility transfer so no institution is ever left without an owner."
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            setShowCreate((v) => !v);
                            setCreateError(null);
                        }}
                        className="rounded-md px-3 py-2 text-xs font-semibold"
                        style={{ ...btnPrimary, cursor: "pointer" }}
                    >
                        {showCreate ? "Close" : "New admin"}
                    </button>
                }
            />

            {newCredentials && (
                <Banner tone="info" onDismiss={() => setNewCredentials(null)}>
                    One-time credentials — copy now, they won't be shown again:{" "}
                    <span className="font-mono font-semibold">
                        {newCredentials.identifier}
                    </span>{" "}
                    /{" "}
                    <span className="font-mono font-semibold">
                        {newCredentials.temporaryPassword}
                    </span>
                </Banner>
            )}

            {showCreate && (
                <Panel
                    eyebrow="Provision"
                    title="Create an institution admin"
                    description="Either email or phone is required. A temporary password is generated and shown once."
                >
                    <form
                        onSubmit={handleCreate}
                        className="grid gap-4 sm:grid-cols-2"
                    >
                        <TextField
                            label="Full name *"
                            value={createForm.fullName}
                            onChange={(v) =>
                                setCreateForm((f) => ({ ...f, fullName: v }))
                            }
                            required
                        />
                        <label className="block text-sm">
                            <span
                                className="text-[11px] uppercase tracking-[0.18em]"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                Institution *
                            </span>
                            <select
                                value={createForm.institutionId}
                                onChange={(e) =>
                                    setCreateForm((f) => ({
                                        ...f,
                                        institutionId: e.target.value,
                                    }))
                                }
                                required
                                className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor: "var(--dashboard-surface)",
                                    color: "var(--dashboard-fg)",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="">Select an institution…</option>
                                {institutions.map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <TextField
                            label="Email"
                            type="email"
                            value={createForm.email}
                            onChange={(v) =>
                                setCreateForm((f) => ({ ...f, email: v }))
                            }
                        />
                        <TextField
                            label="Phone"
                            value={createForm.phone}
                            onChange={(v) =>
                                setCreateForm((f) => ({ ...f, phone: v }))
                            }
                        />
                        <TextField
                            label="Designation"
                            value={createForm.designation}
                            onChange={(v) =>
                                setCreateForm((f) => ({ ...f, designation: v }))
                            }
                        />
                        <TextField
                            label="Reason (audit)"
                            value={createForm.reason}
                            onChange={(v) =>
                                setCreateForm((f) => ({ ...f, reason: v }))
                            }
                        />
                        {createError && (
                            <div className="sm:col-span-2">
                                <Banner tone="error">{createError}</Banner>
                            </div>
                        )}
                        <div className="flex gap-2 sm:col-span-2">
                            <button
                                type="submit"
                                disabled={creating}
                                className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                                style={{ ...btnPrimary, cursor: "pointer" }}
                            >
                                {creating ? "Creating…" : "Create admin"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreate(false);
                                    setCreateForm(EMPTY_CREATE);
                                    setCreateError(null);
                                }}
                                className="rounded-md border px-4 py-2 text-sm font-medium"
                                style={{ ...btnNeutral, cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Panel>
            )}

            <Panel
                eyebrow="Filter"
                title="Find admins"
                actions={
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email…"
                        className="rounded-md border px-3 py-1.5 text-xs"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                            backgroundColor: "var(--dashboard-surface)",
                        }}
                    />
                }
            >
                <p
                    className="text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {total} admin{total === 1 ? "" : "s"} across the platform.
                </p>
            </Panel>

            <Banner tone="error" onDismiss={() => setActionError(null)}>
                {actionError}
            </Banner>
            <Banner tone="info" onDismiss={() => setActionInfo(null)}>
                {actionInfo}
            </Banner>

            {loading ? (
                <PageLoading label="Loading admins" />
            ) : error ? (
                <PageError
                    title="Could not load admins"
                    message={error}
                    onRetry={load}
                />
            ) : admins.length === 0 ? (
                <Panel eyebrow="Admins" title="No admins match this filter">
                    <PageEmpty title="Empty" />
                </Panel>
            ) : (
                <Panel
                    eyebrow="Admins"
                    title={`${admins.length} of ${total}`}
                    padded={false}
                >
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {admins.map((u) => {
                            const govs = governedInstitutions(u);
                            const isTerminated = u.status === "TERMINATED";
                            return (
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
                                                    {u.fullName ||
                                                        "Unnamed admin"}
                                                </p>
                                                <LifecycleBadge
                                                    status={u.status}
                                                />
                                            </div>
                                            <p
                                                className="mt-0.5 truncate text-xs"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {u.email || "—"}
                                                {u.phone ? ` · ${u.phone}` : ""}{" "}
                                                · joined{" "}
                                                {formatDate(u.createdAt)}
                                            </p>
                                            <ul className="mt-2 flex flex-wrap gap-1.5">
                                                {govs.length === 0 ? (
                                                    <li
                                                        className="text-[11px]"
                                                        style={{
                                                            color: "var(--dashboard-muted)",
                                                        }}
                                                    >
                                                        Governs no institution
                                                    </li>
                                                ) : (
                                                    govs.map((g) => (
                                                        <li
                                                            key={g.id}
                                                            className="inline-flex items-center rounded-md border px-2 py-1 text-[11px]"
                                                            style={{
                                                                borderColor:
                                                                    "var(--dashboard-border)",
                                                                backgroundColor:
                                                                    "var(--role-accent-soft)",
                                                                color: "var(--dashboard-fg)",
                                                            }}
                                                        >
                                                            {g.name}
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </div>
                                        {!isTerminated && (
                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                {u.status === "ACTIVE" ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openStatus(
                                                                u,
                                                                "SUSPENDED",
                                                                "Suspend",
                                                            )
                                                        }
                                                        className="rounded-md border px-3 py-1.5 text-xs font-medium"
                                                        style={{
                                                            ...btnNeutral,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openStatus(
                                                                u,
                                                                "ACTIVE",
                                                                "Reactivate",
                                                            )
                                                        }
                                                        className="rounded-md border px-3 py-1.5 text-xs font-medium"
                                                        style={{
                                                            ...btnNeutral,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Reactivate
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openTerminate(u)
                                                    }
                                                    className="rounded-md border px-3 py-1.5 text-xs font-medium"
                                                    style={{
                                                        ...btnDanger,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Terminate
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Panel>
            )}

            {pendingStatus && (
                <Modal
                    title={`${pendingStatus.label} ${pendingStatus.user.fullName || "admin"}`}
                    description="Recorded in the audit log with your reason."
                    onClose={() => !modalBusy && setPendingStatus(null)}
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setPendingStatus(null)}
                                disabled={modalBusy}
                                className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
                                style={{ ...btnNeutral, cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmStatus}
                                disabled={modalBusy}
                                className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                                style={{ ...btnPrimary, cursor: "pointer" }}
                            >
                                {modalBusy
                                    ? "Applying…"
                                    : `Confirm ${pendingStatus.label.toLowerCase()}`}
                            </button>
                        </>
                    }
                >
                    {modalError && (
                        <div className="mb-3">
                            <Banner tone="error">{modalError}</Banner>
                        </div>
                    )}
                    <ReasonField
                        value={statusReason}
                        onChange={setStatusReason}
                    />
                </Modal>
            )}

            {terminating && (
                <Modal
                    title={`Terminate ${terminating.user.fullName || "admin"}`}
                    description="Terminating is irreversible. For any institution this admin solely governs, choose who inherits responsibility — otherwise the server will refuse."
                    onClose={() => !modalBusy && setTerminating(null)}
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setTerminating(null)}
                                disabled={modalBusy}
                                className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
                                style={{ ...btnNeutral, cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmTerminate}
                                disabled={modalBusy}
                                className="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                                style={{ ...btnDanger, cursor: "pointer" }}
                            >
                                {modalBusy ? "Terminating…" : "Terminate admin"}
                            </button>
                        </>
                    }
                >
                    {modalError && (
                        <div className="mb-3">
                            <Banner tone="error">{modalError}</Banner>
                        </div>
                    )}
                    <div className="space-y-4">
                        <ReasonField
                            value={termReason}
                            onChange={setTermReason}
                        />
                        {terminating.institutions.length === 0 ? (
                            <p
                                className="text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                This admin governs no institution — no transfer
                                required.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <p
                                    className="text-[11px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    Responsibility transfer
                                </p>
                                {terminating.institutions.map((inst) => (
                                    <label
                                        key={inst.id}
                                        className="block text-sm"
                                    >
                                        <span
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {inst.name}
                                        </span>
                                        <select
                                            value={transfers[inst.id] || ""}
                                            onChange={(e) =>
                                                setTransfers((t) => ({
                                                    ...t,
                                                    [inst.id]: e.target.value,
                                                }))
                                            }
                                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                                backgroundColor:
                                                    "var(--dashboard-surface)",
                                                color: "var(--dashboard-fg)",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <option value="">
                                                No transfer (only if another
                                                active admin exists)
                                            </option>
                                            {candidates.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.fullName ||
                                                        c.email ||
                                                        c.id}
                                                    {c.email
                                                        ? ` · ${c.email}`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

const TextField = ({ label, value, onChange, type = "text", required }) => (
    <label className="block text-sm">
        <span
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </span>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                color: "var(--dashboard-fg)",
            }}
        />
    </label>
);

export default AdminManagementPage;
