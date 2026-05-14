import React from "react";

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helpText,
      type = "text",
      className = "",
      containerClassName = "",
      ...props
    },
    ref,
  ) => {
    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
            {label}
          </label>
        )}

        <input
          ref={ref}
          type={type}
          className={`
            px-3 py-2 rounded-lg
            bg-zinc-900 border border-white/10
            text-zinc-100 placeholder-zinc-500 text-xs tabular-nums
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-zinc-200 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-400 focus:ring-red-400" : ""}
            ${className}
          `}
          {...props}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        {helpText && !error && <p className="text-xs text-zinc-500">{helpText}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
