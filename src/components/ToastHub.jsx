// src/components/ToastHub.jsx
import React, { useEffect } from "react";

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast?.durationMs || toast.durationMs <= 0) return;
    const t = setTimeout(() => onDismiss(toast.id), toast.durationMs);
    return () => clearTimeout(t);
  }, [toast?.id, toast?.durationMs, onDismiss]);

  const base =
    "pointer-events-auto w-[min(420px,calc(100vw-2rem))] rounded-xl border shadow-lg px-4 py-3 text-sm";
  const variants = {
    info: "bg-white border-slate-200 text-slate-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
  };

  return (
    <div className={base + " " + (variants[toast.type] || variants.info)}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="whitespace-pre-wrap leading-snug">{toast.message}</div>
          {toast.actionLabel && typeof toast.onAction === "function" && (
            <button
              type="button"
              onClick={() => {
                toast.onAction();
                onDismiss(toast.id);
              }}
              className="mt-2 inline-flex items-center rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold hover:bg-slate-50"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function ToastHub({ toasts, onDismiss }) {
  if (!toasts?.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
