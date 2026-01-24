// src/components/UpgradeHint.jsx
import React from "react";

export default function UpgradeHint({
  title = "Pro feature",
  text,
  actionLabel = "Upgrade",
  hintLines = [],
}) {
  // console.log("hintLines:", hintLines);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-3">
      <div className="text-sm font-semibold">{title}</div>

      {text && <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{text}</div>}

      {Array.isArray(hintLines) && hintLines.length > 0 && (
        <div className="mt-3 space-y-2">
          {hintLines.map((h, idx) => (
            <div
              key={`${h.label}-${idx}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/30 px-2 py-1.5"
            >
              <span className="text-base leading-none">{h.icon}</span>

              <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {h.label}
              </span>

              <span className="ml-auto text-sm text-slate-700 dark:text-slate-200">{h.value}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => alert("Upgrade flow comes later 🙂")}
        className="mt-3 inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        {actionLabel}
      </button>
    </div>
  );
}
