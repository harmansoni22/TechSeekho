import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

export const metadata = { title: "Terms & Conditions · Student · TechSeekho" };

export default function StudentTermsAndConditionsPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Active Learner · Legal · Terms & Conditions"
                title="Terms & Conditions"
                subtitle="The agreement that governs your use of the platform."
            />

            <Panel eyebrow="Document" title={"Summary"} padded>
                <div className="space-y-6 text-sm leading-7 text-white/80">
                    <p className="text-white/90">
                        Last updated: March 20, 2026
                    </p>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By using TechSeekho services, you agree to these
                            terms and all applicable policies.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            2. Enrollments and Payments
                        </h2>
                        <p>
                            Course access is provided after successful payment.
                            Fees and schedule details are displayed on the
                            relevant course page and may be updated when needed.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            3. User Responsibilities
                        </h2>
                        <p>
                            You agree to provide accurate account details and
                            use the platform respectfully, without misuse,
                            abuse, or unauthorized sharing of course material.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            4. Intellectual Property
                        </h2>
                        <p>
                            All learning content, recordings, notes, and
                            branding are owned by TechSeekho and are intended
                            for personal learning use only.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            5. Limitation of Liability
                        </h2>
                        <p>
                            We provide educational services on an as-is basis
                            and are not liable for indirect losses or outcomes
                            beyond our control.
                        </p>
                    </section>
                </div>
            </Panel>
        </div>
    );
}
