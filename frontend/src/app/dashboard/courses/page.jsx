import { redirect } from "next/navigation";

/** Legacy shared courses route — redirect to the role-scoped page via the entry router. */
export default function LegacyCoursesRedirect() {
    redirect("/dashboard");
}
