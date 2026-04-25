"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Button from "../ui/button";
import Input from "../ui/Input";
import FormCard from "./FormCard";

const fieldVariant = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please provide email and password");
      return;
    }
    setLoading(true);
    try {
      // placeholder for real auth call
      await new Promise((r) => setTimeout(r, 800));
      alert(`Logged in (demo): ${email}`);
      router.push(next);
    } catch (err) {
      setError(`Login failed. Try again. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormCard title="Welcome back" subtitle="Sign in to your account">
      <div className="mb-4">
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 border border-border hover:shadow-md"
          >
            Sign in with Google
          </Button>
          <Button
            variant="ghost"
            className="flex-1 border border-border hover:shadow-md"
          >
            Sign in with GitHub
          </Button>
        </div>
        <div className="flex items-center my-3">
          <span className="flex-grow border-t border-border opacity-40"></span>
          <span className="mx-3 text-xs text-muted-foreground">or</span>
          <span className="flex-grow border-t border-border opacity-40"></span>
        </div>
      </div>

      <motion.form
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <motion.div variants={fieldVariant}>
          <label className="text-sm font-medium mb-1 block" htmlFor="email">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="transition-shadow focus:shadow-[0_10px_30px_rgba(99,102,241,0.08)]"
          />
        </motion.div>

        <motion.div variants={fieldVariant}>
          <label className="text-sm font-medium mb-1 block" htmlFor="password">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </motion.div>

        {error && (
          <motion.div variants={fieldVariant}>
            <p className="text-sm text-danger text-white">{error}</p>
          </motion.div>
        )}

        <motion.div variants={fieldVariant}>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full btn-glow"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </motion.div>

        <Link href={`/signup?next=${encodeURIComponent(next || "/")}`}>
          Don’t have an account? Sign up
        </Link>
      </motion.form>
    </FormCard>
  );
};

export default LoginForm;
