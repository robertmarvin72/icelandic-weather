// src/components/NorthernLightsThreeNight.jsx
//
// Ticket #423 Phase 2 — compact three-night controller for the Northern
// Lights landing page (/en/northern-lights). Owns the three fixed
// useAuroraDecision call sites (via useAuroraThreeNight) and renders ONE
// selected-night body (AuroraNightOutlook) plus a cross-night comparison
// summary (auroraMultiNightPolicy) — never three full cards, never three
// maps. Homepage's NorthernLightsCard is completely unaffected: this is a
// new sibling module, not a modification of it.
//
// Round 5: this module replaced the landing page's NorthernLightsCard, so it
// also carries that card's existing analytics (card/unavailable/stale
// viewed, details opened, ranking/map viewed, upgrade + landing-card CTA
// clicks) with their original payloads — but only for the SELECTED night's
// visible content, never background-loaded nights.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { isFeatureAvailable } from "../config/features";
import { trackEvent } from "../lib/analytics";
import { isAuroraSeason } from "../lib/auroraSeason";
import { useAuroraThreeNight } from "../hooks/useAuroraThreeNight";
import { classifyMultiNightComparison } from "../lib/auroraMultiNightPolicy";
import { AURORA_CANDIDATE_LOCATION_IDS } from "../config/auroraCandidates";
import { formatNightWhenLabel, formatNightTabLabel } from "../lib/auroraNightLabel";
import { auroraNightOverview } from "../lib/auroraNightIndicator";
import { selectAuroraDisplay } from "../lib/auroraDisplaySelection";
import AuroraNightOutlook from "./AuroraNightOutlook";
import { CARD_SHELL_CLASS } from "./NorthernLightsCard";

const DETAILS_EXPANDED_KEY = "nl3_details_expanded";

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

export default function NorthernLightsThreeNight({ t, lang, entitlements, onUpgrade, theme, fetchImpl, now, loadingMe }) {
  const seasonActive = isAuroraSeason(now ? now() : undefined);

  const gate = isFeatureAvailable("northernLights", entitlements);
  const isPro = !!gate.available;
  const tier = isPro ? "pro" : "free";

  const { slots, selectedDate, setSelectedDate, nowMs } = useAuroraThreeNight({ enabled: seasonActive, fetchImpl, now });

  const [detailsExpanded, setDetailsExpanded] = useState(() => {
    try {
      return sessionStorage.getItem(DETAILS_EXPANDED_KEY) === "true";
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
        isPro,
      }),
    [classification, isPro],
  );

  function toggleDetails() {
    if (!detailsExpanded) trackEvent("northern_lights_details_opened", { lang, tier });
    setDetailsExpanded((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(DETAILS_EXPANDED_KEY, String(next));
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
      user_tier: tier,
    });
  }

  function handleSeeRecommendedNight(date) {
    selectNight(date);
    if (isPro && !detailsExpanded) {
      trackEvent("northern_lights_details_opened", { lang, tier });
      setDetailsExpanded(true);
      try {
        sessionStorage.setItem(DETAILS_EXPANDED_KEY, "true");
      } catch {
        /* unavailable */
      }
    }
  }

  // Existing card-level events (original payloads/sources) plus the new
  // multi-day event: each fires once per actual click, before forwarding
  // the existing checkout source unchanged.
  function handleUpgrade(source) {
    trackEvent("northern_lights_landing_cta_clicked", { lang, tier: "free", placement: "card", source });
    trackEvent("northern_lights_upgrade_clicked", { lang, source, tier: "free" });
    trackEvent("northern_lights_multi_day_upgrade_clicked", {
      selected_date: selectedSlot.date,
      days_ahead: selectedSlot.daysAhead,
      forecast_status: forecastStatusFor(selectedSlot),
      user_tier: tier,
    });
    if (typeof onUpgrade === "function") onUpgrade(source);
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
    });

    if (classification.primary === "domain_unavailable" || classification.primary === "no_darkness" || classification.primary === "contract_defect") {
      trackEvent("northern_lights_unavailable_viewed", { lang, outcome: classification.primary, tier });
    }
    if (isResultOutcome && classification.freshness === "stale") {
      trackEvent("northern_lights_stale_viewed", { lang, outcome: classification.primary, tier });
    }
  }, [classification, requestKey, loadingMe, lang, tier, display.hasQualifyingLocations]);

  const rankingViewedRef = useRef(new Set());
  useEffect(() => {
    if (loadingMe || !detailsExpanded || !requestKey || !display.showRanking) return;
    if (rankingViewedRef.current.has(requestKey)) return;
    rankingViewedRef.current.add(requestKey);
    trackEvent("northern_lights_ranking_viewed", { lang, tier: "pro" });
  }, [detailsExpanded, requestKey, display.showRanking, loadingMe, lang]);

  const mapViewedRef = useRef(new Set());
  useEffect(() => {
    if (loadingMe || !detailsExpanded || !requestKey || !display.showMap) return;
    if (mapViewedRef.current.has(requestKey)) return;
    mapViewedRef.current.add(requestKey);
    trackEvent("northern_lights_map_viewed", { lang, tier: "pro" });
  }, [detailsExpanded, requestKey, display.showMap, loadingMe, lang]);

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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiNight.state, multiNight.comparison, loadingMe, tier]);

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
            isPro={isPro}
            detailsExpanded={detailsExpanded}
            onToggleDetails={toggleDetails}
            onUpgrade={handleUpgrade}
            onRetry={selectedSlot.retry}
            nowMs={nowMs}
            when={when}
          />
        </div>
      </div>
    </div>
  );
}
