"use client";

/**
 * Visible grab strip placed between workspace panes. Wires its pointer
 * events to `useResizeDrag` in the parent.
 *
 * `orientation="vertical"` ⇒ a vertical strip; drag horizontally.
 * `orientation="horizontal"` ⇒ a horizontal strip; drag vertically.
 */
const ResizeHandle = ({
    orientation,
    label,
    onPointerDown,
    disabled = false,
}) => (
    <button
        type="button"
        aria-label={label}
        onPointerDown={disabled ? undefined : onPointerDown}
        disabled={disabled}
        className={`touch-none transition ${
            disabled
                ? "cursor-not-allowed bg-slate-800/30"
                : "bg-slate-800/70 hover:bg-sky-500"
        } ${
            orientation === "vertical"
                ? `${disabled ? "" : "cursor-col-resize"} border-0 p-0`
                : `h-1.5 ${disabled ? "" : "cursor-row-resize"} border-0 p-0`
        }`}
    />
);

export default ResizeHandle;
