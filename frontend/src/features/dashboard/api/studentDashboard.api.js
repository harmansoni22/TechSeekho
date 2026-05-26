import { api } from "@/lib/api";

/**
 * Every `/student/*` endpoint wraps its response in `{ message, data }`. Every
 * `/modules/*` endpoint returns a bare array/object. We unwrap once here so
 * consumers always see the clean payload — no more `res?.data ?? res` dance at
 * every call site.
 */
async function unwrap(promise) {
    const res = await promise;
    if (res && typeof res === "object" && "data" in res && "message" in res) {
        return res.data;
    }
    return res;
}

export async function fetchStudentDashboard() {
    return unwrap(api("/student/dashboard", { method: "GET" }));
}

export async function fetchStudentCourses() {
    return unwrap(api("/student/courses", { method: "GET" }));
}

export async function fetchStudentAssignments() {
    return unwrap(api("/student/assignments", { method: "GET" }));
}

export async function fetchStudentAttendance() {
    return unwrap(api("/student/attendance", { method: "GET" }));
}

export async function fetchStudentAchievements() {
    return unwrap(api("/student/achievements", { method: "GET" }));
}

/**
 * Lists every learning path visible to the current student (their institution's
 * paths plus global paths). Does NOT include the student's enrollment status —
 * cross-reference with `fetchStudentCourses()` to know which the student is
 * already in.
 */
export async function fetchLearningPaths() {
    return unwrap(api("/modules", { method: "GET" }));
}

export async function enrollInLearningPath(pathId) {
    return unwrap(api(`/modules/${pathId}/enroll`, { method: "POST" }));
}

export async function updateModuleProgress(moduleId, progress) {
    return unwrap(
        api(`/modules/items/${moduleId}/progress`, {
            method: "PATCH",
            body: JSON.stringify({ progress }),
        }),
    );
}
