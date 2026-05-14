import { useEffect } from "react";

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className = "",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`
          relative bg-zinc-900 rounded-lg border border-white/10
          max-h-[90vh] overflow-y-auto
          ${sizeClasses[size]} w-full mx-4
          ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-sm font-semibold tracking-tight tabular-nums text-zinc-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-200 transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="p-4">{children}</div>

        {footer && (
          <div className="flex gap-2 p-4 border-t border-white/10 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
