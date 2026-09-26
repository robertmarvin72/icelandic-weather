// src/lib/auroraNightIndicator.js
//
// Ticket #423 Phase 2 (Round 5) — pure per-night coarse overview for the
// selector: which visible localized outlook text and accent color a night's
// tab shows. Text is the primary signal (color alone is not accessible);
// the accent dot is decorative. Reuses the canonical band/visual-state
// helpers unchanged — never re-scores, and never leaks a location name,
// coordinate, or ranking (only the canonical band of the best result).
//
// Excellent keeps its own #414 pill text and purple accent — it is never
// collapsed into the generic "good" indicator.

import { auroraVisualState, auroraVisualStateTokens, AURORA_VISUAL_STATES } from "./auroraVisualState";

const KNOWN_BANDS = new Set(["excellent", "good", "fair", "poor", "very-poor"]);

/**
 * @returns {{ kind: string, textKey: string, dotClass: string, band: string|null }}
 *   kind: "loading" | "result" | "no_darkness" | "expired" | "unavailable"
 */
export function auroraNightOverview({ status, classification }) {
  const neutral = auroraVisualStateTokens(undefined);

  if (status !== "resolved" || !classification) {
    return { kind: "loading", textKey: "nlTabLoading", dotClass: neutral.accentBarClass, band: null };
  }

  if (classification.expired) {
    return { kind: "expired", textKey: "nlTabExpired", dotClass: neutral.accentBarClass, band: null };
  }

  const primary = classification.primary;
  if (primary === "success" || primary === "partial") {
    const band = classification.body?.best?.band;
    if (KNOWN_BANDS.has(band)) {
      const tokens = auroraVisualStateTokens(band);
      const isPoor = auroraVisualState(band) === AURORA_VISUAL_STATES.POOR;
      return { kind: "result", textKey: isPoor ? "nlMultiPillPoor" : tokens.pillKey, dotClass: tokens.accentBarClass, band };
    }
  }

  if (primary === "no_darkness") {
    return { kind: "no_darkness", textKey: "nlTabNoDarkness", dotClass: neutral.accentBarClass, band: null };
  }

  return { kind: "unavailable", textKey: "nlPillNeutral", dotClass: neutral.accentBarClass, band: null };
}
