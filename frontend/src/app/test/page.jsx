"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import React, { useRef } from "react";
import Snowfall from "react-snowfall";
import Card from "../landingpage/components/cards/UICard";
import ElectricBorder from "../landingpage/components/Effects/ElectricBorder";
import GradientText from "../landingpage/components/Effects/TextEffects/GradientText";

// import { useDraggable } from 'react-use-draggable-scroll';

const test = () => {
  const container = useRef(null);
  const intro = useRef(null);
  const _containerRef = useRef(null);
  // const { events } = useDraggable(containerRef);

  React.useEffect(() => {
    const handleMouseDown = () => {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    };

    const handleMouseUp = () => {
      document.body.style.userSelect = "auto";
      document.body.style.cursor = "grab";
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const SetupSTs = (offset) => {
    if (window.innerWidth >= 768) {
      ScrollTrigger.create({
        trigger: container.current,
        start: "top top",
        end: `bottom bottom-=${offset}`,
        pin: intro.current,
      });
    }
  };

  const initSTs = () => {
    ScrollTrigger.getAll().forEach((ST) => {
      ST.kill();
    });

    if (intro.current) {
      const introHeight = intro.current.clientHeight;
      const offset = window.innerHeight - introHeight;
      SetupSTs(offset);
    }
  };

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      initSTs();
      ScrollTrigger.addEventListener("refreshInit", initSTs);
    },
    { scope: container },
  );
  return (
    <>
      {/* <div 
      ref={containerRef}
    //   {...events} 
      className="h-96 w-full overflow-y-scroll border border-gray-300"
      style={{ cursor: 'grab' }}
    > */}

      <section
        ref={container}
        className="p-20 mb-50"
        style={{
          marginBottom: "500px",
          // background: 'url(./footer.jfif)',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          // backgroundAttachment: 'fixed'
        }}
      >
        <div className="fixed min-h-[100vh] top-0 left-0 min-w-[100vw]">
          <Snowfall
            color="#eeeeee"
            style={{ zIndex: "-1" }}
            snowflakeCount={100}
          />
          <Snowfall
            color="#eeeeee"
            style={{ zIndex: "200" }}
            snowflakeCount={100}
          />
        </div>
        <div className={`mt-20 z-4`}>
          <div ref={intro} className={``}>
            <ElectricBorder
              color="#6bc1ff"
              hoveredColor="#ffffff"
              chaos={0.1}
              speed={0.4}
            >
              <div
                className="bg-transparent z-[2] backdrop-blur-md border-0 border-[#eee]"
                style={{ borderRadius: "15px" }}
              >
                <div className="flex justify-between py-5 px-3">
                  <div className="text-md font-md">Logo</div>

                  <div className="flex gap-2">
                    <ul className="list-style-none flex gap-2 md:gap-5">
                      <ElectricBorder
                        chaos={0.01}
                        z={2}
                        color="#6bc1ff"
                        className={`hover:bg-[#787afa65]`}
                      >
                        <li>
                          <a
                            href="/"
                            className="px-2 py-1 rounded-md transition-all transition-[0.3]"
                          >
                            Home
                          </a>
                        </li>
                      </ElectricBorder>
                      <li>
                        <a
                          href="/"
                          className="hover:bg-[#787afa65] px-2 py-1 rounded-md transition-all transition-[0.3]"
                        >
                          About
                        </a>
                      </li>
                      <li>
                        <a
                          href="/"
                          className="hover:bg-[#787afa65] px-2 py-1 rounded-md transition-all transition-[0.3]"
                        >
                          Services
                        </a>
                      </li>
                      <li>
                        <a
                          href="/"
                          className="hover:bg-[#787afa65] px-2 py-1 rounded-md transition-all transition-[0.3]"
                        >
                          Contact
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </ElectricBorder>
          </div>

          <div className={`z-[2]`}>
            <GradientText fontSize={50}>Hello World!</GradientText>
          </div>
          <Card />
        </div>
      </section>

      {/* Add your content here */}
      {/* <div style={{ minWidth: '300px', height: '100px', background: 'lightblue', margin: '0 10px' }}>Item 1</div>
      <div style={{ minWidth: '300px', height: '100px', background: 'lightgreen', margin: '0 10px' }}>Item 2</div>
      <div style={{ minWidth: '300px', height: '100px', background: 'lightcoral', margin: '0 10px' }}>Item 3</div>
      <div style={{ minWidth: '300px', height: '100px', background: 'lightyellow', margin: '0 10px' }}>Item 4</div> */}
      {/* </div> */}
    </>
  );
};

export default test;
