import Link from "next/link";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import {
    COORD_ICONS,
    Icon,
} from "@/features/dashboard/coordinator/coordinatorShared";

export const metadata = { title: "Legal · Coordinator · TechSeekho" };

const DOCS = [
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

export default function CoordinatorLegalPage() {
    return (
        <div className="space-y-6">
            <RoleHero
                eyebrow="Programme Operations · Legal"
                title="Policies relevant to your role."
                subtitle="These apply to every dashboard user. Open them when you're speaking with stakeholders about platform terms."
            />
            <div className="grid gap-4 md:grid-cols-3">
                {DOCS.map((d) => (
                    <Panel key={d.href} eyebrow="Policy" title={d.title}>
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {d.blurb}
                        </p>
                        <Link
                            href={d.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
                            style={{
                                backgroundColor: "var(--role-accent)",
                                color: "var(--role-accent-ink)",
                            }}
                        >
                            Open
                            <Icon
                                path={COORD_ICONS.eye}
                                className="h-3.5 w-3.5"
                            />
                        </Link>
                    </Panel>
                ))}
            </div>
        </div>
    );
}
