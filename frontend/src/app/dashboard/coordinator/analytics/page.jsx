import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Analytics · Coordinator · TechSeekho" };

export default function CoordinatorAnalyticsPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Programme Operations · Analytics"
                title="Projection of program health."
                subtitle="Read-only aggregates from operational data — attendance, completion, submission throughput. Never overwrites the raw record."
            />
            <BackendPending
                whatItDoes="Coordinator-facing rollups for institutions in scope. Attendance rate this week, batches at risk (below threshold), and submission backlog trend."
                endpoints={[
                    {
                        method: "GET",
                        path: "/batches",
                        purpose: "Already scoped to coordinator.",
                    },
                    {
                        method: "GET",
                        path: "/attendance?batchId=…",
                        purpose: "Per-batch attendance for the trend chart.",
                    },
                    {
                        method: "GET",
                        path: "/assignments/submissions",
                        purpose: "Submission funnel.",
                    },
                ]}
                previewSlots={[
                    "Attendance rate",
                    "Batches at risk",
                    "Submission backlog",
                ]}
                note="Projection-only. Coordinator never writes to operational tables."
            />
        </div>
    );
}
