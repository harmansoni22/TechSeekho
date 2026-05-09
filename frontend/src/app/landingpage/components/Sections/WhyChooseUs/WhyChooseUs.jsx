"use client";

import { useEffect, useState } from "react";
import {
    LANDING_SECTION_TITLES,
    WHY_CHOOSE_US_ITEMS,
} from "@/app/landingpage/config/landingContent";
import BorderGlow from "../../Effects/BorderGlow";
import ParallaxSpeed from "../../Effects/ParallaxSpeed";
import SpotlightCard from "../../Effects/SpotlightCard";
import GradientText from "../../Effects/TextEffects/GradientText";

const WhyChooseUs = () => {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 1024px)");

        const handleResize = () => {
            setIsDesktop(mediaQuery.matches);
        };

        handleResize();
        mediaQuery.addEventListener("change", handleResize);

        return () => {
            mediaQuery.removeEventListener("change", handleResize);
        };
    }, []);

    const content = (
        <div
            className="
                relative
                z-1
                flex 
                min-h-[100vh]
                w-full
                flex-col 
                items-center
                justify-center 
                gap-8
                px-4
                py-12
                md:gap-10
            "
        >
            <GradientText
                colors={["#52f6ff", "#fafafa", "#52f6ff"]}
                fontSize="clamp(1.9rem,6.5vw,2.8rem)"
                direction="horizontal"
                animationSpeed={8}
                pauseOnHover={true}
            >
                {LANDING_SECTION_TITLES.whyChooseUs}
            </GradientText>

            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 justify-items-center sm:grid-cols-2 md:px-2 lg:grid-cols-3">
                {WHY_CHOOSE_US_ITEMS.map((data) => {
                    return (
                        <BorderGlow
                            key={data.heading}
                            colors={["#feaa18", "#3046f1", "#8030f1"]}
                            glowRadius={0.002}
                            className="
                  					flex 
                  					min-h-[220px]
                  					flex-col 
                  					gap-3
                  					bg-transparent
                  					p-5
                  					select-none
                  					shadow-[0_0_3px_rgba(255,255,255,0.5)] 
                  					backdrop-blur-[10px]
                  					backdrop-brightness-[0.859]
                  					sm:min-h-[250px]
                  					sm:p-8
                				"
                        >
                                <GradientText
                                    colors={["#7de3ff", "#ffffff", "#7de3ff"]}
                                    z={0}
                                    animationSpeed={8}
                                    showBorder={false}
                                    direction="horizontal"
                                    className="font-bold text-md"
                                    fontSize="clamp(1.1rem,4vw,1.55rem)"
                                    pauseOnHover={false}
                                >
                                    {data.heading}
                                </GradientText>

                                <p
                                    className="
                                        text-sm
                                        text-justify
                                        text-white/90
                                        sm:text-base
                                    "
                                >
                                    {data.content}
                                </p>
                        </BorderGlow>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            {isDesktop ? (
                <ParallaxSpeed speed={0.02}>{content}</ParallaxSpeed>
            ) : (
                content
            )}
        </>
    );
};

export default WhyChooseUs;
