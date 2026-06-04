import { api } from "@/lib/api";

/**
 * Thin API helpers for the institution-scoped ADMIN dashboard.
 *
 * Two backend surfaces feed this role:
 *  - `/admin-ops/*` — admin-specific aggregations and member onboarding.
 *  - shared operational endpoints (`/institutions`, `/batches`, `/attendance`,
 *    `/assignments`, `/announcements`) that already enforce institution scope.
 *
 * SECURITY
 *  - Every request rides the NextAuth bearer token via `api()`.
 *  - The backend re-checks ADMIN/SUPER_ADMIN role + institution scope on every
 *    endpoint; frontend gating is UX only.
 */

async function unwrap(promise) {
    const res = await promise;
    if (res && typeof res === "object" && "data" in res) {
        return res.data;
    }
    return res;
}

function buildQuery(filters) {
    if (!filters) return "";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === "") continue;
        params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

// ── admin-ops: dashboard ────────────────────────────────────────────────────

export async function fetchAdminOverview(filters = {}) {
    return unwrap(api(`/admin-ops/overview${buildQuery(filters)}`));
}

export async function fetchAdminAnalytics(filters = {}) {
    return unwrap(api(`/admin-ops/analytics${buildQuery(filters)}`));
}

// ── admin-ops: people / onboarding ──────────────────────────────────────────

export async function fetchInstitutionPeople(filters = {}) {
    return unwrap(api(`/admin-ops/people${buildQuery(filters)}`));
}

export async function createStudent(payload) {
    return unwrap(
        api("/admin-ops/students", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    );
}

export async function bulkCreateStudents(payload) {
    return unwrap(
        api("/admin-ops/students/bulk", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    );
}

export async function createTrainer(payload) {
    return unwrap(
        api("/admin-ops/trainers", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    );
}

export async function setMemberStatus(userId, status) {
    return unwrap(
        api(`/admin-ops/members/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }),
    );
}

// ── shared operational endpoints (institution-scoped server-side) ───────────

export async function fetchInstitutions() {
    return unwrap(api("/institutions"));
}

export async function fetchBatches(filters = {}) {
    return unwrap(api(`/batches${buildQuery(filters)}`));
}

export async function fetchBatchDetail(batchId) {
    return unwrap(api(`/batches/${batchId}`));
}

export async function createBatch(payload) {
    return unwrap(
        api("/batches", { method: "POST", body: JSON.stringify(payload) }),
    );
}

export async function updateBatch(batchId, payload) {
    return unwrap(
        api(`/batches/${batchId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        }),
    );
}

export async function assignTrainerToBatch(batchId, trainerId) {
    return unwrap(
        api(`/batches/${batchId}/trainers`, {
            method: "POST",
            body: JSON.stringify({ trainerId }),
        }),
    );
}

export async function removeTrainerFromBatch(batchId, trainerId) {
    return unwrap(
        api(`/batches/${batchId}/trainers/${trainerId}`, { method: "DELETE" }),
    );
}

export async function assignStudentToBatch(batchId, studentId) {
    return unwrap(
        api(`/batches/${batchId}/students`, {
            method: "POST",
            body: JSON.stringify({ studentId }),
        }),
    );
}

export async function removeStudentFromBatch(batchId, studentId) {
    return unwrap(
        api(`/batches/${batchId}/students/${studentId}`, { method: "DELETE" }),
    );
}

export async function fetchInstitutionMembers(institutionId, role) {
    return unwrap(
        api(`/institutions/${institutionId}/members${buildQuery({ role })}`),
    );
}

export async function fetchCourses() {
    // /courses returns a bare array (no { data } envelope).
    return unwrap(api("/courses"));
}

export async function fetchAttendance(filters = {}) {
    return unwrap(api(`/attendance${buildQuery(filters)}`));
}

export async function fetchAssignments(filters = {}) {
    return unwrap(api(`/assignments${buildQuery(filters)}`));
}

export async function fetchSubmissions(filters = {}) {
    return unwrap(api(`/assignments/submissions${buildQuery(filters)}`));
}

export async function fetchAnnouncements(filters = {}) {
    return unwrap(api(`/announcements${buildQuery(filters)}`));
}

export async function createAnnouncement(payload) {
    return unwrap(
        api("/announcements", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    );
}
