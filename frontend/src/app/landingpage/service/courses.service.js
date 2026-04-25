import { api } from "@/lib/api";

export async function getAllCourses() {
  return api("/courses");
}

export async function getCourseBySlug(slug) {
  return api(`/courses/${slug}`);
}

export async function getCourseReviewsById(courseId) {
  return api(`/courses/${courseId}/reviews`);
}
