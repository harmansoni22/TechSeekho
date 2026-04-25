const Switch = ({
  defaultChecked = false,
  disabled,
  className = "",
  ...props
}) => {
  return (
    <label
      className={`
                relative
                inline-flex
                items-center
                cursor-pointer
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${className}
            `}
    >
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />

      <span
        className="
                    h-5
                    w-9
                    rounded-full
                    bg-[#888]
                    transition-color
                    peer-checked:bg-primary
                    peer-focus-visible:ring-2
                    peer-focus-visible:ring-ring
                    peer-focus-visible:ring-offset-2
                "
      />

      <span
        className="
                    absolute left-0.5 top-0.5
                    h-4 w-4
                    rounded-full
                    bg-background
                    transition-transform
                    peer-checked:translate-x-4
                "
      />
    </label>
  );
};

export default Switch;
