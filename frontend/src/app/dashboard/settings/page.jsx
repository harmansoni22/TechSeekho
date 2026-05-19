import { redirect } from "next/navigation";

/** Legacy shared settings route — redirect to the role-scoped page via the entry router. */
export default function LegacySettingsRedirect() {
    redirect("/dashboard");
}
