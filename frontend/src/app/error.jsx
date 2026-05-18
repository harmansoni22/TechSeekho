"use client";

import { useEffect } from "react";
import ErrorScreen from "./components/error/ErrorScreen";

export default function AppError({ error, reset }) {
    useEffect(() => {
        console.error("Application route error:", error);
    }, [error]);

    return (
        <ErrorScreen
            type="error"
            message={error?.message}
            onRetry={reset}
            homeHref="/landingpage"
            homeLabel="Go to homepage"
        />
    );
}
