"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAuditLogs } from "@/features/dashboard/api/superAdmin.api";
import {
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { NAV_CONFIG } from "@/features/dashboard/config/navConfig";
import {
    extractErrorMessage,
    LifecycleBadge,
} from "@/features/dashboard/super-admin/governanceShared";

/**
 * SUPER_ADMIN Overview — operational governance command center.
 *
 * One question on open: what needs the super admin's decision right now?
 * Sections, in order:
 *   Header              — compact governance status bar (status, alerts,
 *                         pending approvals, last updated, refresh)
 *   1. Requires attention — severity-ranked, actionable signal feed
 *   2. Quick actions      — primary + secondary operational shortcuts
 *   3. Operational snapshot — governance counts (NOT vanity totals)
 *   5. Institution watchlist — institutions that need attention
 *   6. Recent governance     — live audit trail, governance actions only
 *
 * Data sources (all existing): /api/admin/platform/overview (proxy),
 * /api/admin/institutions (proxy, returns per-institution status), and
 * /admin/audit-logs. Where the backend has no signal yet (per-institution
 * attendance, admin activity, inactive trainer/admin counts) the UI shows an
 * honest "pending" boundary — it never fabricates a number.
 */

// Governance policy threshold (config, not data): platform attendance below
// this over the trailing 30 days is flagged.
const ATTENDANCE_TARGET = 75;

// Severity tones reuse palettes already shipped across the governance pages:
// critical → the real --dashboard-danger token (adapts per theme); warning →
// the amber from governanceShared's LIFECYCLE_TONES; info → the role accent;
// ok → the green LIFECYCLE_TONES uses for ACTIVE. This is reuse, not a new
// color system.
const SEVERITY_TONES = {
    critical: {
        label: "Critical",
        fg: "var(--dashboard-danger, #dc2626)",
        bg: "color-mix(in srgb, var(--dashboard-danger, #dc2626) 12%, transparent)",
    },
    warning: {
        label: "Warning",
        fg: "#b45309",
        bg: "rgba(245, 158, 11, 0.16)",
    },
    info: {
        label: "Heads up",
        fg: "var(--role-accent)",
        bg: "var(--role-accent-soft)",
    },
    ok: {
        label: "Stable",
        fg: "#047857",
        bg: "rgba(16, 185, 129, 0.12)",
    },
};

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2, ok: 3 };

// Reuse the sidebar's icon set by mapping route → icon path. Keeps the command
// center visually consistent with the nav without re-declaring SVG paths.
const NAV_ICONS = Object.fromEntries(
    (NAV_CONFIG.SUPER_ADMIN?.items ?? []).map((item) => [item.href, item.icon]),
);

// Warning-triangle path for signals that have no route-based icon.
const ALERT_ICON =
    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01";

const QUICK_ACTIONS_PRIMARY = [
    {
        label: "Create institution",
        hint: "Charter a partner",
        href: "/dashboard/super-admin/institutions",
    },
    {
        label: "Create admin",
        hint: "Onboard governance",
        href: "/dashboard/super-admin/admin-management",
    },
    {
        label: "User directory",
        hint: "Global accounts",
        href: "/dashboard/super-admin/users",
    },
    {
        label: "Audit logs",
        hint: "Full trail",
        href: "/dashboard/super-admin/audit-logs",
    },
];

const QUICK_ACTIONS_SECONDARY = [
    {
        label: "Platform analytics",
        href: "/dashboard/super-admin/platform-analytics",
    },
    {
        label: "Review approvals",
        href: "/dashboard/super-admin/institution-lifecycle",
    },
];

// Allowlist: only these audit actions are governance activity. Anything else
// (submissions, attendance, module progress, …) is student-learning and is
// intentionally excluded from this surface.
const GOVERNANCE_ACTION_LABELS = {
    "institution.create": "Institution chartered",
    "institution.suspend": "Institution suspended",
    "institution.reactivate": "Institution reactivated",
    "institution.archive": "Institution archived",
    "admin.create": "Admin created",
    "admin.terminate": "Admin terminated",
    "trainer.suspend": "Trainer suspended",
    "trainer.deactivate": "Trainer deactivated",
    "trainer.reactivate": "Trainer reactivated",
    "trainer.terminate": "Trainer terminated",
    "role.grant": "Role granted",
    "role.revoke": "Role revoked",
    "user.suspend": "User suspended",
    "user.deactivate": "User deactivated",
    "user.reactivate": "User reactivated",
};

