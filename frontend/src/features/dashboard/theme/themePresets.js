/**
 * Dashboard theme presets.
 *
 * `accentForeground` is the high-contrast text color to use *over* the
 * theme's accent (used as `--role-accent-ink`). Picked per theme so we don't
 * have to guess — a bright cyan accent gets dark text, a dark navy accent
 * gets light text, etc.
 */
export const dashboardThemes = {
    lightNormal: {
        label: "Light normal",
        mode: "light",
        tokens: {
            background: "#f8fafc",
            foreground: "#0f172a",
            surface: "#ffffff",
            muted: "#64748b",
            border: "#e2e8f0",
            primary: "#0f172a",
            primaryForeground: "#ffffff",
            accent: "#2563eb",
            accentForeground: "#ffffff",
            danger: "#dc2626",
            dangerForeground: "#ffffff",
            shadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
        },
    },

    darkNormal: {
        label: "Dark normal",
        mode: "dark",
        tokens: {
            background: "#0b1220",
            foreground: "#e2e8f0",
            surface: "#111b2e",
            muted: "#94a3b8",
            border: "#22304a",
            primary: "#dbeafe",
            primaryForeground: "#0b1220",
            accent: "#60a5fa",
            accentForeground: "#0b1220",
            danger: "#f87171",
            dangerForeground: "#1f2937",
            shadow: "0 14px 34px rgba(2, 6, 23, 0.45)",
        },
    },

    highContrastDark: {
        label: "High contrast dark",
        mode: "dark",
        tokens: {
            background: "#000000",
            foreground: "#ffffff",
            surface: "#0f0f0f",
            muted: "#d1d5db",
            border: "#ffffff",
            primary: "#f8fafc",
            primaryForeground: "#000000",
            accent: "#22d3ee",
            accentForeground: "#000000",
            danger: "#ff4d4f",
            dangerForeground: "#000000",
            shadow: "0 0 0 rgba(0, 0, 0, 0)",
        },
    },

    midnight: {
        label: "Midnight",
        mode: "dark",
        tokens: {
            background: "#0f0f0f",
            foreground: "#e5e7eb",
            surface: "#121212",
            muted: "#a1a1aa",
            border: "#515151",
            primary: "#eeeeee",
            primaryForeground: "#111111",
            accent: "#3c3c3c",
            accentForeground: "#ffffff",
            danger: "#ef4444",
            dangerForeground: "#ffffff",
            shadow: "0 20px 40px rgba(48, 48, 48, 0.5)",
        },
    },

    shadow: {
        label: "Shadow",
        mode: "dark",
        tokens: {
            background: "#0f0f18",
            foreground: "#ececff",
            surface: "#171726",
            muted: "#b6b6d9",
            border: "#2d2d4a",
            primary: "#c4b5fd",
            primaryForeground: "#130f24",
            accent: "#8b5cf6",
            accentForeground: "#ffffff",
            danger: "#fb7185",
            dangerForeground: "#1f1020",
            shadow: "0 20px 40px rgba(3, 0, 20, 0.5)",
        },
    },

    ocean: {
        label: "Ocean",
        mode: "dark",
        tokens: {
            background: "#071825",
            foreground: "#d7efff",
            surface: "#0b2639",
            muted: "#93c5fd",
            border: "#174567",
            primary: "#7dd3fc",
            primaryForeground: "#042033",
            accent: "#0ea5e9",
            accentForeground: "#ffffff",
            danger: "#f87171",
            dangerForeground: "#1f2937",
            shadow: "0 14px 30px rgba(7, 24, 37, 0.6)",
        },
    },

    forest: {
        label: "Forest",
        mode: "dark",
        tokens: {
            background: "#0b1e16",
            foreground: "#dcfce7",
            surface: "#112b1f",
            muted: "#86efac",
            border: "#1f4d35",
            primary: "#bbf7d0",
            primaryForeground: "#0b1e16",
            accent: "#22c55e",
            accentForeground: "#052e16",
            danger: "#f87171",
            dangerForeground: "#1f2937",
            shadow: "0 14px 30px rgba(5, 24, 16, 0.5)",
        },
    },

    sunrise: {
        label: "Sunrise",
        mode: "light",
        tokens: {
            background: "#fff7ed",
            foreground: "#7c2d12",
            surface: "#ffffff",
            muted: "#9a3412",
            border: "#fed7aa",
            primary: "#ea580c",
            primaryForeground: "#ffffff",
            accent: "#f97316",
            accentForeground: "#ffffff",
            danger: "#dc2626",
            dangerForeground: "#ffffff",
            shadow: "0 12px 24px rgba(234, 88, 12, 0.15)",
        },
    },

    graphite: {
        label: "Graphite",
        mode: "dark",
        tokens: {
            background: "#111315",
            foreground: "#f3f4f6",
            surface: "#1a1d21",
            muted: "#9ca3af",
            border: "#30343a",
            primary: "#e5e7eb",
            primaryForeground: "#111315",
            accent: "#6b7280",
            accentForeground: "#ffffff",
            danger: "#f87171",
            dangerForeground: "#1f2937",
            shadow: "0 16px 32px rgba(0, 0, 0, 0.45)",
        },
    },

    dusk: {
        label: "Dusk",
        mode: "dark",
        tokens: {
            background: "#1b1330",
            foreground: "#f5f3ff",
            surface: "#2a1d4a",
            muted: "#c4b5fd",
            border: "#4c3a76",
            primary: "#ddd6fe",
            primaryForeground: "#1b1330",
            accent: "#a78bfa",
            accentForeground: "#1b1330",
            danger: "#fb7185",
            dangerForeground: "#2a1020",
            shadow: "0 18px 32px rgba(23, 10, 49, 0.5)",
        },
    },

    techseekho: {
        label: "TechSeekho",
        mode: "dark",
        tokens: {
            background: "#0f0f23",
            foreground: "#ffffff",
            surface: "#1a1a2e",
            muted: "#94a3b8",
            border: "#2d2d4a",
            primary: "#4F46E5",
            primaryForeground: "#ffffff",
            accent: "#ea580c",
            accentForeground: "#ffffff",
            danger: "#ef4444",
            dangerForeground: "#ffffff",
            shadow: "0 10px 24px rgba(79, 70, 229, 0.15)",
        },
    },
};

export const defaultDashboardThemeKey = "techseekho";
