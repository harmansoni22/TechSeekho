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
    assignStudentToBatch,
    createStudent,
    fetchBatches,
    fetchInstitutionPeople,
    fetchInstitutions,
    removeStudentFromBatch,
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
import BulkImportModal from "./_components/BulkImportModal";

const STATUSES = ["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"];

export default function AdminStudentsPage() {
    const [institutions, setInstitutions] = useState(null);
    const [institutionId, setInstitutionId] = useState(null);
    const [batches, setBatches] = useState([]);
    const [people, setPeople] = useState(null);
    const [error, setError] = useState(null);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [showCreate, setShowCreate] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
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
                    role: "STUDENT",
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
            assigned: list.filter((p) => p.currentBatchId).length,
            unassigned: list.filter((p) => !p.currentBatchId).length,
            suspended: list.filter((p) => p.status === "SUSPENDED").length,
        };
    }, [people]);

    if (institutions === null) {
        if (error)
            return (
                <PageError
                    title="Couldn't load students"
                    message={error}
                    onRetry={loadInstitutions}
                />
            );
        return <PageLoading label="Loading students" />;
    }

    if (institutions.length === 0) {
        return (
            <div className="space-y-8">
                <Hero />
                <PageEmpty
                    title="No institution in your scope"
                    description="Ask a super-admin to assign your ADMIN role an institution before onboarding students."
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Hero
                actions={
                    <>
                        <GhostButton onClick={() => setShowBulk(true)}>
                            Bulk import
                        </GhostButton>
                        <PrimaryButton onClick={() => setShowCreate(true)}>
                            Onboard student
                        </PrimaryButton>
                    </>
                }
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Students" value={stats.total} />
                <StatTile label="In a batch" value={stats.assigned} />
                <StatTile
                    label="Unassigned"
                    value={stats.unassigned}
                    footnote={
                        stats.unassigned > 0 ? "needs placement" : "all placed"
                    }
                />
                <StatTile label="Suspended" value={stats.suspended} />
            </section>

            <Panel
                eyebrow="Roster"
                title="Students"
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
                            title="No students match"
                            description="Adjust the filters, or onboard your first students with the buttons above."
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
                                        Student
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Enrollment
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Batch
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
                                            {p.enrollmentNumber || "—"}
                                        </td>
                                        <td className="px-3 py-3">
                                            {p.currentBatchName ? (
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {p.currentBatchName}
                                                </span>
                                            ) : (
                                                <Pill tone="warning">
                                                    Unassigned
                                                </Pill>
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
                <CreateStudentModal
                    institutionId={institutionId}
                    batches={batches}
                    onClose={() => setShowCreate(false)}
                    onCreated={(cred) => {
                        setShowCreate(false);
                        setCredential(cred);
                        loadRoster();
                    }}
                />
            )}

            {showBulk && (
                <BulkImportModal
                    institutionId={institutionId}
                    batches={batches}
                    onClose={() => setShowBulk(false)}
                    onDone={() => loadRoster()}
                />
            )}

            {manageTarget && (
                <ManageStudentModal
                    student={manageTarget}
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
                    title="Student onboarded"
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
            eyebrow="Institutional Operations · Students"
            title="Provision and place your learners."
            subtitle="Student identity is an admin responsibility — onboard individually or in bulk, generate credentials, place students in batches, and manage status. Trainers never provision student accounts."
            actions={actions}
        />
    );
}

function CreateStudentModal({ institutionId, batches, onClose, onCreated }) {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        enrollmentNumber: "",
        batchId: "",
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
            const res = await createStudent({
                institutionId,
                fullName: form.fullName.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                enrollmentNumber: form.enrollmentNumber.trim() || undefined,
                batchId: form.batchId || undefined,
            });
            onCreated({
                fullName: res.user.fullName,
                identifier: res.credentials.identifier,
                enrollmentNumber: res.user.enrollmentNumber,
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
            title="Onboard a student"
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
                        {busy ? "Creating…" : "Create student"}
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
                <Field
                    label="Enrollment number"
                    hint="Auto-generated if left blank"
                >
                    <input
                        value={form.enrollmentNumber}
                        onChange={(e) =>
                            set("enrollmentNumber", e.target.value)
                        }
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Place in batch (optional)">
                    <select
                        value={form.batchId}
                        onChange={(e) => set("batchId", e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    >
                        <option value="">No batch yet</option>
                        {batches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
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

function ManageStudentModal({ student, batches, onClose, onChanged }) {
    const [batchId, setBatchId] = useState(student.currentBatchId || "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [ok, setOk] = useState(null);
    const [confirmStatus, setConfirmStatus] = useState(null);

    async function saveBatch() {
        setBusy(true);
        setError(null);
        setOk(null);
        try {
            if (!batchId && student.currentBatchId) {
                await removeStudentFromBatch(
                    student.currentBatchId,
                    student.profileId,
                );
            } else if (batchId && batchId !== student.currentBatchId) {
                await assignStudentToBatch(batchId, student.profileId);
            }
            setOk("Placement updated.");
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
            await setMemberStatus(student.userId, status);
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
            title={student.fullName}
            description={student.email || student.phone || ""}
            onClose={onClose}
            footer={
                <GhostButton onClick={onClose} disabled={busy}>
                    Close
                </GhostButton>
            }
        >
            <div className="space-y-5">
                <div>
                    <p
                        className="mb-2 text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Batch placement
                    </p>
                    <div className="flex gap-2">
                        <select
                            value={batchId}
                            onChange={(e) => setBatchId(e.target.value)}
                            className="flex-1 rounded-md border px-3 py-2 text-sm"
                            style={inputStyle}
                        >
                            <option value="">No batch</option>
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        <PrimaryButton onClick={saveBatch} disabled={busy}>
                            Save
                        </PrimaryButton>
                    </div>
                </div>

                <div>
                    <p
                        className="mb-2 text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Account status · current: {student.status}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {student.status !== "ACTIVE" && (
                            <PrimaryButton
                                onClick={() => applyStatus("ACTIVE")}
                                disabled={busy}
                            >
                                Activate
                            </PrimaryButton>
                        )}
                        {student.status !== "SUSPENDED" && (
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
                        {student.status !== "INACTIVE" && (
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
                            ? "Suspend student?"
                            : "Deactivate student?"
                    }
                    message={`"${student.fullName}" will be set to ${confirmStatus}. They will not be able to sign in until reactivated.`}
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
