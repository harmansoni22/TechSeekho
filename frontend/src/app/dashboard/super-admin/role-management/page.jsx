"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    fetchAdmins,
    fetchRoles,
    grantRoleAssignment,
    revokeRoleAssignment,
} from "@/features/dashboard/api/superAdmin.api";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import {
    PageEmpty,
    PageError,
    PageLoading,
} from "@/features/dashboard/components/ui/widgets/PageState";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { api } from "@/lib/api";

/**
 * SUPER_ADMIN — Role Management.
 *
 * Deliberately separate from `Admins`: this page is the *write* surface for
 * grants and revokes; `Admins` is a directory-style read view.
 *
 * Flow:
 *  1. Search any user by name/email (`GET /users`).
 *  2. Select role + (optional) institution scope.
 *  3. Confirm — `POST /admin/role-assignments` issues the grant and writes
 *     an audit row.
 *
 * The grid below the form is the live source of truth: it lists every
 * elevated assignment and supports per-row revoke. SUPER_ADMIN's
 * "last-remaining" and self-revoke guards are enforced server-side.
 */

const ROLE_LABELS = {
    SUPER_ADMIN: "Super admin",
    ADMIN: "Admin",
    INSTITUTION_COORDINATOR: "Coordinator",
    TRAINER: "Trainer",
    STUDENT: "Student",
};

