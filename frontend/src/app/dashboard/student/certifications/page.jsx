"use client";

import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import ComingSoon from "@/features/dashboard/components/ui/widgets/ComingSoon.jsx";

const ROADMAP = [
    {
        status: "PLANNED",
        title: "Course-completion certificate",
        description:
            "Generated on PathEnrollment.completedAt with the institution name, batch, course title, and the assigned trainer's signature line.",
    },
    {
        status: "PLANNED",
        title: "Verification page",
        description:
            "Public read-only page that confirms a certificate id is real and lists the issuing institution.",
    },
    {
        status: "PLANNED",
        title: "Batch-issued credentials",
        description:
            "Admins and coordinators can issue group certificates for an entire batch on a fixed date.",
    },
];

const CertificationsPage = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBar
            title="Certifications"
            subtitle="Course-completion credentials issued by your institution"
        />
        <ComingSoon
            title="Institutional certificates"
            subtitle="Tied to course completion, not engagement"
            summary="Certificates are issued by your institution when you complete the learning path assigned to your batch. They reference the course, the trainer, and the institution — they are not awarded for streaks or activity. The first certificates will be generated when the earliest batch finishes its full module sequence."
            roadmap={ROADMAP}
        />
    </div>
);

export default CertificationsPage;
