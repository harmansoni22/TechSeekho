"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    fetchTrainers,
    setTrainerStatus,
    terminateTrainer,
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
 * SUPER_ADMIN — Trainer Management (Phase 3B governance).
 *
 * Trainer directory + lifecycle status + termination-with-batch-reassignment.
 *
 * Backend contract:
 *   GET  /admin/trainers                        → directory (trainer.batches[] included)
 *   PATCH /admin/trainers/:userId/status        → suspend / reactivate / deactivate
 *   POST /admin/trainers/:userId/terminate      → terminate; requires a reassignment
 *                                                 for any batch this trainer solely
 *                                                 covers (409 BATCH_REASSIGNMENT_REQUIRED)
 *
 * "No orphan batches" is enforced server-side. To give the operator a useful
 * preview, this page computes which batches are orphan-risk client-side by
 * cross-referencing every ACTIVE trainer's batch list: a batch is orphan-risk
 * for trainer T if no *other* active trainer also covers it. (toTrainerId is a
 * USER id; the backend resolves it to the trainer profile.)
 */

const STATUS_FILTERS = [
    { value: "", label: "All statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "TERMINATED", label: "Terminated" },
];

const TrainerManagementPage = () => {
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionInfo, setActionInfo] = useState(null);

    // Status-change modal.
    const [pendingStatus, setPendingStatus] = useState(null); // { user, target, label }
    const [statusReason, setStatusReason] = useState("");

    // Terminate modal.
    const [terminating, setTerminating] = useState(null); // { user, batches: [{id,name,orphanRisk}] }
    const [termReason, setTermReason] = useState("");
    const [reassignments, setReassignments] = useState({}); // batchId -> toTrainerUserId
    const [candidates, setCandidates] = useState([]); // active trainers (excl. target)
    const [modalBusy, setModalBusy] = useState(false);
    const [modalError, setModalError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchTrainers({
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
    }, [statusFilter, search]);

    useEffect(() => {
        load();
    }, [load]);

    const trainers = useMemo(() => data?.trainers ?? [], [data]);
    const total = data?.total ?? trainers.length;

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
            await setTrainerStatus(
                pendingStatus.user.id,
                pendingStatus.target,
                statusReason.trim(),
            );
            setActionInfo(
                `${pendingStatus.label}d ${pendingStatus.user.fullName || "trainer"}.`,
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
        setReassignments({});
        setModalError(null);
        // Fetch the full active-trainer set so orphan-risk + candidate options
        // reflect the whole platform, not just the current filtered view.
        let activeTrainers = [];
        try {
            const result = await fetchTrainers({
                status: "ACTIVE",
                limit: 200,
            });
            activeTrainers = result.trainers ?? [];
        } catch {
            activeTrainers = [];
        }
        const others = activeTrainers.filter((t) => t.id !== user.id);
        // Map batchId -> does any *other* active trainer cover it?
        const coveredByOthers = new Set();
        for (const t of others) {
            for (const b of t.batches || []) coveredByOthers.add(b.id);
        }
        const batches = (user.batches || []).map((b) => ({
            ...b,
            orphanRisk: !coveredByOthers.has(b.id),
        }));
        setCandidates(others);
        setTerminating({ user, batches });
    }

    async function confirmTerminate() {
        if (!terminating) return;
        if (!termReason.trim()) {
            setModalError("A reason is required.");
            return;
        }
        const reassignList = Object.entries(reassignments)
            .filter(([, toTrainerId]) => toTrainerId)
            .map(([batchId, toTrainerId]) => ({ batchId, toTrainerId }));
        setModalBusy(true);
        setModalError(null);
        try {
            await terminateTrainer(
                terminating.user.id,
                termReason.trim(),
                reassignList,
            );
            setActionInfo(
                `Terminated ${terminating.user.fullName || "trainer"}.`,
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
                eyebrow="Governance · Trainers"
                title="Keep every batch covered."
                subtitle="Manage trainer lifecycle across institutions. Termination requires reassigning any batch a trainer solely runs, so no cohort is ever left without a trainer."
            />

            <Panel
                eyebrow="Filter"
                title="Find trainers"
                actions={
                    <button
                        type="button"
                        onClick={() => {
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
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                        <span
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Status
                        </span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                                color: "var(--dashboard-fg)",
                                cursor: "pointer",
                            }}
                        >
                            {STATUS_FILTERS.map((opt) => (
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

            <Banner tone="error" onDismiss={() => setActionError(null)}>
                {actionError}
            </Banner>
            <Banner tone="info" onDismiss={() => setActionInfo(null)}>
                {actionInfo}
            </Banner>

            {loading ? (
                <PageLoading label="Loading trainers" />
            ) : error ? (
                <PageError
                    title="Could not load trainers"
                    message={error}
                    onRetry={load}
                />
            ) : trainers.length === 0 ? (
                <Panel eyebrow="Trainers" title="No trainers match this filter">
                    <PageEmpty title="Empty" />
                </Panel>
            ) : (
                <Panel
                    eyebrow="Trainers"
                    title={`${trainers.length} of ${total}`}
                    padded={false}
                >
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {trainers.map((u) => {
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
                                                        "Unnamed trainer"}
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
                                                {u.specialization
                                                    ? ` · ${u.specialization}`
                                                    : ""}
                                                {" · "}
                                                {u.batchCount} batch
                                                {u.batchCount === 1 ? "" : "es"}
                                                {" · joined "}
                                                {formatDate(u.createdAt)}
                                            </p>
                                            {u.batches?.length > 0 && (
                                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                                    {u.batches.map((b) => (
                                                        <li
                                                            key={b.id}
                                                            className="inline-flex items-center rounded-md border px-2 py-1 text-[11px]"
                                                            style={{
                                                                borderColor:
                                                                    "var(--dashboard-border)",
                                                                backgroundColor:
                                                                    "var(--role-accent-soft)",
                                                                color: "var(--dashboard-fg)",
                                                            }}
                                                        >
                                                            {b.name}
                                                            {b.institutionName
                                                                ? ` · ${b.institutionName}`
                                                                : ""}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        {!isTerminated && (
                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                {u.status === "ACTIVE" ? (
                                                    <>
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
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openStatus(
                                                                    u,
                                                                    "INACTIVE",
                                                                    "Deactivate",
                                                                )
                                                            }
                                                            className="rounded-md border px-3 py-1.5 text-xs font-medium"
                                                            style={{
                                                                ...btnNeutral,
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            Deactivate
                                                        </button>
                                                    </>
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
                    title={`${pendingStatus.label} ${pendingStatus.user.fullName || "trainer"}`}
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
                    title={`Terminate ${terminating.user.fullName || "trainer"}`}
                    description="Terminating is irreversible. Batches flagged sole-coverage must be reassigned to another active trainer, or the server will refuse."
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
                                {modalBusy
                                    ? "Terminating…"
                                    : "Terminate trainer"}
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
                        {terminating.batches.length === 0 ? (
                            <p
                                className="text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                This trainer runs no batches — no reassignment
                                required.
                            </p>
                        ) : candidates.length === 0 ? (
                            <Banner tone="error">
                                No other active trainers exist to receive
                                reassignments. Provision or reactivate a trainer
                                before terminating this one.
                            </Banner>
                        ) : (
                            <div className="space-y-3">
                                <p
                                    className="text-[11px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    Batch reassignment
                                </p>
                                {terminating.batches.map((b) => (
                                    <label key={b.id} className="block text-sm">
                                        <span
                                            className="flex items-center gap-2"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {b.name}
                                            {b.institutionName
                                                ? ` · ${b.institutionName}`
                                                : ""}
                                            {b.orphanRisk && (
                                                <span
                                                    className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                                                    style={{
                                                        backgroundColor:
                                                            "rgba(220, 38, 38, 0.12)",
                                                        color: "#b91c1c",
                                                    }}
                                                >
                                                    sole coverage
                                                </span>
                                            )}
                                        </span>
                                        <select
                                            value={reassignments[b.id] || ""}
                                            onChange={(e) =>
                                                setReassignments((r) => ({
                                                    ...r,
                                                    [b.id]: e.target.value,
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
                                                {b.orphanRisk
                                                    ? "Select a trainer (required)"
                                                    : "No reassignment (covered by others)"}
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

export default TrainerManagementPage;
