"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyDashboardTheme } from "../theme/themeApplier";
import {
    dashboardThemes,
    defaultDashboardThemeKey,
} from "../theme/themePresets";

const DASHBOARD_THEME_STORAGE_KEY = "techseekho_dashboard_theme";

const DashboardThemeContext = createContext({
    themeKey: defaultDashboardThemeKey,
    theme: dashboardThemes[defaultDashboardThemeKey],
    themes: dashboardThemes,
    setThemeKey: () => {},
});

export const DashboardThemeProvider = ({ children }) => {
    const [themeKey, setThemeKey] = useState(defaultDashboardThemeKey);

    useEffect(() => {
        const storedThemeKey = window.localStorage.getItem(
            DASHBOARD_THEME_STORAGE_KEY,
        );
        if (storedThemeKey && dashboardThemes[storedThemeKey]) {
            setThemeKey(storedThemeKey);
        }
    }, []);

    useEffect(() => {
        const selectedTheme =
            dashboardThemes[themeKey] ||
            dashboardThemes[defaultDashboardThemeKey];
        applyDashboardTheme(selectedTheme);
        window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, themeKey);
    }, [themeKey]);

    const value = useMemo(
        () => ({
            themeKey,
            theme:
                dashboardThemes[themeKey] ||
                dashboardThemes[defaultDashboardThemeKey],
            themes: dashboardThemes,
            setThemeKey,
        }),
        [themeKey],
    );

    return (
        <DashboardThemeContext.Provider value={value}>
            {children}
        </DashboardThemeContext.Provider>
    );
};

export const useDashboardTheme = () => useContext(DashboardThemeContext);
