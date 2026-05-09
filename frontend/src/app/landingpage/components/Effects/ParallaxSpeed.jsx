"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

export default function ParallaxSpeed({ children, bgImage, speed = 0.5 }) {
    const containerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.002,
    });

    // const y = useTransform(smoothProgress, [0, 1], [`-${speed * 100}%`, `${speed * 100}%`])
    const yBg = useTransform(
        smoothProgress,
        [0, 1],
        [`-${speed * 50}%`, `${speed * 50}%`],
    );
    const yContent = useTransform(smoothProgress, [0, 1], ["20%", "-20%"]);

    return (
        <section
            ref={containerRef}
            style={{
                position: "relative",
                height: "100vh",
                width: "100%",
                overflow: "hidden", // Hides the background "bleed"
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Background Layer */}
            <motion.div
                style={{
                    yBg,
                    position: "absolute",
                    top: "-20%", // Bleed allows room for the image to move without gaps
                    left: 0,
                    height: "140%", // Taller than container to cover the movement range
                    width: "100%",
                    zIndex: -1,
                    filter: "blur(5px) brightness(80%)",
                }}
            >
                <Image
                    src={`${bgImage ? bgImage : "/"}`}
                    alt="Parallax Background"
                    fill
                    style={{ objectFit: "cover" }}
                    priority // High priority for hero-style sections
                />
            </motion.div>

            {/* Foreground Content */}
            <motion.div
                style={{ y: yContent, position: "relative", zIndex: 10 }}
            >
                {children}
            </motion.div>
        </section>
    );
}
