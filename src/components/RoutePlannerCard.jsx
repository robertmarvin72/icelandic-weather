// src/components/RoutePlannerCard.jsx
import React, { useEffect, useMemo, useState } from "react";

import { getRouteVerdictMeta } from "../lib/routeVerdictMeta";
import RoutePlannerDetailsModal from "./RoutePlannerDetailsModal";
import AnimatedPill from "./AnimatedPill";
import { isFeatureAvailable } from "../config/features";
import { useRoutePlanner } from "../hooks/useRoutePlanner";
import { deriveRoutePlannerSummary } from "../lib/routePlannerSummary";
import {
  getHazardBlockText,
  getStayReasonText,
  getHazardWindowNarrative,
  getRoughWeatherWindowText,
} from "../lib/routePlannerNarrative";

// Map reason type -> FLAT translation key
function reasonTypeToKey(type) {
  switch (type) {
    case "rainStreak":
      return "routeReasonRainStreak";
    case "gust":
      return "routeReasonGust";
    case "wind":
      return "routeReasonWind";
    case "rain":
      return "routeReasonRain";
    case "temp":
      return "routeReasonTemp";
    case "shelter":
      return "routeReasonShelter";
    default:
      return null;
  }
}

function verdictAccentClasses(verdictLower) {
  switch (verdictLower) {
    case "move":
      return "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-900/20";
    case "consider":
      return "border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/20";
    case "stay":
    default:
      return "border-sky-300 dark:border-sky-700 bg-sky-50/60 dark:bg-sky-900/20";
  }
}

function verdictIconFromV(v) {
  if (v === "better") return "↑";
  if (v === "worse") return "↓";
  return "•";
}

function ProLock({ t, me, onUpgrade }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <div className="text-sm font-semibold mb-1">{t("routePlannerTitle")}</div>
      <div className="text-xs text-slate-600 dark:text-slate-300 mb-3">
        {t("routePlannerLockedBody")}
      </div>

      <button
        type="button"
        onClick={() => typeof onUpgrade === "function" && onUpgrade()}
        className="
          w-full rounded-xl px-3 py-2 text-sm font-semibold
          bg-emerald-600 text-white
          hover:bg-emerald-500
          focus:outline-none focus:ring-2 focus:ring-emerald-400/60
          dark:bg-emerald-500 dark:hover:bg-emerald-400
        "
      >
        {me?.user ? t("proUpgrade") : t("proCtaTitle")}
      </button>
    </div>
  );
}

