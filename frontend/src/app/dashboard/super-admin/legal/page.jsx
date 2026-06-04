"use client";

import Link from "next/link";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

/**
 * SUPER_ADMIN — Legal & Policies.
 *
 * Two responsibilities:
 *  1. Surface the canonical policy texts so an operator can re-read what the
 *     platform currently serves to learners — these are real pages in the
 *     student dashboard, so we link straight there.
 *  2. Document the governance contract around future policy changes. Until
 *     a versioned PlatformPolicy model + two-person publish flow ships, any
 *     edit to the policy texts is a code change and should follow the same
 *     review path as any other production deploy.
 */

const POLICIES = [
    {
        key: "privacy",
        title: "Privacy Policy",
        href: "/dashboard/student/legal/privacy-policy",
        blurb: "How TechSeekho collects, uses, and protects user data.",
    },
    {
        key: "terms",
        title: "Terms & Conditions",
        href: "/dashboard/student/legal/terms-and-conditions",
        blurb: "The agreement that governs platform use.",
    },
    {
        key: "refund",
        title: "Refund Policy",
        href: "/dashboard/student/legal/refund-policy",
        blurb: "How refunds work for course withdrawals.",
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

            <section className="grid gap-4 md:grid-cols-3">
                {POLICIES.map((p) => (
                    <Panel key={p.key} eyebrow="Policy" title={p.title}>
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {p.blurb}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                                href={p.href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block rounded-md px-3 py-1.5 text-xs font-semibold"
                                style={{
                                    backgroundColor: "var(--role-accent)",
                                    color: "var(--role-accent-ink)",
                                }}
                            >
                                Read current version
                            </Link>
                        </div>
                    </Panel>
                ))}
            </section>

            <Panel
                eyebrow="Governance"
                title="Policy change workflow"
                description="Until a PlatformPolicy table + two-person rule ships, follow this discipline:"
            >
                <ol
                    className="ml-5 list-decimal space-y-2 text-sm"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    <li>
                        Open a PR against{" "}
                        <code className="font-mono">
                            frontend/src/app/dashboard/student/legal/
                        </code>{" "}
                        with the new copy and a date-stamped "last updated"
                        line.
                    </li>
                    <li>
                        Require a second SUPER_ADMIN to approve the PR — never
                        merge a policy change on a single review.
                    </li>
                    <li>
                        If the change is material (data handling, payments,
                        rights waivers), trigger a re-acceptance prompt on
                        learner login. That flow does not exist yet — coordinate
                        with the auth team before merging.
                    </li>
                    <li>
                        Audit-log entries are emitted automatically for any
                        backend mutation that touches policy state once the
                        endpoint ships; until then keep the changelog in the PR
                        body.
                    </li>
                </ol>
            </Panel>
        </div>
    );
};

export default SuperAdminLegalPage;
