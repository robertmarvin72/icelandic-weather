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

// Ticket 414 (#414) — legend-only SHORT labels, distinct from the
// descriptive AURORA_BAND_LABEL_KEYS above (which stay in use for popups
// and lists, where the extra context is useful). Only the three bands the
// legend actually shows have a dedicated short key; auroraBandShortLabelKey
// falls back to the descriptive key for any other band, so the helper
// itself never invents copy nothing consumes.
export const AURORA_BAND_SHORT_LABEL_KEYS = {
  excellent: "nlLegendExcellent",
  good: "nlLegendGood",
  fair: "nlLegendFair",
};

// Ticket 414 (#414): excellent recolored to a visibly distinct purple so it
// is never mistaken for "good" on category-bearing surfaces (map markers,
// clusters, legend, status pill). good/fair/poor/very-poor are unchanged.
export const AURORA_BAND_COLORS = {
  excellent: "#a855f7",
  good: "#22c55e",
  fair: "#facc15",
  poor: "#f97316",
  "very-poor": "#b91c1c",
};

const DEFAULT_BAND = "fair";

export function auroraBandLabelKey(band) {
  return AURORA_BAND_LABEL_KEYS[band] || AURORA_BAND_LABEL_KEYS[DEFAULT_BAND];
}

export function auroraBandShortLabelKey(band) {
  return AURORA_BAND_SHORT_LABEL_KEYS[band] || auroraBandLabelKey(band);
}

export function auroraBandColor(band) {
  return AURORA_BAND_COLORS[band] || AURORA_BAND_COLORS[DEFAULT_BAND];
}
