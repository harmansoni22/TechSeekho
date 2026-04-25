import { Suspense } from "react";
import LenisProvider from "./components/LenisProvider";
import Footer from "./components/layout/Footer/Footer";
import Navbar from "./components/layout/Navigation/Navbar";

export const metadata = {
  title: {
    default: "Learn Tech Skills",
    template: "%s | TechSeekho",
  },
  description:
    "Explore TechSeekho courses, mentorship programs, and practical learning paths in web development and AI.",
};

const Layout = ({ children }) => {
  return (
    <div className="relative isolate min-h-screen flex flex-col bg-transparent">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      {/* <CustomCursor /> */}
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
