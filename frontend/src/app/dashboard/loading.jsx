// import {
//   DashboardOverviewSkeleton,
//   SidebarSkeleton,
// } from "@/src/features/dashboard/components/ui/layout/skeletons";

import {
  DashboardOverviewSkeleton,
  SidebarSkeleton
} from "@/features/dashboard/components/ui/skeletons/DashboardSkeletons";

export default function Loading() {
  return (
    <main
      className="min-h-screen md:flex"
      style={{
        backgroundColor: "var(--dashboard-bg)",
        color: "var(--dashboard-fg)",
      }}
    >
      <SidebarSkeleton />
      <section className="flex-1 p-4 md:p-6">
        <DashboardOverviewSkeleton />
      </section>
    </main>
  );
}
