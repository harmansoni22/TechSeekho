"use client";

import { useEffect, useRef } from "react";

class PerlinNoise {
    constructor() {
        this.permutation = [];

        for (let i = 0; i < 256; i++) {
            this.permutation[i] = Math.floor(Math.random() * 256);
        }

        this.p = [...this.permutation, ...this.permutation];
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;

        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y, z = 0) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A = this.p[X] + Y;
        const AA = this.p[A] + Z;
        const AB = this.p[A + 1] + Z;

        const B = this.p[X + 1] + Y;
        const BA = this.p[B] + Z;
        const BB = this.p[B + 1] + Z;

        return this.lerp(
            this.lerp(
                this.lerp(
                    this.grad(this.p[AA], x, y, z),
                    this.grad(this.p[BA], x - 1, y, z),
                    u,
                ),

                this.lerp(
                    this.grad(this.p[AB], x, y - 1, z),
                    this.grad(this.p[BB], x - 1, y - 1, z),
                    u,
                ),
                v,
            ),

            this.lerp(
                this.lerp(
                    this.grad(this.p[AA + 1], x, y, z - 1),
                    this.grad(this.p[BA + 1], x - 1, y, z - 1),
                    u,
                ),

                this.lerp(
                    this.grad(this.p[AB + 1], x, y - 1, z - 1),
                    this.grad(this.p[BB + 1], x - 1, y - 1, z - 1),
                    u,
                ),
                v,
            ),
            w,
        );
    }

    fbm(x, y, z, octaves = 4, lacunarity = 2, persistence = 0.5) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value +=
                amplitude *
                this.noise(x * frequency, y * frequency, z * frequency);
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return value / maxValue;
    }
}

class Particle {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.reset();
        this.history = [];
        this.maxHistory = 40;
    }

    reset() {
        this.x = Math.random() * this.width;
        this.y = Math.random() * this.height;
        this.speed = Math.random() * 1.5 + 0.5;
        this.life = Math.random() * 200 + 100;
        this.maxLife = this.life;
        this.history = [];
    }

    update(angle, turbulence) {
        this.history.push({ x: this.x, y: this.y });

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        const adjustedAngle = angle + turbulence * 0.5;
        this.x += Math.cos(adjustedAngle) * this.speed;
        this.y += Math.sin(adjustedAngle) * this.speed;

        this.life--;

        if (
            this.x < 0 ||
            this.x > this.width ||
            this.y < 0 ||
            this.y > this.height ||
            this.life < 0
        ) {
            this.reset();
        }
    }
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const FlowField = () => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!canvas || !ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const perlin = new PerlinNoise();
        const particleCount = 400;
        let particles = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(width, height));
        }

        const scale = 0.003;
        let time = 0;
        const timeSpeed = 0.002;

        const colorPalette = [
            { h: 0.55, s: 0.8, l: 0.5 },
            { h: 0.65, s: 0.9, l: 0.5 },
            { h: 0.75, s: 0.85, l: 0.55 },
            { h: 0.85, s: 0.8, l: 0.5 },
            { h: 0.95, s: 0.75, l: 0.55 },
        ];

        function getColor(noiseValue, alpha) {
            const normalizedNoise = (noiseValue + 1) / 2;
            const index = normalizedNoise * (colorPalette.length - 1);
            const i1 = Math.floor(index);
            const i2 = Math.min(i1 + 1, colorPalette.length - 1);
            const t = index - i1;

            const h =
                colorPalette[i1].h +
                t * (colorPalette[i2].h - colorPalette[i1].h);
            const s =
                colorPalette[i1].s +
                t * (colorPalette[i2].s - colorPalette[i1].s);
            const l =
                colorPalette[i1].l +
                t * (colorPalette[i2].l - colorPalette[i1].l);

            const [r, g, b] = hslToRgb(h, s, l);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        function animate() {
            ctx.fillStyle = "rgba(10, 10, 20, 0.03)";
            ctx.fillRect(0, 0, width, height);

            time += timeSpeed;

            for (const particle of particles) {
                const noiseX = particle.x * scale;
                const noiseY = particle.y * scale;

                const angle =
                    perlin.fbm(noiseX, noiseY, time, 4, 2, 0.5) * Math.PI * 4;

                const turbulence = perlin.fbm(
                    noiseX * 2,
                    noiseY * 2,
                    time * 1.5,
                    3,
                    2.5,
                    0.6,
                );

                particle.update(angle, turbulence);

                if (particle.history.length > 1) {
                    const lifeRatio = particle.life / particle.maxLife;
                    const colorNoise = perlin.noise(
                        particle.x * 0.005,
                        particle.y * 0.005,
                        time * 0.5,
                    );

                    ctx.beginPath();
                    ctx.moveTo(particle.history[0].x, particle.history[0].y);

                    for (let i = 1; i < particle.history.length; i++) {
                        ctx.lineTo(
                            particle.history[i].x,
                            particle.history[i].y,
                        );
                    }
                    ctx.lineTo(particle.x, particle.y);

                    const alpha = ((i) => {
                        const historyRatio = i / particle.maxHistory;
                        return historyRatio * lifeRatio * 0.6;
                    })(particle.history.length);

                    ctx.strokeStyle = getColor(colorNoise, alpha);
                    ctx.lineWidth = lifeRatio * 1.5 + 0.5;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.stroke();
                }

                const headAlpha = (particle.life / particle.maxLife) * 0.8;
                const headColorNoise = perlin.noise(
                    particle.x * 0.005,
                    particle.y * 0.005,
                    time * 0.5,
                );

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = getColor(headColorNoise, headAlpha);
                ctx.fill();
            }

            animationRef.current = requestAnimationFrame(animate);
        }

        ctx.fillStyle = "rgb(10, 10, 20)";
        ctx.fillRect(0, 0, width, height);

        animate();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            ctx.fillStyle = "rgb(10, 10, 20)";
            ctx.fillRect(0, 0, width, height);

            particles = particles.map(() => new Particle(width, height));
        };

        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute pointer-events-none z-[-1] inset-0 w-full h-full"
            style={{
                background: "rgb(10, 10, 20)",
                filter: "blur(2px)",
            }}
        />
    );
};

export default FlowField;
