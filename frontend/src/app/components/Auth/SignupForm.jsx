/* biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative inline icons in this component */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const fieldVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const SignupForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirm) {
      setError("Please fill all required fields");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      alert(`Account created (demo): ${email}`);
      router.push(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
    } catch (err) {
      setError(`Signup failed. Try again. ${err}`);
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
          transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.08 },
        },
      }}
      className="w-full"
    >
      {/* Header */}
      <motion.div variants={fieldVariant} className="mb-8">
        <h2 className="text-[1.75rem] font-bold text-white tracking-tight mb-2">
          Create account
        </h2>
        <p className="text-[0.9rem] text-white/40">
          Start your learning journey
        </p>
      </motion.div>

      {/* Social Buttons */}
      <motion.div
        variants={fieldVariant}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <button
          type="button"
          id="signup-google-btn"
          className="flex items-center justify-center gap-2 py-2.5 px-4 text-[0.825rem] font-medium text-white/80 bg-white/5 border border-white/10 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          id="signup-github-btn"
          className="flex items-center justify-center gap-2 py-2.5 px-4 text-[0.825rem] font-medium text-white/80 bg-white/5 border border-white/10 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </button>
      </motion.div>

      {/* Divider */}
      <motion.div
        variants={fieldVariant}
        className="flex items-center gap-4 mb-6"
      >
        <span className="flex-1 h-px bg-white/10" />
        <span className="text-[0.72rem] text-white/25 uppercase tracking-[0.08em] whitespace-nowrap">
          or continue with email
        </span>
        <span className="flex-1 h-px bg-white/10" />
      </motion.div>

      {/* Form */}
      <motion.form
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        <motion.div variants={fieldVariant} className="flex flex-col gap-1.5">
          <label
            className="text-[0.8rem] font-medium text-white/60"
            htmlFor="signup-name"
          >
            Full name
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
                <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full py-3.5 px-4 pl-11 text-[0.875rem] text-white bg-white/[0.04] border border-white/10 rounded-xl outline-none transition-all duration-200 placeholder:text-white/20 focus:bg-white/[0.06] focus:border-[#a78bfa]/40 focus:ring-[3px] focus:ring-[#a78bfa]/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
              autoComplete="name"
            />
          </div>
        </motion.div>

        <motion.div variants={fieldVariant} className="flex flex-col gap-1.5">
          <label
            className="text-[0.8rem] font-medium text-white/60"
            htmlFor="signup-email"
          >
            Email address
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
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full py-3.5 px-4 pl-11 text-[0.875rem] text-white bg-white/[0.04] border border-white/10 rounded-xl outline-none transition-all duration-200 placeholder:text-white/20 focus:bg-white/[0.06] focus:border-[#a78bfa]/40 focus:ring-[3px] focus:ring-[#a78bfa]/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
              autoComplete="email"
            />
          </div>
        </motion.div>

        <motion.div variants={fieldVariant} className="flex flex-col gap-1.5">
          <label
            className="text-[0.8rem] font-medium text-white/60"
            htmlFor="signup-password"
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
                aria-hidden="true"
                focusable="false"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Lock icon</title>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full py-3.5 px-4 pl-11 pr-11 text-[0.875rem] text-white bg-white/[0.04] border border-white/10 rounded-xl outline-none transition-all duration-200 placeholder:text-white/20 focus:bg-white/[0.06] focus:border-[#a78bfa]/40 focus:ring-[3px] focus:ring-[#a78bfa]/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-2 flex items-center justify-center p-1.5 text-white/30 bg-transparent border-none cursor-pointer rounded-lg transition-colors hover:text-white/60 hover:bg-white/5"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
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
                  aria-label="img"
                >
                  <title>Hide password</title>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  aria-label="img"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>show password</title>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div variants={fieldVariant} className="flex flex-col gap-1.5">
          <label
            className="text-[0.8rem] font-medium text-white/60"
            htmlFor="signup-confirm"
          >
            Confirm password
          </label>
          <div className="relative flex items-center group">
            <span
              className="absolute left-3.5 flex text-white/20 pointer-events-none transition-colors duration-200 group-focus-within:text-[#a78bfa]/80"
              aria-hidden="true"
            >
              <title>lock icon</title>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-label="img"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="signup-confirm"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full py-3.5 px-4 pl-11 text-[0.875rem] text-white bg-white/[0.04] border border-white/10 rounded-xl outline-none transition-all duration-200 placeholder:text-white/20 focus:bg-white/[0.06] focus:border-[#a78bfa]/40 focus:ring-[3px] focus:ring-[#a78bfa]/10 focus:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
              autoComplete="new-password"
            />
          </div>
        </motion.div>

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
              aria-label="img"
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
            id="signup-submit-btn"
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
              {loading ? "Creating account…" : "Create account"}
            </span>
          </button>
        </motion.div>

        <motion.p
          variants={fieldVariant}
          className="text-[0.9rem] text-white/50 text-center mt-2"
        >
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next || "/")}`}
            className="text-[#a78bfa] hover:text-[#c4b5fd] transition-colors"
          >
            Log in &rarr;
          </Link>
        </motion.p>
      </motion.form>
    </motion.div>
  );
};

export default SignupForm;
