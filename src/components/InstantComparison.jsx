import React, { useMemo, useRef, useEffect } from "react";
import { trackEvent } from "../lib/analytics";
import { haversine } from "../lib/geo";

function calcMetrics(rows) {
  const slice = (rows || []).slice(0, 3);
  if (!slice.length) return null;

  const winds = slice.map((r) => r?.windMax).filter((v) => typeof v === "number" && isFinite(v));
  const rains = slice.map((r) => r?.rain).filter((v) => typeof v === "number" && isFinite(v));
  const temps = slice.map((r) => r?.tmax).filter((v) => typeof v === "number" && isFinite(v));

  return {
    avgWind: winds.length ? winds.reduce((a, b) => a + b, 0) / winds.length : null,
    totalRain: rains.length ? rains.reduce((a, b) => a + b, 0) : null,
    avgHighTemp: temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null,
  };
}

// Returns { strength: "strong"|"decent"|"weak"|"mixed", primaryReason: string|null }
function classifyMetrics(current, nearby) {
  if (!current || !nearby) return { strength: "weak", primaryReason: null };

  const improvements = [];
  const worsenings = [];

  if (current.avgWind != null && nearby.avgWind != null) {
    const diff = current.avgWind - nearby.avgWind;
    if (diff >= 1.5) improvements.push("wind");
    else if (diff <= -1.5) worsenings.push("wind");
  }

  if (current.totalRain != null && nearby.totalRain != null) {
    const diff = current.totalRain - nearby.totalRain;
    if (diff >= 2) improvements.push("rain");
    else if (diff <= -2) worsenings.push("rain");
  }

  if (current.avgHighTemp != null && nearby.avgHighTemp != null) {
    const diff = nearby.avgHighTemp - current.avgHighTemp;
    if (diff >= 1.5) improvements.push("temp");
    else if (diff <= -1.5) worsenings.push("temp");
  }

  let strength;
  if (improvements.length >= 2 && worsenings.length === 0) strength = "strong";
  else if (improvements.length >= 1 && worsenings.length === 0) strength = "decent";
  else if (improvements.length >= 1) strength = "weak";
  else strength = "mixed";

  const reasonLabels = { wind: "Rólegra", rain: "Þurrara", temp: "Hlýrra" };
  const primaryKey = improvements.length > 0 ? improvements[0] : null;
  const primaryReason = primaryKey ? reasonLabels[primaryKey] : null;

  return { strength, primaryReason, primaryKey };
}

// Distance-aware label for the right-hand card
function distanceCategoryLabel(dist) {
  if (dist == null || !isFinite(dist)) return "Nálægur kostur";
  if (dist < 80) return "Nálægur kostur";
  if (dist < 200) return "Annar kostur";
  return "Lengra í burtu";
}

// Builds a short human-readable delta string for the strongest improvement.
function buildDeltaText(primaryKey, current, nearby) {
  if (!primaryKey || !current || !nearby) return null;
  if (primaryKey === "wind") {
    const curr = current.avgWind;
    const near = nearby.avgWind;
    if (curr == null || near == null || !isFinite(curr) || !isFinite(near) || curr <= 0) return null;
    const pct = Math.round(((curr - near) / curr) * 100);
    if (pct < 5) return null;
    return `${pct}% minni vindur`;
  }
  if (primaryKey === "rain") {
    if (current.totalRain == null || nearby.totalRain == null) return null;
    const diff = current.totalRain - nearby.totalRain;
    if (!isFinite(diff) || diff < 1) return null;
    return `${Math.round(diff)} mm minna regn`;
  }
  if (primaryKey === "temp") {
    if (current.avgHighTemp == null || nearby.avgHighTemp == null) return null;
    const diff = nearby.avgHighTemp - current.avgHighTemp;
    if (!isFinite(diff) || diff < 0.5) return null;
    return `${Math.round(diff)}°C hlýrra`;
  }
  return null;
}

