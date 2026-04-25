import { cn } from "@/lib/cn";

const Button = ({
  children,
  variant = "primary",
  cursor = "pointer",
  size = "md",
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors transition-transform duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",

        {
          "bg-primary text-primary-foreground hover:opacity-80":
            variant === "primary",

          "bg-secondary text-secondary-foreground hover:opacity-80":
            variant === "secondary",

          "bg-transparent text-foreground hover:opacity-80 hover:bg-primary hover:text-primary-foreground":
            variant === "ghost",

          "bg-danger text-danger-foreground hover:opacity-80":
            variant === "danger",
        },

        {
          "h-9 px-3 rounded-sm text-sm": size === "sm",
          "h-10 px-4 rounded-md text-base": size === "md",
          "h-11 px-6 rounded-lg text-lg": size === "lg",
        },

        className,
        {
          "cursor-pointer": cursor === "pointer",
          "cursor-default": cursor === "default",
        },
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
