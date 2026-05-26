"use client";

import { ExternalLink, RefreshCw } from "lucide-react";

/**
 * Sandboxed iframe preview with a fake browser chrome bar.
 *
 * `sandbox="allow-scripts"` is intentional — the user code can run JS but
 * can't reach the host page (no `allow-same-origin`).
 *
 * `onOpenInNewTab` is wired by the workspace; it builds a blob URL of the
 * same document and opens it.
 */
const PreviewPanel = ({
    iframeRef,
    srcDoc,
    url,
    onRefresh,
    onOpenInNewTab,
}) => (
    <div className="min-w-0 bg-slate-100 p-3">
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <div className="min-w-0 flex-1 rounded-md bg-white px-3 py-1 text-xs text-slate-500">
                    {url}
                </div>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="cursor-pointer rounded-md p-1.5 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2"
                    aria-label="Refresh preview"
                >
                    <RefreshCw size={14} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={onOpenInNewTab}
                    className="cursor-pointer rounded-md p-1.5 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2"
                    aria-label="Open preview in new tab"
                >
                    <ExternalLink size={14} aria-hidden="true" />
                </button>
            </div>
            <iframe
                ref={iframeRef}
                title="Workspace preview"
                sandbox="allow-scripts"
                srcDoc={srcDoc}
                className="min-h-0 flex-1 border-0 bg-white"
            />
        </div>
    </div>
);

export default PreviewPanel;
