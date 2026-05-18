"use client";

import { useEffect, useState } from "react";

const TopBar = ({ title = "Overview", subtitle = "Track platform progress" }) => {
	const [updatedDate, setUpdatedDate] = useState("...");

	useEffect(() => {
		setUpdatedDate(new Date().toLocaleDateString("en-IN"));
	}, []);

	return (
		<header
			className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
			style={{
				backgroundColor: "var(--dashboard-surface)",
				borderColor: "var(--dashboard-border)",
				boxShadow: "var(--dashboard-shadow)",
			}}
		>
			<div>
				<h1 className="text-2xl font-semibold" style={{ color: "var(--dashboard-fg)" }}>
					{title}
				</h1>
				<p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
					{subtitle}
				</p>
			</div>

			<div
				className="rounded-lg border px-3 py-2 text-sm"
				style={{
					backgroundColor: "color-mix(in srgb, var(--dashboard-surface) 82%, var(--dashboard-primary) 18%)",
					borderColor: "var(--dashboard-border)",
					color: "var(--dashboard-fg)",
				}}
			>
				Updated: {updatedDate}
			</div>
		</header>
	);
};

export default TopBar;
