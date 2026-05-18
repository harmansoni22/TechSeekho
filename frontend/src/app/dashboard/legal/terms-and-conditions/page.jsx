import Card from "@/app/components/ui/Card";
import TopBar from "@/app/dashboard/components/layout/TopBar/TopBar";

export const metadata = {
  title: "Terms & Conditions | Techseekho Dashboard",
  description:
    "Review the dashboard terms and conditions that govern platform use and course engagement.",
};

const TermsAndConditions = () => {
  return (
    <div className="space-y-6" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar title="Terms & Conditions" subtitle="Platform use, enrollment, and account responsibilities" />

      <Card
        className="border p-6"
        style={{
          borderColor: "var(--dashboard-border)",
          backgroundColor: "var(--dashboard-surface)",
        }}
      >
        <div className="space-y-6 text-sm leading-7" style={{ color: "var(--dashboard-muted)" }}>
          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              Using the dashboard means you agree to follow these terms, all applicable policies, and any updates we publish.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
              2. Course Access and Payments
            </h2>
            <p className="mt-2">
              Courses become available after successful payment and enrollment. Fee details are shown on course pages and may change from time to time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
              3. Account Responsibilities
            </h2>
            <p className="mt-2">
              You must provide accurate information, keep login credentials secure, and use the dashboard in a respectful, honest manner.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
              4. Intellectual Property
            </h2>
            <p className="mt-2">
              All course materials, designs, and branding are owned by TechSeekho and are intended for your personal learning only.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default TermsAndConditions;
