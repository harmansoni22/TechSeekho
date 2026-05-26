/**
 * Pure helpers for the Skill Labs workspace — no React, no DOM, easy to unit
 * test if we ever wire up vitest coverage for them.
 *
 * The Sandpack project shape is `{ [path]: { code } }` with optional
 * `{ code, hidden, readOnly }`. We normalize/serialize between that and the
 * compact `{ html, css, js, jsx }` shape that lab starter snippets use.
 */

import { DEFAULT_LAYOUT } from "./workspaceConstants.js";

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function normalizeFilePath(name) {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return "";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function starterForFile(path) {
    if (path.endsWith(".css")) return "/* Add styles here */\n";
    if (path.endsWith(".js")) return "// Add JavaScript here\n";
    if (path.endsWith(".html")) return "<section>\n  \n</section>\n";
    return "";
}

export function fileCode(file) {
    if (!file) return "";
    return typeof file === "string" ? file : file.code;
}

/**
 * Cheap, order-stable signature used to detect "has this file set changed
 * since the last save?". JSON.stringify is enough for our payload sizes —
 * we're not doing this every keystroke, only on event boundaries.
 */
export function stableSignature(value) {
    return JSON.stringify(value);
}

/**
 * Convert a starter snippet `{ html, css, js }` into the Sandpack file map
 * used by the static template.
 */
export function toWebSandpackProject(code = {}) {
    return {
        "/index.html": { code: ensureFullHtml(code.html ?? "") },
        "/styles.css": { code: code.css ?? "" },
        "/script.js": { code: code.js ?? "" },
    };
}

/**
 * Sandpack stores files as `{ [path]: { code, hidden?, readOnly? } }`. Saves
 * sometimes carry raw strings (older format) — normalize to the object form.
 * Also drops package.json + hidden files so they never reappear in the tree.
 */
export function normalizeStoredFiles(files) {
    const normalized = {};
    for (const [path, value] of Object.entries(files)) {
        normalized[normalizeFilePath(path)] =
            typeof value === "string" ? { code: value } : value;
    }
    return normalized;
}

export function toSerializableSandpackFiles(files) {
    const serialized = {};
    for (const [path, value] of Object.entries(files)) {
        if (path === "/package.json" || value?.hidden) continue;
        serialized[path] = { code: fileCode(value) };
    }
    return serialized;
}

/**
 * Wrap a fragmentary HTML string in a full document if it's missing
 * `<html>`. Lets starter snippets stay terse but ensures the iframe sees a
 * well-formed page.
 */
export function ensureFullHtml(html) {
    if (/<html[\s>]/i.test(html)) return html;
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skill Labs Project</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
${indent(html || "<main>\n  <h1>Hello, web project</h1>\n</main>", 4)}
    <script src="/script.js"></script>
  </body>
</html>`;
}

export function indent(value, spaces) {
    const prefix = " ".repeat(spaces);
    return value
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n");
}

/**
 * Bound the persisted layout to defensible ranges so a corrupted localStorage
 * entry can't render the workspace unusable (e.g. preview at 99%).
 */
export function sanitizeLayout(value) {
    return {
        sidebar: clamp(
            Number(value?.sidebar) || DEFAULT_LAYOUT.sidebar,
            150,
            280,
        ),
        preview: clamp(
            Number(value?.preview) || DEFAULT_LAYOUT.preview,
            28,
            58,
        ),
        console: clamp(
            Number(value?.console) || DEFAULT_LAYOUT.console,
            90,
            260,
        ),
    };
}
