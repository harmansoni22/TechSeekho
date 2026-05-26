import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { resolveRoleDestination } from "@/lib/roleRouter";

/**
 * Domain root (`/`).
 *
 * Server-rendered router:
 *   - Authenticated user with a resolvable role → their role dashboard.
 *   - Authenticated user without a role         → /pending-approval.
 *   - Unauthenticated visitor                   → /landingpage.
 *
 * Doing this server-side (instead of a client useSession) means there is no
 * flash of landing-page content before the redirect fires.
 */
export default async function Page() {
    let session = null;
    try {
        session = await auth();
    } catch (err) {
        // Fail open: if the auth lookup itself blows up (stale build, env issue),
        // treat the visitor as unauthenticated rather than crashing the entry route.
        console.warn(
            "[/] auth() failed; treating as unauthenticated:",
            err?.message,
        );
    }

    const roles = session?.user?.roles ?? [];

    if (roles.length > 0) {
        const destination = resolveRoleDestination(roles);
        redirect(destination ?? "/pending-approval");
    }

    redirect("/landingpage");
}
