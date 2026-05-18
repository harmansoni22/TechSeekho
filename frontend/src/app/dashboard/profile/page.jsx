"use client";

import Link from "next/link";
import Card from "@/app/components/ui/Card";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import Button from "@/app/components/ui/button";

const Profile = () => {
	const { metrics } = useDashboardData();

	const profile = {
		name: "TechSeekho Learner",
		email: "test@techseekho.com",
		track: "Full Stack + DSA",
		goal: "Become job-ready in 6 months",
		level: "Intermediate",
		joined: "Jan 2026",
		weeklyTarget: "20 learning hours",
	};

	const statCards = [
		{
			label: "Learning streak",
			value: `${metrics?.currentStreak ?? 0} days`,

			hint: "Keep your momentum alive",
		},
		{
			label: "Certificates",
			value: metrics?.certificatesEarned ?? 0,
			hint: "Milestones completed",
		},
		{
			label: "Completion",
			value: `${metrics?.completionRate ?? 0}%`,
			hint: "Across your active roadmap",
		},
	];

	const legalLinks = [
		{ title: "Privacy Policy", href: "/dashboard/legal/privacy-policy" },
		{ title: "Terms & Conditions", href: "/dashboard/legal/terms-and-conditions" },
		{ title: "Refund Policy", href: "/dashboard/legal/refund-policy" },
	];

	const DangerZoneActions = [
		{
			title: "Sign Out",
			action: "Signout from Account",
			label: "Sign Out",
			icon: (
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              		<path d="M16 17l5-5-5-5" />
              		<path d="M21 12H9" />
            	</svg>
			)
		},
		{
			title: "Account Delete",
			action: "Delete User's Account",
			label: "Delete your ACCOUNT!",
			icon: (
				<svg xmlns="http://w3.org" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  					<path d="M3 6h18"></path>
  					<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
  					<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
				</svg>
			)
		}
	]

	return (
		<div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
			<TopBar title="Profile" subtitle="Your account snapshot, progress, and milestones" />

			<section className="grid gap-4 lg:grid-cols-4">
				<Card
					className="border p-5 md:p-6 lg:col-span-4"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex items-start gap-4">
							<div
								className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold"
								style={{
									background:
										"linear-gradient(135deg, var(--dashboard-accent-soft), var(--dashboard-accent))",
									color: "white",
								}}
							>
								TL
							</div>

							<div className="space-y-2">
								<div>
									<h2 className="text-xl font-semibold" style={{ color: "var(--dashboard-fg)" }}>
										{profile.name}
									</h2>
									<p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
										{profile.email}
									</p>
								</div>

								<div className="flex flex-wrap gap-2">
									{["Active learner", profile.track, profile.level].map((item) => (
										<span
											key={item}
											className="rounded-full border px-3 py-1 text-xs font-medium"
											style={{
												borderColor: "var(--dashboard-border)",
												color: "var(--dashboard-muted)",
												backgroundColor: "var(--dashboard-bg-subtle)",
											}}
										>
											{item}
										</span>
									))}
								</div>
							</div>
						</div>

						<div className="flex gap-2">
							<button
								className="rounded-xl px-4 py-2 text-sm font-medium transition"
								style={{
									backgroundColor: "var(--dashboard-accent)",
									color: "white",
								}}
							>
								Edit Profile
							</button>
							<button
								className="rounded-xl border px-4 py-2 text-sm font-medium transition"
								style={{
									borderColor: "var(--dashboard-border)",
									color: "var(--dashboard-fg)",
									backgroundColor: "transparent",
								}}
							>
								Share
							</button>
						</div>
					</div>

					<div className="mt-6 grid gap-3 sm:grid-cols-3">
						<div
							className="rounded-2xl border p-4"
							style={{
								borderColor: "var(--dashboard-border)",
								backgroundColor: "var(--dashboard-bg-subtle)",
							}}
						>
							<p className="text-xs uppercase tracking-wide" style={{ color: "var(--dashboard-muted)" }}>
								Joined
							</p>
							<p className="mt-2 text-sm font-medium">{profile.joined}</p>
						</div>

						<div
							className="rounded-2xl border p-4"
							style={{
								borderColor: "var(--dashboard-border)",
								backgroundColor: "var(--dashboard-bg-subtle)",
							}}
						>
							<p className="text-xs uppercase tracking-wide" style={{ color: "var(--dashboard-muted)" }}>
								Goal
							</p>
							<p className="mt-2 text-sm font-medium">{profile.goal}</p>
						</div>

						<div
							className="rounded-2xl border p-4"
							style={{
								borderColor: "var(--dashboard-border)",
								backgroundColor: "var(--dashboard-bg-subtle)",
							}}
						>
							<p className="text-xs uppercase tracking-wide" style={{ color: "var(--dashboard-muted)" }}>
								Weekly target
							</p>
							<p className="mt-2 text-sm font-medium">{profile.weeklyTarget}</p>
						</div>
					</div>
				</Card>

				<Card
					className="border p-5 md:p-6 lg:col-span-2"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
							Overall Progress
						</h3>
						<span
							className="rounded-full px-3 py-1 text-xs font-semibold"
							style={{
								backgroundColor: "var(--dashboard-accent-soft)",
								color: "var(--dashboard-accent)",
							}}
						>
						{metrics?.completionRate ?? 0}%
						</span>
					</div>

					<div className="mt-5">
						<div
							className="h-3 w-full overflow-hidden rounded-full"
							style={{ backgroundColor: "var(--dashboard-bg-subtle)" }}
						>
							<div
								className="h-full rounded-full"
								style={{
									width: `${metrics?.completionRate ?? 0}%`,
									background:
										"linear-gradient(90deg, var(--dashboard-accent), var(--dashboard-accent-soft))",
								}}
							/>
						</div>
						<p className="mt-3 text-sm" style={{ color: "var(--dashboard-muted)" }}>
							You are steadily progressing through your roadmap. Stay consistent to hit your 6-month target.
						</p>
					</div>

					<div className="mt-6 space-y-3">
						{statCards.map((stat) => (
							<div
								key={stat.label}
								className="rounded-2xl border p-4"
								style={{
									borderColor: "var(--dashboard-border)",
									backgroundColor: "var(--dashboard-bg-subtle)",
								}}
							>
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-medium">{stat.label}</p>
									<p className="text-base font-semibold">{stat.value}</p>
								</div>
								<p className="mt-1 text-xs" style={{ color: "var(--dashboard-muted)" }}>
									{stat.hint}
								</p>
							</div>
						))}
					</div>
				</Card>
			{/* </section>

			<section className="grid gap-4 lg:grid-cols-2"> */}
				<Card
					className="border p-5 md:p-6 lg:col-span-2"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
						Account Details
					</h3>

					<div className="mt-5 space-y-4">
						{[
							{ label: "Full name", value: profile.name },
							{ label: "Email address", value: profile.email },
							{ label: "Learning track", value: profile.track },
							{ label: "Primary goal", value: profile.goal },
						].map((item) => (
							<div
								key={item.label}
								className="flex items-start justify-between gap-4 border-b pb-3 text-sm"
								style={{ borderColor: "var(--dashboard-border)" }}
							>
								<span style={{ color: "var(--dashboard-muted)" }}>{item.label}</span>
								<span className="max-w-[60%] text-right font-medium">{item.value}</span>
							</div>
						))}
					</div>
				</Card>

				<Card
					className="border p-5 md:p-6 lg:col-span-4"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
						Personal Milestones
					</h3>

					<div className="mt-5 space-y-3">
						{[
							"Completed onboarding successfully",
							"Maintained a consistent learning streak",
							"Earned first course certificate",
							"Crossed halfway progress in roadmap",
						].map((item, index) => (
							<div
								key={item}
								className="flex items-start gap-3 rounded-2xl border p-4"
								style={{
									borderColor: "var(--dashboard-border)",
									backgroundColor: "var(--dashboard-bg-subtle)",
								}}
							>
								<div
									className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
									style={{
										backgroundColor: "var(--dashboard-accent-soft)",
										color: "var(--dashboard-accent)",
									}}
								>
									{index + 1}
								</div>
								<p className="text-sm font-medium">{item}</p>
							</div>
						))}
					</div>
				</Card>

				<Card
					className="border p-5 md:p-6 lg:col-span-2"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<h3 className="text-lg font-semibold text-red-500">
						Danger Zone
					</h3>
					<p className="mt-2 text-sm text-red-300">
						Think before you click! Make sure you think 2 times before clicking here.
					</p>
					<div className="mt-4 space-y-2 flex flex-col">
						{DangerZoneActions.map((action, index) => (
							<Button
								variant={index % 2 === 0 ? "ghost" : "danger"}
								className={`px-3 py-2 text-sm transition hover:opacity-90 cursor-pointer`}
								key={action.title}
							>
								{action.label}
							</Button>
						))}
					</div>
				</Card>

				<Card
					className="border p-5 md:p-6 lg:col-span-2"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
						Legal
					</h3>
					<p className="mt-2 text-sm" style={{ color: "var(--dashboard-muted)" }}>
						Review important platform policies.
					</p>
					<div className="mt-4 space-y-2">
						{legalLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="block rounded-xl border px-3 py-2 text-sm transition hover:opacity-90"
								style={{
									borderColor: "var(--dashboard-border)",
									color: "var(--dashboard-fg)",
									backgroundColor: "var(--dashboard-bg-subtle)",
								}}
							>
								{link.title}
							</Link>
						))}
					</div>
				</Card>
			</section>
		</div>
	);
};

export default Profile;
