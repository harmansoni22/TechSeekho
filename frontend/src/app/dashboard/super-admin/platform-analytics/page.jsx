"use client";

import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import BackendPending from "@/features/dashboard/components/ui/widgets/BackendPending";

const PlatformAnalyticsPage = () => {
    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Insight · Platform Analytics"
                title="Trends, not totals."
                subtitle="Snapshot metrics live on the overview. Here we want time-series — daily active learners, attendance over weeks, submission velocity, retention cohorts."
            />

            <BackendPending
                whatItDoes="Time-series charts for DAU/WAU/MAU, attendance trend by institution, assignment submission velocity, and retention by cohort. Each chart will be a small composable inside a Panel and accept date-range / institution filters."
                endpoints={[
                    {
                        method: "GET",
                        path: "/admin/analytics/dau?range=…",
                        purpose: "daily active users",
                    },
                    {
                        method: "GET",
                        path: "/admin/analytics/attendance?range=…&institutionId=…",
                        purpose: "attendance trend",
                    },
                    {
                        method: "GET",
                        path: "/admin/analytics/submissions?range=…",
                        purpose: "submission velocity",
                    },
                    {
                        method: "GET",
                        path: "/admin/analytics/retention?cohort=…",
                        purpose: "retention curve",
                    },
                ]}
                previewSlots={[
                    "DAU line chart",
                    "Attendance heatmap",
                    "Submission velocity",
                    "Retention curves",
                ]}
                note="Each aggregation should be cacheable for ≥60s — we don't need second-precision here, and the cost savings are worth the staleness."
            />
        </div>
    );
};

export default PlatformAnalyticsPage;
