"use client";

import {
    cloneElement,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useState,
} from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { api } from "@/lib/api";

const INSTITUTION_TYPES = ["SCHOOL", "COLLEGE", "GOVERNMENT", "PRIVATE"];

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

const inputStyle = {
    borderColor: "var(--dashboard-border)",
    backgroundColor: "var(--dashboard-surface)",
    color: "var(--dashboard-fg)",
};

export default function AdminInstitutionsPage() {
    const [institutions, setInstitutions] = useState(null);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");

    const load = useCallback(async () => {
        setError(null);
        try {
            const result = await api("/institutions");
            const list = Array.isArray(result?.data) ? result.data : [];
            setInstitutions(list);
            if (list.length && !selectedId) setSelectedId(list[0].id);
        } catch (err) {
            setError(err.message);
            setInstitutions([]);
        }
    }, [selectedId]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        if (!institutions) return [];
        const q = filter.trim().toLowerCase();
        return institutions.filter((i) => {
            if (typeFilter !== "ALL" && i.type !== typeFilter) return false;
            if (!q) return true;
            return [i.name, i.city, i.state, i.contactEmail, i.contactPhone]
                .filter(Boolean)
                .some((v) => v.toLowerCase().includes(q));
        });
    }, [institutions, filter, typeFilter]);

    const selected = useMemo(
        () => institutions?.find((i) => i.id === selectedId) ?? null,
        [institutions, selectedId],
    );

    if (institutions === null) {
        if (error)
            return (
                <PageError
                    title="Could not load institutions"
                    message={error}
                    onRetry={load}
                />
            );
        return <PageLoading label="Loading institutions" />;
    }

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Admin · Institutions"
                title="Manage the institutions you administer."
                subtitle="Edit details and toggle activation. Creation is restricted to super-admins; you only see institutions you have access to."
            />

            {institutions.length === 0 ? (
                <PageEmpty
                    title="No institutions in your scope"
                    description="Ask a super-admin to grant your role assignment an institution."
                />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <Panel
                        eyebrow="Directory"
                        title="Institutions"
                        description={`${filtered.length} of ${institutions.length}`}
                        padded={false}
                    >
                        <div
                            className="space-y-2 border-b px-5 py-3"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            <input
                                type="search"
                                placeholder="Search…"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full rounded-md border px-3 py-1.5 text-sm"
                                style={inputStyle}
                            />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full rounded-md border px-3 py-1.5 text-sm"
                                style={inputStyle}
                            >
                                <option value="ALL">All types</option>
                                {INSTITUTION_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <ul>
                            {filtered.map((i) => {
                                const active = i.id === selectedId;
                                return (
                                    <li key={i.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(i.id)}
                                            className="w-full border-b px-5 py-3 text-left"
                                            style={{
                                                borderColor:
                                                    "var(--dashboard-border)",
                                                backgroundColor: active
                                                    ? "color-mix(in srgb, var(--dashboard-surface) 90%, var(--role-accent) 10%)"
                                                    : "transparent",
                                            }}
                                        >
                                            <div
                                                className="font-display text-base"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {i.name}
                                            </div>
                                            <div
                                                className="mt-1 text-[11px] uppercase tracking-[0.18em]"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {i.type}
                                                {i.city ? ` · ${i.city}` : ""}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <ActivePill
                                                    active={i.isActive}
                                                />
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {i.batches?.length ?? 0}{" "}
                                                    batches
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </Panel>

                    {selected && (
                        <InstitutionDetail
                            key={selected.id}
                            institution={selected}
                            onSaved={load}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function ActivePill({ active }) {
    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
                backgroundColor: active
                    ? "rgba(16, 185, 129, 0.14)"
                    : "rgba(148, 163, 184, 0.16)",
                color: active ? "rgb(16, 185, 129)" : "var(--dashboard-muted)",
            }}
        >
            {active ? "Active" : "Inactive"}
        </span>
    );
}

function InstitutionDetail({ institution, onSaved }) {
    const [form, setForm] = useState(() => ({
        name: institution.name ?? "",
        type: institution.type ?? "COLLEGE",
        city: institution.city ?? "",
        state: institution.state ?? "",
        address: institution.address ?? "",
        contactEmail: institution.contactEmail ?? "",
        contactPhone: institution.contactPhone ?? "",
    }));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [ok, setOk] = useState(null);
    const [confirm, setConfirm] = useState(null); // "deactivate" | "activate" | null

    function set(field, value) {
        setForm((f) => ({ ...f, [field]: value }));
        setOk(null);
    }

    async function save(e) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setOk(null);
        try {
            await api(`/institutions/${institution.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    name: form.name.trim(),
                    type: form.type,
                    city: form.city.trim() || null,
                    state: form.state.trim() || null,
                    address: form.address.trim() || null,
                    contactEmail: form.contactEmail.trim() || null,
                    contactPhone: form.contactPhone.trim() || null,
                }),
            });
            setOk("Saved.");
            onSaved?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function toggleActive(nextActive) {
        setSubmitting(true);
        setError(null);
        setOk(null);
        try {
            await api(`/institutions/${institution.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    name: form.name.trim(),
                    type: form.type,
                    isActive: nextActive,
                }),
            });
            setConfirm(null);
            onSaved?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <Panel
                eyebrow="Snapshot"
                title={institution.name}
                description={`${institution.type}${
                    institution.city ? ` · ${institution.city}` : ""
                }${institution.state ? `, ${institution.state}` : ""}`}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <ActivePill active={institution.isActive} />
                        {institution.isActive ? (
                            <button
                                type="button"
                                onClick={() => setConfirm("deactivate")}
                                className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    color: "rgb(239, 68, 68)",
                                }}
                            >
                                Deactivate
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirm("activate")}
                                className="rounded-md px-3 py-1.5 text-xs font-semibold"
                                style={{
                                    backgroundColor: "var(--role-accent)",
                                    color: "var(--role-accent-ink)",
                                }}
                            >
                                Activate
                            </button>
                        )}
                    </div>
                }
            >
                <dl className="grid gap-4 sm:grid-cols-3">
                    <Meta
                        label="Chartered"
                        value={formatDate(institution.createdAt)}
                    />
                    <Meta
                        label="Last updated"
                        value={formatDate(institution.updatedAt)}
                    />
                    <Meta
                        label="Batches"
                        value={institution.batches?.length ?? 0}
                    />
                </dl>
            </Panel>

            <Panel
                eyebrow="Edit"
                title="Institution details"
                description="Saving applies immediately. Changes are scoped by the backend to institutions you have access to."
            >
                <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name *">
                        <input
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            required
                            className="mt-1.5 w-full rounded-md border px-3 py-2"
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="Type *">
                        <select
                            value={form.type}
                            onChange={(e) => set("type", e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2"
                            style={inputStyle}
                        >
                            {INSTITUTION_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="City">
                        <input
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2"
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="State">
                        <input
                            value={form.state}
                            onChange={(e) => set("state", e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2"
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="Address" className="sm:col-span-2">
                        <input
                            value={form.address}
                            onChange={(e) => set("address", e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2"
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="Contact email">
                        <input
                            type="email"
                            value={form.contactEmail}
                            onChange={(e) =>
                                set("contactEmail", e.target.value)
                            }
                            className="mt-1.5 w-full rounded-md border px-3 py-2"
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="Contact phone">
                        <input
                            value={form.contactPhone}
                            onChange={(e) =>
                                set("contactPhone", e.target.value)
                            }
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
                    {ok && (
                        <p
                            className="text-sm sm:col-span-2"
                            style={{ color: "#047857" }}
                        >
                            {ok}
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
                            {submitting ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                </form>
            </Panel>

            {confirm && (
                <ConfirmDialog
                    title={
                        confirm === "deactivate"
                            ? "Deactivate institution?"
                            : "Activate institution?"
                    }
                    message={
                        confirm === "deactivate"
                            ? `"${institution.name}" will be marked inactive. Existing batches and rosters remain, but the institution will be hidden from operational lists.`
                            : `"${institution.name}" will be made active again and visible to its assigned staff.`
                    }
                    confirmLabel={
                        confirm === "deactivate" ? "Deactivate" : "Activate"
                    }
                    destructive={confirm === "deactivate"}
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => toggleActive(confirm === "activate")}
                    busy={submitting}
                />
            )}
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

function Field({ label, children, className = "" }) {
    const controlId = useId();
    return (
        <label htmlFor={controlId} className={`block text-sm ${className}`}>
            <span
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </span>
            {cloneElement(children, { id: controlId })}
        </label>
    );
}

function ConfirmDialog({
    title,
    message,
    confirmLabel,
    destructive,
    onCancel,
    onConfirm,
    busy,
}) {
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape") onCancel();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
                type="button"
                aria-label="Dismiss dialog"
                onClick={onCancel}
                className="absolute inset-0 h-full w-full cursor-default border-0"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            />
            <div
                className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border"
                role="dialog"
                aria-modal="true"
                style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                }}
            >
                <header
                    className="border-b px-6 py-4"
                    style={{ borderColor: "var(--dashboard-border)" }}
                >
                    <h2
                        className="font-display text-lg"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {title}
                    </h2>
                </header>
                <div className="px-6 py-4">
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {message}
                    </p>
                </div>
                <div
                    className="flex justify-end gap-2 border-t px-6 py-4"
                    style={{ borderColor: "var(--dashboard-border)" }}
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-md border px-4 py-2 text-sm font-semibold"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                        style={{
                            backgroundColor: destructive
                                ? "rgb(239, 68, 68)"
                                : "var(--role-accent)",
                            color: destructive
                                ? "white"
                                : "var(--role-accent-ink)",
                        }}
                    >
                        {busy ? "Working…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
