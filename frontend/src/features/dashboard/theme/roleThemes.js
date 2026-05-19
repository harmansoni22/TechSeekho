/**
 * Role-aware design tokens.
 *
 * Each role inherits the base dashboard theme (background, surface, foreground)
 * and overlays a distinctive accent palette + tagline. This keeps the design
 * system unified while giving each role a recognizable identity.
 *
 * Tokens here are role-scoped and exposed as CSS variables prefixed with --role-.
 * Components opt into them by referencing `var(--role-accent)` instead of
 * `var(--dashboard-primary)` for hero accents, badges, and key actions.
 */

export const ROLE_THEMES = {
    SUPER_ADMIN: {
        key: "SUPER_ADMIN",
        label: "Platform Governance",
        tagline: "Custodian of the entire TechSeekho network",
        monogram: "SA",
        accent: "#b91c1c", // deep crimson
        accentSoft: "rgba(185, 28, 28, 0.12)",
        accentRing: "rgba(185, 28, 28, 0.30)",
        accentMuted: "#fecaca",
        accentInk: "#fef2f2",
        glow: "radial-gradient(600px 320px at 12% 8%, rgba(185, 28, 28, 0.18), transparent 60%), radial-gradient(420px 260px at 92% 90%, rgba(225, 29, 72, 0.10), transparent 65%)",
        grainOpacity: 0.04,
    },
    ADMIN: {
        key: "ADMIN",
        label: "Institutional Oversight",
        tagline: "Steward of partner institutions and learner outcomes",
        monogram: "AD",
        accent: "#1e3a8a", // midnight navy
        accentSoft: "rgba(30, 58, 138, 0.14)",
        accentRing: "rgba(30, 58, 138, 0.32)",
        accentMuted: "#c7d2fe",
        accentInk: "#eff6ff",
        glow: "radial-gradient(600px 320px at 10% 6%, rgba(30, 58, 138, 0.20), transparent 60%), radial-gradient(420px 260px at 92% 92%, rgba(56, 189, 248, 0.10), transparent 65%)",
        grainOpacity: 0.035,
    },
    INSTITUTION_COORDINATOR: {
        key: "INSTITUTION_COORDINATOR",
        label: "Programme Operations",
        tagline: "Conductor of cohorts, trainers, and daily rhythm",
        monogram: "CO",
        accent: "#7e22ce", // plum
        accentSoft: "rgba(126, 34, 206, 0.14)",
        accentRing: "rgba(126, 34, 206, 0.32)",
        accentMuted: "#e9d5ff",
        accentInk: "#faf5ff",
        glow: "radial-gradient(600px 320px at 12% 10%, rgba(126, 34, 206, 0.18), transparent 60%), radial-gradient(420px 260px at 90% 88%, rgba(168, 85, 247, 0.10), transparent 65%)",
        grainOpacity: 0.035,
    },
    TRAINER: {
        key: "TRAINER",
        label: "Learning Craft",
        tagline: "Shaper of curriculum, cohort, and craft",
        monogram: "TR",
        accent: "#0f766e", // teal
        accentSoft: "rgba(15, 118, 110, 0.14)",
        accentRing: "rgba(15, 118, 110, 0.32)",
        accentMuted: "#ccfbf1",
        accentInk: "#f0fdfa",
        glow: "radial-gradient(600px 320px at 10% 8%, rgba(15, 118, 110, 0.18), transparent 60%), radial-gradient(420px 260px at 92% 90%, rgba(45, 212, 191, 0.10), transparent 65%)",
        grainOpacity: 0.035,
    },
    STUDENT: {
        key: "STUDENT",
        label: "Active Learner",
        tagline: "Builder of skills, streaks, and momentum",
        monogram: "ST",
        accent: "#c2410c", // warm amber
        accentSoft: "rgba(194, 65, 12, 0.14)",
        accentRing: "rgba(194, 65, 12, 0.32)",
        accentMuted: "#fed7aa",
        accentInk: "#fff7ed",
        glow: "radial-gradient(600px 320px at 12% 8%, rgba(194, 65, 12, 0.18), transparent 60%), radial-gradient(420px 260px at 90% 88%, rgba(249, 115, 22, 0.10), transparent 65%)",
        grainOpacity: 0.035,
    },
};

export const FALLBACK_ROLE_THEME = ROLE_THEMES.STUDENT;

export function getRoleTheme(roleKey) {
    if (!roleKey) return FALLBACK_ROLE_THEME;
    const normalized = String(roleKey).toUpperCase();
    return ROLE_THEMES[normalized] ?? FALLBACK_ROLE_THEME;
}

/**
 * CSS variables produced by a role theme. These layer on top of the base
 * dashboard tokens (--dashboard-bg, --dashboard-surface, ...) without
 * overwriting them — they live in the --role-* namespace.
 */
export function roleThemeCssVars(theme) {
    if (!theme) return {};
    return {
        "--role-accent": theme.accent,
        "--role-accent-soft": theme.accentSoft,
        "--role-accent-ring": theme.accentRing,
        "--role-accent-muted": theme.accentMuted,
        "--role-accent-ink": theme.accentInk,
        "--role-glow": theme.glow,
    };
}
