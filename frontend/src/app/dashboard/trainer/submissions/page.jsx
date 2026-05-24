"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
	PageEmpty,
	PageError,
	PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
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

const STATUS_FILTERS = ["ALL", "SUBMITTED", "REVIEWED", "PENDING"];

const inputStyle = {
	borderColor: "var(--dashboard-border)",
	backgroundColor: "var(--dashboard-surface)",
	color: "var(--dashboard-fg)",
};

export default function TrainerSubmissionsPage() {
	const [submissions, setSubmissions] = useState(null);
	const [error, setError] = useState(null);
	const [statusFilter, setStatusFilter] = useState("SUBMITTED");
	const [batchFilter, setBatchFilter] = useState("ALL");
	const [open, setOpen] = useState(null);

	const load = useCallback(async () => {
		setError(null);
		try {
			const query = new URLSearchParams();
			if (statusFilter !== "ALL") query.set("status", statusFilter);
			const path = query.toString()
				? `/assignments/submissions?${query.toString()}`
				: "/assignments/submissions";
			const result = await api(path);
			setSubmissions(Array.isArray(result?.data) ? result.data : []);
		} catch (err) {
			setError(err.message);
			setSubmissions([]);
		}
	}, [statusFilter]);

	useEffect(() => {
		load();
	}, [load]);

	const batches = useMemo(() => {
		const set = new Map();
		for (const s of submissions ?? []) {
			if (s.assignment?.batch) {
				set.set(s.assignment.batch.id, s.assignment.batch.name);
			}
		}
		return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
	}, [submissions]);

	const visible = useMemo(() => {
		if (!submissions) return [];
		if (batchFilter === "ALL") return submissions;
		return submissions.filter(
			(s) => s.assignment?.batch?.id === batchFilter,
		);
	}, [submissions, batchFilter]);

	if (submissions === null) {
		if (error)
			return <PageError title="Could not load" message={error} onRetry={load} />;
		return <PageLoading label="Loading submissions" />;
	}

	return (
		<div className="space-y-8">
			<RoleHero
				eyebrow="Operations · Submissions"
				title="Review what students have turned in."
				subtitle="Submissions are scoped by the backend to batches you teach. Reviewing locks the submission as REVIEWED with your feedback and score."
			/>

			<Panel eyebrow="Filters" title="Narrow the queue">
				<div className="grid gap-4 sm:grid-cols-3">
					<label className="block text-sm">
						<span
							className="text-[11px] uppercase tracking-[0.18em]"
							style={{ color: "var(--dashboard-muted)" }}
						>
							Status
						</span>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="mt-1.5 w-full rounded-md border px-3 py-2"
							style={inputStyle}
						>
							{STATUS_FILTERS.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</label>

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
							className="mt-1.5 w-full rounded-md border px-3 py-2"
							style={inputStyle}
						>
							<option value="ALL">All batches</option>
							{batches.map((b) => (
								<option key={b.id} value={b.id}>
									{b.name}
								</option>
							))}
						</select>
					</label>

					<div className="flex items-end">
						<button
							type="button"
							onClick={load}
							className="rounded-md border px-3 py-2 text-xs font-semibold"
							style={{
								borderColor: "var(--dashboard-border)",
								color: "var(--dashboard-fg)",
								backgroundColor: "var(--dashboard-surface)",
							}}
						>
							Refresh
						</button>
					</div>
				</div>
			</Panel>

			{visible.length === 0 ? (
				<PageEmpty
					title="No submissions"
					description="Nothing matches the current filters."
				/>
			) : (
				<Panel
					eyebrow="Queue"
					title="Submissions"
					description={`${visible.length} shown`}
					padded={false}
				>
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead>
								<tr
									className="text-[10px] uppercase tracking-[0.18em]"
									style={{ color: "var(--dashboard-muted)" }}
								>
									<th className="px-6 py-3 font-medium">Student</th>
									<th className="px-3 py-3 font-medium">Assignment</th>
									<th className="px-3 py-3 font-medium">Batch</th>
									<th className="px-3 py-3 font-medium">Submitted</th>
									<th className="px-3 py-3 font-medium">Status</th>
									<th className="px-3 py-3 font-medium">Score</th>
									<th className="px-6 py-3 font-medium" />
								</tr>
							</thead>
							<tbody>
								{visible.map((s) => (
									<tr
										key={s.id}
										className="border-t"
										style={{ borderColor: "var(--dashboard-border)" }}
									>
										<td
											className="px-6 py-3"
											style={{ color: "var(--dashboard-fg)" }}
										>
											{s.student?.user?.fullName ?? "—"}
										</td>
										<td
											className="px-3 py-3 text-xs"
											style={{ color: "var(--dashboard-muted)" }}
										>
											{s.assignment?.title ?? "—"}
										</td>
										<td
											className="px-3 py-3 text-xs"
											style={{ color: "var(--dashboard-muted)" }}
										>
											{s.assignment?.batch?.name ?? "—"}
										</td>
										<td
											className="px-3 py-3 text-xs"
											style={{ color: "var(--dashboard-muted)" }}
										>
											{formatDate(s.submittedAt)}
										</td>
										<td className="px-3 py-3">
											<StatusPill status={s.status} />
										</td>
										<td
											className="px-3 py-3 text-xs"
											style={{ color: "var(--dashboard-fg)" }}
										>
											{s.status === "REVIEWED" && s.score !== null
												? `${s.score}/${s.maxScore ?? 100}`
												: "—"}
										</td>
										<td className="px-6 py-3 text-right">
											<button
												type="button"
												onClick={() => setOpen(s)}
												className="rounded-md px-3 py-1 text-xs font-semibold"
												style={{
													backgroundColor: "var(--role-accent)",
													color: "var(--role-accent-ink)",
												}}
											>
												{s.status === "REVIEWED" ? "Re-review" : "Review"}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Panel>
			)}

			{open && (
				<ReviewDialog
					submission={open}
					onClose={() => setOpen(null)}
					onReviewed={() => {
						setOpen(null);
						load();
					}}
				/>
			)}
		</div>
	);
}

function StatusPill({ status }) {
	const colors = {
		PENDING: { fg: "var(--dashboard-muted)", bg: "rgba(148, 163, 184, 0.16)" },
		SUBMITTED: { fg: "rgb(217, 119, 6)", bg: "rgba(217, 119, 6, 0.14)" },
		REVIEWED: { fg: "rgb(16, 185, 129)", bg: "rgba(16, 185, 129, 0.14)" },
	};
	const c = colors[status] ?? colors.PENDING;
	return (
		<span
			className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
			style={{ backgroundColor: c.bg, color: c.fg }}
		>
			{status}
		</span>
	);
}

function ReviewDialog({ submission, onClose, onReviewed }) {
	const [feedback, setFeedback] = useState(submission.feedback ?? "");
	const [score, setScore] = useState(
		submission.score !== null && submission.score !== undefined
			? String(submission.score)
			: "",
	);
	const [maxScore, setMaxScore] = useState(
		String(submission.maxScore ?? 100),
	);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

	async function submit(e) {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			await api(`/assignments/submissions/${submission.id}/review`, {
				method: "PATCH",
				body: JSON.stringify({
					feedback: feedback.trim() || undefined,
					score: score === "" ? null : Number(score),
					maxScore: Number(maxScore) || 100,
				}),
			});
			onReviewed?.();
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center px-4"
			style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="w-full max-w-2xl overflow-hidden rounded-xl border"
				onClick={(e) => e.stopPropagation()}
				style={{
					borderColor: "var(--dashboard-border)",
					backgroundColor: "var(--dashboard-surface)",
				}}
			>
				<header
					className="border-b px-6 py-4"
					style={{ borderColor: "var(--dashboard-border)" }}
				>
					<p
						className="text-[10px] uppercase tracking-[0.24em]"
						style={{ color: "var(--role-accent)" }}
					>
						Review
					</p>
					<h2
						className="font-display text-xl"
						style={{ color: "var(--dashboard-fg)" }}
					>
						{submission.assignment?.title ?? "Submission"}
					</h2>
					<p
						className="mt-1 text-xs"
						style={{ color: "var(--dashboard-muted)" }}
					>
						{submission.student?.user?.fullName ?? "—"} ·{" "}
						{submission.assignment?.batch?.name ?? "—"} · submitted{" "}
						{formatDate(submission.submittedAt)}
					</p>
				</header>

				<div className="space-y-4 px-6 py-4">
					{submission.submissionText && (
						<section>
							<h3
								className="text-[10px] uppercase tracking-[0.18em]"
								style={{ color: "var(--dashboard-muted)" }}
							>
								Submission text
							</h3>
							<p
								className="mt-1 whitespace-pre-wrap text-sm"
								style={{ color: "var(--dashboard-fg)" }}
							>
								{submission.submissionText}
							</p>
						</section>
					)}
					{submission.fileUrl && (
						<section>
							<h3
								className="text-[10px] uppercase tracking-[0.18em]"
								style={{ color: "var(--dashboard-muted)" }}
							>
								Attachment
							</h3>
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
				</div>

				<form
					onSubmit={submit}
					className="space-y-4 border-t px-6 py-4"
					style={{ borderColor: "var(--dashboard-border)" }}
				>
					<div className="grid gap-4 sm:grid-cols-2">
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
								className="mt-1.5 w-full rounded-md border px-3 py-2"
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
								className="mt-1.5 w-full rounded-md border px-3 py-2"
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
							rows={5}
							className="mt-1.5 w-full rounded-md border px-3 py-2"
							style={inputStyle}
						/>
					</label>
					{error && (
						<p className="text-sm" style={{ color: "#b91c1c" }}>
							{error}
						</p>
					)}
					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-md border px-4 py-2 text-sm font-semibold"
							style={{
								borderColor: "var(--dashboard-border)",
								color: "var(--dashboard-fg)",
							}}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
							style={{
								backgroundColor: "var(--role-accent)",
								color: "var(--role-accent-ink)",
							}}
						>
							{submitting ? "Saving…" : "Save review"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