const DESTRUCTIVE_ACTIONS = new Set([
    "institution.suspend",
    "institution.archive",
    "admin.terminate",
    "trainer.suspend",
    "trainer.deactivate",
    "trainer.terminate",
    "role.revoke",
    "user.suspend",
    "user.deactivate",
]);

function formatStamp(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "—";
    }
}

// Status is authoritative on the institution; fall back to the legacy isActive
// mirror exactly as the lifecycle page does.
function getInstStatus(institution) {
    return (
        institution.status ?? (institution.isActive ? "ACTIVE" : "SUSPENDED")
    );
}

// Pure: build the ranked attention feed from whatever data is available.
function buildSignals({ overview, statusCounts, instReady }) {
    const out = [];

    if (overview) {
        const recentBatches = Array.isArray(overview.recent?.batches)
            ? overview.recent.batches
            : [];
        const untrained = recentBatches.filter(
            (b) => (b.trainerCount ?? 0) === 0,
        );
        if (untrained.length > 0) {
            const names = untrained
                .slice(0, 3)
                .map((b) => b.name)
                .filter(Boolean)
                .join(", ");
            out.push({
                id: "batches-without-trainer",
                severity: "critical",
                title: `${untrained.length} recent ${untrained.length === 1 ? "batch" : "batches"} without a trainer`,
                detail: names
                    ? `Unassigned: ${names}. Cohorts may be running unsupervised.`
                    : "Cohorts may be running unsupervised — assign a trainer.",
                href: "/dashboard/super-admin/trainer-management",
                cta: "Assign trainers",
            });
        }
    }

    if (instReady) {
        if (statusCounts.SUSPENDED > 0) {
            out.push({
                id: "suspended-institutions",
                severity: "warning",
                title: `${statusCounts.SUSPENDED} institution${statusCounts.SUSPENDED === 1 ? "" : "s"} suspended`,
                detail: "Operations are paused — reactivate or archive.",
                href: "/dashboard/super-admin/institution-lifecycle",
                cta: "Review lifecycle",
            });
        }
        if (statusCounts.PENDING_APPROVAL > 0) {
            out.push({
                id: "pending-approvals",
                severity: "warning",
                title: `${statusCounts.PENDING_APPROVAL} institution${statusCounts.PENDING_APPROVAL === 1 ? "" : "s"} awaiting approval`,
                detail: "New charters are waiting on a governance decision.",
                href: "/dashboard/super-admin/institution-lifecycle",
                cta: "Review approvals",
            });
        }
    } else if (overview) {
        const inst = overview.entities?.institutions ?? {};
        const inactive = Math.max((inst.total ?? 0) - (inst.active ?? 0), 0);
        if (inactive > 0) {
            out.push({
                id: "inactive-institutions",
                severity: "warning",
                title: `${inactive} institution${inactive === 1 ? "" : "s"} not active`,
                detail: "Suspended or archived — confirm the state is intended.",
                href: "/dashboard/super-admin/institution-lifecycle",
                cta: "Review lifecycle",
            });
        }
    }

    if (overview) {
        const att = overview.attendance30d ?? {};
        const rate =
            typeof att.ratePercent === "number" ? att.ratePercent : null;
        if (rate !== null && (att.total ?? 0) > 0 && rate < ATTENDANCE_TARGET) {
            out.push({
                id: "low-attendance",
                severity: "warning",
                title: `Platform attendance is ${rate}%`,
                detail: `Below the ${ATTENDANCE_TARGET}% target across the last 30 days.`,
                href: "/dashboard/super-admin/platform-analytics",
                cta: "Open analytics",
            });
        }

        const users = overview.entities?.users ?? {};
        const inactiveUsers = Math.max(
            (users.total ?? 0) - (users.active ?? 0),
            0,
        );
        if (inactiveUsers > 0) {
            out.push({
                id: "accounts-review",
                severity: "info",
                title: `${inactiveUsers} account${inactiveUsers === 1 ? "" : "s"} need review`,
                detail: "Suspended, inactive, or terminated accounts in the directory.",
                href: "/dashboard/super-admin/users",
                cta: "Open directory",
            });
        }
    }

    return out.sort(
        (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
    );
}

function Icon({ path, className = "h-4 w-4" }) {
    if (!path) return null;
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={path} />
        </svg>
    );
}

