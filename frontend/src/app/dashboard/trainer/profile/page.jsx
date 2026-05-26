import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Profile · Trainer · TechSeekho" };

export default function TrainerProfilePage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · Profile"
                title="Your trainer profile."
                subtitle="Identity, specialisation, experience, and the batches you're assigned to."
            />
            <BackendPending
                whatItDoes="Display trainer profile (TrainerProfile model: specialization, bio, experienceYears) plus the BatchTrainer assignments. Edit affordance for bio/specialization fields; batch assignments are admin-controlled."
                endpoints={[
                    {
                        method: "GET",
                        path: "/auth/profile",
                        purpose: "Hydrate current user.",
                    },
                    {
                        method: "PATCH",
                        path: "/users/me",
                        purpose: "Update personal fields.",
                    },
                ]}
                previewSlots={[
                    "Identity",
                    "Specialisation",
                    "Assigned batches",
                ]}
            />
        </div>
    );
}
