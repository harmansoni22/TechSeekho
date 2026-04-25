import { cn } from "@/lib/cn";

const Card = ({
  children,
  variant = "default",
  padding = "md",
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-lg border-border border bg-background text-foreground shadow-sm cursor-default select-none",

        {
          "bg-background": variant === "default",
          "bg-secondary": variant === "secondary",
        },

        {
          "p-3": padding === "sm",
          "p-4": padding === "md",
          "p-6": padding === "lg",
        },

        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
