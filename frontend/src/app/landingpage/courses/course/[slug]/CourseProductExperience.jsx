"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import CustomScroll from "@/app/landingpage/components/CustomScrollBar";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

function getStatusStyles(status) {
  if (status === "Ongoing") {
    return {
      dot: "bg-red-500",
      chip: "border-red-400/45 text-red-100",
    };
  }

  if (status === "Upcoming") {
    return {
      dot: "bg-green-500",
      chip: "border-green-400/45 text-green-100",
    };
  }

  return {
    dot: "bg-zinc-400",
    chip: "border-zinc-400/40 text-zinc-100",
  };
}

export default function CourseProductExperience({
  course,
  status,
  duration,
  startsLabel,
  endsLabel,
  reviewRows = [],
  _reviewSourceUrl = null,
  coursesBackHref,
}) {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef(null);
  const journeyRef = useRef(null);

  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageScale = useTransform(heroScroll, [0, 1], [1, 1.1]);

  const { scrollYProgress: journeyProgress } = useScroll({
    target: journeyRef,
    offset: ["start 72%", "end 28%"],
  });
  const timelineProgress = useTransform(journeyProgress, [0, 1], [0, 1]);

  const statusStyles = getStatusStyles(status);

  const journeyRows = useMemo(
    () => [
      {
        id: "d1",
        title: "Start",
        value: startsLabel,
        note: "Your first live session and onboarding begins here.",
      },
      {
        id: "d2",
        title: "Build",
        value: `Duration: ${duration}`,
        note: "Learn with practical tasks, code reviews, and mentor guidance.",
      },
      {
        id: "d3",
        title: "Complete",
        value: endsLabel,
        note: "Wrap up the course with a final portfolio-ready outcome.",
      },
      {
        id: "d4",
        title: "Support",
        value: status,
        note: "Track progress and get clear help whenever you are blocked.",
      },
    ],
    [status, startsLabel, endsLabel, duration],
  );

  const outcomeRows = useMemo(
    () => [
      "Simple weekly structure so you always know what to do next.",
      "Hands-on projects that improve your real development confidence.",
      "Direct mentor feedback to reduce confusion and wasted effort.",
      "A clean final output you can show in interviews and your portfolio.",
    ],
    [],
  );

  const fallbackReviews = useMemo(
    () => [
      {
        id: "r1",
        name: "Aarav Sharma",
        role: "Frontend Developer",
        rating: 5,
        quote:
          "The sessions were practical and easy to follow. I finally became consistent with projects.",
      },
      {
        id: "r2",
        name: "Meera Joshi",
        role: "Aspiring Fullstack Engineer",
        rating: 5,
        quote:
          "Mentor feedback was clear and direct. I fixed weak areas quickly and gained confidence.",
      },
      {
        id: "r3",
        name: "Rohan Verma",
        role: "Software Engineer Intern",
        rating: 5,
        quote:
          "What I liked most was the structure. Every week had a clear target and useful output.",
      },
    ],
    [],
  );

  const normalizedReviewRows = useMemo(() => {
    if (Array.isArray(reviewRows) && reviewRows.length > 0) {
      return reviewRows;
    }

    return fallbackReviews;
  }, [reviewRows, fallbackReviews]);

  const marqueeItems = useMemo(
    () => [
      course.title,
      status,
      `Starts ${startsLabel}`,
      `Ends ${endsLabel}`,
      `Duration ${duration}`,
      "Mentor guidance",
      "Project-first learning",
      "Interview focused",
    ],
    [course.title, status, startsLabel, endsLabel, duration],
  );

  return (
    <>
      <CustomScroll />

      <main className="min-h-screen bg-[#02050b] text-white">
        <section
          ref={heroRef}
          className="relative isolate overflow-hidden border-b border-white/10"
        >
          {course.bannerImage ? (
            <motion.div
              style={{ scale: reduceMotion ? 1 : heroImageScale }}
              className="absolute inset-0"
            >
              <Image
                src={course.bannerImage}
                alt={course.title}
                width={1800}
                height={1100}
                priority
                className="h-full w-full object-cover"
              />
            </motion.div>
          ) : null}
          <div className="absolute inset-0 bg-[#02050b]/78" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(65,168,255,0.14),transparent_48%)]" />

          <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-7xl flex-col justify-end px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
            <motion.nav
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="mb-10 text-xs uppercase tracking-[0.2em] text-white/58"
            >
              <Link
                href={coursesBackHref}
                className="transition hover:text-white/88"
              >
                Courses
              </Link>
              <span className="px-2 text-white/34">/</span>
              <span className="text-white/86">{course.title}</span>
            </motion.nav>

            <motion.div>
              <motion.p
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="text-xs uppercase tracking-[0.24em] text-cyan-100/76"
              >
                Course Product
              </motion.p>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="mt-5 max-w-[13ch] origin-left text-[clamp(2.5rem,7vw,6.2rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-white will-change-transform"
              >
                {course.title}
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="mt-7 max-w-2xl text-base leading-8 text-white/74 sm:text-lg"
              >
                {course.description}
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="mt-8 flex flex-wrap gap-3"
              >
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] ${statusStyles.chip}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${statusStyles.dot}`}
                  />
                  {status}
                </span>
                <span className="rounded-full border border-white/16 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-white/78">
                  Duration: {duration}
                </span>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="mt-9 flex flex-wrap gap-3 pb-3"
              >
                <Link
                  href="/signup"
                  className="rounded-full border border-cyan-200/48 px-6 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/14"
                >
                  Enroll Now
                </Link>
                <Link
                  href={coursesBackHref}
                  className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white/88 transition hover:border-white/40 hover:bg-white/8"
                >
                  Back To Courses
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/12 py-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#02050b] to-transparent sm:w-16" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#02050b] to-transparent sm:w-16" />

          <div className="overflow-hidden">
            <motion.div
              aria-hidden
              animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: 20,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }
              }
              className="flex min-w-max items-center gap-3 whitespace-nowrap px-4 sm:px-8"
            >
              {[0, 1].flatMap((copy) =>
                marqueeItems.map((item, index) => (
                  <span
                    key={`marquee-${copy}-${index}-${item}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/16 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/74"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/75" />
                    {item}
                  </span>
                )),
              )}
            </motion.div>
          </div>
        </section>

        <section
          ref={journeyRef}
          className="mx-auto grid w-full max-w-7xl gap-14 border-b border-white/10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            className="lg:self-start"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/74">
              Learning Journey
            </p>
            <h2 className="mt-4 max-w-sm text-[clamp(1.8rem,4.5vw,3rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-white">
              Clean timeline, clear outcomes, zero confusion.
            </h2>
            <p className="mt-5 max-w-md text-base leading-8 text-white/72">
              You can quickly understand what starts when, how long it runs, and
              what support you get before joining.
            </p>
            <Link
              href="/landingpage/contact"
              className="mt-7 inline-flex border-b border-white/26 pb-1 text-xs uppercase tracking-[0.2em] text-white/82 transition hover:text-white"
            >
              Need guidance? Contact team
            </Link>
          </motion.aside>

          <div className="relative pl-8 md:pl-10">
            <div className="absolute bottom-0 left-0 top-0 w-px bg-white/18" />
            <motion.div
              style={{ scaleY: timelineProgress }}
              className="absolute left-0 top-0 w-px origin-top bg-cyan-200"
            />

            <div className="space-y-8">
              {journeyRows.map((row, index) => (
                <motion.article
                  key={row.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.42,
                    delay: index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group relative"
                >
                  <span className="absolute -left-[2.35rem] top-1 h-3 w-3 rounded-full border border-cyan-200/70 bg-[#02050b]" />
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/68">
                    {row.title}
                  </p>
                  <p className="mt-2 text-[1.15rem] text-white/88 transition group-hover:text-white">
                    {row.value}
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-white/62 sm:text-base">
                    {row.note}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/74">
            What You Get
          </p>
          <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {outcomeRows.map((line, index) => (
              <motion.article
                key={line}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.03,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group flex items-start gap-4 py-6"
              >
                <span className="mt-0.5 text-xs uppercase tracking-[0.24em] text-cyan-100/62">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="max-w-3xl text-sm leading-7 text-white/74 transition group-hover:text-white/92 sm:text-base">
                  {line}
                </p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/74">
            Reviews
          </p>
          <h3 className="mt-4 max-w-[18ch] text-2xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Learners share what improved for them.
          </h3>
          {/* {reviewSourceUrl ? (
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/52">
              Reviews API: {reviewSourceUrl}
            </p>
          ) : null} */}

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {normalizedReviewRows.map((review, index) => (
              <motion.article
                key={review.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.38,
                  delay: index * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-2xl border border-white/12 bg-white/[0.03] p-5"
              >
                <div className="flex items-center gap-1 text-cyan-100/95">
                  {Array.from({ length: review.rating || 5 }).map(
                    (_, starIndex) => (
                      <span key={`${review.id}-star-${starIndex}`}>*</span>
                    ),
                  )}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/76 sm:text-base">
                  {review.quote}
                </p>
                <p className="mt-5 text-sm font-semibold text-white">
                  {review.name}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/66">
                  {review.role}
                </p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start justify-between gap-6 border border-white/12 px-6 py-8 sm:flex-row sm:items-end sm:px-8"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/74">
                Start this course
              </p>
              <h3 className="mt-3 max-w-xl text-[clamp(1.6rem,3.6vw,2.6rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
                Build real skills with a clear, structured learning path.
              </h3>
            </div>
            {/* <Link
              href="/signup"
              className="rounded-full border border-cyan-200/48 px-6 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/14"
            >
              Enroll Now
            </Link> */}
            <Link
              href={`/login?next=${encodeURIComponent(`/landingpage/courses/course/${course.slug}?id=${course.id}`)}`}
              className="rounded-full border border-cyan-200/48 px-6 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/14"
            >
              Enroll Now
            </Link>
          </motion.div>
        </section>
      </main>
    </>
  );
}
