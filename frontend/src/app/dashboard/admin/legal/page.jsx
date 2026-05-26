import Link from "next/link";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

export const metadata = { title: "Legal · Admin · TechSeekho" };

// Legal docs are the same for every role and live on the public site.
// We open them in a new tab so the admin keeps their dashboard context.
const docs = [
    {
        href: "/landingpage/privacy-policy",
        title: "Privacy Policy",
        blurb: "How TechSeekho collects, uses, and protects data.",
    },
    {
        href: "/landingpage/terms-and-conditions",
        title: "Terms & Conditions",
        blurb: "The agreement that governs use of the platform.",
    },
    {
        href: "/landingpage/refund-policy",
        title: "Refund Policy",
        blurb: "Refunds for course enrolments and institution agreements.",
    },
];

export default function AdminLegalPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Oversight · Legal"
                title="Policies that govern your operation."
                subtitle="The policies below apply to all roles. As an admin you should be familiar with them when communicating with trainers and learners at your institutions."
            />
            <div className="grid gap-4 md:grid-cols-3">
                {docs.map((d) => (
                    <Panel
                        key={d.href}
                        eyebrow="Policy"
                        title={d.title}
                        description={d.blurb}
                    >
                        <Link
                            href={d.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block rounded-md px-3 py-1.5 text-xs font-semibold"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Open ↗
                        </Link>
                    </Panel>
                ))}
            </div>
        </div>
    );
}
