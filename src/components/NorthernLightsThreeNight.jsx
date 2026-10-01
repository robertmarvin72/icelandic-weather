// src/components/NorthernLightsThreeNight.jsx
//
// Ticket #423 Phase 2 / #425 — the shared three-night Northern Lights
// controller, mounted on BOTH the homepage (#northern-lights, IS and EN) and
// the English landing page (/en/northern-lights). Owns the three fixed
// useAuroraDecision call sites (via useAuroraThreeNight) and renders ONE
// selected-night body (AuroraNightOutlook) plus a cross-night comparison
// summary (auroraMultiNightPolicy) — never three full cards, never three
// maps, and exactly one data owner per mounted surface. The legacy
// single-night NorthernLightsCard is no longer mounted by the app (see
// cc-report.md for #425); its CARD_SHELL_CLASS is still shared from there.
//
// `surface` ("landing" default | "homepage") is the only fork, and it only
// affects presentation and analytics labelling: the homepage keeps its own
// details preference key, links the SELECTED night to the landing page (EN
// homepage only — #426 removed the IS link). Forecast logic is identical on
// both.
//
// Ticket #431 — full access (details, ranking, map, reasons) is open to
// every tier for the "northern_lights_free_v1" business-model experiment.
// `hasNLAccess` (from `isFeatureAvailable("northernLights", entitlements)`)
// is kept DISTINCT from `tier` (the genuine account tier, via
// `getUserTier(entitlements)`) — `hasNLAccess` only gates presentation
// (passed down as AuroraNightOutlook's `isPro` prop, per its own existing
// "presentation-only gate" contract), `tier` is the only thing analytics
// ever records. Never conflate the two: `hasNLAccess` is unconditionally
// true during the experiment (even before login/entitlement resolution),
// while `tier` still reports the user's real Free/Pro status. The former
// Free-only teaser/upgrade blocks (LockedValue, FreeValueBlock) and their
// purchase callbacks are removed from this journey — see
// docs/ai/tasks/ticket-431/experiment-note.md.
//
// It carries the retired card's analytics (card/unavailable/stale viewed,
// details opened, ranking/map viewed) with their original payloads — only
// for the SELECTED night's visible content, never background-loaded
// nights — now additionally carrying `business_model_experiment` on each.
//
// Ticket #431 v2 (corrective, per Ripley's final-assessment REVISE on the
// v1 result review): two gaps in v1's own already-approved items 4 and 6.
// (a) `tier` (from `getUserTier(entitlements)`) can be a premature "free"
// guess while `loadingMe` is still true — entitlements default falsy before
// resolution, same trap v1 already guarded the three EXPOSURE effects
// against (`if (loadingMe) return;`), but the IMMEDIATE interaction
// handlers (night selection, details toggle, the recommended-night action,
// and the new map-marker selection below) were not. `interactionTier`
// records `"unknown"` while loading and the real tier once resolved — never
// retroactively relabels an already-fired "unknown" event after resolution,
// never emits a second copy. (b) the aurora map's marker click was wired to
// a no-op (`onSelect={() => {}}` in AuroraNightOutlook) — real clicks on an
// already-exposed map were never measured at all, distinct from
// `map_viewed`'s own exposure-only semantics. `northern_lights_location_selected`
// now records that actual action, with the same `interactionTier` treatment.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { isFeatureAvailable, getUserTier, NL_FREE_EXPERIMENT_ID } from "../config/features";
import { trackEvent } from "../lib/analytics";
import { isAuroraSeason } from "../lib/auroraSeason";
import { useAuroraThreeNight } from "../hooks/useAuroraThreeNight";
import { classifyMultiNightComparison } from "../lib/auroraMultiNightPolicy";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";
import { formatNightWhenLabel, formatNightTabLabel } from "../lib/auroraNightLabel";
import { auroraNightOverview } from "../lib/auroraNightIndicator";
import { selectAuroraDisplay } from "../lib/auroraDisplaySelection";
import { buildNightDetailPath } from "../lib/auroraNightQuery";
import AuroraNightOutlook from "./AuroraNightOutlook";
import { CARD_SHELL_CLASS } from "./NorthernLightsCard";

// Intentional per-surface preference keys: the homepage keeps the key the
// retired homepage card used (so an existing preference survives), the
// landing page keeps its own. Navigating between them never carries an
// expanded state across, and Free never has hidden content to expose.
const DETAILS_KEYS = { homepage: "nl_details_expanded", landing: "nl3_details_expanded" };

function forecastStatusFor(slot) {
  if (slot.status !== "resolved") return "loading";
  if (slot.classification?.expired) return "domain_unavailable";
  return slot.classification?.primary ?? "loading";
}

