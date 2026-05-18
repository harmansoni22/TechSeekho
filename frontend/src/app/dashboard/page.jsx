"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";

const Dashboard = () => {
	const {
		kpis,
		topCourses,
		recentActivity,
		dailyGoals,
		currentStreak,
		quickAccessLessons,
		loading,
		error,
	} = useDashboardData();

	if (loading) {
		return (
			<div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
				<TopBar
					title="My Learning Dashboard"
					subtitle="Loading your institutional dashboard..."
				/>
				<Card
					className="border"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
						Loading dashboard data...
					</p>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
				<TopBar
					title="My Learning Dashboard"
					subtitle="Unable to load dashboard"
				/>
				<Card
						className="border"
						style={{
							borderColor: "var(--dashboard-border)",
							backgroundColor: "var(--dashboard-surface)",
						}}
				>
					<p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
						{error}
					</p>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>

			<TopBar
				title="My Learning Dashboard"
				subtitle="Track your progress, consistency, and course momentum"
			/>

			{/* KPIs Section */}
			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{kpis.map((item) => (
					<Card
						key={item.label}
						className="border"
						style={{
							borderColor: "var(--dashboard-border)",
							backgroundColor: "var(--dashboard-surface)",
						}}
					>
						<p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
							{item.label}
						</p>
						<p
							className="mt-2 text-2xl font-semibold"
							style={{ color: "var(--dashboard-fg)" }}
						>
							{item.value}
						</p>
						<p
							className="mt-1 text-xs font-medium"
							style={{ color: "var(--dashboard-accent)" }}
						>
							{item.delta}
						</p>
					</Card>
				))}
			</section>

			{/* Daily Goals and Streak */}
			<section className="grid gap-4 lg:grid-cols-2">
				<Card
					className="border"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
						Daily Goals
					</h3>
					<div className="mt-4 space-y-3">
						{dailyGoals.map((goal, index) => (
							<div key={index} className="flex items-center justify-between">
								<span className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
									{goal.label}
								</span>
								<div className="flex items-center space-x-2">
									<div className="w-20 bg-gray-200 rounded-full h-2">
										<div
											className="h-2 rounded-full"
											style={{
												width: `${goal.progress}%`,
												backgroundColor: "var(--dashboard-accent)",
											}}
										></div>
									</div>
									<span className="text-xs font-medium" style={{ color: "var(--dashboard-fg)" }}>
										{goal.progress}%
									</span>
								</div>
							</div>
						))}
					</div>
				</Card>

				<Card
					className="border"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
						Learning Streak
					</h3>
					<div className="mt-4 text-center">
						<p className="text-4xl font-bold" style={{ color: "var(--dashboard-accent)" }}>
							{currentStreak} days
						</p>
						<p className="text-sm mt-2" style={{ color: "var(--dashboard-muted)" }}>
							Keep it up! Your longest streak is 14 days.
						</p>
						<div className="mt-4 flex justify-center gap-2">
							{Array.from({ length: 7 }, (_, i) => {
								const active = i < Math.min(currentStreak, 7);
								return (
									<span
										key={i}
										className="inline-flex h-8 w-8 items-center justify-center rounded-full"
										style={{
											backgroundColor: active ? "rgba(249, 115, 22, 0.16)" : "rgba(148, 163, 184, 0.16)",
										}}
										aria-label={`Day ${i + 1} ${active ? "active" : "inactive"}`}
									>
										<span
											className="text-xl"
											style={{ color: active ? "var(--dashboard-primary)" : "var(--dashboard-muted)" }}
										>
											🔥
										</span>
									</span>
								);
							})}
						</div>
					</div>
				</Card>
			</section>

			{/* Quick Access to Current Lessons */}
			<Card
				className="border"
				style={{
					borderColor: "var(--dashboard-border)",
					backgroundColor: "var(--dashboard-surface)",
				}}
			>
				<h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
					Continue Learning
				</h3>
				<div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{quickAccessLessons.map((lesson) => (
						<div
							key={lesson.id}
							className="rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
							style={{
								borderColor: "var(--dashboard-border)",
								backgroundColor: "var(--dashboard-surface)",
							}}
						>
							<h4 className="font-medium" style={{ color: "var(--dashboard-fg)" }}>
								{lesson.title}
							</h4>
							<p className="text-sm mt-1" style={{ color: "var(--dashboard-muted)" }}>
								{lesson.course} • {lesson.progress}% complete
							</p>
							<div className="mt-2 w-full bg-gray-200 rounded-full h-2">
								<div
									className="h-2 rounded-full"
									style={{
										width: `${lesson.progress}%`,
										backgroundColor: "var(--dashboard-primary)",
									}}
								></div>
							</div>
						</div>
					))}
				</div>
			</Card>

			{/* My Courses and Recent Activity */}
			<section className="grid gap-4 lg:grid-cols-2">
				<Card
					className="border"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
						My Courses
					</h3>
					<div className="mt-4 space-y-3">
						{topCourses.map((course) => (
							<div
								key={course.name}
								className="rounded-lg border p-3"
								style={{
									borderColor: "var(--dashboard-border)",
									boxShadow: "var(--dashboard-shadow)",
								}}
							>
								<p className="font-medium" style={{ color: "var(--dashboard-fg)" }}>
									{course.name}
								</p>
								<p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
									{course.enrollments} lessons • {course.completion}% completed
								</p>
							</div>
						))}
					</div>
				</Card>

				<Card
					className="border"
					style={{
						borderColor: "var(--dashboard-border)",
						backgroundColor: "var(--dashboard-surface)",
					}}
				>
					<h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
						Recent Learning Activity
					</h3>
					<ul className="mt-4 space-y-3 text-sm" style={{ color: "var(--dashboard-muted)" }}>
						{recentActivity.map((item) => (
							<li
								key={item}
								className="rounded-lg border px-3 py-2"
								style={{
									backgroundColor:
										"color-mix(in srgb, var(--dashboard-surface) 88%, var(--dashboard-primary) 12%)",
									borderColor: "var(--dashboard-border)",
								}}
							>
								{item}
							</li>
						))}
					</ul>
				</Card>
			</section>
		</div>
	);
};

export default Dashboard;

