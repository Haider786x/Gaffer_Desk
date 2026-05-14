import React from "react";

export const Select = React.forwardRef(
  (
    {
      label,
      error,
      helpText,
      options = [],
      className = "",
      containerClassName = "",
      grouped = false,
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

        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-3 py-2 rounded-lg appearance-none
              bg-zinc-900 border border-white/10
              text-zinc-100 text-xs
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-zinc-200 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? "border-red-400 focus:ring-red-400" : ""}
              ${className}
            `}
            {...props}
          >
            <option value="">Select an option</option>

            {grouped
              ? Object.entries(options).map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                ))
              : options.map((option) => (
                  <option
                    key={option.value || option}
                    value={option.value || option}
                  >
                    {option.label || option}
                  </option>
                ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {helpText && !error && <p className="text-xs text-zinc-500">{helpText}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
