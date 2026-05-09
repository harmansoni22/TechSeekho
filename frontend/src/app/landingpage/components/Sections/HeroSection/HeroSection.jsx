"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TechBackground from "../../backgrounds/ParticleConnecting";
import { HERO_CONTENT } from "@/app/landingpage/config/landingContent";
import CustomCursor from "../../CustomCursor";
import ElectricBorder from "../../Effects/ElectricBorder";
import GradientText from "../../Effects/TextEffects/GradientText";

const HeroSection = () => {
    const [showTechBackground, setShowTechBackground] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 768px)");

        const handleBackgroundVisibility = () => {
            setShowTechBackground(mediaQuery.matches);
        };

        handleBackgroundVisibility();
        mediaQuery.addEventListener("change", handleBackgroundVisibility);

        return () => {
            mediaQuery.removeEventListener(
                "change",
                handleBackgroundVisibility,
            );
        };
    }, []);

    return (
        <>
            <CustomCursor type="none" />
            <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-14">
                {showTechBackground && <TechBackground isFixed={false} />}
                <div className="flex max-w-5xl flex-col items-center justify-center text-center">
                    <div className="flex flex-col items-center justify-center">
                        <GradientText
                            colors={[
                                "#015294",
                                "#98cafd",
                                "#015294",
                                "#a2d6fc",
                                "#015294",
                            ]}
                            animationSpeed={8}
                            showBorder={false}
                            direction="horizontal"
                            className="font-bold italic"
                            fontSize="clamp(2rem,7.5vw,3.75rem)"
                            pauseOnHover={true}
                        >
                            {HERO_CONTENT.title}
                        </GradientText>
                    </div>
                    <div className="mt-5 flex flex-col items-center justify-center gap-5">
                        <p className="max-w-2xl text-sm text-white/85 sm:text-base md:text-lg">
                            {HERO_CONTENT.subtitle}
                        </p>
                        <div className="cta">
                            <Link href="/signup">
                                <ElectricBorder
                                    chaos={0.04}
                                    color="#015294"
                                    hoveredColor="#f1f1f1"
                                    className="
                    					cursor-pointer
                    					px-4
                    					py-2.5
                    					backdrop-blur-sm
                    					sm:px-4
                    					sm:py-3
                					"
                                >
                                    <span className="cursor-pointer px-4 text-sm sm:text-base">
                                        {HERO_CONTENT.ctaLabel}
                                    </span>
                                </ElectricBorder>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HeroSection;
