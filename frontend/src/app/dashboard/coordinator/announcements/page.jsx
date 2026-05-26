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

export default function CoordinatorAnnouncementsPage() {
    const [items, setItems] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const res = await api("/announcements");
            setItems(Array.isArray(res?.data) ? res.data : []);
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
                title="Couldn't load announcements"
                message={error}
                onRetry={load}
            />
        );
    if (items === null) return <PageLoading label="Loading announcements" />;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Programme Operations · Announcements"
                title="What's being said to whom."
                subtitle="Coordinators see announcements but don't author them. To post to a batch, ask the assigned trainer or your admin."
            />

            {items.length === 0 ? (
                <PageEmpty
                    title="No announcements"
                    description="Once trainers or admins post to a batch in your institution, you'll see them here."
                />
            ) : (
                <Panel
                    eyebrow="Feed"
                    title={`${items.length} announcement${items.length === 1 ? "" : "s"}`}
                    padded={false}
                >
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {items.map((a) => (
                            <li key={a.id} className="px-6 py-4">
                                <p
                                    className="font-display text-base"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {a.title}
                                </p>
                                <p
                                    className="mt-2 text-sm leading-relaxed"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {a.content}
                                </p>
                                <p
                                    className="mt-2 text-xs"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {a.batch?.name ?? "—"} ·{" "}
                                    {a.author?.fullName ?? "—"} ·{" "}
                                    {formatDate(a.createdAt)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </div>
    );
}
