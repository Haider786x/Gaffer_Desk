import { forwardRef } from "react";

export const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      disabled = false,
      isLoading = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "font-medium rounded-md transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

    const sizes = {
      sm: "px-2.5 py-1.5 text-xs",
      md: "px-3 py-2 text-xs",
      lg: "px-4 py-2.5 text-sm",
    };

    const variants = {
      primary:
        "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 focus-visible:outline-zinc-200",
      secondary:
        "bg-zinc-900 border border-white/10 text-zinc-100 hover:bg-zinc-800 focus-visible:outline-zinc-200",
      destructive:
        "bg-transparent text-red-400 border border-red-500/50 hover:bg-red-950/30 hover:border-red-500 focus-visible:outline-red-400",
    };

    const classes = `${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
