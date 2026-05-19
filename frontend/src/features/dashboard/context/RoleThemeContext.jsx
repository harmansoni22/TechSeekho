"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, useMemo } from "react";
import { resolveRoleDestination } from "@/lib/roleRouter";
import {
    FALLBACK_ROLE_THEME,
    getRoleTheme,
    roleThemeCssVars,
} from "../theme/roleThemes";

const RoleThemeContext = createContext({
    role: null,
    theme: FALLBACK_ROLE_THEME,
});

/**
 * Resolves the active role from the authenticated session and exposes the
 * matching role theme (accent palette + tagline + monogram) to descendants.
 *
 * The CSS variable layer (--role-accent, --role-accent-soft, --role-glow, …)
 * is published on a wrapping <div data-role={ROLE}> so every dashboard page
 * can use `var(--role-accent)` without prop-drilling.
 *
 * Authentication and authorization are handled by DashboardAuthGate. This
 * provider trusts the session it observes — if no role is present the
 * fallback (Student) theme is used and the gate will redirect the user.
 */
export function RoleThemeProvider({ children }) {
    const { data: session } = useSession();
    const roles = session?.user?.roles ?? [];

    const { activeRoleKey, theme } = useMemo(() => {
        const destination = resolveRoleDestination(roles);
        // Reuse the same priority order roleRouter uses, so the theme matches
        // whichever role the dashboard actually routed the user to.
        const keyFromDestination = destination
            ? (Object.entries({
                  "/dashboard/super-admin": "SUPER_ADMIN",
                  "/dashboard/admin": "ADMIN",
                  "/dashboard/coordinator": "INSTITUTION_COORDINATOR",
                  "/dashboard/trainer": "TRAINER",
                  "/dashboard/student": "STUDENT",
              }).find(([path]) => destination.startsWith(path))?.[1] ?? null)
            : null;

        const resolved = getRoleTheme(keyFromDestination);
        return { activeRoleKey: keyFromDestination, theme: resolved };
    }, [roles]);

    const value = useMemo(
        () => ({ role: activeRoleKey, theme }),
        [activeRoleKey, theme],
    );

    const cssVars = roleThemeCssVars(theme);

    return (
        <RoleThemeContext.Provider value={value}>
            <div data-role={activeRoleKey || "UNKNOWN"} style={cssVars}>
                {children}
            </div>
        </RoleThemeContext.Provider>
    );
}

export const useRoleTheme = () => useContext(RoleThemeContext);
