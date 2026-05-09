import { LANDING_SECTION_TITLES } from "@/app/landingpage/config/landingContent";
import { CourseCard } from "../../cards/CourseCardLandingPage";
import GradientText from "../../Effects/TextEffects/GradientText";

const WhatWeOffer = () => {
    return (
        <div
            className="
                    flex
                    flex-col
                    justify-center
                    items-center
                    min-h-[80vh]
                    mt-8
                    gap-3
                    px-4
                    pb-8
                    md:min-h-[100vh]
                    md:mt-10
                "
        >
            <GradientText
                colors={["#015294", "#98cafd", "#015294", "#a2d6fc", "#015294"]}
                animationSpeed={8}
                direction="horizontal"
                showBorder={false}
                fontSize="clamp(1.9rem,6.5vw,2.5rem)"
            >
                {LANDING_SECTION_TITLES.whatWeOffer}
            </GradientText>

            <CourseCard />
        </div>
    );
};

export default WhatWeOffer;
