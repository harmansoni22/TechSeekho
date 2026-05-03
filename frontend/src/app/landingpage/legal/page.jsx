import Link from "next/link";
import CustomScroll from "../components/CustomScrollBar";
import Breadcrumbs from "../components/layout/Breadcrumbs/Breadcrumbs";

export const metadata = {
  	title: "Legal Center | Techseekho",
  	description:
    	"Access Techseekho legal documents including privacy policy, terms, and refund policy. Koshalyam Learning Solutions Pvt Ltd.",
};

const legalPages = [
  	{
    	title: "Privacy Policy",
    	description:
      		"Learn what data we collect, why we collect it, and how we protect your information.",
    	href: "/landingpage/privacy-policy",
  	},
  	{
    	title: "Terms & Conditions",
    	description:
      		"Read the terms that govern enrollments, account usage, and learning content access.",
    	href: "/landingpage/terms-and-conditions",
  	},
  	{
    	title: "Refund Policy",
    	description:
      		"Understand refund eligibility, request timelines, and processing details.",
    	href: "/landingpage/refund-policy",
  	},
];

const Legal = () => {
  	return (
    	<>
      		<CustomScroll />
      		<main className="mx-auto mt-25 w-full max-w-5xl px-4 pb-20 text-white">
        		<Breadcrumbs
          			items={[{ label: "Home", href: "/landingpage" }, { label: "Legal" }]}
        		/>

        		<h1 className="mt-4 text-center text-4xl font-semibold">
          			Legal Center
        		</h1>
        		<p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-7 text-white/75">
          			Browse all legal documents for TechSeekho. Use these pages to
          			understand your rights, responsibilities, and policies related to
          			enrollments and platform usage.
        		</p>

        		<section className="mt-10 grid gap-5 md:grid-cols-3">
          			{legalPages.map((page) => (
            			<Link
              				key={page.href}
              				href={page.href}
              				className="rounded-2xl border border-white/15 bg-white/5 p-6 transition hover:border-cyan-300/60 hover:bg-white/10"
            			>
              				<h2 className="text-xl font-medium">{page.title}</h2>
              				<p className="mt-3 text-sm leading-6 text-white/80">
                				{page.description}
              				</p>
              				<span className="mt-5 inline-block text-sm text-cyan-300">
                				Read document
              				</span>
            			</Link>
          			))}
        		</section>
      		</main>
    	</>
  	);
};

export default Legal;
