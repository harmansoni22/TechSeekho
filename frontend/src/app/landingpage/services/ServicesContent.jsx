"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CustomScroll from "../components/CustomScrollBar";
import ElectricBorder from "../components/Effects/ElectricBorder";
import MagicBento from "../components/MagicBento";
import {
    FAQ_ITEMS,
    PRICING_TIERS,
    SERVICE_FLOW,
    SERVICES,
    SERVICES_CTA,
    SERVICES_METADATA,
    TESTIMONIALS,
    WHY_CHOOSE_SECTION,
} from "../config/servicesContent";

const revealTransition = {
    duration: 0.62,
    ease: [0.22, 1, 0.36, 1],
};

function reveal(reduceMotion, delay = 0, amount = 0.25) {
    return {
        initial: reduceMotion ? {} : { opacity: 0, y: 24 },
        whileInView: reduceMotion ? {} : { opacity: 1, y: 0 },
        viewport: { once: true, amount },
        transition: { ...revealTransition, delay },
    };
}

function toSlug(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function SectionLabel({ children }) {
    return (
        <p className="font-[family:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.32em] text-cyan-100/70">
            {children}
        </p>
    );
}

function TimelineStep({ step, index, reduceMotion }) {
    const alignment =
        index % 2 === 0
            ? "md:ml-0 md:mr-auto md:text-right md:pr-14"
            : "md:mr-0 md:ml-auto md:text-left md:pl-14";
    const markerPosition =
        index % 2 === 0
            ? "md:right-[-9px] md:left-auto"
            : "md:left-[-9px] md:right-auto";

    return (
        <motion.article
            {...reveal(reduceMotion, 0.07 * index, 0.35)}
            className={`relative w-full max-w-xl rounded-3xl border border-white/14 bg-white/[0.03] p-6 backdrop-blur-sm ${alignment}`}
        >
            <span
                className={`absolute left-[-9px] top-8 h-[18px] w-[18px] rounded-full border border-cyan-100/45 bg-[#09142a] ${markerPosition}`}
            />
            <p className="font-[family:var(--font-geist-mono)] text-xs uppercase tracking-[0.3em] text-cyan-100/68">
                {step.id}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                {step.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">
                {step.detail}
            </p>
        </motion.article>
    );
}

function PricingCard({ tier, index, reduceMotion }) {
    return (
        <motion.article
            {...reveal(reduceMotion, 0.06 * index, 0.5)}
            className={`w-[84vw] shrink-0 snap-center rounded-[1.7rem] border px-6 py-6 sm:w-[420px] ${
                tier.highlight
                    ? "border-cyan-200/52 bg-white/[0.06]"
                    : "border-white/14 bg-white/[0.03]"
            }`}
        >
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <h3 className="text-xl font-semibold text-white">
                    {tier.title}
                </h3>
                <p className="text-right">
                    <span className="text-2xl font-semibold text-white">
                        {tier.price}
                    </span>
                    {tier.period && (
                        <span className="ml-1 text-xs text-white/65">
                            {tier.period}
                        </span>
                    )}
                </p>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-white/74">
                {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                ))}
            </ul>

            <button
                type="button"
                className={`mt-6 w-full cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    tier.highlight
                        ? "bg-white text-[#031022] hover:bg-cyan-50"
                        : "border border-white/20 text-white hover:bg-white/8"
                }`}
            >
                {tier.cta}
            </button>
        </motion.article>
    );
}

function ReviewCard({ item, index, reduceMotion }) {
    return (
        <motion.article
            {...reveal(reduceMotion, 0.06 * index, 0.35)}
            className="rounded-3xl border border-white/12 bg-white/[0.03] p-6 sm:p-7"
        >
            <div className="flex items-center gap-1 text-cyan-100">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                    <span key={`${item.name}-star-${starIndex}`} aria-hidden>
                        ★
                    </span>
                ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-white/74 sm:text-base">
                {item.quote}
            </p>
            <p className="mt-5 text-sm font-semibold text-white">{item.name}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/65">
                {item.role}
            </p>
        </motion.article>
    );
}

