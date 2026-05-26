import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = {
    title: "Community Moderation · Admin · TechSeekho",
};

export default function AdminCommunityModerationPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Oversight · Community"
                title="Keep the community productive and safe."
                subtitle="Moderation queue for announcements and student community posts at your institutions. Every action is audit-logged."
            />
            <BackendPending
                whatItDoes="Surface flagged content and trainer/student announcements that need review. Actions: approve, soft-delete, escalate to super admin."
                endpoints={[
                    {
                        method: "GET",
                        path: "/announcements?status=flagged",
                        purpose:
                            "Once a 'flagged' status is added to Announcement, return them here.",
                    },
                    {
                        method: "PATCH",
                        path: "/announcements/:id",
                        purpose: "Soft-delete or approve.",
                    },
                ]}
                previewSlots={[
                    "Pending review",
                    "Reported items",
                    "Recent actions",
                ]}
                note="Audit every moderation action with actor + before/after status."
            />
        </div>
    );
}
