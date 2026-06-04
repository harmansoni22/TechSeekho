import { api } from "@/lib/api";

/**
 * Thin API helpers for the SUPER_ADMIN dashboard.
 *
 * The backend convention is `{ data: ... }` for every super-admin endpoint;
 * we unwrap once here so pages never repeat the `res?.data ?? res` dance.
 *
 * SECURITY
 *  - All paths are server-routed; `api()` attaches the NextAuth bearer token.
 *  - The backend re-checks SUPER_ADMIN on every endpoint — frontend gating is
 *    UX only.
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

// ── overview / analytics / config ──────────────────────────────────────────

export async function fetchPlatformOverview() {
    return unwrap(api("/admin/platform/overview", { method: "GET" }));
}

export async function fetchPlatformAnalytics(filters = {}) {
    return unwrap(
        api(`/admin/platform/analytics${buildQuery(filters)}`, {
            method: "GET",
        }),
    );
}

export async function fetchPlatformConfig() {
    return unwrap(api("/admin/platform/config", { method: "GET" }));
}

// ── institutions ───────────────────────────────────────────────────────────

export async function fetchInstitutionDetail(id) {
    return unwrap(api(`/admin/institutions/${id}`, { method: "GET" }));
}

// ── admins / roles / assignments ───────────────────────────────────────────

export async function fetchAdmins(filters = {}) {
    return unwrap(
        api(`/admin/admins${buildQuery(filters)}`, { method: "GET" }),
    );
}

export async function fetchRoles() {
    return unwrap(api("/admin/roles", { method: "GET" }));
}

export async function grantRoleAssignment(payload) {
    return unwrap(
        api("/admin/role-assignments", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    );
}

export async function revokeRoleAssignment(assignmentId) {
    return unwrap(
        api(`/admin/role-assignments/${assignmentId}`, { method: "DELETE" }),
    );
}

export async function setUserStatus(userId, status, reason) {
    return unwrap(
        api(`/admin/users/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status, reason }),
        }),
    );
}

// ── audit log ──────────────────────────────────────────────────────────────

export async function fetchAuditLogs(filters = {}) {
    return unwrap(
        api(`/admin/audit-logs${buildQuery(filters)}`, { method: "GET" }),
    );
}

// ── governance: global user directory ────────────────────────────────────────

export async function fetchUsers(filters = {}) {
    return unwrap(api(`/admin/users${buildQuery(filters)}`, { method: "GET" }));
}

// ── governance: institution lifecycle ────────────────────────────────────────

export async function setInstitutionStatus(institutionId, status, reason) {
    return unwrap(
        api(`/admin/institutions/${institutionId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status, reason }),
        }),
    );
}

// ── governance: admin management ─────────────────────────────────────────────

export async function createAdmin(payload) {
    return unwrap(
        api("/admin/admins", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    );
}

// transfers: [{ institutionId, toUserId }]
export async function terminateAdmin(userId, reason, transfers = []) {
    return unwrap(
        api(`/admin/admins/${userId}/terminate`, {
            method: "POST",
            body: JSON.stringify({ reason, transfers }),
        }),
    );
}

// ── governance: trainer management ───────────────────────────────────────────

export async function fetchTrainers(filters = {}) {
    return unwrap(
        api(`/admin/trainers${buildQuery(filters)}`, { method: "GET" }),
    );
}

export async function setTrainerStatus(userId, status, reason) {
    return unwrap(
        api(`/admin/trainers/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status, reason }),
        }),
    );
}

// reassignments: [{ batchId, toTrainerId }]  (toTrainerId is a USER id)
export async function terminateTrainer(userId, reason, reassignments = []) {
    return unwrap(
        api(`/admin/trainers/${userId}/terminate`, {
            method: "POST",
            body: JSON.stringify({ reason, reassignments }),
        }),
    );
}
