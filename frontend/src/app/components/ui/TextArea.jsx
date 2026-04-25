const TextArea = ({ rows = 4, className = "", ...props }) => {
  return (
    <div className="relative">
      <textarea
        rows={rows}
        className={`
          peer
          w-full
          resize-none
          rounded-md
          border
          border-border
          bg-background
          px-3
          py-2
          text-sm
          outline-none
          transition-colors
          placeholder:text-muted-foreground

          focus-visible:border-ring
          focus-visible:ring-2
          focus-visible:ring-ring
          focus-visible:ring-offset-2

          disabled:cursor-not-allowed
          disabled:opacity-50

          ${className}
        `}
        {...props}
      />

      {/* <span
        aria-hidden
        className="
          pointer-events-none
          absolute inset-0
          rounded-md
          ring-2 ring-ring
          opacity-0
          scale-95
          transition-all
          duration-200
          ease-out
          peer-focus-visible:opacity-100
          peer-focus-visible:scale-100
        "
      /> */}
    </div>
  );
};

export default TextArea;
