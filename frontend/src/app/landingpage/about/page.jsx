import CustomScroll from "../components/CustomScrollBar";
import AboutShowcase from "./AboutShowcase";

export const metadata = {
    title: "About | Techseekho",
    description:
        "Learn about Techseekho's mission to empower school students with AI, Robotics, Drone Technology, and future skills across Madhya Pradesh.",
};

const AboutUs = () => {
    return (
        <>
            <CustomScroll />
            <AboutShowcase />
        </>
    );
};

export default AboutUs;
