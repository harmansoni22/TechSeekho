/**
 * Shared constants for the Skill Labs workspace components.
 *
 * Kept in their own module so layout/theming values can be tweaked without
 * pulling in the heavier Sandpack/iframe code paths.
 */

export const DEFAULT_LAYOUT = {
    sidebar: 190, // px — file-tree width
    preview: 42, // % — preview pane width inside the editor row
    console: 150, // px — console panel height (vanilla labs only)
};

// Files surfaced for the React lab. The file tree is read-only here — the
// React lab is intentionally a 2-file playground (JSX + CSS), no rename/add.
export const REACT_FILES = ["/App.jsx", "/styles.css"];

// Dark-leaning Sandpack theme tuned to read well against the dashboard's own
// surface colors. We don't pipe in CSS variables because Sandpack's theme
// engine wants concrete colors at construction time.
export const SANDPACK_THEME = {
    colors: {
        surface1: "#0f172a",
        surface2: "#111827",
        surface3: "#1f2937",
        disabled: "#64748b",
        base: "#e5e7eb",
        clickable: "#cbd5e1",
        hover: "#1e293b",
        accent: "#38bdf8",
        error: "#f87171",
        errorSurface: "#450a0a",
    },
    syntax: {
        plain: "#e5e7eb",
        comment: { color: "#94a3b8", fontStyle: "italic" },
        keyword: "#93c5fd",
        definition: "#fbbf24",
        punctuation: "#cbd5e1",
        property: "#67e8f9",
        tag: "#fb7185",
        static: "#c4b5fd",
        string: "#86efac",
    },
    font: {
        body: "Inter, system-ui, sans-serif",
        mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        size: "13px",
        lineHeight: "1.7",
    },
};
