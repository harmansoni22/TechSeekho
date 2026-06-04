import { NextResponse } from "next/server";

/**
 * Host-aware proxy for per-role subdomain deploys.
 *
 * (Formerly `middleware.js` — renamed to `proxy.js` for the Next.js 16
 * `proxy` file convention. Behavior is unchanged.)
 *
 * Behavior is determined entirely by env vars; no env vars set ⇒ no-op
 * (existing single-host deploys keep working unchanged).
 *
 * Env contract:
 *   DASHBOARD_SUBDOMAIN_HOSTS
 *     JSON map of `{ hostPrefix: rolePath }`. Example:
 *       { "student": "/dashboard/student",
 *         "trainer": "/dashboard/trainer",
 *         "coordinator": "/dashboard/coordinator",
 *         "admin": "/dashboard/admin",
 *         "super": "/dashboard/super-admin" }
 *     The `hostPrefix` is matched against the first label of the request's
 *     hostname (`student.techseekho.com` → `student`).
 *
 *   DASHBOARD_SUBDOMAIN_MODE
 *     "log"     (default): logs the routing decision; does NOT enforce.
 *     "enforce": rewrites `/` → rolePath; blocks any /dashboard/{otherRole}
 *                path with a 404.
 *
 * The proxy deliberately does NOT call into NextAuth here. Per-role
 * access control still goes through DashboardAuthGate + the backend's RBAC
 * gates. This file is only responsible for keeping the role-scoped
 * subdomains visually and structurally isolated.
 */

const SUBDOMAIN_HOSTS = parseHostsMap(process.env.DASHBOARD_SUBDOMAIN_HOSTS);
const MODE = (process.env.DASHBOARD_SUBDOMAIN_MODE || "log").toLowerCase();
const ENFORCE = MODE === "enforce";
const ENABLED = Object.keys(SUBDOMAIN_HOSTS).length > 0;

function parseHostsMap(raw) {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }
    } catch {
        // Fall through to empty map; surface a clear warning at runtime.
        console.warn(
            "[proxy] DASHBOARD_SUBDOMAIN_HOSTS is set but is not valid JSON; ignoring.",
        );
    }
    return {};
}

function hostPrefix(hostname) {
    if (!hostname) return null;
    const stripped = hostname.split(":")[0];
    const first = stripped.split(".")[0];
    return first || null;
}

export function proxy(request) {
    if (!ENABLED) return NextResponse.next();

    const url = request.nextUrl;
    const prefix = hostPrefix(url.hostname);
    const rolePath = prefix ? SUBDOMAIN_HOSTS[prefix] : null;

    // Subdomain we don't recognize (e.g. `app.techseekho.com`, `www.`): treat
    // as the shared host — no rewriting, no blocking.
    if (!rolePath) return NextResponse.next();

    const pathname = url.pathname;

    // 1. Root path on a role subdomain → send to the role dashboard.
    if (pathname === "/" || pathname === "") {
        if (ENFORCE) {
            const rewritten = url.clone();
            rewritten.pathname = rolePath;
            return NextResponse.rewrite(rewritten);
        }
        console.info(
            `[proxy][log] would rewrite "/" → "${rolePath}" on subdomain "${prefix}".`,
        );
        return NextResponse.next();
    }

    // 2. Path under a DIFFERENT role's dashboard on this subdomain → block.
    if (pathname.startsWith("/dashboard/")) {
        const allowed =
            pathname === rolePath || pathname.startsWith(`${rolePath}/`);
        if (!allowed) {
            if (ENFORCE) {
                return new NextResponse("Not found", { status: 404 });
            }
            console.info(
                `[proxy][log] would 404 "${pathname}" on subdomain "${prefix}" (only "${rolePath}" allowed).`,
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    // Run on everything except Next internals and static assets.
    matcher: [
        "/((?!_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff2?|ttf)).*)",
    ],
};
