"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
    computeBatchHealth,
    formatDate,
    HealthBar,
    MetaItem,
    ProjectionTag,
    pluralize,
    RankBadge,
    TierChip,
    tierOf,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

/**
 * Coordinator Batches — read-only.
 *
 * Lists every batch the backend scopes to this coordinator's institution(s),
 * ranked healthiest-first, and shows a read-only detail (meta, trainers,
 * students). There is intentionally NO assign / remove / edit control: roster
 * and staffing changes are owned by admins and trainers. The backend rejects
 * those writes for a coordinator anyway — we simply never offer them.
 */
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
        } catch (err) {
            setError(err.message);
            setBatches([]);
        }
    }, []);

    useEffect(() => {
        loadBatches();
    }, [loadBatches]);

    const ranked = useMemo(() => {
        if (!batches) return [];
        return batches
            .map((b) => ({ batch: b, health: computeBatchHealth(b) }))
            .sort(
                (a, b) =>
                    tierOf(a.health.tier).rank - tierOf(b.health.tier).rank ||
                    b.health.enrolled - a.health.enrolled,
            );
    }, [batches]);

    useEffect(() => {
        if (ranked.length && !selectedId) setSelectedId(ranked[0].batch.id);
    }, [ranked, selectedId]);

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
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Batches"
                title="Every cohort you watch over."
                subtitle="A read-only directory of the batches in your institution, strongest first. Rosters and trainers are managed by admins and trainers — you see the live state."
                actions={<ProjectionTag />}
            />

            {ranked.length === 0 ? (
                <PageEmpty
                    title="No batches in scope yet"
                    description="No batches are visible under your institution scope. They appear here the moment an admin creates one for your school."
                />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                    <BatchList
                        ranked={ranked}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                    {selectedId && <BatchDetail batchId={selectedId} />}
                </div>
            )}
        </div>
    );
}

function BatchList({ ranked, selectedId, onSelect }) {
    return (
        <Panel
            eyebrow="Directory"
            title="Cohorts"
            description={`${pluralize(ranked.length, "batch", "batches")} · strongest first`}
            padded={false}
        >
            <ul>
                {ranked.map((row, i) => {
                    const b = row.batch;
                    const active = b.id === selectedId;
                    return (
                        <li key={b.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(b.id)}
                                className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor: active
                                        ? "var(--role-accent-soft)"
                                        : "transparent",
                                }}
                            >
                                <RankBadge n={i + 1} />
                                <div className="min-w-0 flex-1">
                                    <div
                                        className="truncate font-display text-base"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {b.name}
                                    </div>
                                    <div
                                        className="mt-0.5 truncate text-[11px] uppercase tracking-[0.14em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {b.institution?.name ?? "—"}
                                    </div>
                                    <div className="mt-2">
                                        <HealthBar
                                            value={row.health.score}
                                            tier={row.health.tier}
                                            height={5}
                                        />
                                    </div>
                                    <div
                                        className="mt-1.5 text-[11px]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {pluralize(
                                            row.health.enrolled,
                                            "student",
                                        )}{" "}
                                        ·{" "}
                                        {pluralize(
                                            row.health.trainers,
                                            "trainer",
                                        )}
                                    </div>
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </Panel>
    );
}

function BatchDetail({ batchId }) {
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

    if (loading) return <PageLoading label="Loading cohort" />;
    if (error)
        return (
            <PageError
                title="Could not load cohort"
                message={error}
                onRetry={load}
            />
        );
    if (!detail) return null;

    const health = computeBatchHealth(detail);
    const trainers = detail.trainers ?? [];
    const students = [...(detail.students ?? [])].sort((a, b) =>
        (a.user?.fullName ?? "").localeCompare(b.user?.fullName ?? ""),
    );

    return (
        <div className="space-y-6">
            <Panel
                eyebrow="Cohort"
                title={detail.name}
                description={`${detail.institution?.name ?? ""}${
                    detail.course?.title ? ` · ${detail.course.title}` : ""
                }`}
                actions={<TierChip tier={health.tier} />}
            >
                <dl className="grid gap-4 sm:grid-cols-4">
                    <MetaItem
                        label="Start"
                        value={formatDate(detail.startDate)}
                    />
                    <MetaItem label="End" value={formatDate(detail.endDate)} />
                    <MetaItem
                        label="Status"
                        value={detail.isActive ? "Active" : "Inactive"}
                    />
                    <MetaItem label="Enrolled" value={health.enrolled} />
                </dl>
                <div className="mt-5">
                    <HealthBar value={health.score} tier={health.tier} />
                </div>
            </Panel>

            <Panel
                eyebrow="Delivery"
                title="Trainers"
                description={pluralize(
                    trainers.length,
                    "trainer assigned",
                    "trainers assigned",
                )}
                padded={false}
            >
                {trainers.length === 0 ? (
                    <div className="px-6 py-6">
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            No trainer is assigned yet. Assignment is handled by
                            an admin.
                        </p>
                    </div>
                ) : (
                    <RosterTable
                        head={["Trainer", "Email", "Specialization"]}
                        rows={trainers.map((bt) => [
                            bt.trainer?.user?.fullName ?? "—",
                            bt.trainer?.user?.email ?? "—",
                            bt.trainer?.specialization ?? "—",
                        ])}
                    />
                )}
            </Panel>

            <Panel
                eyebrow="Roster"
                title="Students"
                description={pluralize(
                    students.length,
                    "student enrolled",
                    "students enrolled",
                )}
                padded={false}
            >
                {students.length === 0 ? (
                    <div className="px-6 py-6">
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            No students are enrolled in this cohort yet.
                        </p>
                    </div>
                ) : (
                    <RosterTable
                        head={["Student", "Enrollment", "Email"]}
                        rows={students.map((s) => [
                            s.user?.fullName ?? "—",
                            s.enrollmentNumber ?? "—",
                            s.user?.email ?? "—",
                        ])}
                    />
                )}
            </Panel>
        </div>
    );
}

function RosterTable({ head, rows }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr
                        className="text-[10px] uppercase tracking-[0.18em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {head.map((h, i) => (
                            <th
                                key={h}
                                className={`py-3 font-medium ${i === 0 ? "px-6" : "px-3"}`}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((cells) => (
                        <tr
                            key={cells.join("|")}
                            className="border-t"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {cells.map((c, i) => (
                                <td
                                    key={head[i]}
                                    className={`py-3 ${i === 0 ? "px-6" : "px-3 text-xs"}`}
                                    style={{
                                        color:
                                            i === 0
                                                ? "var(--dashboard-fg)"
                                                : "var(--dashboard-muted)",
                                    }}
                                >
                                    {c}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
