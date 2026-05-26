import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Analytics · Admin · TechSeekho" };

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Oversight · Analytics"
                title="Health of every program at your institutions."
                subtitle="Admin analytics pull from raw operational data — submissions, attendance, completions — never from a curated projection store."
            />
            <BackendPending
                whatItDoes="Per-institution KPIs: active batches, attendance rate this week, assignment completion rate, average submission score, trainer load. Time-window selector with sane defaults."
                endpoints={[
                    {
                        method: "GET",
                        path: "/admin/platform/overview",
                        purpose:
                            "Already returns platform-wide counts; extend with institution scope for ADMIN.",
                    },
                    {
                        method: "GET",
                        path: "/attendance?batchId=…",
                        purpose:
                            "Raw attendance — server-side aggregate per batch.",
                    },
                    {
                        method: "GET",
                        path: "/assignments/submissions",
                        purpose:
                            "Submission funnel: PENDING / SUBMITTED / REVIEWED.",
                    },
                ]}
                previewSlots={[
                    "Snapshot KPIs",
                    "Attendance trend",
                    "Completion funnel",
                ]}
                note="Read-only projection of operational data. Never write to a separate 'analytics' table."
            />
        </div>
    );
}
