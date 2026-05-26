"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, useMemo } from "react";
import { resolveRoleDestination } from "@/lib/roleRouter";
import { FALLBACK_ROLE_THEME, getRoleTheme } from "../theme/roleThemes";

const RoleThemeContext = createContext({
    role: null,
    theme: FALLBACK_ROLE_THEME,
});

/**
 * Resolves the active role from the authenticated session and exposes the
 * role metadata (monogram, label, tagline) to descendants.
 *
 * Note: the CSS accent variables (`--role-accent`, `--role-accent-ink`,
 * `--role-accent-soft`, `--role-glow`, …) are NOT published here anymore.
 * They live in the dashboard-theme namespace (`themeApplier.js`) so the
 * theme picker in Settings fully owns the palette. Role identity is signaled
 * by the monogram letter and RoleHero copy, not by color.
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

    return (
        <RoleThemeContext.Provider value={value}>
            {/* `data-role` is kept so role-specific CSS hooks can target it
                later; we no longer inject role-accent vars here because the
                dashboard theme owns the accent palette. */}
            <div data-role={activeRoleKey || "UNKNOWN"}>{children}</div>
        </RoleThemeContext.Provider>
    );
}

export const useRoleTheme = () => useContext(RoleThemeContext);
