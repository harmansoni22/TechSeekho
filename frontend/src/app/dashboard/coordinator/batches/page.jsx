"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { api } from "@/lib/api";

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

export default function CoordinatorBatchesPage() {
    const [batches, setBatches] = useState(null);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const loadBatches = useCallback(async () => {
        setError(null);
        try {
            const result = await api("/batches");
            const list = Array.isArray(result?.data) ? result.data : [];
            setBatches(list);
            if (list.length && !selectedId) {
                setSelectedId(list[0].id);
            }
        } catch (err) {
            setError(err.message);
            setBatches([]);
        }
    }, [selectedId]);

    useEffect(() => {
        loadBatches();
    }, [loadBatches]);

    if (batches === null) return <PageLoading label="Loading batches" />;
    if (error)
        return (
            <PageError
                title="Could not load batches"
                message={error}
                onRetry={loadBatches}
            />
        );

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Operations · Batches"
                title="Batches you run."
                subtitle="Manage rosters, trainers, and dates. Mutations are scoped to your institution by the backend — you cannot touch batches outside your access."
            />

            {batches.length === 0 ? (
                <PageEmpty
                    title="No batches assigned"
                    description="No batches are visible under your institution scope yet."
                />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <BatchList
                        batches={batches}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                    {selectedId && (
                        <BatchDetail
                            batchId={selectedId}
                            onChanged={loadBatches}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function BatchList({ batches, selectedId, onSelect }) {
    return (
        <Panel
            eyebrow="Directory"
            title="All batches"
            description={`${batches.length} total`}
            padded={false}
        >
            <ul>
                {batches.map((b) => {
                    const active = b.id === selectedId;
                    return (
                        <li key={b.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(b.id)}
                                className="w-full border-b px-5 py-3 text-left"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor: active
                                        ? "color-mix(in srgb, var(--dashboard-surface) 90%, var(--role-accent) 10%)"
                                        : "transparent",
                                }}
                            >
                                <div
                                    className="font-display text-base"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {b.name}
                                </div>
                                <div
                                    className="mt-1 text-[11px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {b.institution?.name ?? "—"} ·{" "}
                                    {b.course?.title ?? "—"}
                                </div>
                                <div
                                    className="mt-1 text-xs"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {b._count?.students ?? 0} students ·{" "}
                                    {b._count?.trainers ?? 0} trainers
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </Panel>
    );
}

function BatchDetail({ batchId, onChanged }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await api(`/batches/${batchId}`);
            setDetail(result?.data ?? null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [batchId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <PageLoading label="Loading batch" />;
    if (error)
        return (
            <PageError
                title="Could not load batch"
                message={error}
                onRetry={load}
            />
        );
    if (!detail) return null;

    return (
        <div className="space-y-6">
            <Panel
                eyebrow="Batch"
                title={detail.name}
                description={`${detail.institution?.name ?? ""} · ${detail.course?.title ?? ""}`}
            >
                <dl className="grid gap-4 sm:grid-cols-3 text-sm">
                    <Meta
                        label="Start date"
                        value={formatDate(detail.startDate)}
                    />
                    <Meta label="End date" value={formatDate(detail.endDate)} />
                    <Meta
                        label="Status"
                        value={detail.isActive ? "Active" : "Inactive"}
                    />
                </dl>
            </Panel>

            <TrainersPanel
                batch={detail}
                onChanged={() => {
                    load();
                    onChanged?.();
                }}
            />

            <StudentsPanel
                batch={detail}
                onChanged={() => {
                    load();
                    onChanged?.();
                }}
            />
        </div>
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

function TrainersPanel({ batch, onChanged }) {
    const [members, setMembers] = useState(null);
    const [picker, setPicker] = useState("");
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);

    const loadMembers = useCallback(async () => {
        setError(null);
        try {
            const result = await api(
                `/institutions/${batch.institutionId}/members?role=TRAINER`,
            );
            setMembers(Array.isArray(result?.data) ? result.data : []);
        } catch (err) {
            setError(err.message);
            setMembers([]);
        }
    }, [batch.institutionId]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    const assigned = batch.trainers || [];
    const assignedIds = useMemo(
        () => new Set(assigned.map((bt) => bt.trainer.id)),
        [assigned],
    );
    const candidates = useMemo(
        () =>
            (members ?? []).filter(
                (m) => m.profileId && !assignedIds.has(m.profileId),
            ),
        [members, assignedIds],
    );

    async function assign() {
        if (!picker) return;
        setBusy("assign");
        setError(null);
        try {
            await api(`/batches/${batch.id}/trainers`, {
                method: "POST",
                body: JSON.stringify({ trainerId: picker }),
            });
            setPicker("");
            await loadMembers();
            onChanged?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(null);
        }
    }

    async function remove(trainerId) {
        if (!confirm("Remove this trainer from the batch?")) return;
        setBusy(`remove:${trainerId}`);
        setError(null);
        try {
            await api(`/batches/${batch.id}/trainers/${trainerId}`, {
                method: "DELETE",
            });
            onChanged?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(null);
        }
    }

    return (
        <Panel
            eyebrow="Roster"
            title="Trainers"
            description={`${assigned.length} assigned`}
            padded={false}
        >
            <div className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={picker}
                        onChange={(e) => setPicker(e.target.value)}
                        className="rounded-md border px-3 py-2 text-sm"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            backgroundColor: "var(--dashboard-surface)",
                            color: "var(--dashboard-fg)",
                        }}
                    >
                        <option value="">Add trainer…</option>
                        {candidates.map((m) => (
                            <option key={m.profileId} value={m.profileId}>
                                {m.fullName} {m.email ? `(${m.email})` : ""}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={assign}
                        disabled={!picker || busy === "assign"}
                        className="rounded-md px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                        }}
                    >
                        {busy === "assign" ? "Adding…" : "Add"}
                    </button>
                    {error && (
                        <span className="text-xs" style={{ color: "#b91c1c" }}>
                            {error}
                        </span>
                    )}
                </div>
            </div>

            {assigned.length === 0 ? (
                <div className="px-6 pb-6">
                    <PageEmpty
                        title="No trainers"
                        description="Add a trainer above."
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
                                <th className="px-3 py-3 font-medium">Email</th>
                                <th className="px-3 py-3 font-medium">
                                    Specialization
                                </th>
                                <th className="px-6 py-3 font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {assigned.map((bt) => {
                                const tid = bt.trainer.id;
                                return (
                                    <tr
                                        key={tid}
                                        className="border-t"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td
                                            className="px-6 py-3"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {bt.trainer.user?.fullName ?? "—"}
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {bt.trainer.user?.email ?? "—"}
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {bt.trainer.specialization ?? "—"}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => remove(tid)}
                                                disabled={
                                                    busy === `remove:${tid}`
                                                }
                                                className="rounded-md border px-3 py-1 text-xs font-semibold"
                                                style={{
                                                    borderColor:
                                                        "var(--dashboard-border)",
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {busy === `remove:${tid}`
                                                    ? "Removing…"
                                                    : "Remove"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Panel>
    );
}

function StudentsPanel({ batch, onChanged }) {
    const [members, setMembers] = useState(null);
    const [picker, setPicker] = useState("");
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);

    const loadMembers = useCallback(async () => {
        setError(null);
        try {
            const result = await api(
                `/institutions/${batch.institutionId}/members?role=STUDENT`,
            );
            setMembers(Array.isArray(result?.data) ? result.data : []);
        } catch (err) {
            setError(err.message);
            setMembers([]);
        }
    }, [batch.institutionId]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    const assigned = batch.students || [];
    const assignedIds = useMemo(
        () => new Set(assigned.map((s) => s.id)),
        [assigned],
    );
    const candidates = useMemo(
        () =>
            (members ?? []).filter(
                (m) =>
                    m.profileId &&
                    !assignedIds.has(m.profileId) &&
                    m.currentBatchId !== batch.id,
            ),
        [members, assignedIds, batch.id],
    );

    async function assign() {
        if (!picker) return;
        setBusy("assign");
        setError(null);
        try {
            await api(`/batches/${batch.id}/students`, {
                method: "POST",
                body: JSON.stringify({ studentId: picker }),
            });
            setPicker("");
            await loadMembers();
            onChanged?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(null);
        }
    }

    async function remove(studentId) {
        if (
            !confirm(
                "Remove this student from the batch? The student's current batch will be cleared.",
            )
        )
            return;
        setBusy(`remove:${studentId}`);
        setError(null);
        try {
            await api(`/batches/${batch.id}/students/${studentId}`, {
                method: "DELETE",
            });
            onChanged?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(null);
        }
    }

    return (
        <Panel
            eyebrow="Roster"
            title="Students"
            description={`${assigned.length} assigned`}
            padded={false}
        >
            <div className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={picker}
                        onChange={(e) => setPicker(e.target.value)}
                        className="rounded-md border px-3 py-2 text-sm"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            backgroundColor: "var(--dashboard-surface)",
                            color: "var(--dashboard-fg)",
                        }}
                    >
                        <option value="">Add student…</option>
                        {candidates.map((m) => (
                            <option key={m.profileId} value={m.profileId}>
                                {m.fullName}{" "}
                                {m.enrollmentNumber
                                    ? `(${m.enrollmentNumber})`
                                    : ""}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={assign}
                        disabled={!picker || busy === "assign"}
                        className="rounded-md px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                        }}
                    >
                        {busy === "assign" ? "Adding…" : "Add"}
                    </button>
                    {error && (
                        <span className="text-xs" style={{ color: "#b91c1c" }}>
                            {error}
                        </span>
                    )}
                </div>
            </div>

            {assigned.length === 0 ? (
                <div className="px-6 pb-6">
                    <PageEmpty
                        title="No students"
                        description="Add a student above."
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
                                <th className="px-3 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {assigned.map((s) => (
                                <tr
                                    key={s.id}
                                    className="border-t"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <td
                                        className="px-6 py-3"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {s.user?.fullName ?? "—"}
                                    </td>
                                    <td
                                        className="px-3 py-3 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {s.enrollmentNumber ?? "—"}
                                    </td>
                                    <td
                                        className="px-3 py-3 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {s.user?.email ?? "—"}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => remove(s.id)}
                                            disabled={busy === `remove:${s.id}`}
                                            className="rounded-md border px-3 py-1 text-xs font-semibold"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {busy === `remove:${s.id}`
                                                ? "Removing…"
                                                : "Remove"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Panel>
    );
}
