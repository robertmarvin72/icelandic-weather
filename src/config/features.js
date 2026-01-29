// src/config/features.js
// Single source of truth for Free/Pro/Preview gating.

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
