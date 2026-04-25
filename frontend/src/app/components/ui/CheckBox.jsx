const CheckBox = ({
  checked,
  disabled,
  children,
  className = "",
  ...props
}) => {
  return (
    <label
      className={`
                inline-flex
                items-center
                gap-2
                cursor-pointer
                select-none
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${className}    
            `}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />

      <span
        className="
                    flex
                    h-4
                    w-4
                    items-center
                    justify-center
                    rounded
                    border
                    border-border
                    bg-background
                    transition-colors
                    peer-checked:bg-primary
                    peer-checked:border-primary
                    peer-focus-visible:ring-2
                    peer-focus-visible:ring-ring
                    peer-focus-visible:ring-offset-2
                "
      >
        <svg
          className="h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
          strokeWidth={3}
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>

      {children && <span className="text-sm text-foreground">{children}</span>}
    </label>
  );
};

export default CheckBox;
