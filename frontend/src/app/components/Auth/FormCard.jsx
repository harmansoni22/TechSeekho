"use client";

import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export default function FormCard({
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ y: -6 }}
      className={`max-w-md w-full bg-background/70 backdrop-blur-md rounded-2xl p-8 mx-auto shadow-xl border border-border relative overflow-hidden ${className}`}
    >
      <div className="card-accent" aria-hidden />
      <div className="mb-6 text-center">
        {title && <h2 className="text-2xl font-semibold">{title}</h2>}
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div>{children}</div>
    </motion.div>
  );
}
