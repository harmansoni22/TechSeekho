import { redirect } from "next/navigation";

/** Legacy shared analytics route — redirect to the role-scoped page via the entry router. */
export default function LegacyAnalyticsRedirect() {
    redirect("/dashboard");
}
