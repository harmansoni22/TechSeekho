import Card from "@/app/components/ui/Card";
import TopBar from "@/app/dashboard/components/layout/TopBar/TopBar";

export const metadata = {
  title: "Privacy Policy | Techseekho Dashboard",
  description:
    "Review how Techseekho collects, uses, and protects your privacy within the dashboard.",
};

const PrivacyPolicy = () => {
  return (
    <div className="space-y-6" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar title="Privacy Policy" subtitle="How we manage learner and account data" />

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
              1. Information We Collect
            </h2>
            <p className="mt-2">
              We collect basic account data such as name, email, learning preferences, course progress details, and communications preferences to power your dashboard experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
              2. How We Use Data
            </h2>
            <p className="mt-2">
              Your data is used to personalize recommendations, display progress, support account administration, and deliver notifications aligned with your learning goals.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
              3. Sharing and Security
            </h2>
            <p className="mt-2">
              We do not sell personal information. We may share limited data with trusted service providers only as needed to support course delivery, payments, and platform operations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
              4. Your Rights
            </h2>
            <p className="mt-2">
              You can manage your preferences from the dashboard settings and contact support for questions about your data or to request updates.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
