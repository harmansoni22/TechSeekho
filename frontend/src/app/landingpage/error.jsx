"use client";

import { useEffect } from "react";
import ErrorScreen from "../components/error/ErrorScreen";

export default function LandingPageError({ error, reset }) {
    useEffect(() => {
        console.error("Landing page route error:", error);
    }, [error]);

    return (
        <ErrorScreen
            type="error"
            title="This page could not load."
            description="The public site view was interrupted before it finished rendering."
            message={error?.message}
            onRetry={reset}
            homeHref="/landingpage"
            homeLabel="Homepage"
        />
    );
}
