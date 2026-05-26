import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Community · Coordinator · TechSeekho" };

export default function CoordinatorCommunityPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Programme Operations · Community"
                title="What's happening across your cohorts."
                subtitle="A projection of announcements and noteworthy student/trainer activity in your institutions. Read-only."
            />
            <BackendPending
                whatItDoes="Aggregate recent announcements + high-signal events (large submission batch reviewed, attendance anomaly) into a single feed scoped to the coordinator's institutions."
                endpoints={[
                    {
                        method: "GET",
                        path: "/announcements",
                        purpose: "Coordinator-readable feed.",
                    },
                    {
                        method: "GET",
                        path: "/students/activity?range=7d",
                        purpose: "Once StudentActivity has a list endpoint.",
                    },
                ]}
                previewSlots={["Today", "This week", "Anomalies"]}
            />
        </div>
    );
}
