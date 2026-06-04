import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";

export const metadata = { title: "Privacy Policy · Student · TechSeekho" };

export default function StudentPrivacyPolicyPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Active Learner · Legal · Privacy Policy"
                title="Privacy Policy"
                subtitle="How TechSeekho collects, uses, and protects your data (readable dashboard layout)."
            />

            <Panel eyebrow="Document" title={"Overview"} padded>
                <div className="space-y-6 text-sm leading-7 text-white/80">
                    <p className="text-white/90">
                        Last updated: March 20, 2026
                    </p>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            1. Information We Collect
                        </h2>
                        <p>
                            We may collect your name, email address, phone
                            number, course interests, and payment details needed
                            to process enrollments and provide support.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            2. How We Use Your Information
                        </h2>
                        <p>
                            We use your data to manage accounts, deliver
                            courses, communicate important updates, process
                            transactions, and improve our learning experience.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            3. Data Sharing
                        </h2>
                        <p>
                            We do not sell personal data. We may share limited
                            information with trusted service providers for
                            payments, communication, and analytics as required
                            to operate our platform.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            4. Data Security
                        </h2>
                        <p>
                            We apply reasonable technical and organizational
                            measures to protect your information. However, no
                            online system can guarantee absolute security.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-base font-semibold text-white">
                            5. Contact
                        </h2>
                        <p>
                            For privacy-related questions, contact us at
                            support@techseekho.com.
                        </p>
                    </section>
                </div>
            </Panel>
        </div>
    );
}
