"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Field,
    FormMessage,
    GhostButton,
    inputStyle,
    Modal,
    Pill,
    PrimaryButton,
} from "@/features/dashboard/admin/adminShared";
import {
    createBatch,
    fetchBatches,
    fetchCourses,
    fetchInstitutions,
} from "@/features/dashboard/api/adminDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import BatchDetail from "./_components/BatchDetail";

export default function AdminBatchesPage() {
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState(null);
    const [error, setError] = useState(null);
    const [institutionFilter, setInstitutionFilter] = useState("ALL");
    const [selectedId, setSelectedId] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        try {
            const [batchRes, instRes, courseRes] = await Promise.all([
                fetchBatches(),
                fetchInstitutions(),
                fetchCourses(),
            ]);
            const list = Array.isArray(batchRes) ? batchRes : [];
            setBatches(list);
            setInstitutions(Array.isArray(instRes) ? instRes : []);
            setCourses(Array.isArray(courseRes) ? courseRes : []);
            setSelectedId((prev) =>
                prev && list.some((b) => b.id === prev)
                    ? prev
                    : (list[0]?.id ?? null),
            );
        } catch (err) {
            setError(err.message);
            setBatches([]);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const list = batches ?? [];
        if (institutionFilter === "ALL") return list;
        return list.filter((b) => b.institution?.id === institutionFilter);
    }, [batches, institutionFilter]);

    if (batches === null) {
        if (error)
            return (
                <PageError
                    title="Couldn't load batches"
                    message={error}
                    onRetry={load}
                />
            );
        return <PageLoading label="Loading batches" />;
    }

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Operations · Batches"
                title="The cohorts you run."
                subtitle="Create batches, staff them with trainers, place students, and track delivery. Each batch is scoped to one institution and one course."
                actions={
                    institutions.length > 0 ? (
                        <PrimaryButton onClick={() => setShowCreate(true)}>
                            Create batch
                        </PrimaryButton>
                    ) : null
                }
            />

            {institutions.length === 0 ? (
                <PageEmpty
                    title="No institution in your scope"
                    description="Ask a super-admin to assign your ADMIN role an institution before creating batches."
                />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                    <Panel
                        eyebrow="Directory"
                        title="Batches"
                        description={`${filtered.length} of ${batches.length}`}
                        padded={false}
                    >
                        {institutions.length > 1 && (
                            <div
                                className="border-b px-5 py-3"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                <select
                                    value={institutionFilter}
                                    onChange={(e) =>
                                        setInstitutionFilter(e.target.value)
                                    }
                                    className="w-full rounded-md border px-3 py-1.5 text-sm"
                                    style={inputStyle}
                                >
                                    <option value="ALL">
                                        All institutions
                                    </option>
                                    {institutions.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {filtered.length === 0 ? (
                            <div className="px-5 py-8">
                                <PageEmpty title="No batches yet" />
                            </div>
                        ) : (
                            <ul>
                                {filtered.map((b) => {
                                    const active = b.id === selectedId;
                                    return (
                                        <li key={b.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedId(b.id)
                                                }
                                                className="w-full border-b px-5 py-3 text-left"
                                                style={{
                                                    borderColor:
                                                        "var(--dashboard-border)",
                                                    backgroundColor: active
                                                        ? "color-mix(in srgb, var(--dashboard-surface) 90%, var(--role-accent) 10%)"
                                                        : "transparent",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <div
                                                    className="font-display text-base"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {b.name}
                                                </div>
                                                <div
                                                    className="mt-1 text-[11px] uppercase tracking-[0.18em]"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {b.course?.title ?? "—"}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Pill
                                                        tone={
                                                            b.isActive
                                                                ? "success"
                                                                : "muted"
                                                        }
                                                    >
                                                        {b.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </Pill>
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: "var(--dashboard-muted)",
                                                        }}
                                                    >
                                                        {b._count?.students ??
                                                            0}{" "}
                                                        students
                                                    </span>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>

                    {selectedId ? (
                        <BatchDetail
                            key={selectedId}
                            batchId={selectedId}
                            onChanged={load}
                        />
                    ) : (
                        <PageEmpty title="Select a batch to view its detail" />
                    )}
                </div>
            )}

            {showCreate && (
                <CreateBatchModal
                    institutions={institutions}
                    courses={courses}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => {
                        setShowCreate(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function CreateBatchModal({ institutions, courses, onClose, onCreated }) {
    const [form, setForm] = useState({
        name: "",
        institutionId: institutions[0]?.id ?? "",
        courseId: courses[0]?.id ?? "",
        startDate: "",
        endDate: "",
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
            await createBatch({
                name: form.name.trim(),
                institutionId: form.institutionId,
                courseId: form.courseId,
                startDate: new Date(form.startDate).toISOString(),
                endDate: form.endDate
                    ? new Date(form.endDate).toISOString()
                    : undefined,
            });
            onCreated();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    const valid =
        form.name.trim() &&
        form.institutionId &&
        form.courseId &&
        form.startDate;

    return (
        <Modal
            title="Create a batch"
            description="A batch belongs to one institution and runs one course."
            onClose={onClose}
            footer={
                <>
                    <GhostButton onClick={onClose} disabled={busy}>
                        Cancel
                    </GhostButton>
                    <PrimaryButton onClick={submit} disabled={busy || !valid}>
                        {busy ? "Creating…" : "Create batch"}
                    </PrimaryButton>
                </>
            }
        >
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Batch name *" className="sm:col-span-2">
                    <input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Institution *">
                    <select
                        value={form.institutionId}
                        onChange={(e) => set("institutionId", e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    >
                        {institutions.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Course *">
                    <select
                        value={form.courseId}
                        onChange={(e) => set("courseId", e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    >
                        <option value="">Select a course…</option>
                        {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.title}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Start date *">
                    <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => set("startDate", e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="End date">
                    <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => set("endDate", e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <div className="sm:col-span-2">
                    <FormMessage error={error} />
                </div>
            </form>
        </Modal>
    );
}
