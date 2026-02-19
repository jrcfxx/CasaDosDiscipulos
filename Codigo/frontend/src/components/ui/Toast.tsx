import React, { useEffect } from "react";
import "./Toast.css";

export interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  variant?: "success" | "error" | "info";
}

const Toast: React.FC<ToastProps> = ({
  message,
  onClose,
  duration = 3000,
  variant = "info",
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      className={`toast-toast toast-toast-${variant}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

export default Toast;
