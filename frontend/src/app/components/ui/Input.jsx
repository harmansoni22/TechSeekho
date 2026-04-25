const Input = ({
  type = "text",
  className = "",
  leadingIcon = null,
  trailingIcon = null,
  ...props
}) => {
  return (
    <div className="relative">
      {leadingIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {leadingIcon}
        </span>
      )}
      <input
        type={type}
        className={
          `peer w-full rounded-md border border-border bg-background text-sm outline-none transition-colors transition-all duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}` +
          (leadingIcon ? " pl-10" : "") +
          (trailingIcon ? " pr-10" : "")
        }
        {...props}
      />

      {trailingIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {trailingIcon}
        </span>
      )}
    </div>
  );
};

export default Input;
