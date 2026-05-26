"use client";

import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import ComingSoon from "@/features/dashboard/components/ui/widgets/ComingSoon.jsx";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";

const ROADMAP = [
    {
        status: "IN_DESIGN",
        title: "Batch announcements feed",
        description:
            "Read-only stream of Announcement records the trainer has posted to your batch, with the most recent first.",
    },
    {
        status: "PLANNED",
        title: "Trainer-moderated Q&A",
        description:
            "Threaded questions on a specific module or assignment. Trainers post answers and pin the canonical one.",
    },
    {
        status: "PLANNED",
        title: "Cross-batch institutional channels",
        description:
            "Institution-wide notices from your admin and coordinator. Read-only for students.",
    },
];

const COLLABORATION_MOCKUPS = [
    {
        kind: "Announcement",
        title: "Module 4 deadline extended",
        author: "Your trainer",
    },
    {
        kind: "Question",
        title: "Hooks dependency-array example?",
        author: "Resolved by trainer",
    },
    {
        kind: "Institution",
        title: "Lab schedule change next week",
        author: "Coordinator",
    },
];

const CommunityPage = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBar
            title="Community"
            subtitle="Institution-moderated discussion — not a social feed"
        />
        <ComingSoon
            title="Trainer- and institution-led communication"
            subtitle="Every post is attached to your batch, your course, or your institution"
            summary="The community surface is a moderated channel between trainers, coordinators, and the students they're responsible for — it is not a social feed and there are no DMs, follows, or likes. Discussions are scoped to your batch and your institution, with trainers and admins as the only people who can start threads."
            roadmap={ROADMAP}
        >
            <Panel
                title="What the feed will look like"
                description="Each entry is owned by a real institutional role"
            >
                <ul className="space-y-2">
                    {COLLABORATION_MOCKUPS.map((row) => (
                        <li
                            key={row.title}
                            className="flex items-center justify-between gap-4 rounded-lg border p-4"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                        >
                            <div>
                                <p
                                    className="text-[10px] uppercase tracking-[0.24em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {row.kind}
                                </p>
                                <p
                                    className="mt-1 text-sm font-medium"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {row.title}
                                </p>
                            </div>
                            <span
                                className="text-xs"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {row.author}
                            </span>
                        </li>
                    ))}
                </ul>
            </Panel>
        </ComingSoon>
    </div>
);

export default CommunityPage;
