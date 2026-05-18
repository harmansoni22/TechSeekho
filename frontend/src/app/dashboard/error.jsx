"use client";

import { useEffect } from "react";
import ErrorScreen from "../components/error/ErrorScreen";

export default function DashboardError({ error, reset }) {
    useEffect(() => {
        console.error("Dashboard route error:", error);
    }, [error]);

    return (
        <ErrorScreen
            dashboard
            type="error"
            title="The dashboard could not load."
            description="This workspace view ran into a problem while rendering."
            message={error?.message}
            onRetry={reset}
            homeHref="/dashboard"
            homeLabel="Dashboard home"
        />
    );
}
