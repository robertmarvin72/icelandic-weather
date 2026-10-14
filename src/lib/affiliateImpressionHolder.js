// src/lib/affiliateImpressionHolder.js
//
// Ticket #430 — "once per placement per route visit" dedup contract for the
// affiliate_offer_viewed impression event. Deliberately a plain mutable
// object, not React state: consuming it must never trigger a render, and
// the guard must be synchronous so two overlapping IntersectionObserver
// callbacks (including a StrictMode double effect invocation) cannot both
// win the same opportunity.
//
// Ownership: the OWNING surface (App.jsx's IcelandCampingWeatherApp, ABOVE
// its showCampsitesGate conditional; NorthernLightsLanding for its own
// route mount) creates exactly one holder per visit and passes
// `{ visitId, tryConsume }` down through a narrow prop. The CTA/module never
// creates its own holder — see the C2(a) "no component-local fallback"
// requirement: a local fallback would reintroduce the remount double-count
// this holder exists to prevent (the campsites gate, tier/login/logout and
// query changes can all remount the CTA without the route actually
// changing).
//
// A visit is identified by an opaque string the owner mints (for App, see
// the pathname+sequence token built in App.jsx; for Landing, a token minted
// once per mount is enough since the route component itself only mounts on
// a genuine route entry). `tryConsume` only succeeds for the exact visitId
// that was current when the holder's owner last called `startVisit` — a
// captured visitId from BEFORE a visit change always fails, so an obsolete
// observer callback (attached before the route changed) can never consume a
// new visit's opportunity, even if its cleanup has not run yet.
export function createAffiliateImpressionHolder() {
  let currentVisitId = null;
  const consumedKeys = new Set();

  return {
    /** Begin a new visit. Idempotent for the same id (no-op if unchanged). */
    startVisit(visitId) {
      if (visitId === currentVisitId) return;
      currentVisitId = visitId;
      // Consumed keys are intentionally NOT cleared: each key already
      // embeds its visitId, so a stale visit's keys simply become
      // unreachable (tryConsume only ever checks the current visit's key).
    },

    /** The visit id this holder currently considers "live". */
    currentVisit() {
      return currentVisitId;
    },

    /**
     * Synchronous, idempotent guard. Returns true only for the FIRST
     * attempted eligible emission of `placement` within the visit identified
     * by `visitId` — including when the attempt's own trackEvent later
     * throws: the attempt is marked consumed regardless of telemetry
     * success, by design (no unbounded retries; a telemetry failure is a
     * documented undercount, not a reason to re-attempt).
     */
    tryConsume(visitId, placement) {
      if (visitId == null || visitId !== currentVisitId) return false; // stale visit
      const key = `${visitId}\u0000${placement}`;
      if (consumedKeys.has(key)) return false;
      consumedKeys.add(key);
      return true;
    },
  };
}
