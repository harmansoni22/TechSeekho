import { describe, expect, it } from "vitest";
import { resolveRoleDestination } from "../../lib/roleRouter.js";
import {
    isRoleAuthorized,
    resolveAllowedRolesForPath,
} from "./resolveDashboardAuthz.js";

// ─── resolveAllowedRolesForPath ────────────────────────────────────────────

describe("resolveAllowedRolesForPath", () => {
    const ALL_ROLES = [
        "SUPER_ADMIN",
        "ADMIN",
        "INSTITUTION_COORDINATOR",
        "TRAINER",
        "STUDENT",
    ];

    it("returns all roles for the /dashboard entry router (only shared route)", () => {
        const result = resolveAllowedRolesForPath("/dashboard");
        expect(result).toEqual(expect.arrayContaining(ALL_ROLES));
        expect(result.length).toBe(ALL_ROLES.length);
    });

    it("returns only SUPER_ADMIN for /dashboard/super-admin", () => {
        expect(resolveAllowedRolesForPath("/dashboard/super-admin")).toEqual([
            "SUPER_ADMIN",
        ]);
    });

    it("returns only ADMIN for /dashboard/admin", () => {
        expect(resolveAllowedRolesForPath("/dashboard/admin")).toEqual([
            "ADMIN",
        ]);
    });

    it("returns only INSTITUTION_COORDINATOR for /dashboard/coordinator", () => {
        expect(resolveAllowedRolesForPath("/dashboard/coordinator")).toEqual([
            "INSTITUTION_COORDINATOR",
        ]);
    });

    it("returns only TRAINER for /dashboard/trainer", () => {
        expect(resolveAllowedRolesForPath("/dashboard/trainer")).toEqual([
            "TRAINER",
        ]);
    });

    it("returns only STUDENT for /dashboard/student", () => {
        expect(resolveAllowedRolesForPath("/dashboard/student")).toEqual([
            "STUDENT",
        ]);
    });

    it("matches deep sub-paths by prefix (super-admin/institutions)", () => {
        expect(
            resolveAllowedRolesForPath("/dashboard/super-admin/institutions"),
        ).toEqual(["SUPER_ADMIN"]);
    });

    it("matches deep sub-paths under /dashboard/admin", () => {
        expect(resolveAllowedRolesForPath("/dashboard/admin/reports")).toEqual([
            "ADMIN",
        ]);
    });

    // ── Per-role versions of formerly-shared pages ────────────────────────

    describe("former shared routes now live per-role", () => {
        it("STUDENT owns /dashboard/student/profile", () => {
            expect(
                resolveAllowedRolesForPath("/dashboard/student/profile"),
            ).toEqual(["STUDENT"]);
        });
        it("SUPER_ADMIN owns /dashboard/super-admin/profile", () => {
            expect(
                resolveAllowedRolesForPath("/dashboard/super-admin/profile"),
            ).toEqual(["SUPER_ADMIN"]);
        });
        it("TRAINER owns /dashboard/trainer/community", () => {
            expect(
                resolveAllowedRolesForPath("/dashboard/trainer/community"),
            ).toEqual(["TRAINER"]);
        });
        it("INSTITUTION_COORDINATOR owns /dashboard/coordinator/analytics", () => {
            expect(
                resolveAllowedRolesForPath("/dashboard/coordinator/analytics"),
            ).toEqual(["INSTITUTION_COORDINATOR"]);
        });
        it("STUDENT owns /dashboard/student/jobs", () => {
            expect(
                resolveAllowedRolesForPath("/dashboard/student/jobs"),
            ).toEqual(["STUDENT"]);
        });
        it("ADMIN owns /dashboard/admin/community-moderation", () => {
            expect(
                resolveAllowedRolesForPath(
                    "/dashboard/admin/community-moderation",
                ),
            ).toEqual(["ADMIN"]);
        });
    });

    // ── Old shared routes must no longer match anything ───────────────────

    describe("legacy shared routes are unregistered (no role match)", () => {
        const removed = [
            "/dashboard/profile",
            "/dashboard/settings",
            "/dashboard/courses",
            "/dashboard/analytics",
            "/dashboard/community",
            "/dashboard/mentors",
            "/dashboard/jobs",
            "/dashboard/ai-companion",
            "/dashboard/legal",
        ];
        for (const route of removed) {
            it(`returns [] for legacy ${route}`, () => {
                expect(resolveAllowedRolesForPath(route)).toEqual([]);
            });
        }
    });

    it("does NOT match /dashboard as a prefix for /dashboard/student", () => {
        const result = resolveAllowedRolesForPath("/dashboard/student");
        expect(result).toEqual(["STUDENT"]);
        expect(result).not.toContain("SUPER_ADMIN");
    });

    it("returns empty array for an unknown/unregistered route", () => {
        expect(
            resolveAllowedRolesForPath("/dashboard/some-unknown-route"),
        ).toEqual([]);
    });

    it("falls back to /dashboard for null pathname (edge case)", () => {
        // resolveAllowedRolesForPath substitutes /dashboard when given null.
        const result = resolveAllowedRolesForPath(null);
        expect(result.length).toBeGreaterThan(0);
    });
});

