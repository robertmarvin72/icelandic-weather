import React, { useEffect, useMemo, useRef } from "react";
import { HAZARDS_V1 } from "../config/hazards";
import { getRouteVerdictMeta } from "../lib/routeVerdictMeta";
import { trackEvent } from "../lib/analytics";

function hasRoughWeather(rows = []) {
  return rows.some((r) => {
    const wind = typeof r?.windMax === "number" ? r.windMax : null;
    const gust = typeof r?.windGust === "number" ? r.windGust : null;
    const rain = typeof r?.rain === "number" ? r.rain : null;

    return (
      (wind != null && wind >= HAZARDS_V1.windWarn) ||
      (gust != null && gust >= HAZARDS_V1.gustWarn) ||
      (rain != null && rain >= HAZARDS_V1.rainWarn)
    );
  });
}

function interpolate(template, vars) {
  if (typeof template !== "string") return "";
  let out = template;
  for (const [k, v] of Object.entries(vars || {})) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

// UX Miði — canonical homepage decision card. Replaces the separate
// DecisionBanner + InstantComparison banners with one card so the homepage
// shows exactly one stay/move/consider result before supporting detail.
// This is a presentation merge only — tone/model derivation is DecisionBanner's
// unchanged logic, candidate/comfort-reasons derivation is InstantComparison's
// unchanged logic, both driven by the same shared comparisonState (App.jsx's
// single useComparisonState call — no new data fetching or scoring here).
//
// DecisionBanner.jsx and InstantComparison.jsx are no longer rendered on the
// homepage. InstantComparison.jsx itself is untouched and still used by
// Brochure.jsx.
export default function HomeDecisionCard({
  t,
  rows = [],
  routePlannerSummary = null,
  comparisonState = null,
  entitlements = null,
  onUpgrade,
  onCtaClick,
  currentSiteId = null,
  lang,
  // Narrow, explicit isolation seam for the #395 research quiz route, which
  // renders this same real component with frozen fixtures and must emit no
  // production GA4 event (see src/pages/DecisionQuizResearch.jsx). Analytics
  // stays enabled by default — every existing production call site is
  // unaffected. Never mutates global GA config or monkey-patches trackEvent.
  disableAnalytics = false,
}) {
  const isPro = !!entitlements?.isPro;

  // Tone/title/body/CTA — unchanged from DecisionBanner's model derivation.
  const model = useMemo(() => {
    const rough = hasRoughWeather(rows);
    const verdict = String(routePlannerSummary?.verdict || "").toLowerCase();
    const candidateName = routePlannerSummary?.candidate?.name || t("nearbyCampsite");

    if (comparisonState?.showComparison) {
      const { direction } = comparisonState;

      if (direction === "similar") {
        return {
          tone: "stay",
          title: t("decisionSimilarTitle") || "No clear reason to move",
          body:
            t("decisionSimilarBody") ||
            "Weather conditions at nearby campsites look similar over the next few days. Staying where you are is likely the better choice.",
          painLine: null,
        };
      }

      if (direction === "current_better") {
        return {
          tone: "stay",
          title: t("decisionCurrentBetterTitle") || "Stay where you are",
          body:
            t("decisionCurrentBetterBody") ||
            "Conditions at your current campsite look better than at the nearby alternatives over the next few days.",
          painLine: null,
        };
      }
    }

    if (verdict === "move") {
      const meta = getRouteVerdictMeta(verdict);
      return {
        tone: "move",
        title: t(meta.titleKey),
        body: isPro
          ? (
              t("decisionMoveBodyWindowAware") ||
              "Better weather is likely at {site} over the next few days, even if your current campsite scores best overall this week."
            ).replace("{site}", candidateName)
          : t("decisionMoveLockedBody") ||
            "A better option may be nearby over the next few days.",
        painLine: t("routePainMoveBody"),
        locked: !isPro,
      };
    }

    if (verdict === "consider") {
      const meta = getRouteVerdictMeta(verdict);
      return {
        tone: "consider",
        title: t(meta.titleKey),
        body: isPro
          ? (
              t("decisionConsiderBodyWindowAware") ||
              "Slightly better conditions may be available at {site} over the next few days."
            ).replace("{site}", candidateName)
          : t("decisionConsiderLockedBody") ||
            "A slightly better option may be nearby over the next few days.",
        painLine: t("routePainConsiderBody"),
        locked: !isPro,
      };
    }

    if (verdict === "stay") {
      const meta = getRouteVerdictMeta(verdict);
      return {
        tone: "stay",
        title: t(meta.titleKey),
        body: rough ? t("decisionStayBodyRough") : t("decisionStayBodyGood"),
        painLine: t("routePainStayBody"),
      };
    }

    return {
      tone: "stay",
      title: t("routeVerdictStayTitle"),
      body: rough ? t("decisionStayBodyRough") : t("decisionStayBodyGood"),
      painLine: null,
    };
  }, [rows, routePlannerSummary, comparisonState, isPro, t]);

  // Candidate/comfort-reasons — unchanged from InstantComparison's derivation,
  // driven by the same comparisonState. Never falls back to top5[0] or any
  // other candidate source — comparisonState.best (selectBestCandidate,
  // radius-filtered) is the only source, exactly as before.
  const best = comparisonState?.best ?? null;
  const showCandidate = best != null && !model.locked;

  const reasonLabels = {
    wind: t("icReasonCalmer"),
    rain: t("icReasonDrier"),
    temp: t("icReasonWarmer"),
  };

  const comfortReasons = useMemo(() => {
    if (!showCandidate) return [];
    if (!comparisonState?.isStrongOrDecent) return [];
    const improvements = Array.isArray(comparisonState?.improvements)
      ? comparisonState.improvements
      : [];
    return improvements.map((key) => reasonLabels[key]).filter(Boolean);
  }, [showCandidate, comparisonState, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const distanceText =
    showCandidate && best.distFromBase != null && isFinite(best.distFromBase)
      ? interpolate(t("icDistanceLabel"), { km: Math.round(best.distFromBase) })
      : null;

  // recommendation_viewed — unchanged: fires whenever the RAW engine verdict
  // settles on a new value (mirrors stay_recommended/move_recommended in
  // RoutePlannerCard). Not gated on model.tone, which can be overridden by
  // comparisonState for display purposes only.
  const rawVerdict = String(routePlannerSummary?.verdict || "").toLowerCase();
  const viewedVerdictRef = useRef(null);
  useEffect(() => {
    if (disableAnalytics) return;
    if (!routePlannerSummary?.ready) return;
    if (viewedVerdictRef.current === rawVerdict) return;
    viewedVerdictRef.current = rawVerdict;

    trackEvent("recommendation_viewed", {
      recommendation_type: rawVerdict,
      better_location_found: rawVerdict !== "stay",
      current_campsite_id: currentSiteId ?? null,
      source: "decision_recommendation",
      userTier: isPro ? "pro" : "free",
    });
  }, [routePlannerSummary?.ready, rawVerdict, currentSiteId, isPro, disableAnalytics]);

  // canonical_recommendation_viewed — analytics-design follow-up after #377
  // Phase A. Deduped on model.tone itself (not rawVerdict), because model.tone
  // can change independently of rawVerdict once comparisonState settles after
  // routePlannerSummary is already ready — recommendation_viewed's rawVerdict
  // key would miss that case. raw_verdict/tone_overridden let engine-vs-shown
  // divergence (e.g. raw "move" + comparisonState.direction "similar" →
  // canonical "stay") be measured without changing recommendation_viewed's own
  // raw semantics. recommendation_viewed, stay_recommended, move_recommended,
  // and travel_advisor_free_used remain raw-engine-diagnostic events, unchanged.
  const canonicalViewedToneRef = useRef(null);
  useEffect(() => {
    if (disableAnalytics) return;
    if (!routePlannerSummary?.ready) return;
    if (canonicalViewedToneRef.current === model.tone) return;
    canonicalViewedToneRef.current = model.tone;

    trackEvent("canonical_recommendation_viewed", {
      recommendation_type: model.tone,
      raw_verdict: rawVerdict,
      tone_overridden: rawVerdict !== model.tone,
      better_location_found: model.tone !== "stay",
      userTier: isPro ? "pro" : "free",
      current_campsite_id: currentSiteId ?? null,
    });
  }, [routePlannerSummary?.ready, model.tone, rawVerdict, isPro, currentSiteId, disableAnalytics]);

  const lockedViewedVerdictRef = useRef(null);
  useEffect(() => {
    if (disableAnalytics) return;
    if (isPro) return;
    if (!model.locked) return;
    if (lockedViewedVerdictRef.current === rawVerdict) return;
    lockedViewedVerdictRef.current = rawVerdict;

    trackEvent("better_location_locked_viewed", {
      recommendation_type: rawVerdict,
      userTier: "free",
    });
  }, [isPro, model.locked, rawVerdict, disableAnalytics]);

  // comparison_viewed / better_nearby_found — unchanged from InstantComparison:
  // fires whenever a qualifying candidate exists, independent of the Free
  // locked-identity gate (this mirrors prior InstantComparison behavior,
  // where the effect ran before the render-time hideIdentityForFree check).
  const tier = comparisonState?.tier ?? -1;
  const comparisonFiredRef = useRef(null);
  useEffect(() => {
    if (disableAnalytics) return;
    if (!comparisonState?.showComparison || !best) return;
    const key = `${best.site?.id}:${tier}`;
    if (comparisonFiredRef.current === key) return;
    comparisonFiredRef.current = key;

    const dist = best.distFromBase;
    const distanceBucket = dist < 50 ? "< 50km" : dist < 150 ? "50-150km" : "> 150km";

    trackEvent("comparison_viewed", {
      comparisonTier: ["similar", "slightly-better", "better", "much-better"][tier] ?? "unknown",
      distanceBucket,
      recommendation: comparisonState?.strength,
    });

    if (comparisonState?.isStrongOrDecent) {
      trackEvent("better_nearby_found", {
        recommendation: "move",
        comparisonTier: ["similar", "slightly-better", "better", "much-better"][tier] ?? "unknown",
        radiusKm: 50,
      });
    }
  }, [comparisonState, best, tier, disableAnalytics]);

  function handleUpgradeClick() {
    if (!disableAnalytics) {
      trackEvent("better_location_upgrade_clicked", {
        recommendation_type: rawVerdict,
        userTier: "free",
        lang,
      });
    }
    if (typeof onUpgrade === "function") onUpgrade("decision_recommendation");
  }

  function handleSecondaryClick() {
    if (!disableAnalytics) trackEvent("homepage_instant_comparison_cta_click");
    if (typeof onCtaClick === "function") {
      onCtaClick();
      return;
    }
    document
      .getElementById("comparison-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const classes =
    model.tone === "move"
      ? "border-emerald-200/60 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
      : model.tone === "consider"
        ? "border-amber-200/60 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
        : "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100";

  return (
    <div className={`mb-3 rounded-2xl border px-4 py-3 shadow-sm ${classes}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <div
            className={`w-2.5 h-2.5 rounded-full shadow-sm ${
              model.tone === "move"
                ? "bg-emerald-500"
                : model.tone === "consider"
                  ? "bg-amber-500"
                  : "bg-sky-500"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{model.title}</div>
          <div className="mt-1.5 text-sm opacity-90">{model.body}</div>
          {model.painLine && (
            <div className="mt-1 text-xs opacity-75">{model.painLine}</div>
          )}

          {showCandidate && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="font-semibold">{best.site?.name}</span>
              {distanceText && <span className="opacity-75">{distanceText}</span>}
              {comfortReasons.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-white/70 px-2 py-0.5 font-medium opacity-90 dark:bg-white/10"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {model.locked && (
              <button
                type="button"
                onClick={handleUpgradeClick}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800"
              >
                {/* CTA follows the canonical tone (model.tone), not the raw
                    verdict — move may assert a better spot; consider must stay
                    hedged and never claim one was found. */}
                {model.tone === "move"
                  ? t("decisionLockedCta") || "See the better spot with Pro"
                  : t("decisionConsiderLockedCta") || "Explore more options with Pro"}{" "}
                →
              </button>
            )}

            {showCandidate && (
              <button
                type="button"
                onClick={handleSecondaryClick}
                className="text-xs font-semibold underline decoration-dotted underline-offset-2 opacity-75 transition-opacity hover:opacity-100"
              >
                {tier >= 2 ? t("icCtaView") : t("icCtaCompare")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
