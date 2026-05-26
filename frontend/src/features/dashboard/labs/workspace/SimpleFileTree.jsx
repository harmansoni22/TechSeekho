"use client";

import { FileCode2, Folder } from "lucide-react";

/**
 * Read-only file list used by the React lab.
 *
 * The React lab is deliberately a 2-file playground (App.jsx + styles.css) —
 * no rename/add UI. Trying to mirror Sandpack's full file tree here would
 * blur the line between "lightweight React playground" and "cloud IDE", which
 * the brief explicitly forbids.
 */
const SimpleFileTree = ({
    filePaths,
    activeFile,
    onSelectFile,
    collapsed = false,
    onToggleCollapsed,
}) => (
    <aside
        className={`bg-slate-950 py-3 text-slate-200 ${
            collapsed ? "px-2" : "px-3"
        }`}
        aria-label="File explorer"
    >
        <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Folder size={14} aria-hidden="true" />
                <span
                    className={`cursor-default text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 ${
                        collapsed ? "hidden" : ""
                    }`}
                >
                    Project
                </span>
            </div>
            <button
                type="button"
                onClick={onToggleCollapsed}
                className="cursor-pointer rounded-md p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-2"
                aria-label={
                    collapsed
                        ? "Expand file explorer"
                        : "Collapse file explorer"
                }
                title={collapsed ? "Expand files" : "Collapse files"}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    {collapsed ? (
                        <path d="M9 18l6-6-6-6" />
                    ) : (
                        <path d="M15 18l-6-6 6-6" />
                    )}
                </svg>
            </button>
        </div>
        <div className="space-y-1">
            {filePaths.map((path) => (
                <button
                    key={path}
                    type="button"
                    onClick={() => onSelectFile(path)}
                    title={collapsed ? path.slice(1) : undefined}
                    aria-label={collapsed ? path.slice(1) : undefined}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 text-left text-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 ${
                        collapsed ? "justify-center px-0" : "px-2"
                    }`}
                    style={{
                        backgroundColor:
                            path === activeFile
                                ? "rgba(56, 189, 248, 0.16)"
                                : "transparent",
                    }}
                >
                    <FileCode2 size={14} aria-hidden="true" />
                    <span className={collapsed ? "hidden" : ""}>
                        {path.slice(1)}
                    </span>
                </button>
            ))}
        </div>
    </aside>
);

export default SimpleFileTree;
