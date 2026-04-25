import { api } from "@/lib/api";

export const HERO_CONTENT = {
  title: "Welcome to Tech Seekho!",
  subtitle: "Explore and learn the art of technology with us.",
  ctaLabel: "Get Started",
};

export const LANDING_SECTION_TITLES = {
  whyChooseUs: "Why Choose us?",
  whatWeOffer: "What We Offer",
  testimonials: "Testimonials",
  callToAction: "Call To Action",
};

export const WHY_CHOOSE_US_ITEMS = [
  {
    heading: "Reliable Mentorship",
    content:
      "Learn from mentors who focus on practical outcomes and consistent support throughout your journey.",
  },
  {
    heading: "Project-Based Learning",
    content:
      "Build real-world projects while learning core concepts so your portfolio grows with your skills.",
  },
  {
    heading: "Career-Focused Roadmaps",
    content:
      "Follow structured learning paths designed to help you become job-ready with confidence.",
  },
];

export const TESTIMONIALS_CONTENT = {
  heading: "What People say about us",
  items: [
    {
      quote:
        "I stopped hopping between random tutorials and followed one clear path. Within weeks, I had projects I was proud to show.",
      name: "Neha Kapoor",
      role: "Frontend Developer",
    },
    {
      quote:
        "Mentors gave direct feedback on my code quality, not generic advice. That single change improved my pace a lot.",
      name: "Vikram Joshi",
      role: "Backend Intern",
    },
    {
      quote:
        "Every session felt practical. I could apply concepts immediately, and my confidence in interviews improved quickly.",
      name: "Sana Khan",
      role: "Career Switcher",
    },
    {
      quote:
        "Learning felt structured and calm. I always knew what to practice next, which removed confusion completely.",
      name: "Aarav Sharma",
      role: "Student",
    },
    {
      quote:
        "The curriculum felt modern and relevant. I used the same concepts in my internship tasks within the first month.",
      name: "Ishita Rao",
      role: "UI Engineer",
    },
    {
      quote:
        "The best part was accountability. Weekly reviews pushed me to finish projects instead of leaving them halfway.",
      name: "Karan Patel",
      role: "Software Engineer",
    },
    {
      quote:
        "Before joining, I was confused about where to start. Now I have a clear portfolio and a strong base in web development.",
      name: "Mehak Arora",
      role: "Junior Developer",
    },
    {
      quote:
        "The mentors explained complex backend topics in a simple way. I finally understand how APIs and databases connect.",
      name: "Rohit Tiwari",
      role: "Backend Trainee",
    },
    {
      quote:
        "I loved that everything was project-first. Building real features made learning far more effective than just theory.",
      name: "Pooja Nair",
      role: "Full Stack Learner",
    },
    {
      quote:
        "Code reviews were detailed and respectful. I improved my naming, structure, and debugging habits significantly.",
      name: "Aditya Mehra",
      role: "Frontend Intern",
    },
    {
      quote:
        "This program helped me switch from support to development with confidence. Mock interviews made a huge difference.",
      name: "Sonal Yadav",
      role: "Career Switcher",
    },
    {
      quote:
        "I used to fear JavaScript. Now I can build responsive, interactive pages and explain my decisions clearly.",
      name: "Manav Bhatia",
      role: "Web Developer",
    },
    {
      quote:
        "The teaching style was practical and beginner-friendly. I could ask basic questions without feeling judged.",
      name: "Ritika Sharma",
      role: "Student",
    },
    {
      quote:
        "Hands-on assignments and mentor checkpoints kept me consistent. I now ship small products end-to-end on my own.",
      name: "Harsh Gupta",
      role: "Product Engineer",
    },
    {
      quote:
        "I joined for AI basics and got much more: clean coding practices, real projects, and confidence in technical interviews.",
      name: "Nidhi Verma",
      role: "AI Enthusiast",
    },
    {
      quote:
        "From day one, the focus stayed on outcomes. I left with deployable projects, better problem-solving, and a stronger resume.",
      name: "Arjun Malhotra",
      role: "Graduate Learner",
    },
  ],
};

export const CALL_TO_ACTION_CONTENT = {
  heading: "Start Building Your Tech Career Today",
  subtitle:
    "Join practical, mentor-led learning paths designed to help you build projects, gain confidence, and become job-ready faster.",
  primaryButtonLabel: "Start Learning",
  primaryButtonHref: "/signup",
  secondaryButtonLabel: "Explore Courses",
  secondaryButtonHref: "/landingpage/courses",
  newsletterTitle: "Join Our Newsletter",
  newsletterSubtitle:
    "Get learning tips, project ideas, and course updates in your inbox.",
  newsletterPlaceholder: "Enter your email address",
  newsletterButtonLabel: "Subscribe",
  newsletterTrustPills: ["No spam", "Weekly insights", "Unsubscribe anytime"],
  highlights: [
    "Live mentor support",
    "Hands-on projects",
    "Career-focused guidance",
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
