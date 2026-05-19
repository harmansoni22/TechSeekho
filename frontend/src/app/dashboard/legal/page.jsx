import { redirect } from "next/navigation";

/** Legacy shared legal route — redirect to the role-scoped page via the entry router. */
export default function LegacyLegalRedirect() {
    redirect("/dashboard");
}
