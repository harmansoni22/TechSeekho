"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * SUPER_ADMIN legal / policies governance page.
 *
 * Different from a learner's legal page: here a super-admin can review the
 * current policy versions, see acceptance coverage across the user base,
 * publish a new version, and trigger a re-acceptance flow if needed.
 *
 * Today the policies are static markdown under /dashboard/legal/*; this page
 * is the future home for versioned policy management.
 */
const LEGAL_PAGES = [
    {
        key: "terms",
        title: "Terms & Conditions",
        updated: "—",
        acceptance: "—",
    },
    {
        key: "privacy",
        title: "Privacy Policy",
        updated: "—",
        acceptance: "—",
    },
    {
        key: "refund",
        title: "Refund Policy",
        updated: "—",
        acceptance: "—",
    },
];

const SuperAdminLegalPage = () => {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Compliance · Legal & Policies"
                title="The promises we keep."
                subtitle="Source documents that govern what TechSeekho can and can't do. A change here ripples through every learner's account — version, review, then publish."
            />

            <section className="grid gap-6 md:grid-cols-3">
                {LEGAL_PAGES.map((doc) => (
                    <Panel
                        key={doc.key}
                        eyebrow={`Updated ${doc.updated}`}
                        title={doc.title}
                        description={`Acceptance coverage: ${doc.acceptance}`}
                    >
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                disabled
                                className="rounded-md px-3 py-2 text-center text-xs font-semibold opacity-70"
                                style={{
                                    backgroundColor: "var(--role-accent)",
                                    color: "var(--role-accent-ink)",
                                }}
                            >
                                Read current version
                            </button>
                            <button
                                type="button"
                                disabled
                                className="rounded-md border px-3 py-2 text-center text-xs font-medium opacity-60"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    color: "var(--dashboard-fg)",
                                }}
                            >
                                Publish new version
                            </button>
                        </div>
                    </Panel>
                ))}
            </section>

            <BackendPending
                whatItDoes="Upload a new version of a policy, attach a diff to the previous version, mark whether acceptance is required, and trigger a re-prompt flow for affected users. The current acceptance percentages above are placeholders until coverage telemetry lands."
                endpoints={[
                    {
                        method: "GET",
                        path: "/admin/legal/policies",
                        purpose: "list versions",
                    },
                    {
                        method: "POST",
                        path: "/admin/legal/policies/:key/versions",
                        purpose: "publish new version",
                    },
                    {
                        method: "GET",
                        path: "/admin/legal/policies/:key/acceptance",
                        purpose: "coverage telemetry",
                    },
                    {
                        method: "POST",
                        path: "/admin/legal/policies/:key/reprompt",
                        purpose: "force re-acceptance",
                    },
                ]}
                previewSlots={[
                    "Version timeline",
                    "Acceptance gauge",
                    "Draft editor",
                ]}
                note="Every publish must be co-signed by Legal — wire the two-person rule into the same audit log used for platform-config."
            />
        </div>
    );
};

export default SuperAdminLegalPage;
