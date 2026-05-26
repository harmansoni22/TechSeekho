"use client";

import {
    SandpackCodeEditor,
    SandpackProvider,
    useSandpack,
} from "@codesandbox/sandpack-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConsolePanel from "./ConsolePanel.jsx";
import EditorTabs from "./EditorTabs.jsx";
import { useNarrowWorkspace } from "./hooks/useNarrowWorkspace.js";
import { useResizeDrag } from "./hooks/useResizeDrag.js";
import PreviewPanel from "./PreviewPanel.jsx";
import ResizeHandle from "./ResizeHandle.jsx";
import { buildStaticDocumentFromFiles } from "./srcDocBuilders.js";
import WorkspaceFileTree from "./WorkspaceFileTree.jsx";
import WorkspaceHeader from "./WorkspaceHeader.jsx";
import { DEFAULT_LAYOUT, SANDPACK_THEME } from "./workspaceConstants.js";
import {
    clamp,
    fileCode,
    normalizeFilePath,
    normalizeStoredFiles,
    sanitizeLayout,
    stableSignature,
    starterForFile,
    toSerializableSandpackFiles,
    toWebSandpackProject,
} from "./workspaceUtils.js";

/**
 * Sandpack-powered HTML/CSS/JS workspace.
 *
 * Sandpack here is intentionally scoped: we use `template="static"` (no npm
 * bundler), `autorun: false`, `skipEval: true`. The iframe preview is OUR
 * iframe rendered from `buildStaticDocumentFromFiles` — we don't trust
 * Sandpack's runtime to dispatch our scripts because that would lock us into
 * its bundler architecture (which the brief forbids).
 *
 * What Sandpack actually contributes:
 *   - syntax-highlighted code editor (SandpackCodeEditor)
 *   - virtual filesystem (file map, active file selection, hidden flag)
 *   - file rename/create primitives via `sandpack.addFile / deleteFile`
 *
 * Everything else (preview, save/load, layout) is our code.
 */
