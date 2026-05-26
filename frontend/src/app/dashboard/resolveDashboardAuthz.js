import dashboardRoutePermissions from "./dashboardRoutePermissions";

function normalizeRole(role) {
    return String(role || "").toUpperCase();
}

function matchesRoute(path, routePath) {
    const isDashboardRoot = routePath === "/dashboard";

    if (isDashboardRoot) {
        return path === "/dashboard";
    }

    return path === routePath || path.startsWith(`${routePath}/`);
}

export function resolveAllowedRolesForPath(pathname) {
    const path = pathname || "/dashboard";

    const routes = Object.keys(dashboardRoutePermissions);

    let bestMatch = null;
    let bestLen = -1;

    for (const routePath of routes) {
        const matches = matchesRoute(path, routePath);

        if (matches && routePath.length > bestLen) {
            bestMatch = routePath;
            bestLen = routePath.length;
        }
    }

    return bestMatch ? dashboardRoutePermissions[bestMatch] : [];
}

export function isRoleAuthorized({ roles = [], allowedRoles = [] }) {
    const userRoles = roles.map(normalizeRole);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

    return normalizedAllowedRoles.some((role) => userRoles.includes(role));
}
