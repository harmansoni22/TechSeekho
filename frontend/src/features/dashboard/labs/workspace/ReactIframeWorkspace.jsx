"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EditorTabs from "./EditorTabs.jsx";
import { useNarrowWorkspace } from "./hooks/useNarrowWorkspace.js";
import { useResizeDrag } from "./hooks/useResizeDrag.js";
import PreviewPanel from "./PreviewPanel.jsx";
import ResizeHandle from "./ResizeHandle.jsx";
import SimpleFileTree from "./SimpleFileTree.jsx";
import { buildReactSrcDoc } from "./srcDocBuilders.js";
import WorkspaceHeader from "./WorkspaceHeader.jsx";
import { DEFAULT_LAYOUT, REACT_FILES } from "./workspaceConstants.js";
import {
    clamp,
    normalizeStoredFiles,
    stableSignature,
} from "./workspaceUtils.js";

/**
 * React lab workspace — deliberately NOT on Sandpack.
 *
 * The brief explicitly requires the React lab to stay on iframe-only
 * execution + Babel standalone. Migrating it to Sandpack's runtime would
 * pull in their bundler/CDN resolution machinery, which is exactly the
 * "heavy IDE infrastructure" the brief forbids.
 *
 * What this shares with the vanilla lab is the *UI shell* — WorkspaceHeader,
 * EditorTabs, file tree, PreviewPanel chrome. The editor itself is a plain
 * `<textarea>` because we're not bringing Sandpack's editor in here just for
 * syntax highlighting — that would defeat the "lightweight" constraint.
 */
