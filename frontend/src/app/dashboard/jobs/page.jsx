"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "../components/layout/TopBar/TopBar";

const JobsPage = () => {
  const jobMatches = [
    {
      id: 1,
      title: "Frontend Developer",
      company: "TechCorp Inc.",
      location: "Remote",
      salary: "$80k - $100k",
      matchScore: 95,
      skills: ["React", "JavaScript", "CSS"],
      type: "Full-time",
      posted: "2 days ago",
      description: "Join our team to build amazing user experiences with modern web technologies.",
    },
    {
      id: 2,
      title: "AI/ML Engineer",
      company: "DataFlow Solutions",
      location: "San Francisco, CA",
      salary: "$120k - $150k",
      matchScore: 88,
      skills: ["Python", "TensorFlow", "Machine Learning"],
      type: "Full-time",
      posted: "1 week ago",
      description: "Work on cutting-edge AI projects and help shape the future of machine learning.",
    },
    {
      id: 3,
      title: "Full Stack Developer",
      company: "StartupXYZ",
      location: "New York, NY",
      salary: "$90k - $120k",
      matchScore: 82,
      skills: ["React", "Node.js", "MongoDB"],
      type: "Full-time",
      posted: "3 days ago",
      description: "Build scalable web applications from concept to deployment in a fast-paced startup environment.",
    },
  ];

  const applications = [
    {
      id: 1,
      jobTitle: "Frontend Developer",
      company: "TechCorp Inc.",
      status: "Under Review",
      appliedDate: "2024-01-10",
      nextStep: "Technical Interview",
    },
    {
      id: 2,
      jobTitle: "React Developer",
      company: "WebSolutions Ltd.",
      status: "Interview Scheduled",
      appliedDate: "2024-01-08",
      nextStep: "Final Round - Jan 20",
    },
  ];

  const getMatchScoreColor = (score) => {
    if (score >= 90) return "#22c55e";
    if (score >= 80) return "#f59e0b";
    return "#ef4444";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Under Review":
        return "#f59e0b";
      case "Interview Scheduled":
        return "#3b82f6";
      case "Rejected":
        return "#ef4444";
      case "Accepted":
        return "#22c55e";
      default:
        return "var(--dashboard-muted)";
    }
  };

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="Job Board"
        subtitle="Skill-matched career opportunities with integrated application tracking"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Job Matches */}
        <div className="lg:col-span-2 space-y-5">
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
                Recommended Jobs
              </h3>
              <div className="flex space-x-2">
                <select
                  className="px-3 py-1 rounded-md border text-sm"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                    color: "var(--dashboard-fg)",
                  }}
                >
                  <option>All Locations</option>
                  <option>Remote</option>
                  <option>On-site</option>
                </select>
                <select
                  className="px-3 py-1 rounded-md border text-sm"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                    color: "var(--dashboard-fg)",
                  }}
                >
                  <option>All Types</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {jobMatches.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg" style={{ color: "var(--dashboard-fg)" }}>
                        {job.title}
                      </h4>
                      <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                        {job.company} • {job.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className="px-2 py-1 text-xs rounded-full mb-2 inline-block"
                        style={{
                          backgroundColor: getMatchScoreColor(job.matchScore),
                          color: "white",
                        }}
                      >
                        {job.matchScore}% match
                      </span>
                      <p className="text-sm font-medium" style={{ color: "var(--dashboard-accent)" }}>
                        {job.salary}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm mb-3" style={{ color: "var(--dashboard-muted)" }}>
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-wrap gap-1">
                      {job.skills.map((skill) => (
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
                    <span className="text-xs" style={{ color: "var(--dashboard-muted)" }}>
                      {job.posted}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      className="flex-1 px-4 py-2 rounded-md text-sm font-medium"
                      style={{
                        backgroundColor: "var(--dashboard-primary)",
                        color: "var(--dashboard-primary-fg)",
                      }}
                    >
                      Apply Now
                    </button>
                    <button
                      className="px-4 py-2 rounded-md text-sm font-medium border"
                      style={{
                        borderColor: "var(--dashboard-border)",
                        color: "var(--dashboard-fg)",
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Application Tracker */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Application Tracker
            </h3>
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-lg border"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                  }}
                >
                  <h4 className="font-medium text-sm mb-1" style={{ color: "var(--dashboard-fg)" }}>
                    {app.jobTitle}
                  </h4>
                  <p className="text-xs mb-2" style={{ color: "var(--dashboard-muted)" }}>
                    {app.company}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: getStatusColor(app.status),
                        color: "white",
                      }}
                    >
                      {app.status}
                    </span>
                    <span className="text-xs" style={{ color: "var(--dashboard-muted)" }}>
                      Applied {app.appliedDate}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--dashboard-accent)" }}>
                    Next: {app.nextStep}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Job Search Tips */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Job Search Tips
            </h3>
            <ul className="text-sm space-y-2" style={{ color: "var(--dashboard-muted)" }}>
              <li>• Complete your profile for better matches</li>
              <li>• Highlight relevant projects in applications</li>
              <li>• Prepare for technical interviews</li>
              <li>• Network with alumni and mentors</li>
              <li>• Follow up on applications within a week</li>
            </ul>
          </Card>

          {/* Skills Assessment */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Skills Assessment
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "var(--dashboard-muted)" }}>React</span>
                  <span style={{ color: "var(--dashboard-fg)" }}>85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: "85%", backgroundColor: "var(--dashboard-primary)" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "var(--dashboard-muted)" }}>JavaScript</span>
                  <span style={{ color: "var(--dashboard-fg)" }}>78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: "78%", backgroundColor: "var(--dashboard-primary)" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "var(--dashboard-muted)" }}>Python</span>
                  <span style={{ color: "var(--dashboard-fg)" }}>65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: "65%", backgroundColor: "var(--dashboard-accent)" }}
                  ></div>
                </div>
              </div>
            </div>
            <button
              className="w-full mt-4 py-2 px-4 rounded-md text-sm font-medium"
              style={{
                backgroundColor: "var(--dashboard-primary)",
                color: "var(--dashboard-primary-fg)",
              }}
            >
              Take Skills Assessment
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;