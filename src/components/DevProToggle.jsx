// src/components/DevProToggle.jsx
import React from "react";

export default function DevProToggle({ devPro, onToggleDevPro }) {
  // Only show in dev to avoid “oops I shipped God Mode”
  if (import.meta.env.MODE !== "development") return null;

  const base =
    "px-3 py-2 rounded-xl border shadow-sm focus-ring smooth text-sm inline-flex items-center gap-2 whitespace-nowrap";
  const on = "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500";
  const off =
    "bg-white border-slate-300 text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100";

  return (
    <button
      type="button"
      onClick={onToggleDevPro}
      className={`${base} ${devPro ? on : off}`}
      title="Dev only: toggle Pro"
      aria-pressed={devPro}
    >
      <span aria-hidden>{devPro ? "✅" : "🧪"}</span>
      <span>Dev Pro: {devPro ? "ON" : "OFF"}</span>
    </button>
  );
}
