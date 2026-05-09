import Image from "next/image";
import Link from "next/link";
import "../../../styles/footer.css";

const quickLinks = [
    { label: "Home", href: "/landingpage" },
    { label: "About", href: "/landingpage/about" },
    { label: "For Schools", href: "/landingpage/contact" },
    { label: "Programs", href: "/landingpage/courses" },
    { label: "Contact", href: "/landingpage/contact" },
    { label: "Legal", href: "/landingpage/legal" },
];

const legalLinks = [
    { label: "Legal Center", href: "/landingpage/legal" },
    { label: "Privacy Policy", href: "/landingpage/privacy-policy" },
    {
        label: "Terms & Conditions",
        href: "/landingpage/terms-and-conditions",
    },
    { label: "Refund Policy", href: "/landingpage/refund-policy" },
];

const featuredCourses = [
    {
        label: "Artificial Intelligence",
        href: "/landingpage/courses/course/artificial-intelligence",
    },
    {
        label: "Robotics Engineering",
        href: "/landingpage/courses/course/robotics-engineering",
    },
    {
        label: "Drone Technology",
        href: "/landingpage/courses/course/drone-technology",
    },
    {
        label: "Internet of Things",
        href: "/landingpage/courses/course/internet-of-things",
    },
];

const socialLinks = [
    { label: "X", href: "https://x.com" },
    { label: "GitHub", href: "https://github.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
];

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative w-full overflow-hidden text-white">
            <div className="absolute inset-0  bg-cover bg-center" />
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px]" />

            <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-4">
                        <Link
                            href="/landingpage"
                            className="inline-flex items-center gap-3"
                        >
                            <Image
                                src="/logo-removebg-preview.png"
                                alt="TechSeekho logo"
                                width={50}
                                height={50}
                                className="object-cover"
                            />
                            <span className="text-xl font-semibold tracking-wide">
                                TechSeekho
                            </span>
                        </Link>

                        <p className="text-sm leading-6 text-white/80">
                            Techseekho empowers school students with AI,
                            Robotics, Drone Technology, IoT, Coding and future
                            skills. A Koshalyam Learning Solutions initiative.
                        </p>

                        <Link
                            href="/landingpage/courses"
                            className="inline-flex bg-animation items-center rounded-full border border-cyan-300/60 px-4 py-2 text-sm font-medium text-cyan-200 transition"
                        >
                            Find My Program
                        </Link>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold">Quick Links</h3>
                        <ul className="mt-4 space-y-3 text-sm text-white/80">
                            {quickLinks.map((item, idx) => (
                                <li key={item.href[idx]}>
                                    <Link
                                        href={item.href}
                                        className="underline-animation"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold">
                            Featured Courses
                        </h3>
                        <ul className="mt-4 space-y-3 text-sm text-white/80">
                            {featuredCourses.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={`${item.href}?utm_source=landingpage`}
                                        className="underline-animation"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <h3 className="mt-7 text-lg font-semibold">Legal</h3>
                        <ul className="mt-4 space-y-3 text-sm text-white/80">
                            {legalLinks.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="underline-animation"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Get In Touch</h3>

                        <div className="space-y-2 text-sm text-white/80">
                            <p>support@techseekho.com</p>
                            <p>+91 98765 43210</p>
                            <p>Indore, Madhya Pradesh, India</p>
                        </div>

                        <div className="pt-2">
                            <p className="text-sm font-semibold text-white/90">
                                Follow us
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {socialLinks.map((item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-full bg-animation border px-3 py-1.5 text-xs font-medium text-white/85 transition border border-cyan-300/60"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 border-t border-white/15 pt-6">
                    <div className="flex flex-col gap-3 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            &copy; {currentYear} TechSeekho. All rights
                            reserved.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <Link
                                href="/landingpage/about"
                                className="underline-animation"
                            >
                                About
                            </Link>
                            <Link
                                href="/landingpage/services"
                                className="transition-colors underline-animation"
                            >
                                Services
                            </Link>
                            <Link
                                href="/landingpage/contact"
                                className="transition-colors underline-animation"
                            >
                                Contact
                            </Link>
                            <Link
                                href="/landingpage/legal"
                                className="transition-colors underline-animation"
                            >
                                Legal
                            </Link>
                            <Link
                                href="/landingpage/privacy-policy"
                                className="transition-colors underline-animation"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href="/landingpage/terms-and-conditions"
                                className="transition-colors underline-animation"
                            >
                                Terms & Conditions
                            </Link>
                            <Link
                                href="/landingpage/refund-policy"
                                className="transition-colors underline-animation"
                            >
                                Refund Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
