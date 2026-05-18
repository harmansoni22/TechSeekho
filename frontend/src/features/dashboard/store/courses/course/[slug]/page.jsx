"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import { getCourseBySlug } from "../../courses.service";

function formatPrice(amount = 0) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function CourseDetailSkeleton() {
    return (
        <div className="space-y-6 p-6 md:p-8">
            <div className="h-4 w-40 animate-pulse rounded bg-[var(--dashboard-surface)]" />
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="h-[260px] animate-pulse rounded-[28px] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] md:h-[420px]" />
                <div className="space-y-4">
                    <div className="h-6 w-24 animate-pulse rounded bg-[var(--dashboard-surface)]" />
                    <div className="h-12 w-3/4 animate-pulse rounded bg-[var(--dashboard-surface)]" />
                    <div className="h-20 w-full animate-pulse rounded bg-[var(--dashboard-surface)]" />
                    <div className="h-28 w-full animate-pulse rounded-[28px] bg-[var(--dashboard-surface)]" />
                    <div className="h-11 w-full animate-pulse rounded-xl bg-[var(--dashboard-surface)]" />
                </div>
            </div>
        </div>
    );
}

function Badge({ children, tone = "default" }) {
    const tones = {
        default: {
            background:
                "color-mix(in srgb, var(--dashboard-surface) 86%, var(--dashboard-primary) 14%)",
            color: "var(--dashboard-fg)",
            borderColor: "var(--dashboard-border)",
        },
        success: {
            background:
                "color-mix(in srgb, var(--dashboard-primary) 16%, var(--dashboard-surface) 84%)",
            color: "var(--dashboard-primary)",
            borderColor:
                "color-mix(in srgb, var(--dashboard-primary) 28%, var(--dashboard-border) 72%)",
        },
        muted: {
            background: "var(--dashboard-surface)",
            color: "var(--dashboard-muted)",
            borderColor: "var(--dashboard-border)",
        },
    };

    return (
        <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
            style={tones[tone]}
        >
            {children}
        </span>
    );
}

function StatCard({ label, value }) {
    return (
        <div
            className="rounded-2xl border p-4"
            style={{
                borderColor: "var(--dashboard-border)",
                background: "var(--dashboard-bg)",
            }}
        >
            <p
                className="text-xs uppercase tracking-wide"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {label}
            </p>
            <p
                className="mt-1 text-sm font-medium"
                style={{ color: "var(--dashboard-fg)" }}
            >
                {value}
            </p>
        </div>
    );
}

