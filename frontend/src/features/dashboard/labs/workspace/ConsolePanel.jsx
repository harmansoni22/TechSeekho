"use client";

import ResizeHandle from "./ResizeHandle.jsx";

/**
 * Output panel rendered below the code editor in vanilla labs.
 *
 * This is intentionally NOT a real captured console — that would require
 * proxying console.* through postMessage from the iframe, which the brief
 * explicitly avoids ("no terminal system", "no filesystem simulation").
 * Instead we show a stable status block that confirms what the iframe is
 * assembled from and what its sandbox restrictions are.
 */
const ConsolePanel = ({ height, filePathsCount, onResize }) => (
    <>
        <ResizeHandle
            orientation="horizontal"
            label="Resize console"
            {...onResize}
        />
        <div
            className="border-t bg-slate-950 px-4 py-3"
            style={{
                borderColor: "var(--dashboard-border)",
                height,
            }}
        >
            <div className="flex h-full flex-col gap-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                    <span className="cursor-default font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Output
                    </span>
                    <span className="cursor-default text-slate-500">
                        Browser-only iframe
                    </span>
                </div>
                <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-md bg-slate-900 p-3 text-slate-300">
                    {`Preview assembled from:
- /index.html
- /styles.css
- /script.js

Sandbox: allow-scripts only
Runtime: local iframe srcDoc
Files: ${filePathsCount}`}
                </pre>
            </div>
        </div>
    </>
);

export default ConsolePanel;
