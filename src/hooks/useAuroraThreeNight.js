// src/hooks/useAuroraThreeNight.js
//
// Ticket #423 Phase 2 — owns exactly three fixed useAuroraDecision call
// sites (today + 0/1/2 calendar days), unconditionally on every render
// (Rules of Hooks — never inside a loop/condition). Adapts each of the
// three existing responses into a per-slot {date, daysAhead, status,
// classification} shape; never fabricates auroraActivity/updatedAt/score/
// viewingWindow fields the response doesn't actually carry.
//
// Identity safety (approved-prompt-v4.md §3): useAuroraDecision's own
// keyRef already discards a completion once its identity has moved on, but
// it does NOT synchronously flip `status` back to "loading" the instant the
// `evening` prop changes — that happens one render later, inside its own
// effect. For the one render in between (right after a midnight rollover
// changes slotDates), this hook would otherwise show the PREVIOUS evening's
// still-"resolved" outcome under the NEW date. Guarded here by comparing
// the response body's own `evening` field against the requested date — an
// additional guard beyond keyRef, exactly as approved-prompt-v4.md §3 asks
// for ("match success bodies to requested evening as an additional guard").

import { useEffect, useMemo, useState } from "react";
import { useAuroraDecision } from "./useAuroraDecision";
import { classifyAuroraOutcome } from "../lib/auroraDecisionClassify";
import { buildThreeEveningSlotDates } from "../lib/auroraNightSlots";
import { applyClientFreshness, nextFreshnessBoundaries } from "../lib/auroraFreshnessPolicy";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";

function msUntilNextUtcMidnight(date) {
  const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0);
  return Math.max(1000, next - date.getTime());
}

export function useAuroraThreeNight({ enabled, fetchImpl, now = () => new Date() }) {
  const [baseNow, setBaseNow] = useState(() => now());
  const slotDates = useMemo(() => buildThreeEveningSlotDates(baseNow), [baseNow]);

  const [selectedDate, setSelectedDate] = useState(slotDates[0].date);

  // Preserve the selected calendar date across a rollover if it's still in
  // the new 3-night window; otherwise reset to tonight. No periodic
  // polling — this only reacts to the window itself changing.
  useEffect(() => {
    if (!slotDates.some((s) => s.date === selectedDate)) {
      setSelectedDate(slotDates[0].date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotDates]);

  // Bumped to force a re-render (and therefore a fresh age computation)
  // without any request: on visibility return and at freshness boundaries.
  const [ageTick, setAgeTick] = useState(0);

  // Bounded next-midnight timer, plus a visibility-return safety net for
  // backgrounded/throttled tabs whose timer may not have fired exactly at
  // midnight. Recomputing while the calendar date hasn't actually changed
  // produces string-identical slotDates, so no extra request is issued.
  useEffect(() => {
    const timer = setTimeout(() => setBaseNow(now()), msUntilNextUtcMidnight(baseNow));
    function onVisibility() {
      if (document.visibilityState === "visible") {
        setBaseNow(now());
        setAgeTick((n) => n + 1);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseNow]);

  // Exactly three fixed call sites — legal under Rules of Hooks (call count
  // is always 3, never conditional/looped).
  const hook0 = useAuroraDecision({ enabled, evening: slotDates[0].date, locationIds: AURORA_CANDIDATE_LOCATION_IDS, fetchImpl });
  const hook1 = useAuroraDecision({ enabled, evening: slotDates[1].date, locationIds: AURORA_CANDIDATE_LOCATION_IDS, fetchImpl });
  const hook2 = useAuroraDecision({ enabled, evening: slotDates[2].date, locationIds: AURORA_CANDIDATE_LOCATION_IDS, fetchImpl });
  const hookSlots = [hook0, hook1, hook2];

  // Age is always derived from the actual current time at render — a result
  // that was fresh when fetched is never presented as fresh (or compared)
  // after the browser stayed open past the existing 480/1440-minute policy.
  const nowMs = now().getTime();

  const slots = slotDates.map((d, i) => {
    const h = hookSlots[i];
    const rawClassification = h.status === "resolved" ? classifyAuroraOutcome(h.outcome) : null;
    const identityMatched = !rawClassification?.body || rawClassification.body.evening === d.date;
    const classification = identityMatched ? applyClientFreshness(rawClassification, nowMs) : null;

    return {
      date: d.date,
      daysAhead: d.daysAhead,
      status: identityMatched ? h.status : "loading",
      classification,
      retry: h.retry,
      requestKey: h.requestKey,
    };
  });

  // One bounded timer at the next freshness boundary across all resolved
  // results (cleaned up on change/unmount). No provider polling, no refresh
  // loop — it only forces a re-render so age is re-derived.
  const boundaryKey = hookSlots
    .map((h) => (h.status === "resolved" ? h.outcome?.body?.auroraCache?.sourceFetchedAt ?? "" : ""))
    .join("|");
  useEffect(() => {
    const current = now().getTime();
    const boundaries = boundaryKey.split("|").flatMap((ts) => (ts ? nextFreshnessBoundaries(ts, current) : []));
    if (boundaries.length === 0) return undefined;
    const delay = Math.min(Math.min(...boundaries) - current, 2147483647);
    const timer = setTimeout(() => setAgeTick((n) => n + 1), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundaryKey, ageTick]);

  return { slots, selectedDate, setSelectedDate, nowMs };
}
