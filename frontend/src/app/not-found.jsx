"use client";

import Button from "./components/ui/button";
import FuzzyText from "./landingpage/components/Effects/TextEffects/FuzzyText";
import "./styles/Button/ButtonBGWidth.css";

const NotFound = () => {
  return (
    <div className="flex h-100 gap-1 flex-col items-center justify-center">
      <div className="flex flex-col gap-15 items-center justify-center h-full">
        <FuzzyText baseIntensity={0.2} hoverIntensity={0.5} enableHover>
          Error 404:
        </FuzzyText>
        <FuzzyText baseIntensity={0.2} hoverIntensity={0.5} enableHover>
          Page Not Found
        </FuzzyText>
      </div>

      <div className="text-md text-[#eee] text-center flex flex-col justify-center items-center">
        <div className="flex text-center items-center justify-center ">
          <p className="text-[30px] font-md">Go Back to Home:</p>
          <a href="/">
            <Button
              variant="primary"
              size="md"
              className="button overflow-hidden focus:outline-none focus:ring-0"
            >
              Go Home
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
