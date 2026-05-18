import Link from "next/link";
import Card from "@/app/components/ui/Card";
import TopBar from "@/app/dashboard/components/layout/TopBar/TopBar";

export const metadata = {
  title: "Legal Documents | Techseekho Dashboard",
  description:
    "Review Techseekho's dashboard privacy, terms, and refund policies for learners and parents.",
};

const legalItems = [
  {
    title: "Privacy Policy",
    description: "How we collect and protect learner and account data.",
    href: "/dashboard/legal/privacy-policy",
  },
  {
    title: "Terms & Conditions",
    description: "The terms governing course access, platform use, and account behavior.",
    href: "/dashboard/legal/terms-and-conditions",
  },
  {
    title: "Refund Policy",
    description: "Refund eligibility, request process, and processing timelines.",
    href: "/dashboard/legal/refund-policy",
  },
];

const DashboardLegal = () => {
  return (
    <div className="space-y-6" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar title="Legal" subtitle="Dashboard legal documents and policy links" />

      <div className="grid gap-4 lg:grid-cols-3">
        {legalItems.map((item) => (
          <Card
            key={item.href}
            className="border p-6"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
              {item.title}
            </h2>
            <p className="mt-3 text-sm" style={{ color: "var(--dashboard-muted)" }}>
              {item.description}
            </p>
            <Link
              href={item.href}
              className="mt-5 inline-flex rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-90"
              style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-bg-subtle)",
                color: "var(--dashboard-fg)",
              }}
            >
              View Policy
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardLegal;
