import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

export const metadata = { title: "Refund Policy · Student · TechSeekho" };

export default function StudentRefundPolicyPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Active Learner · Legal · Refund Policy"
                title="Refund Policy"
                subtitle="How refunds work if you withdraw from a course."
            />

            <Panel eyebrow="Document" title={"Guidelines"} padded>
                <div className="space-y-6 text-sm leading-7 text-white/80">
                    <p className="text-white/90">
                        Last updated: March 20, 2026
                    </p>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            1. Refund Eligibility
                        </h2>
                        <p>
                            Refund requests are considered for eligible
                            enrollments submitted within 7 calendar days of
                            payment, provided no significant course consumption
                            has occurred.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            2. Non-Refundable Cases
                        </h2>
                        <p>
                            Refunds are generally not available after
                            substantial access to course material, completed
                            downloadable resources, or after the eligible
                            request window.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            3. How to Request
                        </h2>
                        <p>
                            Email support@techseekho.com with your registered
                            email, payment details, and reason for request. Our
                            team reviews requests within 5 to 7 business days.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            4. Refund Processing Time
                        </h2>
                        <p>
                            Once approved, refunds are initiated to the original
                            payment method and can take 7 to 10 business days
                            depending on your bank or payment provider.
                        </p>
                    </section>
                </div>
            </Panel>
        </div>
    );
}
