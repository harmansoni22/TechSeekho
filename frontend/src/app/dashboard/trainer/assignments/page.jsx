"use client";

import Link from "next/link";
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

function dueState(assignment) {
    if (!assignment.dueDate) return { label: "No due date", tone: "muted" };
    const due = new Date(assignment.dueDate);
    if (Number.isNaN(due.getTime()))
        return { label: "Invalid date", tone: "muted" };
    const now = new Date();
    if (due < now) return { label: "Overdue", tone: "danger" };
    const diffDays = Math.ceil((due - now) / 86_400_000);
    if (diffDays <= 2) return { label: `${diffDays}d left`, tone: "warn" };
    return { label: `${diffDays}d left`, tone: "ok" };
}

function toneColor(tone) {
    switch (tone) {
        case "danger":
            return "rgb(239, 68, 68)";
        case "warn":
            return "rgb(217, 119, 6)";
        case "ok":
            return "rgb(16, 185, 129)";
        default:
            return "var(--dashboard-muted)";
    }
}

export default function TrainerAssignmentsPage() {
    const [batches, setBatches] = useState(null);
    const [assignments, setAssignments] = useState(null);
    const [error, setError] = useState(null);

    const [showCreate, setShowCreate] = useState(false);

    const loadAll = useCallback(async () => {
        setError(null);
        try {
            const [batchRes, assignmentRes] = await Promise.all([
                api("/batches"),
                api("/assignments"),
            ]);
            setBatches(Array.isArray(batchRes?.data) ? batchRes.data : []);
            setAssignments(
                Array.isArray(assignmentRes?.data) ? assignmentRes.data : [],
            );
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    if (batches === null || assignments === null) {
        if (error)
            return (
                <PageError
                    title="Could not load"
                    message={error}
                    onRetry={loadAll}
                />
            );
        return <PageLoading label="Loading assignments" />;
    }

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Operations · Assignments"
                title="Set the work, track who turns it in."
                subtitle="Create assignments for batches you teach. The backend derives the institution from the batch — you cannot create work in batches outside your scope."
                actions={
                    <button
                        type="button"
                        onClick={() => setShowCreate((v) => !v)}
                        className="rounded-md px-3 py-2 text-xs font-semibold"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                        }}
                    >
                        {showCreate ? "Close" : "New assignment"}
                    </button>
                }
            />

            {showCreate && (
                <CreateAssignment
                    batches={batches}
                    onCreated={() => {
                        setShowCreate(false);
                        loadAll();
                    }}
                />
            )}

            <AssignmentList assignments={assignments} />
        </div>
    );
}

function CreateAssignment({ batches, onCreated }) {
    const teachableBatches = useMemo(
        () => batches.filter((b) => b.isActive !== false),
        [batches],
    );

    const [batchId, setBatchId] = useState(teachableBatches[0]?.id ?? "");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const courseId = useMemo(
        () => batches.find((b) => b.id === batchId)?.course?.id ?? null,
        [batches, batchId],
    );

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        if (!batchId || !courseId) {
            setError("Choose a batch first.");
            return;
        }
        if (!title.trim()) {
            setError("Title is required.");
            return;
        }

        setSubmitting(true);
        try {
            await api("/assignments", {
                method: "POST",
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    batchId,
                    courseId,
                    dueDate: dueDate || undefined,
                }),
            });
            setTitle("");
            setDescription("");
            setDueDate("");
            onCreated?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (teachableBatches.length === 0) {
        return (
            <PageEmpty
                title="No batches available"
                description="You must be assigned to at least one batch before you can create assignments."
            />
        );
    }

    return (
        <Panel
            eyebrow="New assignment"
            title="Create work for a batch"
            description="The assignment is scoped to the batch and visible only to its students and trainers."
        >
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Title *">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Batch *">
                    <select
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    >
                        {teachableBatches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name} — {b.course?.title ?? "—"}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Due date">
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                {error && (
                    <p
                        className="text-sm sm:col-span-2"
                        style={{ color: "#b91c1c" }}
                    >
                        {error}
                    </p>
                )}
                <div className="sm:col-span-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                        }}
                    >
                        {submitting ? "Creating…" : "Create assignment"}
                    </button>
                </div>
            </form>
        </Panel>
    );
}

function AssignmentList({ assignments }) {
    if (assignments.length === 0) {
        return (
            <PageEmpty
                title="No assignments yet"
                description="Create one for a batch you teach."
            />
        );
    }

    return (
        <Panel
            eyebrow="Directory"
            title="All assignments"
            description={`${assignments.length} total`}
            padded={false}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr
                            className="text-[10px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            <th className="px-6 py-3 font-medium">Title</th>
                            <th className="px-3 py-3 font-medium">Batch</th>
                            <th className="px-3 py-3 font-medium">Course</th>
                            <th className="px-3 py-3 font-medium">Due</th>
                            <th className="px-6 py-3 font-medium">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map((a) => {
                            const due = dueState(a);
                            return (
                                <tr
                                    key={a.id}
                                    className="border-t"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <td
                                        className="px-6 py-3"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        <Link
                                            href={`/dashboard/trainer/assignments/${a.id}`}
                                            className="font-display text-base hover:underline"
                                        >
                                            {a.title}
                                        </Link>
                                        {a.description && (
                                            <div
                                                className="mt-1 line-clamp-2 text-xs"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {a.description}
                                            </div>
                                        )}
                                    </td>
                                    <td
                                        className="px-3 py-3 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.batch?.name ?? "—"}
                                    </td>
                                    <td
                                        className="px-3 py-3 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.course?.title ?? "—"}
                                    </td>
                                    <td className="px-3 py-3 text-xs">
                                        <div
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {formatDate(a.dueDate)}
                                        </div>
                                        <div
                                            style={{
                                                color: toneColor(due.tone),
                                            }}
                                        >
                                            {due.label}
                                        </div>
                                    </td>
                                    <td
                                        className="px-6 py-3 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {formatDate(a.createdAt)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}

// Field wraps a labelled control. Use a div + paragraph for the heading so
// Biome's noLabelWithoutControl doesn't trip on the implicit child input
// (children render their own form control).
function Field({ label, children, className = "" }) {
    return (
        <div className={`block text-sm ${className}`}>
            <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </p>
            {children}
        </div>
    );
}

const inputStyle = {
    borderColor: "var(--dashboard-border)",
    backgroundColor: "var(--dashboard-surface)",
    color: "var(--dashboard-fg)",
};
