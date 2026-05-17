/* biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative inline icons in this component */

"use client";

import { Suspense } from "react";
import LoginForm from "@/app/components/Auth/LoginForm";
import LoginNavbar from "./components/LoginNavbar";
import Badge from "../components/ui/Badge";
import CustomScroll from "../landingpage/components/CustomScrollBar";
import GradientText from "../landingpage/components/Effects/TextEffects/GradientText";

const LogIn = () => {
	return (
		<>
			<CustomScroll />
			<main className="grid md:grid-cols-2 min-h-screen bg-[#05050f] relative overflow-hidden font-sans text-white">
				<LoginNavbar />

				<div className="relative flex items-center justify-center pt-28 pb-12 px-6 lg:px-12 bg-gradient-to-b from-[#080818] via-[#0b0b1e] to-[#0a0a18] min-h-screen">
					<div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

					<div className="w-full max-w-[440px] relative z-1">
						<Suspense
							fallback={
								<div className="text-white text-center">Loading form...</div>
							}
						>
							<LoginForm />
						</Suspense>
					</div>
				</div>

				<div className="relative hidden md:flex flex-col items-center justify-center pt-24 pb-12 px-8 lg:px-12 bg-gradient-to-br from-[#0a0a1a] via-[#0d0d24] to-[#08081a] overflow-hidden">
					<div className="absolute -top-[10%] -left-[15%] w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(124,58,237,0.4)_0%,transparent_70%)] animate-pulse" />
					<div className="absolute -bottom-[20%] -right-[10%] w-[450px] h-[450px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(6,182,212,0.3)_0%,transparent_70%)] animate-pulse delay-700" />
					<div className="absolute top-[30%] left-[50%] w-[350px] h-[350px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(236,72,153,0.2)_0%,transparent_70%)] animate-pulse delay-1000" />

					<div
						className="absolute inset-0 z-0 opacity-40 pointer-events-none"
						style={{
							backgroundImage:
								"linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
							backgroundSize: "60px 60px",
							WebkitMaskImage:
								"radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 75%)",
						}}
					/>

					<div className="relative z-1 max-w-lg w-full mt-10">
						<Badge variant="glass">
							<GradientText fontSize={12}>Welcome back</GradientText>
						</Badge>

						<h1 className="text-5xl font-extrabold leading-tight text-white tracking-tight mb-4">
							Continue your
							<br />
							<GradientText
								colors={["#a78bfa", "#06b6d4", "#34d399"]}
								direction="horizontal"
							>
								learning streak.
							</GradientText>
						</h1>

						<p className="text-[1.05rem] text-white/55 leading-relaxed mb-10 max-w-[420px]">
							Pick up exactly where you left off. Access your dashboard, saved
							tracks, and personalized roadmap in seconds.
						</p>

						<div className="flex flex-col gap-3 mb-10">
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
									>
										<path d="M12 20V10" />
										<path d="m18 20-6-10-6 10" />
										<path d="M12 4h.01" />
									</svg>
								</div>
								<div>
									<h3 className="text-sm font-semibold text-white mb-0.5">
										Resume Courses Faster
									</h3>
									<p className="text-xs text-white/40">
										Jump back into active modules with one click.
									</p>
								</div>
							</div>

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
									>
										<path d="M3 3v18h18" />
										<path d="m19 9-5 5-4-4-3 3" />
									</svg>
								</div>
								<div>
									<h3 className="text-sm font-semibold text-white mb-0.5">
										Track Your Progress
									</h3>
									<p className="text-xs text-white/40">
										Keep momentum with streaks, checkpoints, and milestones.
									</p>
								</div>
							</div>

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
									>
										<path d="M20 6 9 17l-5-5" />
									</svg>
								</div>
								<div>
									<h3 className="text-sm font-semibold text-white mb-0.5">
										Stay Interview Ready
									</h3>
									<p className="text-xs text-white/40">
										Practice sets and project revisions stay synced to your
										profile.
									</p>
								</div>
							</div>
						</div>

						<div className="text-xs select-none text-white/40">
							Trusted by <strong className="text-white/70">5,000+</strong>{" "}
							learners building careers in tech.
						</div>
					</div>
				</div>

			</main>
		</>
	);
};

export default LogIn;
