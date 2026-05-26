"use client";

import { FileCode2, Folder, Pencil, Plus } from "lucide-react";

/**
 * Full file explorer for the vanilla (HTML/CSS/JS) lab.
 *
 * Supports: select, create new file, rename file, collapse/expand sidebar.
 * Delete is deliberately omitted — students shouldn't be able to break their
 * lab by removing /index.html. To "clear", they use the Reset button on the
 * workspace toolbar.
 */
const WorkspaceFileTree = ({
    filePaths,
    files,
    activeFile,
    draftName,
    renamePath,
    renameDraft,
    collapsed = false,
    onToggleCollapsed,
    onDraftNameChange,
    onCreateFile,
    onSelectFile,
    onStartRename,
    onRenameDraftChange,
    onCommitRename,
    onCancelRename,
}) => (
    <aside
        className={`min-w-0 bg-slate-950 py-3 text-slate-200 transition-[padding] duration-200 ${
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

        <div className={`mb-3 flex gap-1 ${collapsed ? "hidden" : ""}`}>
            <input
                value={draftName}
                onChange={(event) => onDraftNameChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") onCreateFile();
                }}
                placeholder="new-file.js"
                className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:ring-2"
            />
            <button
                type="button"
                onClick={onCreateFile}
                className="cursor-pointer rounded-md bg-slate-800 px-2 text-slate-100 transition hover:bg-slate-700 focus:outline-none focus:ring-2"
                aria-label="Create new file"
            >
                <Plus size={14} aria-hidden="true" />
            </button>
        </div>

        <div className="space-y-1">
            {filePaths.map((path) => {
                const isActive = path === activeFile;
                if (renamePath === path) {
                    return (
                        <div
                            key={path}
                            className="group flex items-center gap-1"
                        >
                            <input
                                value={renameDraft}
                                onChange={(event) =>
                                    onRenameDraftChange(event.target.value)
                                }
                                onBlur={onCommitRename}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") onCommitRename();
                                    if (event.key === "Escape")
                                        onCancelRename();
                                }}
                                className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:ring-2"
                            />
                        </div>
                    );
                }
                return (
                    <div key={path} className="group flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onSelectFile(path)}
                            title={collapsed ? path.slice(1) : undefined}
                            aria-label={collapsed ? path.slice(1) : undefined}
                            className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-1.5 text-left text-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 ${
                                collapsed ? "justify-center px-0" : "px-2"
                            }`}
                            style={{
                                backgroundColor: isActive
                                    ? "rgba(56, 189, 248, 0.16)"
                                    : "transparent",
                                color: isActive ? "#f8fafc" : "#cbd5e1",
                            }}
                        >
                            <FileCode2 size={14} aria-hidden="true" />
                            <span
                                className={`truncate ${
                                    collapsed ? "hidden" : ""
                                }`}
                            >
                                {path.slice(1)}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onStartRename(path)}
                            className={`cursor-pointer rounded p-1 text-slate-500 opacity-0 transition hover:bg-slate-800 hover:text-slate-200 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 ${
                                collapsed ? "hidden" : ""
                            }`}
                            aria-label={`Rename ${path}`}
                            disabled={Boolean(files[path]?.readOnly)}
                        >
                            <Pencil size={12} aria-hidden="true" />
                        </button>
                    </div>
                );
            })}
        </div>
    </aside>
);

export default WorkspaceFileTree;
