/**
 * Super Admin presentation system — single import surface for the 15 SA routes.
 *
 * Two layers, deliberately kept separate:
 *
 *   1. SA-OWNED PRESENTATION (this folder) — bespoke command-center chrome that
 *      makes Super Admin visually distinct from the other roles. Forked from the
 *      shared dashboard widgets; routes share these across SA but compose them
 *      freely. Safe to redesign without touching admin/coordinator/trainer/
 *      student.
 *
 *   2. SHARED SAFETY KIT (../governanceShared) — re-exported here, NOT forked.
 *      LifecycleBadge (status-color dictionary), Banner + extractErrorMessage
 *      (backend 409/error envelope rendering), Modal (accessible: role=dialog /
 *      aria-modal / keyboard-closable backdrop), ReasonField (audit-log
 *      requirement on sensitive mutations), formatDate, and button style tokens.
 *      These encode correctness, accessibility, and compliance — they stay
 *      shared so they can't drift across routes.
 *
 * Design tokens (--dashboard-*, --role-accent*, LIFECYCLE_TONES) are also shared
 * and untouched; the SA look is achieved through composition + the accent spine,
 * not by repainting tokens.
 */

// 1. SA-owned presentation layer
export { default as SaPageHeader } from "./SaPageHeader";
export { default as SaPanel } from "./SaPanel";
export { default as SaStatTile } from "./SaStatTile";
export { SaPageLoading, SaPageError, SaPageEmpty } from "./SaPageState";

// 2. Shared safety / compliance kit — re-exported, not forked
export {
    LifecycleBadge,
    Banner,
    Modal,
    ReasonField,
    formatDate,
    extractErrorMessage,
    btnPrimary,
    btnDanger,
    btnNeutral,
} from "@/features/dashboard/super-admin/governanceShared";
