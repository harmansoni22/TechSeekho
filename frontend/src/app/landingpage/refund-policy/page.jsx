import CustomScroll from "../../components/CustomScrollBar";
import Breadcrumbs from "../../components/layout/Breadcrumbs/Breadcrumbs";

export const metadata = {
  title: "Refund Policy",
  description:
    "Understand TechSeekho refund eligibility, timelines, and processing details.",
};

const RefundPolicy = () => {
  return (
    <>
      <CustomScroll />
      <main className="mx-auto mt-25 w-full max-w-4xl px-4 pb-20 text-white">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/landingpage" },
            { label: "Legal", href: "/landingpage/Pages/legal" },
            { label: "Refund Policy" },
          ]}
        />
        <h1 className="mt-4 text-center text-4xl font-semibold">
          Refund Policy
        </h1>
        <p className="mt-4 text-center text-sm text-white/70">
          Last updated: March 20, 2026
        </p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-white/85">
          <section>
            <h2 className="text-xl font-medium text-white">
              1. Refund Eligibility
            </h2>
            <p className="mt-2">
              Refund requests are considered for eligible enrollments submitted
              within 7 calendar days of payment, provided no significant course
              consumption has occurred.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white">
              2. Non-Refundable Cases
            </h2>
            <p className="mt-2">
              Refunds are generally not available after substantial access to
              course material, completed downloadable resources, or after the
              eligible request window.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white">
              3. How to Request
            </h2>
            <p className="mt-2">
              Email support@techseekho.com with your registered email, payment
              details, and reason for request. Our team reviews requests within
              5 to 7 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white">
              4. Refund Processing Time
            </h2>
            <p className="mt-2">
              Once approved, refunds are initiated to the original payment
              method and can take 7 to 10 business days depending on your bank
              or payment provider.
            </p>
          </section>
        </div>
      </main>
    </>
  );
};

export default RefundPolicy;