function interpolate(template, vars) {
  if (typeof template !== "string") return "";
  let out = template;
  for (const [k, v] of Object.entries(vars || {})) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export default function RoutePlannerCard({
  t = (k) => k,
  lang = "en",
  entitlements,
  me,
  onUpgrade,
  sites = [],
  baseSiteId,
  radiusKmDefault = 50,
  windowDaysDefault = 3,
  wetThresholdMmDefault = 3, // eslint-disable-line no-unused-vars
  limitDefault = 30,
  onSummaryChange,
}) {
  const routeFeature = isFeatureAvailable("bestRoutePlanner", entitlements);
  const isPro = !!routeFeature?.available;
  const isPreview = !!routeFeature?.preview && !isPro;

  const [radiusKm, setRadiusKm] = useState(radiusKmDefault);
  const [windowDays, setWindowDays] = useState(windowDaysDefault);
  const [limit] = useState(limitDefault);

  // ✅ Effective values for preview vs pro
  const effectiveRadiusKm = isPreview ? 30 : radiusKm;
  const effectiveWindowDays = isPreview ? 1 : windowDays;
  const effectiveLimit = isPreview ? 1 : limit;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsCandidate, setDetailsCandidate] = useState(null);

  // ✅ One-time route disclaimer
  const [showRouteDisclaimer, setShowRouteDisclaimer] = useState(false);

  // ✅ Glow state (adaptive radius text)
  const [adaptiveGlow, setAdaptiveGlow] = useState(false);
  const prevAdaptiveUsedRef = React.useRef(null);

  function openDetails(candidateRow) {
    if (isPreview) return;
    if (!candidateRow) return;
    setDetailsCandidate(candidateRow);
    setDetailsOpen(true);
  }

  function getImprovementLabel(candidateRow, tFn) {
    const aggregateType = String(candidateRow?.aggregateType || "same");
    const delta = candidateRow?.deltaVsBase;

    if (aggregateType === "slight") {
      return tFn("routeAggregateSlight");
    }

    if (aggregateType === "better") {
      if (typeof delta !== "number") return tFn("routeImproveBetter");
      if (delta < 1.0) return tFn("routeImproveSlight");
      if (delta < 2.5) return tFn("routeImproveBetter");
      return tFn("routeImproveMuchBetter");
    }

    if (typeof delta !== "number") return null;
    if (delta < 0.1) return tFn("routeImproveNone");

    return tFn("routeDaySame");
  }

  const baseSite = useMemo(() => {
    if (!baseSiteId) return null;
    return (Array.isArray(sites) ? sites : []).find((s) => s?.id === baseSiteId) ?? null;
  }, [baseSiteId, sites]);

  const { loading, error, result, routeRiskData, routeRiskLoading } = useRoutePlanner({
    isPro,
    isPreview,
    baseSiteId,
    baseSite,
    sites,
    effectiveRadiusKm,
    effectiveWindowDays,
    effectiveLimit,
    t,
  });

  // ✅ One-time route disclaimer
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPro && !isPreview) return;

    const seen = window.localStorage.getItem("campcast_route_disclaimer_seen");
    if (seen !== "true") {
      setShowRouteDisclaimer(true);
    }
  }, [isPro, isPreview]);

  // ✅ MUST stay above all early returns (fixes React #310)
  useEffect(() => {
    const usedKm =
      typeof result?.debug?.adaptiveRadiusUsedKm === "number"
        ? result.debug.adaptiveRadiusUsedKm
        : null;

    if (typeof usedKm !== "number") return;

    if (prevAdaptiveUsedRef.current !== null && prevAdaptiveUsedRef.current !== usedKm) {
      setAdaptiveGlow(true);
      const tt = setTimeout(() => setAdaptiveGlow(false), 800);
      return () => clearTimeout(tt);
    }

    prevAdaptiveUsedRef.current = usedKm;
  }, [result]);

  // ✅ MUST stay above all early returns
  const {
    top3,
    best,
    decisionLower,
    summary: routePlannerSummary,
  } = useMemo(() => {
    return deriveRoutePlannerSummary({
      result,
      sites,
      effectiveRadiusKm,
      effectiveWindowDays,
      routeRiskData,
      isPreview,
      isPro,
    });
  }, [result, sites, effectiveRadiusKm, effectiveWindowDays, routeRiskData, isPreview, isPro]);

  useEffect(() => {
    if (typeof onSummaryChange !== "function") return;

    if (!result) {
      onSummaryChange(null);
      return;
    }

    onSummaryChange(routePlannerSummary);
  }, [onSummaryChange, result, routePlannerSummary]);

  if (!isPro && !isPreview) return <ProLock t={t} me={me} onUpgrade={onUpgrade} />;

  if (!baseSiteId) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <div className="text-sm font-semibold mb-1">{t("routePlannerTitle")}</div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          {t("routePlannerSelectBase")}
        </div>
      </div>
    );
  }

  if (!baseSite && Array.isArray(sites) && sites.length > 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <div className="text-sm font-semibold mb-1">{t("routePlannerTitle")}</div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          {t("routePlannerBaseLabel")}: <span className="font-semibold">{baseSiteId}</span>
        </div>
        <div className="text-xs text-red-600 mt-2">
          Base site not found (ID mismatch between lists).
        </div>
      </div>
    );
  }

  const isDetailsBestCandidate =
    !!detailsCandidate &&
    !!best &&
    String(detailsCandidate?.siteId || "") === String(best?.siteId || "");

  const THRESH = 0.75;

  function getDayCounts(windowDaysArr, windowDaysCount) {
    const daysArr = Array.isArray(windowDaysArr) ? windowDaysArr : [];
    const slice = typeof windowDaysCount === "number" ? daysArr.slice(0, windowDaysCount) : daysArr;

    let betterDays = 0,
      sameDays = 0,
      worseDays = 0;

    for (const d of slice) {
      const basePts =
        typeof d?.baseSitePoints === "number"
          ? d.baseSitePoints
          : typeof d?.baseSitePointsRaw === "number"
            ? d.baseSitePointsRaw
            : 0;

      const candPts =
        typeof d?.points === "number"
          ? d.points
          : typeof d?.pointsRaw === "number"
            ? d.pointsRaw
            : 0;

      const baseRaw =
        typeof d?.baseSitePointsRaw === "number"
          ? d.baseSitePointsRaw
          : typeof d?.baseSitePoints === "number"
            ? d.baseSitePoints
            : 0;

      const candRaw =
        typeof d?.pointsRaw === "number"
          ? d.pointsRaw
          : typeof d?.points === "number"
            ? d.points
            : 0;

      const deltaPts = candPts - basePts;
      const deltaRaw = candRaw - baseRaw;

      const useRaw =
        (candPts === basePts && (candPts <= 0.0001 || candPts >= 9.9999)) ||
        Math.abs(deltaPts) < 0.0001;

      const delta = useRaw ? deltaRaw : deltaPts;

      if (delta > THRESH) betterDays++;
      else if (delta < -THRESH) worseDays++;
      else sameDays++;
    }

    return { betterDays, sameDays, worseDays, totalDays: slice.length };
  }

  function getVerdictFromDays(windowDaysArr, windowDaysCount) {
    const c = getDayCounts(windowDaysArr, windowDaysCount);
    if (!c || c.totalDays === 0) return "same";

    if (c.betterDays > c.worseDays && c.betterDays >= Math.ceil(c.totalDays / 2)) return "better";
    if (c.worseDays > c.betterDays && c.worseDays >= Math.ceil(c.totalDays / 2)) return "worse";
    return "same";
  }

  function verdictLabelFromV(v) {
    if (v === "better") return t("routeDayBetter");
    if (v === "worse") return t("routeDayWorse");
    return t("routeDaySame");
  }

  function verdictButtonClassFromV(v) {
    if (v === "better") {
      return `
        border border-emerald-200 bg-emerald-50 text-emerald-800
        dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200
        hover:bg-emerald-100 hover:border-emerald-300
        dark:hover:bg-emerald-900/35 dark:hover:border-emerald-700/50
        focus:ring-emerald-400/50
      `;
    }
    if (v === "worse") {
      return `
        border border-rose-200 bg-rose-50 text-rose-800
        dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200
        hover:bg-rose-100 hover:border-rose-300
        dark:hover:bg-rose-900/40 dark:hover:border-rose-700/50
        focus:ring-rose-400/50
      `;
    }
    return `
      border border-slate-200 bg-slate-50 text-slate-800
      dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200
      hover:bg-slate-100 hover:border-slate-300
      dark:hover:bg-slate-800 dark:hover:border-slate-600/60
      focus:ring-slate-400/50
    `;
  }

  const bestCounts = best
    ? {
        betterDays: best?.betterDays ?? 0,
        sameDays: best?.sameDays ?? 0,
        worseDays: best?.worseDays ?? 0,
        totalDays: Array.isArray(best?.windowDays)
          ? best.windowDays.slice(0, effectiveWindowDays).length
          : effectiveWindowDays,
      }
    : null;

  const meta = result && getRouteVerdictMeta(decisionLower);

  const trendText = (() => {
    const v = decisionLower || "stay";
    if (v === "move") return interpolate(t("routePlannerTrendMove"), { days: effectiveWindowDays });
    if (v === "consider")
      return interpolate(t("routePlannerTrendConsider"), { days: effectiveWindowDays });
    return interpolate(t("routePlannerTrendStay"), { days: effectiveWindowDays });
  })();

  // ---------- Adaptive radius UI text ----------
  const adaptive = result?.debug || null;
  const adaptiveEnabled = !!adaptive?.adaptiveRadiusEnabled;

  const adaptiveMaxKm =
    typeof adaptive?.adaptiveRadiusMaxKm === "number" ? adaptive.adaptiveRadiusMaxKm : null;

  const adaptiveUsedKm =
    typeof adaptive?.adaptiveRadiusUsedKm === "number" ? adaptive.adaptiveRadiusUsedKm : null;

  const adaptiveAttempts = Array.isArray(adaptive?.adaptiveRadiusAttempts)
    ? adaptive.adaptiveRadiusAttempts
    : [];

  const adaptivePrevKm = (() => {
    if (!adaptiveEnabled || typeof adaptiveUsedKm !== "number") return null;
    const idx = adaptiveAttempts.findIndex((a) => a?.radiusKm === adaptiveUsedKm);
    if (idx > 0) return adaptiveAttempts[idx - 1]?.radiusKm ?? null;
    return null;
  })();

  const adaptiveRadiusLine =
    adaptiveEnabled &&
    typeof adaptiveUsedKm === "number" &&
    typeof adaptiveMaxKm === "number" &&
    adaptiveUsedKm < adaptiveMaxKm
      ? interpolate(t("routeAdaptiveRadiusUsed"), { used: adaptiveUsedKm, max: adaptiveMaxKm })
      : "";

  const adaptiveVerdictLine = (() => {
    if (!adaptiveEnabled || typeof adaptiveUsedKm !== "number") return "";

    if (
      (decisionLower === "move" || decisionLower === "consider") &&
      typeof adaptivePrevKm === "number" &&
      adaptiveUsedKm > adaptivePrevKm
    ) {
      return interpolate(t("routeAdaptiveFoundBeyond"), {
        prev: adaptivePrevKm,
        used: adaptiveUsedKm,
      });
    }

    if (decisionLower === "stay" && typeof adaptiveMaxKm === "number") {
      return interpolate(t("routeAdaptiveNoBetterWithin"), {
        used: adaptiveUsedKm,
        max: adaptiveMaxKm,
      });
    }

    return "";
  })();
  // --------------------------------------------

  // ✅ Base hazard context (same day window as the alternatives list / modal window)
  const baseHazardWindowDaysCount = isPreview ? effectiveWindowDays : windowDays;
  const baseExplainDays = Array.isArray(result?.explain?.base?.windowDays)
    ? result.explain.base.windowDays
    : [];
  const baseSliceDays =
    typeof baseHazardWindowDaysCount === "number"
      ? baseExplainDays.slice(0, baseHazardWindowDaysCount)
      : baseExplainDays;

  const baseHasHighWarning = baseSliceDays.some(
    (d) => Array.isArray(d?.warnings) && d.warnings.some((w) => w?.level === "high")
  );
  const baseHasWarning = baseSliceDays.some(
    (d) => Array.isArray(d?.warnings) && d.warnings.some((w) => w?.level === "warn")
  );

  function warningRankFromDays(days) {
    const list = Array.isArray(days) ? days : [];
    let rank = 0;

    for (const d of list) {
      const warnings = Array.isArray(d?.warnings) ? d.warnings : [];
      for (const w of warnings) {
        if (w?.level === "high") rank = Math.max(rank, 2);
        else if (w?.level === "warn") rank = Math.max(rank, 1);
      }
    }

    return rank;
  }

  function getRoughWeatherWindowFromDays(days) {
    const list = Array.isArray(days) ? days : [];

    let bestStart = null;
    let bestEnd = null;
    let bestCount = 0;
    let bestMaxRank = 0;

    let currentStart = null;
    let currentEnd = null;
    let currentCount = 0;
    let currentMaxRank = 0;

    for (const d of list) {
      const warnings = Array.isArray(d?.warnings) ? d.warnings : [];
      const rank = warnings.some((w) => w?.level === "high")
        ? 2
        : warnings.some((w) => w?.level === "warn")
          ? 1
          : 0;

      if (rank >= 1) {
        if (!currentStart) currentStart = d?.date ?? null;
        currentEnd = d?.date ?? null;
        currentCount += 1;
        currentMaxRank = Math.max(currentMaxRank, rank);
      } else if (currentCount > 0) {
        if (
          currentCount > bestCount ||
          (currentCount === bestCount && currentMaxRank > bestMaxRank)
        ) {
          bestStart = currentStart;
          bestEnd = currentEnd;
          bestCount = currentCount;
          bestMaxRank = currentMaxRank;
        }

        currentStart = null;
        currentEnd = null;
        currentCount = 0;
        currentMaxRank = 0;
      }
    }

    if (
      currentCount > 0 &&
      (currentCount > bestCount || (currentCount === bestCount && currentMaxRank > bestMaxRank))
    ) {
      bestStart = currentStart;
      bestEnd = currentEnd;
      bestCount = currentCount;
      bestMaxRank = currentMaxRank;
    }

    return {
      hasWindow: bestCount > 0,
      startDate: bestCount > 0 ? bestStart : null,
      endDate: bestCount > 0 ? bestEnd : null,
      dayCount: bestCount,
      maxSeverity: bestMaxRank >= 2 ? "high" : bestMaxRank >= 1 ? "warn" : "none",
    };
  }

  // Helper: produce a camper-first label when the improvement is mainly hazard reduction
  function hazardFirstLabel(candidateRow) {
    const candHigh = !!candidateRow?.hasHighWarning;
    const candWarn = !!candidateRow?.hasWarning;

    // Base has 🚨 but candidate doesn't => "less severe"
    if (baseHasHighWarning && !candHigh) {
      return t("routeCompareReasonLessSevere") || "Minni hætta";
    }

    // Base has ⚠️ (and no 🚨) but candidate has none => "clearer"
    if (!baseHasHighWarning && baseHasWarning && !candWarn && !candHigh) {
      return t("routeCompareReasonClearer") || "Færri viðvaranir";
    }

    return null;
  }

  const showDecisionReasons =
    !isPreview &&
    ["move", "consider"].includes(String(decisionLower)) &&
    Array.isArray(best?.reasons) &&
    best.reasons.length > 0;

  function getSoftAggregateLabel(candidateRow) {
    if (String(candidateRow?.aggregateType || "same") === "slight") {
      return t("routeAggregateSlight") || "Lítil heildarbæting";
    }

    return null;
  }

  function formatShortDateLabel(dateISO) {
    if (!dateISO) return "";

    try {
      const normalizedLang = String(lang || "").toLowerCase();
      const isIcelandic = normalizedLang === "is" || normalizedLang.startsWith("is-");

      const d = new Date(`${dateISO}T00:00:00Z`);
      const weekday = d.getUTCDay();

      const weekdayShort = isIcelandic
        ? ["Sun", "Mán", "Þri", "Mið", "Fim", "Fös", "Lau"][weekday]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday];

      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");

      return `${weekdayShort} ${day}/${month}`;
    } catch {
      return String(dateISO).slice(5);
    }
  }

  function getEscapeSuggestion(candidateRow) {
    if (!candidateRow) return null;
    if (!["move", "consider"].includes(decisionLower)) return null;

    const baseRank = warningRankFromDays(baseSliceDays);
    const candidateRank = candidateRow?.hasHighWarning ? 2 : candidateRow?.hasWarning ? 1 : 0;

    const delta = typeof candidateRow?.deltaVsBase === "number" ? candidateRow.deltaVsBase : null;
    const requiredDelta =
      typeof candidateRow?.requiredDelta === "number" ? candidateRow.requiredDelta : null;

    const qualifiesByDelta =
      typeof delta === "number" && typeof requiredDelta === "number"
        ? delta >= requiredDelta
        : typeof delta === "number" && delta > 0;

    if (baseRank < 1) return null;
    if (candidateRank >= baseRank) return null;
    if (!qualifiesByDelta) return null;

    // NEW: do not suggest escape if overall weather is worse
    if (candidateRow?.aggregateType === "worse") return null;

    const cleanSiteName = (candidateRow?.siteName || candidateRow?.siteId || "—")
      .replace(/ campsite$/i, "")
      .trim();
    return {
      title: t("routeEscapeStormTitle") || "🚐 Escape the storm",
      body: t("routeEscapeStormBody") || "Better weather nearby",
      destinationLine: interpolate(t("routeEscapeStormDestination"), {
        km: Number.isFinite(candidateRow?.distanceKm) ? Math.round(candidateRow.distanceKm) : "—",
        site: cleanSiteName,
      }),
      baseWindow: getRoughWeatherWindowFromDays(baseSliceDays),
      candidateRank,
      baseRank,
    };
  }

  function buildRouteNarrative({
    baseSite,
    best,
    shownHazardWindowNarrative,
    bestEscapeSuggestion,
    routeRiskData,
    decisionLower,
    t,
  }) {
    const parts = [];

    if (shownHazardWindowNarrative && baseSite?.name) {
      parts.push(`${shownHazardWindowNarrative} á ${baseSite.name}.`);
    } else if (shownHazardWindowNarrative) {
      parts.push(shownHazardWindowNarrative);
    }

    if (bestEscapeSuggestion?.destinationLine) {
      parts.push(
        interpolate(
          t("routeNarrativeBetterNearby") ||
            "Betri aðstæður gætu verið í nágrenninu: {destination}.",
          {
            destination: bestEscapeSuggestion.destinationLine,
          }
        )
      );
    } else if (best?.siteName && Number.isFinite(best?.distanceKm) && decisionLower !== "stay") {
      parts.push(
        `Betri aðstæður gætu verið í ${best.siteName}, um ${Math.round(best.distanceKm)} km í burtu.`
      );
    }

    if (routeRiskData?.routeRisk === "HIGH") {
      parts.push(
        t("routeNarrativeRouteRiskHigh") || "Aðstæður á leiðinni gætu þó verið erfiðar núna."
      );
    } else if (routeRiskData?.routeRisk === "MED") {
      parts.push(
        t("routeNarrativeRouteRiskMed") || "Aðstæður á leiðinni gætu verið aðeins erfiðar."
      );
    }

    return parts.filter(Boolean);
  }

  const bestHazardBlockText = getHazardBlockText(best, t);
  const bestStayReasonText = getStayReasonText(best, decisionLower, t);
  const bestEscapeSuggestion = getEscapeSuggestion(best);
  const bestRoughWeatherWindowText = getRoughWeatherWindowText(
    best,
    t,
    formatShortDateLabel,
    interpolate
  );
  const bestHazardWindowNarrative = getHazardWindowNarrative(best, t);

  const baseHazardWindowNarrative = getHazardWindowNarrative(
    { hazardWindow: result?.explain?.base?.hazardWindow },
    t
  );

  const shownHazardWindowNarrative = bestHazardWindowNarrative || baseHazardWindowNarrative;

  const routeNarrativeLines = buildRouteNarrative({
    baseSite,
    best,
    shownHazardWindowNarrative,
    bestEscapeSuggestion,
    routeRiskData,
    decisionLower,
    t,
  });

  const bestHazardBlockClass =
    best?.hazardBlockMode === "stay"
      ? "text-rose-700 dark:text-rose-300"
      : "text-amber-700 dark:text-amber-300";

  const bestRoughWeatherWindowClass =
    best?.roughWeatherWindow?.maxSeverity === "high"
      ? "text-rose-700 dark:text-rose-300"
      : "text-amber-700 dark:text-amber-300";

  return (
    <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden>🧭</span>
            <span>{t("routePlannerTitle")}</span>
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("routePlannerValue")}
          </div>

          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {t("routePlannerBaseLabel")}:{" "}
            <span className="font-semibold">{baseSite?.name ?? baseSiteId}</span>
          </div>
        </div>

        {!isPreview && result?.debug?.candidatesScored > 0 && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
            {t("routePlannerAlternativesCount")}: {result.debug.candidatesScored}
          </div>
        )}

        {isPreview && (
          <div className="mt-1 text-right">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              {t("previewPill")}
            </span>
          </div>
        )}
      </div>

      {/* Controls (Pro only) */}
      {isPro && (
        <div className="grid gap-2 mb-3">
          <label className="text-xs text-slate-600 dark:text-slate-300">
            {t("routePlannerRadius")} ({radiusKm} km)
            <input
              className="w-full"
              type="range"
              min={10}
              max={400}
              step={5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
            />
            {adaptiveRadiusLine ? (
              <div
                className={`
                  mt-1 text-[11px] transition-all duration-700
                  ${
                    adaptiveGlow
                      ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                      : "text-slate-500 dark:text-slate-400"
                  }
                `}
              >
                {adaptiveRadiusLine}
              </div>
            ) : null}
          </label>

          <label className="text-xs text-slate-600 dark:text-slate-300">
            {t("routePlannerWindowDays")} ({windowDays})
            <input
              className="w-full"
              type="range"
              min={2}
              max={5}
              step={1}
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {loading && <div className="text-xs text-slate-600 dark:text-slate-300">{t("loading")}…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}

      {!loading && !error && result && meta && (
        <div className="grid gap-3">
          {/* Verdict (Decision Tool) */}
          <div className={`rounded-lg border p-2 ${verdictAccentClasses(decisionLower)}`}>
            <div className="text-sm font-semibold">{t(meta.titleKey)}</div>
            <div className="text-xs text-slate-600 dark:text-slate-300">{t(meta.bodyKey)}</div>

            {trendText && (
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">{trendText}</div>
            )}

            {routeRiskData?.routeRisk === "HIGH" && (
              <div className="mt-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                🚧{" "}
                {t("routeRiskAffectsDecision") ||
                  "Driving conditions may affect this recommendation."}
              </div>
            )}

            {!isPreview && routeRiskLoading && (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("loading")}…</div>
            )}

            {!isPreview && routeRiskData && routeRiskData.routeRisk !== "LOW" && (
              <div className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                🚐 {t("routeRiskLabel") || "Route risk"}:{" "}
                {routeRiskData.routeRisk === "HIGH"
                  ? t("routeRiskHigh") || "High"
                  : routeRiskData.routeRisk === "MED"
                    ? t("routeRiskMed") || "Moderate"
                    : t("routeRiskLow") || "Low"}
              </div>
            )}

            {bestEscapeSuggestion ? (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 dark:border-emerald-800/50 dark:bg-emerald-900/20">
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  {bestEscapeSuggestion.title}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {bestEscapeSuggestion.body}
                </div>
                <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mt-1">
                  {bestEscapeSuggestion.destinationLine}
                </div>
              </div>
            ) : null}

            {best?.aggregateType === "slight" && (
              <div className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                {t("routeAggregateSlight")}
              </div>
            )}

            {bestHazardBlockText ? (
              <div className={`mt-2 text-xs font-medium ${bestHazardBlockClass}`}>
                {bestHazardBlockText}
              </div>
            ) : null}

            {!bestHazardBlockText && bestRoughWeatherWindowText ? (
              <div className={`mt-2 text-xs font-medium ${bestRoughWeatherWindowClass}`}>
                {bestRoughWeatherWindowText}
              </div>
            ) : null}

            {!bestHazardBlockText && routeNarrativeLines.length > 0 ? (
              <div className="mt-2 rounded-lg border border-slate-200/70 bg-white/60 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/30">
                <div className="space-y-1">
                  {routeNarrativeLines.map((line, idx) => (
                    <div key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {decisionLower === "stay" && (
              <div className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {t("routeStayGoodSpot")}
              </div>
            )}

            {bestStayReasonText ? (
              <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                {bestStayReasonText}
              </div>
            ) : null}

            {bestCounts && (
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {interpolate(t("routeDecisionCounts"), {
                  better: bestCounts.betterDays,
                  same: bestCounts.sameDays,
                  worse: bestCounts.worseDays,
                })}

                {adaptiveVerdictLine ? (
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {adaptiveVerdictLine}
                  </div>
                ) : null}
              </div>
            )}

            {showDecisionReasons && (
              <ul className="mt-2 pl-4 text-xs grid gap-1 list-disc text-slate-700 marker:text-emerald-500 dark:text-slate-300">
                {best.reasons.slice(0, 3).map((r, idx) => {
                  const key = reasonTypeToKey(r?.type);
                  return key ? <li key={`${r.type}-${idx}`}>{t(key)}</li> : null;
                })}
              </ul>
            )}
          </div>

          {/* Top alternatives / Preview single best */}
          <div>
            <div className="text-xs font-semibold mb-2">
              {isPreview
                ? t("routePlannerBestTomorrow")
                : decisionLower === "stay"
                  ? interpolate(t("routePlannerTopAlternativesNoBetter"), { days: windowDays })
                  : t("routePlannerTopAlternatives")}
            </div>

            {isPreview ? (
              decisionLower !== "stay" && top3.length > 0 ? (
                <ol className="grid gap-2 pl-4 text-xs">
                  {top3.slice(0, 1).map((x) => {
                    const rawV = getVerdictFromDays(x?.windowDays, effectiveWindowDays);
                    const visualV =
                      x === best && routeRiskData?.routeRisk === "HIGH" && rawV === "better"
                        ? "same"
                        : rawV;

                    const triggerKey = `${x.siteId}:${effectiveWindowDays}:${visualV}:${
                      typeof x?.deltaVsBase === "number" ? x.deltaVsBase.toFixed(1) : "na"
                    }`;

                    const hazardLabel = hazardFirstLabel(x);
                    const oldImprovement = getImprovementLabel(x, t);
                    const softAggregateLabel = getSoftAggregateLabel(x);

                    const previewPrimaryLabel =
                      hazardLabel ||
                      softAggregateLabel ||
                      oldImprovement ||
                      verdictLabelFromV(visualV);

                    return (
                      <li key={x.siteId}>
                        <div className="font-semibold flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <span>{x.siteName ?? x.siteId}</span>

                            {x === best && routeRiskData?.routeRisk === "HIGH" && (
                              <span
                                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                                  bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                                title={
                                  t("routeRiskHighTooltip") ||
                                  "Difficult driving conditions along the route"
                                }
                                aria-label={
                                  t("routeRiskHighTooltip") ||
                                  "Difficult driving conditions along the route"
                                }
                              >
                                🚨
                              </span>
                            )}

                            {x === best && routeRiskData?.routeRisk === "MED" && (
                              <span
                                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                                  bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                                title={
                                  t("routeRiskMedTooltip") ||
                                  "Some wind-related driving risk along the route"
                                }
                                aria-label={
                                  t("routeRiskMedTooltip") ||
                                  "Some wind-related driving risk along the route"
                                }
                              >
                                ⚠️
                              </span>
                            )}
                          </span>

                          {Number.isFinite(x?.distanceKm) && (
                            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                              • {Math.round(x.distanceKm)} km
                            </span>
                          )}

                          <AnimatedPill triggerKey={triggerKey} as="span" className="inline-flex">
                            <button
                              type="button"
                              onClick={() => openDetails(x)}
                              disabled
                              className={`
                                inline-flex items-center gap-1.5
                                rounded-full px-2.5 py-1
                                text-xs font-semibold
                                transition-all duration-150 ease-out
                                focus:outline-none focus:ring-2
                                ${verdictButtonClassFromV(visualV)}
                                cursor-default opacity-90
                              `}
                              title=""
                              aria-label={`${verdictLabelFromV(visualV)}. ${
                                oldImprovement ? `${oldImprovement}. ` : ""
                              }`}
                            >
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/60 dark:bg-white/10">
                                {verdictIconFromV(visualV)}
                              </span>
                              <span>{previewPrimaryLabel}</span>
                            </button>
                          </AnimatedPill>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {t("routePlannerPreviewNoBetter")}
                </div>
              )
            ) : top3.length > 0 ? (
              <ol className="grid gap-2 pl-4 text-xs">
                {top3.map((x) => {
                  const rawV = getVerdictFromDays(x?.windowDays, windowDays);
                  const visualV =
                    x === best && routeRiskData?.routeRisk === "HIGH" && rawV === "better"
                      ? "same"
                      : rawV;

                  const triggerKey = `${x.siteId}:${windowDays}:${visualV}:${
                    typeof x?.deltaVsBase === "number" ? x.deltaVsBase.toFixed(1) : "na"
                  }`;

                  const deltaTitle =
                    typeof x?.deltaVsBase === "number"
                      ? `${t("routeDetailsDelta") || "Delta"}: ${x.deltaVsBase >= 0 ? "+" : ""}${x.deltaVsBase.toFixed(1)}`
                      : "";

                  const oldImprovement = getImprovementLabel(x, t);

                  // ✅ hazard-first label (camper-first)
                  const hazardLabel = hazardFirstLabel(x);

                  // ✅ soft aggregate label from engine
                  const softAggregateLabel = getSoftAggregateLabel(x);

                  const primaryLabel =
                    hazardLabel ||
                    softAggregateLabel ||
                    oldImprovement ||
                    verdictLabelFromV(visualV);

                  return (
                    <li key={x.siteId}>
                      <div className="font-semibold flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{x.siteName ?? x.siteId}</span>

                          {x === best && routeRiskData?.routeRisk === "HIGH" && (
                            <span
                              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                                bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                              title={
                                t("routeRiskHighTooltip") ||
                                "Difficult driving conditions along the route"
                              }
                              aria-label={
                                t("routeRiskHighTooltip") ||
                                "Difficult driving conditions along the route"
                              }
                            >
                              🚨
                            </span>
                          )}

                          {x === best && routeRiskData?.routeRisk === "MED" && (
                            <span
                              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                                bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                              title={
                                t("routeRiskMedTooltip") ||
                                "Some wind-related driving risk along the route"
                              }
                              aria-label={
                                t("routeRiskMedTooltip") ||
                                "Some wind-related driving risk along the route"
                              }
                            >
                              ⚠️
                            </span>
                          )}

                          {x?.hasHighWarning ? (
                            <span
                              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                                bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                              title={t("routeWarningHigh") || "Hættuveður"}
                              aria-label={t("routeWarningHigh") || "Hættuveður"}
                            >
                              🚨
                            </span>
                          ) : x?.hasWarning ? (
                            <span
                              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                                bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                              title={t("routeWarning") || "Viðvörun"}
                              aria-label={t("routeWarning") || "Viðvörun"}
                            >
                              ⚠️
                            </span>
                          ) : null}
                        </span>

                        {Number.isFinite(x?.distanceKm) && (
                          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            • {Math.round(x.distanceKm)} km
                          </span>
                        )}

                        <AnimatedPill triggerKey={triggerKey} as="span" className="inline-flex">
                          <button
                            type="button"
                            onClick={() => openDetails(x)}
                            className={`
                              inline-flex items-center gap-1.5
                              rounded-full px-2.5 py-1
                              text-xs font-semibold
                              transition-all duration-150 ease-out
                              hover:shadow-sm
                              active:scale-[0.98]
                              focus:outline-none focus:ring-2
                              ${verdictButtonClassFromV(visualV)}
                            `}
                            title={deltaTitle}
                            aria-label={`${primaryLabel}. ${t("routeDetailsOpenHint") || "Open details"}`}
                          >
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/60 dark:bg-white/10">
                              {verdictIconFromV(visualV)}
                            </span>
                            <span>{primaryLabel}</span>
                          </button>
                        </AnimatedPill>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {t("routePlannerNoAlternatives")}
              </div>
            )}

            {isPreview && (
              <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/60 dark:bg-slate-900/20">
                <div className="text-xs text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-line">
                  {t("routePlannerPreviewBody")}
                </div>
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {t("proUpgrade")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showRouteDisclaimer && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/85 dark:bg-slate-950/85 backdrop-blur-[2px]">
          <div className="mx-3 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t("routeDisclaimerTitle")}
            </div>

            <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>{t("routeDisclaimerBody1")}</p>
              <p>{t("routeDisclaimerBody2")}</p>
              <p>{t("routeDisclaimerBody3")}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("campcast_route_disclaimer_seen", "true");
                }
                setShowRouteDisclaimer(false);
              }}
              className="
                mt-4 w-full rounded-xl px-3 py-2 text-sm font-semibold
                bg-emerald-600 text-white
                hover:bg-emerald-500
                focus:outline-none focus:ring-2 focus:ring-emerald-400/60
                dark:bg-emerald-500 dark:hover:bg-emerald-400
              "
            >
              {t("routeDisclaimerConfirm")}
            </button>
          </div>
        </div>
      )}

      <RoutePlannerDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        t={t}
        baseSiteLabel={baseSite?.name ?? baseSiteId}
        candidate={detailsCandidate}
        windowDaysCount={effectiveWindowDays}
        adaptiveUsedKm={adaptiveUsedKm}
        adaptiveMaxKm={adaptiveMaxKm}
        escapeSuggestion={detailsCandidate ? getEscapeSuggestion(detailsCandidate) : null}
        routeRiskData={routeRiskData}
        showRouteRisk={isDetailsBestCandidate}
      />
    </div>
  );
}
