// src/lib/auroraVisualState.js
//
// Ticket 398 (issue #398) — pure presentation helper grouping canonical
// Aurora bands into a small visual-state model (good/fair/poor/neutral) so
// NorthernLightsCard.jsx doesn't scatter band-to-tone/headline decisions
// through JSX. This is a DISPLAY-ONLY grouping: it never changes the
// canonical band itself, list eligibility, map behavior, analytics band, or
// scoring semantics — those all keep reading the precise canonical band via
// auroraBandPresentation.js / auroraDisplaySelection.js unchanged.
//
// Deliberately independent of auroraBandPresentation.js's DEFAULT_BAND
// fallback: an unknown/missing band here becomes its own explicit "neutral"
// visual state, never silently inherited as "fair" (approved prompt §4).

export const AURORA_VISUAL_STATES = {
  GOOD: "good",
  FAIR: "fair",
  POOR: "poor",
  NEUTRAL: "neutral",
};

const BAND_TO_VISUAL_STATE = {
  excellent: AURORA_VISUAL_STATES.GOOD,
  good: AURORA_VISUAL_STATES.GOOD,
  fair: AURORA_VISUAL_STATES.FAIR,
  poor: AURORA_VISUAL_STATES.POOR,
  "very-poor": AURORA_VISUAL_STATES.POOR,
};

export function auroraVisualState(band) {
  return BAND_TO_VISUAL_STATE[band] ?? AURORA_VISUAL_STATES.NEUTRAL;
}

// Styling/copy tokens per visual state. Translation KEYS only — no copy
// lives here (src/i18n/translations.northernLights.js owns the actual
// strings). `showCta` documents whether a truthful primary action exists
// for that state at all (poor/neutral still show the details toggle when
// bestAvailable/isPro allow it — see NorthernLightsCard.jsx — this table
// only governs pill/headline/body/accent selection).
export const AURORA_VISUAL_STATE_TOKENS = {
  [AURORA_VISUAL_STATES.GOOD]: {
    pillKey: "nlPillGood",
    headlineKey: "nlHeadlineGood",
    bodyKey: "nlBodyGood",
    pillClass:
      "bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/40",
    accentGlowClass: "bg-emerald-400/25",
    accentBarClass: "bg-emerald-400",
  },
  [AURORA_VISUAL_STATES.FAIR]: {
    pillKey: "nlPillFair",
    headlineKey: "nlHeadlineFair",
    bodyKey: "nlBodyFair",
    pillClass:
      "bg-amber-400/15 text-amber-200 ring-1 ring-inset ring-amber-400/40",
    accentGlowClass: "bg-amber-400/20",
    accentBarClass: "bg-amber-400",
  },
  [AURORA_VISUAL_STATES.POOR]: {
    pillKey: "nlPillPoor",
    headlineKey: "nlHeadlinePoor",
    bodyKey: "nlBodyPoor",
    pillClass:
      "bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-400/30",
    accentGlowClass: "bg-slate-500/10",
    accentBarClass: "bg-slate-500",
  },
  [AURORA_VISUAL_STATES.NEUTRAL]: {
    pillKey: "nlPillNeutral",
    headlineKey: "nlHeadlineNeutral",
    bodyKey: "nlBodyNeutral",
    pillClass:
      "bg-slate-600/20 text-slate-300 ring-1 ring-inset ring-slate-500/30",
    accentGlowClass: "bg-slate-600/10",
    accentBarClass: "bg-slate-600",
  },
};

// Ticket 414 (#414) — narrow canonical-band presentation override. GOOD's
// grouping (`auroraVisualState("excellent") === GOOD`, above) is
// deliberately UNCHANGED: CTA-key selection, headline/body copy, and every
// other behavior keyed off the visual state keep treating excellent as
// GOOD. Only the status PILL — and the accent glow/bar that share its
// color language — get an accurate, visibly distinct purple/"excellent"
// treatment, so an excellent result no longer wears a "Good conditions"
// badge. Never applied to headlineKey/bodyKey, which stay GOOD's.
const EXCELLENT_PILL_OVERRIDE = {
  pillKey: "nlPillExcellent",
  pillClass: "bg-purple-400/15 text-purple-200 ring-1 ring-inset ring-purple-400/40",
  accentGlowClass: "bg-purple-400/25",
  accentBarClass: "bg-purple-400",
};

export function auroraVisualStateTokens(band) {
  const tokens = AURORA_VISUAL_STATE_TOKENS[auroraVisualState(band)];
  return band === "excellent" ? { ...tokens, ...EXCELLENT_PILL_OVERRIDE } : tokens;
}
