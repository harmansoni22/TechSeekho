const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-muted text-foreground",
    muted: "bg-muted/50 text-muted-foreground",
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
    glass:
      "border border-white/15 bg-[linear-gradient(140deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))] text-white/80 backdrop-blur-sm",
  };

  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        rounded-full
        text-xs font-medium
        cursor-default
        ${variants[variant]}
        ${className}
      `}
      style={{
        userSelect: "none",
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