function StatusChip({ tone, label }) {
    const t = SEVERITY_TONES[tone] ?? SEVERITY_TONES.ok;
    return (
        <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: t.bg, color: t.fg }}
        >
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.fg }}
                aria-hidden="true"
            />
            {label}
        </span>
    );
}

// Compact, clickable summary stat for the header bar.
function HeaderMetric({ label, value, tone = "ok", href }) {
    const t = SEVERITY_TONES[tone] ?? SEVERITY_TONES.ok;
    const numeric = typeof value === "number";
    const emphasize = numeric && value > 0;
    const inner = (
        <>
            <span
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </span>
            <span
                className="font-display text-lg leading-none"
                style={{
                    color: emphasize ? t.fg : "var(--dashboard-fg)",
                }}
            >
                {value}
            </span>
        </>
    );
    const className =
        "flex flex-col gap-1 rounded-lg border px-3 py-1.5 transition-colors hover:bg-[var(--role-accent-soft)]";
    const style = {
        borderColor: "var(--dashboard-border)",
        backgroundColor: "var(--dashboard-surface)",
    };
    if (href?.startsWith("#")) {
        return (
            <a href={href} className={className} style={style}>
                {inner}
            </a>
        );
    }
    return (
        <Link href={href} className={className} style={style}>
            {inner}
        </Link>
    );
}

// A single row in the attention feed. Whole row navigates.
function AttentionRow({ signal }) {
    const tone = SEVERITY_TONES[signal.severity] ?? SEVERITY_TONES.info;
    return (
        <Link
            href={signal.href}
            className="group flex items-center gap-3 border-l-[3px] px-4 py-3 transition-colors hover:bg-[var(--role-accent-soft)]"
            style={{ borderLeftColor: tone.fg }}
        >
            <span
                className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: tone.bg, color: tone.fg }}
            >
                {tone.label}
            </span>
            <div className="min-w-0 flex-1">
                <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    {signal.title}
                </p>
                <p
                    className="truncate text-xs"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {signal.detail}
                </p>
            </div>
            <span
                className="hidden shrink-0 items-center gap-1 text-xs font-semibold sm:inline-flex"
                style={{ color: "var(--role-accent)" }}
            >
                {signal.cta}
                <span className="transition-transform group-hover:translate-x-0.5">
                    →
                </span>
            </span>
        </Link>
    );
}

function PrimaryAction({ action }) {
    return (
        <Link
            href={action.href}
            className="group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all hover:-translate-y-[2px]"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
            }}
        >
            <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                    backgroundColor: "var(--role-accent-soft)",
                    color: "var(--role-accent)",
                }}
            >
                <Icon
                    path={NAV_ICONS[action.href]}
                    className="h-[18px] w-[18px]"
                />
            </span>
            <div className="min-w-0">
                <p
                    className="font-display text-sm"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    {action.label}
                </p>
                <p
                    className="text-[11px]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {action.hint}
                </p>
            </div>
        </Link>
    );
}

