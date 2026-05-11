"use client";

import ScrollTrigger from "gsap/ScrollTrigger";
import { Suspense, useEffect, useRef, useState } from "react";
import AIAssistantPopup from "./components/AIAssistantPopup";
import CustomScroll from "./components/CustomScrollBar";
import CallToAction from "./components/Sections/CallToAction/CallToAction";
import HeroSection from "./components/Sections/HeroSection/HeroSection";
import Testimonial from "./components/Sections/Testimonials/Testimonials";
import WhatWeOffer from "./components/Sections/WhatWeOffer/WhatWeOffer";
import WhyChooseUs from "./components/Sections/WhyChooseUs/WhyChooseUs";
import useHorizontalScrollTrack from "./hooks/useHorizontalScrollTrack";

function LandingPageContent() {
    const wrapperRef = useRef(null);
    const trackRef = useRef(null);
    const [isDesktopLayout, setIsDesktopLayout] = useState(false);

    useHorizontalScrollTrack({
        wrapperRef,
        trackRef,
        onMeasure: ScrollTrigger.refresh,
        enabled: isDesktopLayout,
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 1023px)");

        const handleLayoutMode = () => {
            setIsDesktopLayout(mediaQuery.matches);
        };

        handleLayoutMode();
        mediaQuery.addEventListener("change", handleLayoutMode);

        return () => {
            mediaQuery.removeEventListener("change", handleLayoutMode);
        };
    }, []);

    return (
        <>
            <CustomScroll />
            <HeroSection />
            {isDesktopLayout ? (
                <div ref={wrapperRef} className="relative">
                    <div className="sticky top-0 h-screen overflow-hidden">
                        <div
                            ref={trackRef}
                            className="flex h-screen w-max flex-nowrap"
                        >
                            <section className="w-screen h-screen shrink-0">
                                <WhyChooseUs />
                            </section>
                            <section className="w-screen h-screen shrink-0">
                                <WhatWeOffer />
                            </section>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <WhyChooseUs />
                    <WhatWeOffer />
                </>
            )}
            <Testimonial />
            <CallToAction />
            <AIAssistantPopup />
        </>
    );
}

export default function LandingPage() {
    return (
        <Suspense fallback={<h1>Loading...</h1>}>
            <LandingPageContent />
        </Suspense>
    );
}
