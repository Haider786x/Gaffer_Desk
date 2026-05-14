import { useEffect } from "react";
import { useToast } from "../../context/ToastContext.jsx";

const ToastItem = ({ id, message, type, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, onRemove]);

  const bgColors = {
    success: "bg-green-900 border-green-700",
    error: "bg-red-900 border-red-700",
    warning: "bg-yellow-900 border-yellow-700",
    info: "bg-blue-900 border-blue-700",
  };

  const textColors = {
    success: "text-green-200",
    error: "text-red-200",
    warning: "text-yellow-200",
    info: "text-blue-200",
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border
        ${bgColors[type]} ${textColors[type]}
        animate-slide-in
      `}
    >
      {type === "success" && (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {type === "error" && (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="ml-auto hover:opacity-70 transition-opacity"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};
