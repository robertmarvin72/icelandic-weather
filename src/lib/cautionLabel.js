// src/lib/cautionLabel.js
//
// Ticket #436 — the own-assessment caution level label, shared by
// CautionIndicator.jsx and any row-level aria-label text that needs the
// same plain words without importing the component itself.
export function cautionLevelLabel(level, t) {
  if (level === "high") return t?.("routeWarningHigh") || "Challenging weather conditions";
  if (level === "warn") return t?.("routeWarning") || "Weather caution";
  return "";
}
