"use client";

import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
    COORD_ICONS,
    formatDate,
    Icon,
    MetaItem,
    ProjectionTag,
    pluralize,
} from "@/features/dashboard/coordinator/coordinatorShared";
import { api } from "@/lib/api";

const ROLE_LABELS = {
    INSTITUTION_COORDINATOR: "Institution Coordinator",
    ADMIN: "Admin",
    SUPER_ADMIN: "Super Admin",
    TRAINER: "Trainer",
    STUDENT: "Student",
};

/**
 * Coordinator Profile — read-only.
 *
 * Identity comes from /auth/profile; institution scope from the school-scoped
 * /institutions. Coordinator is projection-only, so there is no edit form:
 * scope is granted by a super-admin, and personal-detail edits live in the
 * account area, not on this operational surface.
 */
export default function CoordinatorProfilePage() {
    const [user, setUser] = useState(null);
    const [institutions, setInstitutions] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const [profileRes, instRes] = await Promise.all([
                api("/auth/profile"),
                api("/institutions").catch(() => ({ data: [] })),
            ]);
            setUser(profileRes?.user ?? profileRes?.data ?? null);
            setInstitutions(Array.isArray(instRes?.data) ? instRes.data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <PageLoading label="Loading your profile" />;
    if (error)
        return (
            <PageError
                title="Couldn't load your profile"
                message={error}
                onRetry={load}
            />
        );
    if (!user) return null;

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const initials = (user.name ?? "?")
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Profile"
                title="Your coordinator profile."
                subtitle="Who you are on TechSeekho and the schools you have visibility into. This is a read-only view — scope is set by a super-admin."
                actions={<ProjectionTag label="Read-only" />}
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <Panel eyebrow="Identity" title="Account">
                    <div className="flex items-center gap-4">
                        <span
                            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl font-display text-2xl"
                            style={{
                                backgroundColor: "var(--role-accent-soft)",
                                color: "var(--role-accent)",
                            }}
                        >
                            {initials}
                        </span>
                        <div className="min-w-0">
                            <p
                                className="font-display text-xl"
                                style={{ color: "var(--dashboard-fg)" }}
                            >
                                {user.name ?? "—"}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {roles.map((r) => (
                                    <span
                                        key={r}
                                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                        style={{
                                            backgroundColor:
                                                "var(--role-accent-soft)",
                                            color: "var(--role-accent)",
                                        }}
                                    >
                                        {ROLE_LABELS[r] ?? r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                        <MetaItem label="Email" value={user.email ?? "—"} />
                        <MetaItem label="Phone" value={user.phone ?? "—"} />
                        <MetaItem label="Status" value={user.status ?? "—"} />
                        <MetaItem
                            label="Member since"
                            value={formatDate(user.createdAt)}
                        />
                    </dl>

                    <div className="mt-5 flex flex-wrap gap-2">
                        <VerifyTag
                            ok={user.isEmailVerified}
                            label="Email verified"
                            off="Email unverified"
                        />
                        <VerifyTag
                            ok={user.isPhoneVerified}
                            label="Phone verified"
                            off="Phone unverified"
                        />
                    </div>
                </Panel>

                <Panel
                    eyebrow="Your scope"
                    title="Institutions you can see"
                    description={
                        institutions.length
                            ? `You project for ${pluralize(institutions.length, "school", "schools")} — and only ${institutions.length === 1 ? "it" : "these"}.`
                            : "No institution is linked to your account yet."
                    }
                    padded={false}
                >
                    {institutions.length === 0 ? (
                        <div className="px-6 py-8">
                            <p
                                className="text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                Ask a super-admin to link you to an institution.
                                Once assigned, its cohorts appear across your
                                dashboard.
                            </p>
                        </div>
                    ) : (
                        <ul
                            className="divide-y"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {institutions.map((inst) => (
                                <li
                                    key={inst.id}
                                    className="flex items-center gap-3 px-6 py-4"
                                >
                                    <span
                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                        style={{
                                            backgroundColor:
                                                "var(--role-accent-soft)",
                                            color: "var(--role-accent)",
                                        }}
                                    >
                                        <Icon
                                            path={COORD_ICONS.building}
                                            className="h-4 w-4"
                                        />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className="truncate font-display text-base"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {inst.name}
                                        </p>
                                        <p
                                            className="truncate text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {[inst.type, inst.city, inst.state]
                                                .filter(Boolean)
                                                .join(" · ") || "—"}
                                        </p>
                                    </div>
                                    <span
                                        className="shrink-0 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {pluralize(
                                            inst.batches?.length ?? 0,
                                            "batch",
                                            "batches",
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </div>
    );
}

function VerifyTag({ ok, label, off }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{
                backgroundColor: ok
                    ? "rgba(16, 185, 129, 0.12)"
                    : "color-mix(in srgb, var(--dashboard-muted) 14%, transparent)",
                color: ok ? "#047857" : "var(--dashboard-muted)",
            }}
        >
            {ok && <Icon path={COORD_ICONS.check} className="h-3 w-3" />}
            {ok ? label : off}
        </span>
    );
}
