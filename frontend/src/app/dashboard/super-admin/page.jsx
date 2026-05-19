"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";

/**
 * SUPER_ADMIN Overview.
 *
 * Reads from the existing Next.js API route /api/admin/platform/overview.
 * The route is server-side and proxies to the backend with the same JWT;
 * we therefore include the Authorization header from the next-auth session.
 *
 * Expected response shape (matches existing backend contract):
 *   {
 *     data: {
 *       kpis: [{ label, value, hint }],
 *       countsByRole: { ROLE: count, ... },
 *       attendance30d: { ratePercent, total, PRESENT, LATE, ABSENT },
 *       entities: {
 *         assignments: { total, submittedLast30d, pendingReview },
 *         assessments: { total },
 *         students, trainers,
 *       },
 *       recent: { institutions: [...], submissions: [...] }
 *     }
 *   }
 *
 * Defensive rendering: every list/object is normalized so the page renders
 * gracefully even if the backend omits a slice during development.
 */

function formatDate(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

const ROLE_LABELS = {
    SUPER_ADMIN: "Super Admins",
    ADMIN: "Admins",
    INSTITUTION_COORDINATOR: "Coordinators",
    TRAINER: "Trainers",
    STUDENT: "Students",
};

const SuperAdminDashboard = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOverview = useCallback(async () => {
        // Defence: never call backend without an authenticated session.
        if (!session?.accessToken) return;

        setLoading(true);
        setError(null);

        const controller = new AbortController();
        try {
            const response = await fetch("/api/admin/platform/overview", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
                signal: controller.signal,
            });

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(
                    body.error || `Request failed (${response.status})`,
                );
            }

            const result = await response.json();
            setOverview(result.data ?? result);
        } catch (err) {
            if (err.name === "AbortError") return;
            setError(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }

        return () => controller.abort();
    }, [session?.accessToken, router]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }
        if (status === "authenticated") {
            fetchOverview();
        }
    }, [status, fetchOverview, router]);

    if (status === "loading" || loading) {
        return <PageLoading label="Loading platform overview" />;
    }

    if (error) {
        return (
            <PageError
                title="Could not load the platform overview"
                message={error}
                onRetry={fetchOverview}
            />
        );
    }

    if (!overview) {
        return (
            <PageEmpty
                title="No platform data yet"
                description="Aggregate metrics will appear here as soon as the API begins emitting telemetry."
            />
        );
    }

    const kpis = Array.isArray(overview.kpis) ? overview.kpis : [];
    const countsByRole = overview.countsByRole ?? {};
    const attendance = overview.attendance30d ?? {
        ratePercent: null,
        total: 0,
        PRESENT: 0,
        LATE: 0,
        ABSENT: 0,
    };
    const entities = overview.entities ?? {
        assignments: { total: 0, submittedLast30d: 0, pendingReview: 0 },
        assessments: { total: 0 },
        students: 0,
        trainers: 0,
    };
    const recent = overview.recent ?? { institutions: [], submissions: [] };

    const firstName = (session?.user?.name || "").split(" ")[0] || "Custodian";

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Platform Governance"
                title={`Good to see you, ${firstName}.`}
                subtitle="A single-pane view across every institution, admin, and policy on TechSeekho. Treat what you see as the source of truth — when in doubt, audit before action."
                actions={
                    <>
                        <Link
                            href="/dashboard/super-admin/audit-logs"
                            className="rounded-md border px-3 py-2 text-xs font-medium"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                            }}
                        >
                            Audit log
                        </Link>
                        <Link
                            href="/dashboard/super-admin/platform-config"
                            className="rounded-md px-3 py-2 text-xs font-semibold"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Platform config
                        </Link>
                    </>
                }
            />

            {/* Platform pulse */}
            <section className="dash-reveal dash-reveal-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.length === 0
                    ? [
                          "Active learners",
                          "Institutions",
                          "Active courses",
                          "Pending review",
                      ].map((label) => (
                          <StatTile
                              key={`pulse-skel-${label}`}
                              label={label}
                              value="—"
                              footnote="Awaiting telemetry"
                          />
                      ))
                    : kpis.map((item) => (
                          <StatTile
                              key={item.label}
                              label={item.label}
                              value={item.value}
                              footnote={item.hint}
                          />
                      ))}
            </section>

            {/* Roles + Attendance */}
            <section className="dash-reveal dash-reveal-3 grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <Panel
                        eyebrow="Population"
                        title="Members by role"
                        description="Active accounts across the platform."
                    >
                        {Object.keys(countsByRole).length === 0 ? (
                            <PageEmpty title="No role assignments yet" />
                        ) : (
                            <ul className="space-y-3">
                                {Object.entries(countsByRole)
                                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                                    .map(([role, count]) => {
                                        const numeric = Number(count) || 0;
                                        const total = Object.values(
                                            countsByRole,
                                        ).reduce(
                                            (acc, v) => acc + (Number(v) || 0),
                                            0,
                                        );
                                        const pct =
                                            total > 0
                                                ? Math.round(
                                                      (numeric / total) * 100,
                                                  )
                                                : 0;
                                        return (
                                            <li key={role}>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span
                                                        style={{
                                                            color: "var(--dashboard-fg)",
                                                        }}
                                                    >
                                                        {ROLE_LABELS[role] ??
                                                            role}
                                                    </span>
                                                    <span
                                                        style={{
                                                            color: "var(--dashboard-muted)",
                                                        }}
                                                    >
                                                        {new Intl.NumberFormat().format(
                                                            numeric,
                                                        )}
                                                    </span>
                                                </div>
                                                <div
                                                    className="mt-1 h-1 w-full overflow-hidden rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            "var(--dashboard-border)",
                                                    }}
                                                >
                                                    <div
                                                        className="h-full"
                                                        style={{
                                                            width: `${pct}%`,
                                                            backgroundColor:
                                                                "var(--role-accent)",
                                                        }}
                                                    />
                                                </div>
                                            </li>
                                        );
                                    })}
                            </ul>
                        )}
                    </Panel>
                </div>

                <div className="lg:col-span-3">
                    <Panel
                        eyebrow="Operations"
                        title="Attendance · last 30 days"
                        description="Platform-wide presence across all institutions."
                    >
                        {!attendance.total ? (
                            <PageEmpty title="No attendance recorded in this window" />
                        ) : (
                            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                                <div
                                    className="flex flex-col items-center justify-center rounded-xl border px-4 py-6"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "color-mix(in srgb, var(--dashboard-surface) 92%, var(--role-accent) 8%)",
                                    }}
                                >
                                    <p
                                        className="text-[11px] uppercase tracking-[0.24em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        Attendance
                                    </p>
                                    <p
                                        className="mt-2 font-display text-5xl tracking-tight"
                                        style={{
                                            color: "var(--role-accent)",
                                            fontWeight: 400,
                                        }}
                                    >
                                        {attendance.ratePercent ?? "—"}
                                        <span className="text-2xl align-top">
                                            %
                                        </span>
                                    </p>
                                    <p
                                        className="mt-1 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        across{" "}
                                        {new Intl.NumberFormat().format(
                                            attendance.total,
                                        )}{" "}
                                        records
                                    </p>
                                </div>

                                <dl className="grid grid-cols-3 gap-3">
                                    <AttendanceCell
                                        label="Present"
                                        value={attendance.PRESENT}
                                        tone="success"
                                    />
                                    <AttendanceCell
                                        label="Late"
                                        value={attendance.LATE}
                                        tone="warning"
                                    />
                                    <AttendanceCell
                                        label="Absent"
                                        value={attendance.ABSENT}
                                        tone="danger"
                                    />
                                </dl>
                            </div>
                        )}
                    </Panel>
                </div>
            </section>

            {/* Entities */}
            <section className="dash-reveal dash-reveal-4 grid gap-6 md:grid-cols-3">
                <Panel eyebrow="Assignments" title="Workload">
                    <dl className="space-y-3 text-sm">
                        <KeyValue
                            label="Total"
                            value={entities.assignments?.total}
                        />
                        <KeyValue
                            label="Submitted (30d)"
                            value={entities.assignments?.submittedLast30d}
                        />
                        <KeyValue
                            label="Pending review"
                            value={entities.assignments?.pendingReview}
                            emphasis
                        />
                    </dl>
                </Panel>

                <Panel eyebrow="Assessments" title="Catalogue">
                    <dl className="space-y-3 text-sm">
                        <KeyValue
                            label="Total"
                            value={entities.assessments?.total}
                        />
                    </dl>
                </Panel>

                <Panel eyebrow="People" title="Headcount">
                    <dl className="space-y-3 text-sm">
                        <KeyValue label="Students" value={entities.students} />
                        <KeyValue label="Trainers" value={entities.trainers} />
                    </dl>
                </Panel>
            </section>

            {/* Recent institutions + submissions */}
            <section className="dash-reveal dash-reveal-5 grid gap-6 lg:grid-cols-2">
                <Panel
                    eyebrow="Network"
                    title="Recently added institutions"
                    actions={
                        <Link
                            href="/dashboard/super-admin/institutions"
                            className="text-xs font-semibold"
                            style={{ color: "var(--role-accent)" }}
                        >
                            All institutions →
                        </Link>
                    }
                >
                    {(recent.institutions ?? []).length === 0 ? (
                        <PageEmpty title="No institutions yet" />
                    ) : (
                        <ul className="space-y-3">
                            {recent.institutions.map((i) => (
                                <li
                                    key={i.id}
                                    className="flex items-center justify-between rounded-lg border px-3 py-3"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <div className="min-w-0">
                                        <p
                                            className="font-display text-sm font-medium"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {i.name}
                                        </p>
                                        <p
                                            className="mt-0.5 text-[11px] uppercase tracking-[0.18em]"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {[
                                                i.type,
                                                i.city,
                                                `${i.batchCount ?? 0} batches`,
                                                `${i.memberCount ?? 0} members`,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </p>
                                    </div>
                                    <span
                                        className="shrink-0 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {formatDate(i.createdAt)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    eyebrow="Activity"
                    title="Recent submissions"
                    actions={
                        <Link
                            href="/dashboard/super-admin/platform-analytics"
                            className="text-xs font-semibold"
                            style={{ color: "var(--role-accent)" }}
                        >
                            Analytics →
                        </Link>
                    }
                >
                    {(recent.submissions ?? []).length === 0 ? (
                        <PageEmpty title="No submissions yet" />
                    ) : (
                        <ul className="space-y-3">
                            {recent.submissions.map((s) => (
                                <li
                                    key={s.id}
                                    className="rounded-lg border px-3 py-3"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p
                                            className="truncate font-display text-sm font-medium"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {s.assignmentTitle ||
                                                "Untitled assignment"}
                                        </p>
                                        <SubmissionPill status={s.status} />
                                    </div>
                                    <p
                                        className="mt-1 text-[11px] uppercase tracking-[0.18em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {[
                                            s.studentName || "Unknown",
                                            s.institutionName,
                                            formatDate(
                                                s.submittedAt || s.createdAt,
                                            ),
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </section>
        </div>
    );
};

const AttendanceCell = ({ label, value, tone }) => {
    const toneFg =
        tone === "success"
            ? "#047857"
            : tone === "warning"
              ? "#92400e"
              : "#b91c1c";
    const toneBg =
        tone === "success"
            ? "rgba(16, 185, 129, 0.10)"
            : tone === "warning"
              ? "rgba(217, 119, 6, 0.10)"
              : "rgba(220, 38, 38, 0.10)";
    return (
        <div
            className="rounded-xl border px-3 py-4 text-center"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: toneBg,
            }}
        >
            <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </p>
            <p
                className="mt-2 font-display text-2xl"
                style={{ color: toneFg, fontWeight: 500 }}
            >
                {new Intl.NumberFormat().format(Number(value) || 0)}
            </p>
        </div>
    );
};

const KeyValue = ({ label, value, emphasis = false }) => (
    <div className="flex items-center justify-between">
        <dt style={{ color: "var(--dashboard-muted)" }}>{label}</dt>
        <dd
            className={
                emphasis ? "font-display text-lg" : "text-sm font-medium"
            }
            style={{
                color: emphasis ? "var(--role-accent)" : "var(--dashboard-fg)",
            }}
        >
            {value != null
                ? new Intl.NumberFormat().format(Number(value) || 0)
                : "—"}
        </dd>
    </div>
);

const SubmissionPill = ({ status }) => {
    const map = {
        SUBMITTED: { bg: "rgba(2, 132, 199, 0.12)", fg: "#075985" },
        REVIEWED: { bg: "rgba(16, 185, 129, 0.12)", fg: "#047857" },
        REJECTED: { bg: "rgba(220, 38, 38, 0.12)", fg: "#b91c1c" },
        PENDING: { bg: "rgba(217, 119, 6, 0.12)", fg: "#92400e" },
    };
    const tone = map[String(status || "").toUpperCase()] || {
        bg: "var(--role-accent-soft)",
        fg: "var(--role-accent)",
    };
    return (
        <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
        >
            {status || "—"}
        </span>
    );
};

export default SuperAdminDashboard;
