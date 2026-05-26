"use client";

/**
 * Horizontal file-tab strip above the editor pane. Click switches the active
 * file in both the file tree and the editor — the parent decides which
 * tree/editor are wired up.
 */
const EditorTabs = ({ files, activeFile, onSelectFile }) => (
    <div className="flex min-h-11 overflow-x-auto border-b border-slate-800 bg-slate-900">
        {files.map((path) => (
            <button
                key={path}
                type="button"
                onClick={() => onSelectFile(path)}
                className="cursor-pointer border-r border-slate-800 px-4 text-xs font-medium transition hover:bg-slate-800 focus:outline-none focus:ring-2"
                style={{
                    color: path === activeFile ? "#f8fafc" : "#94a3b8",
                    backgroundColor:
                        path === activeFile ? "#0f172a" : undefined,
                }}
            >
                {path.slice(1)}
            </button>
        ))}
    </div>
);

export default EditorTabs;
