"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { fetchInstitutionDetail } from "@/features/dashboard/api/superAdmin.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import StatTile from "@/features/dashboard/components/ui/widgets/StatTile";
import { api } from "@/lib/api";

/**
 * SUPER_ADMIN — Institution detail.
 *
 * Aggregated view of a single institution: charter info, batch roster,
 * elevated-member directory, recent announcements, and 30-day operational
 * metrics. Reads from `GET /admin/institutions/:id`; the activation toggle
 * piggybacks on the existing `PATCH /institutions/:id` endpoint so we don't
 * fork a separate write path.
 */

const ROLE_LABELS = {
    SUPER_ADMIN: "Super admin",
    ADMIN: "Admin",
    INSTITUTION_COORDINATOR: "Coordinator",
    TRAINER: "Trainer",
    STUDENT: "Student",
};

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

const InstitutionDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const { status } = useSession();
    const id = params?.id;

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionInfo, setActionInfo] = useState(null);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const result = await fetchInstitutionDetail(id);
            setDetail(result);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }
        if (status === "authenticated") load();
    }, [status, load, router]);

    async function toggleActive() {
        if (busy || !detail) return;
        const next = !detail.institution.isActive;
        const ok = confirm(
            `${next ? "Reactivate" : "Deactivate"} ${detail.institution.name}?`,
        );
        if (!ok) return;
        setBusy(true);
        setActionError(null);
        setActionInfo(null);
        try {
            await api(`/institutions/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ isActive: next }),
            });
            setActionInfo(
                `${next ? "Reactivated" : "Deactivated"} ${detail.institution.name}.`,
            );
            await load();
        } catch (err) {
            setActionError(err?.message || "Failed to update");
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <PageLoading label="Loading institution detail" />;
    if (error)
        return (
            <PageError
                title="Could not load institution"
                message={error}
                onRetry={load}
            />
        );
    if (!detail)
        return (
            <PageEmpty
                title="Institution not found"
                description="It may have been deleted or you may not have access."
            />
        );

    const i = detail.institution;
    const s = detail.summary;
    const att = s.attendance30d;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow={`Institution · ${i.type}`}
                title={i.name}
                subtitle={
                    [i.city, i.state].filter(Boolean).join(", ") ||
                    "Location not on file"
                }
                actions={
                    <>
                        <Link
                            href="/dashboard/super-admin/institutions"
                            className="rounded-md border px-3 py-2 text-xs font-medium"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                            }}
                        >
                            ← All institutions
                        </Link>
                        <button
                            type="button"
                            onClick={toggleActive}
                            disabled={busy}
                            className="rounded-md px-3 py-2 text-xs font-semibold disabled:opacity-60"
                            style={{
                                backgroundColor: i.isActive
                                    ? "transparent"
                                    : "var(--role-accent)",
                                color: i.isActive
                                    ? "#b91c1c"
                                    : "var(--role-accent-ink)",
                                border: `1px solid ${i.isActive ? "#fecaca" : "var(--role-accent)"}`,
                                cursor: busy ? "wait" : "pointer",
                            }}
                        >
                            {busy
                                ? "Working…"
                                : i.isActive
                                  ? "Deactivate"
                                  : "Reactivate"}
                        </button>
                    </>
                }
            />

            {actionError && (
                <p
                    className="rounded-md border px-4 py-3 text-sm"
                    style={{
                        borderColor: "#fecaca",
                        backgroundColor: "rgba(254, 226, 226, 0.6)",
                        color: "#b91c1c",
                    }}
                >
                    {actionError}
                </p>
            )}
            {actionInfo && (
                <p
                    className="rounded-md border px-4 py-3 text-sm"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--role-accent-soft)",
                        color: "var(--role-accent)",
                    }}
                >
                    {actionInfo}
                </p>
            )}

            <section className="dash-reveal dash-reveal-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                    label="Batches"
                    value={s.batches.total}
                    footnote={`${s.batches.active} active`}
                />
                <StatTile label="Students" value={s.students} />
                <StatTile label="Trainers" value={s.trainers} />
                <StatTile
                    label="Attendance · 30d"
                    value={
                        att.ratePercent == null ? "—" : `${att.ratePercent}%`
                    }
                    footnote={`${att.total} records`}
                />
            </section>

            <section className="grid gap-6 lg:grid-cols-5">
                <Panel
                    eyebrow="Charter"
                    title="Institution record"
                    className="lg:col-span-2"
                >
                    <dl className="space-y-3 text-sm">
                        <KV label="Type" value={i.type} />
                        <KV label="City" value={i.city || "—"} />
                        <KV label="State" value={i.state || "—"} />
                        <KV label="Address" value={i.address || "—"} />
                        <KV
                            label="Contact email"
                            value={i.contactEmail || "—"}
                        />
                        <KV
                            label="Contact phone"
                            value={i.contactPhone || "—"}
                        />
                        <KV label="Created" value={formatDate(i.createdAt)} />
                        <KV
                            label="Status"
                            value={
                                <span
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                    style={{
                                        backgroundColor: i.isActive
                                            ? "rgba(16, 185, 129, 0.12)"
                                            : "rgba(148, 163, 184, 0.16)",
                                        color: i.isActive
                                            ? "#047857"
                                            : "var(--dashboard-muted)",
                                    }}
                                >
                                    {i.isActive ? "Active" : "Inactive"}
                                </span>
                            }
                        />
                    </dl>
                </Panel>

                <Panel
                    eyebrow="Workload"
                    title="Assignments (30d window)"
                    description="Workload measured on this institution's batches."
                    className="lg:col-span-3"
                >
                    <dl className="grid gap-4 sm:grid-cols-3">
                        <StatRow
                            label="Total assignments"
                            value={s.assignments.total}
                        />
                        <StatRow
                            label="Submitted (30d)"
                            value={s.assignments.submittedLast30d}
                        />
                        <StatRow
                            label="Pending review"
                            value={s.assignments.pendingReview}
                            emphasis
                        />
                    </dl>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <AttendanceCell
                            label="Present"
                            value={att.PRESENT || 0}
                            tone="success"
                        />
                        <AttendanceCell
                            label="Late"
                            value={att.LATE || 0}
                            tone="warning"
                        />
                        <AttendanceCell
                            label="Absent"
                            value={att.ABSENT || 0}
                            tone="danger"
                        />
                    </div>
                </Panel>
            </section>

            <Panel
                eyebrow="Roster"
                title={`Batches (${detail.batches.length})`}
                description="All batches that have ever been chartered under this institution."
                padded={false}
            >
                {detail.batches.length === 0 ? (
                    <div className="px-6 py-10">
                        <PageEmpty title="No batches yet" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr
                                    className="text-[10px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    <th className="px-6 py-3 font-medium">
                                        Name
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Course
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Students
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Trainers
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Window
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.batches.map((b) => (
                                    <tr
                                        key={b.id}
                                        className="border-t"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td
                                            className="px-6 py-3"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {b.name}
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {b.courseTitle || "—"}
                                        </td>
                                        <td
                                            className="px-3 py-3"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {b.studentCount}
                                        </td>
                                        <td
                                            className="px-3 py-3"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {b.trainerCount}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor: b.isActive
                                                        ? "rgba(16, 185, 129, 0.12)"
                                                        : "rgba(148, 163, 184, 0.16)",
                                                    color: b.isActive
                                                        ? "#047857"
                                                        : "var(--dashboard-muted)",
                                                }}
                                            >
                                                {b.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        <td
                                            className="px-6 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {formatDate(b.startDate)} →{" "}
                                            {b.endDate
                                                ? formatDate(b.endDate)
                                                : "open"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            <section className="grid gap-6 lg:grid-cols-2">
                <Panel
                    eyebrow="People"
                    title={`Elevated roles (${detail.members.length})`}
                    description="Every active role assignment scoped to this institution."
                    padded={false}
                >
                    {detail.members.length === 0 ? (
                        <div className="px-6 py-10">
                            <PageEmpty title="No elevated members" />
                        </div>
                    ) : (
                        <ul
                            className="divide-y"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {detail.members.map((m) => (
                                <li key={m.assignmentId} className="px-6 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p
                                                className="truncate text-sm font-medium"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {m.fullName}
                                            </p>
                                            <p
                                                className="truncate text-xs"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {m.email}
                                            </p>
                                        </div>
                                        <span
                                            className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                            style={{
                                                backgroundColor:
                                                    "var(--role-accent-soft)",
                                                color: "var(--role-accent)",
                                            }}
                                        >
                                            {ROLE_LABELS[m.role] ?? m.role}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    eyebrow="Activity"
                    title="Recent announcements"
                    description="Latest five posts to any batch in this institution."
                    padded={false}
                >
                    {detail.recentAnnouncements.length === 0 ? (
                        <div className="px-6 py-10">
                            <PageEmpty title="No announcements yet" />
                        </div>
                    ) : (
                        <ul
                            className="divide-y"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {detail.recentAnnouncements.map((a) => (
                                <li key={a.id} className="px-6 py-3">
                                    <p
                                        className="text-sm font-medium"
                                        style={{
                                            color: "var(--dashboard-fg)",
                                        }}
                                    >
                                        {a.title}
                                    </p>
                                    <p
                                        className="mt-0.5 text-[11px]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.authorName || "Unknown author"}
                                        {a.batchName ? ` · ${a.batchName}` : ""}
                                        {" · "}
                                        {formatDate(a.createdAt)}
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

const KV = ({ label, value }) => (
    <div className="flex items-start justify-between gap-3">
        <dt
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </dt>
        <dd
            className="text-right text-sm"
            style={{ color: "var(--dashboard-fg)" }}
        >
            {value}
        </dd>
    </div>
);

const StatRow = ({ label, value, emphasis }) => (
    <div>
        <p
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </p>
        <p
            className={`mt-1 font-display ${emphasis ? "text-2xl" : "text-xl"}`}
            style={{
                color: emphasis ? "var(--role-accent)" : "var(--dashboard-fg)",
                fontWeight: 500,
            }}
        >
            {new Intl.NumberFormat().format(Number(value) || 0)}
        </p>
    </div>
);

const AttendanceCell = ({ label, value, tone }) => {
    const fg =
        tone === "success"
            ? "#047857"
            : tone === "warning"
              ? "#92400e"
              : "#b91c1c";
    const bg =
        tone === "success"
            ? "rgba(16, 185, 129, 0.10)"
            : tone === "warning"
              ? "rgba(217, 119, 6, 0.10)"
              : "rgba(220, 38, 38, 0.10)";
    return (
        <div
            className="rounded-xl border px-3 py-3 text-center"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: bg,
            }}
        >
            <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </p>
            <p
                className="mt-1 font-display text-xl"
                style={{ color: fg, fontWeight: 500 }}
            >
                {new Intl.NumberFormat().format(Number(value) || 0)}
            </p>
        </div>
    );
};

export default InstitutionDetailPage;
