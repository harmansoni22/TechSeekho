"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "../components/layout/TopBar/TopBar";

const CommunityPage = () => {
  const discussions = [
    {
      id: 1,
      title: "Best practices for React state management in 2024",
      author: "Sarah Chen",
      replies: 23,
      views: 156,
      lastActivity: "2 hours ago",
      tags: ["React", "State Management", "Best Practices"],
      isHot: true,
    },
    {
      id: 2,
      title: "Help: Debugging async/await in Node.js",
      author: "Mike Johnson",
      replies: 8,
      views: 67,
      lastActivity: "4 hours ago",
      tags: ["Node.js", "Async/Await", "Debugging"],
      isHot: false,
    },
    {
      id: 3,
      title: "Machine Learning project showcase: Image classification",
      author: "Alex Rivera",
      replies: 15,
      views: 203,
      lastActivity: "6 hours ago",
      tags: ["Machine Learning", "Python", "Project Showcase"],
      isHot: true,
    },
    {
      id: 4,
      title: "Career advice: From bootcamp to FAANG",
      author: "Emma Davis",
      replies: 31,
      views: 445,
      lastActivity: "1 day ago",
      tags: ["Career", "FAANG", "Advice"],
      isHot: true,
    },
  ];

  const studyGroups = [
    {
      id: 1,
      name: "React Study Group",
      members: 45,
      nextSession: "Tomorrow, 7 PM IST",
      topic: "Advanced Hooks",
      isJoined: true,
    },
    {
      id: 2,
      name: "AI/ML Weekly Meetup",
      members: 78,
      nextSession: "Friday, 6 PM IST",
      topic: "Neural Networks Deep Dive",
      isJoined: false,
    },
    {
      id: 3,
      name: "Data Structures & Algorithms",
      members: 112,
      nextSession: "Saturday, 10 AM IST",
      topic: "Graph Algorithms",
      isJoined: true,
    },
  ];

  const topContributors = [
    { name: "Sarah Chen", points: 2450, badge: "Expert" },
    { name: "Mike Johnson", points: 1890, badge: "Mentor" },
    { name: "Alex Rivera", points: 1650, badge: "Innovator" },
    { name: "Emma Davis", points: 1420, badge: "Helper" },
  ];

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="Student Community"
        subtitle="Forum-style discussions, study groups, and peer support"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Discussions */}
        <div className="lg:col-span-2 space-y-5">
          {/* New Discussion Button */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <button
              className="w-full py-3 px-4 rounded-lg font-medium text-left"
              style={{
                backgroundColor: "var(--dashboard-primary)",
                color: "var(--dashboard-primary-fg)",
              }}
            >
              + Start a New Discussion
            </button>
          </Card>

          {/* Discussions List */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Recent Discussions
            </h3>
            <div className="space-y-4">
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className="p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-all"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: discussion.isHot
                      ? "color-mix(in srgb, var(--dashboard-surface) 95%, var(--dashboard-accent) 5%)"
                      : "var(--dashboard-surface)",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium" style={{ color: "var(--dashboard-fg)" }}>
                      {discussion.title}
                      {discussion.isHot && (
                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-500 text-white">
                          HOT
                        </span>
                      )}
                    </h4>
                  </div>

                  <p className="text-sm mb-3" style={{ color: "var(--dashboard-muted)" }}>
                    by {discussion.author}
                  </p>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex space-x-4" style={{ color: "var(--dashboard-muted)" }}>
                      <span>{discussion.replies} replies</span>
                      <span>{discussion.views} views</span>
                      <span>{discussion.lastActivity}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {discussion.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-md"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-primary) 20%)",
                          color: "var(--dashboard-primary)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Study Groups */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Study Groups
            </h3>
            <div className="space-y-3">
              {studyGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-3 rounded-lg border"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                  }}
                >
                  <h4 className="font-medium mb-1" style={{ color: "var(--dashboard-fg)" }}>
                    {group.name}
                  </h4>
                  <p className="text-sm mb-2" style={{ color: "var(--dashboard-muted)" }}>
                    {group.members} members • {group.topic}
                  </p>
                  <p className="text-xs mb-3" style={{ color: "var(--dashboard-accent)" }}>
                    Next: {group.nextSession}
                  </p>
                  <button
                    className={`w-full py-2 px-3 rounded-md text-sm font-medium ${
                      group.isJoined ? "border" : ""
                    }`}
                    style={
                      group.isJoined
                        ? {
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                          }
                        : {
                            backgroundColor: "var(--dashboard-primary)",
                            color: "var(--dashboard-primary-fg)",
                          }
                    }
                  >
                    {group.isJoined ? "Joined" : "Join Group"}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Contributors */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Top Contributors
            </h3>
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div key={contributor.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: "var(--dashboard-primary)",
                        color: "var(--dashboard-primary-fg)",
                      }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--dashboard-fg)" }}>
                        {contributor.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--dashboard-muted)" }}>
                        {contributor.points} points
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 text-xs rounded-full"
                    style={{
                      backgroundColor: "var(--dashboard-accent)",
                      color: "white",
                    }}
                  >
                    {contributor.badge}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Community Stats */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Community Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--dashboard-muted)" }}>Active Members:</span>
                <span style={{ color: "var(--dashboard-fg)" }}>2,847</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--dashboard-muted)" }}>Discussions:</span>
                <span style={{ color: "var(--dashboard-fg)" }}>1,203</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--dashboard-muted)" }}>Study Groups:</span>
                <span style={{ color: "var(--dashboard-fg)" }}>24</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--dashboard-muted)" }}>Your Rank:</span>
                <span style={{ color: "var(--dashboard-accent)" }}>#127</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;