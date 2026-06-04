"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Field,
    FormMessage,
    formatDateTime,
    GhostButton,
    inputStyle,
    Modal,
    Pill,
    PrimaryButton,
} from "@/features/dashboard/admin/adminShared";
import {
    createAnnouncement,
    fetchAnnouncements,
    fetchBatches,
    fetchInstitutions,
} from "@/features/dashboard/api/adminDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

export default function AdminAnnouncementsPage() {
    const [items, setItems] = useState(null);
    const [batches, setBatches] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [error, setError] = useState(null);
    const [showCompose, setShowCompose] = useState(false);
    const [batchFilter, setBatchFilter] = useState("ALL");

    const load = useCallback(async () => {
        setError(null);
        try {
            const [annRes, batchRes, instRes] = await Promise.all([
                fetchAnnouncements(),
                fetchBatches(),
                fetchInstitutions(),
            ]);
            setItems(Array.isArray(annRes) ? annRes : []);
            setBatches(Array.isArray(batchRes) ? batchRes : []);
            setInstitutions(Array.isArray(instRes) ? instRes : []);
        } catch (err) {
            setError(err.message);
            setItems([]);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const list = items ?? [];
        if (batchFilter === "ALL") return list;
        return list.filter((a) => a.batch?.id === batchFilter);
    }, [items, batchFilter]);

    if (error)
        return (
            <PageError
                title="Couldn't load announcements"
                message={error}
                onRetry={load}
            />
        );
    if (items === null) return <PageLoading label="Loading announcements" />;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Operations · Announcements"
                title="Speak to your institution."
                subtitle="Post operational updates to a single batch or broadcast across the whole institution. Every post is attributed to you and visible to that batch's students and trainers."
                actions={
                    batches.length > 0 ? (
                        <PrimaryButton onClick={() => setShowCompose(true)}>
                            New announcement
                        </PrimaryButton>
                    ) : null
                }
            />

            {batches.length === 0 ? (
                <PageEmpty
                    title="No batches to announce to"
                    description="Create a batch first — announcements are always scoped to a batch."
                />
            ) : (
                <Panel
                    eyebrow="Feed"
                    title={`${filtered.length} announcement${filtered.length === 1 ? "" : "s"}`}
                    padded={false}
                    actions={
                        <select
                            value={batchFilter}
                            onChange={(e) => setBatchFilter(e.target.value)}
                            className="rounded-md border px-3 py-1.5 text-xs"
                            style={inputStyle}
                        >
                            <option value="ALL">All batches</option>
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    }
                >
                    {filtered.length === 0 ? (
                        <div className="px-6 py-8">
                            <PageEmpty
                                title="No announcements yet"
                                description="Post your first update with the button above."
                            />
                        </div>
                    ) : (
                        <ul
                            className="divide-y"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {filtered.map((a) => (
                                <li key={a.id} className="px-6 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <p
                                            className="font-display text-base"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {a.title}
                                        </p>
                                        <Pill tone="accent">
                                            {a.batch?.name ?? "—"}
                                        </Pill>
                                    </div>
                                    <p
                                        className="mt-2 whitespace-pre-line text-sm leading-relaxed"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {a.content}
                                    </p>
                                    <p
                                        className="mt-2 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.author?.fullName ?? "—"} ·{" "}
                                        {formatDateTime(a.createdAt)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            )}

            {showCompose && (
                <ComposeModal
                    batches={batches}
                    institutions={institutions}
                    onClose={() => setShowCompose(false)}
                    onPosted={() => {
                        setShowCompose(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function ComposeModal({ batches, institutions, onClose, onPosted }) {
    const [mode, setMode] = useState("batch"); // "batch" | "institution"
    const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
    const [institutionId, setInstitutionId] = useState(
        institutions[0]?.id ?? "",
    );
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const institutionBatches = batches.filter(
        (b) => b.institution?.id === institutionId,
    );

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const targets =
                mode === "batch"
                    ? [batchId]
                    : institutionBatches.map((b) => b.id);
            if (targets.length === 0) {
                throw new Error("No batches to post to in that scope.");
            }
            // Announcements are per-batch in the schema; an institution-wide post
            // is a fan-out across every batch in that institution.
            for (const id of targets) {
                await createAnnouncement({
                    title: title.trim(),
                    content: content.trim(),
                    batchId: id,
                });
            }
            onPosted();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    const valid =
        title.trim() &&
        content.trim() &&
        (mode === "batch" ? Boolean(batchId) : institutionBatches.length > 0);

    return (
        <Modal
            title="New announcement"
            description="Post to one batch, or broadcast to every batch in an institution."
            onClose={onClose}
            footer={
                <>
                    <GhostButton onClick={onClose} disabled={busy}>
                        Cancel
                    </GhostButton>
                    <PrimaryButton onClick={submit} disabled={busy || !valid}>
                        {busy
                            ? "Posting…"
                            : mode === "institution"
                              ? `Broadcast to ${institutionBatches.length} batch(es)`
                              : "Post"}
                    </PrimaryButton>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <div
                    className="flex gap-1 rounded-lg border p-1"
                    style={{ borderColor: "var(--dashboard-border)" }}
                >
                    <ModeTab
                        active={mode === "batch"}
                        onClick={() => setMode("batch")}
                        label="Single batch"
                    />
                    <ModeTab
                        active={mode === "institution"}
                        onClick={() => setMode("institution")}
                        label="Whole institution"
                    />
                </div>

                {mode === "batch" ? (
                    <Field label="Batch *">
                        <select
                            value={batchId}
                            onChange={(e) => setBatchId(e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2"
                            style={inputStyle}
                        >
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                    {b.institution?.name
                                        ? ` · ${b.institution.name}`
                                        : ""}
                                </option>
                            ))}
                        </select>
                    </Field>
                ) : (
                    <Field
                        label="Institution *"
                        hint={`${institutionBatches.length} batch(es) will receive this post`}
                    >
                        <select
                            value={institutionId}
                            onChange={(e) => setInstitutionId(e.target.value)}
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
                )}

                <Field label="Title *">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={255}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <Field label="Message *">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={5}
                        maxLength={10000}
                        className="mt-1.5 w-full rounded-md border px-3 py-2"
                        style={inputStyle}
                    />
                </Field>
                <FormMessage error={error} />
            </form>
        </Modal>
    );
}

function ModeTab({ active, onClick, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex-1 rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{
                backgroundColor: active ? "var(--role-accent)" : "transparent",
                color: active
                    ? "var(--role-accent-ink)"
                    : "var(--dashboard-muted)",
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}
