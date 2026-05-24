"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";

const CertificationsPage = () => {
  const certificationPaths = [
    {
      id: 1,
      title: "AI Engineering Specialist",
      description: "Master AI development from fundamentals to advanced applications",
      progress: 65,
      totalMilestones: 12,
      completedMilestones: 8,
      estimatedCompletion: "3 months",
      skills: ["Machine Learning", "Deep Learning", "Python", "TensorFlow"],
      status: "in_progress",
    },
    {
      id: 2,
      title: "Full Stack Developer Pro",
      description: "Complete web development mastery with modern technologies",
      progress: 45,
      totalMilestones: 15,
      completedMilestones: 7,
      estimatedCompletion: "4 months",
      skills: ["React", "Node.js", "Database Design", "DevOps"],
      status: "in_progress",
    },
    {
      id: 3,
      title: "Data Science Professional",
      description: "Become a data science expert with practical applications",
      progress: 0,
      totalMilestones: 10,
      completedMilestones: 0,
      estimatedCompletion: "5 months",
      skills: ["Statistics", "Python", "SQL", "Visualization"],
      status: "not_started",
    },
  ];

  const completedCertifications = [
    {
      id: 4,
      title: "JavaScript Fundamentals",
      completedDate: "2024-01-15",
      grade: "A+",
      issuer: "TechSeekho",
    },
    {
      id: 5,
      title: "React Developer Certification",
      completedDate: "2024-02-20",
      grade: "A",
      issuer: "TechSeekho",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "in_progress":
        return "var(--dashboard-accent)";
      case "completed":
        return "#22c55e";
      case "not_started":
        return "var(--dashboard-muted)";
      default:
        return "var(--dashboard-muted)";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "not_started":
        return "Not Started";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="Certification Paths"
        subtitle="Structured journeys with milestone tracking"
      />

      {/* Active Certification Paths */}
      <section>
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
          Active Paths
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {certificationPaths.map((path) => (
            <Card
              key={path.id}
              className="border"
              style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
                  {path.title}
                </h3>
                <span
                  className="px-2 py-1 text-xs rounded-full"
                  style={{
                    backgroundColor: getStatusColor(path.status),
                    color: "white",
                  }}
                >
                  {getStatusText(path.status)}
                </span>
              </div>

              <p className="text-sm mb-4" style={{ color: "var(--dashboard-muted)" }}>
                {path.description}
              </p>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: "var(--dashboard-muted)" }}>Progress</span>
                  <span style={{ color: "var(--dashboard-fg)" }}>
                    {path.completedMilestones}/{path.totalMilestones} milestones
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${path.progress}%`,
                      backgroundColor: "var(--dashboard-primary)",
                    }}
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm mb-2" style={{ color: "var(--dashboard-muted)" }}>
                  Key Skills:
                </p>
                <div className="flex flex-wrap gap-1">
                  {path.skills.map((skill) => (
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

              <div className="flex justify-between items-center text-sm">
                <span style={{ color: "var(--dashboard-muted)" }}>
                  Est. completion: {path.estimatedCompletion}
                </span>
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: "var(--dashboard-primary)",
                    color: "var(--dashboard-primary-fg)",
                  }}
                >
                  Continue Path
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Completed Certifications */}
      <section>
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
          Completed Certifications
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {completedCertifications.map((cert) => (
            <Card
              key={cert.id}
              className="border"
              style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
                  {cert.title}
                </h3>
                <span
                  className="px-3 py-1 text-sm font-bold rounded-md"
                  style={{
                    backgroundColor: "#22c55e",
                    color: "white",
                  }}
                >
                  {cert.grade}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--dashboard-muted)" }}>Completed:</span>
                  <span style={{ color: "var(--dashboard-fg)" }}>
                    {new Date(cert.completedDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--dashboard-muted)" }}>Issuer:</span>
                  <span style={{ color: "var(--dashboard-fg)" }}>{cert.issuer}</span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  className="flex-1 px-3 py-2 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: "var(--dashboard-primary)",
                    color: "var(--dashboard-primary-fg)",
                  }}
                >
                  View Certificate
                </button>
                <button
                  className="flex-1 px-3 py-2 rounded-md text-sm font-medium border"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    color: "var(--dashboard-fg)",
                  }}
                >
                  Share
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Certification Benefits */}
      <Card
        className="border"
        style={{
          borderColor: "var(--dashboard-border)",
          backgroundColor: "var(--dashboard-surface)",
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
          Certification Benefits
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl mb-2">🏆</div>
            <h4 className="font-medium mb-1" style={{ color: "var(--dashboard-fg)" }}>
              Industry Recognition
            </h4>
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
              Earn credentials valued by employers worldwide
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-medium mb-1" style={{ color: "var(--dashboard-fg)" }}>
              Career Advancement
            </h4>
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
              Boost your resume and open new job opportunities
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-medium mb-1" style={{ color: "var(--dashboard-fg)" }}>
              Skill Validation
            </h4>
            <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
              Prove your expertise with verified assessments
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CertificationsPage;