// Searches ALL scored campsites within radiusKm of the base site.
// Using top5 (global best) caused all candidates to fail the radius filter when
// the globally best sites were far away. This searches the full scored set instead,
// matching the same candidate pool that RoutePlannerCard's relocationEngine uses.
function selectBestCandidate(siteList, scoresById, site, currentScore, radiusKm) {
  if (!siteList?.length || !site) return null;

  const baseLat = Number(site.lat);
  const baseLon = Number(site.lon);
  if (!isFinite(baseLat) || !isFinite(baseLon)) return null;

  const MIN_SCORE_DIFF = 5;
  let best = null;

  for (const s of siteList) {
    if (s.id === site.id) continue;

    const scored = scoresById?.[s.id];
    if (!scored || scored.score == null) continue;
    if (scored.score - currentScore < MIN_SCORE_DIFF) continue;

    const sLat = Number(s.lat);
    const sLon = Number(s.lon);
    if (!isFinite(sLat) || !isFinite(sLon)) continue;

    const distFromBase = haversine(baseLat, baseLon, sLat, sLon);
    if (distFromBase > radiusKm) continue;

    if (!best || scored.score > best.score) {
      best = { site: s, score: scored.score, distFromBase };
    }
  }

  return best;
}

// Badge tier index: 0=Svipað, 1=Örlítið betra, 2=Betra, 3=Miklu betra
const BADGE_LABELS = ["Svipað", "Örlítið betra", "Betra", "Miklu betra"];

function scoreTier(diff) {
  if (diff >= 15) return 3;
  if (diff >= 8) return 2;
  if (diff >= 5) return 1;
  return 0;
}

function metricCap(strength) {
  if (strength === "strong") return 3;
  if (strength === "decent") return 2;
  if (strength === "weak") return 1;
  return 0;
}

function fmt(val) {
  if (val === null || val === undefined || !isFinite(val)) return null;
  return Number(val).toFixed(1);
}

function MetricRow({ icon, value, unit }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
      <span>{icon}</span>
      <span>
        {value} {unit}
      </span>
    </div>
  );
}

