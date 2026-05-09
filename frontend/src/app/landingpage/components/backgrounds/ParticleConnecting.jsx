"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

// ─── Configuration ───
const CONFIG = {
    particleCount: 150,
    connectionDist: 150,
    mouseDist: 250,
    gridSpacing: 70,
    bgColor: "#060610",
};

// ─── Helpers ───
const rand = (a, b) => Math.random() * (b - a) + a;
const dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

const TechBackground = ({ isFixed = false }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        let w, h;
        let animId;
        let time = 0;
        const mouse = { x: -9999, y: -9999, active: false };

        // ─── State Arrays ───
        let particles = [];
        const pulses = [];
        const traces = [];
        const flashes = [];
        const dataDots = [];
        const scanLines = [];

        // ─── Resize ───
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            canvas.width = w * devicePixelRatio;
            canvas.height = h * devicePixelRatio;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
            initParticles();
        };

        // ─── Particle Initialization ───
        const initParticles = () => {
            particles = Array.from({ length: CONFIG.particleCount }, () => ({
                x: rand(0, w),
                y: rand(0, h),
                vx: rand(-0.35, 0.35),
                vy: rand(-0.35, 0.35),
                baseRadius: rand(0.8, 2),
                radius: 1,
                hue: rand(170, 240),
                sat: rand(70, 95),
                lit: rand(55, 72),
                opacity: rand(0.35, 0.7),
                pulseSpeed: rand(0.015, 0.04),
                pulseOffset: rand(0, Math.PI * 2),
            }));
        };

        // ─── GSAP: Energy Pulse Rings ───
        const spawnPulse = () => {
            if (!particles.length) return;
            if (document.visibilityState !== "visible") return;
            const src = particles[Math.floor(rand(0, particles.length))];
            const p = { x: src.x, y: src.y, r: 0, opacity: 0.35, hue: src.hue };
            pulses.push(p);
            gsap.to(p, {
                r: rand(120, 250),
                opacity: 0,
                duration: rand(2, 3.5),
                ease: "power2.out",
                onComplete: () => {
                    const i = pulses.indexOf(p);
                    if (i > -1) pulses.splice(i, 1);
                },
            });
        };
        const pulseTimer = setInterval(spawnPulse, 2200);

        // ─── GSAP: Circuit Traces ───
        const spawnTrace = () => {
            if (document.visibilityState !== "visible") return;
            const segs = Math.floor(rand(4, 10));
            const pts = [{ x: rand(0, w), y: rand(0, h) }];
            for (let i = 0; i < segs; i++) {
                const last = pts[pts.length - 1];
                const horiz = i % 2 === 0;
                const d = rand(40, 120);
                const dir = Math.random() > 0.5 ? 1 : -1;
                pts.push({
                    x: horiz
                        ? Math.max(0, Math.min(w, last.x + d * dir))
                        : last.x,
                    y: horiz
                        ? last.y
                        : Math.max(0, Math.min(h, last.y + d * dir)),
                });
            }
            const t = {
                pts,
                progress: 0,
                opacity: 0,
                hue: rand(170, 240),
                glow: 0,
            };
            traces.push(t);
            const tl = gsap.timeline({
                onComplete: () => {
                    const i = traces.indexOf(t);
                    if (i > -1) traces.splice(i, 1);
                },
            });
            tl.to(t, {
                opacity: 0.6,
                glow: 1,
                duration: 0.3,
                ease: "power2.in",
            })
                .to(t, { progress: 1, duration: rand(1.2, 2.5), ease: "none" })
                .to(
                    t,
                    {
                        opacity: 0,
                        glow: 0,
                        duration: 1.2,
                        ease: "power2.inOut",
                    },
                    "-=0.8",
                );
        };
        const traceTimer = setInterval(spawnTrace, 3500);
        setTimeout(spawnTrace, 400);
        setTimeout(spawnTrace, 1200);
        setTimeout(spawnTrace, 2200);

        // ─── GSAP: Node Flashes ───
        const spawnFlash = () => {
            if (document.visibilityState !== "visible") return;
            if (!particles.length) return;
            const src = particles[Math.floor(rand(0, particles.length))];
            const f = { x: src.x, y: src.y, r: 2, opacity: 0.9, hue: src.hue };
            flashes.push(f);
            gsap.to(f, {
                r: rand(18, 35),
                opacity: 0,
                duration: rand(0.7, 1.3),
                ease: "power3.out",
                onComplete: () => {
                    const i = flashes.indexOf(f);
                    if (i > -1) flashes.splice(i, 1);
                },
            });
        };
        const flashTimer = setInterval(spawnFlash, 700);

        // ─── GSAP: Data Flow Dots ───
        const spawnDataDot = () => {
            if (document.visibilityState !== "visible") return;
            if (particles.length < 2) return;
            const idx = Math.floor(rand(0, particles.length));
            let nearest = -1;
            let nearestDist = Infinity;
            for (let j = 0; j < particles.length; j++) {
                if (j === idx) continue;
                const d = dist(
                    particles[idx].x,
                    particles[idx].y,
                    particles[j].x,
                    particles[j].y,
                );
                if (d < CONFIG.connectionDist && d < nearestDist) {
                    nearestDist = d;
                    nearest = j;
                }
            }
            if (nearest < 0) return;
            const dot = {
                from: idx,
                to: nearest,
                t: 0,
                opacity: 0.9,
                hue: particles[idx].hue,
            };
            dataDots.push(dot);
            gsap.to(dot, {
                t: 1,
                duration: rand(0.5, 1),
                ease: "power1.inOut",
                onComplete: () => {
                    const i = dataDots.indexOf(dot);
                    if (i > -1) dataDots.splice(i, 1);
                },
            });
        };
        const dotTimer = setInterval(spawnDataDot, 250);

        // ─── GSAP: Horizontal Scan Lines ───
        const spawnScan = () => {
            if (document.visibilityState !== "visible") return;
            const s = { y: rand(0, h), opacity: 0.12, width: rand(200, 600) };
            const startX = rand(-200, w);
            s.x = startX;
            scanLines.push(s);
            gsap.to(s, {
                x: startX + w + 400,
                opacity: 0,
                duration: rand(2, 4),
                ease: "none",
                onComplete: () => {
                    const i = scanLines.indexOf(s);
                    if (i > -1) scanLines.splice(i, 1);
                },
            });
        };
        const scanTimer = setInterval(spawnScan, 3000);
        setTimeout(spawnScan, 800);

        // ─── Mouse ───
        const _onMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const inside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (inside) {
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
                mouse.active = true;
                return;
            }

            if (mouse.active) {
                onMouseLeave();
            }
        };
        const onMouseLeave = () => {
            mouse.active = false;
            gsap.to(mouse, { x: -9999, y: -9999, duration: 0.6 });
        };
        // window.addEventListener('mousemove', onMouseMove);
        // window.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener("resize", resize);
        resize();

        // ══════════════════════
        // ─── DRAW FUNCTIONS ───
        // ══════════════════════

        const drawAmbientOrbs = () => {
            const orbs = [
                { cx: w * 0.15, cy: h * 0.25, r: 350, hue: 200 },
                { cx: w * 0.85, cy: h * 0.7, r: 300, hue: 260 },
                { cx: w * 0.5, cy: h * 0.5, r: 400, hue: 190 },
                { cx: w * 0.3, cy: h * 0.8, r: 280, hue: 220 },
            ];
            orbs.forEach((o, i) => {
                const ox = o.cx + Math.sin(time * 0.0004 + i * 2) * 60;
                const oy = o.cy + Math.cos(time * 0.0005 + i * 1.5) * 40;
                const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
                g.addColorStop(0, `hsla(${o.hue}, 70%, 35%, 0.07)`);
                g.addColorStop(0.6, `hsla(${o.hue}, 60%, 25%, 0.025)`);
                g.addColorStop(1, "transparent");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(ox, oy, o.r, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        const drawGrid = () => {
            const sp = CONFIG.gridSpacing;
            ctx.lineWidth = 0.3;
            // Vertical
            for (let x = 0; x < w; x += sp) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(56, 189, 248, 0.035)`;
                for (let y = 0; y <= h; y += 6) {
                    const wave =
                        Math.sin(y * 0.005 + time * 0.007 + x * 0.002) * 3;
                    y === 0 ? ctx.moveTo(x + wave, y) : ctx.lineTo(x + wave, y);
                }
                ctx.stroke();
            }
            // Horizontal
            for (let y = 0; y < h; y += sp) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(56, 189, 248, 0.035)`;
                for (let x = 0; x <= w; x += 6) {
                    const wave =
                        Math.sin(x * 0.005 + time * 0.005 + y * 0.002) * 3;
                    x === 0 ? ctx.moveTo(x, y + wave) : ctx.lineTo(x, y + wave);
                }
                ctx.stroke();
            }
            // Intersection dots
            for (let x = 0; x < w; x += sp) {
                for (let y = 0; y < h; y += sp) {
                    const waveX =
                        Math.sin(y * 0.005 + time * 0.007 + x * 0.002) * 3;
                    const waveY =
                        Math.sin(x * 0.005 + time * 0.005 + y * 0.002) * 3;
                    const pulse =
                        Math.sin(time * 0.02 + x * 0.01 + y * 0.01) * 0.5 + 0.5;
                    ctx.fillStyle = `rgba(56, 189, 248, ${0.04 + pulse * 0.04})`;
                    ctx.beginPath();
                    ctx.arc(x + waveX, y + waveY, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        };

        const drawTraces = () => {
            traces.forEach((t) => {
                if (t.pts.length < 2 || t.progress <= 0) return;
                let totalLen = 0;
                const segLens = [];
                for (let i = 1; i < t.pts.length; i++) {
                    const l = dist(
                        t.pts[i].x,
                        t.pts[i].y,
                        t.pts[i - 1].x,
                        t.pts[i - 1].y,
                    );
                    segLens.push(l);
                    totalLen += l;
                }
                const drawLen = totalLen * t.progress;
                let cur = 0;
                let hx = t.pts[0].x,
                    hy = t.pts[0].y;
                ctx.beginPath();
                ctx.moveTo(hx, hy);
                for (let i = 0; i < segLens.length; i++) {
                    if (cur + segLens[i] <= drawLen) {
                        ctx.lineTo(t.pts[i + 1].x, t.pts[i + 1].y);
                        hx = t.pts[i + 1].x;
                        hy = t.pts[i + 1].y;
                        cur += segLens[i];
                    } else {
                        const ratio = (drawLen - cur) / segLens[i];
                        hx = t.pts[i].x + (t.pts[i + 1].x - t.pts[i].x) * ratio;
                        hy = t.pts[i].y + (t.pts[i + 1].y - t.pts[i].y) * ratio;
                        ctx.lineTo(hx, hy);
                        break;
                    }
                }
                ctx.strokeStyle = `hsla(${t.hue}, 85%, 62%, ${t.opacity * 0.8})`;
                ctx.lineWidth = 1.2;
                ctx.shadowColor = `hsla(${t.hue}, 85%, 62%, ${t.opacity * 0.6})`;
                ctx.shadowBlur = 12;
                ctx.stroke();
                ctx.shadowBlur = 0;
                // Head glow
                if (t.glow > 0) {
                    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 15);
                    g.addColorStop(
                        0,
                        `hsla(${t.hue}, 95%, 78%, ${t.glow * 0.7})`,
                    );
                    g.addColorStop(1, "transparent");
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(hx, hy, 15, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Junction dots
                let jLen = 0;
                for (let i = 0; i < segLens.length && jLen < drawLen; i++) {
                    jLen += segLens[i];
                    if (jLen <= drawLen) {
                        ctx.fillStyle = `hsla(${t.hue}, 85%, 75%, ${t.opacity * 0.9})`;
                        ctx.beginPath();
                        ctx.arc(
                            t.pts[i + 1].x,
                            t.pts[i + 1].y,
                            2.5,
                            0,
                            Math.PI * 2,
                        );
                        ctx.fill();
                    }
                }
            });
        };

        const drawPulses = () => {
            pulses.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${p.hue}, 80%, 62%, ${p.opacity})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                // Inner ring
                if (p.r > 20) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
                    ctx.strokeStyle = `hsla(${p.hue}, 80%, 62%, ${p.opacity * 0.3})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            });
        };

        const drawFlashes = () => {
            flashes.forEach((f) => {
                const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
                g.addColorStop(0, `hsla(${f.hue}, 95%, 85%, ${f.opacity})`);
                g.addColorStop(
                    0.3,
                    `hsla(${f.hue}, 85%, 65%, ${f.opacity * 0.4})`,
                );
                g.addColorStop(1, "transparent");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        const drawScanLines = () => {
            scanLines.forEach((s) => {
                const g = ctx.createLinearGradient(
                    s.x,
                    s.y,
                    s.x + s.width,
                    s.y,
                );
                g.addColorStop(0, "transparent");
                g.addColorStop(0.3, `hsla(190, 90%, 65%, ${s.opacity})`);
                g.addColorStop(0.7, `hsla(190, 90%, 65%, ${s.opacity})`);
                g.addColorStop(1, "transparent");
                ctx.strokeStyle = g;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x + s.width, s.y);
                ctx.stroke();
            });
        };

        const updateAndDrawParticles = () => {
            const cd = CONFIG.connectionDist;
            const md = CONFIG.mouseDist;

            // Update
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.radius =
                    p.baseRadius *
                    (1 + Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.3);
                // Mouse attraction
                if (mouse.active) {
                    const d = dist(mouse.x, mouse.y, p.x, p.y);
                    if (d < md && d > 5) {
                        const force = ((md - d) / md) * 0.018;
                        p.vx += ((mouse.x - p.x) / d) * force;
                        p.vy += ((mouse.y - p.y) / d) * force;
                    }
                }
                // Speed limit + damping
                const spd = Math.sqrt(p.vx ** 2 + p.vy ** 2);
                if (spd > 1.5) {
                    p.vx = (p.vx / spd) * 1.5;
                    p.vy = (p.vy / spd) * 1.5;
                }
                p.vx *= 0.997;
                p.vy *= 0.997;
                // Wrap
                if (p.x < -30) p.x = w + 30;
                if (p.x > w + 30) p.x = -30;
                if (p.y < -30) p.y = h + 30;
                if (p.y > h + 30) p.y = -30;
            });

            // Connections between particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const d = dist(
                        particles[i].x,
                        particles[i].y,
                        particles[j].x,
                        particles[j].y,
                    );
                    if (d < cd) {
                        const alpha = (1 - d / cd) * 0.14;
                        const hue = (particles[i].hue + particles[j].hue) / 2;
                        ctx.beginPath();
                        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
                // Mouse connections
                if (mouse.active) {
                    const d = dist(
                        mouse.x,
                        mouse.y,
                        particles[i].x,
                        particles[i].y,
                    );
                    if (d < md) {
                        const alpha = (1 - d / md) * 0.3;
                        ctx.beginPath();
                        ctx.strokeStyle = `hsla(${particles[i].hue}, 90%, 72%, ${alpha})`;
                        ctx.lineWidth = 0.9;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes
            particles.forEach((p) => {
                // Glow
                const g = ctx.createRadialGradient(
                    p.x,
                    p.y,
                    0,
                    p.x,
                    p.y,
                    p.radius * 7,
                );
                g.addColorStop(
                    0,
                    `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${p.opacity * 0.45})`,
                );
                g.addColorStop(1, "transparent");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 7, 0, Math.PI * 2);
                ctx.fill();
                // Core
                ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.lit + 20}%, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // Mouse node glow
            if (mouse.active) {
                const mg = ctx.createRadialGradient(
                    mouse.x,
                    mouse.y,
                    0,
                    mouse.x,
                    mouse.y,
                    30,
                );
                mg.addColorStop(0, "hsla(200, 90%, 70%, 0.2)");
                mg.addColorStop(1, "transparent");
                ctx.fillStyle = mg;
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const drawDataDots = () => {
            dataDots.forEach((dot) => {
                if (dot.from >= particles.length || dot.to >= particles.length)
                    return;
                const a = particles[dot.from];
                const b = particles[dot.to];
                const x = a.x + (b.x - a.x) * dot.t;
                const y = a.y + (b.y - a.y) * dot.t;
                // Trail
                const trailLen = 0.08;
                const tx = a.x + (b.x - a.x) * Math.max(0, dot.t - trailLen);
                const ty = a.y + (b.y - a.y) * Math.max(0, dot.t - trailLen);
                const tg = ctx.createLinearGradient(tx, ty, x, y);
                tg.addColorStop(0, "transparent");
                tg.addColorStop(
                    1,
                    `hsla(${dot.hue}, 90%, 70%, ${dot.opacity * 0.5})`,
                );
                ctx.strokeStyle = tg;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(x, y);
                ctx.stroke();
                // Dot
                const dg = ctx.createRadialGradient(x, y, 0, x, y, 5);
                dg.addColorStop(
                    0,
                    `hsla(${dot.hue}, 95%, 80%, ${dot.opacity})`,
                );
                dg.addColorStop(1, "transparent");
                ctx.fillStyle = dg;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `hsla(${dot.hue}, 95%, 92%, ${dot.opacity})`;
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        const drawVignette = () => {
            const g = ctx.createRadialGradient(
                w / 2,
                h / 2,
                w * 0.25,
                w / 2,
                h / 2,
                w * 0.8,
            );
            g.addColorStop(0, "transparent");
            g.addColorStop(1, "rgba(4, 4, 14, 0.55)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        };

        // ═══════════════════════════════════════════
        // ─── MAIN LOOP ───
        // ═══════════════════════════════════════════
        const animate = () => {
            time++;
            ctx.fillStyle = CONFIG.bgColor;
            ctx.fillRect(0, 0, w, h);

            drawAmbientOrbs();
            drawGrid();
            drawScanLines();
            drawTraces();
            drawPulses();
            drawFlashes();
            updateAndDrawParticles();
            drawDataDots();
            drawVignette();

            animId = requestAnimationFrame(animate);
        };

        animate();

        // ─── Cleanup ───
        return () => {
            cancelAnimationFrame(animId);
            clearInterval(pulseTimer);
            clearInterval(traceTimer);
            clearInterval(flashTimer);
            clearInterval(dotTimer);
            clearInterval(scanTimer);
            // window.removeEventListener('mousemove', onMouseMove);
            // window.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener("resize", resize);
            gsap.globalTimeline.clear();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: isFixed === true ? "fixed" : "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: -1,
                pointerEvents: "none",
            }}
        />
    );
};

export default TechBackground;
