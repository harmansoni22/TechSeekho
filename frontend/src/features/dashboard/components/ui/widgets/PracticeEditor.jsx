"use client";

import ReactIframeWorkspace from "@/features/dashboard/labs/workspace/ReactIframeWorkspace.jsx";
import WebSandpackWorkspace from "@/features/dashboard/labs/workspace/WebSandpackWorkspace.jsx";

/**
 * Public entry for the Skill Labs / module-detail practice editor.
 *
 * This file used to be a 1456-line monolith mixing Sandpack, the React lab
 * iframe, file-tree state, resize logic, srcDoc builders, and UI primitives.
 * It's now a thin router that picks the workspace component matching the
 * caller's `mode`. All implementation lives under
 * `features/dashboard/labs/workspace/`.
 *
 * Props (forwarded to the underlying workspace):
 *   storageKey   localStorage key for this workspace's saved snapshot.
 *   initial      Starter code map. Shape depends on mode:
 *                  vanilla → { html?, css?, js? }
 *                  react   → { jsx?, css? }
 *   mode         "vanilla" (default) or "react".
 *   loadProject  Optional override for the load step (used by lab pages that
 *                want to centralize storage in `labStorage.js`).
 *   saveProject  Optional override for the save step (same).
 *   resetSignal  Bump this to force the workspace to re-hydrate from storage.
 *   title        Header title.
 *   description  Header subtitle.
 *   onSave       Notified after a successful save.
 *
 * The two workspaces deliberately do NOT share execution paths:
 *   - vanilla → Sandpack provides the editor UI (syntax highlighting + file
 *               tree), but the preview is still our own sandboxed iframe.
 *   - react   → iframe + Babel standalone, no Sandpack runtime. See
 *               CLAUDE.md for the rationale.
 */
const PracticeEditor = ({ mode = "vanilla", ...props }) => {
    if (mode === "react") return <ReactIframeWorkspace {...props} />;
    return <WebSandpackWorkspace {...props} />;
};

export default PracticeEditor;
