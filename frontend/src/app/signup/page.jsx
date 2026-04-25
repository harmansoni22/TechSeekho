/* biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative inline icons in this component */

"use client";

import { Suspense } from "react";
import SignupForm from "@/app/components/Auth/SignupForm";
import LoginNavbar from "@/app/login/components/LoginNavbar";
import Badge from "../components/ui/Badge";
import CustomScroll from "../landingpage/components/CustomScrollBar";
import GradientText from "../landingpage/components/Effects/TextEffects/GradientText";

const SignUp = () => {
  return (
    <>
      <CustomScroll />
      <main className="grid md:grid-cols-2 min-h-screen bg-[#05050f] relative overflow-hidden font-sans text-white">
        <LoginNavbar />

        {/* LEFT PANEL */}
        <div className="relative hidden md:flex flex-col items-center justify-center pt-24 pb-12 px-8 lg:px-12 bg-gradient-to-br from-[#0a0a1a] via-[#0d0d24] to-[#08081a] overflow-hidden">
          {/* Auroras & Gradients */}
          <div className="absolute -top-[10%] -left-[15%] w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(124,58,237,0.4)_0%,transparent_70%)] animate-pulse" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[450px] h-[450px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(6,182,212,0.3)_0%,transparent_70%)] animate-pulse delay-700" />
          <div className="absolute top-[30%] left-[50%] w-[350px] h-[350px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(236,72,153,0.2)_0%,transparent_70%)] animate-pulse delay-1000" />

          {/* Grid Pattern */}
          <div
            className="absolute inset-0 z-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 75%)",
            }}
          />

          <div className="relative z-1 max-w-lg w-full mt-10">
            {/* <span className="inline-block py-1 px-3.5 text-xs font-semibold text-[#a78bfa] bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-full tracking-wider mb-6">
            Join the community
          </span> */}
            <Badge variant="glass">
              <GradientText fontSize={12}>Join the community</GradientText>
            </Badge>

            <h1 className="text-5xl font-extrabold leading-tight text-white tracking-tight mb-4">
              Unlock your <br />
              {/* <span className="bg-gradient-to-r from-[#a78bfa] via-[#06b6d4] to-[#34d399] text-transparent bg-clip-text">tech potential.</span> */}
              <GradientText
                colors={["#a78bfa", "#06b6d4", "#34d399"]}
                direction="horizontal"
              >
                tech potential.
              </GradientText>
            </h1>

            <p className="text-[1.05rem] text-white/55 leading-relaxed mb-10 max-w-[420px]">
              Join thousands of learners mastering the skills of tomorrow. From
              comprehensive bootcamps to byte-sized masterclasses, we've got
              your journey covered.
            </p>

            <div className="flex flex-col gap-3 mb-10">
              {/* Feature 1 */}
              <div className="flex select-none items-center gap-3.5 p-3.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:translate-x-1.5 cursor-default relative">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#a78bfa]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="img"
                    role="img"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">
                    Industry-led Curriculum
                  </h3>
                  <p className="text-xs text-white/40">
                    Learn the tools and stack top companies are using right now.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center select-none gap-3.5 p-3.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:translate-x-1.5 cursor-default relative">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#06b6d4]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="img"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">
                    Real-world Projects
                  </h3>
                  <p className="text-xs text-white/40">
                    Build a portfolio of hands-on projects to showcase your
                    skills.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center select-none gap-3.5 p-3.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:translate-x-1.5 cursor-default relative">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-[#f43f5e]/10 border border-[#f43f5e]/20 text-[#f43f5e]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="img"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">
                    Recognized Certification
                  </h3>
                  <p className="text-xs text-white/40">
                    Earn certificates integrated straight to your LinkedIn.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex select-none">
                {["JS", "RE", "NX", "UI"].map((initials, i) => {
                  const index = i;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-center w-8 h-8 rounded-full text-[0.65rem] font-bold text-white border-2 border-[#0d0d24] -ml-2.5 first:ml-0"
                      style={{
                        background: [
                          "#4f46e5",
                          "#ec4899",
                          "#06b6d4",
                          "#f59e0b",
                        ][i],
                      }}
                    >
                      {initials}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs select-none text-white/40">
                Join <strong className="text-white/70">10,000+</strong>{" "}
                developers actively learning on TechSeekho.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - FORM */}
        <div className="relative flex items-center justify-center pt-28 pb-12 px-6 lg:px-12 bg-gradient-to-b from-[#080818] via-[#0b0b1e] to-[#0a0a18] min-h-screen">
          <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

          <div className="w-full max-w-[440px] relative z-1">
            <Suspense
              fallback={
                <div className="text-white text-center">Loading form...</div>
              }
            >
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
};

export default SignUp;
