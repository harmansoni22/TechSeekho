import Link from "next/link";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

export const metadata = { title: "Legal · Trainer · TechSeekho" };

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

export default function TrainerLegalPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · Legal"
                title="Policies that govern the platform."
                subtitle="Trainer-relevant policies: data handling, content ownership, refund flows for the institutions you serve."
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
