"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { api } from "@/lib/api";

export default function TrainerBatchesPage() {
    const [batches, setBatches] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const res = await api("/batches");
            setBatches(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (error)
        return (
            <PageError
                title="Couldn't load batches"
                message={error}
                onRetry={load}
            />
        );
    if (batches === null) return <PageLoading label="Loading batches" />;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · Batches"
                title="The cohorts you teach."
                subtitle="Read-only roster for now. Attendance, assignments, and assessments are managed from their dedicated pages."
            />

            {batches.length === 0 ? (
                <PageEmpty
                    title="You're not assigned to any batches yet"
                    description="An admin will assign you to batches at your institution."
                />
            ) : (
                <Panel
                    eyebrow="Directory"
                    title={`${batches.length} batch${batches.length === 1 ? "" : "es"}`}
                    padded={false}
                >
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {batches.map((b) => (
                            <li
                                key={b.id}
                                className="flex items-center justify-between gap-4 px-6 py-4"
                            >
                                <Link
                                    href={`/dashboard/trainer/batches/${b.id}`}
                                    className="min-w-0 flex-1 hover:underline"
                                >
                                    <p
                                        className="truncate font-display text-base"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {b.name}
                                    </p>
                                    <p
                                        className="mt-0.5 truncate text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {b.course?.title ?? "—"} ·{" "}
                                        {b.institution?.name ?? "—"} ·{" "}
                                        {b._count?.students ?? 0} student
                                        {(b._count?.students ?? 0) === 1
                                            ? ""
                                            : "s"}
                                    </p>
                                </Link>
                                <div className="flex shrink-0 items-center gap-3">
                                    <span
                                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                        style={{
                                            backgroundColor:
                                                b.isActive === false
                                                    ? "rgba(148, 163, 184, 0.18)"
                                                    : "rgba(16, 185, 129, 0.12)",
                                            color:
                                                b.isActive === false
                                                    ? "var(--dashboard-muted)"
                                                    : "#047857",
                                        }}
                                    >
                                        {b.isActive === false
                                            ? "Inactive"
                                            : "Active"}
                                    </span>
                                    <Link
                                        href={`/dashboard/trainer/attendance?batchId=${b.id}`}
                                        className="rounded-md border px-3 py-1 text-xs"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        Attendance
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </div>
    );
}
