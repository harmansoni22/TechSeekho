"use client";

/**
 * Shared building blocks for the INSTITUTION_COORDINATOR dashboard.
 *
 * DESIGN CONTRACT (read before editing a coordinator page)
 * ────────────────────────────────────────────────────────
 * 1. PROJECTION-ONLY. The coordinator never writes operational data. Nothing
 *    in here renders a mutating control (no save / assign / remove / mark).
 *    Every page is a read-only projection of truth owned by trainers/admins.
 * 2. SCHOOL-SCOPED. Pages only ever read endpoints the backend institution-
 *    scopes for a coordinator (/batches, /batches/:id, /attendance?batchId=,
 *    /announcements, /institutions, /institutions/:id/members,
 *    /assignments/submissions). A coordinator can never see another school.
 * 3. POSITIVE-FIRST, NEVER DISHONEST. Healthy/loaded cohorts rank to the top
 *    and wins lead the page; weak signals stay visible but sit lower and
 *    calmer. We rank and emphasise — we never hide or fabricate a number.
 *
 * Tone tokens reuse palettes already shipped on the governance pages (the
 * green/amber are the same hex used by super-admin) so the coordinator surface
 * stays inside one design system rather than inventing a parallel one.
 */

// Policy threshold (config, not data): a batch at or above this trailing
// attendance is celebrated; below it is surfaced calmly for a look.
export const ATTENDANCE_TARGET = 75;

// Health tiers, ordered best → needs-setup. `rank` drives "positive on top".
export const TIERS = {
    strong: {
        key: "strong",
        rank: 0,
        label: "Strong",
        fg: "#047857",
        bg: "rgba(16, 185, 129, 0.12)",
        bar: "#10b981",
    },
    steady: {
        key: "steady",
        rank: 1,
        label: "Steady",
        fg: "var(--role-accent)",
        bg: "var(--role-accent-soft)",
        bar: "var(--role-accent)",
    },
    watch: {
        key: "watch",
        rank: 2,
        label: "Watch",
        fg: "#b45309",
        bg: "rgba(245, 158, 11, 0.16)",
        bar: "#f59e0b",
    },
    setup: {
        key: "setup",
        rank: 3,
        label: "Needs setup",
        fg: "var(--dashboard-muted)",
        bg: "color-mix(in srgb, var(--dashboard-muted) 16%, transparent)",
        bar: "var(--dashboard-muted)",
    },
};

export function tierOf(key) {
    return TIERS[key] ?? TIERS.setup;
}

/**
 * Derive a batch's operational health purely from real, scoped fields returned
 * by /batches (and /batches/:id). No fabrication: every input is a count the
 * backend already sent. Returns enrolment/staffing facts plus a tier + score
 * and a list of plain-language gaps used by the calm "needs a look" sections.
 */
export function computeBatchHealth(batch) {
    const enrolled = batch?._count?.students ?? batch?.students?.length ?? 0;
    const trainers = batch?._count?.trainers ?? batch?.trainers?.length ?? 0;
    const active = batch?.isActive !== false;
    const staffed = trainers > 0;
    const populated = enrolled > 0;

    let score = 0;
    if (active) score += 34;
    if (staffed) score += 33;
    if (populated) score += 33;

    let tier = "setup";
    if (active && staffed && populated) tier = "strong";
    else if (active && (staffed || populated)) tier = "steady";
    else if (active || staffed || populated) tier = "watch";

    const gaps = [];
    if (!active) gaps.push("Marked inactive");
    if (!staffed) gaps.push("No trainer assigned");
    if (!populated) gaps.push("No students enrolled");

    return { enrolled, trainers, active, staffed, score, tier, gaps };
}

/**
 * Attendance projection from raw /attendance records (scoped by batchId).
 * Present + Late both count as "attended" (a late student was still there);
 * the label says so. Returns null rate when there is nothing to divide by.
 */
export function attendanceRate(records = []) {
    let present = 0;
    let late = 0;
    let absent = 0;
    for (const r of records) {
        if (r?.status === "PRESENT") present += 1;
        else if (r?.status === "LATE") late += 1;
        else if (r?.status === "ABSENT") absent += 1;
    }
    const total = present + late + absent;
    const attended = present + late;
    const rate = total ? Math.round((attended / total) * 100) : null;
    return { present, late, absent, attended, total, rate };
}