// Compact operational stat. `boundary` tiles render a clear "—" + pending tag
// instead of a fabricated value.
function SnapshotTile({ tile }) {
    const tone = SEVERITY_TONES[tile.severity] ?? SEVERITY_TONES.ok;
    const showValueTone =
        !tile.boundary && typeof tile.value === "number" && tile.value > 0;
    const icon = tile.icon ?? NAV_ICONS[tile.href];
    const inner = (
        <>
            <div className="flex items-center justify-between gap-2">
                <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                    style={{
                        backgroundColor: "var(--role-accent-soft)",
                        color: "var(--role-accent)",
                    }}
                >
                    <Icon path={icon} className="h-[15px] w-[15px]" />
                </span>
                {tile.boundary ? (
                    <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                        style={{
                            backgroundColor: "var(--dashboard-border)",
                            color: "var(--dashboard-muted)",
                        }}
                    >
                        Pending
                    </span>
                ) : showValueTone ? (
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tone.fg }}
                        aria-hidden="true"
                    />
                ) : null}
            </div>
            <p
                className="mt-2 font-display text-2xl leading-none"
                style={{
                    color: tile.boundary
                        ? "var(--dashboard-muted)"
                        : showValueTone
                          ? tone.fg
                          : "var(--dashboard-fg)",
                }}
            >
                {tile.boundary ? "—" : tile.value}
            </p>
            <p
                className="mt-1.5 text-[11px] leading-tight"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {tile.label}
            </p>
        </>
    );
    const className =
        "flex flex-col rounded-xl border px-4 py-3 transition-all hover:-translate-y-[2px]";
    const style = {
        borderColor: "var(--dashboard-border)",
        backgroundColor: "var(--dashboard-surface)",
        boxShadow: "var(--dashboard-shadow)",
    };
    if (tile.href?.startsWith("#")) {
        return (
            <a href={tile.href} className={className} style={style}>
                {inner}
            </a>
        );
    }
    return (
        <Link href={tile.href} className={className} style={style}>
            {inner}
        </Link>
    );
}

function RiskChip({ risk }) {
    const tone = SEVERITY_TONES[risk.severity] ?? SEVERITY_TONES.info;
    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
        >
            {risk.label}
        </span>
    );
}

// Boundary cell: the backend has no per-institution attendance / admin-activity
// feed yet, so render an explicit unavailable marker rather than a fake value.
function PendingCell() {
    return (
        <span
            className="text-xs"
            style={{ color: "var(--dashboard-muted)" }}
            title="Live reporting feed pending"
        >
            —
        </span>
    );
}

function GovernanceRow({ event }) {
    const label = GOVERNANCE_ACTION_LABELS[event.action] ?? event.action;
    const destructive = DESTRUCTIVE_ACTIONS.has(event.action);
    const dot = destructive
        ? "var(--dashboard-danger, #dc2626)"
        : "var(--role-accent)";
    const actor = event.actorName || event.actorEmail || "System";
    const target = event.institutionName || event.entityType || "";
    return (
        <Link
            href="/dashboard/super-admin/audit-logs"
            className="flex items-start gap-3 px-5 py-2.5 transition-colors hover:bg-[var(--role-accent-soft)]"
        >
            <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: dot }}
                aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm" style={{ color: "var(--dashboard-fg)" }}>
                    {label}
                    {target ? (
                        <span style={{ color: "var(--dashboard-muted)" }}>
                            {" "}
                            · {target}
                        </span>
                    ) : null}
                </p>
                <p
                    className="text-[11px]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {actor} · {formatStamp(event.createdAt)}
                </p>
            </div>
        </Link>
    );
}

