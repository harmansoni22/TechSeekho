import { redirect } from "next/navigation";

/**
 * Legacy shared profile route — every role now owns its own profile page
 * under `/dashboard/{role}/profile`. Server-redirect to the entry router,
 * which sends the user to the correct role-scoped page.
 *
 * Keeping this redirect (vs. deleting the file) preserves old bookmarks and
 * defends against any caller that still constructs `/dashboard/profile`.
 */
export default function LegacyProfileRedirect() {
    redirect("/dashboard");
}
