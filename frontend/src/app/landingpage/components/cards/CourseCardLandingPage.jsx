"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "@/app/components/ui/Badge";
import Button from "@/app/components/ui/button";
import { COURSES_FOR_LANDING_PAGE } from "../../config/landingContent";
import { getCourseDurationLabel } from "../../lib/courseUtils";
import SpotlightCard from "../Effects/SpotlightCard";

export function CourseCard() {
    const sliderRef = useRef(null);
    const snapTimeoutRef = useRef(null);
    const dragStateRef = useRef({
        active: false,
        moved: false,
        pointerId: null,
        startX: 0,
        startScrollLeft: 0,
    });
    const param = useSearchParams();
    const isUserAuthenticated = param.get("user_authenticated") === "true";
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        return () => {
            if (snapTimeoutRef.current) {
                window.clearTimeout(snapTimeoutRef.current);
            }
            document.body.style.removeProperty("user-select");
            document.body.style.removeProperty("cursor");
        };
    }, []);

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const data = await COURSES_FOR_LANDING_PAGE();
                if (active) setCourses(Array.isArray(data) ? data : []);
            } catch {
                if (active) setCourses([]);
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    const visibleCourses = useMemo(() => {
        const getStatusKey = (course) => {
            const explicitStatus = String(course?.status ?? "")
                .trim()
                .toLowerCase();
            if (
                explicitStatus === "ongoing" ||
                explicitStatus === "upcoming" ||
                explicitStatus === "completed"
            ) {
                return explicitStatus;
            }

            const now = new Date();
            const start = new Date(course?.startsAt);
            const end = new Date(course?.endDate);

            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                return "unknown";
            }

            if (now < start) return "upcoming";
            if (now > end) return "completed";
            return "ongoing";
        };

        const getStartTime = (course) => {
            const timestamp = new Date(course?.startsAt).getTime();
            return Number.isNaN(timestamp)
                ? Number.POSITIVE_INFINITY
                : timestamp;
        };

        const ongoingCourses = [];
        const upcomingCourses = [];

        courses.forEach((course) => {
            const statusKey = getStatusKey(course);

            if (statusKey === "ongoing") {
                ongoingCourses.push(course);
            } else if (statusKey === "upcoming") {
                upcomingCourses.push(course);
            }
        });

        upcomingCourses.sort((a, b) => getStartTime(a) - getStartTime(b));

        const closestUpcomingCourses = upcomingCourses.slice(0, 3);
        return [...ongoingCourses, ...closestUpcomingCourses];
    }, [courses]);

    const setSnapMode = (mode) => {
        const slider = sliderRef.current;
        if (!slider) return;

        slider.style.scrollSnapType = mode;
    };

    const snapToNearestCard = () => {
        const slider = sliderRef.current;
        if (!slider) return;

        const cards = slider.querySelectorAll("[data-course-card]");
        if (!cards.length) return;

        const sliderRect = slider.getBoundingClientRect();
        const sliderCenter = sliderRect.left + sliderRect.width / 2;

        let targetCard = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        cards.forEach((card) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(cardCenter - sliderCenter);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                targetCard = card;
            }
        });

        setSnapMode("x proximity");
        targetCard?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        });
    };

    const stopDragging = () => {
        const dragState = dragStateRef.current;

        if (!dragState) return;

        dragState.active = false;
        dragState.pointerId = null;

        document.body.style.removeProperty("user-select");
        document.body.style.removeProperty("cursor");

        if (dragState.moved) {
            snapToNearestCard();
        } else {
            setSnapMode("x proximity");
        }

        if (snapTimeoutRef.current) {
            window.clearTimeout(snapTimeoutRef.current);
        }

        snapTimeoutRef.current = window.setTimeout(() => {
            setSnapMode("x proximity");
        }, 250);

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

        if (snapTimeoutRef.current) {
            window.clearTimeout(snapTimeoutRef.current);
        }

        setSnapMode("none");
        // slider.setPointerCapture?.(event.pointerId);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
    };

    const handlePointerMove = (event) => {
        const slider = sliderRef.current;
        const dragState = dragStateRef.current;

        if (!slider || !dragState.active) return;

        const deltaX = event.clientX - dragState.startX;

        if (Math.abs(deltaX) > 10) {
            dragState.moved = true;
        }

        slider.scrollLeft = dragState.startScrollLeft - deltaX;
    };

    const handleClickCapture = (event) => {
        if (!dragStateRef.current.moved) return;

        event.preventDefault();
        event.stopPropagation();
        dragStateRef.current.moved = false;
    };

    return (
        <section
            ref={sliderRef}
            // onClickCapture={handleClickCapture}
            onDragStart={(event) => event.preventDefault()}
            onPointerCancel={stopDragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            aria-label="Courses carousel"
            className="
                    flex
                    w-full
                    justify-start
                    items-center
                    gap-5
                    px-[min(1.25rem,calc((100%-min(85vw,350px))/2))]
                    pb-3
                    overflow-x-hidden 
                    snap-x
                    snap-proximity
                    [scroll-padding-inline:max(1.25rem,calc((100%-min(85vw,30px))/2))]
                    [touch-action:pan-y]
                    h-full 
                    py-5
                    [scrollbar-width:none] 
                    [-ms-overflow-style:none] 
                    [&::-webkit-scrollbar]:hidden
                "
        >
            {visibleCourses.map((course, idx) => {
                const isOngoing =
                    String(course.status || "").toLowerCase() === "ongoing";
                const duration = getCourseDurationLabel(
                    course.startsAt,
                    course.endDate,
                );
                const coursePrice = Number(course.price);
                const priceLabel =
                    Number.isFinite(coursePrice) && coursePrice > 0
                        ? `INR ${coursePrice.toLocaleString("en-IN")}`
                        : "Free";

                return (
                    <Link
                        href={`/landingpage/courses/course/${course.slug}?user_authenticated=${isUserAuthenticated}`}
                        key={course.id ?? idx}
                        data-course-card
                        className="
                                shrink-0
                                snap-center
                                h-max
                            "
                        onClick={handleClickCapture}
                    >
                        <SpotlightCard
                            spotlightColor="rgba(255, 255, 255, 0.4)"
                            className="
                                    flex
                                    flex-col
                                    justify-center
                                    items-center
                                    pb-5
                                    gap-5
                                    min-h-[400px]
                                    shadow-[0px_0px_5px_rgba(255,255,255,0.4)]
                                    w-[min(85vw,350px)]
                                    shrink-0
                                    select-none
                                "
                            key={`${course.title}-${idx}`}
                        >
                            <Image
                                src={course.bannerImage}
                                className="relative w-full h-[auto] top-0"
                                width={320}
                                height={180}
                                alt="banner image"
                                draggable={false}
                            />

                            <div
                                className="
                                        flex
                                        flex-col
                                        gap-3
                                        px-3
                                        h-full
                                        w-full
                                    "
                            >
                                <div
                                    className="
                                            flex
                                            justify-between
                                        "
                                >
                                    <Badge
                                        variant={
                                            isOngoing ? "danger" : "success"
                                        }
                                        className="gap-2 h-5"
                                    >
                                        <span
                                            className="
                        relative 
                        flex 
                        h-2.5 
                        w-2.5
                      "
                                        >
                                            {isOngoing && (
                                                <span
                                                    className="
                            absolute 
                            inline-flex 
                            h-full 
                            w-full 
                            rounded-full 
                            bg-red-500 
                            opacity-700 
                            animate-ping
                          "
                                                />
                                            )}
                                            <span
                                                className={`
                                                            relative 
                                                            inline-flex 
                                                            h-2.5 
                                                            w-2.5 
                                                            rounded-full ${
                                                                isOngoing
                                                                    ? "bg-red-500"
                                                                    : "bg-green-500"
                                                            }
                                                        `}
                                            />
                                        </span>

                                        {isOngoing ? "Ongoing" : "Upcoming"}
                                    </Badge>
                                    <Badge variant="glass">
                                        Duration: {duration}
                                    </Badge>
                                </div>
                                <div
                                    className="
                                            flex 
                                            flex-col
                                        "
                                >
                                    <h3
                                        className="
                                                text-xl 
                                                font-semibold 
                                                text-white
                                            "
                                    >
                                        {course.title}
                                    </h3>

                                    <p
                                        className="
                                                text-sm 
                                                leading-6 
                                                text-white/80 
                                                text-justify 
                                                px-3
                                            "
                                    >
                                        {course.description}
                                    </p>
                                </div>

                                <div
                                    className="
                                            mt-auto
                                            flex 
                                            justify-between 
                                            items-center
                                            gap-3
                                        "
                                >
                                    <p className="text-sm font-medium text-white/80">
                                        Price: {priceLabel}
                                    </p>
                                    <Button
                                        variant={
                                            isOngoing ? "danger" : "success"
                                        }
                                        className={`${isOngoing ? "bg-red-500" : "bg-green-500"} rounded-full`}
                                    >
                                        {isOngoing ? "Buy Now" : "Pre-register"}
                                    </Button>
                                </div>
                            </div>
                        </SpotlightCard>
                    </Link>
                );
            })}

            <Link
                href={`/landingpage/courses?user_authenticated=${isUserAuthenticated}`}
            >
                <SpotlightCard
                    spotlightColor="rgba(255, 255, 255, 0.4)"
                    className="
                            flex
                            flex-col
                            justify-center
                            items-center
                            py-5
                            px-3
                            h-100
                            gap-5
                            shadow-[0px_0px_5px_rgba(255,255,255,0.4)]
                            w-[min(85vw,350px)]
                            shrink-0
                            select-none
                        "
                >
                    <div
                        className="
                                text-center 
                                flex 
                                flex-col 
                                gap-3 
                                justify-center 
                                items-center
                            "
                    >
                        <h1 className="text-xl">
                            Want to explore more Courses?
                        </h1>
                        <div className="text-md">Click here</div>
                    </div>
                </SpotlightCard>
            </Link>
        </section>
    );
}
