"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Badge from "@/app/components/ui/Badge";
import TechBackground from "../components/backgrounds/ParticleConnecting";
import ProfileCard from "../../components/cards/ProfileCard";
import ElectricBorder from "../../components/Effects/ElectricBorder";
import {
  ABOUT_CTA_CONTENT,
  ABOUT_HERO_CONTENT,
  ABOUT_METHOD_CONTENT,
  ABOUT_METHOD_STEPS,
  ABOUT_POSITIONING_CONTENT,
  ABOUT_PROOF_STRIP,
  ABOUT_STORY_CONTENT,
  ABOUT_TEAM_CONTENT,
} from "../config/aboutUsContent";
import { OUR_TEAM_MEMBERS } from "../config/ourTeamContent";

const revealTransition = {
  duration: 0.62,
  ease: [0.22, 1, 0.36, 1],
};

function reveal(reduceMotion, delay = 0, amount = 0.25) {
  return {
    initial: reduceMotion ? {} : { opacity: 0, y: 28 },
    whileInView: reduceMotion ? {} : { opacity: 1, y: 0 },
    viewport: { once: true, amount },
    transition: { ...revealTransition, delay },
  };
}

function SectionLabel({ children }) {
  return (
    <p className="font-[family:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.34em] text-cyan-100/72">
      {children}
    </p>
  );
}

