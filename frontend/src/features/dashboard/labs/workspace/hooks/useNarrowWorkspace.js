"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the viewport is too narrow to comfortably show the
 * three-column workspace (file tree + editor + preview). At narrow widths
 * the workspace collapses the resize handles and stacks panes.
 *
 * The breakpoint matches the existing `lg` grid switchover in the dashboard.
 */
export function useNarrowWorkspace() {
    const [isNarrow, setIsNarrow] = useState(false);

    useEffect(() => {
        const update = () => setIsNarrow(window.innerWidth < 980);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    return isNarrow;
}
