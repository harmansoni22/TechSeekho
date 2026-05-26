"use client";

import { useRef } from "react";

/**
 * Pointer-driven resize hook used by the workspace's resize handles.
 *
 * Returns `{ onPointerDown }` to spread onto the element you want grabbable.
 * The `onChange({x, y})` callback fires with deltas (in pixels) for each
 * pointermove until pointerup. Captures the pointer to the element so the
 * user can drag past the handle edges.
 */
export function useResizeDrag({ onChange }) {
    const dragRef = useRef(null);

    return {
        onPointerDown: (event) => {
            event.preventDefault();
            dragRef.current = { x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);

            const handleMove = (moveEvent) => {
                if (!dragRef.current) return;
                const delta = {
                    x: moveEvent.clientX - dragRef.current.x,
                    y: moveEvent.clientY - dragRef.current.y,
                };
                dragRef.current = {
                    x: moveEvent.clientX,
                    y: moveEvent.clientY,
                };
                onChange(delta);
            };
            const handleUp = () => {
                window.removeEventListener("pointermove", handleMove);
                window.removeEventListener("pointerup", handleUp);
                dragRef.current = null;
            };

            window.addEventListener("pointermove", handleMove);
            window.addEventListener("pointerup", handleUp);
        },
    };
}