function SiteCard({ label, name, metrics, dist, muted, highlight, deltaText }) {
  const windFmt = fmt(metrics?.avgWind);
  const rainFmt = fmt(metrics?.totalRain);
  const tempFmt = fmt(metrics?.avgHighTemp);

  const border = highlight
    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-950/20"
    : "border-slate-200 bg-slate-50/60 dark:border-slate-700/50 dark:bg-slate-800/30";

  const labelColor = muted
    ? "text-slate-400 dark:text-slate-500"
    : highlight
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-slate-500 dark:text-slate-400";

  return (
    <div className={`flex-1 rounded-xl border px-3 py-2.5 ${border}`}>
      <div className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${labelColor}`}>
        {label}
      </div>
      {name && (
        <div className="mb-1.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {name}
        </div>
      )}
      <div className="space-y-0.5">
        <MetricRow icon="💨" value={windFmt} unit="m/s" />
        <MetricRow icon="🌧" value={rainFmt} unit="mm" />
        <MetricRow icon="🌡" value={tempFmt} unit="°C" />
      </div>
      {deltaText && (
        <div className="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {deltaText}
        </div>
      )}
      {dist != null && isFinite(dist) && (
        <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          ~{Math.round(dist)} km í beinni línu
        </div>
      )}
    </div>
  );
}

export default function InstantComparison({ site, currentScore, rows, siteList, scoresById, radiusKm = 50, homepageRecommendation = "stay", onCtaClick }) {
  const best = useMemo(
    () => selectBestCandidate(siteList, scoresById, site, currentScore, radiusKm),
    [siteList, scoresById, site, currentScore, radiusKm]
  );

  const scoreDiff = best ? best.score - currentScore : 0;
  const showComparison = best != null;

  const currentMetrics = useMemo(() => calcMetrics(rows), [rows]);
  const nearbyMetrics = useMemo(() => {
    if (!best) return null;
    const nearbyRows = scoresById?.[best.site?.id]?.rows;
    return calcMetrics(nearbyRows);
  }, [best, scoresById]);

  const { strength, primaryReason, primaryKey } = useMemo(
    () => classifyMetrics(currentMetrics, nearbyMetrics),
    [currentMetrics, nearbyMetrics]
  );

  const tier = showComparison ? Math.min(scoreTier(scoreDiff), metricCap(strength)) : -1;
  const isStrongOrDecent = strength === "strong" || strength === "decent";

  const deltaText = useMemo(
    () => (isStrongOrDecent ? buildDeltaText(primaryKey, currentMetrics, nearbyMetrics) : null),
    [isStrongOrDecent, primaryKey, currentMetrics, nearbyMetrics]
  );

  const comparisonFiredRef = useRef(null);
  useEffect(() => {
    if (!showComparison || !best) return;
    const key = `${best.site?.id}:${tier}`;
    if (comparisonFiredRef.current === key) return;
    comparisonFiredRef.current = key;

    const dist = best.distFromBase;
    const distanceBucket = dist < 50 ? "< 50km" : dist < 150 ? "50-150km" : "> 150km";

    trackEvent("comparison_viewed", {
      comparisonTier: BADGE_LABELS[tier] ?? "unknown",
      distanceBucket,
      recommendation: strength,
    });

    if (isStrongOrDecent) {
      trackEvent("better_nearby_found", {
        recommendation: "move",
        comparisonTier: BADGE_LABELS[tier] ?? "unknown",
        radiusKm,
      });
    }
  }, [best, tier, strength, isStrongOrDecent, showComparison, radiusKm]);

  function scrollToTop5() {
    document
      .getElementById("comparison-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("homepage_instant_comparison_cta_click");
  }

  if (!showComparison) {
    // Move state: DecisionBanner already communicates the move recommendation.
    // Do not show a contradictory stay-positive fallback.
    if (homepageRecommendation === "move") return null;

    // Consider state: neutral copy — not stay-positive, not move-alarmist.
    if (homepageRecommendation === "consider") {
      return (
        <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Veðrið er ekki hættulegt, en það gæti verið þess virði að skoða valkosti í nágrenninu.
          </div>
        </div>
      );
    }

    // Stay state: positive fallback is appropriate.
    return (
      <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Þú ert líklega á góðum stað.
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enginn nálægur staður lítur greinilega betur út næstu daga.
        </div>
      </div>
    );
  }

  const badge = BADGE_LABELS[tier];

  const badgeClass =
    tier >= 3
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : tier >= 2
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400";

  // Label always reflects actual distance; metric reasons override only when clear improvement exists
  const nearbyLabel =
    isStrongOrDecent && primaryReason ? primaryReason : distanceCategoryLabel(best.distFromBase);

  const explanatoryText =
    isStrongOrDecent
      ? "Veðrið lítur mun betur út næstu daga."
      : strength === "weak"
        ? "Þetta tjaldsvæði gæti verið aðeins betra, en munurinn er ekki mikill."
        : "Veðrið á þessum stað virðist svipað miðað við næstu 3 daga.";

  const ctaLabel = tier >= 2 ? "Skoða þennan kost" : "Skoða samanburð";

  return (
    <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <SiteCard
          label="Núverandi staður"
          name={site?.name}
          metrics={currentMetrics}
          muted
        />

        <div className="flex shrink-0 items-center justify-center gap-1.5 sm:flex-col">
          <span className="text-lg text-slate-400 dark:text-slate-500">→</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${badgeClass}`}>
            {badge}
          </span>
        </div>

        <SiteCard
          label={nearbyLabel}
          name={best.site?.name}
          metrics={nearbyMetrics}
          dist={best.distFromBase}
          highlight={isStrongOrDecent}
          deltaText={deltaText}
        />
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">{explanatoryText}</p>
        <button
          type="button"
          onClick={onCtaClick ?? scrollToTop5}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800"
        >
          {ctaLabel} →
        </button>
      </div>
    </div>
  );
}
