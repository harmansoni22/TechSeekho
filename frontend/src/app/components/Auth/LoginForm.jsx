/* biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative inline icons in this component */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
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

const LoginForm = () => {
    const [identifier, setIdentifier] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams?.get("next");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const validation = validateLoginInput({ identifier, password });
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        setLoading(true);
        try {
            if (!otpRequested) {
                const otpResponse = await api("/auth/login/request-otp", {
                    method: "POST",
                    body: JSON.stringify({ identifier, password }),
                });
                setOtpRequested(true);
                setError(
                    otpResponse.otp
                        ? `OTP sent. Development OTP: ${otpResponse.otp}`
                        : "OTP sent. Please enter the code to continue.",
                );
                return;
            }

            const result = await signIn("credentials", {
                identifier,
                password,
                otp,
                redirect: false,
            });

            if (result.error) {
                throw new Error(result.error || "Login failed");
            }

            const session = await getSession();
            const roles = session?.user?.roles ?? [];
            const roleDestination = resolveRoleDestination(roles);

            if (!roleDestination && roles.length === 0) {
                // Session not yet populated — fall through to /dashboard which will re-resolve.
                console.warn("[LoginForm] Session roles empty after signIn, falling back to /dashboard");
            }

            router.push(next || roleDestination || "/dashboard");
        } catch (err) {
            setError(err.message || "Login failed. Try again.");
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
                                <rect x="2" y="4" width="20" height="16" rx="2" />
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

                {otpRequested && (
                    <motion.div
                        variants={fieldVariant}
                        className="flex flex-col gap-1.5"
                    >
                        <label
                            className="text-[0.8rem] font-medium text-white/60"
                            htmlFor="login-otp"
                        >
                            OTP code
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
                                    aria-hidden="true"
                                    focusable="false"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9 12h6" />
                                </svg>
                            </span>
                            <input
                                id="login-otp"
                                type="text"
                                name="login_user_otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit code"
                                className="w-full py-3.5 px-4 pl-11 text-[0.875rem] text-white bg-white/[0.04] border border-white/10 rounded-xl outline-none transition-all duration-200 placeholder:text-white/20 focus:bg-white/[0.06] focus:border-[#a78bfa]/40 focus:ring-[3px] focus:ring-[#a78bfa]/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
                                autoComplete="one-time-code"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                maxLength={6}
                                inputMode="numeric"
                                data-lpignore="true"
                                data-1p-ignore="true"
                            />
                        </div>
                    </motion.div>
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

                <motion.div variants={fieldVariant}>
                    <button
                        type="submit"
                        className="relative flex items-center justify-center gap-2 w-full py-3.5 px-6 text-[0.92rem] font-semibold text-white bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#4f46e5] rounded-xl cursor-pointer transition-all duration-300 overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_3px_5px_rgba(99,102,241,0.35),0_0_60px_rgba(99,102,241,0.1)] hover:bg-gradient-to-r hover:from-[#6d28d9] hover:via-[#4f46e5] hover:to-[#4338ca] disabled:opacity-70 disabled:cursor-not-allowed group"
                        disabled={loading}
                    >
                        <div
                            className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            aria-hidden="true"
                        />
                        {loading ? (
                            <span className="w-4 h-4 border-[2px] border-white/30 border-t-white rounded-full animate-spin" />
                        ) : null}
                        <span className="relative z-10">
                            {loading ? "Signing in..." : "Sign in"}
                        </span>
                    </button>
                </motion.div>

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
