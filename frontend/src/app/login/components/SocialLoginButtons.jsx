"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

function GoogleIcon(props) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4A9.6 9.6 0 0 0 2.4 12 9.6 9.6 0 0 0 12 21.6c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5H12Z"
            />
            <path
                fill="#34A853"
                d="M2.4 12c0 1.6.4 3.1 1.2 4.5l3.5-2.7c-.2-.5-.3-1.1-.3-1.8s.1-1.2.3-1.8L3.6 7.5A9.5 9.5 0 0 0 2.4 12Z"
            />
            <path
                fill="#FBBC05"
                d="M12 21.6c2.7 0 5-.9 6.7-2.5l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2l-3.6 2.8A9.6 9.6 0 0 0 12 21.6Z"
            />
            <path
                fill="#4285F4"
                d="M18.7 19.1c1.9-1.8 3.1-4.4 3.1-7.5 0-.6-.1-1.1-.2-1.5H12v3.9h5.4c-.3 1.4-1.1 2.6-2.1 3.4l3.4 2.7Z"
            />
        </svg>
    )
}

function GitHubIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.16c-3.2.7-3.88-1.35-3.88-1.35-.52-1.33-1.27-1.68-1.27-1.68-1.04-.7.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.52-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.14 1.18A10.9 10.9 0 0 1 12 6.32c.97 0 1.95.13 2.87.38 2.18-1.49 3.14-1.18 3.14-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.43-2.7 5.4-5.28 5.69.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
    )
}

function LoadingSpinner() {
    return (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
    )
}

export default function SocialLoginButtons({ redirectTo = "/dashboard" }) {
    const [loading, setLoading] = useState(null)

    const handleSocialLogin = async (provider) => {
        try {
            setLoading(provider)
            await signIn(provider, { callbackUrl: redirectTo })
        } finally {
            setLoading(null)
        }
    }

    const isLoading = (provider) => loading === provider
    const isDisabled = loading !== null

    return (
        <div className="mt-6 flex w-max w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={isDisabled}
                className="flex w-max items-center cursor-pointer justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:border-white/25 hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                    <GoogleIcon className="h-5 w-5" />
                </span>

                <span className="flex items-center gap-2">
                    {isLoading("google") && <LoadingSpinner />}
                    <span>{isLoading("google") ? "Connecting..." : "Continue with Google"}</span>
                </span>
            </button>

            <button
                type="button"
                onClick={() => handleSocialLogin("github")}
                disabled={isDisabled}
                className="flex w-max items-center cursor-pointer justify-center gap-3 rounded-2xl border border-white/15 bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:border-white/25 hover:bg-[#222] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                    <GitHubIcon className="h-5 w-5 text-white" />
                </span>

                <span className="flex items-center gap-2">
                    {isLoading("github") && <LoadingSpinner />}
                    <span>{isLoading("github") ? "Connecting..." : "Continue with GitHub"}</span>
                </span>
            </button>
        </div>
    )
}
