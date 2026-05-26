"use client";

import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import ComingSoon from "@/features/dashboard/components/ui/widgets/ComingSoon.jsx";

const ROADMAP = [
    {
        status: "PLANNED",
        title: "Assigned trainer card",
        description:
            "Surface the TrainerProfile records linked to your batch via BatchTrainer — bio, specialization, years of experience.",
    },
    {
        status: "PLANNED",
        title: "Office-hours scheduling",
        description:
            "Trainers publish weekly office-hours; students request a 15-minute slot.",
    },
    {
        status: "PLANNED",
        title: "Cross-batch mentor pool",
        description:
            "Admins can offer guest trainers from other batches for short consultations.",
    },
];

const MentorsPage = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBar
            title="Mentors"
            subtitle="The trainers assigned to your batch"
        />
        <ComingSoon
            title="Connect with your batch trainers"
            subtitle="Not a marketplace — these are your institution's assigned trainers"
            summary="Mentorship in this platform means structured contact with the trainers your institution has assigned to your batch. There is no public mentor marketplace; everyone who appears here belongs to your institution's roster and is accountable to your admin and coordinator."
            roadmap={ROADMAP}
        />
    </div>
);

export default MentorsPage;
