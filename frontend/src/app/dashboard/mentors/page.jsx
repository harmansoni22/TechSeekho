"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "../components/layout/TopBar/TopBar";

const MentorsPage = () => {
  const mentors = [
    {
      id: 1,
      name: "Dr. Sarah Chen",
      title: "Senior AI Engineer at Google",
      expertise: ["Machine Learning", "Deep Learning", "Python"],
      rating: 4.9,
      sessions: 156,
      price: 75,
      availability: "Available now",
      image: "SC",
      bio: "PhD in Computer Science with 8+ years of experience in AI/ML. Helped 150+ students land FAANG roles.",
    },
    {
      id: 2,
      name: "Mike Johnson",
      title: "Full Stack Developer at Meta",
      expertise: ["React", "Node.js", "System Design"],
      rating: 4.8,
      sessions: 203,
      price: 60,
      availability: "Next available: Tomorrow",
      image: "MJ",
      bio: "10+ years in full-stack development. Specializes in scalable web applications and interview preparation.",
    },
    {
      id: 3,
      name: "Alex Rivera",
      title: "Data Scientist at Netflix",
      expertise: ["Data Science", "SQL", "Tableau"],
      rating: 4.7,
      sessions: 89,
      price: 70,
      availability: "Available now",
      image: "AR",
      bio: "Former data scientist at Netflix. Expert in data analysis, visualization, and machine learning applications.",
    },
    {
      id: 4,
      name: "Emma Davis",
      title: "DevOps Engineer at Amazon",
      expertise: ["AWS", "Docker", "Kubernetes"],
      rating: 4.9,
      sessions: 134,
      price: 65,
      availability: "Next available: Friday",
      image: "ED",
      bio: "Cloud architecture specialist with extensive experience in DevOps and infrastructure scaling.",
    },
  ];

  const upcomingSessions = [
    {
      id: 1,
      mentor: "Dr. Sarah Chen",
      topic: "ML Model Optimization",
      date: "2024-01-15",
      time: "2:00 PM IST",
      duration: "60 min",
    },
    {
      id: 2,
      mentor: "Mike Johnson",
      topic: "System Design Interview",
      date: "2024-01-17",
      time: "4:00 PM IST",
      duration: "45 min",
    },
  ];

  const getAvailabilityColor = (availability) => {
    if (availability.includes("Available now")) return "#22c55e";
    if (availability.includes("Tomorrow")) return "#f59e0b";
    return "var(--dashboard-muted)";
  };

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="Mentor Network"
        subtitle="Marketplace for 1:1 sessions with industry experts"
      />

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card
          className="border"
          style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
            Your Upcoming Sessions
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg border"
                style={{
                  borderColor: "var(--dashboard-border)",
                  backgroundColor: "color-mix(in srgb, var(--dashboard-surface) 95%, var(--dashboard-primary) 5%)",
                }}
              >
                <h4 className="font-medium mb-1" style={{ color: "var(--dashboard-fg)" }}>
                  {session.topic}
                </h4>
                <p className="text-sm mb-2" style={{ color: "var(--dashboard-muted)" }}>
                  with {session.mentor}
                </p>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--dashboard-muted)" }}>
                    {session.date} • {session.time}
                  </span>
                  <span style={{ color: "var(--dashboard-fg)" }}>
                    {session.duration}
                  </span>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    className="flex-1 px-3 py-2 rounded-md text-sm font-medium"
                    style={{
                      backgroundColor: "var(--dashboard-primary)",
                      color: "var(--dashboard-primary-fg)",
                    }}
                  >
                    Join Session
                  </button>
                  <button
                    className="px-3 py-2 rounded-md text-sm font-medium border"
                    style={{
                      borderColor: "var(--dashboard-border)",
                      color: "var(--dashboard-fg)",
                    }}
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mentor Marketplace */}
      <div className="grid gap-4 md:grid-cols-2">
        {mentors.map((mentor) => (
          <Card
            key={mentor.id}
            className="border cursor-pointer hover:shadow-lg transition-shadow"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <div className="flex items-start space-x-4 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{
                  backgroundColor: "var(--dashboard-primary)",
                  color: "var(--dashboard-primary-fg)",
                }}
              >
                {mentor.image}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold" style={{ color: "var(--dashboard-fg)" }}>
                  {mentor.name}
                </h3>
                <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                  {mentor.title}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm font-medium" style={{ color: "var(--dashboard-fg)" }}>
                      {mentor.rating}
                    </span>
                  </div>
                  <span className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                    • {mentor.sessions} sessions
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--dashboard-muted)" }}>
              {mentor.bio}
            </p>

            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: "var(--dashboard-muted)" }}>
                Expertise:
              </p>
              <div className="flex flex-wrap gap-1">
                {mentor.expertise.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 text-xs rounded-md"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-primary) 20%)",
                      color: "var(--dashboard-primary)",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-lg font-bold" style={{ color: "var(--dashboard-accent)" }}>
                  ${mentor.price}
                </span>
                <span className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                  /session
                </span>
              </div>
              <span
                className="px-2 py-1 text-xs rounded-full"
                style={{
                  backgroundColor: getAvailabilityColor(mentor.availability),
                  color: "white",
                }}
              >
                {mentor.availability}
              </span>
            </div>

            <button
              className="w-full py-2 px-4 rounded-md text-sm font-medium"
              style={{
                backgroundColor: "var(--dashboard-primary)",
                color: "var(--dashboard-primary-fg)",
              }}
            >
              Book Session
            </button>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <Card
        className="border"
        style={{
          borderColor: "var(--dashboard-border)",
          backgroundColor: "var(--dashboard-surface)",
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
          How Mentor Sessions Work
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-medium mb-1" style={{ color: "var(--dashboard-fg)" }}>
              Choose Your Mentor
            </h4>
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
              Browse profiles and select based on expertise and availability
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📅</div>
            <h4 className="font-medium mb-1" style={{ color: "var(--dashboard-fg)" }}>
              Schedule Session
            </h4>
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
              Book a convenient time and prepare your questions in advance
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🚀</div>
            <h4 className="font-medium mb-1" style={{ color: "var(--dashboard-fg)" }}>
              Learn & Grow
            </h4>
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
              Get personalized guidance and accelerate your career growth
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MentorsPage;