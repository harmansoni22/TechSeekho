import { redirect } from "next/navigation";

/** Legacy shared jobs route — redirect to the role-scoped page via the entry router. */
export default function LegacyJobsRedirect() {
    redirect("/dashboard");
}
