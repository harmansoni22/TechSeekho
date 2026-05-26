import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Community · Trainer · TechSeekho" };

export default function TrainerCommunityPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · Community"
                title="Where your cohort talks shop."
                subtitle="Announcements you've posted, recent student activity, and a quick lane to start a new announcement."
            />
            <BackendPending
                whatItDoes="Trainer-facing community: announcements they've authored (filterable by batch) and a feed of recent student activity in their batches."
                endpoints={[
                    {
                        method: "GET",
                        path: "/announcements?authorId=me",
                        purpose: "Once an author filter is added.",
                    },
                    {
                        method: "POST",
                        path: "/announcements",
                        purpose:
                            "Already exists — surface a 'new announcement' affordance here.",
                    },
                ]}
                previewSlots={["My announcements", "Recent student activity"]}
            />
        </div>
    );
}
