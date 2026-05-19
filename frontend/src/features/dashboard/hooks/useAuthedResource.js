"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

/**
 * Authenticated resource hook for dashboard pages.
 *
 * Responsibilities:
 *  - Wait for the next-auth session to hydrate before fetching.
 *  - Send the request through the central `api()` client which attaches the
 *    Bearer access token (single source of truth — no localStorage reads).
 *  - Abort in-flight requests on unmount or path change.
 *  - Surface a stable { data, error, loading, refetch } interface.
 *  - Route to /pending-approval when the backend signals onboarding required,
 *    and to /login if the session expires mid-flight.
 *
 * SECURITY NOTES
 *  - Never include accessToken in error messages or logs that bubble up to the UI.
 *  - Never bypass `api()` — it owns auth-header attachment.
 *  - Caller-supplied paths are passed through verbatim; do not interpolate
 *    user-provided values into the path without prior validation.
 *
 * @param {string|null} path  Backend resource path (e.g. "/super-admin/dashboard").
 *                            Pass null to defer the fetch (useful when the
 *                            path depends on async state).
 */
export function useAuthedResource(path) {
    const router = useRouter();
    const { status: authStatus } = useSession();

    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const abortRef = useRef(null);
    const mountedRef = useRef(true);

    const run = useCallback(async () => {
        if (!path) {
            setLoading(false);
            return;
        }

        if (authStatus === "loading") return;

        if (authStatus === "unauthenticated") {
            router.replace("/login");
            return;
        }

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const res = await api(path, {
                method: "GET",
                signal: controller.signal,
            });

            if (!mountedRef.current || controller.signal.aborted) return;

            const payload = res?.data ?? res;
            setData(payload);
        } catch (err) {
            if (controller.signal.aborted) return;
            if (!mountedRef.current) return;

            const raw = err instanceof Error ? err.message : String(err);

            if (
                raw.includes("ONBOARDING_REQUIRED") ||
                raw.includes("Operational access requires institution approval")
            ) {
                router.replace("/pending-approval");
                return;
            }

            if (
                raw.includes("API error 401") ||
                raw.includes("API error 419")
            ) {
                router.replace("/login");
                return;
            }

            setError(raw);
            setData(null);
        } finally {
            if (mountedRef.current && !controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, [path, authStatus, router]);

    useEffect(() => {
        mountedRef.current = true;
        run();
        return () => {
            mountedRef.current = false;
            if (abortRef.current) abortRef.current.abort();
        };
    }, [run]);

    return { data, error, loading, refetch: run };
}
