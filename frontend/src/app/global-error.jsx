"use client";

import ErrorScreen from "./components/error/ErrorScreen";
import "./globals.css";

export default function GlobalError({ error, reset }) {
    return (
        <html lang="en">
            <body>
                <ErrorScreen
                    type="global"
                    message={error?.message}
                    onRetry={reset}
                    homeHref="/landingpage"
                    homeLabel="Go to homepage"
                />
            </body>
        </html>
    );
}