const ReactIframeWorkspace = ({
    storageKey,
    initial,
    loadProject,
    saveProject,
    resetSignal,
    title,
    description,
    onSave,
}) => {
    const isNarrow = useNarrowWorkspace();
    const initialFiles = useMemo(
        () => ({
            "/App.jsx": initial.jsx ?? initial.js ?? "",
            "/styles.css": initial.css ?? "",
        }),
        [initial],
    );
    const [files, setFiles] = useState(initialFiles);
    const [activeFile, setActiveFile] = useState("/App.jsx");
    const [savedAt, setSavedAt] = useState(null);
    const [status, setStatus] = useState("");
    const [savedSignature, setSavedSignature] = useState(null);
    const [layout, setLayout] = useState(DEFAULT_LAYOUT);
    // Bugfix: the pre-refactor version referenced explorerCollapsed without
    // declaring it. The React lab now properly owns this state.
    const [explorerCollapsed, setExplorerCollapsed] = useState(false);
    const iframeRef = useRef(null);

    const code = useMemo(
        () => ({
            jsx: files["/App.jsx"] ?? "",
            css: files["/styles.css"] ?? "",
        }),
        [files],
    );
    const hasUnsavedChanges =
        savedSignature !== null && stableSignature(files) !== savedSignature;

    const loadSaved = useCallback(() => {
        if (loadProject) return loadProject();
        if (typeof window === "undefined" || !storageKey) return null;
        try {
            const raw = window.localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, [loadProject, storageKey]);

    useEffect(() => {
        // resetSignal is the explicit re-mount trigger from the caller — read
        // it here so React tracks it as a dep without us needing to do
        // anything with the value itself.
        void resetSignal;
        const stored = loadSaved();
        if (stored?.code) {
            const nextFiles = stored.code.files
                ? normalizeStoredFiles(stored.code.files)
                : {
                      "/App.jsx": stored.code.jsx ?? stored.code.js ?? "",
                      "/styles.css": stored.code.css ?? "",
                  };
            setFiles(nextFiles);
            setActiveFile(
                nextFiles[stored.activeFile] ? stored.activeFile : "/App.jsx",
            );
            setSavedAt(stored.savedAt ?? null);
            setSavedSignature(stableSignature(nextFiles));
            setStatus("Loaded saved workspace.");
            return;
        }
        setFiles(initialFiles);
        setActiveFile("/App.jsx");
        setSavedAt(null);
        setSavedSignature(stableSignature(initialFiles));
        setStatus("");
    }, [resetSignal, loadSaved, initialFiles]);

    const save = useCallback(() => {
        const payload = {
            code: {
                files,
                jsx: files["/App.jsx"],
                css: files["/styles.css"],
            },
            activeFile,
            savedAt: Date.now(),
        };
        try {
            if (saveProject) saveProject(payload);
            else if (typeof window !== "undefined" && storageKey) {
                window.localStorage.setItem(
                    storageKey,
                    JSON.stringify(payload),
                );
            }
            setSavedAt(payload.savedAt);
            setSavedSignature(stableSignature(files));
            setStatus("Workspace saved on this device.");
            if (onSave) onSave(payload);
        } catch {
            setStatus("Save is unavailable in this browser session.");
        }
    }, [files, activeFile, saveProject, storageKey, onSave]);

    const reset = useCallback(() => {
        setFiles(initialFiles);
        setActiveFile("/App.jsx");
        setSavedSignature(stableSignature(initialFiles));
        setStatus("Starter workspace restored.");
    }, [initialFiles]);

    const load = useCallback(() => {
        const stored = loadSaved();
        if (stored?.code) {
            const nextFiles = stored.code.files
                ? normalizeStoredFiles(stored.code.files)
                : {
                      "/App.jsx": stored.code.jsx ?? stored.code.js ?? "",
                      "/styles.css": stored.code.css ?? "",
                  };
            setFiles(nextFiles);
            setActiveFile(
                nextFiles[stored.activeFile] ? stored.activeFile : "/App.jsx",
            );
            setStatus("Loaded saved workspace.");
        } else {
            setStatus("No saved workspace for this exercise yet.");
        }
    }, [loadSaved]);

    const srcDoc = useMemo(() => buildReactSrcDoc(code), [code]);

    const openNewTab = useCallback(() => {
        const blob = new Blob([srcDoc], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        if (!win) {
            const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(srcDoc)}`;
            window.open(dataUrl, "_blank", "noopener,noreferrer");
        }
    }, [srcDoc]);

    const refreshPreview = useCallback(() => {
        if (iframeRef.current) iframeRef.current.srcdoc = srcDoc;
    }, [srcDoc]);

    const resizeSidebar = useResizeDrag({
        onChange: (delta) =>
            setLayout((current) => ({
                ...current,
                sidebar: clamp(current.sidebar + delta.x, 120, 380),
            })),
    });
    const resizePreview = useResizeDrag({
        onChange: (delta) =>
            setLayout((current) => ({
                ...current,
                preview: clamp(current.preview - delta.x / 9, 12, 78),
            })),
    });

    return (
        <section
            className="overflow-hidden rounded-xl border"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
            }}
        >
            <WorkspaceHeader
                title={title}
                description={description}
                modeLabel="React workspace"
                activeFile={activeFile}
                status={
                    status ||
                    (hasUnsavedChanges
                        ? "Unsaved changes"
                        : savedAt
                          ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
                          : "Starter workspace")
                }
                hasUnsavedChanges={hasUnsavedChanges}
                onReset={reset}
                onLoad={load}
                onSave={save}
                onConsoleToggle={null}
                consoleOpen={false}
            />

            <div
                className="grid min-h-[640px]"
                style={{
                    gridTemplateColumns: isNarrow
                        ? "1fr"
                        : `${explorerCollapsed ? 54 : layout.sidebar}px 8px minmax(220px, 1fr) 8px minmax(180px, ${layout.preview}%)`,
                }}
            >
                <SimpleFileTree
                    filePaths={REACT_FILES}
                    activeFile={activeFile}
                    onSelectFile={setActiveFile}
                    collapsed={explorerCollapsed}
                    onToggleCollapsed={() =>
                        setExplorerCollapsed((value) => !value)
                    }
                />
                {isNarrow ? null : (
                    <ResizeHandle
                        orientation="vertical"
                        label="Resize file sidebar"
                        disabled={explorerCollapsed}
                        {...resizeSidebar}
                    />
                )}

                <div className="min-w-0">
                    <EditorTabs
                        files={REACT_FILES}
                        activeFile={activeFile}
                        onSelectFile={setActiveFile}
                    />
                    <textarea
                        value={files[activeFile] ?? ""}
                        spellCheck={false}
                        onChange={(event) =>
                            setFiles((current) => ({
                                ...current,
                                [activeFile]: event.target.value,
                            }))
                        }
                        aria-label={`${activeFile} editor`}
                        className="block h-[596px] w-full resize-none border-0 bg-slate-950 px-5 py-4 text-sm leading-7 text-slate-100 outline-none focus:ring-2"
                        style={{
                            fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            tabSize: 2,
                        }}
                    />
                </div>

                {isNarrow ? null : (
                    <ResizeHandle
                        orientation="vertical"
                        label="Resize editor and preview"
                        {...resizePreview}
                    />
                )}

                <PreviewPanel
                    iframeRef={iframeRef}
                    srcDoc={srcDoc}
                    url="preview://react-workspace"
                    onRefresh={refreshPreview}
                    onOpenInNewTab={openNewTab}
                />
            </div>
        </section>
    );
};

export default ReactIframeWorkspace;
