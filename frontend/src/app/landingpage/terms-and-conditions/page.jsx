import CustomScroll from "../components/CustomScrollBar";
import Breadcrumbs from "../components/layout/Breadcrumbs/Breadcrumbs";

export const metadata = {
    title: "Terms and Conditions | Techseekho",
    description:
        "Read the terms and conditions governing Techseekho services and course access. Koshalyam Learning Solutions Pvt Ltd.",
};

const TermsAndConditions = () => {
    return (
        <>
            <CustomScroll />
            <main className="mx-auto mt-25 w-full max-w-4xl px-4 pb-20 text-white">
                <Breadcrumbs
                    items={[
                        { label: "Home", href: "/landingpage" },
                        { label: "Legal", href: "/landingpage/Pages/legal" },
                        { label: "Terms & Conditions" },
                    ]}
                />
                <h1 className="mt-4 text-center text-4xl font-semibold">
                    Terms & Conditions
                </h1>
                <p className="mt-4 text-center text-sm text-white/70">
                    Last updated: March 20, 2026
                </p>

                <div className="mt-8 space-y-7 text-sm leading-7 text-white/85">
                    <section>
                        <h2 className="text-xl font-medium text-white">
                            1. Acceptance of Terms
                        </h2>
                        <p className="mt-2">
                            By using TechSeekho services, you agree to these
                            terms and all applicable policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white">
                            2. Enrollments and Payments
                        </h2>
                        <p className="mt-2">
                            Course access is provided after successful payment.
                            Fees and schedule details are displayed on the
                            relevant course page and may be updated when needed.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white">
                            3. User Responsibilities
                        </h2>
                        <p className="mt-2">
                            You agree to provide accurate account details and
                            use the platform respectfully, without misuse,
                            abuse, or unauthorized sharing of course material.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white">
                            4. Intellectual Property
                        </h2>
                        <p className="mt-2">
                            All learning content, recordings, notes, and
                            branding are owned by TechSeekho and are intended
                            for personal learning use only.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white">
                            5. Limitation of Liability
                        </h2>
                        <p className="mt-2">
                            We provide educational services on an as-is basis
                            and are not liable for indirect losses or outcomes
                            beyond our control.
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
};

export default TermsAndConditions;
