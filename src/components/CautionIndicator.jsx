// src/components/CautionIndicator.jsx
//
// Ticket #436 — small shared presentational badge for the app's OWN computed
// weather cautions (never an official warning). Exact labels/icons are the
// owner's chosen product contract: warn -> CircleAlert, "Varúð vegna veðurs"
// / "Weather caution"; high -> TriangleAlert, "Erfiðar veðuraðstæður" /
// "Challenging weather conditions". No 🚨/⚠️ emoji — these own-assessment
// badges always render the chosen Lucide SVGs instead.
//
// The icon is always decorative (aria-hidden): the visible text next to it
// (and, where this is used inline in a table row, the row's own aria-label)
// carries the accessible meaning — never title-only.
import { CircleAlert, TriangleAlert } from "lucide-react";
import { cautionLevelLabel } from "../lib/cautionLabel";

export default function CautionIndicator({ level, t, reasons = [], className = "" }) {
  if (level !== "high" && level !== "warn") return null;

  const Icon = level === "high" ? TriangleAlert : CircleAlert;
  const label = cautionLevelLabel(level, t);
  const reasonText = Array.isArray(reasons) && reasons.length > 0 ? `: ${reasons.join(", ")}` : "";
  const tone = level === "high" ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300";

  return (
    <span className={`inline-flex items-start gap-1 ${tone} ${className}`}>
      <Icon aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
      <span>
        {label}
        {reasonText}
      </span>
    </span>
  );
}
