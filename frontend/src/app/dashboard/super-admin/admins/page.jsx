"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";
import {
    PageEmpty,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { useAuthedResource } from "@/features/dashboard/hooks/useAuthedResource";

/**
 * Super-admin: directory of every user with an ADMIN or
 * INSTITUTION_COORDINATOR role assignment.
 *
 * Backend status: the upstream endpoint exists conceptually
 * (`GET /users?role=ADMIN`) but is not exposed through the dashboard's
 * Next.js API proxy yet. Until that ships, this page falls back to
 * BackendPending — the moment the proxy returns rows the same hook will
 * render them automatically.
 */

const AdminsPage = () => {
    const { data, loading, error } = useAuthedResource(
        "/admin/users?role=ADMIN",
    );

    const admins = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
          ? data.users
          : null;

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="People · Admins"
                title="The people who hold the keys."
                subtitle="Operators with elevated access across institutions. Audit who has what — and when in doubt, narrow scope before broadening it."
            />

            {loading ? (
                <PageLoading label="Loading admin roster" />
            ) : error ? (
                <BackendPending
                    whatItDoes="Lists every active admin/coordinator across the platform, with last-active timestamp, scope, and a per-row action menu to suspend, rotate sessions, or transfer ownership."
                    endpoints={[
                        {
                            method: "GET",
                            path: "/admin/users?role=ADMIN",
                            purpose: "list admins (paginated)",
                        },
                        {
                            method: "POST",
                            path: "/admin/role-assignments",
                            purpose: "grant role",
                        },
                        {
                            method: "DELETE",
                            path: "/admin/role-assignments/:id",
                            purpose: "revoke role",
                        },
                        {
                            method: "POST",
                            path: "/admin/users/:id/sessions/revoke",
                            purpose: "force sign-out",
                        },
                    ]}
                    previewSlots={[
                        "Filters",
                        "Admin row",
                        "Admin row",
                        "Admin row",
                    ]}
                    note={`Live error from /admin/users?role=ADMIN: ${error}`}
                />
            ) : !admins || admins.length === 0 ? (
                <Panel
                    eyebrow="Roster"
                    title="No admins on file"
                    description="When admin accounts are provisioned they will appear here."
                >
                    <PageEmpty
                        title="Empty roster"
                        description="Provision the first admin to begin."
                    />
                </Panel>
            ) : (
                <Panel
                    eyebrow="Roster"
                    title={`${admins.length} admin${admins.length === 1 ? "" : "s"}`}
                >
                    <ul className="grid gap-3 md:grid-cols-2">
                        {admins.map((a, idx) => (
                            <li
                                key={a.id ?? idx}
                                className="flex items-center gap-3 rounded-lg border px-3 py-3"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                <span
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full font-semibold"
                                    style={{
                                        backgroundColor:
                                            "var(--role-accent-soft)",
                                        color: "var(--role-accent)",
                                    }}
                                >
                                    {(a.fullName || a.name || "?")
                                        .slice(0, 1)
                                        .toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <p
                                        className="truncate font-display text-sm font-medium"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {a.fullName ||
                                            a.name ||
                                            "Unnamed admin"}
                                    </p>
                                    <p
                                        className="truncate text-[11px] uppercase tracking-[0.18em]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.email || a.scope || "—"}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}
        </div>
    );
};

export default AdminsPage;
