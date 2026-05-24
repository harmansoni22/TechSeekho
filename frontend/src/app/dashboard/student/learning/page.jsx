"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";

const LearningPage = () => {
  const currentLesson = {
    title: "Introduction to React Hooks",
    course: "Full Stack Web Development",
    progress: 65,
    totalLessons: 42,
    currentLessonNumber: 27,
    estimatedTime: "15 min",
    nextLesson: "useEffect Hook Deep Dive",
  };

  const notes = [
    "Hooks allow function components to have state and lifecycle features",
    "useState returns a stateful value and a function to update it",
    "useEffect handles side effects in function components",
    "Custom hooks can be created for reusable logic",
  ];

  const curriculum = [
    { id: 1, title: "JavaScript Fundamentals", completed: true, lessons: 10 },
    { id: 2, title: "React Basics", completed: true, lessons: 8 },
    { id: 3, title: "React Hooks", completed: false, lessons: 12, current: true },
    { id: 4, title: "Advanced Patterns", completed: false, lessons: 12 },
  ];

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="Active Learning View"
        subtitle="Focus-optimized lesson player with integrated note-taking and curriculum tracking"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Lesson Player */}
        <div className="lg:col-span-2 space-y-5">
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              <p className="text-gray-500">Video Player Placeholder</p>
            </div>
            <h2 className="text-2xl font-semibold" style={{ color: "var(--dashboard-fg)" }}>
              {currentLesson.title}
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--dashboard-muted)" }}>
              {currentLesson.course} • Lesson {currentLesson.currentLessonNumber} of {currentLesson.totalLessons}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: "var(--dashboard-primary)",
                    color: "var(--dashboard-primary-fg)",
                  }}
                >
                  Previous
                </button>
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: "var(--dashboard-accent)",
                    color: "white",
                  }}
                >
                  Next: {currentLesson.nextLesson}
                </button>
              </div>
              <span className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                {currentLesson.estimatedTime} remaining
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "var(--dashboard-muted)" }}>Progress</span>
                <span style={{ color: "var(--dashboard-fg)" }}>{currentLesson.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${currentLesson.progress}%`,
                    backgroundColor: "var(--dashboard-primary)",
                  }}
                ></div>
              </div>
            </div>
          </Card>

          {/* Notes Section */}
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              My Notes
            </h3>
            <ul className="space-y-2">
              {notes.map((note, index) => (
                <li
                  key={index}
                  className="text-sm p-3 rounded-lg border"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "color-mix(in srgb, var(--dashboard-surface) 95%, var(--dashboard-primary) 5%)",
                    color: "var(--dashboard-fg)",
                  }}
                >
                  {note}
                </li>
              ))}
            </ul>
            <textarea
              placeholder="Add a new note..."
              className="w-full mt-4 p-3 rounded-lg border resize-none"
              rows={3}
              style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                color: "var(--dashboard-fg)",
              }}
            ></textarea>
          </Card>
        </div>

        {/* Curriculum Sidebar */}
        <div>
          <Card
            className="border"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
              Course Curriculum
            </h3>
            <div className="space-y-3">
              {curriculum.map((section) => (
                <div
                  key={section.id}
                  className={`p-3 rounded-lg border ${
                    section.current ? 'ring-2' : ''
                  }`}
                  style={{
                    borderColor: section.current ? "var(--dashboard-primary)" : "var(--dashboard-border)",
                    backgroundColor: section.completed
                      ? "color-mix(in srgb, var(--dashboard-surface) 90%, var(--dashboard-accent) 10%)"
                      : "var(--dashboard-surface)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium" style={{ color: "var(--dashboard-fg)" }}>
                      {section.title}
                    </h4>
                    {section.completed && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: "var(--dashboard-muted)" }}>
                    {section.lessons} lessons
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LearningPage;