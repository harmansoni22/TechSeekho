import Link from "next/link";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

export const metadata = { title: "Legal · Student · TechSeekho" };

const docs = [
    {
        href: "/dashboard/student/legal/privacy-policy",
        title: "Privacy Policy",
        blurb: "How TechSeekho collects, uses, and protects your data.",
    },
    {
        href: "/dashboard/student/legal/terms-and-conditions",
        title: "Terms & Conditions",
        blurb: "The agreement that governs your use of the platform.",
    },
    {
        href: "/dashboard/student/legal/refund-policy",
        title: "Refund Policy",
        blurb: "How refunds work if you withdraw from a course.",
    },
];

export default function StudentLegalPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Active Learner · Legal"
                title="Your rights and our promises."
                subtitle="The policies you agreed to when joining TechSeekho. Read them anytime — they open in a new tab so your dashboard stays put."
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
                            className="inline-block rounded-md px-3 py-1.5 text-xs font-semibold"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Open
                        </Link>
                    </Panel>
                ))}
            </div>
        </div>
    );
}
