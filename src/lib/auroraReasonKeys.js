// src/lib/auroraReasonKeys.js
//
// Shared canonical-reason -> translation-key map, used by both
// NorthernLightsCard.jsx (single-night) and AuroraNightOutlook.jsx
// (Ticket #423 Phase 2 multi-night) so the two surfaces can never drift on
// what a given canonical reason code is labeled.

export const AURORA_REASON_KEYS = {
  meaningful_activity: "nlReasonMeaningfulActivity",
  low_activity: "nlReasonLowActivity",
  clear_sky: "nlReasonClearSky",
  partial_cloud: "nlReasonPartialCloud",
  heavy_cloud: "nlReasonHeavyCloud",
  cloud_hard_cap_applied: "nlReasonCloudHardCap",
  precipitation_reduced_visibility: "nlReasonPrecipitation",
  moonlight_reduced_visibility: "nlReasonMoonlight",
};
