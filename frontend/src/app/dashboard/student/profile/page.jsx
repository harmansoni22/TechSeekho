"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import { ProfileSkeleton } from "@/features/dashboard/components/ui/skeletons/DashboardSkeletons";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";

const StudentProfilePage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/student/dashboard", {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to load profile");
            }
            const result = await response.json();
            setData(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }
        if (status === "authenticated") {
            fetchProfile();
        }
    }, [fetchProfile, status, router]);

    if (status === "loading" || loading) {
        return <ProfileSkeleton />;
    }

    if (error || !data) {
        return (
            <ErrorScreen
                dashboard
                type="network"
                title="Profile could not load."
                message={error || "No profile data available."}
                onRetry={fetchProfile}
                homeHref="/dashboard/student"
                homeLabel="Student home"
            />
        );
    }

    const { student, achievements = [], kpis = [] } = data;
    const batch = student.currentBatch;

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="My Profile"
                subtitle="Your institutional record"
                user={student}
            />

            <Panel
                eyebrow="Student"
                title={student.fullName}
                description={student.email}
            >
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <ProfileField
                        label="Enrollment number"
                        value={student.enrollmentNumber || "Not assigned"}
                    />
                    <ProfileField
                        label="Joined"
                        value={
                            student.joinedAt
                                ? new Date(
                                      student.joinedAt,
                                  ).toLocaleDateString()
                                : "—"
                        }
                    />
                    <ProfileField
                        label="Email verified"
                        value={student.email ? "Yes" : "—"}
                    />
                </dl>
            </Panel>

            {batch ? (
                <Panel
                    eyebrow="Batch"
                    title={batch.name}
                    description={
                        batch.course?.title
                            ? `Course: ${batch.course.title}`
                            : undefined
                    }
                >
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <ProfileField
                            label="Institution"
                            value={batch.institution?.name || "—"}
                        />
                        <ProfileField
                            label="Location"
                            value={
                                batch.institution?.city
                                    ? `${batch.institution.city}, ${batch.institution.state ?? ""}`
                                    : "—"
                            }
                        />
                        <ProfileField
                            label="Batch starts"
                            value={
                                batch.startDate
                                    ? new Date(
                                          batch.startDate,
                                      ).toLocaleDateString()
                                    : "—"
                            }
                        />
                    </dl>
                </Panel>
            ) : (
                <Panel
                    eyebrow="Batch"
                    title="No batch assigned yet"
                    description="An admin from your institution needs to place you in a batch before operational pages activate."
                >
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Until you are enrolled in a batch, attendance,
                        assignments, and assessments will all show as empty.
                    </p>
                </Panel>
            )}

            <Panel
                eyebrow="Performance"
                title="At-a-glance"
                description="Snapshot of your recent operational metrics"
            >
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpis.map((k) => (
                        <ProfileField
                            key={k.label}
                            label={k.label}
                            value={String(k.value)}
                            footnote={k.delta}
                        />
                    ))}
                </dl>
            </Panel>

            <Panel
                eyebrow="Achievements"
                title={`${achievements.length} unlocked`}
                description="Recognition issued by your institution"
            >
                {achievements.length === 0 ? (
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        Achievements will appear here as you complete modules,
                        submit assignments on time, and maintain attendance.
                    </p>
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {achievements.map((a) => (
                            <li
                                key={a.id}
                                className="rounded-lg border p-4"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor: "var(--dashboard-surface)",
                                }}
                            >
                                <div
                                    className="text-xs uppercase tracking-wide"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {a.points
                                        ? `${a.points} pts`
                                        : "Recognition"}
                                </div>
                                <h4
                                    className="mt-1 text-sm font-semibold"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {a.title}
                                </h4>
                                {a.description && (
                                    <p
                                        className="mt-1 text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {a.description}
                                    </p>
                                )}
                                {a.unlockedAt && (
                                    <p
                                        className="mt-2 text-[10px]"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        Unlocked{" "}
                                        {new Date(
                                            a.unlockedAt,
                                        ).toLocaleDateString()}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
};

const ProfileField = ({ label, value, footnote }) => (
    <div>
        <dt
            className="text-[10px] uppercase tracking-[0.24em]"
            style={{ color: "var(--dashboard-muted)" }}
        >
            {label}
        </dt>
        <dd
            className="mt-1 text-base font-medium"
            style={{ color: "var(--dashboard-fg)" }}
        >
            {value}
        </dd>
        {footnote && (
            <p
                className="mt-1 text-xs"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {footnote}
            </p>
        )}
    </div>
);

export default StudentProfilePage;
