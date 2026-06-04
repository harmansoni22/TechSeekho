"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    fetchAssignmentDetail,
    reviewSubmission,
} from "@/features/dashboard/api/trainerDashboard.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

/**
 * TRAINER — Assignment detail.
 *
 * Reads from `GET /assignments/:id` which already includes the submission
 * roster scoped by the trainer's batch access. Per-row review writes through
 * `PATCH /assignments/submissions/:id/review` — audited and locked to
 * trainers who manage the batch.
 *
 * Decisions:
 *  - No new endpoint introduced — this is a fan-in detail page over the
 *    existing assignment + submission contracts.
 *  - The review dialog is inline (no modal) to keep keyboard navigation
 *    predictable; clicking another row collapses the previous one.
 */

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

const STATUS_TONE = {
    PENDING: {
        fg: "var(--dashboard-muted)",
        bg: "rgba(148, 163, 184, 0.16)",
    },
    SUBMITTED: { fg: "#92400e", bg: "rgba(217, 119, 6, 0.14)" },
    REVIEWED: { fg: "#047857", bg: "rgba(16, 185, 129, 0.14)" },
};

export default function TrainerAssignmentDetailPage() {
    const params = useParams();
    const id = params?.id;

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openId, setOpenId] = useState(null);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const a = await fetchAssignmentDetail(id);
            setAssignment(a);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const submissions = useMemo(
        () =>
            Array.isArray(assignment?.submissions)
                ? assignment.submissions
                : [],
        [assignment],
    );

    const counts = useMemo(() => {
        const acc = { SUBMITTED: 0, REVIEWED: 0, PENDING: 0 };
        for (const s of submissions) {
            if (acc[s.status] != null) acc[s.status] += 1;
        }
        return acc;
    }, [submissions]);

    if (loading) return <PageLoading label="Loading assignment" />;
    if (error)
        return (
            <PageError
                title="Could not load assignment"
                message={error}
                onRetry={load}
            />
        );
    if (!assignment)
        return (
            <PageEmpty
                title="Assignment not found"
                description="It may have been deleted or moved to a batch you no longer manage."
            />
        );

    const dueLabel = assignment.dueDate
        ? formatDate(assignment.dueDate)
        : "No due date";

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow={`Assignment · ${assignment.batch?.name || ""}`}
                title={assignment.title}
                subtitle={`${assignment.course?.title || ""} · Due ${dueLabel}`}
                actions={
                    <Link
                        href="/dashboard/trainer/assignments"
                        className="rounded-md border px-3 py-2 text-xs font-medium"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                        }}
                    >
                        ← All assignments
                    </Link>
                }
            />

            {assignment.description && (
                <Panel eyebrow="Brief" title="Description">
                    <p
                        className="whitespace-pre-wrap text-sm"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {assignment.description}
                    </p>
                </Panel>
            )}

            <section className="grid gap-4 sm:grid-cols-3">
                <StatTile
                    label="Submitted"
                    value={counts.SUBMITTED}
                    footnote="Awaiting your review"
                />
                <StatTile
                    label="Reviewed"
                    value={counts.REVIEWED}
                    footnote="Locked with feedback"
                />
                <StatTile
                    label="Pending"
                    value={counts.PENDING}
                    footnote="Students who haven't started"
                />
            </section>

            <Panel
                eyebrow="Queue"
                title={`Submissions (${submissions.length})`}
                description="Click any row to review or re-review. Reviewing writes feedback + score and locks the row."
                padded={false}
            >
                {submissions.length === 0 ? (
                    <div className="px-6 py-8">
                        <PageEmpty title="No submissions yet" />
                    </div>
                ) : (
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {submissions.map((s) => {
                            const open = openId === s.id;
                            const tone =
                                STATUS_TONE[s.status] || STATUS_TONE.PENDING;
                            return (
                                <li key={s.id}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenId((cur) =>
                                                cur === s.id ? null : s.id,
                                            )
                                        }
                                        className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--dashboard-surface)_94%,var(--role-accent)_6%)]"
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className="min-w-0">
                                            <p
                                                className="truncate text-sm font-medium"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {s.student?.user?.fullName ||
                                                    "Unknown student"}
                                            </p>
                                            <p
                                                className="truncate text-[11px]"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {s.student?.user?.email || "—"}
                                                {s.submittedAt
                                                    ? ` · submitted ${formatTimestamp(s.submittedAt)}`
                                                    : " · not submitted"}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            {s.status === "REVIEWED" &&
                                                s.score != null && (
                                                    <span
                                                        className="text-xs font-semibold"
                                                        style={{
                                                            color: "var(--dashboard-fg)",
                                                        }}
                                                    >
                                                        {s.score}/
                                                        {s.maxScore ?? 100}
                                                    </span>
                                                )}
                                            <span
                                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor: tone.bg,
                                                    color: tone.fg,
                                                }}
                                            >
                                                {s.status}
                                            </span>
                                        </div>
                                    </button>
                                    {open && (
                                        <SubmissionReviewer
                                            submission={s}
                                            onReviewed={async () => {
                                                setOpenId(null);
                                                await load();
                                            }}
                                            onCancel={() => setOpenId(null)}
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Panel>
        </div>
    );
}

function SubmissionReviewer({ submission, onReviewed, onCancel }) {
    const [feedback, setFeedback] = useState(submission.feedback ?? "");
    const [score, setScore] = useState(
        submission.score != null ? String(submission.score) : "",
    );
    const [maxScore, setMaxScore] = useState(
        String(submission.maxScore ?? 100),
    );
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState(null);

    async function submit(e) {
        e.preventDefault();
        setSubmitting(true);
        setErr(null);
        try {
            await reviewSubmission(submission.id, {
                feedback: feedback.trim() || undefined,
                score: score === "" ? null : Number(score),
                maxScore: Number(maxScore) || 100,
            });
            onReviewed?.();
        } catch (e2) {
            setErr(e2?.message || "Failed to save review");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="border-t px-6 py-4"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor:
                    "color-mix(in srgb, var(--dashboard-surface) 96%, var(--role-accent) 4%)",
            }}
        >
            {submission.submissionText && (
                <section className="mb-4">
                    <p
                        className="text-[10px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Submission text
                    </p>
                    <p
                        className="mt-1 whitespace-pre-wrap text-sm"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {submission.submissionText}
                    </p>
                </section>
            )}
            {submission.fileUrl && (
                <section className="mb-4">
                    <p
                        className="text-[10px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Attachment
                    </p>
                    <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 inline-block text-sm underline"
                        style={{ color: "var(--role-accent)" }}
                    >
                        {submission.fileUrl}
                    </a>
                </section>
            )}

            <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                        <span
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Score
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                            style={inputStyle}
                        />
                    </label>
                    <label className="block text-sm">
                        <span
                            className="text-[11px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Max score
                        </span>
                        <input
                            type="number"
                            min="1"
                            value={maxScore}
                            onChange={(e) => setMaxScore(e.target.value)}
                            className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                            style={inputStyle}
                        />
                    </label>
                </div>
                <label className="block text-sm">
                    <span
                        className="text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Feedback
                    </span>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                        style={inputStyle}
                    />
                </label>
                {err && (
                    <p className="text-sm" style={{ color: "#b91c1c" }}>
                        {err}
                    </p>
                )}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border px-3 py-1.5 text-xs font-medium"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                            cursor: submitting ? "wait" : "pointer",
                        }}
                    >
                        {submitting ? "Saving…" : "Save review"}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputStyle = {
    borderColor: "var(--dashboard-border)",
    backgroundColor: "var(--dashboard-surface)",
    color: "var(--dashboard-fg)",
};
