import { api } from "@/lib/api";

/**
 * Thin API helpers for the TRAINER dashboard.
 *
 * Most trainer reads go through existing endpoints that already enforce
 * trainer scope server-side (`/batches`, `/assignments`, `/attendance`,
 * `/announcements`, `/modules`). This helper centralises the unwrap dance
 * and adds the trainer-specific overview endpoint.
 *
 * SECURITY
 *  - All requests use `api()` which carries the NextAuth bearer token.
 *  - The backend re-checks role + scope on every endpoint — frontend gating
 *    is UX only.
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

// ── overview ───────────────────────────────────────────────────────────────

export async function fetchTrainerOverview() {
    return unwrap(api("/trainer/overview", { method: "GET" }));
}

// ── batches (existing endpoints, just wrapped) ─────────────────────────────

export async function fetchTrainerBatches() {
    return unwrap(api("/batches", { method: "GET" }));
}

export async function fetchBatchDetail(batchId) {
    return unwrap(api(`/batches/${batchId}`, { method: "GET" }));
}

// ── attendance ─────────────────────────────────────────────────────────────

export async function fetchAttendance(filters = {}) {
    return unwrap(api(`/attendance${buildQuery(filters)}`, { method: "GET" }));
}

export async function bulkMarkAttendance(payload) {
    return unwrap(
        api("/attendance/bulk", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    );
}

// ── assignments ────────────────────────────────────────────────────────────

export async function fetchAssignments(filters = {}) {
    return unwrap(api(`/assignments${buildQuery(filters)}`, { method: "GET" }));
}

export async function fetchAssignmentDetail(id) {
    return unwrap(api(`/assignments/${id}`, { method: "GET" }));
}

export async function createAssignment(payload) {
    return unwrap(
        api("/assignments", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    );
}

// ── submissions (existing endpoint with rich filters) ──────────────────────

export async function fetchSubmissionsQueue(filters = {}) {
    return unwrap(
        api(`/assignments/submissions${buildQuery(filters)}`, {
            method: "GET",
        }),
    );
}

export async function reviewSubmission(submissionId, payload) {
    return unwrap(
        api(`/assignments/submissions/${submissionId}/review`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        }),
    );
}

// ── announcements ──────────────────────────────────────────────────────────

export async function fetchAnnouncements(filters = {}) {
    return unwrap(
        api(`/announcements${buildQuery(filters)}`, { method: "GET" }),
    );
}

export async function createAnnouncement(payload) {
    return unwrap(
        api("/announcements", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    );
}

// ── modules ────────────────────────────────────────────────────────────────

export async function fetchLearningPaths(filters = {}) {
    return unwrap(api(`/modules${buildQuery(filters)}`, { method: "GET" }));
}
