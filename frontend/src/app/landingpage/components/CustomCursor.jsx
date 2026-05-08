"use client";

import { useEffect, useState } from "react";
import CrosshairCursor from "./Cursor/CrosshairCursor";
import DotCursor from "./Cursor/DotCursor";
import GlowCursor from "./Cursor/GlowCursor";
import SplashCursor from "./Cursor/SplashCursor";
import TrailCursor from "./Cursor/TrailCursor";

const useCursorEnabled = () => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const fineQuery = window.matchMedia(
            "(hover: hover) and (pointer: fine)",
        );
        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );

        const update = () => {
            setEnabled(fineQuery.matches && !motionQuery.matches);
        };

        update();
        fineQuery.addEventListener?.("change", update);
        motionQuery.addEventListener?.("change", update);

        return () => {
            fineQuery.removeEventListener?.("change", update);
            motionQuery.removeEventListener?.("change", update);
        };
    }, []);

    return enabled;
};

const SPLASH_CURSOR_PROPS = {
    BLEND_MODE: "screen",
    LAYER_OPACITY: 0.76,
    DYE_RESOLUTION: 1440,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 2.8,
    VELOCITY_DISSIPATION: 3.5,
    SPLAT_RADIUS: 0.2,
    SPLAT_FORCE: 5200,
    COLOR_UPDATE_SPEED: 6,
    TRANSPARENT: true,
    PRESSURE_ITERATIONS: 20,
    SIM_RESOLUTION: 128,
    INTERACTIVE_SELECTOR: "",
};

const CURSOR_COMPONENTS = {
    none: null,
    splash: SplashCursor,
    dot: DotCursor,
    glow: GlowCursor,
    trail: TrailCursor,
    crosshair: CrosshairCursor,
};

const CustomCursor = ({ type = "splash", ...props }) => {
    const enabled = useCursorEnabled();
    const normalizedType = String(type || "splash").toLowerCase();
    const CursorComponent = CURSOR_COMPONENTS[normalizedType] ?? null;

    if (!enabled || !CursorComponent) return null;

    if (normalizedType === "splash") {
        return <CursorComponent {...SPLASH_CURSOR_PROPS} {...props} />;
    }

    return <CursorComponent {...props} />;
};

export default CustomCursor;
