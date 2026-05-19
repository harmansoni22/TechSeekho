import { redirect } from "next/navigation";

/** Legacy shared mentors route — redirect to the role-scoped page via the entry router. */
export default function LegacyMentorsRedirect() {
    redirect("/dashboard");
}
