"use client";

import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CustomScroll from "../components/CustomScrollBar";

gsap.registerPlugin(useGSAP);

const contactPoints = [
  {
    label: "Email",
    value: "support@techseekho.com",
    href: "mailto:support@techseekho.com",
    helper: "Best for detailed queries and document sharing.",
  },
  {
    label: "Phone",
    value: "+91 98765 43210",
    href: "tel:+919876543210",
    helper: "Best for urgent support and quick clarifications.",
  },
  {
    label: "Working Hours",
    value: "Monday to Saturday, 10:00 AM to 7:00 PM (IST)",
    helper: "Typical response time: within one business day.",
  },
];

const topicItems = [
  "Course selection",
  "Enrollment support",
  "Mentorship guidance",
  "Partnership request",
];

const floatPills = [
  "Fast response",
  "Mentor guidance",
  "Clear roadmap",
  "Simple process",
];

const reveal = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const ContactExperience = () => {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef(null);
  const formCardRef = useRef(null);
  const floatingPillRefs = useRef([]);
  const topicMenuRef = useRef(null);
  const [topicOpen, setTopicOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");

  useGSAP(
    () => {
      if (reduceMotion) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          floatingPillRefs.current,
          { y: 0, opacity: 0.55 },
          {
            y: -10,
            opacity: 1,
            duration: 2.1,
            stagger: 0.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          },
        );

        gsap.to(formCardRef.current, {
          y: -6,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }, rootRef);

      return () => ctx.revert();
    },
    { scope: rootRef, dependencies: [reduceMotion] },
  );

  useEffect(() => {
    if (!topicOpen) return;

    const onPointerDown = (event) => {
      if (!topicMenuRef.current) return;
      if (!topicMenuRef.current.contains(event.target)) {
        setTopicOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") setTopicOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [topicOpen]);

  return (
    <>
      <CustomScroll />

      <main
        ref={rootRef}
        className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 pb-24 pt-24 text-white sm:px-6 sm:pt-28"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-[shimmerLine_4.6s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(199,244,255,0.65),transparent)]" />

        <motion.section
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="border-b border-white/10 pb-12"
        >
          <motion.p
            variants={reveal}
            className="font-[family:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.3em] text-cyan-100/72"
          >
            Contact
          </motion.p>

          <motion.h1
            variants={reveal}
            className="mt-5 max-w-[16ch] text-[clamp(2.2rem,6.1vw,4.6rem)] font-semibold leading-[0.94] tracking-[-0.04em] text-white"
          >
            Let&apos;s solve your learning questions quickly.
          </motion.h1>

          <motion.p
            variants={reveal}
            className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg"
          >
            Tell us where you are stuck and where you want to go. We will guide
            you with clear next steps.
          </motion.p>

          <motion.div
            variants={reveal}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            {floatPills.map((pill, index) => (
              <span
                key={pill}
                ref={(element) => {
                  floatingPillRefs.current[index] = element;
                }}
                className="rounded-full border border-white/14 bg-white/[0.03] px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white/78"
              >
                {pill}
              </span>
            ))}
          </motion.div>
        </motion.section>

        <section className="grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.article
            ref={formCardRef}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            className="rounded-3xl border border-white/14 bg-white/[0.03] p-6 sm:p-8"
          >
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
              Send a message
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/66">
              Share your details and our team will contact you soon.
            </p>

            <form className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="float-field relative block">
                  <input
                    type="text"
                    name="name"
                    placeholder=" "
                    className="peer w-full rounded-xl border border-white/16 bg-[#050c18] px-4 pb-3 pt-6 text-sm text-white outline-none transition placeholder:text-transparent focus:border-cyan-200/70"
                  />
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/56 transition-all duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-cyan-100 peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.14em] peer-[:not(:placeholder-shown)]:text-cyan-100/86">
                    Full Name
                  </span>
                  <span className="pointer-events-none absolute bottom-[1px] left-3 right-3 h-px origin-left scale-x-0 bg-cyan-200/80 transition-transform duration-300 ease-out peer-focus:scale-x-100" />
                </label>

                <label className="float-field relative block">
                  <input
                    type="email"
                    name="email"
                    placeholder=" "
                    className="peer w-full rounded-xl border border-white/16 bg-[#050c18] px-4 pb-3 pt-6 text-sm text-white outline-none transition placeholder:text-transparent focus:border-cyan-200/70"
                  />
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/56 transition-all duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-cyan-100 peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.14em] peer-[:not(:placeholder-shown)]:text-cyan-100/86">
                    Email
                  </span>
                  <span className="pointer-events-none absolute bottom-[1px] left-3 right-3 h-px origin-left scale-x-0 bg-cyan-200/80 transition-transform duration-300 ease-out peer-focus:scale-x-100" />
                </label>
              </div>

              <label ref={topicMenuRef} className="float-field relative block">
                <input type="hidden" name="topic" value={selectedTopic} />
                <button
                  type="button"
                  aria-label="Topic"
                  aria-haspopup="listbox"
                  aria-expanded={topicOpen}
                  onClick={() => setTopicOpen((prev) => !prev)}
                  className="peer flex w-full items-center justify-between rounded-xl border border-white/16 bg-[#050c18] px-4 pb-3 pt-6 text-left text-sm text-white outline-none transition hover:border-white/30"
                >
                  <span
                    className={selectedTopic ? "text-white" : "text-white/56"}
                  >
                    {selectedTopic || "Select a topic"}
                  </span>
                  <motion.svg
                    viewBox="0 0 24 24"
                    animate={{ rotate: topicOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="h-4 w-4 text-white/68"
                    aria-hidden
                  >
                    <title>{topicOpen ? "Close topics" : "Open topics"}</title>
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
                <span className="pointer-events-none absolute left-4 top-2.5 text-[11px] uppercase tracking-[0.14em] text-cyan-100/86">
                  Topic
                </span>
                <span
                  className={`pointer-events-none absolute bottom-[1px] left-3 right-3 h-px origin-left bg-cyan-200/80 transition-transform duration-300 ease-out ${
                    topicOpen ? "scale-x-100" : "scale-x-0"
                  }`}
                />

                <AnimatePresence>
                  {topicOpen && (
                    <motion.ul
                      role="listbox"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-white/16 bg-[#061022] p-2 shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
                    >
                      {topicItems.map((topic) => (
                        <li key={topic}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selectedTopic === topic}
                            onClick={() => {
                              setSelectedTopic(topic);
                              setTopicOpen(false);
                            }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                              selectedTopic === topic
                                ? "bg-cyan-300/18 text-cyan-100"
                                : "text-white/82 hover:bg-white/10"
                            }`}
                          >
                            {topic}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </label>

              <label className="float-field relative block">
                <textarea
                  name="message"
                  rows={5}
                  placeholder=" "
                  className="peer w-full resize-y rounded-xl border border-white/16 bg-[#050c18] px-4 pb-3 pt-7 text-sm text-white outline-none transition placeholder:text-transparent focus:border-cyan-200/70"
                />
                <span className="pointer-events-none absolute left-4 top-6 -translate-y-1/2 text-sm text-white/56 transition-all duration-200 ease-out peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-cyan-100 peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.14em] peer-[:not(:placeholder-shown)]:text-cyan-100/86">
                  Message
                </span>
                <span className="pointer-events-none absolute bottom-[1px] left-3 right-3 h-px origin-left scale-x-0 bg-cyan-200/80 transition-transform duration-300 ease-out peer-focus:scale-x-100" />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="mailto:support@techseekho.com"
                  className="rounded-full border border-cyan-200/44 bg-cyan-300/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/18"
                >
                  Send via Email
                </a>
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/56">
                  <span className="h-2 w-2 animate-[softPulse_1.8s_ease-in-out_infinite] rounded-full bg-cyan-200" />
                  Live support active
                </p>
              </div>
            </form>
          </motion.article>

          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            className="space-y-5"
          >
            <motion.h2
              variants={reveal}
              className="text-2xl font-semibold tracking-[-0.03em] text-white"
            >
              Reach us directly
            </motion.h2>

            <div className="divide-y divide-white/10 border-y border-white/10">
              {contactPoints.map((item) => (
                <motion.div key={item.label} variants={reveal} className="py-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-2 inline-block text-lg font-semibold text-white underline-offset-4 transition hover:text-cyan-200 hover:underline"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-2 text-lg font-semibold text-white">
                      {item.value}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-white/66">{item.helper}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={reveal}
              className="rounded-2xl border border-white/12 bg-white/[0.03] p-5"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">
                Need quick direction?
              </p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                If you are deciding between services, check the services page
                and then message us. We will help you pick the right option.
              </p>
              <Link
                href="/landingpage/Pages/services"
                className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/86 transition hover:border-white/40 hover:bg-white/8"
              >
                View Services
              </Link>
            </motion.div>
          </motion.article>
        </section>
      </main>

      <style jsx global>{`
        @keyframes softPulse {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.18);
          }
        }

        @keyframes shimmerLine {
          0% {
            transform: translateX(-30%);
          }
          100% {
            transform: translateX(30%);
          }
        }

        @keyframes fieldFocusGlow {
          0% {
            box-shadow: 0 0 0 rgba(125, 211, 252, 0);
          }
          50% {
            box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.16);
          }
          100% {
            box-shadow: 0 0 0 rgba(125, 211, 252, 0);
          }
        }

        .float-field:focus-within input,
        .float-field:focus-within textarea,
        .float-field:focus-within select {
          animation: fieldFocusGlow 520ms ease-out;
        }
      `}</style>
    </>
  );
};

export default ContactExperience;
