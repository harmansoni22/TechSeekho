"use client";

import { useEffect, useRef } from "react";

export default function GlowCursor({
    color = "rgba(152, 202, 253, 0.2)",
    coreColor = "rgba(224, 244, 255, 0.95)",
}) {
    const orbRef = useRef(null);
    const coreRef = useRef(null);

    useEffect(() => {
        const orb = orbRef.current;
        const core = coreRef.current;
        if (!orb || !core) return;

        const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const orbPos = { ...target };
        let rafId = 0;

        const setVisibility = (visible) => {
            const opacity = visible ? "1" : "0";
            orb.style.opacity = opacity;
            core.style.opacity = opacity;
        };

        const render = () => {
            orbPos.x += (target.x - orbPos.x) * 0.12;
            orbPos.y += (target.y - orbPos.y) * 0.12;

            orb.style.transform = `translate3d(${orbPos.x}px, ${orbPos.y}px, 0) translate(-50%, -50%)`;
            core.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;

            rafId = window.requestAnimationFrame(render);
        };

        const handleMove = (event) => {
            target.x = event.clientX;
            target.y = event.clientY;
            setVisibility(true);
        };

        const handleEnter = () => setVisibility(true);
        const handleLeave = () => setVisibility(false);

        setVisibility(false);
        rafId = window.requestAnimationFrame(render);

        window.addEventListener("mousemove", handleMove, { passive: true });
        window.addEventListener("mouseenter", handleEnter);
        window.addEventListener("mouseleave", handleLeave);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseenter", handleEnter);
            window.removeEventListener("mouseleave", handleLeave);
        };
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            <div
                ref={orbRef}
                className="absolute h-20 w-20 rounded-full transition-opacity duration-300"
                style={{
                    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                    filter: "blur(12px)",
                    willChange: "transform",
                }}
            />
            <div
                ref={coreRef}
                className="absolute h-3 w-3 rounded-full transition-opacity duration-150"
                style={{
                    backgroundColor: coreColor,
                    boxShadow: `0 0 20px ${coreColor}`,
                    willChange: "transform",
                }}
            />
        </div>
    );
}
