"use client";

import { useGSAP } from "@gsap/react";
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from "framer-motion";
import { gsap } from "gsap";
import Link from "next/link";
import { useMemo, useRef } from "react";
import CustomScroll from "@/app/landingpage/components/CustomScrollBar";

gsap.registerPlugin(useGSAP);

const reveal = {
    hidden: { opacity: 0, y: 26 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
};

export default function ServiceDetailExperience({ service, otherServices }) {
    const reduceMotion = useReducedMotion();
    const heroIconRef = useRef(null);
    const flowSectionRef = useRef(null);

    useGSAP(() => {
        if (reduceMotion) return;

        const ctx = gsap.context(() => {
            gsap.to(heroIconRef.current, {
                y: -8,
                duration: 2.4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        });

        return () => ctx.revert();
    }, [reduceMotion]);

    const featureRows = useMemo(
        () =>
            service.features.map((feature, index) => ({
                id: `${service.id}-${index + 1}`,
                feature,
                number: String(index + 1).padStart(2, "0"),
            })),
        [service.features, service.id],
    );

    const { scrollYProgress } = useScroll({
        target: flowSectionRef,
        offset: ["start 75%", "end 25%"],
    });
    const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <>
            <CustomScroll />
            <main className="min-h-screen px-4 pb-24 pt-24 text-white sm:px-6 sm:pt-28">
                <section className="mx-auto w-full max-w-7xl">
                    <motion.header
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.08 } },
                        }}
                        className="border-b border-white/10 pb-12"
                    >
                        <motion.nav
                            variants={reveal}
                            className="mb-10 text-xs uppercase tracking-[0.2em] text-white/56"
                        >
                            <Link
                                href="/landingpage/Pages/services"
                                className="transition hover:text-white/86"
                            >
                                Services
                            </Link>
                            <span className="px-2 text-white/34">/</span>
                            <span className="text-white/84">
                                {service.title}
                            </span>
                        </motion.nav>

                        <motion.div
                            variants={reveal}
                            className="flex items-start gap-5"
                        >
                            <span
                                ref={heroIconRef}
                                className="inline-flex h-14 w-14 items-center justify-center border border-white/18 text-sm font-semibold tracking-[0.12em] text-white"
                            >
                                {service.icon}
                            </span>
                            <div>
                                <h1 className="max-w-[14ch] text-[clamp(2.3rem,6.2vw,5rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-white">
                                    {service.title}
                                </h1>
                                <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
                                    {service.fullDesc}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={reveal}
                            className="mt-10 flex flex-wrap gap-3"
                        >
                            <Link
                                href="/landingpage/Pages/contact"
                                className="rounded-full border border-cyan-200/46 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/12"
                            >
                                Talk To Team
                            </Link>
                            <Link
                                href="/landingpage/Pages/services"
                                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/86 transition hover:border-white/38 hover:bg-white/8"
                            >
                                Back To Services
                            </Link>
                        </motion.div>
                    </motion.header>

                    <section className="relative left-1/2 right-1/2 mt-10 w-screen -translate-x-1/2 overflow-hidden border-y border-white/12 py-3">
                        <motion.div
                            aria-hidden
                            animate={reduceMotion ? {} : { x: ["0%", "-25%"] }}
                            transition={
                                reduceMotion
                                    ? undefined
                                    : {
                                          duration: 18,
                                          repeat: Number.POSITIVE_INFINITY,
                                          ease: "linear",
                                      }
                            }
                            className="flex min-w-max items-center gap-3 whitespace-nowrap px-4 sm:px-8"
                        >
                            {[0, 1, 2, 3].flatMap((copy) =>
                                featureRows.map((row) => (
                                    <span
                                        key={`${row.id}-${copy}`}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/16 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/74"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/75" />
                                        {row.feature}
                                    </span>
                                )),
                            )}
                        </motion.div>
                    </section>

                    <section
                        ref={flowSectionRef}
                        className="relative grid gap-12 py-14 lg:grid-cols-[1.08fr_0.92fr]"
                    >
                        <div className="relative pl-7 md:pl-10">
                            <div className="absolute bottom-0 left-0 top-0 w-px bg-white/18" />
                            <motion.div
                                style={{ scaleY: progressScale }}
                                className="absolute left-0 top-0 w-px origin-top bg-cyan-200"
                            />

                            <div className="space-y-8">
                                {featureRows.map((row, index) => (
                                    <motion.article
                                        key={row.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.35 }}
                                        transition={{
                                            duration: 0.42,
                                            delay: index * 0.03,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className="group"
                                    >
                                        <p className="text-xs uppercase tracking-[0.26em] text-cyan-100/66">
                                            {row.number}
                                        </p>
                                        <p className="mt-2 text-lg leading-8 text-white/82 transition group-hover:text-white">
                                            {row.feature}
                                        </p>
                                    </motion.article>
                                ))}
                            </div>
                        </div>

                        <motion.aside
                            initial={{ opacity: 0, y: 22 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{
                                duration: 0.5,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="lg:sticky lg:top-28 lg:self-start"
                        >
                            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">
                                Is This For You?
                            </p>
                            <p className="mt-4 text-base leading-8 text-white/74">
                                Choose this if you want structure, practical
                                tasks, and regular feedback to improve your
                                execution quickly.
                            </p>
                            <p className="mt-6 text-sm leading-7 text-white/62">
                                If you are not sure, message our team and we
                                will help you pick the right service based on
                                your current level and target role.
                            </p>
                        </motion.aside>
                    </section>

                    <section className="border-t border-white/10 pt-12">
                        <h2 className="text-sm uppercase tracking-[0.28em] text-cyan-100/72">
                            Other Services
                        </h2>

                        <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
                            {otherServices.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={{
                                        duration: 0.42,
                                        delay: index * 0.04,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    <Link
                                        href={item.href}
                                        className="group grid gap-4 py-6 sm:grid-cols-[0.9fr_1.1fr_auto] sm:items-start"
                                    >
                                        <p className="text-lg font-semibold tracking-[-0.02em] text-white transition group-hover:text-cyan-100">
                                            {item.title}
                                        </p>
                                        <p className="text-sm leading-7 text-white/66">
                                            {item.fullDesc}
                                        </p>
                                        <span className="text-xs uppercase tracking-[0.2em] text-white/56 transition group-hover:text-white">
                                            View
                                        </span>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </section>
            </main>
        </>
    );
}
