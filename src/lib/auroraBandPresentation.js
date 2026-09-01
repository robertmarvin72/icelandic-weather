// src/lib/auroraBandPresentation.js
//
// Single source of truth mapping a canonical Ticket 2/3 Aurora band to its
// presentation (translation key + marker color), shared by
// NorthernLightsCard.jsx (text) and MapView.jsx's Aurora mode (markers) —
// so every Aurora label/color/marker in the UI describes the same
// dimension and can never independently diverge (approved prompt §6:
// "every Aurora label/color/map marker describes the same Aurora
// dimension").

export const AURORA_BAND_LABEL_KEYS = {
  excellent: "nlBandExcellent",
  good: "nlBandGood",
  fair: "nlBandFair",
  poor: "nlBandPoor",
  "very-poor": "nlBandVeryPoor",
};

// Deliberately distinct from MapView's generic weekly-score palette
// (colorForScore) — this is a five-step Aurora scale, not a three-step
// generic weather scale, and must never be confused with it.
export const AURORA_BAND_COLORS = {
  excellent: "#16a34a",
  good: "#22c55e",
  fair: "#facc15",
  poor: "#f97316",
  "very-poor": "#b91c1c",
};

const DEFAULT_BAND = "fair";

export function auroraBandLabelKey(band) {
  return AURORA_BAND_LABEL_KEYS[band] || AURORA_BAND_LABEL_KEYS[DEFAULT_BAND];
}

export function auroraBandColor(band) {
  return AURORA_BAND_COLORS[band] || AURORA_BAND_COLORS[DEFAULT_BAND];
}
