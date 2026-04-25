"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { TESTIMONIALS_CONTENT } from "@/app/landingpage/config/landingContent";
import GradientText from "../../Effects/TextEffects/GradientText";

const Testimonial = () => {
  const sliderRef = useRef(null);
  const momentumTweenRef = useRef(null);
  const metricsRef = useRef({
    origin: 0,
    cardWidth: 0,
    cardSpan: 0,
  });
  const scrollRafRef = useRef(null);
  const velocityRef = useRef({
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });
  const [visibleDotIndexes, setVisibleDotIndexes] = useState([0]);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
  });

  const measureSliderMetrics = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const firstCard = slider.querySelector("[data-testimonial-card]");
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    const styles = window.getComputedStyle(slider);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const cardSpan = cardWidth + gap;
    const origin = firstCard.offsetLeft;

    metricsRef.current = {
      origin,
      cardWidth,
      cardSpan,
    };
  }, []);

  const getTargetScrollForIndex = (index) => {
    const slider = sliderRef.current;
    if (!slider) return 0;

    const count = TESTIMONIALS_CONTENT.items.length;
    const boundedIndex = Math.max(0, Math.min(count - 1, index));
    const { origin, cardWidth, cardSpan } = metricsRef.current;
    if (!cardWidth || !cardSpan) return 0;

    const target =
      origin + boundedIndex * cardSpan - (slider.clientWidth - cardWidth) / 2;
    const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
    return Math.max(0, Math.min(maxScroll, target));
  };

  const updateVisibleDotIndexes = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const { origin, cardWidth, cardSpan } = metricsRef.current;
    const count = TESTIMONIALS_CONTENT.items.length;
    if (!cardWidth || !cardSpan || !count) return;

    const viewportLeft = slider.scrollLeft;
    const viewportRight = viewportLeft + slider.clientWidth;
    const firstCenterVisible = Math.max(
      0,
      Math.ceil((viewportLeft - (origin + cardWidth / 2)) / cardSpan),
    );
    const lastCenterVisible = Math.min(
      count - 1,
      Math.floor((viewportRight - (origin + cardWidth / 2)) / cardSpan),
    );

    const nextVisibleIndexes = [];
    for (let i = firstCenterVisible; i <= lastCenterVisible; i += 1) {
      nextVisibleIndexes.push(i);
    }

    if (!nextVisibleIndexes.length) {
      const centerIndex = Math.round(
        (viewportLeft + slider.clientWidth / 2 - (origin + cardWidth / 2)) /
          cardSpan,
      );
      nextVisibleIndexes.push(Math.max(0, Math.min(count - 1, centerIndex)));
    }

    setVisibleDotIndexes((prev) => {
      if (
        prev.length === nextVisibleIndexes.length &&
        prev.every((value, idx) => value === nextVisibleIndexes[idx])
      ) {
        return prev;
      }
      return nextVisibleIndexes;
    });
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    measureSliderMetrics();
    updateVisibleDotIndexes();

    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        updateVisibleDotIndexes();
      });
    };

    const onResize = () => {
      measureSliderMetrics();
      onScroll();
    };

    slider.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      slider.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
      momentumTweenRef.current?.kill();
      gsap.killTweensOf(slider);
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("cursor");
    };
  }, [measureSliderMetrics, updateVisibleDotIndexes]);

  const setSnapMode = (mode) => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.style.scrollSnapType = mode;
  };

  const snapToNearestCard = () => {
    const slider = sliderRef.current;
    if (!slider) return;
    const { origin, cardWidth, cardSpan } = metricsRef.current;
    if (!cardWidth || !cardSpan) return;

    const centerIndex = Math.round(
      (slider.scrollLeft + slider.clientWidth / 2 - (origin + cardWidth / 2)) /
        cardSpan,
    );
    const targetScroll = getTargetScrollForIndex(centerIndex);

    setSnapMode("none");
    gsap.to(slider, {
      scrollLeft: targetScroll,
      duration: 0.34,
      ease: "power3.out",
      onComplete: () => setSnapMode("x proximity"),
    });
  };

  const stopDragging = () => {
    const slider = sliderRef.current;
    const dragState = dragStateRef.current;

    if (!dragState.active) return;

    if (
      slider &&
      dragState.pointerId !== null &&
      slider.hasPointerCapture?.(dragState.pointerId)
    ) {
      slider.releasePointerCapture(dragState.pointerId);
    }

    dragState.active = false;
    dragState.pointerId = null;

    document.body.style.removeProperty("user-select");
    document.body.style.removeProperty("cursor");

    if (dragState.moved && slider) {
      const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
      const momentumDistance = velocityRef.current.velocity * -260;
      const projected = Math.min(
        maxScroll,
        Math.max(0, slider.scrollLeft + momentumDistance),
      );
      const shouldApplyMomentum = Math.abs(velocityRef.current.velocity) > 0.05;

      if (shouldApplyMomentum) {
        momentumTweenRef.current = gsap.to(slider, {
          scrollLeft: projected,
          duration: 0.28,
          ease: "power2.out",
          onComplete: snapToNearestCard,
        });
      } else {
        snapToNearestCard();
      }
    } else {
      setSnapMode("x proximity");
    }

    window.setTimeout(() => {
      dragState.moved = false;
    }, 0);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const slider = sliderRef.current;
    if (!slider) return;

    dragStateRef.current.active = true;
    dragStateRef.current.moved = false;
    dragStateRef.current.pointerId = event.pointerId;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startScrollLeft = slider.scrollLeft;
    velocityRef.current.lastX = event.clientX;
    velocityRef.current.lastTime = performance.now();
    velocityRef.current.velocity = 0;

    momentumTweenRef.current?.kill();
    setSnapMode("none");
    slider.setPointerCapture?.(event.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  const handlePointerMove = (event) => {
    const slider = sliderRef.current;
    const dragState = dragStateRef.current;

    if (!slider || !dragState.active) return;

    const deltaX = event.clientX - dragState.startX;
    if (Math.abs(deltaX) > 8) {
      dragState.moved = true;
    }

    slider.scrollLeft = dragState.startScrollLeft - deltaX;

    const now = performance.now();
    const dt = now - velocityRef.current.lastTime;
    if (dt > 0) {
      const instantVelocity = (event.clientX - velocityRef.current.lastX) / dt;
      velocityRef.current.velocity =
        velocityRef.current.velocity * 0.75 + instantVelocity * 0.25;
    }
    velocityRef.current.lastX = event.clientX;
    velocityRef.current.lastTime = now;
  };

  const handleDotClick = (index) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const targetScroll = getTargetScrollForIndex(index);
    setSnapMode("none");
    gsap.to(slider, {
      scrollLeft: targetScroll,
      duration: 0.38,
      ease: "power3.out",
      onComplete: () => setSnapMode("x proximity"),
    });
  };

  return (
    <section
      className="
                relative 
                flex 
                min-h-[90vh]
                gap-5 
                flex-col 
                items-center 
                justify-center 
                overflow-hidden 
                px-4 
                py-12
                md:min-h-[100vh]
            "
    >
      <div
        className="
                    pointer-events-none 
                    absolute 
                    inset-0 
                    bg-[radial-gradient(circle_at_20%_25%,rgba(152,202,253,0.18),transparent_40%),radial-gradient(circle_at_80%_75%,rgba(1,82,148,0.22),transparent_42%)]
                "
      />

      <GradientText
        colors={["#015294", "#98cafd", "#015294", "#a2d6fc", "#015294"]}
        animationSpeed={8}
        direction="horizontal"
        showBorder={false}
        fontSize="clamp(1.9rem,6.5vw,2.5rem)"
      >
        {TESTIMONIALS_CONTENT.heading}
      </GradientText>

      <section
        ref={sliderRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onDragStart={(event) => event.preventDefault()}
        aria-label="Testimonials carousel"
        className="
                    relative
                    mt-10
                    flex
                    w-full
                    max-w-7xl
                    items-stretch
                    gap-5
                    overflow-x-auto
                    snap-x
                    snap-proximity
                    px-3
                    pb-3
                    [touch-action:pan-y]
                    [will-change:scroll-position]
                    [scrollbar-width:none]
                    [-ms-overflow-style:none]
                    [&::-webkit-scrollbar]:hidden
                "
      >
        {TESTIMONIALS_CONTENT.items.map((item, idx) => {
          const initials = item.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <article
              key={`${item.name}-${idx}`}
              data-testimonial-card
              className="
                                relative
                                flex
                                min-h-[230px]
                                w-[min(86vw,380px)]
                                shrink-0
                                snap-start
                                select-none
                                cursor-grab
                                active:cursor-grabbing
                                flex-col
                                justify-between
                                overflow-hidden
                                rounded-3xl
                                border
                                border-white/20
                                bg-[linear-gradient(145deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))]
                                p-6
                                text-white
                                shadow-[0_24px_60px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.2)]
                                backdrop-blur-lg
                                backdrop-saturate-110
                                before:pointer-events-none
                                before:absolute
                                before:inset-0
                                before:content-['']
                                before:bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.3),transparent_48%),radial-gradient(circle_at_85%_80%,rgba(152,202,253,0.2),transparent_50%)]
                                sm:w-[min(70vw,380px)]
                                md:w-[min(54vw,370px)]
                                lg:w-[min(36vw,390px)]
                                xl:w-[calc((100%-2.5rem)/3)]
                            "
            >
              <p
                className="
                                    relative 
                                    z-10 
                                    text-[15px] 
                                    leading-7 
                                    text-white/92
                                "
              >
                "{item.quote}"
              </p>

              <div
                className="
                                    relative 
                                    z-10 
                                    mt-6 
                                    flex 
                                    items-center 
                                    gap-3
                                "
              >
                <div
                  className="
                                        grid 
                                        h-11 
                                        w-11 
                                        place-items-center 
                                        rounded-full 
                                        border 
                                        border-white/25 
                                        bg-[linear-gradient(140deg,rgba(152,202,253,0.34),rgba(152,202,253,0.12))] 
                                        text-sm 
                                        font-semibold 
                                        text-[#e6f3ff] 
                                        shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]
                                    "
                >
                  {initials}
                </div>

                <div>
                  <p
                    className="
                                            text-sm 
                                            font-semibold
                                        "
                  >
                    {item.name}
                  </p>
                  <p
                    className="
                                            text-xs 
                                            uppercase 
                                            tracking-[0.08em] 
                                            text-white/60
                                        "
                  >
                    {item.role}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-0 px-4">
        {TESTIMONIALS_CONTENT.items.map((item, idx) => {
          const isActive = visibleDotIndexes.includes(idx);
          const prevActive = visibleDotIndexes.includes(idx - 1);
          const nextActive = visibleDotIndexes.includes(idx + 1);

          return (
            <button
              key={`${item.name}-dot`}
              type="button"
              onClick={() => handleDotClick(idx)}
              aria-label={`Go to testimonial ${idx + 1}`}
              className={`h-1.5 transition-all duration-300 ${
                isActive
                  ? `w-4 bg-[#98cafd] ${prevActive ? "rounded-l-none" : "rounded-l-full"} ${
                      nextActive ? "rounded-r-none" : "rounded-r-full"
                    }`
                  : "mx-1 w-3 rounded-full bg-white/30 hover:bg-white/45"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
};

export default Testimonial;
