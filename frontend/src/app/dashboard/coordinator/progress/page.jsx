import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = {
    title: "Progress · Coordinator · TechSeekho",
};

export default function CoordinatorProgressPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Programme Operations · Progress"
                title="Where every batch stands."
                subtitle="Projection-only view of module completion, attendance trends, and assignment review backlog."
            />
            <BackendPending
                whatItDoes="Aggregate ModuleProgress, Attendance, and Submission status per batch into a single rollup. The projection should never overwrite raw operational data — read-only and recomputed on every load."
                endpoints={[
                    {
                        method: "GET",
                        path: "/modules?courseId=<course>",
                        purpose:
                            "Lists learning paths and modules to size the denominator.",
                    },
                    {
                        method: "GET",
                        path: "/attendance?batchId=<id>",
                        purpose:
                            "Last-30-days attendance per batch for the trend sparkline.",
                    },
                    {
                        method: "GET",
                        path: "/assignments/submissions",
                        purpose:
                            "Submission backlog: PENDING vs SUBMITTED vs REVIEWED counts.",
                    },
                ]}
                previewSlots={[
                    "Module completion",
                    "Attendance trend",
                    "Submission backlog",
                ]}
                note="Coordinator dashboards must read raw operational data and project it; do NOT introduce a parallel writable 'progress' table."
            />
        </div>
    );
}
