const DASHBOARD_THEME_KEYS = {
  background: ["--dashboard-bg", "--theme-background", "--background"],
  foreground: ["--dashboard-fg", "--theme-foreground", "--foreground"],
  surface: ["--dashboard-surface", "--theme-surface"],
  muted: ["--dashboard-muted", "--theme-muted"],
  border: ["--dashboard-border", "--theme-border"],
  primary: ["--dashboard-primary", "--theme-primary"],
  primaryForeground: ["--dashboard-primary-fg", "--theme-primary-foreground"],
  accent: ["--dashboard-accent", "--theme-accent"],
  danger: ["--dashboard-danger", "--theme-danger"],
  dangerForeground: ["--dashboard-danger-fg", "--theme-danger-foreground"],
  shadow: ["--dashboard-shadow"],
};

export const applyDashboardTheme = (theme) => {
  if (typeof document === "undefined" || !theme?.tokens) return;

  const root = document.documentElement;
  Object.entries(DASHBOARD_THEME_KEYS).forEach(([tokenKey, cssVars]) => {
    const value = theme.tokens[tokenKey];
    if (value) {
      cssVars.forEach((cssVar) => root.style.setProperty(cssVar, value));
    }
  });

  root.dataset.dashboardMode = theme.mode || "light";
};
