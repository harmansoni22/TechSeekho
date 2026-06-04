"use client";

import { Library } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
    LAB_LIBRARIES,
    LAB_LIBRARY_ORDER,
} from "@/features/dashboard/labs/labConfigs";
import WorkspaceButton from "./WorkspaceButton.jsx";

/**
 * Workspace toolbar control for toggling CDN libraries (Bootstrap, Tailwind,
 * jQuery, etc.) into the preview iframe.
 *
 * Implemented as a button + lightweight popover. The popover closes on
 * outside-click and Escape. We keep this self-contained so future labs can
 * adopt or skip it just by mounting/omitting this component.
 *
 * Props
 *   selectedIds  Array of currently-enabled library IDs.
 *   onToggle     (id: string) => void — flips a single library on/off.
 */
const LibrariesPicker = ({ selectedIds = [], onToggle }) => {
    const [open, setOpen] = useState(false);
    const popoverRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (event) => {
            if (popoverRef.current?.contains(event.target)) return;
            if (triggerRef.current?.contains(event.target)) return;
            setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const count = selectedIds.length;

    return (
        <div className="relative" ref={triggerRef}>
            <WorkspaceButton
                icon={Library}
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="true"
            >
                Libraries{count > 0 ? ` (${count})` : ""}
            </WorkspaceButton>
            {open ? (
                <div
                    ref={popoverRef}
                    role="dialog"
                    aria-label="Toggle CDN libraries"
                    className="absolute right-0 z-20 mt-2 w-80 rounded-lg border p-3 shadow-lg"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--dashboard-surface)",
                        boxShadow: "var(--dashboard-shadow)",
                    }}
                >
                    <div className="mb-2">
                        <p
                            className="cursor-default text-[10px] uppercase tracking-[0.22em]"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            CDN libraries
                        </p>
                        <p
                            className="cursor-default mt-0.5 text-xs"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Loaded into the preview iframe — toggle any combo.
                        </p>
                    </div>
                    <ul className="flex flex-col gap-1">
                        {LAB_LIBRARY_ORDER.map((id) => {
                            const lib = LAB_LIBRARIES[id];
                            const enabled = selectedIds.includes(id);
                            return (
                                <li key={id}>
                                    <label
                                        className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition hover:opacity-95 focus-within:ring-2"
                                        style={{
                                            borderColor: enabled
                                                ? "var(--dashboard-accent)"
                                                : "var(--dashboard-border)",
                                            backgroundColor: enabled
                                                ? "color-mix(in srgb, var(--dashboard-accent) 12%, var(--dashboard-surface))"
                                                : "var(--dashboard-surface)",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={() => onToggle(id)}
                                            className="mt-0.5 cursor-pointer"
                                            aria-label={`Toggle ${lib.label}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className="text-sm font-semibold"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {lib.label}
                                            </p>
                                            <p
                                                className="cursor-default mt-0.5 text-xs leading-snug"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {lib.description}
                                            </p>
                                        </div>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}
        </div>
    );
};

export default LibrariesPicker;