// ─── isRoleAuthorized ──────────────────────────────────────────────────────

describe("isRoleAuthorized", () => {
    it("returns true when user role exactly matches an allowed role", () => {
        expect(
            isRoleAuthorized({
                roles: ["SUPER_ADMIN"],
                allowedRoles: ["SUPER_ADMIN"],
            }),
        ).toBe(true);
    });

    it("returns true when one of multiple user roles matches", () => {
        expect(
            isRoleAuthorized({
                roles: ["STUDENT", "TRAINER"],
                allowedRoles: ["TRAINER", "ADMIN"],
            }),
        ).toBe(true);
    });

    it("returns false when no user role matches", () => {
        expect(
            isRoleAuthorized({
                roles: ["STUDENT"],
                allowedRoles: ["SUPER_ADMIN", "ADMIN"],
            }),
        ).toBe(false);
    });

    it("returns false for empty user roles", () => {
        expect(
            isRoleAuthorized({ roles: [], allowedRoles: ["SUPER_ADMIN"] }),
        ).toBe(false);
    });

    it("returns false for empty allowed roles", () => {
        expect(
            isRoleAuthorized({ roles: ["SUPER_ADMIN"], allowedRoles: [] }),
        ).toBe(false);
    });

    it("normalises user roles to uppercase before comparing", () => {
        expect(
            isRoleAuthorized({
                roles: ["super_admin"],
                allowedRoles: ["SUPER_ADMIN"],
            }),
        ).toBe(true);
    });

    it("normalises allowed roles to uppercase before comparing", () => {
        expect(
            isRoleAuthorized({
                roles: ["SUPER_ADMIN"],
                allowedRoles: ["super_admin"],
            }),
        ).toBe(true);
    });

    it("handles mixed-case on both sides", () => {
        expect(
            isRoleAuthorized({
                roles: ["Institution_Coordinator"],
                allowedRoles: ["INSTITUTION_COORDINATOR"],
            }),
        ).toBe(true);
    });
});

// ─── End-to-end redirect contract ──────────────────────────────────────────

describe("redirect contract: resolveRoleDestination → resolveAllowedRolesForPath", () => {
    const rolesToTest = [
        "SUPER_ADMIN",
        "ADMIN",
        "INSTITUTION_COORDINATOR",
        "TRAINER",
        "STUDENT",
    ];

    for (const role of rolesToTest) {
        it(`${role} destination is authorised for ${role}`, () => {
            const destination = resolveRoleDestination([role]);
            expect(destination).toBeTruthy();

            const allowedRoles = resolveAllowedRolesForPath(destination);
            expect(allowedRoles.length).toBeGreaterThan(0);

            const authorized = isRoleAuthorized({
                roles: [role],
                allowedRoles,
            });
            expect(authorized).toBe(true);
        });
    }

    it("lower-cased role strings still route to an authorised destination", () => {
        const destination = resolveRoleDestination(["super_admin"]);
        expect(destination).toBe("/dashboard/super-admin");

        const allowedRoles = resolveAllowedRolesForPath(destination);
        const authorized = isRoleAuthorized({
            roles: ["super_admin"],
            allowedRoles,
        });
        expect(authorized).toBe(true);
    });

    it("SUPER_ADMIN destination is NOT accessible by STUDENT", () => {
        const destination = resolveRoleDestination(["SUPER_ADMIN"]);
        const allowedRoles = resolveAllowedRolesForPath(destination);
        expect(isRoleAuthorized({ roles: ["STUDENT"], allowedRoles })).toBe(
            false,
        );
    });

    it("STUDENT destination is NOT accessible by ADMIN", () => {
        const destination = resolveRoleDestination(["STUDENT"]);
        const allowedRoles = resolveAllowedRolesForPath(destination);
        expect(isRoleAuthorized({ roles: ["ADMIN"], allowedRoles })).toBe(
            false,
        );
    });

    // New: every role-scoped sub-route is locked to that role.

    const crossRoleChecks = [
        { path: "/dashboard/super-admin/profile", role: "SUPER_ADMIN" },
        { path: "/dashboard/admin/reports", role: "ADMIN" },
        {
            path: "/dashboard/coordinator/students",
            role: "INSTITUTION_COORDINATOR",
        },
        { path: "/dashboard/trainer/submissions", role: "TRAINER" },
        { path: "/dashboard/student/jobs", role: "STUDENT" },
    ];

    for (const { path, role } of crossRoleChecks) {
        const others = rolesToTest.filter((r) => r !== role);
        for (const otherRole of others) {
            it(`${path} is NOT accessible by ${otherRole}`, () => {
                const allowedRoles = resolveAllowedRolesForPath(path);
                expect(
                    isRoleAuthorized({ roles: [otherRole], allowedRoles }),
                ).toBe(false);
            });
        }
    }
});
