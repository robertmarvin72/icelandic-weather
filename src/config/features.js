// src/config/features.js
// Single source of truth for Free/Pro/Preview gating.

// Ticket #431 — named business-model-experiment id, analytics-only (carried
// as `business_model_experiment` on the relevant Northern Lights events).
// Not an entitlement value and not read by isFeatureAvailable itself.
export const NL_FREE_EXPERIMENT_ID = "northern_lights_free_v1";

export const FEATURES = {
  // 1) Forecast table days (I recommend keeping 7 for both; Pro value comes from overlays/features)
  forecastDays: { type: "limit", free: 7, pro: 7, label: "Forecast days" },

  // 2) Top campsites list length (Free sees Top 3, Pro sees Top 5)
  topSitesCount: { type: "limit", free: 3, pro: 5, label: "Top campsites list length" },

  // 3) Wind direction + shelter index (Pro-only, but can be teased in UI)
  windDirection: { tier: "pro", preview: true, label: "Wind direction" },
  shelterIndex: { tier: "pro", preview: true, label: "Shelter index" },

  // 4) Best route planner (Pro-only, teaser allowed)
  bestRoutePlanner: { tier: "pro", preview: true, label: "Best route planner" },

  // 5) Campsite comparison (Pro-only, locked card shown to free users)
  campsiteComparison: { tier: "pro", preview: false, label: "Campsite comparison" },

  // 5) Weather Finder results count (Free sees top 3, Pro sees all)
  weatherFinderResultsCount: { type: "limit", free: 3, pro: 999, label: "Weather Finder results" },

  // 6) Northern Lights decision card (#392) — presentation-only gate.
  // Ticket #431: opened to Free for the "northern_lights_free_v1" business
  // model experiment. `tier: "pro"` is left in place as the feature's real
  // entitlement model (so rollback is a one-line flip of
  // `freeDuringExperiment`, not a re-add of the tier gate); while the
  // experiment runs, `freeDuringExperiment` unconditionally grants access —
  // including to anonymous/not-yet-resolved entitlements — without touching
  // getUserTier/entitlements or any other feature's gate. The underlying
  // /api/aurora-decision request/response remains identical for every tier.
  // See docs/ai/tasks/ticket-431/experiment-note.md.
  northernLights: {
    tier: "pro",
    preview: true,
    label: "Northern Lights",
    freeDuringExperiment: true,
    experimentId: NL_FREE_EXPERIMENT_ID,
  },
};

export const TIERS = {
  FREE: "free",
  PRO: "pro",
};

// --- helpers (used everywhere) ---
export function getUserTier(entitlements) {
  // Keep this tiny and deterministic; entitlements source can evolve.
  return entitlements?.isPro ? TIERS.PRO : TIERS.FREE;
}

export function isFeatureAvailable(featureKey, entitlements) {
  const def = FEATURES[featureKey];
  if (!def) return { available: false, preview: false, reason: "unknown_feature" };

  const tier = getUserTier(entitlements);

  // limit-type features are "available" by definition, but with a limit.
  if (def.type === "limit") {
    return { available: true, preview: false, reason: "limit_feature" };
  }

  if (def.tier === "pro" && tier !== TIERS.PRO) {
    if (def.freeDuringExperiment) {
      return { available: true, preview: false, reason: "experiment_free", experimentId: def.experimentId };
    }
    return { available: false, preview: !!def.preview, reason: "requires_pro" };
  }

  return { available: true, preview: false, reason: "ok" };
}

export function getFeatureLimit(featureKey, entitlements) {
  const def = FEATURES[featureKey];
  if (!def || def.type !== "limit") return null;

  const tier = getUserTier(entitlements);
  return tier === TIERS.PRO ? def.pro : def.free;
}

export function getFeatureMeta(featureKey) {
  return FEATURES[featureKey] ?? null;
}
