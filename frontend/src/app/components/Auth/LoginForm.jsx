/* biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative inline icons in this component */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import SocialLoginButtons from "@/app/login/components/SocialLoginButtons";
import { api } from "@/lib/api";
import { resolveRoleDestination } from "@/lib/roleRouter";
import { validateLoginInput } from "./validators/login.validator";

const fieldVariant = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: "easeOut" },
    },
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

// The backend only returns the OTP in the response when EXPOSE_OTP_IN_RESPONSE
// is on (dev only). We still guard on NODE_ENV so a misconfigured prod backend
// can never cause the code to be rendered in the browser.
const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Convert a raw thrown error into a short, user-safe message.
 * `api()` throws Error("API error <status>: <body>") and
 * Error("Network error calling <url>: ...") — we never surface those verbatim.
 * `context` lets us word the 401 differently for OTP-request vs. sign-in.
 */
const friendlyAuthError = (err, context = "login") => {
    const raw = err?.message || "";

    if (/network error/i.test(raw)) {
        return "Can't reach the server. Check your connection and try again.";
    }

    const statusMatch = raw.match(/API error (\d+)/);
    const status = statusMatch ? Number(statusMatch[1]) : null;

    switch (status) {
        case 400:
            return "Bad request. Please check the details you entered and try again.";
        case 401:
            return context === "otp"
                ? "Incorrect password. Please try again."
                : "Incorrect credentials. Please try again.";
        case 403:
            return "This account doesn't have access. Contact your administrator.";
        case 404:
            return "No account found for those details.";
        case 408:
            return "The request timed out. Please try again.";
        case 422:
            return "Please check the details you entered and try again.";
        case 429:
            return "Too many attempts. Please wait a minute and try again.";
        case 500:
            return "Something went wrong on our end. Please try again shortly.";
        case 501:
            return "This action isn't supported right now. Please try again later.";
        case 502:
            return "We're getting an invalid response from the server. Please try again shortly.";
        case 503:
            return "The service is temporarily unavailable. Please try again shortly.";
        case 504:
            return "The server took too long to respond. Please try again shortly.";
        case 505:
            return "Your browser made an unsupported request. Try updating your browser.";
        case 506:
        case 507:
        case 508:
        case 510:
            return "The server ran into a problem handling your request. Please try again later.";
        case 511:
            return "Network authentication is required. Check your connection and sign in to your network.";
        default:
            return GENERIC_ERROR;
    }
};

