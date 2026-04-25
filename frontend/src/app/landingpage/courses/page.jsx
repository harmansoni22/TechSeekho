import Link from "next/link";
import Badge from "@/app/components/ui/Badge";
import {
  formatCourseDate,
  getCourseDurationLabel,
} from "@/app/landingpage/lib/courseUtils";
import { getAllCourses } from "@/app/landingpage/services/courses.service";
import CustomScroll from "../../components/CustomScrollBar";

export const metadata = {
  title: "Courses | TechSeekho",
  description:
    "Browse all TechSeekho courses with start dates, status, and duration details.",
};

function resolveCourseStatus(course) {
  if (course.status) return course.status;
  return new Date(course.startsAt) <= new Date() ? "Ongoing" : "Upcoming";
}

function getStatusStyles(status) {
  if (status === "Ongoing") {
    return {
      dot: "bg-red-900",
      chip: "border-red-400/45 bg-red-500/12 text-red-100",
    };
  }

  if (status === "Upcoming") {
    return {
      dot: "bg-green-500",
      chip: "border-green-400/45 bg-green-500/12 text-green-100",
    };
  }

  return {
    dot: "bg-zinc-400",
    chip: "border-zinc-400/35 bg-zinc-500/12 text-zinc-100",
  };
}

function buildCourseHref({ slug, id, userAuthenticated }) {
  const query = new URLSearchParams({ id: String(id) });
  if (userAuthenticated) {
    query.set("user_authenticated", "true");
  }
  return `/landingpage/courses/course/${slug}?${query.toString()}`;
}

const CoursesPage = async ({ searchParams }) => {
  const params = await Promise.resolve(searchParams);
  const isUserAuthenticated = params?.user_authenticated === "true";
  const courses = await getAllCourses();

  const decoratedCourses = courses.map((course) => {
    const status = resolveCourseStatus(course);
    return {
      ...course,
      status,
      duration: getCourseDurationLabel(course.startsAt, course.endDate),
      statusStyles: getStatusStyles(status),
    };
  });

  const ongoingCount = decoratedCourses.filter(
    (course) => course.status === "Ongoing",
  ).length;
  const upcomingCount = decoratedCourses.filter(
    (course) => course.status === "Upcoming",
  ).length;

  return (
    <>
      <CustomScroll />

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-24 text-white sm:px-6 sm:pt-28">
        <section className="border-b border-white/10 pb-12">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-white">
            Courses
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
            Browse all available courses and open any course to see details.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/14 bg-white/[0.03] px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white/80">
              Total: {decoratedCourses.length}
            </span>
            <span className="rounded-full border border-green-400/38 bg-green-500/12 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-green-100">
              Upcoming: {upcomingCount}
            </span>
            <span className="rounded-full border border-red-400/38 bg-red-500/12 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-red-100">
              Ongoing: {ongoingCount}
            </span>
          </div>
        </section>

        <section className="py-12">
          {decoratedCourses.length === 0 ? (
            <article className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-10 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-100/70">
                No Courses Yet
              </p>
              <p className="mt-3 text-white/72">
                Courses will appear here once they are published.
              </p>
            </article>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 sm:grid-cols-1 xl:grid-cols-3">
              {decoratedCourses.map((course) => {
                const isOngoing = course.status !== "Upcoming";
                return (
                  <article
                    key={course.id}
                    className="group flex h-full select-none flex-col rounded-2xl border border-white/12 bg-white/[0.03] p-5 transition duration-200 hover:-translate-y-1 hover:border-white/28"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* <span className="rounded-full border border-white/14 bg-[#050c18] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/76">
                        {course.status === "Upcoming" ? "Starts:" : "Started:"}{" "}
                        {formatCourseDate(course.startsAt)}
                      </span> */}
                      <Badge
                        variant={
                          course.status === "Upcoming" ? "success" : "danger"
                        }
                      >
                        {course.status === "Upcoming" ? "Starts:" : "Started:"}{" "}
                        {formatCourseDate(course.startsAt)}
                      </Badge>

                      {/* <span
                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${course.statusStyles.chip}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${course.statusStyles.dot}`}
                        />
                        {course.status}
                      </span> */}
                      <Badge
                        variant="glass"
                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${course.statusStyles.chip}`}
                      >
                        {/* <span className={`h-2 w-2 rounded-full ${course.statusStyles.chip}`} /> */}
                        <span className="relative flex h-2.5 w-2.5">
                          {isOngoing && (
                            <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-700 animate-ping" />
                          )}
                          <span
                            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isOngoing ? "bg-red-500" : "bg-green-500"}`}
                          />
                        </span>
                        {course.status}
                      </Badge>
                    </div>

                    <h2 className="mt-5 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-white">
                      {course.title}
                    </h2>

                    <p className="mt-3 flex-1 text-sm leading-7 text-white/72">
                      {course.description}
                    </p>

                    <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.14em] text-white/62">
                      <p>Duration: {course.duration}</p>
                      <p>Ends: {formatCourseDate(course.endDate)}</p>
                    </div>

                    <Link
                      href={buildCourseHref({
                        slug: course.slug,
                        id: course.id,
                        userAuthenticated: isUserAuthenticated,
                      })}
                      className="mt-5 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/86 transition hover:border-white/40 hover:bg-white/8"
                    >
                      View Course
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default CoursesPage;
