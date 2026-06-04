"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchStudentDashboard } from "@/features/dashboard/api/studentDashboard.api";

export function useDashboardData() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            console.log("[useDashboardData] Fetching dashboard data...");
            setLoading(true);
            setError(null);
            try {
                const res = await fetchStudentDashboard();
                console.log("[useDashboardData] Dashboard response", res);

                // Expected backend response shape (common): { message, data: dashboardData }
                const payload = res?.data ?? res;
                if (!cancelled) {
                    setData(payload);
                }
            } catch (e) {
                if (cancelled) return;
                console.error("[useDashboardData] Dashboard fetch failed", e);

                const raw = e instanceof Error ? e.message : String(e);

                // Backend uses standardized AppError code.
                // With current api() wrapper, we only get message text.
                // Still, we route on known onboarding-required marker.
                const isOnboardingRequired =
                    raw.includes("ONBOARDING_REQUIRED") ||
                    raw.includes(
                        "Operational access requires institution approval",
                    );

                if (isOnboardingRequired) {
                    setError(null);
                    setData(null);
                    router.replace("/pending-approval?next=/dashboard");
                    return;
                }

                setError(raw);
                setData(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        run();

        return () => {
            cancelled = true;
        };
    }, [router.replace]);

    const view = useMemo(() => {
        if (!data) {
            return {
                loading,
                error,
                // keep UI stable for now; do not provide hardcoded mock metrics
                kpis: [],
                weeklyTraffic: [],
                topCourses: [],
                recentActivity: [],
                dailyGoals: [],
                currentStreak: 0,
                quickAccessLessons: [],
            };
        }

        // Dashboard UI currently expects:
        // { kpis, weeklyTraffic, topCourses, recentActivity, dailyGoals, currentStreak, quickAccessLessons }
        // We map backend response to that shape if backend already provides it.
        const payload = data;
        return {
            loading,
            error,
            ...payload,
            // Ensure required keys exist even if backend omits some fields.
            // Also normalize list fields defensively: backend may return objects/strings.
            kpis: Array.isArray(payload.kpis) ? payload.kpis : [],
            weeklyTraffic: Array.isArray(payload.weeklyTraffic)
                ? payload.weeklyTraffic
                : [],
            topCourses: Array.isArray(payload.topCourses)
                ? payload.topCourses
                : [],
            recentActivity: Array.isArray(payload.recentActivity)
                ? payload.recentActivity
                : [],
            dailyGoals: Array.isArray(payload.dailyGoals)
                ? payload.dailyGoals
                : [],
            currentStreak:
                typeof payload.currentStreak === "number"
                    ? payload.currentStreak
                    : 0,
            quickAccessLessons: Array.isArray(payload.quickAccessLessons)
                ? payload.quickAccessLessons
                : [],
        };
    }, [data, error, loading]);

    return view;
}
