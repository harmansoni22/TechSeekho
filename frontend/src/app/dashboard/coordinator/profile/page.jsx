import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Profile · Coordinator · TechSeekho" };

export default function CoordinatorProfilePage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Programme Operations · Profile"
                title="Your coordinator profile."
                subtitle="Identity and the institutions you have visibility into."
            />
            <BackendPending
                whatItDoes="Display coordinator profile: name, email, phone, and institution scope. Coordinator is projection-only — institution scope is changed by SUPER_ADMIN, not here."
                endpoints={[
                    {
                        method: "GET",
                        path: "/auth/profile",
                        purpose: "Hydrate current user details.",
                    },
                    {
                        method: "PATCH",
                        path: "/users/me",
                        purpose:
                            "Update personal fields (avatar, phone, name).",
                    },
                ]}
                previewSlots={[
                    "Identity",
                    "Institutions in scope",
                    "Preferences",
                ]}
            />
        </div>
    );
}
