// src/hooks/useToast.js
import { useCallback, useRef, useState } from "react";

/**
 * Minimal toast system (no external deps).
 * - pushToast({ type, message, durationMs, actionLabel, onAction })
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    const id = idRef.current++;
    const {
      type = "info",
      message = "",
      durationMs = 4500,
      actionLabel,
      onAction,
    } = toast || {};

    const next = { id, type, message, durationMs, actionLabel, onAction };
    setToasts((prev) => [...prev, next]);
    return id;
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  return { toasts, pushToast, dismissToast, clearToasts };
}
