import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Settings · Coordinator · TechSeekho" };

export default function CoordinatorSettingsPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Programme Operations · Settings"
                title="Tune your coordinator dashboard."
                subtitle="Notification preferences, default institution view, and dashboard theme."
            />
            <BackendPending
                whatItDoes="Personal coordinator settings (notifications, density, default landing institution). Theme is handled client-side via DashboardThemeProvider."
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
                previewSlots={["Notifications", "Display", "Defaults"]}
            />
        </div>
    );
}
