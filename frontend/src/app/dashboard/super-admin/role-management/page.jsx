"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

const RoleManagementPage = () => {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Authority · Role Management"
                title="Grant power deliberately."
                subtitle="Every role assignment is a deliberate act of trust. Pair them with institutions, watch them in the audit trail, and revoke them the moment scope changes."
            />

            <BackendPending
                whatItDoes="A two-pane grant/revoke surface — pick a user, pick a role × institution, see the resulting permission matrix preview, confirm, and watch the assignment appear in the audit trail."
                endpoints={[
                    {
                        method: "GET",
                        path: "/admin/role-assignments?userId=…",
                        purpose: "list a user's role grants",
                    },
                    {
                        method: "POST",
                        path: "/admin/role-assignments",
                        purpose: "grant role × institution (SUPER_ADMIN only)",
                    },
                    {
                        method: "DELETE",
                        path: "/admin/role-assignments/:id",
                        purpose: "revoke",
                    },
                ]}
                previewSlots={[
                    "User selector",
                    "Role × institution grid",
                    "Pending changes",
                    "Audit preview",
                ]}
                note="RBAC is enforced via RoleAssignment(userId × roleId × institutionId). Grants/revokes must be SUPER_ADMIN-gated on the backend and logged to AuditLog with actor + IP."
            />
        </div>
    );
};

export default RoleManagementPage;
