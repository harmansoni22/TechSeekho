"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";

const LeaderboardPage = () => {
  const globalLeaderboard = [
    { rank: 1, name: "Sarah Chen", points: 15420, level: 45, badge: "Legend", change: 0 },
    { rank: 2, name: "Mike Johnson", points: 14850, level: 43, badge: "Master", change: 1 },
    { rank: 3, name: "Alex Rivera", points: 14230, level: 41, badge: "Expert", change: -1 },
    { rank: 4, name: "Emma Davis", points: 13890, level: 40, badge: "Expert", change: 2 },
    { rank: 5, name: "David Kim", points: 13560, level: 39, badge: "Expert", change: 0 },
    { rank: 6, name: "Lisa Wang", points: 13240, level: 38, badge: "Advanced", change: 1 },
    { rank: 7, name: "Tom Anderson", points: 12980, level: 37, badge: "Advanced", change: -2 },
    { rank: 8, name: "Anna Martinez", points: 12650, level: 36, badge: "Advanced", change: 3 },
    { rank: 9, name: "James Wilson", points: 12420, level: 35, badge: "Advanced", change: 0 },
    { rank: 10, name: "Sophie Brown", points: 12180, level: 34, badge: "Skilled", change: 1 },
  ];

  const leagues = [
    { name: "Bronze", minPoints: 0, maxPoints: 1000, color: "#CD7F32" },
    { name: "Silver", minPoints: 1000, maxPoints: 2500, color: "#C0C0C0" },
    { name: "Gold", minPoints: 2500, maxPoints: 5000, color: "#FFD700" },
    { name: "Platinum", minPoints: 5000, maxPoints: 10000, color: "#E5E4E2" },
    { name: "Diamond", minPoints: 10000, maxPoints: 20000, color: "#B9F2FF" },
    { name: "Legend", minPoints: 20000, maxPoints: 999999, color: "#FF6B6B" },
  ];

  const currentUser = {
    rank: 127,
    name: "You",
    points: 8750,
    level: 28,
    league: "Platinum",
    nextLeaguePoints: 10000,
  };

  const getRankChangeIcon = (change) => {
    if (change > 0) return "↑";
    if (change < 0) return "↓";
    return "→";
  };

  const getRankChangeColor = (change) => {
    if (change > 0) return "#22c55e";
    if (change < 0) return "#ef4444";
    return "var(--dashboard-muted)";
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case "Legend":
        return "#FF6B6B";
      case "Master":
        return "#8B5CF6";
      case "Expert":
        return "#3B82F6";
      case "Advanced":
        return "#10B981";
      case "Skilled":
        return "#F59E0B";
      default:
        return "var(--dashboard-muted)";
    }
  };

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="Leaderboard"
        subtitle="Gamified ranking system with leagues and experience-based progression"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2">
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
                Global Leaderboard
              </h3>
              <select
                className="px-3 py-1 rounded-md border text-sm"
                style={{
                  borderColor: "var(--dashboard-border)",
                  backgroundColor: "var(--dashboard-surface)",
                  color: "var(--dashboard-fg)",
                }}
              >
                <option>All Time</option>
                <option>This Month</option>
                <option>This Week</option>
              </select>
            </div>

            <div className="space-y-2">
              {globalLeaderboard.map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    user.rank <= 3 ? "ring-2" : ""
                  }`}
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: user.rank <= 3
                      ? "color-mix(in srgb, var(--dashboard-surface) 95%, var(--dashboard-accent) 5%)"
                      : "var(--dashboard-surface)",
                    boxShadow: user.rank <= 3 ? "var(--dashboard-shadow)" : "none",
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          user.rank <= 3 ? "text-white" : ""
                        }`}
                        style={{
                          backgroundColor: user.rank <= 3 ? "var(--dashboard-accent)" : "var(--dashboard-muted)",
                          color: user.rank <= 3 ? "white" : "var(--dashboard-fg)",
                        }}
                      >
                        {user.rank}
                      </span>
                      <span
                        style={{ color: getRankChangeColor(user.change) }}
                        className="text-sm"
                      >
                        {getRankChangeIcon(user.change)}
                      </span>
                    </div>

                    <div>
                      <p className="font-medium" style={{ color: "var(--dashboard-fg)" }}>
                        {user.name}
                      </p>
                      <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                        Level {user.level}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: getBadgeColor(user.badge),
                        color: "white",
                      }}
                    >
                      {user.badge}
                    </span>
                    <span className="font-semibold" style={{ color: "var(--dashboard-fg)" }}>
                      {user.points.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Your Rank */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Your Rank
            </h3>
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold"
                style={{
                  backgroundColor: "var(--dashboard-primary)",
                  color: "var(--dashboard-primary-fg)",
                }}
              >
                #{currentUser.rank}
              </div>
              <p className="text-sm mb-2" style={{ color: "var(--dashboard-muted)" }}>
                {currentUser.points.toLocaleString()} points • Level {currentUser.level}
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--dashboard-accent)" }}>
                {currentUser.league} League
              </p>
            </div>

            {/* Progress to next league */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "var(--dashboard-muted)" }}>Next: Diamond</span>
                <span style={{ color: "var(--dashboard-fg)" }}>
                  {currentUser.points}/{currentUser.nextLeaguePoints}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(currentUser.points / currentUser.nextLeaguePoints) * 100}%`,
                    backgroundColor: "var(--dashboard-accent)",
                  }}
                ></div>
              </div>
            </div>
          </Card>

          {/* Leagues */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Leagues
            </h3>
            <div className="space-y-3">
              {leagues.map((league) => (
                <div
                  key={league.name}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    backgroundColor: league.name === currentUser.league
                      ? "color-mix(in srgb, var(--dashboard-surface) 90%, var(--dashboard-primary) 10%)"
                      : "var(--dashboard-surface)",
                    border: league.name === currentUser.league ? "2px solid var(--dashboard-primary)" : "none",
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: league.color }}
                    ></div>
                    <span className="font-medium text-sm" style={{ color: "var(--dashboard-fg)" }}>
                      {league.name}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--dashboard-muted)" }}>
                    {league.minPoints.toLocaleString()}+
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Weekly Challenges */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Weekly Challenges
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border" style={{ borderColor: "var(--dashboard-border)" }}>
                <p className="font-medium text-sm mb-1" style={{ color: "var(--dashboard-fg)" }}>
                  Complete 5 lessons
                </p>
                <p className="text-xs mb-2" style={{ color: "var(--dashboard-muted)" }}>
                  +500 points
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full w-3/5"
                    style={{ backgroundColor: "var(--dashboard-accent)" }}
                  ></div>
                </div>
              </div>

              <div className="p-3 rounded-lg border" style={{ borderColor: "var(--dashboard-border)" }}>
                <p className="font-medium text-sm mb-1" style={{ color: "var(--dashboard-fg)" }}>
                  Score 90%+ on quiz
                </p>
                <p className="text-xs mb-2" style={{ color: "var(--dashboard-muted)" }}>
                  +300 points
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full w-1/5"
                    style={{ backgroundColor: "var(--dashboard-accent)" }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;