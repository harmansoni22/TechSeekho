"use client";

import { useEffect, useRef } from "react";

export default function DotCursor({
  color = "rgba(152, 202, 253, 0.95)",
  ringColor = "rgba(152, 202, 253, 0.28)",
}) {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };
    let rafId = 0;

    const setVisibility = (visible) => {
      const opacity = visible ? "1" : "0";
      dot.style.opacity = opacity;
      ring.style.opacity = opacity;
    };

    const render = () => {
      ringPos.x += (target.x - ringPos.x) * 0.18;
      ringPos.y += (target.y - ringPos.y) * 0.18;

      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;

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
        ref={ringRef}
        className="absolute h-10 w-10 rounded-full border transition-opacity duration-200"
        style={{
          borderColor: ringColor,
          boxShadow: `0 0 24px ${ringColor}`,
          willChange: "transform",
        }}
      />
      <div
        ref={dotRef}
        className="absolute h-2.5 w-2.5 rounded-full transition-opacity duration-150"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 14px ${color}`,
          willChange: "transform",
        }}
      />
    </div>
  );
}
