import { notFound, redirect } from "next/navigation";
import {
    formatCourseDate,
    getCourseDurationLabel,
} from "../../../lib/courseUtils";
import {
    getCourseBySlug,
    getCourseReviewsById,
} from "../../../service/courses.service";
import CourseProductExperience from "./CourseProductExperience";

function getStringParam(value) {
    return typeof value === "string" ? value : null;
}

function buildCanonicalCourseUrl(slug, courseId, searchParams = {}) {
    const query = new URLSearchParams({ id: courseId });

    if (searchParams.user_authenticated) {
        query.set("user_authenticated", searchParams.user_authenticated);
    }

    if (searchParams.utm_source) {
        query.set("utm_source", searchParams.utm_source);
    }

    return `/landingpage/Pages/courses/course/${slug}?${query.toString()}`;
}

function resolveCourseStatus(course) {
    if (course.status) return course.status;
    return new Date(course.startsAt) <= new Date() ? "Ongoing" : "Upcoming";
}

export async function generateMetadata({ params, searchParams }) {
    const { slug } = await Promise.resolve(params);
    const resolvedSearchParams = await Promise.resolve(searchParams);

    const course = await getCourseBySlug(slug);
    if (!course) {
        return {
            title: "Course Not Found",
            description: "The requested course could not be found.",
        };
    }

    const id = getStringParam(resolvedSearchParams?.id);
    const userAuthenticated = getStringParam(
        resolvedSearchParams?.user_authenticated,
    );
    const utmSource = getStringParam(resolvedSearchParams?.utm_source);

    if (id !== course.id) {
        redirect(
            buildCanonicalCourseUrl(slug, course.id, {
                user_authenticated: userAuthenticated,
                utm_source: utmSource || "landingpage",
            }),
        );
    }

    return {
        title: `${course.title} | TechSeekho`,
        description: course.description,
    };
}

const CourseDetailsPage = async ({ params, searchParams }) => {
    const { slug } = await Promise.resolve(params);
    const resolvedSearchParams = await Promise.resolve(searchParams);

    const course = await getCourseBySlug(slug);
    if (!course) notFound();

    const id = getStringParam(resolvedSearchParams?.id);
    const userAuthenticated = getStringParam(
        resolvedSearchParams?.user_authenticated,
    );
    const utmSource = getStringParam(resolvedSearchParams?.utm_source);

    if (id !== course.id) {
        redirect(
            buildCanonicalCourseUrl(slug, course.id, {
                user_authenticated: userAuthenticated,
                utm_source: utmSource,
            }),
        );
    }

    const status = resolveCourseStatus(course);
    const duration = getCourseDurationLabel(course.startsAt, course.endDate);
    const startsLabel = formatCourseDate(course.startsAt);
    const endsLabel = formatCourseDate(course.endDate);
    let reviewPayload = null;
    try {
        reviewPayload = await getCourseReviewsById(course.id);
    } catch (_error) {
        reviewPayload = null;
    }
    const coursesBackHref = userAuthenticated
        ? "/landingpage/Pages/courses?user_authenticated=true"
        : "/landingpage/Pages/courses";

    return (
        <CourseProductExperience
            course={course}
            status={status}
            duration={duration}
            startsLabel={startsLabel}
            endsLabel={endsLabel}
            reviewRows={reviewPayload?.reviews || []}
            reviewSourceUrl={reviewPayload?.reviewSourceUrl || null}
            coursesBackHref={coursesBackHref}
        />
    );
};

export default CourseDetailsPage;
