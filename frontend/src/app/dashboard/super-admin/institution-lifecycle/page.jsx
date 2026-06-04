"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { setInstitutionStatus } from "@/features/dashboard/api/superAdmin.api";
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
 * SUPER_ADMIN — Institution Lifecycle (Phase 3B governance).
 *
 * Suspend / reactivate / archive institutions. Backed by the existing
 * `GET /api/admin/institutions` proxy (returns `status`) for listing, and
 * `PATCH /admin/institutions/:id/status` for transitions.
 *
 * ARCHIVED is terminal — the analogue of user termination. The server refuses
 * to transition an archived institution (409 INSTITUTION_ARCHIVED), and this UI
 * hides lifecycle actions for archived rows.
 */

const STATUS_ACTIONS = {
    ACTIVE: [
        { target: "SUSPENDED", label: "Suspend", danger: false },
        { target: "ARCHIVED", label: "Archive", danger: true },
    ],
    SUSPENDED: [
        { target: "ACTIVE", label: "Reactivate", danger: false },
        { target: "ARCHIVED", label: "Archive", danger: true },
    ],
};

const InstitutionLifecyclePage = () => {
    const { data: session, status: authStatus } = useSession();
    const [institutions, setInstitutions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [actionInfo, setActionInfo] = useState(null);

    // Status-change modal.
    const [pending, setPending] = useState(null); // { inst, target, label }
    const [reason, setReason] = useState("");
    const [modalBusy, setModalBusy] = useState(false);
    const [modalError, setModalError] = useState(null);

    const load = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/institutions", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Request failed (${res.status})`);
            }
            const body = await res.json();
            setInstitutions(Array.isArray(body) ? body : body.data || []);
        } catch (err) {
            setError(extractErrorMessage(err, "Unknown error"));
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    useEffect(() => {
        if (authStatus === "authenticated") load();
    }, [authStatus, load]);

    const filtered = useMemo(() => {
        if (!institutions) return [];
        const q = search.trim().toLowerCase();
        return institutions.filter((i) => {
            const st = i.status ?? (i.isActive ? "ACTIVE" : "SUSPENDED");
            if (statusFilter !== "ALL" && st !== statusFilter) return false;
            if (!q) return true;
            return [i.name, i.city, i.state]
                .filter(Boolean)
                .some((v) => v.toLowerCase().includes(q));
        });
    }, [institutions, statusFilter, search]);

    function openChange(inst, target, label) {
        setActionInfo(null);
        setReason("");
        setModalError(null);
        setPending({ inst, target, label });
    }

    async function confirmChange() {
        if (!pending) return;
        if (!reason.trim()) {
            setModalError("A reason is required.");
            return;
        }
        setModalBusy(true);
        setModalError(null);
        try {
            await setInstitutionStatus(
                pending.inst.id,
                pending.target,
                reason.trim(),
            );
            setActionInfo(`${pending.label}d ${pending.inst.name}.`);
            setPending(null);
            await load();
        } catch (err) {
            setModalError(extractErrorMessage(err, "Action failed"));
        } finally {
            setModalBusy(false);
        }
    }

    const total = institutions?.length ?? 0;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Governance · Institutions"
                title="Charter, suspend, archive."
                subtitle="Control the operational state of every partner institution. Suspension is reversible; archiving is permanent and preserves history — handle with care."
            />

            <Panel
                eyebrow="Filter"
                title="Find institutions"
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-md border px-3 py-1.5 text-xs"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="ARCHIVED">Archived</option>
                            <option value="PENDING_APPROVAL">
                                Pending approval
                            </option>
                        </select>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, city…"
                            className="rounded-md border px-3 py-1.5 text-xs"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                        />
                    </div>
                }
            >
                <p
                    className="text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {filtered.length} of {total} showing.
                </p>
            </Panel>

            <Banner tone="info" onDismiss={() => setActionInfo(null)}>
                {actionInfo}
            </Banner>

            {loading ? (
                <PageLoading label="Loading institutions" />
            ) : error ? (
                <PageError
                    title="Could not load institutions"
                    message={error}
                    onRetry={load}
                />
            ) : filtered.length === 0 ? (
                <Panel
                    eyebrow="Institutions"
                    title="Nothing matches that filter"
                >
                    <PageEmpty title="Empty" />
                </Panel>
            ) : (
                <Panel
                    eyebrow="Institutions"
                    title={`${filtered.length} of ${total}`}
                    padded={false}
                >
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {filtered.map((inst) => {
                            const st =
                                inst.status ??
                                (inst.isActive ? "ACTIVE" : "SUSPENDED");
                            const actions = STATUS_ACTIONS[st] ?? [];
                            return (
                                <li key={inst.id} className="px-6 py-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p
                                                    className="truncate font-display text-base"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {inst.name}
                                                </p>
                                                <LifecycleBadge status={st} />
                                            </div>
                                            <p
                                                className="mt-0.5 truncate text-xs"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {inst.type || "—"}
                                                {[inst.city, inst.state]
                                                    .filter(Boolean)
                                                    .join(", ")
                                                    ? ` · ${[inst.city, inst.state].filter(Boolean).join(", ")}`
                                                    : ""}
                                                {" · "}
                                                {inst.batches?.length ??
                                                    inst.batchCount ??
                                                    0}{" "}
                                                batches · chartered{" "}
                                                {formatDate(inst.createdAt)}
                                                {inst.statusReason
                                                    ? ` · note: ${inst.statusReason}`
                                                    : ""}
                                            </p>
                                        </div>
                                        {actions.length > 0 && (
                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                {actions.map((a) => (
                                                    <button
                                                        key={a.target}
                                                        type="button"
                                                        onClick={() =>
                                                            openChange(
                                                                inst,
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
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Panel>
            )}

            {pending && (
                <Modal
                    title={`${pending.label} ${pending.inst.name}`}
                    description={
                        pending.target === "ARCHIVED"
                            ? "Archiving is permanent and cannot be undone. History is preserved. Recorded in the audit log."
                            : "Recorded in the audit log with your reason."
                    }
                    onClose={() => !modalBusy && setPending(null)}
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setPending(null)}
                                disabled={modalBusy}
                                className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
                                style={{ ...btnNeutral, cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmChange}
                                disabled={modalBusy}
                                className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                                style={{
                                    ...(pending.target === "ARCHIVED"
                                        ? { ...btnDanger, border: "1px solid" }
                                        : btnPrimary),
                                    cursor: "pointer",
                                }}
                            >
                                {modalBusy
                                    ? "Applying…"
                                    : `Confirm ${pending.label.toLowerCase()}`}
                            </button>
                        </>
                    }
                >
                    {modalError && (
                        <div className="mb-3">
                            <Banner tone="error">{modalError}</Banner>
                        </div>
                    )}
                    <ReasonField value={reason} onChange={setReason} />
                </Modal>
            )}
        </div>
    );
};

export default InstitutionLifecyclePage;
