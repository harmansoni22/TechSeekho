"use client";

import Card from "@/app/components/ui/Card";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";

const CoursesPage = () => {
  const courses = [
    {
      id: 1,
      name: "Full Stack Web Development",
      description: "Learn to build complete web applications from front to back",
      progress: 72,
      status: "active",
      lessons: 42,
      duration: "8 weeks",
    },
    {
      id: 2,
      name: "Data Structures & Algorithms",
      description: "Master the fundamentals of efficient programming",
      progress: 65,
      status: "active",
      lessons: 28,
      duration: "6 weeks",
    },
    {
      id: 3,
      name: "AI for Beginners",
      description: "Introduction to Artificial Intelligence and Machine Learning",
      progress: 61,
      status: "active",
      lessons: 19,
      duration: "5 weeks",
    },
    {
      id: 4,
      name: "Digital Marketing Pro",
      description: "Comprehensive digital marketing strategies and tools",
      progress: 58,
      status: "active",
      lessons: 11,
      duration: "4 weeks",
    },
  ];

  const wishlistCourses = [
    {
      id: 5,
      name: "Advanced React Patterns",
      description: "Deep dive into advanced React concepts and patterns",
      price: "$49",
    },
    {
      id: 6,
      name: "Cloud Architecture",
      description: "Design scalable cloud solutions with AWS and Azure",
      price: "$79",
    },
  ];

  return (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="My Courses"
        subtitle="Organized view of active, completed, and wishlisted courses"
      />

      {/* Active Courses */}
      <section>
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
          Active Courses
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.filter(course => course.status === "active").map((course) => (
            <Card
              key={course.id}
              className="border cursor-pointer hover:shadow-lg transition-shadow"
              style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
              }}
            >
              <h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
                {course.name}
              </h3>
              <p className="text-sm mt-2" style={{ color: "var(--dashboard-muted)" }}>
                {course.description}
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--dashboard-muted)" }}>Progress</span>
                  <span style={{ color: "var(--dashboard-fg)" }}>{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${course.progress}%`,
                      backgroundColor: "var(--dashboard-primary)",
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs" style={{ color: "var(--dashboard-muted)" }}>
                  <span>{course.lessons} lessons</span>
                  <span>{course.duration}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Wishlist */}
      <section>
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--dashboard-fg)" }}>
          Wishlist
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {wishlistCourses.map((course) => (
            <Card
              key={course.id}
              className="border cursor-pointer hover:shadow-lg transition-shadow"
              style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
              }}
            >
              <h3 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
                {course.name}
              </h3>
              <p className="text-sm mt-2" style={{ color: "var(--dashboard-muted)" }}>
                {course.description}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-lg font-bold" style={{ color: "var(--dashboard-accent)" }}>
                  {course.price}
                </span>
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: "var(--dashboard-primary)",
                    color: "var(--dashboard-primary-fg)",
                  }}
                >
                  Enroll Now
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CoursesPage;