export default function AboutShowcase() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative isolate overflow-hidden bg-[#040816] text-white">
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_8%_0%,rgba(74,184,255,0.14),transparent_34%),radial-gradient(circle_at_92%_22%,rgba(92,112,255,0.14),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(37,128,255,0.1),transparent_42%)]" />

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <TechBackground isFixed={false} />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,9,22,0.52),rgba(3,9,22,0.92))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(137,221,255,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(101,98,255,0.18),transparent_34%)]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-7xl flex-col justify-center px-4 pb-14 pt-24 sm:px-6 sm:pt-28 lg:pb-20">
          <motion.div
            {...reveal(reduceMotion, 0, 0.2)}
            className="mx-auto max-w-5xl text-center"
          >
            <SectionLabel>{ABOUT_HERO_CONTENT.eyebrow}</SectionLabel>

            <div className="relative mt-7">
              <h1 className="mx-auto max-w-4xl text-[clamp(2.2rem,7vw,4.6rem)] font-semibold leading-[0.94] tracking-[-0.045em] text-white [text-shadow:0_10px_30px_rgba(0,0,0,0.55)]">
                {ABOUT_HERO_CONTENT.title}
              </h1>
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-24 w-[70%] -translate-y-1/2 bg-[radial-gradient(circle,rgba(154,224,255,0.35),transparent_70%)] blur-2xl" />
            </div>

            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              {ABOUT_HERO_CONTENT.description}
            </p>

            <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
              <Link href={ABOUT_HERO_CONTENT.primaryButtonHref}>
                <ElectricBorder
                  color="#6eb8ff"
                  hoveredColor="#e9f6ff"
                  chaos={0.04}
                  speed={0.55}
                  className="rounded-full px-6 py-3"
                >
                  <span className="text-sm font-semibold text-white">
                    {ABOUT_HERO_CONTENT.primaryButtonLabel}
                  </span>
                </ElectricBorder>
              </Link>

              <Link
                href={ABOUT_HERO_CONTENT.secondaryButtonHref}
                className="rounded-full border border-white/22 px-6 py-3 text-sm font-semibold text-white/88 transition hover:border-white/40 hover:bg-white/8"
              >
                {ABOUT_HERO_CONTENT.secondaryButtonLabel}
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {ABOUT_HERO_CONTENT.notes.map((item, index) => (
                <motion.span
                  key={item}
                  {...reveal(reduceMotion, 0.07 * (index + 1), 0.8)}
                  className="rounded-full border border-white/14 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/76"
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {ABOUT_PROOF_STRIP.map((item, index) => (
              <motion.div
                key={item.label}
                {...reveal(reduceMotion, 0.05 * index, 0.8)}
                className="border border-white/12 bg-[#081324]/70 px-5 py-4 backdrop-blur-sm"
              >
                <p className="text-3xl font-semibold tracking-[-0.05em] text-white">
                  {item.value}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.26em] text-cyan-100/68">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_30%,rgba(255,188,96,0.16),transparent_34%),radial-gradient(circle_at_100%_70%,rgba(255,107,121,0.15),transparent_38%),linear-gradient(145deg,rgba(24,12,22,0.5),rgba(8,12,22,0.8))]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(120deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:80px_80px]" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:py-28">
          <motion.div
            {...reveal(reduceMotion, 0, 0.25)}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <SectionLabel>{ABOUT_STORY_CONTENT.eyebrow}</SectionLabel>
            <h2 className="mt-5 max-w-[18ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
              {ABOUT_STORY_CONTENT.title}
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/64">
              {ABOUT_STORY_CONTENT.description}
            </p>
          </motion.div>

          <div className="space-y-10">
            {ABOUT_STORY_CONTENT.principles.map((item, index) => (
              <motion.article
                key={item.title}
                {...reveal(reduceMotion, 0.08 * index, 0.35)}
                className="border-b border-white/10 pb-8"
              >
                <p className="font-[family:var(--font-geist-mono)] text-xs uppercase tracking-[0.3em] text-cyan-100/44">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-[clamp(1.7rem,3vw,2.6rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-white">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/64 sm:text-base">
                  {item.text}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_85%,rgba(87,209,255,0.14),transparent_36%),radial-gradient(circle_at_88%_15%,rgba(76,117,255,0.18),transparent_36%),linear-gradient(180deg,rgba(8,15,34,0.82),rgba(4,9,20,0.9))]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:120px_120px]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <motion.div
            {...reveal(reduceMotion, 0, 0.25)}
            className="mx-auto max-w-3xl text-center"
          >
            <SectionLabel>{ABOUT_METHOD_CONTENT.eyebrow}</SectionLabel>
            <h2 className="mx-auto mt-5 max-w-[18ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
              {ABOUT_METHOD_CONTENT.title}
            </h2>
            <p className="mt-6 text-base leading-8 text-white/64">
              {ABOUT_METHOD_CONTENT.description}
            </p>
          </motion.div>

          <div className="mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:overflow-visible">
            {ABOUT_METHOD_STEPS.map((item, index) => (
              <motion.article
                key={item.id}
                {...reveal(reduceMotion, 0.06 * index, 0.4)}
                className="min-w-[78vw] snap-center border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:min-w-[48vw] lg:min-w-0"
              >
                <p className="font-[family:var(--font-geist-mono)] text-xs uppercase tracking-[0.28em] text-cyan-100/52">
                  {item.id}
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/64">
                  {item.text}
                </p>
                <p className="mt-5 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.24em] text-cyan-100/68">
                  {item.signal}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(121,255,214,0.15),transparent_36%),radial-gradient(circle_at_82%_82%,rgba(68,199,255,0.14),transparent_34%),linear-gradient(155deg,rgba(7,24,28,0.76),rgba(4,11,24,0.92))]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.09] [background-image:linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-18 lg:py-28">
          <motion.div {...reveal(reduceMotion, 0, 0.25)}>
            <SectionLabel>{ABOUT_POSITIONING_CONTENT.eyebrow}</SectionLabel>
            <h2 className="mt-5 max-w-[18ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
              {ABOUT_POSITIONING_CONTENT.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/64">
              {ABOUT_POSITIONING_CONTENT.description}
            </p>

            <div className="mt-10 space-y-3">
              {ABOUT_POSITIONING_CONTENT.manifesto.map((item, index) => (
                <motion.p
                  key={item}
                  {...reveal(reduceMotion, 0.04 * index, 0.8)}
                  className="text-sm uppercase tracking-[0.22em] text-cyan-100/72"
                >
                  {item}
                </motion.p>
              ))}
            </div>
          </motion.div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {ABOUT_POSITIONING_CONTENT.profiles.map((item, index) => (
              <motion.article
                key={item.profile}
                {...reveal(reduceMotion, 0.06 * index, 0.45)}
                className="grid gap-5 py-6 sm:grid-cols-[0.95fr_1.05fr]"
              >
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">
                  {item.profile}
                </h3>
                <p className="max-w-xl text-sm leading-7 text-white/64">
                  {item.outcome}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_6%_45%,rgba(173,122,255,0.17),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(98,206,255,0.14),transparent_34%),linear-gradient(170deg,rgba(22,10,36,0.7),rgba(6,12,24,0.9))]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:100%_64px]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <motion.div
            {...reveal(reduceMotion, 0, 0.25)}
            className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="max-w-2xl">
              <SectionLabel>{ABOUT_TEAM_CONTENT.eyebrow}</SectionLabel>
              <h2 className="mt-5 max-w-[18ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                {ABOUT_TEAM_CONTENT.heading}
              </h2>
              <p className="mt-6 text-base leading-8 text-white/64">
                {ABOUT_TEAM_CONTENT.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {ABOUT_TEAM_CONTENT.values.map((item) => (
                <Badge
                  key={item}
                  variant="glass"
                  className="px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/80"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </motion.div>

          <div
            className="
              mt-12 flex gap-4 overflow-x-auto px-1 pb-6
              [scrollbar-width:none] [-ms-overflow-style:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {OUR_TEAM_MEMBERS.map((profile, index) => (
              <motion.div
                key={profile.handle}
                {...reveal(reduceMotion, 0.05 * index, 0.2)}
                className="shrink-0"
              >
                <ProfileCard
                  name={profile.name}
                  title={profile.title}
                  handle={profile.handle}
                  status={profile.status}
                  avatarUrl={profile.avatarUrl}
                  miniAvatarUrl={profile.miniAvatarUrl}
                  iconUrl={profile.iconUrl}
                  enableMobileTilt={false}
                  behindGlowColor
                  grainUrl={profile.grainUrl}
                  className="origin-top scale-[0.76] sm:scale-[0.86] lg:scale-[0.96]"
                  contactText={ABOUT_TEAM_CONTENT.contactText}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(119,216,255,0.2),transparent_40%),radial-gradient(circle_at_12%_92%,rgba(83,98,255,0.16),transparent_34%),linear-gradient(180deg,rgba(7,14,30,0.9),rgba(4,9,18,0.98))]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <motion.div
            {...reveal(reduceMotion, 0, 0.25)}
            className="relative overflow-hidden rounded-[2.35rem] border border-white/10 bg-[linear-gradient(138deg,rgba(8,24,40,0.96),rgba(4,10,18,0.92))] px-6 py-12 text-center shadow-[0_32px_110px_rgba(0,0,0,0.42)] sm:px-10 sm:py-16"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(132,214,255,0.2),transparent_44%)]" />
            <div className="relative">
              <SectionLabel>{ABOUT_CTA_CONTENT.eyebrow}</SectionLabel>
              <h2 className="mx-auto mt-5 max-w-[18ch] text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                {ABOUT_CTA_CONTENT.heading}
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/64">
                {ABOUT_CTA_CONTENT.description}
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={ABOUT_CTA_CONTENT.primaryButtonHref}
                  className="rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-white/88 transition hover:border-white/32 hover:bg-white/6"
                >
                  {ABOUT_CTA_CONTENT.primaryButtonLabel}
                </Link>
                <Link href={ABOUT_CTA_CONTENT.secondaryButtonHref}>
                  <ElectricBorder
                    color="#7ec8ff"
                    hoveredColor="#ffffff"
                    chaos={0.04}
                    speed={0.55}
                    className="rounded-full px-6 py-3"
                  >
                    <span className="text-sm font-semibold text-white">
                      {ABOUT_CTA_CONTENT.secondaryButtonLabel}
                    </span>
                  </ElectricBorder>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
