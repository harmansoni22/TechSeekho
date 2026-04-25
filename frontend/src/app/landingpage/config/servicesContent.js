export const SERVICES_METADATA = {
  title: "Services | TechSeekho",
  description:
    "Choose how you want to learn: cohorts, mentorship, project support, and career help.",
  hero: {
    headline: "Pick the support you need to grow in tech.",
    sub: "Start with a clear path, build real work, and get practical feedback from mentors.",
    ctaPrimary: "Explore Courses",
    ctaSecondary: "Talk To Our Team",
  },
};

export const SERVICE_FLOW = [
  {
    id: "01",
    title: "Choose your path",
    detail: "Pick a service based on your goal and current level.",
  },
  {
    id: "02",
    title: "Build with guidance",
    detail: "Follow tasks and projects with mentor support.",
  },
  {
    id: "03",
    title: "Improve faster",
    detail: "Get review that helps you fix weak spots early.",
  },
  {
    id: "04",
    title: "Ship your work",
    detail: "Turn your output into portfolio proof and interview confidence.",
  },
];

export const SERVICES = [
  {
    id: 1,
    icon: "LC",
    title: "Live Cohorts",
    shortDesc: "Structured learning with mentors",
    fullDesc:
      "Join live classes with clear weekly goals. Learn concepts, build tasks, and stay consistent with mentor guidance.",
    features: [
      "Live weekly sessions",
      "Project-based assignments",
      "Peer learning groups",
      "Capstone guidance",
      "Completion certificate",
    ],
    color: "#7dd3fc",
  },
  {
    id: 2,
    icon: "M1",
    title: "1:1 Mentorship",
    shortDesc: "Personal guidance for your journey",
    fullDesc:
      "Work directly with a mentor on your code, roadmap, and career direction. Great when you need focused support.",
    features: [
      "Weekly mentor calls",
      "Code and architecture review",
      "Resume and profile feedback",
      "Interview preparation",
    ],
    color: "#a5b4fc",
  },
  {
    id: 3,
    icon: "PT",
    title: "Project Track",
    shortDesc: "Build strong portfolio projects",
    fullDesc:
      "Take projects from idea to deployment with practical review at every stage, including planning, coding, and polish.",
    features: [
      "Project planning support",
      "Code quality reviews",
      "Deployment guidance",
      "Portfolio storytelling",
    ],
    color: "#fbbf24",
  },
  {
    id: 4,
    icon: "CS",
    title: "Career Services",
    shortDesc: "Get ready for interviews and offers",
    fullDesc:
      "Prepare for job applications with mock interviews, profile updates, and practical advice on how to present your work.",
    features: [
      "Resume improvement",
      "Mock interview sessions",
      "Role-based preparation",
      "Offer and salary guidance",
    ],
    color: "#6ee7b7",
  },
];

export const PRICING_TIERS = [
  {
    id: "starter",
    title: "Starter",
    price: "Free",
    period: "",
    features: [
      "Community access",
      "Starter resources",
      "Recorded learning samples",
    ],
    cta: "Start Free",
  },
  {
    id: "pro",
    title: "Pro",
    price: "$99",
    period: "/month",
    features: [
      "Full cohort access",
      "Mentor review loops",
      "Project track support",
      "Career prep sessions",
    ],
    cta: "Choose Pro",
    highlight: true,
  },
  {
    id: "premium",
    title: "Premium",
    price: "$249",
    period: "/month",
    features: [
      "Dedicated 1:1 mentorship",
      "Priority review turnaround",
      "Advanced interview prep",
      "Personal growth roadmap",
    ],
    cta: "Choose Premium",
  },
];

export const TESTIMONIALS = [
  {
    name: "Aisha Khan",
    role: "Frontend Engineer",
    quote:
      "The roadmap was clear and the mentor feedback was practical. I felt confident in interviews.",
  },
  {
    name: "Ravi Patel",
    role: "ML Engineer",
    quote:
      "Project track helped me move from theory to real execution. I learned how to ship properly.",
  },
  {
    name: "Sana Gupta",
    role: "Fullstack Developer",
    quote:
      "Career support made a big difference. My profile and interview approach improved a lot.",
  },
];

export const WHY_CHOOSE_SECTION = [
  {
    title: "Mentors who review real work",
    desc: "You get practical feedback, not generic comments.",
  },
  {
    title: "Learning by building",
    desc: "Every track includes hands-on tasks and projects.",
  },
  {
    title: "Clear next steps",
    desc: "You always know what to do next in your journey.",
  },
  {
    title: "Career-focused support",
    desc: "We prepare you for interviews and real job expectations.",
  },
];

export const FAQ_ITEMS = [
  {
    q: "How long does a cohort run?",
    a: "Most cohorts run for 8 to 12 weeks, based on the track.",
  },
  {
    q: "Can I upgrade my plan later?",
    a: "Yes. You can upgrade any time as your needs change.",
  },
  {
    q: "Do I get project feedback?",
    a: "Yes. Feedback is a core part of all paid plans.",
  },
  {
    q: "Will I get help with interviews?",
    a: "Yes. Career Services includes interview practice and profile improvements.",
  },
];

export const SERVICES_CTA = {
  eyebrow: "Ready To Start",
  title: "Pick a service and begin this week.",
  description:
    "Choose the format that fits your goal and let us guide you step by step.",
  primaryButtonLabel: "Explore Courses",
  primaryButtonHref: "/landingpage/Pages/courses",
  secondaryButtonLabel: "Contact Us",
  secondaryButtonHref: "/landingpage/Pages/contact",
};
