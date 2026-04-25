"use client";

import { useEffect, useRef } from "react";

export default function CrosshairCursor({
  color = "rgba(198, 228, 255, 0.95)",
  accentColor = "rgba(61, 151, 255, 0.55)",
}) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let rafId = 0;

    const setVisibility = (visible) => {
      wrapper.style.opacity = visible ? "1" : "0";
    };

    const render = () => {
      wrapper.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      rafId = window.requestAnimationFrame(render);
    };

    const handleMove = (event) => {
      pos.x = event.clientX;
      pos.y = event.clientY;
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
        ref={wrapperRef}
        className="absolute h-12 w-12 transition-opacity duration-150"
        style={{ willChange: "transform" }}
      >
        <div
          className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
          style={{
            background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)`,
          }}
        />
        <div
          className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2"
          style={{
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            borderColor: color,
            boxShadow: `0 0 16px ${accentColor}`,
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
