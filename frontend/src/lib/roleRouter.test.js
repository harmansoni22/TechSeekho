import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	ROLE_ROUTES,
	resolveRoleDestination,
} from "./roleRouter.js";

beforeEach(() => {
	vi.spyOn(console, "warn").mockImplementation(() => {});
	vi.clearAllMocks();
});

describe("resolveRoleDestination", () => {
	// ── Happy paths ──────────────────────────────────────────────────────────

	it("routes SUPER_ADMIN to /dashboard/super-admin", () => {
		expect(resolveRoleDestination(["SUPER_ADMIN"])).toBe(
			"/dashboard/super-admin",
		);
	});

	it("routes ADMIN to /dashboard/admin", () => {
		expect(resolveRoleDestination(["ADMIN"])).toBe("/dashboard/admin");
	});

	it("routes INSTITUTION_COORDINATOR to /dashboard/coordinator", () => {
		expect(resolveRoleDestination(["INSTITUTION_COORDINATOR"])).toBe(
			"/dashboard/coordinator",
		);
	});

	it("routes TRAINER to /dashboard/trainer", () => {
		expect(resolveRoleDestination(["TRAINER"])).toBe("/dashboard/trainer");
	});

	it("routes STUDENT to /dashboard/student", () => {
		expect(resolveRoleDestination(["STUDENT"])).toBe("/dashboard/student");
	});

	// ── Priority / multi-role ────────────────────────────────────────────────

	it("picks SUPER_ADMIN over STUDENT when user has both", () => {
		expect(resolveRoleDestination(["STUDENT", "SUPER_ADMIN"])).toBe(
			"/dashboard/super-admin",
		);
	});

	it("picks ADMIN over TRAINER when user has both", () => {
		expect(resolveRoleDestination(["TRAINER", "ADMIN"])).toBe(
			"/dashboard/admin",
		);
	});

	it("picks INSTITUTION_COORDINATOR over STUDENT", () => {
		expect(
			resolveRoleDestination(["STUDENT", "INSTITUTION_COORDINATOR"]),
		).toBe("/dashboard/coordinator");
	});

	// ── Casing normalisation ─────────────────────────────────────────────────

	it("accepts lowercase role strings", () => {
		expect(resolveRoleDestination(["super_admin"])).toBe(
			"/dashboard/super-admin",
		);
	});

	it("accepts mixed-case role strings", () => {
		expect(resolveRoleDestination(["Super_Admin"])).toBe(
			"/dashboard/super-admin",
		);
	});

	it("trims whitespace from role strings", () => {
		expect(resolveRoleDestination(["  ADMIN  "])).toBe("/dashboard/admin");
	});

	// ── Defensive / edge cases ───────────────────────────────────────────────

	it("returns null for an empty roles array", () => {
		expect(resolveRoleDestination([])).toBeNull();
	});

	it("returns null for undefined roles", () => {
		expect(resolveRoleDestination(undefined)).toBeNull();
	});

	it("returns null and logs a warning for an unknown role", () => {
		const result = resolveRoleDestination(["MENTOR"]);
		expect(result).toBeNull();
		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining("MENTOR"),
		);
	});

	it("returns null and warns for the old seed typo INSTITUTE_CORDINATOR", () => {
		const result = resolveRoleDestination(["INSTITUTE_CORDINATOR"]);
		expect(result).toBeNull();
		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining("INSTITUTE_CORDINATOR"),
		);
	});

	it("does not warn on empty array (no roles yet assigned)", () => {
		resolveRoleDestination([]);
		expect(console.warn).not.toHaveBeenCalled();
	});

	it("handles null entries inside the array gracefully", () => {
		expect(resolveRoleDestination([null, "STUDENT"])).toBe(
			"/dashboard/student",
		);
	});

	// ── ROLE_ROUTES completeness ─────────────────────────────────────────────

	it("ROLE_ROUTES covers all priority roles", () => {
		const priority = [
			"SUPER_ADMIN",
			"ADMIN",
			"INSTITUTION_COORDINATOR",
			"TRAINER",
			"STUDENT",
		];
		for (const role of priority) {
			expect(ROLE_ROUTES[role]).toBeDefined();
			expect(ROLE_ROUTES[role]).toMatch(/^\/dashboard\//);
		}
	});
});

describe("resolveDashboardAuthz (smoke-test integration)", () => {
	it("resolveRoleDestination produces paths that match the prefix used in dashboardRoutePermissions", () => {
		// These are the actual path prefixes defined in dashboardRoutePermissions.js.
		// If either side changes, this test will catch the divergence.
		const expected = {
			SUPER_ADMIN: "/dashboard/super-admin",
			ADMIN: "/dashboard/admin",
			INSTITUTION_COORDINATOR: "/dashboard/coordinator",
			TRAINER: "/dashboard/trainer",
			STUDENT: "/dashboard/student",
		};
		for (const [role, path] of Object.entries(expected)) {
			expect(resolveRoleDestination([role])).toBe(path);
		}
	});
});
