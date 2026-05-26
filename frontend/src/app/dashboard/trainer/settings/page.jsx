import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Settings · Trainer · TechSeekho" };

export default function TrainerSettingsPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · Settings"
                title="Tune your delivery experience."
                subtitle="Notification preferences (e.g. new submissions), default batch view, and dashboard theme."
            />
            <BackendPending
                whatItDoes="Personal trainer settings. Notification preferences specifically for new submissions and announcements affecting your batches."
                endpoints={[
                    {
                        method: "GET",
                        path: "/users/me/preferences",
                        purpose: "Once a UserPreference model is added.",
                    },
                    {
                        method: "PATCH",
                        path: "/users/me/preferences",
                        purpose: "Persist preference changes.",
                    },
                ]}
                previewSlots={["Notifications", "Display", "Default batch"]}
            />
        </div>
    );
}
