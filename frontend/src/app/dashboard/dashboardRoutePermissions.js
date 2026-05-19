/**
 * Authoritative role → route permission map.
 *
 * SECURITY MODEL
 * ──────────────
 * Every dashboard route is locked to the single role that owns it. There are
 * NO shared dashboard pages — each role has its own version of every feature
 * under `/dashboard/{role}/...`. This is enforced by `DashboardAuthGate` and
 * is the primary client-side line of defence; the backend MUST enforce the
 * same restrictions on its endpoints (defence in depth).
 *
 * Adding a new route?
 *   1. Add the path here, scoped to exactly the role(s) allowed to see it.
 *   2. Create the page at `/app/dashboard/{role}/{path}/page.jsx`.
 *   3. Add the matching nav entry in `features/dashboard/config/navConfig.js`.
 *
 * Never grant a route to multiple roles unless the page is genuinely shared
 * UI (e.g. `/dashboard` entry router). Prefer per-role pages — they make
 * authorization explicit and prevent permission-leak via component reuse.
 */

const ALL_DASHBOARD_USERS = [
    "SUPER_ADMIN",
    "ADMIN",
    "INSTITUTION_COORDINATOR",
    "TRAINER",
    "STUDENT",
];

const dashboardRoutePermissions = {
    // Entry router — every authenticated dashboard user is allowed to hit
    // `/dashboard`; the page itself redirects them to their role home.
    "/dashboard": ALL_DASHBOARD_USERS,

    // ────────────── SUPER_ADMIN ──────────────
    "/dashboard/super-admin": ["SUPER_ADMIN"],
    "/dashboard/super-admin/institutions": ["SUPER_ADMIN"],
    "/dashboard/super-admin/admins": ["SUPER_ADMIN"],
    "/dashboard/super-admin/role-management": ["SUPER_ADMIN"],
    "/dashboard/super-admin/platform-config": ["SUPER_ADMIN"],
    "/dashboard/super-admin/platform-analytics": ["SUPER_ADMIN"],
    "/dashboard/super-admin/audit-logs": ["SUPER_ADMIN"],
    "/dashboard/super-admin/profile": ["SUPER_ADMIN"],
    "/dashboard/super-admin/settings": ["SUPER_ADMIN"],
    "/dashboard/super-admin/legal": ["SUPER_ADMIN"],

    // ────────────── ADMIN ──────────────
    "/dashboard/admin": ["ADMIN"],
    "/dashboard/admin/institutions": ["ADMIN"],
    "/dashboard/admin/analytics": ["ADMIN"],
    "/dashboard/admin/reports": ["ADMIN"],
    "/dashboard/admin/community-moderation": ["ADMIN"],
    "/dashboard/admin/profile": ["ADMIN"],
    "/dashboard/admin/settings": ["ADMIN"],
    "/dashboard/admin/legal": ["ADMIN"],

    // ────────────── INSTITUTION_COORDINATOR ──────────────
    "/dashboard/coordinator": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/batches": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/trainers": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/students": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/attendance": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/progress": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/announcements": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/analytics": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/community": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/profile": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/settings": ["INSTITUTION_COORDINATOR"],
    "/dashboard/coordinator/legal": ["INSTITUTION_COORDINATOR"],

    // ────────────── TRAINER ──────────────
    "/dashboard/trainer": ["TRAINER"],
    "/dashboard/trainer/course": ["TRAINER"],
    "/dashboard/trainer/modules": ["TRAINER"],
    "/dashboard/trainer/batches": ["TRAINER"],
    "/dashboard/trainer/assignments": ["TRAINER"],
    "/dashboard/trainer/submissions": ["TRAINER"],
    "/dashboard/trainer/ai-companion": ["TRAINER"],
    "/dashboard/trainer/community": ["TRAINER"],
    "/dashboard/trainer/profile": ["TRAINER"],
    "/dashboard/trainer/settings": ["TRAINER"],
    "/dashboard/trainer/legal": ["TRAINER"],

    // ────────────── STUDENT ──────────────
    "/dashboard/student": ["STUDENT"],
    "/dashboard/student/courses": ["STUDENT"],
    "/dashboard/student/learning": ["STUDENT"],
    "/dashboard/student/skill-labs": ["STUDENT"],
    "/dashboard/student/homework": ["STUDENT"],
    "/dashboard/student/certifications": ["STUDENT"],
    "/dashboard/student/ai-companion": ["STUDENT"],
    "/dashboard/student/leaderboard": ["STUDENT"],
    "/dashboard/student/mentors": ["STUDENT"],
    "/dashboard/student/jobs": ["STUDENT"],
    "/dashboard/student/rewards": ["STUDENT"],
    "/dashboard/student/community": ["STUDENT"],
    "/dashboard/student/analytics": ["STUDENT"],
    "/dashboard/student/profile": ["STUDENT"],
    "/dashboard/student/settings": ["STUDENT"],
    "/dashboard/student/legal": ["STUDENT"],
};

export default dashboardRoutePermissions;