function FaqItem({
    item,
    idx,
    open,
    onToggle,
    buttonRef,
    onKeyDown,
    reduceMotion,
}) {
    return (
        <motion.li
            layout
            initial={false}
            className={`rounded-2xl border p-4 sm:p-5 ${
                open
                    ? "border-cyan-200/44 bg-white/[0.05]"
                    : "border-white/12 bg-white/[0.02]"
            }`}
        >
            <button
                id={`faq-btn-${idx}`}
                ref={buttonRef}
                type="button"
                onClick={() => onToggle(idx)}
                onKeyDown={onKeyDown}
                aria-expanded={open}
                aria-controls={`faq-panel-${idx}`}
                className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
            >
                <span
                    className={`text-sm font-semibold sm:text-base ${open ? "text-cyan-100" : "text-white"}`}
                >
                    {item.q}
                </span>
                <motion.svg
                    aria-hidden
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{
                        duration: reduceMotion ? 0 : 0.25,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-white/62"
                >
                    <title>{open ? "Collapse answer" : "Expand answer"}</title>
                    <path
                        d="M6 9l6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </motion.svg>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        id={`faq-panel-${idx}`}
                        aria-labelledby={`faq-btn-${idx}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={
                            reduceMotion
                                ? { duration: 0 }
                                : {
                                      height: {
                                          duration: 0.34,
                                          ease: [0.22, 1, 0.36, 1],
                                      },
                                      opacity: {
                                          duration: 0.24,
                                          ease: [0.22, 1, 0.36, 1],
                                      },
                                  }
                        }
                        className="overflow-hidden"
                    >
                        <motion.p
                            initial={{ y: -8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -8, opacity: 0 }}
                            transition={
                                reduceMotion
                                    ? { duration: 0 }
                                    : {
                                          duration: 0.25,
                                          ease: [0.22, 1, 0.36, 1],
                                      }
                            }
                            className="pt-3 text-sm leading-7 text-white/72"
                        >
                            {item.a}
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.li>
    );
}

function FaqList({ items }) {
    const [openIndex, setOpenIndex] = useState(0);
    const reduceMotion = useReducedMotion();
    const buttonRefs = useRef([]);

    useEffect(() => {
        buttonRefs.current = Array(items.length)
            .fill(null)
            .map((_, index) => buttonRefs.current[index] || null);
    }, [items.length]);

    const toggle = (index) => {
        setOpenIndex((prev) => (prev === index ? -1 : index));
    };

    const handleKeyDown = (event, index) => {
        const max = items.length - 1;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            buttonRefs.current[index === max ? 0 : index + 1]?.focus();
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            buttonRefs.current[index === 0 ? max : index - 1]?.focus();
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            buttonRefs.current[0]?.focus();
            return;
        }

        if (event.key === "End") {
            event.preventDefault();
            buttonRefs.current[max]?.focus();
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle(index);
        }
    };

    return (
        <ul className="space-y-3">
            {items.map((item, index) => (
                <FaqItem
                    key={item.q}
                    item={item}
                    idx={index}
                    open={openIndex === index}
                    onToggle={toggle}
                    buttonRef={(element) => {
                        buttonRefs.current[index] = element;
                    }}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    reduceMotion={reduceMotion}
                />
            ))}
        </ul>
    );
}

export default function ServicesContent() {
    const reduceMotion = useReducedMotion();
    const serviceBentoCards = [
        ...SERVICES.map((service) => ({
            id: `service-${service.id}`,
            color: "#070013",
            label: service.shortDesc,
            title: service.title,
            description: service.fullDesc,
            href: `/landingpage/Pages/services/service/${toSlug(service.title)}`,
            actionLabel: "View Details",
        })),
        {
            id: "service-guidance",
            color: "#070013",
            label: "Guidance",
            title: "Help Me Choose",
            description:
                "Not sure where to start? Share your goal and we will suggest the right learning path.",
            href: "/landingpage/Pages/contact",
            actionLabel: "Talk To Team",
        },
        {
            id: "service-roadmap",
            color: "#070013",
            label: "Planning",
            title: "Custom Roadmap",
            description:
                "Get a practical step-by-step roadmap based on your current level and target role.",
            href: "/landingpage/Pages/contact",
            actionLabel: "Get Roadmap",
        },
    ];

    return (
        <>
            <CustomScroll />
            <main className="relative isolate overflow-hidden bg-[#030812] text-white">
                <section className="relative isolate overflow-hidden border-b border-white/10">
                    <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-7xl flex-col justify-center px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:pb-24">
                        <motion.div
                            {...reveal(reduceMotion, 0, 0.2)}
                            className="max-w-3xl"
                        >
                            <SectionLabel>Services</SectionLabel>
                            <h1 className="mt-6 text-[clamp(2.3rem,6.2vw,5rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-white [text-shadow:0_12px_32px_rgba(0,0,0,0.55)]">
                                {SERVICES_METADATA.hero.headline}
                            </h1>
                            <p className="mt-7 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
                                {SERVICES_METADATA.hero.sub}
                            </p>

                            <div className="mt-10 flex flex-wrap items-center gap-4">
                                <Link href="/landingpage/Pages/courses">
                                    <ElectricBorder
                                        color="#7ec8ff"
                                        hoveredColor="#ffffff"
                                        chaos={0.04}
                                        speed={0.55}
                                        className="rounded-full px-6 py-3"
                                    >
                                        <span className="text-sm font-semibold text-white">
                                            {SERVICES_METADATA.hero.ctaPrimary}
                                        </span>
                                    </ElectricBorder>
                                </Link>

                                <Link
                                    href="/landingpage/Pages/contact"
                                    className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/38 hover:bg-white/8"
                                >
                                    {SERVICES_METADATA.hero.ctaSecondary}
                                </Link>
                            </div>
                        </motion.div>

                        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {SERVICES.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    {...reveal(
                                        reduceMotion,
                                        0.06 * index + 0.15,
                                        0.8,
                                    )}
                                    className="rounded-full border border-white/16 bg-[#061327]/80 px-4 py-2.5 text-center text-xs uppercase tracking-[0.2em] text-white/82"
                                >
                                    {service.title}
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-12 grid gap-3 border-y border-white/14 py-5 text-left sm:grid-cols-2 lg:grid-cols-4">
                            {SERVICE_FLOW.map((step, index) => (
                                <motion.div
                                    key={step.id}
                                    {...reveal(reduceMotion, 0.06 * index, 0.8)}
                                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
                                >
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/70">
                                        Step {step.id}
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-white">
                                        {step.title}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="relative isolate overflow-hidden border-b border-white/10">
                    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
                        <motion.div
                            {...reveal(reduceMotion, 0, 0.25)}
                            className="max-w-3xl"
                        >
                            <SectionLabel>Service Tracks</SectionLabel>
                            <h2 className="mt-5 max-w-[16ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                                Flexible formats, one clear goal: visible
                                progress.
                            </h2>
                        </motion.div>

                        <div className="mt-10">
                            <MagicBento
                                cards={serviceBentoCards}
                                defaultActionLabel="View Details"
                                enableStars={!reduceMotion}
                                enableSpotlight={!reduceMotion}
                                enableBorderGlow
                                disableAnimations={reduceMotion}
                                spotlightRadius={280}
                                particleCount={8}
                                enableTilt
                                glowColor="94, 191, 255"
                                clickEffect
                                enableMagnetism={false}
                            />
                        </div>
                    </div>
                </section>

                <section className="relative isolate overflow-hidden border-b border-white/10">
                    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
                        <motion.div
                            {...reveal(reduceMotion, 0, 0.25)}
                            className="text-center"
                        >
                            <SectionLabel>Learning Loop</SectionLabel>
                            <h2 className="mx-auto mt-5 max-w-[16ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                                Learn, build, improve, and ship.
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/66">
                                This loop keeps your progress practical and
                                consistent every week.
                            </p>
                        </motion.div>

                        <div className="relative mx-auto mt-14 max-w-5xl space-y-7 pl-5 md:space-y-9 md:pl-0">
                            <div className="pointer-events-none absolute bottom-3 left-[8px] top-3 w-px bg-white/22 md:left-1/2 md:-translate-x-1/2" />
                            {SERVICE_FLOW.map((step, index) => (
                                <TimelineStep
                                    key={step.id}
                                    step={step}
                                    index={index}
                                    reduceMotion={reduceMotion}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="relative isolate overflow-hidden border-b border-white/10">
                    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
                        <motion.div {...reveal(reduceMotion, 0, 0.2)}>
                            <SectionLabel>Plans And Trust</SectionLabel>
                            <h2 className="mt-5 max-w-[18ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                                Choose your plan, then grow with feedback.
                            </h2>
                        </motion.div>

                        <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {PRICING_TIERS.map((tier, index) => (
                                <PricingCard
                                    key={tier.id}
                                    tier={tier}
                                    index={index}
                                    reduceMotion={reduceMotion}
                                />
                            ))}
                        </div>

                        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                            <motion.div
                                {...reveal(reduceMotion, 0.08, 0.3)}
                                className="rounded-[1.7rem] border border-white/12 bg-white/[0.03] p-6"
                            >
                                <h3 className="text-xl font-semibold text-white">
                                    Why learners stay with us
                                </h3>
                                <ul className="mt-5 space-y-3">
                                    {WHY_CHOOSE_SECTION.map((item, index) => (
                                        <motion.li
                                            key={item.title}
                                            {...reveal(
                                                reduceMotion,
                                                0.04 * index,
                                                0.8,
                                            )}
                                            className="rounded-2xl border border-white/10 bg-[#071326]/80 px-4 py-3"
                                        >
                                            <p className="text-sm font-semibold text-white">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-sm text-white/68">
                                                {item.desc}
                                            </p>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>

                            <motion.div
                                {...reveal(reduceMotion, 0.12, 0.3)}
                                className="rounded-[1.7rem] border border-white/12 bg-white/[0.03] p-6"
                            >
                                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">
                                    Plan Support
                                </p>
                                <ul className="mt-5 space-y-3 text-sm leading-7 text-white/74">
                                    <li>
                                        Clear weekly checkpoints and progress
                                        tracking.
                                    </li>
                                    <li>
                                        Fast feedback loop from mentors on your
                                        tasks.
                                    </li>
                                    <li>
                                        Flexible upgrade path as your goals
                                        evolve.
                                    </li>
                                    <li>
                                        Practical focus on results, not just
                                        theory.
                                    </li>
                                </ul>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section className="relative isolate overflow-hidden border-b border-white/10">
                    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
                        <motion.div
                            {...reveal(reduceMotion, 0, 0.25)}
                            className="max-w-3xl"
                        >
                            <SectionLabel>Reviews</SectionLabel>
                            <h2 className="mt-5 max-w-[18ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                                Real learner feedback from our programs.
                            </h2>
                            <p className="mt-6 max-w-2xl text-base leading-8 text-white/66">
                                These are simple, direct reviews from learners
                                who used our mentorship and service tracks.
                            </p>
                        </motion.div>

                        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {TESTIMONIALS.map((item, index) => (
                                <ReviewCard
                                    key={item.name}
                                    item={item}
                                    index={index}
                                    reduceMotion={reduceMotion}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="relative isolate overflow-hidden border-b border-white/10">
                    <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:py-28">
                        <motion.div
                            {...reveal(reduceMotion, 0, 0.25)}
                            className="text-center"
                        >
                            <SectionLabel>FAQ</SectionLabel>
                            <h2 className="mx-auto mt-5 max-w-[16ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                                Frequently Asked Questions
                            </h2>
                        </motion.div>

                        <div className="mt-12">
                            <FaqList items={FAQ_ITEMS} />
                        </div>
                    </div>
                </section>

                <section className="relative isolate overflow-hidden">
                    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
                        <motion.div
                            {...reveal(reduceMotion, 0, 0.25)}
                            className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/[0.03] px-6 py-12 text-center sm:px-10 sm:py-16"
                        >
                            <div className="relative">
                                <SectionLabel>
                                    {SERVICES_CTA.eyebrow}
                                </SectionLabel>
                                <h2 className="mx-auto mt-5 max-w-[16ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                                    {SERVICES_CTA.title}
                                </h2>
                                <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/64">
                                    {SERVICES_CTA.description}
                                </p>

                                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                    <Link href={SERVICES_CTA.primaryButtonHref}>
                                        <ElectricBorder
                                            color="#7ec8ff"
                                            hoveredColor="#ffffff"
                                            chaos={0.04}
                                            speed={0.55}
                                            className="rounded-full px-6 py-3"
                                        >
                                            <span className="text-sm font-semibold text-white">
                                                {
                                                    SERVICES_CTA.primaryButtonLabel
                                                }
                                            </span>
                                        </ElectricBorder>
                                    </Link>

                                    <Link
                                        href={SERVICES_CTA.secondaryButtonHref}
                                        className="rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-white/88 transition hover:border-white/32 hover:bg-white/6"
                                    >
                                        {SERVICES_CTA.secondaryButtonLabel}
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>
        </>
    );
}
