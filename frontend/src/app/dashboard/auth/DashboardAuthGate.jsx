"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import {
    isRoleAuthorized,
    resolveAllowedRolesForPath,
} from "../resolveDashboardAuthz";

export default function DashboardAuthGate({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace(
                `/login?next=${encodeURIComponent(pathname || "/dashboard")}`,
            );
            return;
        }

        if (status !== "authenticated") {
            return;
        }

        const roles = session?.user?.roles ?? [];

        // Authenticated but roles not yet populated — this can happen when the
        // session callback's backend fetch is in-flight or returned empty due to
        // a transient data inconsistency. Redirect to the entry router so that
        // DashboardRouter can re-resolve roles or send the user to /pending-approval.
        if (roles.length === 0) {
            if (pathname !== "/dashboard") {
                console.warn(
                    "[DashboardAuthGate] Authenticated with no roles at",
                    pathname,
                    "— redirecting to /dashboard for re-routing.",
                );
                router.replace("/dashboard");
            }
            return;
        }

        const allowedRoles = resolveAllowedRolesForPath(pathname);

        // Route not in the permissions map — this is a developer oversight,
        // not an access-control failure. Return the user to the entry router
        // rather than showing an access-denied page.
        if (!allowedRoles.length) {
            console.warn(
                `[DashboardAuthGate] No permissions defined for "${pathname}" ` +
                    "— redirecting to /dashboard. Add the route to dashboardRoutePermissions.js.",
            );
            router.replace("/dashboard");
            return;
        }

        const authorized = isRoleAuthorized({ roles, allowedRoles });

        if (!authorized) {
            console.warn(
                `[DashboardAuthGate] Role [${roles.join(", ")}] is not permitted ` +
                    `for "${pathname}". Allowed: [${allowedRoles.join(", ")}].`,
            );
            router.replace("/403");
        }
    }, [router, pathname, status, session?.user?.roles]);

    // Prevent protected UI flash while session is loading or absent.
    if (status === "loading" || status === "unauthenticated") {
        return null;
    }

    const roles = session?.user?.roles ?? [];

    // Roles not yet populated — render nothing while the effect above redirects.
    if (roles.length === 0) {
        return null;
    }

    const allowedRoles = resolveAllowedRolesForPath(pathname);

    // Unknown route — render nothing while the effect redirects to /dashboard.
    if (!allowedRoles.length) {
        return null;
    }

    const authorized = isRoleAuthorized({ roles, allowedRoles });

    return authorized ? children : null;
}
