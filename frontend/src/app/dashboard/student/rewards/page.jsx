"use client";

import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import ComingSoon from "@/features/dashboard/components/ui/widgets/ComingSoon.jsx";

const ROADMAP = [
    {
        status: "PLANNED",
        title: "Achievement catalogue",
        description:
            "Surface the Achievement table (Perfect-Attendance Week, First Submission, Path-Complete) on a single page.",
    },
    {
        status: "PLANNED",
        title: "Institution-tunable criteria",
        description:
            "Admins decide which achievements are available to students in their institution.",
    },
    {
        status: "PLANNED",
        title: "Audit trail",
        description:
            "Award events are written to AuditLog so admins can see exactly when and why each achievement unlocked.",
    },
];

const RewardsPage = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBar
            title="Rewards"
            subtitle="Operational achievements unlocked by real performance"
        />
        <ComingSoon
            title="Achievement-based recognition"
            subtitle="No streaks-for-streaks-sake, no points farming"
            summary="Rewards on this platform map to real operational milestones — full-attendance weeks, on-time submissions, path completions — not to scrolling or arbitrary engagement. Each award is tied back to the institution's grading criteria and is visible to trainers and coordinators in their own dashboards."
            roadmap={ROADMAP}
        />
    </div>
);

export default RewardsPage;