function InlineError({ message, onRetry }) {
    return (
        <div className="px-5 py-5">
            <div
                className="flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm"
                style={{
                    borderColor: "#fecaca",
                    backgroundColor: "rgba(254, 226, 226, 0.6)",
                    color: "#b91c1c",
                }}
            >
                <span>{message}</span>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="shrink-0 text-xs font-semibold"
                        style={{ cursor: "pointer", color: "inherit" }}
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}

const SuperAdminOverview = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [institutions, setInstitutions] = useState(null);
    const [instError, setInstError] = useState(null);

    const [activity, setActivity] = useState(null);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityError, setActivityError] = useState(null);

    const loadOverview = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/admin/platform/overview", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
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
            setError(extractErrorMessage(err, "Unknown error"));
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, router]);

    const loadInstitutions = useCallback(async () => {
        if (!session?.accessToken) return;
        setInstError(null);
        try {
            const response = await fetch("/api/admin/institutions", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
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
            const body = await response.json();
            setInstitutions(Array.isArray(body) ? body : body.data || []);
        } catch (err) {
            setInstError(
                extractErrorMessage(err, "Could not load institutions"),
            );
        }
    }, [session?.accessToken, router]);

    const loadActivity = useCallback(async () => {
        setActivityLoading(true);
        setActivityError(null);
        try {
            const payload = await fetchAuditLogs({ limit: 40 });
            const events = Array.isArray(payload?.events) ? payload.events : [];
            setActivity(
                events
                    .filter((e) => GOVERNANCE_ACTION_LABELS[e.action])
                    .slice(0, 6),
            );
        } catch (err) {
            setActivityError(
                extractErrorMessage(err, "Could not load activity"),
            );
        } finally {
            setActivityLoading(false);
        }
    }, []);

    const refreshAll = useCallback(() => {
        loadOverview();
        loadInstitutions();
        loadActivity();
    }, [loadOverview, loadInstitutions, loadActivity]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }
        if (status === "authenticated") {
            loadOverview();
            loadInstitutions();
            loadActivity();
        }
    }, [status, loadOverview, loadInstitutions, loadActivity, router]);

    const instReady = Array.isArray(institutions);

    const statusCounts = useMemo(() => {
        const list = Array.isArray(institutions) ? institutions : [];
        const counts = {
            ACTIVE: 0,
            SUSPENDED: 0,
            ARCHIVED: 0,
            PENDING_APPROVAL: 0,
            total: list.length,
        };
        for (const inst of list) {
            const s = getInstStatus(inst);
            counts[s] = (counts[s] ?? 0) + 1;
        }
        return counts;
    }, [institutions]);

    const signals = useMemo(
        () => buildSignals({ overview, statusCounts, instReady }),
        [overview, statusCounts, instReady],
    );

    const governanceStatus = useMemo(() => {
        if (signals.some((s) => s.severity === "critical")) {
            return { tone: "critical", label: "Action required" };
        }
        if (signals.some((s) => s.severity === "warning")) {
            return { tone: "warning", label: "Needs attention" };
        }
        return { tone: "ok", label: "Stable" };
    }, [signals]);

    const snapshot = useMemo(() => {
        const recentBatches = Array.isArray(overview?.recent?.batches)
            ? overview.recent.batches
            : [];
        const untrained = recentBatches.filter(
            (b) => (b.trainerCount ?? 0) === 0,
        ).length;
        const users = overview?.entities?.users ?? {};
        const accountsReview = Math.max(
            (users.total ?? 0) - (users.active ?? 0),
            0,
        );
        const suspended = instReady
            ? statusCounts.SUSPENDED
            : Math.max(
                  (overview?.entities?.institutions?.total ?? 0) -
                      (overview?.entities?.institutions?.active ?? 0),
                  0,
              );
        return [
            {
                id: "suspended",
                label: "Suspended institutions",
                value: suspended,
                severity: suspended > 0 ? "warning" : "ok",
                href: "/dashboard/super-admin/institution-lifecycle",
            },
            {
                id: "untrained",
                label: "Batches without trainer",
                value: untrained,
                severity: untrained > 0 ? "critical" : "ok",
                href: "/dashboard/super-admin/trainer-management",
            },
            {
                id: "alerts",
                label: "Open governance alerts",
                value: signals.length,
                severity: signals[0]?.severity ?? "ok",
                href: "#requires-attention",
                icon: ALERT_ICON,
            },
            {
                id: "accounts",
                label: "Accounts to review",
                value: accountsReview,
                severity: accountsReview > 0 ? "warning" : "ok",
                href: "/dashboard/super-admin/users",
            },
            {
                id: "inactive-trainers",
                label: "Inactive trainers",
                boundary: true,
                href: "/dashboard/super-admin/trainer-management",
            },
            {
                id: "inactive-admins",
                label: "Inactive admins",
                boundary: true,
                href: "/dashboard/super-admin/admin-management",
            },
        ];
    }, [overview, statusCounts, instReady, signals]);

    const watchlist = useMemo(() => {
        const list = Array.isArray(institutions) ? institutions : [];
        return list
            .map((inst) => {
                const st = getInstStatus(inst);
                const batchCount = inst.batches?.length ?? inst.batchCount ?? 0;
                let risk = null;
                if (st === "SUSPENDED") {
                    risk = { label: "High", severity: "critical" };
                } else if (st === "PENDING_APPROVAL") {
                    risk = { label: "Review", severity: "warning" };
                } else if (st === "ACTIVE" && batchCount === 0) {
                    risk = { label: "Watch", severity: "warning" };
                }
                return { inst, status: st, batchCount, risk };
            })
            .filter((row) => row.risk !== null)
            .sort(
                (a, b) =>
                    SEVERITY_RANK[a.risk.severity] -
                    SEVERITY_RANK[b.risk.severity],
            );
    }, [institutions]);

    if (status === "loading" || (loading && !overview)) {
        return <PageLoading label="Loading command center" />;
    }

    if (error && !overview) {
        return (
            <PageError
                title="Could not load the command center"
                message={error}
                onRetry={loadOverview}
            />
        );
    }

    return (
        <div className="space-y-5">
            {/* Compact governance status bar — merges hero + top-bar so the
                attention feed sits near the top of the viewport. */}
            <header
                className="rounded-xl border"
                style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                    boxShadow: "var(--dashboard-shadow)",
                }}
            >
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        {/* <span
                            className="dash-live-dot inline-flex h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: "var(--role-accent)" }}
                            aria-hidden="true"
                        /> */}
                        <div className="min-w-0">
                            <p
                                className="text-[10px] uppercase tracking-[0.22em]"
                                style={{ color: "var(--role-accent)" }}
                            >
                                Platform governance · Super Admin
                            </p>
                            <h1
                                className="font-display text-lg leading-tight md:text-xl"
                                style={{ color: "var(--dashboard-fg)" }}
                            >
                                Command center
                            </h1>
                        </div>
                        <StatusChip
                            tone={governanceStatus.tone}
                            label={governanceStatus.label}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <HeaderMetric
                            label="Open alerts"
                            value={signals.length}
                            tone={signals[0]?.severity ?? "ok"}
                            href="#requires-attention"
                        />
                        <HeaderMetric
                            label="Pending approvals"
                            value={
                                instReady ? statusCounts.PENDING_APPROVAL : "—"
                            }
                            tone="warning"
                            href="/dashboard/super-admin/institution-lifecycle"
                        />
                        <div className="flex flex-col items-end gap-1.5 pl-1">
                            <span
                                className="text-[10px] uppercase tracking-[0.16em]"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                Updated {formatStamp(overview?.generatedAt)}
                            </span>
                            <button
                                type="button"
                                onClick={refreshAll}
                                className="rounded-md border px-3 py-1 text-xs font-medium"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    color: "var(--dashboard-fg)",
                                    backgroundColor: "var(--dashboard-surface)",
                                    cursor: "pointer",
                                }}
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 1 — Requires attention (kept first). */}
            <section id="requires-attention" className="scroll-mt-24">
                <Panel
                    eyebrow="Requires attention"
                    title={
                        signals.length > 0
                            ? `${signals.length} signal${signals.length === 1 ? "" : "s"} to act on`
                            : "All clear"
                    }
                    padded={false}
                >
                    {signals.length === 0 ? (
                        <div className="flex items-start gap-3 px-5 py-5">
                            <span
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                style={{
                                    backgroundColor: SEVERITY_TONES.ok.bg,
                                    color: SEVERITY_TONES.ok.fg,
                                }}
                            >
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </span>
                            <div>
                                <p
                                    className="text-sm font-semibold"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    No governance signals need action right now.
                                </p>
                                <p
                                    className="mt-0.5 text-xs"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    Checked institutions, batch staffing,
                                    attendance, and account status. New signals
                                    surface here the moment they arise — review
                                    the{" "}
                                    <Link
                                        href="/dashboard/super-admin/audit-logs"
                                        className="font-semibold underline"
                                        style={{ color: "var(--role-accent)" }}
                                    >
                                        audit trail
                                    </Link>{" "}
                                    for full history.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ul
                            className="divide-y"
                            style={{ borderColor: "var(--dashboard-border)" }}
                        >
                            {signals.map((signal) => (
                                <li key={signal.id}>
                                    <AttentionRow signal={signal} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </section>

            {/* 2 — Quick actions: primary grid + secondary row. */}
            <Panel
                eyebrow="Quick actions"
                title="Operate the platform"
                padded={false}
            >
                <div className="px-5 py-5">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {QUICK_ACTIONS_PRIMARY.map((action) => (
                            <PrimaryAction key={action.href} action={action} />
                        ))}
                    </div>
                    <div
                        className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        <span
                            className="text-[10px] uppercase tracking-[0.16em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            More
                        </span>
                        {QUICK_ACTIONS_SECONDARY.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--role-accent-soft)]"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    color: "var(--dashboard-fg)",
                                }}
                            >
                                <Icon
                                    path={NAV_ICONS[action.href]}
                                    className="h-3.5 w-3.5"
                                />
                                {action.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </Panel>

            {/* 3 — Operational snapshot (replaces vanity headline counts). */}
            <Panel
                eyebrow="Operational snapshot"
                title="Governance posture"
                description="Counts that drive a decision — tap any to drill in."
                padded={false}
            >
                <div className="grid grid-cols-2 gap-3 px-5 py-5 md:grid-cols-3 lg:grid-cols-6">
                    {snapshot.map((tile) => (
                        <SnapshotTile key={tile.id} tile={tile} />
                    ))}
                </div>
            </Panel>

            {/* 5 — Institution watchlist (replaces recent institutions). */}
            <Panel
                eyebrow="Institution watchlist"
                title="Institutions needing attention"
                padded={false}
                actions={
                    <Link
                        href="/dashboard/super-admin/institutions"
                        className="rounded-md border px-3 py-1.5 text-xs font-medium"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                        }}
                    >
                        All institutions →
                    </Link>
                }
            >
                {instError && !instReady ? (
                    <InlineError
                        message={instError}
                        onRetry={loadInstitutions}
                    />
                ) : !instReady ? (
                    <div
                        className="px-5 py-8 text-center text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Loading watchlist…
                    </div>
                ) : watchlist.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                        <span
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: SEVERITY_TONES.ok.bg,
                                color: SEVERITY_TONES.ok.fg,
                            }}
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                        </span>
                        <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            All institutions in good standing
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {statusCounts.total} institution
                            {statusCounts.total === 1 ? "" : "s"} monitored · 0
                            flagged for review.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-left">
                            <thead>
                                <tr
                                    className="border-b text-[10px] uppercase tracking-[0.16em]"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        color: "var(--dashboard-muted)",
                                    }}
                                >
                                    <th className="px-5 py-2.5 font-medium">
                                        Institution
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Status
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Attendance
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Admin activity
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Risk
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {watchlist.map((row) => (
                                    <tr
                                        key={row.inst.id}
                                        className="border-b transition-colors hover:bg-[var(--role-accent-soft)]"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td className="px-5 py-3">
                                            <Link
                                                href={`/dashboard/super-admin/institutions/${row.inst.id}`}
                                                className="block min-w-0"
                                            >
                                                <span
                                                    className="block truncate text-sm font-semibold"
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {row.inst.name}
                                                </span>
                                                <span
                                                    className="block truncate text-[11px]"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {[
                                                        row.inst.type,
                                                        row.inst.city,
                                                        row.inst.state,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ") ||
                                                        `${row.batchCount} batches`}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-3 py-3">
                                            <LifecycleBadge
                                                status={row.status}
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <PendingCell />
                                        </td>
                                        <td className="px-3 py-3">
                                            <PendingCell />
                                        </td>
                                        <td className="px-3 py-3">
                                            <RiskChip risk={row.risk} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p
                            className="px-5 py-2.5 text-[11px]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Attendance and admin-activity columns activate once
                            the per-institution reporting feed is connected.
                        </p>
                    </div>
                )}
            </Panel>

            {/* 6 — Recent governance activity (governance actions only). */}
            <Panel
                eyebrow="Recent governance activity"
                title="Who changed what"
                padded={false}
                actions={
                    <Link
                        href="/dashboard/super-admin/audit-logs"
                        className="rounded-md border px-3 py-1.5 text-xs font-medium"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                        }}
                    >
                        View full log →
                    </Link>
                }
            >
                {activityLoading ? (
                    <div
                        className="px-5 py-8 text-center text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Loading governance activity…
                    </div>
                ) : activityError ? (
                    <InlineError
                        message={activityError}
                        onRetry={loadActivity}
                    />
                ) : !activity || activity.length === 0 ? (
                    <div
                        className="px-5 py-8 text-center text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        No recent governance activity.
                    </div>
                ) : (
                    <ul
                        className="divide-y"
                        style={{ borderColor: "var(--dashboard-border)" }}
                    >
                        {activity.map((event) => (
                            <li key={event.id}>
                                <GovernanceRow event={event} />
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
};

export default SuperAdminOverview;
