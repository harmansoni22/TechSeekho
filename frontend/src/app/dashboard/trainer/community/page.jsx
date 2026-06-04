"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createAnnouncement,
    fetchAnnouncements,
    fetchTrainerBatches,
} from "@/features/dashboard/api/trainerDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * TRAINER — Announcements (was "Community").
 *
 * Operational announcement workspace for batches the trainer teaches.
 * Reads from `GET /announcements?batchId=` (server-scoped via batch access
 * gate), writes through `POST /announcements` (institutionId server-derived
 * from the batch, authorId from the JWT).
 *
 * Why not full community: per the platform principle in CLAUDE.md, the
 * trainer surface stays operational. A general-purpose forum/threaded chat
 * would not belong here — it would live behind a different role.
 */

function formatTimestamp(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "—";
    }
}

export default function TrainerAnnouncementsPage() {
    const [batches, setBatches] = useState(null);
    const [announcements, setAnnouncements] = useState(null);
    const [batchFilter, setBatchFilter] = useState("");
    const [error, setError] = useState(null);
    const [composeOpen, setComposeOpen] = useState(false);

    // Initial: trainer batches.
    useEffect(() => {
        (async () => {
            try {
                const list = await fetchTrainerBatches();
                const arr = Array.isArray(list) ? list : [];
                setBatches(arr);
                setBatchFilter(arr[0]?.id ?? "");
            } catch (err) {
                setError(err?.message || "Unknown error");
            }
        })();
    }, []);

    const loadAnnouncements = useCallback(async () => {
        if (!batchFilter) {
            setAnnouncements([]);
            return;
        }
        try {
            const list = await fetchAnnouncements({
                batchId: batchFilter,
                limit: 50,
            });
            setAnnouncements(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err?.message || "Unknown error");
            setAnnouncements([]);
        }
    }, [batchFilter]);

    useEffect(() => {
        if (batches !== null) loadAnnouncements();
    }, [batches, loadAnnouncements]);

    const activeBatch = useMemo(
        () => (batches || []).find((b) => b.id === batchFilter),
        [batches, batchFilter],
    );

    if (error)
        return (
            <PageError
                title="Could not load announcements"
                message={error}
                onRetry={loadAnnouncements}
            />
        );
    if (batches === null) return <PageLoading label="Loading batches" />;

    if (batches.length === 0) {
        return (
            <div className="space-y-8">
                <RoleHero
                    eyebrow="Communication · Announcements"
                    title="Speak to your cohorts."
                    subtitle="Each announcement is scoped to one batch and is recorded permanently — treat it like an institutional bulletin."
                />
                <PageEmpty
                    title="No batches assigned to you yet"
                    description="An admin must add you to at least one batch before you can post announcements."
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Communication · Announcements"
                title="Speak to your cohorts."
                subtitle="Each announcement is scoped to one batch and is recorded permanently — treat it like an institutional bulletin."
                actions={
                    <button
                        type="button"
                        onClick={() => setComposeOpen((v) => !v)}
                        className="rounded-md px-3 py-2 text-xs font-semibold"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                            cursor: "pointer",
                        }}
                    >
                        {composeOpen ? "Close" : "New announcement"}
                    </button>
                }
            />

            <Panel
                eyebrow="Filter"
                title="Choose a batch"
                description="Only one batch at a time — announcements are batch-scoped at the schema level."
            >
                <label className="block text-sm">
                    <span
                        className="text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Batch
                    </span>
                    <select
                        value={batchFilter}
                        onChange={(e) => setBatchFilter(e.target.value)}
                        className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm sm:max-w-md"
                        style={inputStyle}
                    >
                        {batches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                                {b.course?.title ? ` — ${b.course.title}` : ""}
                            </option>
                        ))}
                    </select>
                </label>
            </Panel>

            {composeOpen && (
                <Compose
                    batch={activeBatch}
                    onCreated={() => {
                        setComposeOpen(false);
                        loadAnnouncements();
                    }}
                />
            )}

            {announcements === null ? (
                <PageLoading label="Loading announcements" />
            ) : announcements.length === 0 ? (
                <PageEmpty
                    title="No announcements for this batch yet"
                    description="Posts will appear here as soon as you or another instructor publishes one."
                />
            ) : (
                <Panel
                    eyebrow="Feed"
                    title={`${announcements.length} post${announcements.length === 1 ? "" : "s"}`}
                    description="Newest first."
                    padded={false}
                >
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {announcements.map((a) => (
                            <li key={a.id} className="px-6 py-4">
                                <p
                                    className="font-display text-base"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {a.title}
                                </p>
                                <p
                                    className="mt-0.5 text-[11px]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {a.author?.fullName || "Unknown"} ·{" "}
                                    {formatTimestamp(a.createdAt)}
                                </p>
                                {a.content && (
                                    <p
                                        className="mt-2 whitespace-pre-wrap text-sm"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {a.content}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </div>
    );
}

function Compose({ batch, onCreated }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState(null);

    async function submit(e) {
        e.preventDefault();
        if (!batch?.id) {
            setErr("Pick a batch first.");
            return;
        }
        if (!title.trim() || !content.trim()) {
            setErr("Title and content are required.");
            return;
        }
        setSubmitting(true);
        setErr(null);
        try {
            await createAnnouncement({
                batchId: batch.id,
                title: title.trim(),
                content: content.trim(),
            });
            setTitle("");
            setContent("");
            onCreated?.();
        } catch (e2) {
            setErr(e2?.message || "Failed to post");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Panel
            eyebrow="Compose"
            title={`New announcement for ${batch?.name || ""}`}
            description="Visible immediately to every student in this batch and to other instructors."
        >
            <form onSubmit={submit} className="space-y-4">
                <label className="block text-sm">
                    <span
                        className="text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Title
                    </span>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                        style={inputStyle}
                    />
                </label>
                <label className="block text-sm">
                    <span
                        className="text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Content
                    </span>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        required
                        className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                        style={inputStyle}
                    />
                </label>
                {err && (
                    <p className="text-sm" style={{ color: "#b91c1c" }}>
                        {err}
                    </p>
                )}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                            cursor: submitting ? "wait" : "pointer",
                        }}
                    >
                        {submitting ? "Posting…" : "Publish"}
                    </button>
                </div>
            </form>
        </Panel>
    );
}

const inputStyle = {
    borderColor: "var(--dashboard-border)",
    backgroundColor: "var(--dashboard-surface)",
    color: "var(--dashboard-fg)",
};