export default function CourseDetailPage() {
    const params = useParams();
    const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!slug) return;
        let isMounted = true;

        async function loadCourse() {
            setIsLoading(true);
            setError("");

            try {
                const data = await getCourseBySlug(slug);
                if (!isMounted) return;
                setCourse(data);
            } catch (err) {
                if (!isMounted) return;
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load course.",
                );
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadCourse();

        return () => {
            isMounted = false;
        };
    }, [slug]);

    const priceText = useMemo(
        () => formatPrice(course?.price ?? 0),
        [course?.price],
    );

    const enrollmentStatus = course?.enrollmentStatus || "open";
    const isOpen = enrollmentStatus.toLowerCase() === "open";

    const highlights = [
        "Hands-on learning with practical projects",
        "Beginner-friendly structure with guided progression",
        "Designed for school students and early builders",
        "Focused on real skills, not just theory",
    ];

    const curriculum = [
        "Introduction and course roadmap",
        "Core concepts with simple guided explanations",
        "Hands-on implementation and mini exercises",
        "Final practical project and next-step guidance",
    ];

    if (isLoading) return <CourseDetailSkeleton />;

    if (error || !course) {
        return (
            <ErrorScreen
                dashboard
                type={error ? "network" : "empty"}
                title={error ? "Course could not load." : "Course not found."}
                message={error || ""}
                backHref="/dashboard/store/courses"
                backLabel="Back to courses"
                homeHref="/dashboard/store"
                homeLabel="Store home"
            />
        );
    }

    return (
        <div
            className="space-y-6 p-6 md:space-y-8 md:p-8"
            style={{ color: "var(--dashboard-fg)" }}
        >
            <nav
                className="flex flex-wrap items-center gap-2 text-sm"
                style={{ color: "var(--dashboard-muted)" }}
                aria-label="Breadcrumb"
            >
                <Link
                    href="/dashboard/store"
                    className="transition hover:opacity-80"
                >
                    Store
                </Link>
                <span>/</span>
                <Link
                    href="/dashboard/store/courses"
                    className="transition hover:opacity-80"
                >
                    Courses
                </Link>
                <span>/</span>
                <span style={{ color: "var(--dashboard-fg)" }}>
                    {course.title}
                </span>
            </nav>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
                <div className="space-y-4 xl:sticky xl:top-6">
                    <div
                        className="overflow-hidden rounded-[28px] border"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            background: "var(--dashboard-surface)",
                        }}
                    >
                        <img
                            src={course.bannerImage}
                            alt={course.title}
                            className="h-[240px] w-full object-cover md:h-[420px] xl:h-[500px]"
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="Access" value="Lifetime access" />
                        <StatCard
                            label="Format"
                            value="Structured online course"
                        />
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge>{course.category || "Course"}</Badge>
                        <Badge tone={isOpen ? "success" : "muted"}>
                            Enrollment {enrollmentStatus}
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                            {course.title}
                        </h1>

                        <p
                            className="max-w-2xl text-[15px] leading-7 md:text-base"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {course.description}
                        </p>
                    </div>

                    <div
                        className="rounded-[28px] border p-5 md:p-6"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            background: "var(--dashboard-surface)",
                        }}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    Course fee
                                </p>
                                <p className="text-3xl font-semibold md:text-4xl">
                                    {priceText}
                                </p>
                            </div>

                            <div
                                className="rounded-2xl px-3 py-2 text-sm font-medium"
                                style={{
                                    background:
                                        "color-mix(in srgb, var(--dashboard-primary) 10%, var(--dashboard-surface) 90%)",
                                    color: "var(--dashboard-primary)",
                                }}
                            >
                                Project-based learning path
                            </div>
                        </div>

                        <div
                            className="mt-4 grid gap-3 rounded-2xl p-4 text-sm sm:grid-cols-3"
                            style={{
                                background: "var(--dashboard-bg)",
                                color: "var(--dashboard-muted)",
                            }}
                        >
                            <div>
                                <p
                                    className="font-medium"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    Level
                                </p>
                                <p className="mt-1">Beginner to intermediate</p>
                            </div>
                            <div>
                                <p
                                    className="font-medium"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    Duration
                                </p>
                                <p className="mt-1">4–6 weeks flexible pace</p>
                            </div>
                            <div>
                                <p
                                    className="font-medium"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    Support
                                </p>
                                <p className="mt-1">
                                    Guided learning and practice
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                disabled={!isOpen}
                                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    background: "var(--dashboard-primary)",
                                    color: "white",
                                }}
                            >
                                {isOpen ? "Enroll now" : "Enrollment closed"}
                            </button>

                            <button
                                type="button"
                                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    background: "var(--dashboard-bg)",
                                    color: "var(--dashboard-fg)",
                                }}
                            >
                                Preview curriculum
                            </button>
                        </div>

                        <p
                            className="mt-3 text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Best for learners who want a structured path with
                            practical outcomes.
                        </p>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <section
                            className="rounded-[28px] border p-5"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                background: "var(--dashboard-surface)",
                            }}
                        >
                            <h2 className="text-base font-semibold">
                                What you’ll learn
                            </h2>
                            <ul
                                className="mt-4 space-y-3 text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {highlights.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </section>

                        <section
                            className="rounded-[28px] border p-5"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                background: "var(--dashboard-surface)",
                            }}
                        >
                            <h2 className="text-base font-semibold">
                                Curriculum preview
                            </h2>
                            <ul
                                className="mt-4 space-y-3 text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {curriculum.map((item, index) => (
                                    <li key={item}>
                                        Module {index + 1}: {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    <section
                        className="rounded-[28px] border p-5"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            background: "var(--dashboard-surface)",
                        }}
                    >
                        <h2 className="text-base font-semibold">
                            Why this course
                        </h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <StatCard
                                label="Learning style"
                                value="Practical and guided"
                            />
                            <StatCard
                                label="Outcome"
                                value="Build confidence through projects"
                            />
                            <StatCard
                                label="Audience"
                                value="Students, beginners, self-learners"
                            />
                            <StatCard
                                label="Goal"
                                value="Skill-building with structured clarity"
                            />
                        </div>
                    </section>

                    <Link
                        href="/dashboard/store/courses"
                        className="inline-flex items-center text-sm font-medium transition hover:opacity-80"
                        style={{ color: "var(--dashboard-primary)" }}
                    >
                        ← Back to courses
                    </Link>
                </div>
            </div>
        </div>
    );
}
