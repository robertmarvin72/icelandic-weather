// src/lib/auroraMultiNightPolicy.js
//
// Ticket #423 Phase 2 — pure cross-night comparison policy. Consumes
// already-classified per-night responses (src/lib/auroraDecisionClassify.js)
// unchanged: never re-scores, re-ranks, mutates canonical bands, or touches
// weather input. Implements approved-prompt-v4.md §4's precedence exactly
// (rules 1-7), and the accepted Phase 1 audit's nine decision-table
// examples remain this function's acceptance cases.
//
// "Within-night usability" (does this night have its own outlook to show)
// is always independent of "cross-night comparison eligibility" (can 2+
// nights be reliably compared against each other) — every caller must keep
// both, never collapse one into the other.

const KNOWN_BANDS = new Set(["excellent", "good", "fair", "poor", "very-poor"]);
const POOR_OR_WORSE = new Set(["poor", "very-poor"]);
const NEAR_TIE_TOLERANCE = 5; // owner-approved, presentation-only (approved-prompt-v4.md, no scoring change)

function isValidTimestamp(value) {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function setEquals(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

function annotateSlot(slot, configuredSet) {
  const isPending = slot.status !== "resolved";
  if (isPending) {
    return { ...slot, isPending: true, usable: false };
  }

  const classification = slot.classification;
  const primary = classification?.primary;
  const body = classification?.body ?? null;
  const best = body?.best ?? null;
  const bandKnown = best && KNOWN_BANDS.has(best.band);
  const scoreFinite = best && Number.isFinite(best.score);

  const usable = (primary === "success" || primary === "partial") && !!best && !!bandKnown && !!scoreFinite;

  if (!usable) {
    return { ...slot, isPending: false, usable: false, primary };
  }

  const excludedCount = Array.isArray(body.excluded) ? body.excluded.length : null;
  const scoredIdList = [best.locationId, ...(Array.isArray(body.alternatives) ? body.alternatives : []).map((a) => a?.locationId)];
  const scoredIds = new Set(scoredIdList);
  const sourceFetchedAt = body.auroraCache?.sourceFetchedAt ?? null;
  // Set equality alone would accept a duplicated ID whenever every expected
  // ID is also present, so the raw list length must match the set size too.
  const noDuplicates = scoredIdList.length === scoredIds.size;
  const complete = primary === "success" && excludedCount === 0 && noDuplicates && setEquals(scoredIds, configuredSet);

  return {
    ...slot,
    isPending: false,
    usable: true,
    primary,
    best,
    sourceFetchedAt,
    validTimestamp: isValidTimestamp(sourceFetchedAt),
    complete,
  };
}

/**
 * @param {object} params
 * @param {Array<{date: string, daysAhead: number, status: string, classification: object|null}>} params.slots
 *   Exactly 3 slots (today+0/1/2), each mirroring one useAuroraDecision instance's
 *   {status, classification} — classification is classifyAuroraOutcome(outcome)'s
 *   result, or null while status !== "resolved".
 * @param {Array<string>} params.configuredLocationIds - the canonical candidate roster
 *   (AURORA_CANDIDATE_LOCATION_IDS), used to verify comparison-eligibility completeness.
 * @returns {{
 *   state: "pending"|"zero_usable"|"sole_available"|"ineligible"|"eligible",
 *   slots: Array<object>,          // annotated per-slot facts (within-night usability)
 *   comparison: object|null,       // cross-night conclusion, shape depends on state
 * }}
 */
export function classifyMultiNightComparison({ slots, configuredLocationIds }) {
  const configuredSet = new Set(configuredLocationIds);
  const annotated = slots.map((s) => annotateSlot(s, configuredSet));

  // Rule 1: any pending slot always wins over any final conclusion, even
  // when the other slots have already resolved.
  if (annotated.some((s) => s.isPending)) {
    return { state: "pending", slots: annotated, comparison: null };
  }

  const usableSlots = annotated.filter((s) => s.usable);

  // Rule 2: all resolved, zero usable scored nights.
  if (usableSlots.length === 0) {
    return { state: "zero_usable", slots: annotated, comparison: null };
  }

  // Rule 3: exactly one usable scored night — its outlook only, no winner.
  if (usableSlots.length === 1) {
    return {
      state: "sole_available",
      slots: annotated,
      comparison: { soleDate: usableSlots[0].date, soleDaysAhead: usableSlots[0].daysAhead },
    };
  }

  // Rule 4: 2+ usable nights — eligibility requires equal non-null valid
  // sourceFetchedAt AND the complete configured candidate set in every
  // usable night (never inferred from matching timestamps alone).
  const allTimestampsValid = usableSlots.every((s) => s.validTimestamp);
  const allTimestampsEqual = allTimestampsValid && usableSlots.every((s) => s.sourceFetchedAt === usableSlots[0].sourceFetchedAt);
  const allComplete = usableSlots.every((s) => s.complete);
  const eligible = allTimestampsEqual && allComplete;

  if (!eligible) {
    let reason;
    if (!allTimestampsValid || !allTimestampsEqual) reason = allComplete ? "timestamp_mismatch" : "timestamp_and_candidates";
    else reason = "incomplete_candidates";
    return {
      state: "ineligible",
      slots: annotated,
      comparison: { reason, usableDates: usableSlots.map((s) => s.date) },
    };
  }

  // Eligible — usableSlots are all mutually comparable now.
  const scopedToAvailable = usableSlots.length < 3;

  // Rule 6a: literally all three requested nights, eligible, every one very-poor.
  if (usableSlots.length === 3 && usableSlots.every((s) => s.best.band === "very-poor")) {
    return {
      state: "eligible",
      slots: annotated,
      comparison: { kind: "all_three_low_chance", dates: usableSlots.map((s) => ({ date: s.date, daysAhead: s.daysAhead })) },
    };
  }

  // Rule 6b: every eligible night poor/very-poor (2 nights, or 3 mixed poor/very-poor) — no favorable conditions.
  if (usableSlots.every((s) => POOR_OR_WORSE.has(s.best.band))) {
    return {
      state: "eligible",
      slots: annotated,
      comparison: {
        kind: "no_favorable",
        scopedToAvailable,
        dates: usableSlots.map((s) => ({ date: s.date, daysAhead: s.daysAhead })),
      },
    };
  }

  // Rule 7: at least one eligible night is fair+. Top-score group is
  // compared against the maximum only (never transitive pairwise chaining).
  const maxScore = Math.max(...usableSlots.map((s) => s.best.score));
  const topGroup = usableSlots
    .filter((s) => maxScore - s.best.score <= NEAR_TIE_TOLERANCE)
    .map((s) => ({ date: s.date, daysAhead: s.daysAhead, score: s.best.score, band: s.best.band }));

  if (topGroup.length > 1) {
    const isExactTie = topGroup.every((entry) => entry.score === maxScore);
    return {
      state: "eligible",
      slots: annotated,
      comparison: { kind: "similar", scopedToAvailable, isExactTie, group: topGroup },
    };
  }

  return {
    state: "eligible",
    slots: annotated,
    comparison: { kind: "best_night", scopedToAvailable, date: topGroup[0].date, daysAhead: topGroup[0].daysAhead, band: topGroup[0].band, score: topGroup[0].score },
  };
}

export const AURORA_NEAR_TIE_TOLERANCE = NEAR_TIE_TOLERANCE;
