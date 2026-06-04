const skeletonKeys = (count, prefix) =>
    Array.from({ length: count }, (_, i) => `${prefix}-${i}`);

const SkeletonBlock = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded-md ${className}`}
        style={{
            backgroundColor:
                "color-mix(in srgb, var(--dashboard-surface) 86%, var(--dashboard-primary) 14%)",
        }}
    />
);

const SkeletonCard = ({ className = "" }) => (
    <div
        className={`rounded-xl border p-4 ${className}`}
        style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
        }}
    />
);

const TopBarSkeleton = () => (
    <header
        className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{
            backgroundColor: "var(--dashboard-surface)",
            borderColor: "var(--dashboard-border)",
        }}
    >
        <div className="space-y-2">
            <SkeletonBlock className="h-7 w-56" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonBlock className="h-9 w-36 rounded-lg" />
    </header>
);

const SidebarSkeleton = () => (
    <aside
        className="w-full border-b p-4 md:h-screen md:w-64 md:border-r md:border-b-0"
        style={{
            backgroundColor:
                "color-mix(in srgb, var(--dashboard-surface) 92%, transparent)",
            borderColor: "var(--dashboard-border)",
        }}
    >
        <div className="mb-6 space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-7 w-32" />
        </div>
        <div className="flex flex-wrap gap-2 md:flex-col">
            {skeletonKeys(6, "sidebar-link").map((key) => (
                <SkeletonBlock
                    key={key}
                    className="h-9 w-28 rounded-sm md:w-full"
                />
            ))}
        </div>
    </aside>
);

const DashboardOverviewSkeleton = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBarSkeleton />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {skeletonKeys(4, "overview-kpi").map((key) => (
                <SkeletonCard key={key}>
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="mt-3 h-8 w-20" />
                    <SkeletonBlock className="mt-2 h-3 w-16" />
                </SkeletonCard>
            ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
            {skeletonKeys(2, "overview-panel").map((key) => (
                <SkeletonCard key={key}>
                    <SkeletonBlock className="h-6 w-44" />
                    <div className="mt-4 space-y-3">
                        {skeletonKeys(4, `${key}-row`).map((rowKey) => (
                            <SkeletonBlock
                                key={rowKey}
                                className="h-14 w-full rounded-lg"
                            />
                        ))}
                    </div>
                </SkeletonCard>
            ))}
        </section>
    </div>
);

const AnalyticsSkeleton = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBarSkeleton />
        <section className="grid gap-4 lg:grid-cols-2">
            <SkeletonCard>
                <SkeletonBlock className="h-6 w-44" />
                <div className="mt-4 space-y-3">
                    {skeletonKeys(7, "analytics-bar").map((key) => (
                        <div key={key} className="space-y-2">
                            <SkeletonBlock className="h-4 w-24" />
                            <SkeletonBlock className="h-2 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            </SkeletonCard>
            <SkeletonCard>
                <SkeletonBlock className="h-6 w-36" />
                <div className="mt-4 space-y-3">
                    {skeletonKeys(4, "analytics-block").map((key) => (
                        <SkeletonBlock
                            key={key}
                            className="h-16 w-full rounded-lg"
                        />
                    ))}
                </div>
            </SkeletonCard>
        </section>
    </div>
);

const ProfileSkeleton = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBarSkeleton />
        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <SkeletonCard>
                <SkeletonBlock className="h-6 w-40" />
                <div className="mt-4 space-y-2">
                    {skeletonKeys(4, "profile-a").map((key) => (
                        <SkeletonBlock key={key} className="h-4 w-full" />
                    ))}
                </div>
            </SkeletonCard>
            <SkeletonCard>
                <SkeletonBlock className="h-6 w-44" />
                <div className="mt-4 space-y-2">
                    {skeletonKeys(3, "profile-b").map((key) => (
                        <SkeletonBlock key={key} className="h-4 w-full" />
                    ))}
                </div>
            </SkeletonCard>
        </section>
    </div>
);

const SettingsSkeleton = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBarSkeleton />
        <SkeletonCard>
            <SkeletonBlock className="h-6 w-36" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {skeletonKeys(6, "settings-grid").map((key) => (
                    <SkeletonBlock
                        key={key}
                        className="h-10 w-full rounded-lg"
                    />
                ))}
            </div>
            <div className="mt-5 space-y-3">
                {skeletonKeys(4, "settings-row").map((key) => (
                    <SkeletonBlock
                        key={key}
                        className="h-10 w-full rounded-lg"
                    />
                ))}
            </div>
        </SkeletonCard>
    </div>
);

const CoursesSkeleton = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBarSkeleton />
        <div className="grid gap-6">
            {skeletonKeys(3, "courses-card").map((key) => (
                <SkeletonCard key={key} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                            <SkeletonBlock className="h-6 w-2/3" />
                            <SkeletonBlock className="h-4 w-full" />
                            <SkeletonBlock className="h-4 w-1/2" />
                        </div>
                        <SkeletonBlock className="h-10 w-16 rounded-lg" />
                    </div>
                    <SkeletonBlock className="mt-4 h-3 w-full rounded-full" />
                    <div className="mt-6 space-y-2">
                        {skeletonKeys(3, `${key}-mod`).map((modKey) => (
                            <SkeletonBlock
                                key={modKey}
                                className="h-12 w-full rounded-lg"
                            />
                        ))}
                    </div>
                    <div className="mt-6 flex gap-3">
                        <SkeletonBlock className="h-10 w-40 rounded-lg" />
                        <SkeletonBlock className="h-10 w-32 rounded-lg" />
                    </div>
                </SkeletonCard>
            ))}
        </div>
    </div>
);

const AssignmentsSkeleton = () => (
    <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
        <TopBarSkeleton />
        {skeletonKeys(3, "assign-bucket").map((key) => (
            <SkeletonCard key={key} className="p-0">
                <div
                    className="border-b px-6 py-5"
                    style={{ borderColor: "var(--dashboard-border)" }}
                >
                    <SkeletonBlock className="h-5 w-32" />
                    <SkeletonBlock className="mt-2 h-3 w-48" />
                </div>
                <div className="space-y-3 px-6 py-5">
                    {skeletonKeys(2, `${key}-row`).map((rowKey) => (
                        <SkeletonBlock
                            key={rowKey}
                            className="h-20 w-full rounded-lg"
                        />
                    ))}
                </div>
            </SkeletonCard>
        ))}
    </div>
);

const StoreHomeSkeleton = () => (
    <div
        className="space-y-6 p-6 md:p-8"
        style={{ color: "var(--dashboard-fg)" }}
    >
        <div className="space-y-2">
            <SkeletonBlock className="h-9 w-36" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            {skeletonKeys(2, "store-home").map((key) => (
                <SkeletonCard key={key} className="rounded-2xl p-5">
                    <SkeletonBlock className="h-7 w-28" />
                    <SkeletonBlock className="mt-3 h-4 w-full" />
                    <SkeletonBlock className="mt-2 h-4 w-5/6" />
                    <SkeletonBlock className="mt-5 h-4 w-24" />
                </SkeletonCard>
            ))}
        </div>
    </div>
);

const StoreGridSkeleton = () => (
    <div
        className="space-y-6 p-6 md:p-8"
        style={{ color: "var(--dashboard-fg)" }}
    >
        <div className="space-y-2">
            <SkeletonBlock className="h-9 w-44" />
            <SkeletonBlock className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skeletonKeys(6, "store-grid").map((key) => (
                <div
                    key={key}
                    className="overflow-hidden rounded-2xl border"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor:
                            "color-mix(in srgb, var(--dashboard-surface) 94%, var(--dashboard-primary) 6%)",
                    }}
                >
                    <SkeletonBlock className="h-44 w-full rounded-none" />
                    <div className="space-y-2 p-4">
                        <SkeletonBlock className="h-4 w-24" />
                        <SkeletonBlock className="h-6 w-4/5" />
                        <SkeletonBlock className="h-4 w-full" />
                        <SkeletonBlock className="h-5 w-20" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const StoreDetailSkeleton = () => (
    <div className="space-y-6 p-6 md:p-8">
        <SkeletonBlock className="h-4 w-40" />
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <SkeletonBlock className="h-[420px] w-full rounded-3xl border border-[var(--dashboard-border)]" />
            <div className="space-y-4">
                <SkeletonBlock className="h-6 w-24" />
                <SkeletonBlock className="h-12 w-3/4" />
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-28 w-full rounded-2xl" />
                <SkeletonBlock className="h-11 w-full rounded-xl" />
            </div>
        </div>
    </div>
);

export {
    AnalyticsSkeleton,
    AssignmentsSkeleton,
    CoursesSkeleton,
    DashboardOverviewSkeleton,
    ProfileSkeleton,
    SettingsSkeleton,
    SidebarSkeleton,
    StoreDetailSkeleton,
    StoreGridSkeleton,
    StoreHomeSkeleton,
};