export function formatStamp(value) {
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

export function formatDate(value) {
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

export function pluralize(n, one, many) {
    return `${n} ${n === 1 ? one : (many ?? `${one}s`)}`;
}

// Pull the deduped set of institutions a coordinator can see out of a batch
// list, so pages that only fetch /batches can still name the school(s).
export function institutionsFromBatches(batches = []) {
    const map = new Map();
    for (const b of batches) {
        const inst = b?.institution;
        if (inst?.id && !map.has(inst.id)) map.set(inst.id, inst);
    }
    return [...map.values()];
}

/* ─────────────────────────── presentational ─────────────────────────── */

export function Icon({ path, className = "h-4 w-4" }) {
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

export const COORD_ICONS = {
    spark: "M12 2v6 M12 16v6 M2 12h6 M16 12h6 M5 5l3 3 M16 16l3 3 M19 5l-3 3 M8 16l-3 3",
    check: "M20 6 9 17l-5-5",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    stack: "M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5 M3 18l9 5 9-5",
    pulse: "M3 12h4l2 7 4-14 2 7h6",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    building:
        "M3 21h18 M5 21V7l7-4 7 4v14 M9 9h1 M9 13h1 M9 17h1 M14 9h1 M14 13h1 M14 17h1",
    flag: "M4 22V4 M4 4h14l-3 5 3 5H4",
};

/** Small read-only marker. Reinforces "you are looking, not editing." */
export function ProjectionTag({ label = "Read-only projection" }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{
                backgroundColor: "var(--role-accent-soft)",
                color: "var(--role-accent)",
            }}
        >
            <Icon path={COORD_ICONS.eye} className="h-3 w-3" />
            {label}
        </span>
    );
}

export function TierChip({ tier }) {
    const t = tierOf(tier);
    return (
        <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ backgroundColor: t.bg, color: t.fg }}
        >
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.fg }}
                aria-hidden="true"
            />
            {t.label}
        </span>
    );
}

/** Rank medal for positive-first ordered lists (1 = best). */
export function RankBadge({ n }) {
    const lead = n <= 3;
    return (
        <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm"
            style={{
                backgroundColor: lead
                    ? "var(--role-accent-soft)"
                    : "var(--dashboard-surface)",
                color: lead ? "var(--role-accent)" : "var(--dashboard-muted)",
                border: "1px solid var(--dashboard-border)",
            }}
        >
            {n}
        </span>
    );
}

/** Theme-aware progress bar. `value` 0–100; colour from tier (or accent). */
export function HealthBar({ value, tier, height = 6 }) {
    const t = tier ? tierOf(tier) : null;
    const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)));
    return (
        <div
            className="progress-track w-full overflow-hidden rounded-full"
            style={{ height }}
            role="presentation"
        >
            <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                    width: `${pct}%`,
                    backgroundColor: t ? t.bar : "var(--role-accent)",
                }}
            />
        </div>
    );
}

/** Big editorial KPI used in the wins band. Optional tone colours the value. */
export function WinStat({ label, value, sub, tier, icon }) {
    const t = tier ? tierOf(tier) : null;
    return (
        <div
            className="relative flex flex-col justify-between overflow-hidden rounded-xl border px-5 py-5"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <p
                    className="text-[11px] uppercase tracking-[0.18em]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {label}
                </p>
                {icon && (
                    <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                        style={{
                            backgroundColor: "var(--role-accent-soft)",
                            color: "var(--role-accent)",
                        }}
                    >
                        <Icon path={icon} className="h-[15px] w-[15px]" />
                    </span>
                )}
            </div>
            <p
                className="mt-3 font-display text-[2.4rem] leading-none tracking-tight"
                style={{
                    color: t ? t.fg : "var(--dashboard-fg)",
                    fontWeight: 400,
                }}
            >
                {value}
            </p>
            {sub && (
                <p
                    className="mt-2 text-xs"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {sub}
                </p>
            )}
        </div>
    );
}

/** Positive empty state — "all clear", not a sad blank. */
export function AllClear({ title, description }) {
    return (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                    backgroundColor: TIERS.strong.bg,
                    color: TIERS.strong.fg,
                }}
            >
                <Icon path={COORD_ICONS.check} className="h-5 w-5" />
            </span>
            <p
                className="text-sm font-semibold"
                style={{ color: "var(--dashboard-fg)" }}
            >
                {title}
            </p>
            {description && (
                <p
                    className="max-w-md text-xs"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {description}
                </p>
            )}
        </div>
    );
}

/** Meta cell (label over value) used across detail panels. */
export function MetaItem({ label, value }) {
    return (
        <div>
            <dt
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </dt>
            <dd
                className="mt-1 font-display text-base"
                style={{ color: "var(--dashboard-fg)" }}
            >
                {value}
            </dd>
        </div>
    );
}
