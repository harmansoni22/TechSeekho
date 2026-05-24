import Card from "@/app/components/ui/Card";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";

export const metadata = {
    title: "Refund Policy | Techseekho Dashboard",
    description:
        "Review refund eligibility and request timelines for dashboard learners.",
};

const RefundPolicy = () => {
    return (
        <div className="space-y-6" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="Refund Policy"
                subtitle="Guidelines for eligible refund requests"
            />

            <Card
                className="border p-6"
                style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                }}
            >
                <div
                    className="space-y-6 text-sm leading-7"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    <section>
                        <h2
                            className="text-lg font-semibold"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            1. Refund Eligibility
                        </h2>
                        <p className="mt-2">
                            Refunds are considered when requests are submitted
                            within 7 days of purchase and there has been limited
                            course consumption.
                        </p>
                    </section>

                    <section>
                        <h2
                            className="text-lg font-semibold"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            2. Non-Refundable Cases
                        </h2>
                        <p className="mt-2">
                            Refunds are not available after significant course
                            progress, completed certification, or when materials
                            have been downloaded and used.
                        </p>
                    </section>

                    <section>
                        <h2
                            className="text-lg font-semibold"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            3. Request Process
                        </h2>
                        <p className="mt-2">
                            Send your request to support@techseekho.com with
                            your registered email and transaction details. Our
                            team reviews claims within 5–7 business days.
                        </p>
                    </section>

                    <section>
                        <h2
                            className="text-lg font-semibold"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            4. Processing Timeline
                        </h2>
                        <p className="mt-2">
                            Approved refunds are issued to the original payment
                            method and may take 7–10 business days depending on
                            the provider.
                        </p>
                    </section>
                </div>
            </Card>
        </div>
    );
};

export default RefundPolicy;
