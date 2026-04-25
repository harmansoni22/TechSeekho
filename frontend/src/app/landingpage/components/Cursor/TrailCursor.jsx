"use client";

import { useEffect, useRef } from "react";

export default function TrailCursor({
  color = "rgba(152, 202, 253, 0.95)",
  trailColor = "rgba(152, 202, 253, 0.35)",
}) {
  const segmentsRef = useRef([]);

  useEffect(() => {
    const segments = segmentsRef.current.filter(Boolean);
    if (!segments.length) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const points = Array.from({ length: segments.length }, () => ({
      x: target.x,
      y: target.y,
    }));
    let rafId = 0;

    const setVisibility = (visible) => {
      const opacity = visible ? "1" : "0";
      segments.forEach((segment) => {
        segment.style.opacity = opacity;
      });
    };

    const render = () => {
      points[0].x += (target.x - points[0].x) * 0.28;
      points[0].y += (target.y - points[0].y) * 0.28;

      for (let i = 1; i < points.length; i += 1) {
        points[i].x += (points[i - 1].x - points[i].x) * 0.24;
        points[i].y += (points[i - 1].y - points[i].y) * 0.24;
      }

      segments.forEach((segment, index) => {
        segment.style.transform = `translate3d(${points[index].x}px, ${points[index].y}px, 0) translate(-50%, -50%)`;
      });

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
      {[10, 7, 5, 3].map((size, index) => {
        const isLead = index === 0;

        return (
          <div
            key={size}
            ref={(element) => {
              segmentsRef.current[index] = element;
            }}
            className="absolute rounded-full transition-opacity duration-150"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: isLead ? color : trailColor,
              boxShadow: isLead ? `0 0 16px ${color}` : "none",
              willChange: "transform",
            }}
          />
        );
      })}
    </div>
  );
}
