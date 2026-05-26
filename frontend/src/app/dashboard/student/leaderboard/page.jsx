"use client";

import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import ComingSoon from "@/features/dashboard/components/ui/widgets/ComingSoon.jsx";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";

const ROADMAP = [
    {
        status: "IN_DESIGN",
        title: "Batch leaderboard",
        description:
            "Rank students within the same batch by attendance + submission completion + assessment score.",
    },
    {
        status: "PLANNED",
        title: "Institution leaderboard",
        description:
            "Aggregate across batches in the same institution, surfaced to coordinators and admins as well.",
    },
    {
        status: "PLANNED",
        title: "Trainer-configurable weighting",
        description:
            "Let the trainer tune how attendance, assignment, and assessment scores combine.",
    },
];

const SCORE_FORMULA = [
    { label: "Attendance", weight: "40%" },
    { label: "Assignment completion", weight: "30%" },
    { label: "Assessment performance", weight: "30%" },
];

const PLACEHOLDER_RANKS = [
    { rank: 1 },
    { rank: 2 },
    { rank: 3 },
    { rank: 4 },
    { rank: 5 },
];

const LeaderboardPage = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBar
            title="Leaderboard"
            subtitle="Operational ranking based on attendance and performance"
        />
        <ComingSoon
            title="Batch leaderboard is on the way"
            subtitle="Ranking is based on attendance and graded work, not engagement metrics"
            summary="The institutional leaderboard ranks students inside a batch by their operational performance — attendance, assignment completion, and assessment scores — not by likes, posts, or arbitrary points. The placeholder cards below show how the ranking surface will look once the calculation lands."
            roadmap={ROADMAP}
        >
            <Panel
                title="Scoring formula"
                description="What the rank is computed from"
            >
                <dl className="grid gap-3 sm:grid-cols-3">
                    {SCORE_FORMULA.map((row) => (
                        <div
                            key={row.label}
                            className="rounded-lg border p-4"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                        >
                            <dt
                                className="text-xs uppercase tracking-wide"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {row.label}
                            </dt>
                            <dd
                                className="mt-1 text-xl font-semibold"
                                style={{ color: "var(--dashboard-fg)" }}
                            >
                                {row.weight}
                            </dd>
                        </div>
                    ))}
                </dl>
            </Panel>

            <Panel
                title="Top of batch (preview)"
                description="Placeholder slots — populated once the ranking job runs"
            >
                <ol className="space-y-2">
                    {PLACEHOLDER_RANKS.map((row) => (
                        <li
                            key={row.rank}
                            className="flex items-center gap-4 rounded-lg border p-4"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                        >
                            <span
                                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                                style={{
                                    backgroundColor:
                                        "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-muted) 20%)",
                                    color: "var(--dashboard-fg)",
                                }}
                            >
                                {row.rank}
                            </span>
                            <div className="flex-1">
                                <div
                                    className="h-3 w-2/5 rounded"
                                    style={{
                                        backgroundColor:
                                            "color-mix(in srgb, var(--dashboard-surface) 70%, var(--dashboard-muted) 30%)",
                                    }}
                                />
                                <div
                                    className="mt-2 h-2 w-1/4 rounded"
                                    style={{
                                        backgroundColor:
                                            "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-muted) 20%)",
                                    }}
                                />
                            </div>
                            <span
                                className="text-xs uppercase tracking-wide"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                Pending
                            </span>
                        </li>
                    ))}
                </ol>
            </Panel>
        </ComingSoon>
    </div>
);

export default LeaderboardPage;
