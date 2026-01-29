// src/components/RequireFeature.jsx

// NOTE:
// This is the ONLY supported feature-gating mechanism.
// Do NOT introduce RequirePro / isPro checks elsewhere.

import { isFeatureAvailable } from "../config/features";

export default function RequireFeature({ feature, entitlements, children, fallback }) {
  const gate = isFeatureAvailable(feature, entitlements);

  if (gate.available) return children;

  // Preview-only: show children but in “locked/teaser” mode (you decide how)
  if (gate.preview) {
    return fallback ?? children; // e.g. show blurred/disabled UI + Pro badge
  }

  return fallback ?? null;
}
