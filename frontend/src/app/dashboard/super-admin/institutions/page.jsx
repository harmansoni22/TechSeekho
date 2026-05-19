"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * Super-admin: Institutions directory + creation.
 *
 * Backend contract (already implemented):
 *   GET  /api/admin/institutions          → list
 *   POST /api/admin/institutions          → create
 *
 * Both routes proxy to the backend using the Bearer access token from the
 * next-auth session. We always send the Authorization header explicitly and
 * never read the JWT from any other store.
 *
 * Form input is trimmed before submission. The server is the source of
 * truth for validation — client-side checks here are UX guardrails only.
 */

const INSTITUTION_TYPES = ["SCHOOL", "COLLEGE", "GOVERNMENT", "PRIVATE"];

const EMPTY_FORM = {
    name: "",
    type: "COLLEGE",
    city: "",
    state: "",
    contactEmail: "",
};

function formatDate(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

const InstitutionsPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [institutions, setInstitutions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const fetchInstitutions = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/admin/institutions", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (response.status === 401) {
                router.replace("/login");
                return;
            }
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(
                    body.error || `Request failed (${response.status})`,
                );
            }
            const result = await response.json();
            setInstitutions(Array.isArray(result) ? result : result.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, router]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }
        if (status === "authenticated") fetchInstitutions();
    }, [status, fetchInstitutions, router]);

    const filtered = useMemo(() => {
        if (!institutions) return [];
        const q = filter.trim().toLowerCase();
        return institutions.filter((i) => {
            if (typeFilter !== "ALL" && i.type !== typeFilter) return false;
            if (!q) return true;
            return [i.name, i.city, i.state, i.type]
                .filter(Boolean)
                .some((v) => v.toLowerCase().includes(q));
        });
    }, [institutions, filter, typeFilter]);

    async function handleCreate(e) {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        try {
            const response = await fetch("/api/admin/institutions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({
                    name: form.name.trim(),
                    type: form.type,
                    city: form.city.trim() || undefined,
                    state: form.state.trim() || undefined,
                    contactEmail: form.contactEmail.trim() || undefined,
                }),
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(
                    body.error || `Create failed (${response.status})`,
                );
            }
            setShowCreate(false);
            setForm(EMPTY_FORM);
            await fetchInstitutions();
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <PageLoading label="Loading institutions" />;
    if (error)
        return (
            <PageError
                title="Could not load institutions"
                message={error}
                onRetry={fetchInstitutions}
            />
        );

    const total = institutions?.length ?? 0;
    const active = (institutions ?? []).filter((i) => i.isActive).length;
    const typeCounts = (institutions ?? []).reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Network · Institutions"
                title="Every institution under one roof."
                subtitle="Charter and curate the partners that make TechSeekho possible. Every new institution becomes a node in the cohort graph — handle with care."
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
                        {showCreate ? "Close" : "New institution"}
                    </button>
                }
            />

            <section className="dash-reveal dash-reveal-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricStrip label="Total" value={total} />
                <MetricStrip label="Active" value={active} tone="accent" />
                <MetricStrip
                    label="Most common type"
                    value={topType(typeCounts)}
                />
                <MetricStrip
                    label="Regions covered"
                    value={countRegions(institutions)}
                />
            </section>

            {showCreate && (
                <Panel
                    eyebrow="New institution"
                    title="Charter a partner"
                    description="The institution will be created in an active state. You can deactivate later from the row menu."
                >
                    <form
                        onSubmit={handleCreate}
                        className="grid gap-4 sm:grid-cols-2"
                    >
                        <Field
                            label="Name *"
                            value={form.name}
                            onChange={(v) =>
                                setForm((f) => ({ ...f, name: v }))
                            }
                            required
                        />
                        <Field
                            label="Type *"
                            as="select"
                            options={INSTITUTION_TYPES}
                            value={form.type}
                            onChange={(v) =>
                                setForm((f) => ({ ...f, type: v }))
                            }
                        />
                        <Field
                            label="City"
                            value={form.city}
                            onChange={(v) =>
                                setForm((f) => ({ ...f, city: v }))
                            }
                        />
                        <Field
                            label="State"
                            value={form.state}
                            onChange={(v) =>
                                setForm((f) => ({ ...f, state: v }))
                            }
                        />
                        <Field
                            label="Contact email"
                            type="email"
                            value={form.contactEmail}
                            onChange={(v) =>
                                setForm((f) => ({ ...f, contactEmail: v }))
                            }
                            className="sm:col-span-2"
                        />
                        {submitError && (
                            <p
                                className="text-sm sm:col-span-2"
                                style={{ color: "#b91c1c" }}
                            >
                                {submitError}
                            </p>
                        )}
                        <div className="flex gap-2 sm:col-span-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                                style={{
                                    backgroundColor: "var(--role-accent)",
                                    color: "var(--role-accent-ink)",
                                }}
                            >
                                {submitting
                                    ? "Creating…"
                                    : "Create institution"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreate(false);
                                    setForm(EMPTY_FORM);
                                }}
                                className="rounded-md border px-4 py-2 text-sm font-medium"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    color: "var(--dashboard-fg)",
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Panel>
            )}

            <Panel
                eyebrow="Directory"
                title="All institutions"
                description={`${filtered.length} of ${total} showing`}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="rounded-md border px-3 py-1.5 text-xs"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                        >
                            <option value="ALL">All types</option>
                            {INSTITUTION_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <input
                            type="search"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
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
                padded={false}
            >
                {filtered.length === 0 ? (
                    <div className="px-6 py-10">
                        <PageEmpty
                            title="Nothing matches that filter"
                            description="Adjust search or type and try again."
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
                                        Name
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Type
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Location
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Batches
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Chartered
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((inst) => (
                                    <tr
                                        key={inst.id}
                                        className="border-t transition-colors hover:bg-[color-mix(in_srgb,var(--dashboard-surface)_94%,var(--role-accent)_6%)]"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <p
                                                className="font-display text-base"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {inst.name}
                                            </p>
                                        </td>
                                        <td
                                            className="px-3 py-4 text-xs uppercase tracking-wider"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {inst.type}
                                        </td>
                                        <td
                                            className="px-3 py-4"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {[inst.city, inst.state]
                                                .filter(Boolean)
                                                .join(", ") || "—"}
                                        </td>
                                        <td
                                            className="px-3 py-4"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {inst.batches?.length ??
                                                inst.batchCount ??
                                                0}
                                        </td>
                                        <td className="px-3 py-4">
                                            <ActivePill
                                                active={inst.isActive}
                                            />
                                        </td>
                                        <td
                                            className="px-6 py-4 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {formatDate(inst.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </div>
    );
};

// ─── small helpers ─────────────────────────────────────────────────────────

function topType(counts) {
    const entries = Object.entries(counts || {});
    if (entries.length === 0) return "—";
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
}

function countRegions(list) {
    if (!list) return 0;
    const set = new Set(list.map((i) => i.state).filter(Boolean));
    return set.size;
}

const MetricStrip = ({ label, value, tone }) => (
    <div
        className="rounded-xl border px-4 py-4"
        style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor:
                tone === "accent"
                    ? "color-mix(in srgb, var(--dashboard-surface) 88%, var(--role-accent) 12%)"
                    : "var(--dashboard-surface)",
        }}
    >
        <p
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </p>
        <p
            className="mt-2 font-display text-2xl"
            style={{
                color:
                    tone === "accent"
                        ? "var(--role-accent)"
                        : "var(--dashboard-fg)",
                fontWeight: 500,
            }}
        >
            {typeof value === "number"
                ? new Intl.NumberFormat().format(value)
                : value || "—"}
        </p>
    </div>
);

const ActivePill = ({ active }) => (
    <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{
            backgroundColor: active
                ? "rgba(16, 185, 129, 0.12)"
                : "rgba(148, 163, 184, 0.16)",
            color: active ? "#047857" : "var(--dashboard-muted)",
        }}
    >
        {active ? "Active" : "Inactive"}
    </span>
);

let _fieldIdCounter = 0;
const nextFieldId = () => `inst-field-${++_fieldIdCounter}`;

const Field = ({
    label,
    value,
    onChange,
    type = "text",
    as = "input",
    options = [],
    required = false,
    className = "",
}) => {
    const id = useMemoizedId();
    return (
        <div className={`block text-sm ${className}`}>
            <label
                htmlFor={id}
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </label>
            {as === "select" ? (
                <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="mt-1.5 w-full rounded-md border px-3 py-2"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--dashboard-surface)",
                        color: "var(--dashboard-fg)",
                    }}
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    id={id}
                    required={required}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="mt-1.5 w-full rounded-md border px-3 py-2"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--dashboard-surface)",
                        color: "var(--dashboard-fg)",
                    }}
                />
            )}
        </div>
    );
};

// Stable per-mount id so the label↔input pairing survives re-renders.
function useMemoizedId() {
    const ref = useRef(null);
    if (ref.current == null) ref.current = nextFieldId();
    return ref.current;
}

export default InstitutionsPage;
