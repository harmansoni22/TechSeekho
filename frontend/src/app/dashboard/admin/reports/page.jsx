import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

export const metadata = { title: "Reports · Admin · TechSeekho" };

export default function AdminReportsPage() {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Institutional Oversight · Reports"
                title="Curated reports for stakeholders."
                subtitle="Projection reports built on top of operational truth. Each report is auditable — generation events are recorded in the AuditLog."
            />
            <BackendPending
                whatItDoes="Generate institution-level reports (attendance summary, batch completion, trainer roster) as PDF/CSV. Reports must be reproducible — store the input parameters in metadata, not the rendered output."
                endpoints={[
                    {
                        method: "POST",
                        path: "/reports/generate",
                        purpose:
                            "Kick off a report. Body: { kind, batchId?, range }. Returns a job id.",
                    },
                    {
                        method: "GET",
                        path: "/reports/:id",
                        purpose:
                            "Poll status; on completion returns a presigned download URL.",
                    },
                ]}
                previewSlots={["Pick a report", "Range", "Recent generations"]}
                note="Audit every report generation with actor + parameters. Don't write reports back into operational tables."
            />
        </div>
    );
}
