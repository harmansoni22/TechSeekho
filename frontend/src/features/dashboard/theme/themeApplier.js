/**
 * Publishes the active dashboard theme as CSS variables on <html>.
 *
 * The `--dashboard-*` namespace is the source of truth. We deliberately also
 * write the `--role-accent*` family from the same theme so that the dashboard
 * theme picker fully owns the palette — previously the role pinned the accent
 * independent of theme, which made themes like "High contrast dark" or
 * "Forest" feel half-applied (chrome changed, accents didn't).
 *
 * Role identity now comes from page content (monogram letter, RoleHero label
 * and tagline), not from the accent color.
 */

const DASHBOARD_THEME_KEYS = {
    background: ["--dashboard-bg", "--theme-background", "--background"],
    foreground: ["--dashboard-fg", "--theme-foreground", "--foreground"],
    surface: ["--dashboard-surface", "--theme-surface"],
    muted: ["--dashboard-muted", "--theme-muted"],
    border: ["--dashboard-border", "--theme-border"],
    primary: ["--dashboard-primary", "--theme-primary"],
    primaryForeground: ["--dashboard-primary-fg", "--theme-primary-foreground"],
    // Accent is shared with the role-accent namespace so every existing
    // `var(--role-accent)` consumer (sidebar, nav active state, sign-out,
    // RoleHero, StatTile, etc.) automatically tracks the dashboard theme.
    accent: ["--dashboard-accent", "--theme-accent", "--role-accent"],
    accentForeground: ["--dashboard-accent-fg", "--role-accent-ink"],
    danger: ["--dashboard-danger", "--theme-danger"],
    dangerForeground: ["--dashboard-danger-fg", "--theme-danger-foreground"],
    shadow: ["--dashboard-shadow"],
};

// Derivations expressed as CSS so the browser recomputes them automatically
// whenever `--role-accent` changes. No need to re-run JS on theme switch.
const DERIVED_ROLE_VARS = {
    "--role-accent-soft":
        "color-mix(in srgb, var(--role-accent) 14%, transparent)",
    "--role-accent-ring":
        "color-mix(in srgb, var(--role-accent) 32%, transparent)",
    "--role-accent-muted":
        "color-mix(in srgb, var(--role-accent) 22%, var(--dashboard-surface))",
    "--role-glow": [
        "radial-gradient(600px 320px at 12% 8%,",
        "color-mix(in srgb, var(--role-accent) 18%, transparent),",
        "transparent 60%),",
        "radial-gradient(420px 260px at 92% 90%,",
        "color-mix(in srgb, var(--role-accent) 10%, transparent),",
        "transparent 65%)",
    ].join(" "),
};

export const applyDashboardTheme = (theme) => {
    if (typeof document === "undefined" || !theme?.tokens) return;

    const root = document.documentElement;
    Object.entries(DASHBOARD_THEME_KEYS).forEach(([tokenKey, cssVars]) => {
        const value = theme.tokens[tokenKey];
        if (value) {
            cssVars.forEach((cssVar) => {
                root.style.setProperty(cssVar, value);
            });
        }
    });

    // Set derived vars once per apply. They reference `var(--role-accent)`,
    // so subsequent theme switches update them transparently via the cascade.
    Object.entries(DERIVED_ROLE_VARS).forEach(([cssVar, expression]) => {
        root.style.setProperty(cssVar, expression);
    });

    root.dataset.dashboardMode = theme.mode || "light";
};