function NightTab({ t, lang, slot, isSelected, onSelect }) {
  const overview = auroraNightOverview({ status: slot.status, classification: slot.classification });
  const label = formatNightTabLabel({ date: slot.date, daysAhead: slot.daysAhead, lang, t });

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(slot.date)}
      className={`flex flex-col items-start rounded-xl px-3 py-1.5 text-left ring-1 ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
        isSelected ? "bg-white/15 text-slate-50 ring-white/25" : "bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10"
      }`}
    >
      <span className="text-xs font-semibold">{label}</span>
      <span className="flex items-center gap-1 text-[11px] text-slate-300/90">
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${overview.dotClass}`} />
        {t(overview.textKey)}
      </span>
    </button>
  );
}

function ComparisonSummary({ t, lang, multiNight, onSeeNight }) {
  const { state, comparison } = multiNight;

  if (state === "pending") return <p className="mt-2 text-xs text-slate-300/80">{t("nlCompPending")}</p>;
  if (state === "zero_usable") return <p className="mt-2 text-xs text-slate-300/80">{t("nlCompUnavailableAll")}</p>;

  if (state === "sole_available") {
    const when = formatNightWhenLabel({ date: comparison.soleDate, daysAhead: comparison.soleDaysAhead, lang, t });
    return <p className="mt-2 text-xs text-slate-300/80">{t("nlCompSoleAvailable").replace("{when}", when)}</p>;
  }

  if (state === "ineligible") return <p className="mt-2 text-xs text-slate-300/80">{t("nlCompIneligible")}</p>;

  // state === "eligible"
  if (comparison.kind === "all_three_low_chance") {
    return <p className="mt-2 text-xs text-slate-300/80">{t("nlCompAllThreeLowChance")}</p>;
  }

  if (comparison.kind === "no_favorable") {
    return <p className="mt-2 text-xs text-slate-300/80">{t("nlCompNoFavorable")}</p>;
  }

  if (comparison.kind === "similar") {
    const dates = comparison.group.map((g) => formatNightWhenLabel({ date: g.date, daysAhead: g.daysAhead, lang, t })).join(", ");
    const key = comparison.isExactTie
      ? comparison.scopedToAvailable
        ? "nlCompExactTieScoped"
        : "nlCompExactTie"
      : comparison.scopedToAvailable
        ? "nlCompSimilarScoped"
        : "nlCompSimilar";
    return <p className="mt-2 text-xs text-slate-300/80">{t(key).replace("{dates}", dates)}</p>;
  }

  // comparison.kind === "best_night" — explicitly limited to the available
  // nights whenever a requested night is unavailable, never implying the
  // unavailable night lost.
  const when = formatNightWhenLabel({ date: comparison.date, daysAhead: comparison.daysAhead, lang, t });
  const bestKey = comparison.scopedToAvailable ? "nlCompBestNightScoped" : "nlCompBestNight";
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <p className="text-xs text-slate-300/80">{t(bestKey).replace("{when}", when)}</p>
      <button
        type="button"
        onClick={() => onSeeNight(comparison.date)}
        className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-100 ring-1 ring-inset ring-white/15 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      >
        {t("nlCompSeeNight").replace("{when}", when)}
      </button>
    </div>
  );
}

export default function NorthernLightsThreeNight({
  t,
  lang,
  entitlements,
  theme,
  fetchImpl,
  now,
  loadingMe,
  surface = "landing",
  requestedDate = null,
  onSelectedDateChange,
}) {
  const isHomepage = surface === "homepage";
  const detailsKey = isHomepage ? DETAILS_KEYS.homepage : DETAILS_KEYS.landing;
  const seasonActive = isAuroraSeason(now ? now() : undefined);

  // Ticket #431: `hasNLAccess` (presentation gate) and `tier` (genuine
  // account tier, for analytics) are deliberately separate — see header
  // comment. Never derive one from the other.
  const gate = isFeatureAvailable("northernLights", entitlements);
  const hasNLAccess = !!gate.available;
  const tier = getUserTier(entitlements);
  // Ticket #431 v2: immediate interaction events (never gated by loadingMe
  // the way the exposure effects below already are) must not guess "free"
  // before entitlement resolution — see header comment.
  const interactionTier = loadingMe ? "unknown" : tier;

  const { slots, selectedDate, setSelectedDate, nowMs } = useAuroraThreeNight({ enabled: seasonActive, fetchImpl, now, requestedDate });

  const [detailsExpanded, setDetailsExpanded] = useState(() => {
    try {
      return sessionStorage.getItem(detailsKey) === "true";
    } catch {
      return false;
    }
  });

  const selectedSlot = slots.find((s) => s.date === selectedDate) ?? slots[0];
  const classification = selectedSlot.status === "resolved" ? selectedSlot.classification : null;
  const requestKey = selectedSlot.requestKey;

  // Same pure display selection the homepage card uses, for the SELECTED
  // night only — so ranking/map exposure events can only ever describe what
  // is actually visible.
  const display = useMemo(
    () =>
      selectAuroraDisplay({
        best: classification?.body?.best ?? null,
        alternatives: classification?.body?.alternatives,
        isPro: hasNLAccess,
      }),
    [classification, hasNLAccess],
  );

  function toggleDetails() {
    if (!detailsExpanded) trackEvent("northern_lights_details_opened", { lang, tier: interactionTier, business_model_experiment: NL_FREE_EXPERIMENT_ID });
    setDetailsExpanded((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(detailsKey, String(next));
      } catch {
        /* unavailable */
      }
      return next;
    });
  }

  function selectNight(date) {
    if (date === selectedDate) return;
    const target = slots.find((s) => s.date === date);
    setSelectedDate(date);
    trackEvent("northern_lights_night_selected", {
      selected_date: date,
      days_ahead: target?.daysAhead ?? null,
      forecast_status: target ? forecastStatusFor(target) : "loading",
      user_tier: interactionTier,
      source: surface,
      business_model_experiment: NL_FREE_EXPERIMENT_ID,
    });
  }

  function handleSeeRecommendedNight(date) {
    selectNight(date);
    if (hasNLAccess && !detailsExpanded) {
      trackEvent("northern_lights_details_opened", { lang, tier: interactionTier, business_model_experiment: NL_FREE_EXPERIMENT_ID });
      setDetailsExpanded(true);
      try {
        sessionStorage.setItem(detailsKey, "true");
      } catch {
        /* unavailable */
      }
    }
  }

  // Ticket #431 v2: the aurora map's marker click — a real, user-initiated
  // action, distinct from map_viewed's own exposure-only semantics (which
  // fires once the map is simply shown, not when a marker is clicked).
  // Never fires on mount/render/popup — only forwarded from an actual
  // NorthernLightsMap -> MapView onSelect(locationId) click callback.
  function handleLocationSelect(locationId) {
    trackEvent("northern_lights_location_selected", {
      location_id: locationId,
      selected_date: selectedSlot.date,
      days_ahead: selectedSlot.daysAhead,
      source: surface,
      user_tier: interactionTier,
      business_model_experiment: NL_FREE_EXPERIMENT_ID,
    });
  }

  // ── Selected-content exposure events, deduped by request/date identity ──
  const cardViewedRef = useRef(new Set());
  useEffect(() => {
    if (loadingMe || !classification || !requestKey) return;
    const key = `${requestKey}:${classification.primary}:${classification.expired ? "expired" : ""}`;
    if (cardViewedRef.current.has(key)) return;
    cardViewedRef.current.add(key);

    const isResultOutcome = classification.primary === "success" || classification.primary === "partial";

    trackEvent("northern_lights_card_viewed", {
      lang,
      outcome: classification.primary,
      freshness: classification.freshness,
      band: classification.body?.best?.band ?? null,
      tier,
      resultState: isResultOutcome ? (display.hasQualifyingLocations ? "qualifying" : "all_poor") : null,
      business_model_experiment: NL_FREE_EXPERIMENT_ID,
    });

    if (classification.primary === "domain_unavailable" || classification.primary === "no_darkness" || classification.primary === "contract_defect") {
      trackEvent("northern_lights_unavailable_viewed", { lang, outcome: classification.primary, tier, business_model_experiment: NL_FREE_EXPERIMENT_ID });
    }
    if (isResultOutcome && classification.freshness === "stale") {
      trackEvent("northern_lights_stale_viewed", { lang, outcome: classification.primary, tier, business_model_experiment: NL_FREE_EXPERIMENT_ID });
    }
  }, [classification, requestKey, loadingMe, lang, tier, display.hasQualifyingLocations]);

  // Ticket #431: these two previously hardcoded `tier: "pro"` literally —
  // confirmed and flagged in Jonesy's Round 1 review — now use the genuine
  // account tier, since exposure to the ranking/map is no longer Pro-only.
  const rankingViewedRef = useRef(new Set());
  useEffect(() => {
    if (loadingMe || !detailsExpanded || !requestKey || !display.showRanking) return;
    if (rankingViewedRef.current.has(requestKey)) return;
    rankingViewedRef.current.add(requestKey);
    trackEvent("northern_lights_ranking_viewed", { lang, tier, business_model_experiment: NL_FREE_EXPERIMENT_ID });
  }, [detailsExpanded, requestKey, display.showRanking, loadingMe, lang, tier]);

  const mapViewedRef = useRef(new Set());
  useEffect(() => {
    if (loadingMe || !detailsExpanded || !requestKey || !display.showMap) return;
    if (mapViewedRef.current.has(requestKey)) return;
    mapViewedRef.current.add(requestKey);
    trackEvent("northern_lights_map_viewed", { lang, tier, business_model_experiment: NL_FREE_EXPERIMENT_ID });
  }, [detailsExpanded, requestKey, display.showMap, loadingMe, lang, tier]);

  const multiNight = classifyMultiNightComparison({
    slots: slots.map((s) => ({ date: s.date, daysAhead: s.daysAhead, status: s.status, classification: s.classification })),
    configuredLocationIds: AURORA_CANDIDATE_LOCATION_IDS,
  });

  // Fires only once per genuinely new best-night identity actually
  // displayed, resolved truthfully after entitlement loading (never a
  // premature "free" guess), never for pending/tie/unavailable/sole/
  // no-favorable states.
  const bestNightViewedRef = useRef(null);
  useEffect(() => {
    if (loadingMe) return;
    if (multiNight.state !== "eligible" || multiNight.comparison?.kind !== "best_night") return;
    const availableDateSet = multiNight.slots
      .filter((s) => s.usable)
      .map((s) => s.date)
      .sort()
      .join(",");
    const identity = `${multiNight.comparison.date}:best_night:${availableDateSet}`;
    if (bestNightViewedRef.current === identity) return;
    bestNightViewedRef.current = identity;
    trackEvent("northern_lights_best_night_viewed", {
      selected_date: multiNight.comparison.date,
      days_ahead: multiNight.comparison.daysAhead,
      forecast_status: "success",
      user_tier: tier,
      source: surface,
      business_model_experiment: NL_FREE_EXPERIMENT_ID,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiNight.state, multiNight.comparison, loadingMe, tier]);

  // Reports the selected date to a hosting page (the landing page mirrors it
  // into its query with router replace). Fires only when the selection
  // actually changes — never on ordinary rerenders or data completion — and
  // never counts as a user-selection analytics event.
  const lastNotifiedRef = useRef(null);
  useEffect(() => {
    if (typeof onSelectedDateChange !== "function") return;
    if (lastNotifiedRef.current === selectedDate) return;
    const isInitial = lastNotifiedRef.current === null;
    lastNotifiedRef.current = selectedDate;
    onSelectedDateChange(selectedDate, { isInitial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  if (!seasonActive) return null;

  const when = formatNightWhenLabel({ date: selectedSlot.date, daysAhead: selectedSlot.daysAhead, lang, t });

  return (
    <div className={`mb-3 ${CARD_SHELL_CLASS}`} data-testid="nl3-module">
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-indigo-300" />
          <h2 className="text-sm font-semibold text-slate-100">{t("nlMultiSectionTitle")}</h2>
        </div>
        <p className="mt-0.5 text-xs text-slate-300/80">{t("nlCardSubtitle")}</p>

        <ComparisonSummary t={t} lang={lang} multiNight={multiNight} onSeeNight={handleSeeRecommendedNight} />

        {/* A labelled group of toggle buttons (aria-pressed) — not a
            tablist, since the buttons don't control tabpanels. */}
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t("nlMultiSectionTitle")}>
          {slots.map((slot) => (
            <NightTab key={slot.date} t={t} lang={lang} slot={slot} isSelected={slot.date === selectedDate} onSelect={selectNight} />
          ))}
        </div>

        <div className="mt-3" role="status" aria-live="polite">
          <AuroraNightOutlook
            t={t}
            lang={lang}
            theme={theme}
            status={selectedSlot.status}
            classification={selectedSlot.classification}
            isPro={hasNLAccess}
            detailsExpanded={detailsExpanded}
            onToggleDetails={toggleDetails}
            onRetry={selectedSlot.retry}
            onLocationSelect={handleLocationSelect}
            nowMs={nowMs}
            when={when}
          />
        </div>

        {/* #426: the IS homepage never renders this link (any tier, any
            selected date, any disclosure state) — no replacement language
            link is added; landing's route/query behavior and the EN
            homepage link are otherwise unchanged. */}
        {isHomepage && lang !== "is" && (
          <Link
            to={buildNightDetailPath(selectedSlot.date)}
            data-testid="nl3-details-link"
            className="mt-3 inline-block text-xs font-semibold text-indigo-200 underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            {t("nlHomeDetailsLink")}
          </Link>
        )}
      </div>
    </div>
  );
}
