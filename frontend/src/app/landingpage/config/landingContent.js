import { api } from "@/lib/api";

export const HERO_CONTENT = {
    title: "Technology Skills Every Child Needs for the Future",
    subtitle:
        "65% of future jobs don't exist yet. Students who learn to build AI, program robots and create technology will have a career advantage that no textbook can match.",
    ctaLabel: "Find My Program",
};

export const LANDING_SECTION_TITLES = {
    whyChooseUs: "Why Techseekho?",
    whatWeOffer: "Skills That Define Tomorrow's Economy",
    testimonials: "What Families & Schools Say",
    callToAction: "Give Your Child the Skills of Tomorrow",
};

export const WHY_CHOOSE_US_ITEMS = [
    {
        heading: "100% Hands-On Learning",
        content:
            "Every class involves building real things. Not simulations. Not demos. Real robots, real drones, real AI systems.",
    },
    {
        heading: "NEP 2020 Certified",
        content:
            "Industry certificates, nationally recognised programs that integrate into your existing timetable seamlessly.",
    },
    {
        heading: "Career-Mapped Programs",
        content:
            "Every program links to a 2030 high-demand career. From AI Engineer to Robotics Engineer to Drone Engineer.",
    },
    {
        heading: "50+ Competition Wins",
        content:
            "State & national level achievements. Students from MP are winning championships in robotics and drone technology.",
    },
    {
        heading: "4.9 / 5 Rating",
        content:
            "Average parent & school satisfaction. Trusted by 120+ schools across Madhya Pradesh.",
    },
    {
        heading: "Delivered In Your School",
        content:
            "Labs, equipment and trainers come to you. No capital investment required for schools.",
    },
];

export const TESTIMONIALS_CONTENT = {
    heading: "What Families & Schools Say About Techseekho",
    items: [
        {
            quote: "My son was spending evenings on YouTube. After Techseekho robotics, he spends that same time building real robots. Extraordinary transformation.",
            name: "Priya Sharma",
            role: "Parent · Indore",
        },
        {
            quote: "We integrated Techseekho's AI program. Students now build real AI projects — placing us among MP's most forward-thinking institutions.",
            name: "Rajesh Patel",
            role: "Principal · Bhopal",
        },
        {
            quote: "My daughter built a functional drone at 13. Techseekho didn't just teach technology — they built her belief she can build anything.",
            name: "Sunita Verma",
            role: "Parent · Ujjain",
        },
        {
            quote: "Techseekho brought 60+ new enrollments because parents actively chose our school for the technology programs.",
            name: "Amit Joshi",
            role: "School Owner · Indore",
        },
        {
            quote: "I thought coding was only for IIT students. Techseekho showed me it's for everyone. I'm 12 and building my own app!",
            name: "Aryan Gupta",
            role: "Student, Age 12 · Gwalior",
        },
        {
            quote: "Our board visited the Techseekho lab and was immediately convinced. This is exactly what MP schools need.",
            name: "Dr. Meena Tiwari",
            role: "Education Officer · MP Govt",
        },
    ],
};

export const CALL_TO_ACTION_CONTENT = {
    heading: "Give Your Child the Skills of Tomorrow",
    subtitle:
        "Whether you're a parent, school principal, or from an education department — let's make it happen. Every week without technology skills is a week behind. The best time to start is today.",
    primaryButtonLabel: "Enroll Now",
    primaryButtonHref: "/signup",
    secondaryButtonLabel: "Partner Your School",
    secondaryButtonHref: "/landingpage/contact",
    newsletterTitle: "Join Our Newsletter",
    newsletterSubtitle:
        "Get learning tips, project ideas, and course updates in your inbox.",
    newsletterPlaceholder: "Enter your email address",
    newsletterButtonLabel: "Subscribe",
    newsletterTrustPills: ["No spam", "Weekly insights", "Unsubscribe anytime"],
    highlights: [
        "120+ Schools partnered across MP",
        "5000+ Students trained through school programs",
        "4.9★ School satisfaction rating",
    ],
};

export async function COURSES_FOR_LANDING_PAGE() {
    const courses = await api("/courses");
    // const COURSE = []

    // courses.map((course) => {
    //     COURSE.push(course);
    // })

    // return COURSE;

    return Array.isArray(courses) ? courses : [];
}
