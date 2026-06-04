"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ConfirmDialog,
    FormMessage,
    formatDate,
    GhostButton,
    inputStyle,
    Modal,
    Pill,
    PrimaryButton,
} from "@/features/dashboard/admin/adminShared";
import {
    assignStudentToBatch,
    assignTrainerToBatch,
    fetchAnnouncements,
    fetchAssignments,
    fetchBatchDetail,
    fetchInstitutionMembers,
    removeStudentFromBatch,
    removeTrainerFromBatch,
    updateBatch,
} from "@/features/dashboard/api/adminDashboard.api";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * Batch detail panel for the admin Batches page: roster (trainers + students)
 * with add/remove, activation toggle, and recent delivery/communications.
 * Extracted from the page to keep the list view file focused.
 */
export default function BatchDetail({ batchId, onChanged }) {
    const [detail, setDetail] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [picker, setPicker] = useState(null); // "STUDENT" | "TRAINER" | null
    const [confirmRemove, setConfirmRemove] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const [d, asg, ann] = await Promise.all([
                fetchBatchDetail(batchId),
                fetchAssignments({ batchId }).catch(() => []),
                fetchAnnouncements({ batchId }).catch(() => []),
            ]);
            setDetail(d);
            setAssignments(Array.isArray(asg) ? asg : []);
            setAnnouncements(Array.isArray(ann) ? ann : []);
        } catch (err) {
            setError(err.message);
        }
    }, [batchId]);

    useEffect(() => {
        load();
    }, [load]);

    async function toggleActive() {
        setBusy(true);
        try {
            await updateBatch(batchId, { isActive: !detail.isActive });
            await load();
            onChanged?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function doRemove() {
        if (!confirmRemove) return;
        setBusy(true);
        try {
            if (confirmRemove.type === "STUDENT") {
                await removeStudentFromBatch(batchId, confirmRemove.profileId);
            } else {
                await removeTrainerFromBatch(batchId, confirmRemove.profileId);
            }
            setConfirmRemove(null);
            await load();
            onChanged?.();
        } catch (err) {
            setError(err.message);
            setConfirmRemove(null);
        } finally {
            setBusy(false);
        }
    }

    if (error)
        return (
            <PageError
                title="Couldn't load batch"
                message={error}
                onRetry={load}
            />
        );
    if (!detail) return <PageLoading label="Loading batch" />;

    const students = detail.students ?? [];
    const trainers = detail.trainers ?? [];

    return (
        <div className="space-y-6">
            <Panel
                eyebrow="Snapshot"
                title={detail.name}
                description={`${detail.course?.title ?? "—"} · ${detail.institution?.name ?? "—"}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Pill tone={detail.isActive ? "success" : "muted"}>
                            {detail.isActive ? "Active" : "Inactive"}
                        </Pill>
                        <GhostButton onClick={toggleActive} disabled={busy}>
                            {detail.isActive ? "Deactivate" : "Activate"}
                        </GhostButton>
                    </div>
                }
            >
                <dl className="grid gap-4 sm:grid-cols-4">
                    <Meta label="Students" value={students.length} />
                    <Meta label="Trainers" value={trainers.length} />
                    <Meta label="Assignments" value={assignments.length} />
                    <Meta label="Starts" value={formatDate(detail.startDate)} />
                </dl>
            </Panel>

            <Panel
                eyebrow="Delivery team"
                title="Trainers"
                actions={
                    <GhostButton onClick={() => setPicker("TRAINER")}>
                        Assign trainer
                    </GhostButton>
                }
            >
                {trainers.length === 0 ? (
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        No trainers assigned. This batch has no delivery staff
                        yet.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {trainers.map((bt) => (
                            <RosterRow
                                key={bt.trainer.id}
                                name={bt.trainer.user?.fullName}
                                sub={bt.trainer.user?.email}
                                onRemove={() =>
                                    setConfirmRemove({
                                        type: "TRAINER",
                                        profileId: bt.trainer.id,
                                        name: bt.trainer.user?.fullName,
                                    })
                                }
                            />
                        ))}
                    </ul>
                )}
            </Panel>

            <Panel
                eyebrow="Cohort"
                title="Students"
                actions={
                    <GhostButton onClick={() => setPicker("STUDENT")}>
                        Add student
                    </GhostButton>
                }
            >
                {students.length === 0 ? (
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        No students placed in this batch yet.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {students.map((sp) => (
                            <RosterRow
                                key={sp.id}
                                name={sp.user?.fullName}
                                sub={
                                    sp.enrollmentNumber || sp.user?.email || "—"
                                }
                                onRemove={() =>
                                    setConfirmRemove({
                                        type: "STUDENT",
                                        profileId: sp.id,
                                        name: sp.user?.fullName,
                                    })
                                }
                            />
                        ))}
                    </ul>
                )}
            </Panel>

            <div className="grid gap-6 lg:grid-cols-2">
                <Panel eyebrow="Delivery" title="Recent assignments">
                    {assignments.length === 0 ? (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            No assignments created for this batch.
                        </p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {assignments.slice(0, 6).map((a) => (
                                <li
                                    key={a.id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <span
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {a.title}
                                    </span>
                                    <span
                                        className="shrink-0 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.dueDate
                                            ? `due ${formatDate(a.dueDate)}`
                                            : "no due date"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel eyebrow="Communications" title="Recent announcements">
                    {announcements.length === 0 ? (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            No announcements posted to this batch.
                        </p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {announcements.slice(0, 6).map((a) => (
                                <li
                                    key={a.id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <span
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {a.title}
                                    </span>
                                    <span
                                        className="shrink-0 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {formatDate(a.createdAt)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>

            {picker && (
                <AddMemberModal
                    role={picker}
                    institutionId={detail.institution?.id}
                    batchId={batchId}
                    existing={
                        picker === "STUDENT"
                            ? students.map((s) => s.id)
                            : trainers.map((t) => t.trainer.id)
                    }
                    onClose={() => setPicker(null)}
                    onAdded={() => {
                        setPicker(null);
                        load();
                        onChanged?.();
                    }}
                />
            )}

            {confirmRemove && (
                <ConfirmDialog
                    title={`Remove ${confirmRemove.type === "STUDENT" ? "student" : "trainer"}?`}
                    message={`Remove "${confirmRemove.name}" from this batch? ${
                        confirmRemove.type === "STUDENT"
                            ? "The student stays in the institution but is unassigned from this batch."
                            : "Operational records they created remain intact."
                    }`}
                    confirmLabel="Remove"
                    destructive
                    busy={busy}
                    onCancel={() => setConfirmRemove(null)}
                    onConfirm={doRemove}
                />
            )}
        </div>
    );
}

function AddMemberModal({
    role,
    institutionId,
    batchId,
    existing,
    onClose,
    onAdded,
}) {
    const [candidates, setCandidates] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [q, setQ] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await fetchInstitutionMembers(institutionId, role);
                if (!cancelled) setCandidates(Array.isArray(list) ? list : []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [institutionId, role]);

    const existingSet = new Set(existing);
    const filtered = (candidates ?? []).filter((c) => {
        if (existingSet.has(c.profileId)) return false;
        if (!q.trim()) return true;
        const hay = `${c.fullName} ${c.email ?? ""}`.toLowerCase();
        return hay.includes(q.trim().toLowerCase());
    });

    async function add(profileId) {
        setBusy(true);
        setError(null);
        try {
            if (role === "STUDENT") {
                await assignStudentToBatch(batchId, profileId);
            } else {
                await assignTrainerToBatch(batchId, profileId);
            }
            onAdded();
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    }

    return (
        <Modal
            title={role === "STUDENT" ? "Add a student" : "Assign a trainer"}
            description={`Pick from ${role === "STUDENT" ? "students" : "trainers"} in this institution.`}
            onClose={onClose}
            footer={<GhostButton onClick={onClose}>Close</GhostButton>}
        >
            <input
                type="search"
                placeholder="Search…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
                style={inputStyle}
            />
            <FormMessage error={error} />
            {candidates === null ? (
                <PageLoading label="Loading candidates" />
            ) : filtered.length === 0 ? (
                <p
                    className="py-6 text-center text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    No available {role === "STUDENT" ? "students" : "trainers"}.
                    {role === "STUDENT"
                        ? " Onboard students first from the Students page."
                        : " Onboard trainers first from the Trainers page."}
                </p>
            ) : (
                <ul
                    className="max-h-72 space-y-2 overflow-y-auto"
                    aria-busy={busy}
                >
                    {filtered.map((c) => (
                        <li
                            key={c.profileId}
                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            <div className="min-w-0">
                                <p
                                    className="truncate text-sm"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {c.fullName}
                                </p>
                                <p
                                    className="truncate text-xs"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {c.email ||
                                        c.enrollmentNumber ||
                                        c.specialization ||
                                        "—"}
                                </p>
                            </div>
                            <PrimaryButton
                                onClick={() => add(c.profileId)}
                                disabled={busy}
                            >
                                Add
                            </PrimaryButton>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
}

function RosterRow({ name, sub, onRemove }) {
    return (
        <li
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--dashboard-border)" }}
        >
            <div className="min-w-0">
                <p
                    className="truncate text-sm"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    {name || "—"}
                </p>
                <p
                    className="truncate text-xs"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {sub || "—"}
                </p>
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-semibold"
                style={{
                    borderColor: "var(--dashboard-border)",
                    color: "rgb(185, 28, 28)",
                    cursor: "pointer",
                }}
            >
                Remove
            </button>
        </li>
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
                className="mt-1 font-display text-base"
                style={{ color: "var(--dashboard-fg)" }}
            >
                {value}
            </dd>
        </div>
    );
}
