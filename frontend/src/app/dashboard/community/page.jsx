import { redirect } from "next/navigation";

/** Legacy shared community route — redirect to the role-scoped page via the entry router. */
export default function LegacyCommunityRedirect() {
    redirect("/dashboard");
}
