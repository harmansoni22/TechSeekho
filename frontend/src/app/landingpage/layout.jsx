import { Suspense } from "react";
import LenisProvider from "./components/LenisProvider";
import Footer from "./components/layout/Footer/Footer";
import Navbar from "./components/layout/Navigation/Navbar";
import CustomCursor from "./components/CustomCursor";

export const metadata = {
    title: {
        default: "MP's #1 Future Skills Platform",
        template: "%s | Techseekho",
    },
    description:
        "Techseekho empowers school students with AI, Robotics, Drone Technology, IoT, Coding and future skills across Madhya Pradesh. Ages 10-18.",
};

const Layout = ({ children }) => {
    return (
        <div className="relative isolate min-h-screen flex flex-col bg-transparent">
            <Suspense fallback={null}>
                <Navbar />
            </Suspense>
            {/* <CustomCursor SPLAT_RADIUS={0.075} BLEND_MODE="difference" /> */}
            <main id="landing-scroll-content" className="flex-1">
                <Suspense fallback={<h1>Loading...</h1>}>
                    <LenisProvider>{children}</LenisProvider>
                </Suspense>
            </main>
            {/* <GradualBlur
                target="parent"
                position="bottom"
                height="7rem"
                strength={2}
                divCount={5}
                curve="bezier"
                exponential
                opacity={1}
            /> */}
            <Footer />
        </div>
    );
};

export default Layout;
