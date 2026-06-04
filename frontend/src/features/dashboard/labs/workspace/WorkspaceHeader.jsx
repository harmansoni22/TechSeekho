"use client";

import { PanelBottom, RotateCcw, Save, Upload } from "lucide-react";
import WorkspaceButton from "./WorkspaceButton.jsx";

/**
 * Top of every workspace. Shows current status + activates the toolbar.
 *
 * `onConsoleToggle` is null for the React lab (no console panel), so we
 * conditionally render the button.
 *
 * `hasUnsavedChanges` flips the status dot from green to amber, which is the
 * only piece of state the parent passes us — everything else is plain text.
 *
 * `extras` is an optional React node rendered between Save and the console
 * toggle. The Web lab uses this to mount the LibrariesPicker; the React lab
 * leaves it null.
 */
const WorkspaceHeader = ({
    title,
    description,
    modeLabel,
    activeFile,
    status,
    hasUnsavedChanges,
    onReset,
    onLoad,
    onSave,
    onConsoleToggle,
    consoleOpen,
    extras,
}) => (
    <header
        className="border-b px-4 py-3"
        style={{ borderColor: "var(--dashboard-border)" }}
    >
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
                <p
                    className="cursor-default text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {modeLabel}
                </p>
                <h2
                    className="mt-1 truncate font-display text-lg"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    {title ?? "Mini web project"}
                </h2>
                {description ? (
                    <p
                        className="mt-1 max-w-3xl text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {description}
                    </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{
                            backgroundColor: hasUnsavedChanges
                                ? "#f59e0b"
                                : "#22c55e",
                        }}
                        aria-hidden="true"
                    />
                    <span
                        className="cursor-default"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {status}
                    </span>
                    <span
                        className="cursor-default"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Active: {activeFile}
                    </span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <WorkspaceButton icon={RotateCcw} onClick={onReset}>
                    Reset
                </WorkspaceButton>
                <WorkspaceButton icon={Upload} onClick={onLoad}>
                    Load
                </WorkspaceButton>
                <WorkspaceButton icon={Save} onClick={onSave} variant="accent">
                    Save
                </WorkspaceButton>
                {extras}
                {onConsoleToggle ? (
                    <WorkspaceButton
                        icon={PanelBottom}
                        onClick={onConsoleToggle}
                    >
                        {consoleOpen ? "Hide console" : "Console"}
                    </WorkspaceButton>
                ) : null}
            </div>
        </div>
    </header>
);

export default WorkspaceHeader;