const RoleManagementPage = () => {
    // grant form state
    const [roleCatalog, setRoleCatalog] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [userQuery, setUserQuery] = useState("");
    const [userResults, setUserResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searching, setSearching] = useState(false);
    const [role, setRole] = useState("ADMIN");
    const [institutionId, setInstitutionId] = useState("");
    const [granting, setGranting] = useState(false);
    const [grantError, setGrantError] = useState(null);
    const [grantOk, setGrantOk] = useState(null);

    // directory state
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyKey, setBusyKey] = useState(null);

    const loadDirectory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchAdmins({ limit: 200 });
            setData(result);
        } catch (err) {
            setError(err?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    // First-mount: roles + institutions + directory.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [roles, instResp] = await Promise.all([
                    fetchRoles(),
                    api("/institutions"),
                ]);
                if (cancelled) return;
                if (Array.isArray(roles)) {
                    setRoleCatalog(roles);
                }
                const list = Array.isArray(instResp?.data)
                    ? instResp.data
                    : Array.isArray(instResp)
                      ? instResp
                      : [];
                setInstitutions(list);
            } catch {
                // Form will fall back to the static defaults; the directory
                // panel surfaces its own error state.
            }
        })();
        loadDirectory();
        return () => {
            cancelled = true;
        };
    }, [loadDirectory]);

    // User search — fire on submit / Enter rather than per-keystroke so we
    // don't hammer /users while the user types.
    async function searchUsers(e) {
        e?.preventDefault?.();
        const q = userQuery.trim();
        if (q.length < 2) {
            setUserResults([]);
            return;
        }
        setSearching(true);
        try {
            const resp = await api(`/users?limit=20`);
            const list = Array.isArray(resp?.users) ? resp.users : [];
            const filtered = list.filter((u) => {
                const hay =
                    `${u.name || ""} ${u.email || ""} ${u.phone || ""}`.toLowerCase();
                return hay.includes(q.toLowerCase());
            });
            setUserResults(filtered);
        } catch {
            setUserResults([]);
        } finally {
            setSearching(false);
        }
    }

    async function handleGrant(e) {
        e.preventDefault();
        if (granting || !selectedUser) return;
        setGranting(true);
        setGrantError(null);
        setGrantOk(null);
        try {
            const payload = {
                userId: selectedUser.id,
                role,
            };
            if (role !== "SUPER_ADMIN") {
                if (!institutionId) {
                    throw new Error("Pick an institution for this role");
                }
                payload.institutionId = institutionId;
            }
            await grantRoleAssignment(payload);
            setGrantOk(
                `Granted ${ROLE_LABELS[role] ?? role} to ${selectedUser.name}.`,
            );
            setSelectedUser(null);
            setUserQuery("");
            setUserResults([]);
            setInstitutionId("");
            await loadDirectory();
        } catch (err) {
            setGrantError(err?.message || "Failed to grant role");
        } finally {
            setGranting(false);
        }
    }

    async function handleRevoke(assignmentId, label) {
        if (busyKey) return;
        const ok = confirm(
            `Revoke ${label}? The user loses this access immediately.`,
        );
        if (!ok) return;
        setBusyKey(assignmentId);
        try {
            await revokeRoleAssignment(assignmentId);
            await loadDirectory();
        } catch (err) {
            setError(err?.message || "Failed to revoke");
        } finally {
            setBusyKey(null);
        }
    }

    const admins = data?.admins ?? [];

    // Coalesce assignments into a flat (role, institution) grid for review.
    const allAssignments = useMemo(() => {
        const rows = [];
        for (const u of admins) {
            for (const a of u.assignments) {
                rows.push({
                    ...a,
                    user: {
                        id: u.id,
                        name: u.fullName,
                        email: u.email,
                        status: u.status,
                    },
                });
            }
        }
        return rows;
    }, [admins]);

    const needsInstitution = role !== "SUPER_ADMIN";

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Authority · Role Management"
                title="Grant power deliberately."
                subtitle="Every role assignment is a deliberate act of trust. Pair them with institutions, watch them in the audit trail, and revoke them the moment scope changes."
            />

            <section className="grid gap-6 lg:grid-cols-5">
                <Panel
                    eyebrow="Grant"
                    title="New role assignment"
                    description="Search the user, choose role × institution, confirm. Grants are immediate and audit-logged."
                    className="lg:col-span-3"
                >
                    <form onSubmit={handleGrant} className="space-y-5">
                        {/* user search */}
                        <div>
                            <label
                                htmlFor="rm-user-search"
                                className="text-[11px] uppercase tracking-[0.18em]"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                User
                            </label>
                            <div className="mt-1.5 flex gap-2">
                                <input
                                    id="rm-user-search"
                                    type="search"
                                    value={userQuery}
                                    onChange={(e) =>
                                        setUserQuery(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            searchUsers();
                                        }
                                    }}
                                    placeholder="Search name or email…"
                                    className="flex-1 rounded-md border px-3 py-2 text-sm"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                        color: "var(--dashboard-fg)",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={searchUsers}
                                    disabled={searching}
                                    className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        color: "var(--dashboard-fg)",
                                        cursor: searching ? "wait" : "pointer",
                                    }}
                                >
                                    {searching ? "…" : "Search"}
                                </button>
                            </div>
                            {selectedUser ? (
                                <div
                                    className="mt-3 flex items-center justify-between rounded-md border px-3 py-2"
                                    style={{
                                        borderColor: "var(--role-accent)",
                                        backgroundColor:
                                            "var(--role-accent-soft)",
                                    }}
                                >
                                    <div>
                                        <p
                                            className="text-sm font-medium"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {selectedUser.name}
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {selectedUser.email || "—"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUser(null)}
                                        className="text-xs font-semibold"
                                        style={{
                                            color: "var(--role-accent)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : userResults.length > 0 ? (
                                <ul
                                    className="mt-2 max-h-48 overflow-y-auto rounded-md border"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    {userResults.map((u) => (
                                        <li key={u.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedUser(u)
                                                }
                                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--dashboard-surface)_92%,var(--role-accent)_8%)]"
                                                style={{ cursor: "pointer" }}
                                            >
                                                <span
                                                    style={{
                                                        color: "var(--dashboard-fg)",
                                                    }}
                                                >
                                                    {u.name}
                                                </span>
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: "var(--dashboard-muted)",
                                                    }}
                                                >
                                                    {u.email}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm">
                                <span
                                    className="text-[11px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    Role
                                </span>
                                <select
                                    value={role}
                                    onChange={(e) => {
                                        setRole(e.target.value);
                                        if (e.target.value === "SUPER_ADMIN") {
                                            setInstitutionId("");
                                        }
                                    }}
                                    className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                        color: "var(--dashboard-fg)",
                                        cursor: "pointer",
                                    }}
                                >
                                    {(roleCatalog.length > 0
                                        ? roleCatalog.map((r) => r.name)
                                        : [
                                              "ADMIN",
                                              "INSTITUTION_COORDINATOR",
                                              "TRAINER",
                                              "STUDENT",
                                              "SUPER_ADMIN",
                                          ]
                                    ).map((r) => (
                                        <option key={r} value={r}>
                                            {ROLE_LABELS[r] ?? r}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block text-sm">
                                <span
                                    className="text-[11px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    Institution{" "}
                                    {needsInstitution
                                        ? "(required)"
                                        : "(global)"}
                                </span>
                                <select
                                    value={institutionId}
                                    onChange={(e) =>
                                        setInstitutionId(e.target.value)
                                    }
                                    disabled={!needsInstitution}
                                    className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                        color: "var(--dashboard-fg)",
                                        cursor: needsInstitution
                                            ? "pointer"
                                            : "not-allowed",
                                    }}
                                >
                                    <option value="">
                                        {needsInstitution
                                            ? "Select institution…"
                                            : "Global (no institution)"}
                                    </option>
                                    {institutions.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {grantError && (
                            <p
                                className="rounded-md border px-3 py-2 text-sm"
                                style={{
                                    borderColor: "#fecaca",
                                    backgroundColor: "rgba(254, 226, 226, 0.6)",
                                    color: "#b91c1c",
                                }}
                            >
                                {grantError}
                            </p>
                        )}
                        {grantOk && (
                            <p
                                className="rounded-md border px-3 py-2 text-sm"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor: "var(--role-accent-soft)",
                                    color: "var(--role-accent)",
                                }}
                            >
                                {grantOk}
                            </p>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!selectedUser || granting}
                                className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                                style={{
                                    backgroundColor: "var(--role-accent)",
                                    color: "var(--role-accent-ink)",
                                    cursor:
                                        !selectedUser || granting
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                {granting ? "Granting…" : "Grant role"}
                            </button>
                        </div>
                    </form>
                </Panel>

                <Panel
                    eyebrow="Conventions"
                    title="Scope discipline"
                    description="Quick reminders before you click Grant."
                    className="lg:col-span-2"
                >
                    <ul className="space-y-3 text-sm">
                        <Rule
                            title="SUPER_ADMIN is global"
                            body="No institution scope. Reserve this role for platform custodians only — there must always be at least one."
                        />
                        <Rule
                            title="ADMIN governs one campus"
                            body="Mutates batches, attendance, role assignments inside the institution."
                        />
                        <Rule
                            title="COORDINATOR is read-only"
                            body="Projection access. Never grant for write workflows."
                        />
                        <Rule
                            title="TRAINER and STUDENT are operational"
                            body="They are usually granted by provisioning, not here. Use this page only for elevated roles in normal flows."
                        />
                    </ul>
                </Panel>
            </section>

            {loading ? (
                <PageLoading label="Loading current grants" />
            ) : error ? (
                <PageError
                    title="Could not load grants"
                    message={error}
                    onRetry={loadDirectory}
                />
            ) : allAssignments.length === 0 ? (
                <Panel eyebrow="Live grants" title="No elevated grants yet">
                    <PageEmpty
                        title="Empty"
                        description="Use the form above to provision the first one."
                    />
                </Panel>
            ) : (
                <Panel
                    eyebrow="Live grants"
                    title={`${allAssignments.length} active assignment${allAssignments.length === 1 ? "" : "s"}`}
                    description="Every elevated grant currently in force across the platform."
                    padded={false}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr
                                    className="text-[10px] uppercase tracking-[0.18em]"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    <th className="px-6 py-3 font-medium">
                                        User
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Role
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Scope
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Granted
                                    </th>
                                    <th className="px-6 py-3 font-medium text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {allAssignments.map((row) => (
                                    <tr
                                        key={row.assignmentId}
                                        className="border-t"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                        }}
                                    >
                                        <td className="px-6 py-3">
                                            <p
                                                className="font-medium"
                                                style={{
                                                    color: "var(--dashboard-fg)",
                                                }}
                                            >
                                                {row.user.name}
                                            </p>
                                            <p
                                                className="text-xs"
                                                style={{
                                                    color: "var(--dashboard-muted)",
                                                }}
                                            >
                                                {row.user.email}
                                            </p>
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs uppercase tracking-wider"
                                            style={{
                                                color: "var(--role-accent)",
                                            }}
                                        >
                                            {ROLE_LABELS[row.role] ?? row.role}
                                        </td>
                                        <td
                                            className="px-3 py-3"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {row.institutionName ||
                                                (row.role === "SUPER_ADMIN"
                                                    ? "Global"
                                                    : "—")}
                                        </td>
                                        <td
                                            className="px-3 py-3 text-xs"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            {row.assignedAt
                                                ? new Date(
                                                      row.assignedAt,
                                                  ).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRevoke(
                                                        row.assignmentId,
                                                        `${ROLE_LABELS[row.role] ?? row.role} for ${row.user.name}`,
                                                    )
                                                }
                                                disabled={
                                                    busyKey === row.assignmentId
                                                }
                                                className="text-xs font-semibold disabled:opacity-60"
                                                style={{
                                                    color: "#b91c1c",
                                                    cursor:
                                                        busyKey ===
                                                        row.assignmentId
                                                            ? "wait"
                                                            : "pointer",
                                                }}
                                            >
                                                {busyKey === row.assignmentId
                                                    ? "…"
                                                    : "Revoke"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            )}
        </div>
    );
};

const Rule = ({ title, body }) => (
    <li>
        <p
            className="text-sm font-medium"
            style={{ color: "var(--dashboard-fg)" }}
        >
            {title}
        </p>
        <p
            className="mt-0.5 text-xs"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {body}
        </p>
    </li>
);

export default RoleManagementPage;