const LoginForm = () => {
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [devOtp, setDevOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams?.get("next");

    const handleSendOtp = async () => {
        setError("");

        const validation = validateLoginInput({
            identifier,
            password,
        });

        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        setLoading(true);

        try {
            const otpResponse = await api("/auth/login/request-otp", {
                method: "POST",
                body: JSON.stringify({
                    identifier,
                    password,
                }),
            });

            setOtpRequested(true);

            // No SMS/email provider is wired yet, so in dev the backend returns
            // the OTP in the response. Surface it in the UI instead of the
            // console — but only in development, never in production.
            const inlineOtp = IS_DEV && otpResponse.otp ? otpResponse.otp : "";
            setDevOtp(inlineOtp);
            setMessage(
                inlineOtp
                    ? "OTP delivery isn't set up yet — use the code shown below."
                    : "OTP sent. Please enter the code."
            );
        } catch (err) {
            setError(friendlyAuthError(err, "otp"));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const validation = validateLoginInput({
            identifier,
            password,
        });

        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        if (!otpRequested) {
            setError("Please send OTP first.");
            return;
        }

        if (!otp.trim()) {
            setError("Please enter OTP.");
            return;
        }

        setLoading(true);

        try {
            const result = await signIn("credentials", {
                identifier,
                password,
                otp,
                redirect: false,
            });

            if (result?.error) {
                // NextAuth surfaces the backend reason as a raw string here;
                // keep it generic instead of leaking it to the user.
                setError("Incorrect OTP or credentials. Please try again.");
                return;
            }

            const session = await getSession();
            const roles = session?.user?.roles ?? [];
            const roleDestination = resolveRoleDestination(roles);

            router.push(next || roleDestination || "/dashboard");
        } catch (err) {
            setError(friendlyAuthError(err, "otp"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.5,
                        ease: "easeOut",
                        staggerChildren: 0.08,
                    },
                },
            }}
            className="w-full"
        >
            <motion.div variants={fieldVariant} className="mb-8">
                <h2 className="text-[1.75rem] font-bold text-white tracking-tight mb-2">
                    Sign in
                </h2>
                <p className="text-[0.9rem] text-white/40">
                    Access your learning dashboard
                </p>
            </motion.div>

            <motion.div
                variants={fieldVariant}
                className="grid grid-cols-2 gap-3 mb-6"
            >
                <SocialLoginButtons />
            </motion.div>

            <motion.div
                variants={fieldVariant}
                className="flex items-center gap-4 mb-6"
            >
                <span className="flex-1 h-px bg-white/10" />
                <span className="text-[0.72rem] text-white/25 uppercase tracking-[0.08em] whitespace-nowrap">
                    or continue with email or mobile
                </span>
                <span className="flex-1 h-px bg-white/10" />
            </motion.div>

            <motion.form
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.07 } },
                }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
                autoComplete="off"
            >
                <motion.div
                    variants={fieldVariant}
                    className="flex flex-col gap-1.5"
                >
                    <label
                        className="text-[0.8rem] font-medium text-white/60"
                        htmlFor="login-identifier"
                    >
                        Email or mobile number
                    </label>
                    <div className="relative flex items-center group">
                        <span
                            className="absolute left-3.5 flex text-white/20 pointer-events-none transition-colors duration-200 group-focus-within:text-[#a78bfa]/80"
                            aria-hidden="true"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    x="2"
                                    y="4"
                                    width="20"
                                    height="16"
                                    rx="2"
                                />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                        </span>
                        <input
                            id="login-identifier"
                            type="text"
                            name="login_user_identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Enter email or mobile number"
                            className="w-full py-3.5 px-4 pl-11 text-[0.875rem] text-white bg-white/[0.04] border border-white/10 rounded-xl outline-none transition-all duration-200 placeholder:text-white/20 focus:bg-white/[0.06] focus:border-[#a78bfa]/40 focus:ring-[3px] focus:ring-[#a78bfa]/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
                            autoComplete="off"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                        />
                    </div>
                </motion.div>

                <motion.div
                    variants={fieldVariant}
                    className="flex flex-col gap-1.5"
                >
                    <label
                        className="text-[0.8rem] font-medium text-white/60"
                        htmlFor="login-password"
                    >
                        Password
                    </label>
                    <div className="relative flex items-center group">
                        <span
                            className="absolute left-3.5 flex text-white/20 pointer-events-none transition-colors duration-200 group-focus-within:text-[#a78bfa]/80"
                            aria-hidden="true"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                    ry="2"
                                />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                        <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            name="login_user_password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your account password"
                            className="w-full py-3.5 px-4 pl-11 pr-11 text-[0.875rem] text-white bg-white/[0.04] border border-white/10 rounded-xl outline-none transition-all duration-200 placeholder:text-white/20 focus:bg-white/[0.06] focus:border-[#a78bfa]/40 focus:ring-[3px] focus:ring-[#a78bfa]/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
                            autoComplete="new-password"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                        />
                        <button
                            type="button"
                            className="absolute right-2 flex items-center justify-center p-1.5 text-white/30 bg-transparent border-none cursor-pointer rounded-lg transition-colors hover:text-white/60 hover:bg-white/5"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                        >
                            {showPassword ? (
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                </motion.div>

                <motion.div variants={fieldVariant}>
                    <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full py-3.5 px-6 text-[0.92rem] font-medium text-white bg-white/[0.04] border border-white/10 rounded-xl transition-all duration-200 hover:bg-white/[0.08] hover:border-[#a78bfa]/40 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? "Sending OTP..."
                            : otpRequested
                                ? "Resend OTP"
                                : "Send OTP"}
                    </button>
                </motion.div>

                {message && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fieldVariant}
                        className="flex flex-col gap-2 px-3.5 py-3 text-[0.8rem] text-emerald-300 bg-emerald-400/5 border border-emerald-400/15 rounded-lg"
                    >
                        <span>{message}</span>
                        {devOtp && (
                            <div className="flex items-center justify-between gap-3">
                                <code className="text-[1.1rem] font-semibold tracking-[0.3em] text-white">
                                    {devOtp}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => setOtp(devOtp)}
                                    className="text-[0.72rem] font-medium text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                                >
                                    Use code
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {otpRequested && (
                    <div className="flex flex-col gap-1.5">
                        <label
                            className="text-[0.8rem] font-medium text-white/60"
                            htmlFor="login-otp"
                        >
                            OTP code
                        </label>

                        <input
                            id="login-otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="w-full py-3.5 px-4 text-white bg-white/[0.04] border border-white/10 rounded-xl"
                        />
                    </div>
                )}

                {error && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fieldVariant}
                        className="flex items-center gap-2.5 px-3.5 py-3 text-[0.8rem] text-red-400 bg-red-400/5 border border-red-400/15 rounded-lg"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        {error}
                    </motion.div>
                )}

                {otpRequested && (
                    <div>
                        <button
                            type="submit"
                            className="relative flex items-center justify-center gap-2 w-full py-3.5 px-6 text-[0.92rem] font-semibold text-white bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#4f46e5] rounded-xl cursor-pointer transition-all duration-300 overflow-hidden hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify & Sign In"}
                        </button>
                    </div>
                )}

                <motion.p
                    variants={fieldVariant}
                    className="text-[0.9rem] text-white/50 text-center mt-2"
                >
                    Don't have an account?{" "}
                    <Link
                        href={`/signup?next=${encodeURIComponent(next || "/")}`}
                        className="text-[#a78bfa] hover:text-[#c4b5fd] transition-colors"
                    >
                        Create one &rarr;
                    </Link>
                </motion.p>
            </motion.form>
        </motion.div>
    );
};

export default LoginForm;
