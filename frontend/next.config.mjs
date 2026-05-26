import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for production
const isProd = process.env.NODE_ENV === "production";

// Allow inline styles + Next runtime + connecting to the backend / NextAuth
// providers. `unsafe-inline` on style is required by Tailwind v4 / MUI / GSAP
// style injection; tightening further needs a nonce-based pipeline.
const backendOrigin = (() => {
    try {
        return process.env.NEXT_PUBLIC_BACKEND
            ? new URL(process.env.NEXT_PUBLIC_BACKEND).origin
            : "";
    } catch {
        return "";
    }
})();

const connectSrc = [
    "'self'",
    backendOrigin,
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com",
    "https://api.github.com",
    "https://accounts.google.com",
    "https://github.com",
]
    .filter(Boolean)
    .join(" ");

const csp = [
    "default-src 'self'",
    // Next.js runtime, GSAP, framer-motion need 'unsafe-inline' for runtime CSS-in-JS
    // and 'unsafe-eval' for dev HMR; both are scoped to script-src.
    isProd
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
].join("; ");

const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
    },
    { key: "Content-Security-Policy", value: csp },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    ...(isProd
        ? [
              {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
              },
          ]
        : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        // Keep Turbopack rooted at monorepo root to avoid lockfile auto-detection warnings.
        root: path.join(__dirname, ".."),
    },

    async headers() {
        return [
            {
                source: "/:path*",
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
