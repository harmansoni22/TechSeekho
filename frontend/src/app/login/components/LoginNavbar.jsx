/* biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative inline icons in this component */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LoginNavbar = () => {
  const pathname = usePathname();
  const isSignup = pathname === "/signup";

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-[10] flex justify-between items-center py-4 px-10 bg-[#05050f]/60 backdrop-blur-md backdrop-saturate-[1.8] border-b border-white/[0.06]"
    >
      <Link
        href="/"
        className="flex items-center gap-2 text-[1.35rem] font-extrabold text-white no-underline tracking-[-0.02em]"
      >
        <span
          className="flex items-center justify-center w-[100px] h-[60px] rounded-[10px] ms-3"
          aria-hidden="true"
        >
          <Image
            src="/logo-removebg-preview.png"
            alt="logo"
            className="w-max h-full"
            width={100}
            height={60}
          />
        </span>
      </Link>

      <nav className="flex items-center gap-6">
        <Link
          href="/landingpage"
          className="text-white/60 text-[0.875rem] font-medium no-underline transition-colors duration-200 hover:text-white"
        >
          <span className="underline-animation">Home</span>
        </Link>
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="inline-flex items-center gap-[0.4rem] py-2 px-5 text-[0.8rem] font-semibold text-white bg-gradient-to-br from-[#a78bfa]/20 to-[#06b6d4]/20 border border-[#a78bfa]/30 rounded-full no-underline transition-all duration-300 tracking-[0.02em] hover:bg-gradient-to-br hover:from-[#a78bfa]/35 hover:to-[#06b6d4]/35 hover:border-[#a78bfa]/50 hover:shadow-[0_0_20px_rgba(167,139,250,0.15)] hover:-translate-y-px"
        >
          {isSignup ? "Log in" : "Create Account"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-label="img"
          >
            <path
              d={
                isSignup
                  ? "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
                  : "M5 12h14M12 5l7 7-7 7"
              }
            />
          </svg>
        </Link>
      </nav>
    </motion.header>
  );
};

export default LoginNavbar;
