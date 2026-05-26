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
            {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonBlock
                    key={index}
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
            {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index}>
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="mt-3 h-8 w-20" />
                    <SkeletonBlock className="mt-2 h-3 w-16" />
                </SkeletonCard>
            ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, cardIndex) => (
                <SkeletonCard key={cardIndex}>
                    <SkeletonBlock className="h-6 w-44" />
                    <div className="mt-4 space-y-3">
                        {Array.from({ length: 4 }).map((_, rowIndex) => (
                            <SkeletonBlock
                                key={rowIndex}
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
                    {Array.from({ length: 7 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                            <SkeletonBlock className="h-4 w-24" />
                            <SkeletonBlock className="h-2 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            </SkeletonCard>
            <SkeletonCard>
                <SkeletonBlock className="h-6 w-36" />
                <div className="mt-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonBlock
                            key={index}
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
                    {Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-4 w-full" />
                    ))}
                </div>
            </SkeletonCard>
            <SkeletonCard>
                <SkeletonBlock className="h-6 w-44" />
                <div className="mt-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-4 w-full" />
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
                {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonBlock
                        key={index}
                        className="h-10 w-full rounded-lg"
                    />
                ))}
            </div>
            <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonBlock
                        key={index}
                        className="h-10 w-full rounded-lg"
                    />
                ))}
            </div>
        </SkeletonCard>
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
            {Array.from({ length: 2 }).map((_, index) => (
                <SkeletonCard key={index} className="rounded-2xl p-5">
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
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
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
    DashboardOverviewSkeleton,
    ProfileSkeleton,
    SettingsSkeleton,
    SidebarSkeleton,
    StoreDetailSkeleton,
    StoreGridSkeleton,
    StoreHomeSkeleton,
};
