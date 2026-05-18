"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import { StoreGridSkeleton } from "../../components/skeletons/DashboardSkeletons";
import { getAllCourses } from "./courses.service";

function formatPrice(amount = 0) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

export default function CoursesStorePage() {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadCourses() {
            try {
                const data = await getAllCourses();
                if (!isMounted) return;
                setCourses(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!isMounted) return;
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load courses.",
                );
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadCourses();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div
            className="space-y-6 p-6 md:p-8"
            style={{ color: "var(--dashboard-fg)" }}
        >
            <div>
                <h1
                    className="text-3xl font-semibold"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    My Courses
                </h1>
                <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    Fetched from backend API.
                </p>
            </div>

            {isLoading && <StoreGridSkeleton />}
            {error && (
                <ErrorScreen
                    dashboard
                    type="network"
                    title="Courses could not load."
                    message={error}
                    homeHref="/dashboard/store"
                    homeLabel="Store home"
                    className="min-h-[380px] px-0 py-6"
                />
            )}

            {!isLoading && !error && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/dashboard/store/courses/course/${course.slug}`}
                            className="overflow-hidden rounded-2xl border transition hover:-translate-y-0.5"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                backgroundColor:
                                    "color-mix(in srgb, var(--dashboard-surface) 94%, var(--dashboard-primary) 6%)",
                                boxShadow: "var(--dashboard-shadow)",
                            }}
                        >
                            <img
                                src={course.bannerImage}
                                alt={course.title}
                                className="h-44 w-full object-cover"
                            />
                            <div className="space-y-2 p-4">
                                <h2
                                    className="text-lg font-semibold"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {course.title}
                                </h2>
                                <p
                                    className="line-clamp-2 text-sm"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    {course.shortDescription}
                                </p>
                                <p
                                    className="font-semibold"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {formatPrice(course.price)}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
