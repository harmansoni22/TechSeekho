"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ConfirmDialog,
    CredentialModal,
    Field,
    FormMessage,
    formatDate,
    GhostButton,
    inputStyle,
    Modal,
    Pill,
    PrimaryButton,
    StatusPill,
} from "@/features/dashboard/admin/adminShared";
import {
    assignTrainerToBatch,
    createTrainer,
    fetchBatches,
    fetchInstitutionPeople,
    fetchInstitutions,
    setMemberStatus,
} from "@/features/dashboard/api/adminDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

const STATUSES = ["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"];

export default function AdminTrainersPage() {
    const [institutions, setInstitutions] = useState(null);
    const [institutionId, setInstitutionId] = useState(null);
    const [batches, setBatches] = useState([]);
    const [people, setPeople] = useState(null);
    const [error, setError] = useState(null);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [showCreate, setShowCreate] = useState(false);
    const [manageTarget, setManageTarget] = useState(null);
    const [credential, setCredential] = useState(null);

    const loadInstitutions = useCallback(async () => {
        setError(null);
        try {
            const list = await fetchInstitutions();
            const arr = Array.isArray(list) ? list : [];
            setInstitutions(arr);
            if (arr.length && !institutionId) setInstitutionId(arr[0].id);
        } catch (err) {
            setError(err.message);
            setInstitutions([]);
        }
    }, [institutionId]);

    const loadRoster = useCallback(async () => {
        if (!institutionId) return;
        setPeople(null);
        setError(null);
        try {
            const [peopleRes, batchRes] = await Promise.all([
                fetchInstitutionPeople({
                    institutionId,
                    role: "TRAINER",
                    q: q.trim() || undefined,
                    status: statusFilter === "ALL" ? undefined : statusFilter,
                }),
                fetchBatches({ institutionId }),
            ]);
            setPeople(peopleRes?.people ?? []);
            setBatches(Array.isArray(batchRes) ? batchRes : []);
        } catch (err) {
            setError(err.message);
            setPeople([]);
        }
    }, [institutionId, q, statusFilter]);

    useEffect(() => {
        loadInstitutions();
    }, [loadInstitutions]);

    useEffect(() => {
        loadRoster();
    }, [loadRoster]);

    const stats = useMemo(() => {
        const list = people ?? [];
        return {
            total: list.length,
            assigned: list.filter((p) => (p.batchCount ?? 0) > 0).length,
            unassigned: list.filter((p) => (p.batchCount ?? 0) === 0).length,
            suspended: list.filter((p) => p.status === "SUSPENDED").length,
        };
    }, [people]);

    if (institutions === null) {
        if (error)
            return (
                <PageError
                    title="Couldn't load trainers"
                    message={error}
                    onRetry={loadInstitutions}
                />
            );
        return <PageLoading label="Loading trainers" />;
    }

    if (institutions.length === 0) {
        return (
            <div className="space-y-8">
                <Hero />
                <PageEmpty
                    title="No institution in your scope"
                    description="Ask a super-admin to assign your ADMIN role an institution before onboarding trainers."
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Hero
                actions={
                    <PrimaryButton onClick={() => setShowCreate(true)}>
                        Onboard trainer
                    </PrimaryButton>
                }
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Trainers" value={stats.total} />
                <StatTile label="Assigned to batches" value={stats.assigned} />
                <StatTile
                    label="Idle"
                    value={stats.unassigned}
                    footnote={
                        stats.unassigned > 0 ? "no batches yet" : "all active"
                    }
                />
                <StatTile label="Suspended" value={stats.suspended} />
            </section>

            <Panel
                eyebrow="Roster"
                title="Trainers"
                description={people ? `${people.length} in scope` : "Loading…"}
                padded={false}
                actions={
                    institutions.length > 1 ? (
                        <select
                            value={institutionId ?? ""}
                            onChange={(e) => setInstitutionId(e.target.value)}
                            className="rounded-md border px-3 py-1.5 text-xs"
                            style={inputStyle}
                        >
                            {institutions.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name}
                                </option>
                            ))}
                        </select>
                    ) : null
                }
            >
                <div
                    className="flex flex-wrap gap-2 border-b px-5 py-3"
                    style={{ borderColor: "var(--dashboard-border)" }}
                >
                    <input
                        type="search"
                        placeholder="Search name or email…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="min-w-[200px] flex-1 rounded-md border px-3 py-1.5 text-sm"
                        style={inputStyle}
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-md border px-3 py-1.5 text-sm"
                        style={inputStyle}
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s === "ALL" ? "All statuses" : s}
                            </option>
                        ))}
                    </select>
                </div>

                {people === null ? (
                    <div className="px-6 py-10">
                        <PageLoading label="Loading roster" />
                    </div>
                ) : people.length === 0 ? (
                    <div className="px-6 py-8">
                        <PageEmpty
                            title="No trainers match"
                            description="Adjust filters, or onboard your first trainer with the button above."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr
                                    className="text-[10px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    <th className="px-6 py-3 font-medium">
                                        Trainer
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Specialization
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Workload
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-right font-medium">
                                        Manage
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {people.map((p) => (
                                    <tr
                                        key={p.userId}
                                        className="border-t"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td className="px-6 py-3">
                                            <div
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {p.fullName}
                                            </div>
                                            <div
                                                className="text-xs"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {p.email || p.phone || "—"}
                                            </div>
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {p.specialization || "—"}
                                            {p.experienceYears != null
                                                ? ` · ${p.experienceYears}y`
                                                : ""}
                                        </td>
                                        <td className="px-3 py-3">
                                            {(p.batchCount ?? 0) > 0 ? (
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {p.batchCount} batch
                                                    {p.batchCount === 1
                                                        ? ""
                                                        : "es"}
                                                </span>
                                            ) : (
                                                <Pill tone="muted">Idle</Pill>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusPill status={p.status} />
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {formatDate(p.createdAt)}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <GhostButton
                                                onClick={() =>
                                                    setManageTarget(p)
                                                }
                                            >
                                                Manage
                                            </GhostButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {showCreate && (
                <CreateTrainerModal
                    institutionId={institutionId}
                    onClose={() => setShowCreate(false)}
                    onCreated={(cred) => {
                        setShowCreate(false);
                        setCredential(cred);
                        loadRoster();
                    }}
                />
            )}

            {manageTarget && (
                <ManageTrainerModal
                    trainer={manageTarget}
                    batches={batches}
                    onClose={() => setManageTarget(null)}
                    onChanged={() => {
                        setManageTarget(null);
                        loadRoster();
                    }}
                />
            )}

            {credential && (
                <CredentialModal
                    title="Trainer onboarded"
                    credentials={[credential]}
                    onClose={() => setCredential(null)}
                />
            )}
        </div>
    );
}

function Hero({ actions }) {
    return (
        <RoleHero
            eyebrow="Institutional Operations · Trainers"
            title="Onboard and deploy your delivery team."
            subtitle="Provision trainer accounts, track workload across batches, assign them to delivery, and manage status. Batch teaching workflows stay with the trainers themselves."
            actions={actions}
        />
    );
}

function CreateTrainerModal({ institutionId, onClose, onCreated }) {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        specialization: "",
        experienceYears: "",
        bio: "",
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    function set(field, value) {
        setForm((f) => ({ ...f, [field]: value }));
    }

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const res = await createTrainer({
                institutionId,
                fullName: form.fullName.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                specialization: form.specialization.trim() || undefined,
                bio: form.bio.trim() || undefined,
                experienceYears:
                    form.experienceYears === ""
                        ? undefined
                        : Number(form.experienceYears),
            });
            onCreated({
                fullName: res.user.fullName,
                identifier: res.credentials.identifier,
                temporaryPassword: res.credentials.temporaryPassword,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            title="Onboard a trainer"
            description="A temporary password is generated automatically and shown once after creation."
            onClose={onClose}
            footer={
                <>
                    <GhostButton onClick={onClose} disabled={busy}>
                        Cancel
                    </GhostButton>
                    <PrimaryButton
                        onClick={submit}
                        disabled={busy || !form.fullName.trim()}
                    >
                        {busy ? "Creating…" : "Create trainer"}
                    </PrimaryButton>
                </>
            }
        >
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name *" className="sm:col-span-2">
                    <input
                        value={form.fullName}
                        onChange={(e) => set("fullName", e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Email">
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Phone">
                    <input
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Specialization">
                    <input
                        value={form.specialization}
                        onChange={(e) => set("specialization", e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Experience (years)">
                    <input
                        type="number"
                        min="0"
                        max="60"
                        value={form.experienceYears}
                        onChange={(e) => set("experienceYears", e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Bio" className="sm:col-span-2">
                    <textarea
                        value={form.bio}
                        onChange={(e) => set("bio", e.target.value)}
                        rows={3}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <div className="sm:col-span-2">
                    <FormMessage error={error} />
                    <p
                        className="text-[11px]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Provide at least an email or a phone number.
                    </p>
                </div>
            </form>
        </Modal>
    );
}

function ManageTrainerModal({ trainer, batches, onClose, onChanged }) {
    const [batchId, setBatchId] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [ok, setOk] = useState(null);
    const [confirmStatus, setConfirmStatus] = useState(null);

    async function assign() {
        if (!batchId) return;
        setBusy(true);
        setError(null);
        setOk(null);
        try {
            await assignTrainerToBatch(batchId, trainer.profileId);
            setOk("Assigned to batch.");
            onChanged();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function applyStatus(status) {
        setBusy(true);
        setError(null);
        try {
            await setMemberStatus(trainer.userId, status);
            setConfirmStatus(null);
            onChanged();
        } catch (err) {
            setError(err.message);
            setConfirmStatus(null);
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            title={trainer.fullName}
            description={trainer.email || trainer.phone || ""}
            onClose={onClose}
            footer={
                <GhostButton onClick={onClose} disabled={busy}>
                    Close
                </GhostButton>
            }
        >
            <div className="space-y-5">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <Meta
                        label="Specialization"
                        value={trainer.specialization || "—"}
                    />
                    <Meta
                        label="Experience"
                        value={
                            trainer.experienceYears != null
                                ? `${trainer.experienceYears} years`
                                : "—"
                        }
                    />
                    <Meta
                        label="Batch workload"
                        value={`${trainer.batchCount ?? 0} batch(es)`}
                    />
                    <Meta label="Status" value={trainer.status} />
                </dl>

                <div>
                    <p
                        className="mb-2 text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Assign to a batch
                    </p>
                    <div className="flex gap-2">
                        <select
                            value={batchId}
                            onChange={(e) => setBatchId(e.target.value)}
                            className="flex-1 rounded-md border px-3 py-2 text-sm"
                            style={inputStyle}
                        >
                            <option value="">Select a batch…</option>
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        <PrimaryButton
                            onClick={assign}
                            disabled={busy || !batchId}
                        >
                            Assign
                        </PrimaryButton>
                    </div>
                    <p
                        className="mt-1 text-[11px]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Remove assignments from the batch detail page.
                    </p>
                </div>

                <div>
                    <p
                        className="mb-2 text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Account status
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {trainer.status !== "ACTIVE" && (
                            <PrimaryButton
                                onClick={() => applyStatus("ACTIVE")}
                                disabled={busy}
                            >
                                Activate
                            </PrimaryButton>
                        )}
                        {trainer.status !== "SUSPENDED" && (
                            <button
                                type="button"
                                onClick={() => setConfirmStatus("SUSPENDED")}
                                disabled={busy}
                                className="rounded-md border px-3.5 py-2 text-xs font-semibold"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    color: "rgb(185, 28, 28)",
                                    cursor: "pointer",
                                }}
                            >
                                Suspend
                            </button>
                        )}
                        {trainer.status !== "INACTIVE" && (
                            <GhostButton
                                onClick={() => setConfirmStatus("INACTIVE")}
                                disabled={busy}
                            >
                                Deactivate
                            </GhostButton>
                        )}
                    </div>
                </div>

                <FormMessage error={error} ok={ok} />
            </div>

            {confirmStatus && (
                <ConfirmDialog
                    title={
                        confirmStatus === "SUSPENDED"
                            ? "Suspend trainer?"
                            : "Deactivate trainer?"
                    }
                    message={`"${trainer.fullName}" will be set to ${confirmStatus}. They will not be able to sign in until reactivated. Existing batch assignments remain.`}
                    confirmLabel={
                        confirmStatus === "SUSPENDED" ? "Suspend" : "Deactivate"
                    }
                    destructive
                    busy={busy}
                    onCancel={() => setConfirmStatus(null)}
                    onConfirm={() => applyStatus(confirmStatus)}
                />
            )}
        </Modal>
    );
}

function Meta({ label, value }) {
    return (
        <div>
            <dt
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </dt>
            <dd
                className="mt-1 text-sm"
                style={{ color: "var(--dashboard-fg)" }}
            >
                {value}
            </dd>
        </div>
    );
}
