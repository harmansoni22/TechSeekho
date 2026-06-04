/**
 * srcDoc builders for the Skill Labs preview iframes.
 *
 * `buildStaticDocumentFromFiles` is for the HTML/CSS/JS vanilla labs — it
 * inlines styles and script bodies so the iframe doesn't need to fetch
 * Sandpack's virtual filesystem.
 *
 * `buildReactSrcDoc` is for the React lab — it deliberately stays on
 * Babel-standalone-in-iframe and does NOT migrate to Sandpack runtime, per
 * the architectural decision documented in CLAUDE.md.
 */

import { fileCode } from "./workspaceUtils.js";

/**
 * Build the iframe srcDoc for vanilla Web labs.
 *
 * `libraries` is an array of resolved library objects from LAB_LIBRARIES
 * (each with `head: string[]` and `body: string[]` arrays of HTML tags).
 * Library `<head>` tags load BEFORE the inlined user CSS so user styles can
 * override library defaults. Library `<body>` scripts load AFTER the user's
 * inline JS so global helpers (jQuery, Bootstrap JS) are still in scope
 * when user code references them.
 */
export function buildStaticDocumentFromFiles(files, libraries = []) {
    const html = fileCode(files["/index.html"]);
    const css = fileCode(files["/styles.css"]);
    const js = fileCode(files["/script.js"]);

    const libHeadTags = libraries.flatMap((lib) => lib?.head ?? []).join("\n");
    const libBodyTags = libraries.flatMap((lib) => lib?.body ?? []).join("\n");

    const inlineCss = `<style data-skill-labs="styles.css">${css}</style>`;
    // Wrapping user JS in `new Function(...)` instead of inline script means
    // syntax errors are caught and rendered as a visible error block rather
    // than silently failing in the iframe console.
    const inlineJs = `<script data-skill-labs="script.js">try{new Function(${JSON.stringify(js)})();}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="color:#b91c1c;padding:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-top:12px;white-space:pre-wrap;">' + (e && e.stack || e) + '</pre>');}</script>`;

    if (/<html[\s>]/i.test(html)) {
        // Strip the link/script tags that point at Sandpack's virtual files
        // so we don't double-load them after inlining.
        const withoutExternalAssets = html
            .replace(/<link\b[^>]*href=["']\/?styles\.css["'][^>]*>\s*/gi, "")
            .replace(
                /<script\b[^>]*src=["']\/?script\.js["'][^>]*>\s*<\/script>\s*/gi,
                "",
            );
        return withoutExternalAssets
            .replace(
                "</head>",
                `${libHeadTags ? `${libHeadTags}\n` : ""}${inlineCss}</head>`,
            )
            .replace(
                "</body>",
                `${inlineJs}${libBodyTags ? `\n${libBodyTags}` : ""}</body>`,
            );
    }
    return `<!doctype html><html><head><meta charset="utf-8">${libHeadTags}${inlineCss}</head><body>${html}${inlineJs}${libBodyTags}</body></html>`;
}

/**
 * React lab srcDoc. Loads react + react-dom + @babel/standalone from unpkg
 * inside the iframe, then Babel.transforms the user's JSX and executes it.
 * Everything happens inside the sandboxed iframe — no host-app dependency on
 * Babel.
 *
 * If any of the unpkg fetches fail, a clear error block is rendered instead
 * of a blank screen.
 */
export function buildReactSrcDoc({ css, jsx }) {
    return `<!doctype html>
<html><head><meta charset="utf-8">
<style>${css ?? ""}</style>
<style>.lab-runtime-error { color:#b91c1c; padding:12px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; margin:12px; white-space:pre-wrap; font-family: ui-monospace, monospace; font-size: 13px; }</style>
</head>
<body>
<div id="root"></div>
<!--
  React lab runs entirely inside a sandboxed iframe.
  We intentionally avoid external CDNs here to keep iframe network/CSP predictable.
  Vendor files must exist in Next.js public/ and will be served by the host app.
  (See frontend/public/vendor-react/README.txt)
-->
<script crossorigin src="/vendor-react/react.production.min.js"></script>
<script crossorigin src="/vendor-react/react-dom.production.min.js"></script>
<script src="/vendor-react/babel.min.js"></script>
<script>
window.addEventListener("error", (e) => {
  const el = document.createElement("pre");
  el.className = "lab-runtime-error";
  el.textContent = "Runtime error: " + (e?.error?.stack || e?.message || String(e));
  document.body.appendChild(el);
});
window.addEventListener("DOMContentLoaded", () => {
  if (!window.React || !window.ReactDOM || !window.Babel) {
    const el = document.createElement("pre");
    el.className = "lab-runtime-error";
    el.textContent = "Failed to load React/ReactDOM/Babel vendor scripts. Ensure /public/vendor-react contains react.production.min.js, react-dom.production.min.js, and babel.min.js.";
    document.body.appendChild(el);
    return;
  }
  try {
    const code = ${JSON.stringify(jsx ?? "")};
    const out = Babel.transform(code, { presets: ["env", "react"] }).code;
    new Function(out)();
  } catch (err) {
    const el = document.createElement("pre");
    el.className = "lab-runtime-error";
    el.textContent = "Compile error: " + (err?.stack || err?.message || String(err));
    document.body.appendChild(el);
  }
});
</script>
</body></html>`;
}
