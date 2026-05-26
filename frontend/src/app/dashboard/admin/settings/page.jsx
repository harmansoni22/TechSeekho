import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Settings · Admin · TechSeekho" };

export default function AdminSettingsPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Oversight · Settings"
                title="Configure your admin experience."
                subtitle="Notification preferences, dashboard theme, and institution-level defaults."
            />
            <BackendPending
                whatItDoes="Personal admin settings (notifications, density, default landing institution). Theme is handled client-side via DashboardThemeProvider — no backend round-trip needed."
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
