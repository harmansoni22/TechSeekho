import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Profile · Admin · TechSeekho" };

export default function AdminProfilePage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Oversight · Profile"
                title="Your admin profile."
                subtitle="Identity, institutions you administer, and account preferences."
            />
            <BackendPending
                whatItDoes="Show the admin's profile (name, email, phone, avatar) and the institutions they're scoped to. Provide an edit affordance for personal fields only — institution scope is changed by SUPER_ADMIN."
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
                previewSlots={["Identity", "Scope", "Preferences"]}
            />
        </div>
    );
}
