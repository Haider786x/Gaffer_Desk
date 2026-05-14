import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { TOAST_TYPES } from "../utils/constants.js";

const ToastContext = createContext();

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = TOAST_TYPES.INFO, duration = 4000) => {
      const id = toastId++;
      const newToast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast],
  );

  const success = useCallback(
    (message, duration) => showToast(message, TOAST_TYPES.SUCCESS, duration),
    [showToast],
  );

  const error = useCallback(
    (message, duration) => showToast(message, TOAST_TYPES.ERROR, duration),
    [showToast],
  );

  const info = useCallback(
    (message, duration) => showToast(message, TOAST_TYPES.INFO, duration),
    [showToast],
  );

  const warning = useCallback(
    (message, duration) => showToast(message, TOAST_TYPES.WARNING, duration),
    [showToast],
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
      success,
      error,
      info,
      warning,
    }),
    [toasts, showToast, removeToast, success, error, info, warning],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
