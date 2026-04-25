"use client";

import { useEffect } from "react";

export default function useHorizontalScrollTrack({
  wrapperRef,
  trackRef,
  onMeasure,
  enabled = true,
}) {
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const track = trackRef.current;

    if (!enabled) {
      if (wrapper) wrapper.style.height = "";
      if (track) track.style.transform = "";
      return;
    }

    if (!wrapper || !track) return;

    let maxX = 0;
    let rafId = 0;

    const measure = () => {
      maxX = Math.max(0, track.scrollWidth - window.innerWidth);
      wrapper.style.height = `${maxX + window.innerHeight}px`;

      if (typeof onMeasure === "function") {
        requestAnimationFrame(() => onMeasure());
      }
    };

    const render = () => {
      const y = window.scrollY - wrapper.offsetTop;
      const x = Math.max(0, Math.min(y, maxX));
      track.style.transform = `translate3d(${-x}px,0,0)`;
      rafId = 0;
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    };

    measure();
    render();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [enabled, onMeasure, trackRef, wrapperRef]);
}
