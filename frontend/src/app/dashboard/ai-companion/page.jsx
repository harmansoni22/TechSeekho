import { redirect } from "next/navigation";

/** Legacy shared AI companion route — redirect to the role-scoped page via the entry router. */
export default function LegacyAiCompanionRedirect() {
    redirect("/dashboard");
}
