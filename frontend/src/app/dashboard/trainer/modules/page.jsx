"use client";

import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { api } from "@/lib/api";

export default function TrainerModulesPage() {
    const [paths, setPaths] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const res = await api("/modules");
            setPaths(Array.isArray(res?.data) ? res.data : []);
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
                title="Couldn't load modules"
                message={error}
                onRetry={load}
            />
        );
    if (paths === null) return <PageLoading label="Loading learning paths" />;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · Modules"
                title="Curriculum that lives inside your courses."
                subtitle="Each learning path holds an ordered list of modules. Create work for your batches from the Assignments page."
            />

            {paths.length === 0 ? (
                <PageEmpty
                    title="No learning paths visible"
                    description="Paths appear here once they're authored for the courses you teach."
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {paths.map((p) => (
                        <Panel
                            key={p.id}
                            eyebrow={p.course?.title ?? "Path"}
                            title={p.title}
                            description={p.description ?? null}
                        >
                            <p
                                className="text-xs uppercase tracking-[0.18em]"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {p.modules?.length ?? 0} modules ·{" "}
                                {p.difficulty || "Any level"}
                                {p.estimatedHours
                                    ? ` · ${p.estimatedHours}h`
                                    : ""}
                            </p>
                        </Panel>
                    ))}
                </div>
            )}
        </div>
    );
}
