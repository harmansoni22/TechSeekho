"use client";

import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import ComingSoon from "@/features/dashboard/components/ui/widgets/ComingSoon.jsx";

const ROADMAP = [
    {
        status: "PLANNED",
        title: "Institution-curated opportunities",
        description:
            "Coordinators post internships and openings vetted by the institution; no third-party scraping.",
    },
    {
        status: "PLANNED",
        title: "Eligibility filter by course",
        description:
            "Postings tagged to a course so students only see what their training qualifies them for.",
    },
    {
        status: "PLANNED",
        title: "Application tracking",
        description:
            "Lightweight applied/interviewing/offered tracker for the student and their coordinator.",
    },
];

const JobsPage = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBar
            title="Job Board"
            subtitle="Opportunities curated by your institution"
        />
        <ComingSoon
            title="Institutional career board"
            subtitle="Curated by your coordinator and admin, not a public job feed"
            summary="The job board surfaces openings that your institution has vetted and tagged to the course you're training in. There is no public posting; every opportunity here has an institutional sponsor and a coordinator who can answer questions about it."
            roadmap={ROADMAP}
        />
    </div>
);

export default JobsPage;