const WebSandpackWorkspace = ({
    storageKey,
    initial,
    loadProject,
    saveProject,
    resetSignal,
    title,
    description,
    onSave,
}) => {
    const initialProject = useMemo(
        () => toWebSandpackProject(initial),
        [initial],
    );
    const [project, setProject] = useState(initialProject);
    const [activeFile, setActiveFile] = useState("/index.html");
    const [savedAt, setSavedAt] = useState(null);
    const [status, setStatus] = useState("");
    const [savedSignature, setSavedSignature] = useState(null);
    const [layout, setLayout] = useState(DEFAULT_LAYOUT);
    const [explorerCollapsed, setExplorerCollapsed] = useState(false);
    const [consoleOpen, setConsoleOpen] = useState(true);
    // Remounts SandpackProvider when we hard-reset or reload from storage —
    // simpler than trying to mutate Sandpack's internal state externally.
    const [instanceKey, setInstanceKey] = useState(0);

    const layoutKey = storageKey ? `${storageKey}:layout` : null;
    const explorerKey = storageKey ? `${storageKey}:explorerCollapsed` : null;
    const projectSignature = stableSignature(project);
    const hasUnsavedChanges =
        savedSignature !== null && projectSignature !== savedSignature;

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

    const applySnapshot = useCallback((snapshot) => {
        if (!snapshot?.code) return false;
        const nextProject = snapshot.code.files
            ? normalizeStoredFiles(snapshot.code.files)
            : toWebSandpackProject(snapshot.code);
        const nextActive = nextProject[snapshot.activeFile]
            ? snapshot.activeFile
            : "/index.html";

        setProject(nextProject);
        setActiveFile(nextActive);
        setSavedAt(snapshot.savedAt ?? null);
        setSavedSignature(stableSignature(nextProject));
        setInstanceKey((value) => value + 1);
        return true;
    }, []);

    useEffect(() => {
        // resetSignal is the explicit re-mount trigger from the caller — read
        // it here so React tracks it as a dep without us needing to do
        // anything with the value itself.
        void resetSignal;
        const stored = loadSaved();
        if (stored && applySnapshot(stored)) {
            setStatus("Loaded saved workspace.");
        } else {
            setProject(initialProject);
            setActiveFile("/index.html");
            setSavedAt(null);
            setSavedSignature(stableSignature(initialProject));
            setStatus("");
            setInstanceKey((value) => value + 1);
        }

        if (typeof window !== "undefined" && layoutKey) {
            try {
                const raw = window.localStorage.getItem(layoutKey);
                if (raw) setLayout(sanitizeLayout(JSON.parse(raw)));
            } catch {
                // Layout persistence is best-effort.
            }
        }
        if (typeof window !== "undefined" && explorerKey) {
            try {
                setExplorerCollapsed(
                    window.localStorage.getItem(explorerKey) === "true",
                );
            } catch {
                // Layout persistence is best-effort.
            }
        }
    }, [
        resetSignal,
        loadSaved,
        applySnapshot,
        initialProject,
        layoutKey,
        explorerKey,
    ]);

    const persistLayout = useCallback(
        (nextLayout) => {
            setLayout(nextLayout);
            if (typeof window === "undefined" || !layoutKey) return;
            try {
                window.localStorage.setItem(
                    layoutKey,
                    JSON.stringify(nextLayout),
                );
            } catch {
                // Layout persistence is best-effort.
            }
        },
        [layoutKey],
    );

    const persistExplorerToggle = useCallback(() => {
        setExplorerCollapsed((current) => {
            const next = !current;
            if (typeof window !== "undefined" && explorerKey) {
                try {
                    window.localStorage.setItem(explorerKey, String(next));
                } catch {
                    // Layout persistence is best-effort.
                }
            }
            return next;
        });
    }, [explorerKey]);

    const handleSave = useCallback(
        (snapshot) => {
            if (!storageKey && !saveProject) return;
            const payload = {
                code: { files: snapshot.files },
                activeFile: snapshot.activeFile,
                layout,
                savedAt: Date.now(),
            };
            try {
                if (saveProject) {
                    saveProject(payload);
                } else if (typeof window !== "undefined" && storageKey) {
                    window.localStorage.setItem(
                        storageKey,
                        JSON.stringify(payload),
                    );
                }
                setProject(snapshot.files);
                setActiveFile(snapshot.activeFile);
                setSavedAt(payload.savedAt);
                setSavedSignature(stableSignature(snapshot.files));
                setStatus("Workspace saved on this device.");
                if (onSave) onSave(payload);
            } catch {
                setStatus("Save is unavailable in this browser session.");
            }
        },
        [storageKey, saveProject, layout, onSave],
    );

    const handleReset = useCallback(() => {
        setProject(initialProject);
        setActiveFile("/index.html");
        setSavedSignature(stableSignature(initialProject));
        setStatus("Starter workspace restored.");
        setInstanceKey((value) => value + 1);
    }, [initialProject]);

    const handleLoad = useCallback(() => {
        const stored = loadSaved();
        if (stored && applySnapshot(stored)) {
            setStatus("Loaded saved workspace.");
            return;
        }
        setStatus("No saved workspace for this exercise yet.");
    }, [loadSaved, applySnapshot]);

    return (
        <SandpackProvider
            key={`${storageKey ?? "web"}:${instanceKey}`}
            template="static"
            files={project}
            customSetup={{ entry: "/index.html", environment: "static" }}
            options={{
                activeFile,
                visibleFiles: Object.keys(project),
                autorun: false,
                autoReload: false,
                skipEval: true,
                initMode: "immediate",
            }}
            theme={SANDPACK_THEME}
        >
            <WebSandpackShell
                title={title}
                description={description}
                status={status}
                savedAt={savedAt}
                hasUnsavedChanges={hasUnsavedChanges}
                layout={layout}
                consoleOpen={consoleOpen}
                onConsoleToggle={() => setConsoleOpen((value) => !value)}
                onLayoutChange={persistLayout}
                explorerCollapsed={explorerCollapsed}
                onExplorerToggle={persistExplorerToggle}
                onReset={handleReset}
                onLoad={handleLoad}
                onSave={handleSave}
            />
        </SandpackProvider>
    );
};

