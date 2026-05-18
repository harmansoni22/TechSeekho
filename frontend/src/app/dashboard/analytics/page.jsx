"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "@/app/dashboard/components/layout/TopBar/TopBar";
import { useDashboardData } from "@/app/dashboard/hooks/useDashboardData";

const Analytics = () => {
  const { weeklyTraffic, topCourses } = useDashboardData();
  const maxVisitors = Math.max(...weeklyTraffic.map((item) => item.visitors));

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="Analytics"
        subtitle="Your study time and completion trends"
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border" style={{ borderColor: "var(--dashboard-border)", backgroundColor: "var(--dashboard-surface)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
            Weekly Study Hours
          </h3>
          <div className="mt-4 space-y-3">
            {weeklyTraffic.map((item) => (
              <div key={item.day} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--dashboard-muted)" }}>{item.day}</span>
                  <span className="font-medium" style={{ color: "var(--dashboard-fg)" }}>
                    {item.visitors}h
                  </span>
                </div>
                <div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: "color-mix(in srgb, var(--dashboard-surface) 86%, var(--dashboard-primary) 14%)" }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(item.visitors / maxVisitors) * 100}%`,
                      backgroundColor: "var(--dashboard-primary)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border" style={{ borderColor: "var(--dashboard-border)", backgroundColor: "var(--dashboard-surface)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
            Course Progress
          </h3>
          <div className="mt-4 space-y-3">
            {topCourses.map((course) => (
              <div
                key={course.name}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--dashboard-border)" }}
              >
                <p className="font-medium" style={{ color: "var(--dashboard-fg)" }}>{course.name}</p>
                <p className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                  Completion: {course.completion}% • Lessons: {course.enrollments}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Analytics;

