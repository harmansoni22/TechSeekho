"use client";

import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";
import { api } from "@/lib/api";

export default function CoordinatorStudentsPage() {
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
                title="Couldn't load students"
                message={error}
                onRetry={load}
            />
        );
    if (batches === null) return <PageLoading label="Loading students" />;

    const byBatch = batches.map((b) => ({
        id: b.id,
        name: b.name,
        course: b.course?.title ?? "—",
        institution: b.institution?.name ?? "—",
        students: b.students?.length ?? b._count?.students ?? 0,
    }));
    const totalStudents = byBatch.reduce((s, b) => s + b.students, 0);

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Programme Operations · Students"
                title="Who's enrolled where."
                subtitle="Read-only projection: enrolment counts per batch. To assign or remove students, ask an admin or a trainer."
            />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Total enrolled" value={totalStudents} />
                <StatTile
                    label="Active batches"
                    value={byBatch.filter((b) => b.students > 0).length}
                />
                <StatTile
                    label="Empty batches"
                    value={byBatch.filter((b) => b.students === 0).length}
                />
                <StatTile label="Batches in scope" value={byBatch.length} />
            </section>

            <Panel eyebrow="Roll-up" title="Students by batch" padded={false}>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr
                            className="text-[10px] uppercase tracking-[0.18em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            <th className="px-6 py-3 font-medium">Batch</th>
                            <th className="px-3 py-3 font-medium">Course</th>
                            <th className="px-3 py-3 font-medium">
                                Institution
                            </th>
                            <th className="px-6 py-3 font-medium text-right">
                                Students
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {byBatch.map((b) => (
                            <tr
                                key={b.id}
                                className="border-t"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                <td
                                    className="px-6 py-3"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {b.name}
                                </td>
                                <td
                                    className="px-3 py-3 text-xs"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {b.course}
                                </td>
                                <td
                                    className="px-3 py-3 text-xs"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {b.institution}
                                </td>
                                <td
                                    className="px-6 py-3 text-right"
                                    style={{ color: "var(--role-accent)" }}
                                >
                                    {b.students}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Panel>
        </div>
    );
}
