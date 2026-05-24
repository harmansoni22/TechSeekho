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

const STATUSES = ["PRESENT", "ABSENT", "LATE"];

function todayIso() {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d.toISOString().slice(0, 10);
}

export default function CoordinatorAttendancePage() {
	const [batches, setBatches] = useState(null);
	const [batchesError, setBatchesError] = useState(null);

	const [batchId, setBatchId] = useState("");
	const [date, setDate] = useState(todayIso());

	const [roster, setRoster] = useState(null);
	const [rosterLoading, setRosterLoading] = useState(false);
	const [rosterError, setRosterError] = useState(null);

	const [marks, setMarks] = useState({});
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState(null);
	const [saveOk, setSaveOk] = useState(null);

	const loadBatches = useCallback(async () => {
		setBatchesError(null);
		try {
			const result = await api("/batches");
			const list = Array.isArray(result?.data) ? result.data : [];
			setBatches(list);
			if (list.length && !batchId) {
				setBatchId(list[0].id);
			}
		} catch (err) {
			setBatchesError(err.message);
			setBatches([]);
		}
	}, [batchId]);

	useEffect(() => {
		loadBatches();
	}, [loadBatches]);

	const loadRoster = useCallback(async () => {
		if (!batchId || !date) return;
		setRosterLoading(true);
		setRosterError(null);
		setSaveError(null);
		setSaveOk(null);
		try {
			const [detail, existing] = await Promise.all([
				api(`/batches/${batchId}`),
				api(
					`/attendance?batchId=${encodeURIComponent(batchId)}&date=${encodeURIComponent(date)}`,
				),
			]);
			const batch = detail?.data;
			const records = Array.isArray(existing?.data) ? existing.data : [];

			const existingByStudent = Object.fromEntries(
				records.map((r) => [r.studentId, r.status]),
			);

			const students = Array.isArray(batch?.students) ? batch.students : [];
			const next = {};
			for (const s of students) {
				next[s.id] = existingByStudent[s.id] || "PRESENT";
			}

			setRoster({ batch, students, hasExisting: records.length > 0 });
			setMarks(next);
		} catch (err) {
			setRosterError(err.message);
			setRoster(null);
		} finally {
			setRosterLoading(false);
		}
	}, [batchId, date]);

	useEffect(() => {
		if (batchId && date) loadRoster();
	}, [batchId, date, loadRoster]);

	const counts = useMemo(() => {
		const c = { PRESENT: 0, ABSENT: 0, LATE: 0 };
		for (const v of Object.values(marks)) if (c[v] !== undefined) c[v] += 1;
		return c;
	}, [marks]);

	function setAll(status) {
		if (!roster?.students) return;
		const next = {};
		for (const s of roster.students) next[s.id] = status;
		setMarks(next);
	}

	async function handleSubmit() {
		if (!batchId || !date) return;
		const records = Object.entries(marks).map(([studentId, status]) => ({
			studentId,
			status,
		}));
		if (records.length === 0) return;
		setSaving(true);
		setSaveError(null);
		setSaveOk(null);
		try {
			await api("/attendance/bulk", {
				method: "POST",
				body: JSON.stringify({ batchId, date, records }),
			});
			setSaveOk(
				`Saved ${records.length} record${records.length === 1 ? "" : "s"} for ${date}.`,
			);
			await loadRoster();
		} catch (err) {
			setSaveError(err.message);
		} finally {
			setSaving(false);
		}
	}

	if (batches === null) return <PageLoading label="Loading batches" />;
	if (batchesError)
		return (
			<PageError
				title="Could not load batches"
				message={batchesError}
				onRetry={loadBatches}
			/>
		);

	return (
		<div className="space-y-8">
			<RoleHero
				eyebrow="Operations · Attendance"
				title="Mark and review attendance."
				subtitle="Pick a batch and a date, mark each student, and save. Existing records for the same date are loaded automatically — re-saving overwrites them."
			/>

			<Panel eyebrow="Filters" title="Batch & date">
				<div className="grid gap-4 sm:grid-cols-3">
					<label className="block text-sm">
						<span
							className="text-[11px] uppercase tracking-[0.18em]"
							style={{ color: "var(--dashboard-muted)" }}
						>
							Batch
						</span>
						<select
							value={batchId}
							onChange={(e) => setBatchId(e.target.value)}
							className="mt-1.5 w-full rounded-md border px-3 py-2"
							style={{
								borderColor: "var(--dashboard-border)",
								backgroundColor: "var(--dashboard-surface)",
								color: "var(--dashboard-fg)",
							}}
						>
							{batches.length === 0 && <option value="">No batches</option>}
							{batches.map((b) => (
								<option key={b.id} value={b.id}>
									{b.name}
									{b.institution?.name ? ` — ${b.institution.name}` : ""}
								</option>
							))}
						</select>
					</label>

					<label className="block text-sm">
						<span
							className="text-[11px] uppercase tracking-[0.18em]"
							style={{ color: "var(--dashboard-muted)" }}
						>
							Date
						</span>
						<input
							type="date"
							value={date}
							max={todayIso()}
							onChange={(e) => setDate(e.target.value)}
							className="mt-1.5 w-full rounded-md border px-3 py-2"
							style={{
								borderColor: "var(--dashboard-border)",
								backgroundColor: "var(--dashboard-surface)",
								color: "var(--dashboard-fg)",
							}}
						/>
					</label>

					<div className="flex items-end gap-2">
						<button
							type="button"
							onClick={loadRoster}
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

			{batches.length === 0 ? (
				<PageEmpty
					title="No batches available"
					description="Create a batch first or wait for one to be assigned to your institution."
				/>
			) : rosterLoading ? (
				<PageLoading label="Loading roster" />
			) : rosterError ? (
				<PageError
					title="Could not load roster"
					message={rosterError}
					onRetry={loadRoster}
				/>
			) : roster?.students && roster.students.length > 0 ? (
				<Panel
					eyebrow="Roster"
					title={`${roster.batch?.name ?? "Batch"} — ${date}`}
					description={
						roster.hasExisting
							? "Attendance for this date already exists. Saving will overwrite the existing rows."
							: "No attendance recorded yet for this date."
					}
					actions={
						<div className="flex flex-wrap items-center gap-2">
							<span
								className="text-xs"
								style={{ color: "var(--dashboard-muted)" }}
							>
								P {counts.PRESENT} · A {counts.ABSENT} · L {counts.LATE}
							</span>
							{STATUSES.map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => setAll(s)}
									className="rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider"
									style={{
										borderColor: "var(--dashboard-border)",
										color: "var(--dashboard-fg)",
										backgroundColor: "var(--dashboard-surface)",
									}}
								>
									All {s}
								</button>
							))}
						</div>
					}
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
									<th className="px-3 py-3 font-medium">Enrollment</th>
									<th className="px-3 py-3 font-medium">Email</th>
									<th className="px-6 py-3 font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								{roster.students.map((s) => (
									<tr
										key={s.id}
										className="border-t"
										style={{ borderColor: "var(--dashboard-border)" }}
									>
										<td
											className="px-6 py-3"
											style={{ color: "var(--dashboard-fg)" }}
										>
											{s.user?.fullName ?? "—"}
										</td>
										<td
											className="px-3 py-3 text-xs"
											style={{ color: "var(--dashboard-muted)" }}
										>
											{s.enrollmentNumber ?? "—"}
										</td>
										<td
											className="px-3 py-3 text-xs"
											style={{ color: "var(--dashboard-muted)" }}
										>
											{s.user?.email ?? "—"}
										</td>
										<td className="px-6 py-3">
											<div className="flex gap-1">
												{STATUSES.map((status) => {
													const active = marks[s.id] === status;
													return (
														<button
															key={status}
															type="button"
															onClick={() =>
																setMarks((m) => ({ ...m, [s.id]: status }))
															}
															className="rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider"
															style={{
																borderColor: active
																	? "var(--role-accent)"
																	: "var(--dashboard-border)",
																color: active
																	? "var(--role-accent-ink)"
																	: "var(--dashboard-fg)",
																backgroundColor: active
																	? "var(--role-accent)"
																	: "var(--dashboard-surface)",
															}}
														>
															{status}
														</button>
													);
												})}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div
						className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4"
						style={{ borderColor: "var(--dashboard-border)" }}
					>
						<div className="text-xs" style={{ color: "var(--dashboard-muted)" }}>
							{roster.students.length} student
							{roster.students.length === 1 ? "" : "s"} ·{" "}
							{roster.hasExisting ? "edit mode" : "new entry"}
						</div>
						<div className="flex items-center gap-3">
							{saveError && (
								<span className="text-xs" style={{ color: "#b91c1c" }}>
									{saveError}
								</span>
							)}
							{saveOk && (
								<span className="text-xs" style={{ color: "#047857" }}>
									{saveOk}
								</span>
							)}
							<button
								type="button"
								onClick={handleSubmit}
								disabled={saving}
								className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
								style={{
									backgroundColor: "var(--role-accent)",
									color: "var(--role-accent-ink)",
								}}
							>
								{saving
									? "Saving…"
									: roster.hasExisting
										? "Overwrite attendance"
										: "Save attendance"}
							</button>
						</div>
					</div>
				</Panel>
			) : (
				<PageEmpty
					title="No students in this batch"
					description="Assign students to this batch before marking attendance."
				/>
			)}
		</div>
	);
}
