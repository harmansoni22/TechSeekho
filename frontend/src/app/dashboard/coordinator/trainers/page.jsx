import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = {
    title: "Trainers · Coordinator · TechSeekho",
};

export default function CoordinatorTrainersPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Programme Operations · Trainers"
                title="Who's delivering, where, and at what cadence."
                subtitle="Coordinator view: a read-only projection of trainer assignments across batches in your institutions."
            />
            <BackendPending
                whatItDoes="List trainers visible to the coordinator with their batch count, current institution(s), and the last week's delivery cadence pulled from operational attendance data."
                endpoints={[
                    {
                        method: "GET",
                        path: "/institutions/:id/members?role=TRAINER",
                        purpose: "Lists trainer members of an institution.",
                    },
                    {
                        method: "GET",
                        path: "/batches",
                        purpose:
                            "Already in scope; group BatchTrainer assignments by trainer.",
                    },
                ]}
                previewSlots={["Trainer", "Batches", "Cadence"]}
            />
        </div>
    );
}