// Inner shell — split out because it needs `useSandpack` which is only valid
// inside `SandpackProvider`. The parent wires data flow; this component owns
// the layout and the file-tree state (rename draft, create-file input).
const WebSandpackShell = ({
    title,
    description,
    status,
    savedAt,
    hasUnsavedChanges,
    layout,
    consoleOpen,
    onConsoleToggle,
    onLayoutChange,
    explorerCollapsed,
    onExplorerToggle,
    onReset,
    onLoad,
    onSave,
}) => {
    const { sandpack } = useSandpack();
    const isNarrow = useNarrowWorkspace();
    const [draftName, setDraftName] = useState("");
    const [renamePath, setRenamePath] = useState(null);
    const [renameDraft, setRenameDraft] = useState("");
    const [previewVersion, setPreviewVersion] = useState(0);

    const files = sandpack.files;
    const filePaths = Object.keys(files).filter(
        (path) => !files[path]?.hidden && path !== "/package.json",
    );
    const activeFile = sandpack.activeFile;
    const currentFiles = useMemo(
        () => toSerializableSandpackFiles(files),
        [files],
    );
    const srcDoc = useMemo(
        () => buildStaticDocumentFromFiles(currentFiles),
        [currentFiles],
    );
    const editorHasUnsavedChanges =
        hasUnsavedChanges || sandpack.editorState === "dirty";
    const currentStatus =
        status ||
        (editorHasUnsavedChanges
            ? "Unsaved changes"
            : savedAt
              ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
              : "Starter workspace");

    const saveSnapshot = useCallback(() => {
        onSave({ files: currentFiles, activeFile });
    }, [onSave, currentFiles, activeFile]);

    const openPreviewInNewTab = useCallback(() => {
        const doc = buildStaticDocumentFromFiles(currentFiles);
        const blob = new Blob([doc], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        if (!win) {
            // Popup blocked → fall back to a data URL.
            const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(doc)}`;
            window.open(dataUrl, "_blank", "noopener,noreferrer");
        }
    }, [currentFiles]);

    const refreshPreview = useCallback(() => {
        setPreviewVersion((value) => value + 1);
    }, []);

    const createFile = useCallback(() => {
        const normalized = normalizeFilePath(draftName);
        if (!normalized || files[normalized]) return;
        sandpack.addFile(normalized, starterForFile(normalized), true);
        sandpack.setActiveFile(normalized);
        setDraftName("");
    }, [draftName, files, sandpack]);

    const commitRename = useCallback(() => {
        const nextPath = normalizeFilePath(renameDraft);
        if (!renamePath || !nextPath || files[nextPath]) {
            setRenamePath(null);
            return;
        }
        const currentCode = fileCode(files[renamePath]);
        sandpack.addFile(nextPath, currentCode, false);
        sandpack.deleteFile(renamePath, true);
        sandpack.setActiveFile(nextPath);
        setRenamePath(null);
        setRenameDraft("");
    }, [renamePath, renameDraft, files, sandpack]);

    const resizeSidebar = useResizeDrag({
        onChange: (delta) =>
            onLayoutChange({
                ...layout,
                sidebar: clamp(layout.sidebar + delta.x, 120, 380),
            }),
    });
    const resizePreview = useResizeDrag({
        onChange: (delta) =>
            onLayoutChange({
                ...layout,
                preview: clamp(layout.preview - delta.x / 9, 12, 78),
            }),
    });
    const resizeConsole = useResizeDrag({
        onChange: (delta) =>
            onLayoutChange({
                ...layout,
                console: clamp(layout.console - delta.y, 70, 340),
            }),
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
                modeLabel="Web workspace"
                activeFile={activeFile}
                status={currentStatus}
                hasUnsavedChanges={editorHasUnsavedChanges}
                onReset={onReset}
                onLoad={onLoad}
                onSave={saveSnapshot}
                onConsoleToggle={onConsoleToggle}
                consoleOpen={consoleOpen}
            />

            <div
                className="grid min-h-[680px]"
                style={{
                    gridTemplateColumns: isNarrow
                        ? "1fr"
                        : `${explorerCollapsed ? 54 : layout.sidebar}px 8px minmax(220px, 1fr) 8px minmax(180px, ${layout.preview}%)`,
                }}
            >
                <WorkspaceFileTree
                    filePaths={filePaths}
                    files={files}
                    activeFile={activeFile}
                    draftName={draftName}
                    renamePath={renamePath}
                    renameDraft={renameDraft}
                    collapsed={explorerCollapsed}
                    onToggleCollapsed={onExplorerToggle}
                    onDraftNameChange={setDraftName}
                    onCreateFile={createFile}
                    onSelectFile={sandpack.setActiveFile}
                    onStartRename={(path) => {
                        setRenamePath(path);
                        setRenameDraft(path);
                    }}
                    onRenameDraftChange={setRenameDraft}
                    onCommitRename={commitRename}
                    onCancelRename={() => setRenamePath(null)}
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
                        files={filePaths}
                        activeFile={activeFile}
                        onSelectFile={sandpack.setActiveFile}
                    />
                    <SandpackCodeEditor
                        showTabs={false}
                        showLineNumbers
                        showInlineErrors
                        wrapContent
                        style={{ height: consoleOpen ? 470 : 620 }}
                    />
                    {consoleOpen ? (
                        <ConsolePanel
                            height={layout.console}
                            filePathsCount={filePaths.length}
                            onResize={resizeConsole}
                        />
                    ) : null}
                </div>

                {isNarrow ? null : (
                    <ResizeHandle
                        orientation="vertical"
                        label="Resize editor and preview"
                        {...resizePreview}
                    />
                )}

                <PreviewPanel
                    key={previewVersion}
                    srcDoc={srcDoc}
                    url="preview://web-project"
                    onRefresh={refreshPreview}
                    onOpenInNewTab={openPreviewInNewTab}
                />
            </div>
        </section>
    );
};

export default WebSandpackWorkspace;
