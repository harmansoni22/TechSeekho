/**
 * Centralized role → dashboard route mapping.
 *
 * Add new roles here — never inline role checks in components.
 * All role strings are matched case-insensitively so minor JWT
 * casing differences don't cause silent failures.
 */

/** @type {Record<string, string>} */
export const ROLE_ROUTES = {
    SUPER_ADMIN: "/dashboard/super-admin",
    ADMIN: "/dashboard/admin",
    INSTITUTION_COORDINATOR: "/dashboard/coordinator",
    TRAINER: "/dashboard/trainer",
    STUDENT: "/dashboard/student",
};

/**
 * Priority order when a user holds multiple roles.
 * Most privileged first so a SUPER_ADMIN who also has STUDENT never
 * gets sent to the student dashboard.
 */
const ROLE_PRIORITY = [
    "SUPER_ADMIN",
    "ADMIN",
    "INSTITUTION_COORDINATOR",
    "TRAINER",
    "STUDENT",
];

/**
 * Return the correct dashboard path for the given roles array.
 *
 * @param {string[]} roles  - Role strings exactly as returned by the backend
 *                            (e.g. ["SUPER_ADMIN"]).
 * @returns {string | null} - Destination path, or null if no known role matched.
 *                            Callers must handle null (unknown / unassigned role).
 */
export function resolveRoleDestination(roles = []) {
    const normalized = (roles || []).map((r) =>
        String(r || "")
            .trim()
            .toUpperCase(),
    );

    for (const role of ROLE_PRIORITY) {
        if (normalized.includes(role)) {
            return ROLE_ROUTES[role];
        }
    }

    if (normalized.length > 0) {
        console.warn(
            `[roleRouter] No dashboard route for roles: [${normalized.join(", ")}]. ` +
                "Add the role to ROLE_ROUTES in src/lib/roleRouter.js.",
        );
    }

    return null;
}
