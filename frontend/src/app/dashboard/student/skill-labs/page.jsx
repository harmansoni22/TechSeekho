"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";

const SkillLabsPage = () => {
  const labs = [
    {
      id: 1,
      title: "React Component Builder",
      description: "Build interactive React components with real-time preview",
      difficulty: "Intermediate",
      duration: "45 min",
      technologies: ["React", "JavaScript", "CSS"],
      status: "available",
    },
    {
      id: 2,
      title: "API Integration Lab",
      description: "Connect to REST APIs and handle data fetching",
      difficulty: "Beginner",
      duration: "30 min",
      technologies: ["JavaScript", "Fetch API", "JSON"],
      status: "available",
    },
    {
      id: 3,
      title: "Data Visualization Dashboard",
      description: "Create charts and graphs using D3.js",
      difficulty: "Advanced",
      duration: "60 min",
      technologies: ["D3.js", "SVG", "Data Processing"],
      status: "coming_soon",
    },
    {
      id: 4,
      title: "Machine Learning Model Training",
      description: "Train a simple ML model with TensorFlow.js",
      difficulty: "Advanced",
      duration: "90 min",
      technologies: ["TensorFlow.js", "Python", "Data Science"],
      status: "coming_soon",
    },
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "#22c55e";
      case "Intermediate":
        return "#f59e0b";
      case "Advanced":
        return "#ef4444";
      default:
        return "var(--dashboard-muted)";
    }
  };

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="Skill Labs"
        subtitle="Sandboxed environments for hands-on practice"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => (
          <Card
            key={lab.id}
            className={`border cursor-pointer hover:shadow-lg transition-all ${
              lab.status === "coming_soon" ? "opacity-75" : ""
            }`}
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
                {lab.title}
              </h3>
              {lab.status === "coming_soon" && (
                <span
                  className="px-2 py-1 text-xs rounded-full"
                  style={{
                    backgroundColor: "var(--dashboard-muted)",
                    color: "var(--dashboard-surface)",
                  }}
                >
                  Coming Soon
                </span>
              )}
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--dashboard-muted)" }}>
              {lab.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--dashboard-muted)" }}>Difficulty:</span>
                <span style={{ color: getDifficultyColor(lab.difficulty) }}>
                  {lab.difficulty}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--dashboard-muted)" }}>Duration:</span>
                <span style={{ color: "var(--dashboard-fg)" }}>{lab.duration}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: "var(--dashboard-muted)" }}>
                Technologies:
              </p>
              <div className="flex flex-wrap gap-1">
                {lab.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 text-xs rounded-md"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-primary) 20%)",
                      color: "var(--dashboard-primary)",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <button
              className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                lab.status === "coming_soon"
                  ? "cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              disabled={lab.status === "coming_soon"}
              style={{
                backgroundColor: lab.status === "coming_soon" ? "var(--dashboard-muted)" : "var(--dashboard-primary)",
                color: lab.status === "coming_soon" ? "var(--dashboard-surface)" : "var(--dashboard-primary-fg)",
              }}
            >
              {lab.status === "coming_soon" ? "Coming Soon" : "Start Lab"}
            </button>
          </Card>
        ))}
      </div>

      {/* Lab Environment Info */}
      <Card
        className="border"
        style={{
          borderColor: "var(--dashboard-border)",
          backgroundColor: "var(--dashboard-surface)",
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
          Lab Environment
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-2" style={{ color: "var(--dashboard-fg)" }}>
              Features
            </h4>
            <ul className="text-sm space-y-1" style={{ color: "var(--dashboard-muted)" }}>
              <li>• Real-time code execution</li>
              <li>• Auto-save progress</li>
              <li>• Integrated debugging tools</li>
              <li>• Collaborative coding (coming soon)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2" style={{ color: "var(--dashboard-fg)" }}>
              Supported Languages
            </h4>
            <ul className="text-sm space-y-1" style={{ color: "var(--dashboard-muted)" }}>
              <li>• JavaScript/TypeScript</li>
              <li>• Python</li>
              <li>• HTML/CSS</li>
              <li>• SQL</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SkillLabsPage;