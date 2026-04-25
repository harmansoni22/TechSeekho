"use client";

import { useCallback, useEffect, useRef } from "react";

const HOVER_SWEEP_DURATION = 0.65;
const HOVER_START_DRIFT_SPEED = 0.08;

function normalizeProgress(value) {
  const normalized = value % 1;
  return normalized < 0 ? normalized + 1 : normalized;
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;

  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const int = parseInt(h, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ElectricBorder = ({
  children,
  color = "#5227ff",
  speed = 1,
  chaos = 0.12,
  borderRadius = 24,
  className,
  style,
  hoveredColor = "#5227ff",
  z = 0,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const timeref = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const isHoveredRef = useRef(false);
  const hoverProgressRef = useRef(0);
  const hoverStartProgressRef = useRef(0);

  const random = useCallback((x) => {
    return (Math.sin(x * 12.9898) * 43758.5453) % 1;
  }, []);

  const noise2D = useCallback(
    (x, y) => {
      const i = Math.floor(x);
      const j = Math.floor(y);
      const fx = x - i;
      const fy = y - j;

      const a = random(i + j * 57);
      const b = random(i + 1 + j * 57);
      const c = random(i + (j + 1) * 57);
      const d = random(i + 1 + (j + 1) * 57);

      const ux = fx * fx * (3.0 - 2.0 * fx);
      const uy = fy * fy * (3.0 - 2.0 * fy);

      return (
        a * (1 - ux) * (1 - uy) +
        b * ux * (1 - uy) +
        c * (1 - ux) * uy +
        d * ux * uy
      );
    },
    [random],
  );

  const octavedNoise = useCallback(
    (
      x,
      octaves,
      lacunarity,
      gain,
      baseAmplitude,
      baseFrequency,
      time,
      seed,
      baseFlatness,
    ) => {
      let y = 0;
      let amplitude = baseAmplitude;
      let frequency = baseFrequency;

      for (let i = 0; i < octaves; i++) {
        let octaveAmplitude = amplitude;

        if (i === 0) {
          octaveAmplitude *= baseFlatness;
        }

        y +=
          octaveAmplitude *
          noise2D(frequency * x + seed * 100, time * frequency * 0.3);
        frequency *= lacunarity;
        amplitude *= gain;
      }

      return y;
    },
    [noise2D],
  );

  const getCornerPoint = useCallback(
    (centerX, centerY, radius, startAngle, arcLength, progress) => {
      const angle = startAngle + progress * arcLength;

      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    },
    [],
  );

  const getRoundedRectPoint = useCallback(
    (t, left, top, width, height, radius) => {
      const straightWidth = width - 2 * radius;
      const straightHeight = height - 2 * radius;

      const cornerArc = (Math.PI * radius) / 2;

      const totalPerimeter =
        2 * straightWidth + 2 * straightHeight + 4 * cornerArc;

      const distance = t * totalPerimeter;

      let accumulated = 0;

      if (distance <= accumulated + straightWidth) {
        const progress = (distance - accumulated) / straightWidth;

        return { x: left + radius + progress * straightWidth, y: top };
      }

      accumulated += straightWidth;

      if (distance <= accumulated + cornerArc) {
        const progress = (distance - accumulated) / cornerArc;

        return getCornerPoint(
          left + width - radius,
          top + radius,
          radius,
          -Math.PI / 2,
          Math.PI / 2,
          progress,
        );
      }

      accumulated += cornerArc;

      if (distance <= accumulated + straightHeight) {
        const progress = (distance - accumulated) / straightHeight;

        return { x: left + width, y: top + radius + progress * straightHeight };
      }

      accumulated += straightHeight;

      if (distance <= accumulated + cornerArc) {
        const progress = (distance - accumulated) / cornerArc;

        return getCornerPoint(
          left + width - radius,
          top + height - radius,
          radius,
          0,
          Math.PI / 2,
          progress,
        );
      }

      accumulated += cornerArc;

      if (distance <= accumulated + straightWidth) {
        const progress = (distance - accumulated) / straightWidth;
        return {
          x: left + width - radius - progress * straightWidth,
          y: top + height,
        };
      }
      accumulated += straightWidth;

      if (distance <= accumulated + cornerArc) {
        const progress = (distance - accumulated) / cornerArc;
        return getCornerPoint(
          left + radius,
          top + height - radius,
          radius,
          Math.PI / 2,
          Math.PI / 2,
          progress,
        );
      }
      accumulated += cornerArc;

      if (distance <= accumulated + straightHeight) {
        const progress = (distance - accumulated) / straightHeight;

        return {
          x: left,
          y: top + height - radius - progress * straightHeight,
        };
      }

      accumulated += straightHeight;

      const progress = (distance - accumulated) / cornerArc;

      return getCornerPoint(
        left + radius,
        top + radius,
        radius,
        Math.PI,
        Math.PI / 2,
        progress,
      );
    },
    [getCornerPoint],
  );

  const getNearestPerimeterProgress = useCallback(
    (x, y, left, top, width, height, radius) => {
      const sampleCount = 240;
      let nearestProgress = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < sampleCount; i++) {
        const progress = i / sampleCount;
        const point = getRoundedRectPoint(
          progress,
          left,
          top,
          width,
          height,
          radius,
        );

        const dx = point.x - x;
        const dy = point.y - y;
        const distance = dx * dx + dy * dy;

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestProgress = progress;
        }
      }

      return nearestProgress;
    },
    [getRoundedRectPoint],
  );

  const updateHoverOrigin = useCallback(
    (event) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const borderWidth = rect.width;
      const borderHeight = rect.height;
      const maxRadius = Math.min(borderWidth, borderHeight) / 2;
      const radius = Math.min(borderRadius, maxRadius);

      const localX =
        typeof event?.clientX === "number"
          ? event.clientX - rect.left
          : borderWidth / 2;
      const localY =
        typeof event?.clientY === "number" ? event.clientY - rect.top : 0;

      hoverStartProgressRef.current = getNearestPerimeterProgress(
        localX,
        localY,
        0,
        0,
        borderWidth,
        borderHeight,
        radius,
      );
    },
    [borderRadius, getNearestPerimeterProgress],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const octaves = 10;
    const lacunarity = 1.6;
    const gain = 0.7;
    const amplitude = chaos;
    const frequency = 10;
    const baseFlatness = 0;
    const displacement = 40;
    const borderOffset = 60;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width + borderOffset * 2;
      const height = rect.height + borderOffset * 2;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      return { width, height };
    };

    let { width, height } = updateSize();

    const drawElectricBorder = (currentTime) => {
      if (!canvas || !ctx) return;

      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
      timeref.current += deltaTime * speed;
      lastFrameTimeRef.current = currentTime;

      const hoverDirection = isHoveredRef.current ? 1 : -1;
      const nextHoverProgress =
        hoverProgressRef.current +
        hoverDirection * (deltaTime / HOVER_SWEEP_DURATION);
      hoverProgressRef.current = Math.min(1, Math.max(0, nextHoverProgress));

      const dpr = Math.min(devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const scale = displacement;
      const left = borderOffset;
      const top = borderOffset;
      const borderWidth = width - 2 * borderOffset;
      const borderHeight = height - 2 * borderOffset;
      const maxRadius = Math.min(borderWidth, borderHeight) / 2;
      const radius = Math.min(borderRadius, maxRadius);

      const approximatePerimeter =
        2 * (borderWidth + borderHeight) + 2 * Math.PI * radius;
      const sampleCount = Math.floor(approximatePerimeter / 2);

      const getDisplacedPoint = (progress) => {
        const point = getRoundedRectPoint(
          normalizeProgress(progress),
          left,
          top,
          borderWidth,
          borderHeight,
          radius,
        );

        const xNoise = octavedNoise(
          progress * 8,
          octaves,
          lacunarity,
          gain,
          amplitude,
          frequency,
          timeref.current,
          0,
          baseFlatness,
        );

        const yNoise = octavedNoise(
          progress * 8,
          octaves,
          lacunarity,
          gain,
          amplitude,
          frequency,
          timeref.current,
          1,
          baseFlatness,
        );

        return {
          x: point.x + xNoise * scale,
          y: point.y + yNoise * scale,
        };
      };

      const strokeSegment = (
        startProgress,
        segmentLength,
        strokeColor,
        { lineWidth = 1, shadowBlur = 0, opacity = 1, closePath = false } = {},
      ) => {
        const clampedLength = Math.min(1, Math.max(0, segmentLength));
        if (clampedLength <= 0) return;

        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = opacity;

        if (shadowBlur > 0) {
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = shadowBlur;
        }

        ctx.beginPath();

        if (closePath || clampedLength >= 0.999) {
          for (let i = 0; i <= sampleCount; i++) {
            const point = getDisplacedPoint(i / sampleCount);

            if (i === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          }

          ctx.closePath();
        } else {
          const segmentSamples = Math.max(
            12,
            Math.ceil(sampleCount * clampedLength),
          );

          for (let i = 0; i <= segmentSamples; i++) {
            const progress =
              startProgress + (clampedLength * i) / segmentSamples;
            const point = getDisplacedPoint(progress);

            if (i === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          }
        }

        ctx.stroke();
        ctx.restore();
      };

      strokeSegment(0, 1, color, {
        lineWidth: 1,
        shadowBlur: 10,
        opacity: 0.85,
        closePath: true,
      });

      const hoverSweep = hoverProgressRef.current;
      const hoverStart = normalizeProgress(
        hoverStartProgressRef.current +
          timeref.current * HOVER_START_DRIFT_SPEED,
      );

      if (hoverSweep > 0) {
        strokeSegment(hoverStart, hoverSweep, hoveredColor, {
          lineWidth: 1.2,
          shadowBlur: 14,
          opacity: 1,
        });
        strokeSegment(hoverStart, hoverSweep, hoveredColor, {
          lineWidth: 2,
          shadowBlur: 28,
          opacity: 0.32,
        });

        const headPoint = getDisplacedPoint(hoverStart + hoverSweep);
        ctx.save();
        ctx.fillStyle = hoveredColor;
        ctx.shadowColor = hoveredColor;
        ctx.shadowBlur = 22;
        ctx.globalAlpha = Math.max(0.45, hoverSweep);
        ctx.beginPath();
        ctx.arc(headPoint.x, headPoint.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(drawElectricBorder);
    };

    const resizeObserver = new ResizeObserver(() => {
      const newSize = updateSize();

      width = newSize.width;
      height = newSize.height;
    });

    resizeObserver.observe(container);

    animationRef.current = requestAnimationFrame(drawElectricBorder);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [
    color,
    hoveredColor,
    speed,
    chaos,
    borderRadius,
    octavedNoise,
    getRoundedRectPoint,
  ]);

  const _handleMouseEnter = useCallback(
    (event) => {
      hoverProgressRef.current = 0;
      updateHoverOrigin(event);
      isHoveredRef.current = true;
    },
    [updateHoverOrigin],
  );

  const _handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
  }, []);

  const _handleFocus = useCallback(() => {
    hoverProgressRef.current = 0;
    updateHoverOrigin();
    isHoveredRef.current = true;
  }, [updateHoverOrigin]);

  const _handleBlur = useCallback(() => {
    isHoveredRef.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-visible isolate bg-transparent p-0 text-left ${className ?? ""}`}
      style={{
        "--electric-border-color": color,
        borderRadius,
        ...style,
      }}
    >
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[${z}]`}
      >
        <canvas ref={canvasRef} className="block" />
      </div>

      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-0">
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            border: `1px solid ${hexToRgba(color, 0.55)}`,
            filter: "blur(1px)",
          }}
        />
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-[1] scale-110 opacity-30"
          style={{
            filter: "blur(32px)",
            background: `linear-gradient(-30deg, ${color}, transparent, ${color})`,
          }}
        />
      </div>

      <div className="relative rounded-[inherit] z-[0]">{children}</div>
    </div>
  );
};

export default ElectricBorder;
