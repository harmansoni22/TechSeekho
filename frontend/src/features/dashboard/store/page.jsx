"use client";

import Link from "next/link";

const sections = [
	{
		title: "Courses",
		description: "Manage and browse all learning programs available in the store.",
		href: "/dashboard/store/courses",
	},
	{
		title: "Products",
		description: "Explore kits, tools, and resources available for purchase.",
		href: "/dashboard/store/products",
	},
];

export default function StorePage() {
	return (
		<div className="space-y-6 p-6 md:p-8" style={{ color: "var(--dashboard-fg)" }}>
			<div>
				<h1 className="text-3xl font-semibold" style={{ color: "var(--dashboard-fg)" }}>
					Store
				</h1>
				<p className="mt-2 text-sm" style={{ color: "var(--dashboard-muted)" }}>
					Select a section to manage catalog items.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{sections.map((section) => (
					<Link
						key={section.title}
						href={section.href}
						className="rounded-2xl border p-5 transition"
						style={{
							borderColor: "var(--dashboard-border)",
							backgroundColor:
								"color-mix(in srgb, var(--dashboard-surface) 94%, var(--dashboard-primary) 6%)",
						}}
					>
						<h2 className="text-xl font-semibold" style={{ color: "var(--dashboard-fg)" }}>
							{section.title}
						</h2>
						<p className="mt-2 text-sm" style={{ color: "var(--dashboard-muted)" }}>
							{section.description}
						</p>
						<span
							className="mt-4 inline-block text-sm font-medium"
							style={{ color: "var(--dashboard-primary)" }}
						>
							Open {section.title}
						</span>
					</Link>
				))}
			</div>
		</div>
	);
}
