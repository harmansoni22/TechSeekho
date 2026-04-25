import CustomScroll from "../../components/CustomScrollBar";
import AboutShowcase from "./AboutShowcase";

export const metadata = {
  title: "About",
  description:
    "Learn about TechSeekho's mission, teaching style, and learner outcomes.",
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
