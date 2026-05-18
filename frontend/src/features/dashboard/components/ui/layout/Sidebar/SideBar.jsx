"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const navItems = [
	{
		href: "/dashboard",
		label: "Dashboard",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
				<path d="M9 22V12h6v10" />
			</svg>
		),
	},
	{
		href: "/dashboard/courses",
		label: "My Courses",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
				<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5z" />
				<path d="M8 6h8" />
				<path d="M8 10h8" />
				<path d="M8 14h5" />
			</svg>
		),
	},
	{
		href: "/dashboard/learning",
		label: "Active Learning",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<path d="M10 8l6 4-6 4V8z" />
			</svg>
		),
	},
	{
		href: "/dashboard/skill-labs",
		label: "Skill Labs",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M8 2h8" />
				<path d="M9 2l-.5 7.5A4.5 4.5 0 0 0 13 14.9V19H8v-4.1A4.5 4.5 0 0 0 9.5 9.5L9 2z" />
				<path d="M15 2l.5 7.5A4.5 4.5 0 0 1 11 14.9V19h5v-4.1A4.5 4.5 0 0 1 14.5 9.5L15 2z" />
			</svg>
		),
	},
	{
		href: "/dashboard/ai-companion",
		label: "AI Study Companion",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M12 20a8 8 0 1 0-8-8" />
				<path d="M12 4a8 8 0 0 1 8 8" />
				<path d="M12 12h4" />
				<path d="M12 16h4" />
			</svg>
		),
	},
	{
		href: "/dashboard/certifications",
		label: "Certification Paths",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M12 20l4 2V12" />
				<path d="M12 20l-4 2V12" />
				<path d="M20 6l-8-4-8 4v10a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V6z" />
			</svg>
		),
	},
	{
		href: "/dashboard/analytics",
		label: "Analytics",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M4 19h16" />
				<path d="M7 15v4" />
				<path d="M12 11v8" />
				<path d="M17 7v12" />
			</svg>
		),
	},
	{
		href: "/dashboard/community",
		label: "Community",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M17 21v-2a4 4 0 0 0-3-3.87" />
				<path d="M7 21v-2a4 4 0 0 1 3-3.87" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		),
	},
	{
		href: "/dashboard/leaderboard",
		label: "Leaderboard",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" />
				<path d="M5 8h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z" />
				<path d="M9 12h6" />
			</svg>
		),
	},
	{
		href: "/dashboard/mentors",
		label: "Mentor Network",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M12 12a4 4 0 1 0-4-4" />
				<path d="M8 20v-4a4 4 0 0 1 4-4h4" />
				<path d="M18 8h2a2 2 0 0 1 2 2v4" />
			</svg>
		),
	},
	{
		href: "/dashboard/jobs",
		label: "Job Board",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
				<path d="M16 7V4a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v3" />
			</svg>
		),
	},
	{
		href: "/dashboard/rewards",
		label: "Rewards Store",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
				<path d="M2 7h20" />
				<path d="M12 7a4 4 0 0 1 4 4v6" />
				<path d="M12 7a4 4 0 0 0-4 4v6" />
			</svg>
		),
	},
	{
		href: "/dashboard/settings",
		label: "Settings",
		icon: (
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<circle cx="12" cy="12" r="3" />
				<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.6 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .65.39 1.23 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09c-.65 0-1.23.39-1.51 1z" />
			</svg>
		),
	},
];

const SideBar = () => {
	const pathname = usePathname();

	return (
		<aside
			className="w-full border-b flex flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0 md:overflow-hidden backdrop-blur"
			style={{
				backgroundColor: "color-mix(in srgb, var(--dashboard-surface) 92%, transparent)",
				borderColor: "var(--dashboard-border)",
			}}
		>
			<div className="mb-6 p-4 flex-shrink-0">
				<p
					className="text-xs font-semibold uppercase tracking-[0.16em]"
					style={{ color: "var(--dashboard-muted)" }}
				>
					TechSeekho
				</p>
				<h2 className="text-xl font-semibold" style={{ color: "var(--dashboard-fg)" }}>
					Dashboard
				</h2>
			</div>

			<nav className="flex flex-col overflow-y-auto gap-2 px-4 flex-1" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--dashboard-primary) transparent" }}>
				{navItems.map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"rounded-sm px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "text-white"
									: "hover:opacity-90",
							)}
							style={
								isActive
									? {
										backgroundColor: "var(--dashboard-primary)",
										color: "var(--dashboard-primary-fg)",
									}
									: {
										color: "var(--dashboard-muted)",
										backgroundColor:
											"color-mix(in srgb, var(--dashboard-surface) 88%, var(--dashboard-primary) 12%)",
									}
							}
						>
							<span className="inline-flex items-center gap-2">
								{item.icon}
								<span>{item.label}</span>
							</span>
						</Link>
					);
				})}
			</nav>

			<div className="mt-4 border-t p-4 flex-shrink-0" style={{ borderColor: "var(--dashboard-border)" }}>
				<div className="flex flex-col gap-2">
					<Link
						href="/dashboard/profile"
						className="inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium transition-colors hover:opacity-90"
						style={{ borderColor: "var(--dashboard-border)", color: "var(--dashboard-fg)" }}
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M20 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M4 21v-2a4 4 0 0 1 3-3.87" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						<span>Profile</span>
					</Link>
					<button
						type="button"
						className="inline-flex items-center justify-center gap-2 rounded-sm bg-[var(--dashboard-primary)] px-3 py-2 text-sm font-medium text-[var(--dashboard-primary-fg)] transition-colors hover:opacity-90"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<path d="M16 17l5-5-5-5" />
							<path d="M21 12H9" />
						</svg>
						<span>Sign Out</span>
					</button>
				</div>
			</div>
		</aside>
	);
};

export default SideBar;
