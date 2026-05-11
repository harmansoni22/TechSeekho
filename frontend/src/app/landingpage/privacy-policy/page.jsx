import CustomScroll from "../components/CustomScrollBar";
import Breadcrumbs from "../components/layout/Breadcrumbs/Breadcrumbs";

export const metadata = {
    title: "Privacy Policy | Techseekho",
    description:
        "Review how Techseekho collects, uses, and protects your personal information. Koshalyam Learning Solutions Pvt Ltd.",
};

const PrivacyPolicy = () => {
    return (
        <>
            <CustomScroll />
            <main className="mx-auto mt-25 w-full max-w-4xl px-4 pb-20 text-white">
                <Breadcrumbs
                    items={[
                        { label: "Home", href: "/landingpage" },
                        { label: "Legal", href: "/landingpage/Pages/legal" },
                        { label: "Privacy Policy" },
                    ]}
                />
                <h1 className="mt-4 text-center text-4xl font-semibold">
                    Privacy Policy
                </h1>
                <p className="mt-4 text-center text-sm text-white/70">
                    Last updated: March 20, 2026
                </p>

                <div className="mt-8 space-y-7 text-sm leading-7 text-white/85">
                    <section>
                        <h2 className="text-xl font-medium text-white">
                            1. Information We Collect
                        </h2>
                        <p className="mt-2">
                            We may collect your name, email address, phone
                            number, course interests, and payment details needed
                            to process enrollments and provide support.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white">
                            2. How We Use Your Information
                        </h2>
                        <p className="mt-2">
                            We use your data to manage accounts, deliver
                            courses, communicate important updates, process
                            transactions, and improve our learning experience.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white">
                            3. Data Sharing
                        </h2>
                        <p className="mt-2">
                            We do not sell personal data. We may share limited
                            information with trusted service providers for
                            payments, communication, and analytics as required
                            to operate our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white">
                            4. Data Security
                        </h2>
                        <p className="mt-2">
                            We apply reasonable technical and organizational
                            measures to protect your information. However, no
                            online system can guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white">
                            5. Contact
                        </h2>
                        <p className="mt-2">
                            For privacy-related questions, contact us at
                            support@techseekho.com.
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
};

export default PrivacyPolicy;
