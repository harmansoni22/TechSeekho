import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = {
    title: "My Courses · Trainer · TechSeekho",
};

export default function TrainerCoursesPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · My Courses"
                title="The courses you're delivering."
                subtitle="Each course you teach across your assigned batches, with quick links to its modules, assignments, and assessments."
            />
            <BackendPending
                whatItDoes="Show the trainer's assigned courses (derived from BatchTrainer ⇒ Batch ⇒ Course) with module count, active batch count, and a deep link into each course's modules/assessments."
                endpoints={[
                    {
                        method: "GET",
                        path: "/batches",
                        purpose:
                            "Already returns batches scoped to the trainer; group by course.",
                    },
                    {
                        method: "GET",
                        path: "/modules",
                        purpose:
                            "Filter by courseId once the trainer picks a course.",
                    },
                ]}
                previewSlots={["Course header", "Modules", "Active batches"]}
            />
        </div>
    );
}
