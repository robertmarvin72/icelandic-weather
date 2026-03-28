const VERDICT_THRESHOLD = 0.75;

export function fmt(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toFixed(digits);
}

export function signFmt(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const v = Number(n);
  const s = v > 0 ? "+" : "";
  return `${s}${v.toFixed(digits)}`;
}

export function interpolate(template, vars) {
  if (typeof template !== "string") return "";
  let out = template;
  for (const [k, v] of Object.entries(vars || {})) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function translateOrFallback(t, key, fallback) {
  const value = t?.(key);

  if (!value || value === key) {
    if (import.meta.env.DEV) {
      console.warn("Missing translation:", key);
    }
    return fallback;
  }

  return value;
}

export function getHazardWindowNarrative(candidate, t) {
  const hw = candidate?.hazardWindow;
  if (!hw?.type) return null;

  switch (hw.type) {
    case "passingStorm":
      return t?.("routeHazardWindowPassingStorm") || "A short passing storm is expected.";
    case "roughWeather":
      return t?.("routeHazardWindowRoughWeather") || "Rough weather may persist for several hours.";
    case "stormyPeriod":
      return (
        t?.("routeHazardWindowStormyPeriod") || "A longer stormy period is expected in this window."
      );
    default:
      return null;
  }
}

export function getVerdict(deltaDay) {
  if (deltaDay > VERDICT_THRESHOLD) return "better";
  if (deltaDay < -VERDICT_THRESHOLD) return "worse";
  return "same";
}

export function getOverallVerdict({ aggregateType, betterCount, worseCount }) {
  if (aggregateType === "better") return "better";
  if (worseCount > betterCount) return "worse";
  return "same";
}

export function getOverallVerdictLabel({ aggregateType, verdict, t }) {
  if (aggregateType === "slight") {
    return t?.("routeAggregateSlight") || "Lítil heildarbæting";
  }
  if (verdict === "better") return t?.("routeDayBetter") || "Betra";
  if (verdict === "worse") return t?.("routeDayWorse") || "Lakara";
  return t?.("routeDaySame") || "Svipað";
}

export function getVerdictPillClass({ aggregateType, verdict }) {
  if (aggregateType === "slight") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200";
  }
  if (verdict === "better") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
  if (verdict === "worse") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200";
  }
  return "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";
}

export function getBasePts(day) {
  if (typeof day?.baseSitePoints === "number") return day.baseSitePoints;
  if (typeof day?.baseSitePointsRaw === "number") return day.baseSitePointsRaw;
  return 0;
}

export function getCandPts(day) {
  if (typeof day?.points === "number") return day.points;
  if (typeof day?.pointsRaw === "number") return day.pointsRaw;
  return 0;
}

export function getDayDelta(day) {
  const basePts =
    typeof day?.baseSitePoints === "number"
      ? day.baseSitePoints
      : typeof day?.baseSitePointsRaw === "number"
        ? day.baseSitePointsRaw
        : 0;

  const candPts =
    typeof day?.points === "number"
      ? day.points
      : typeof day?.pointsRaw === "number"
        ? day.pointsRaw
        : 0;

  const baseRaw =
    typeof day?.baseSitePointsRaw === "number"
      ? day.baseSitePointsRaw
      : typeof day?.baseSitePoints === "number"
        ? day.baseSitePoints
        : 0;

  const candRaw =
    typeof day?.pointsRaw === "number"
      ? day.pointsRaw
      : typeof day?.points === "number"
        ? day.points
        : 0;

  const deltaPts = candPts - basePts;
  const deltaRaw = candRaw - baseRaw;

  const useRaw =
    (candPts === basePts && (candPts <= 0.0001 || candPts >= 9.9999)) ||
    Math.abs(deltaPts) < 0.0001;

  return useRaw ? deltaRaw : deltaPts;
}

export function buildVerdictRows(days) {
  return days.map((day) => {
    const basePts = getBasePts(day);
    const candPts = getCandPts(day);
    const delta = getDayDelta(day);

    return {
      date: day?.date || "—",
      delta,
      verdict: getVerdict(delta),
      basePts,
      candPts,
      raw: day,
    };
  });
}

export function getWarningTypeLabel(type, t) {
  switch (type) {
    case "wind":
      return translateOrFallback(t, "routeWarnTypeWind", "Vindur");
    case "gust":
      return translateOrFallback(t, "routeWarnTypeGust", "Hviður");
    case "rain":
      return translateOrFallback(t, "routeWarnTypeRain", "Rigning");
    case "tempLow":
      return translateOrFallback(t, "routeWarnTypeTempLow", "Kuldi");
    case "tempHigh":
      return translateOrFallback(t, "routeWarnTypeTempHigh", "Hiti");
    default:
      return type || "—";
  }
}

export function getWarningBadges(warnings, t) {
  if (!Array.isArray(warnings) || warnings.length === 0) return [];

  return warnings.map((warning, idx) => {
    const label = getWarningTypeLabel(warning.type, t);

    return {
      key: `${warning.type}_${idx}`,
      label,
      icon: warning.level === "high" ? "🚨" : "⚠️",
      className:
        warning.level === "high"
          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
      title: `${label}: ${fmt(warning.value, 0)}`,
    };
  });
}

export function getHazardBlockInfo(candidate, t) {
  const text =
    candidate?.hazardBlocked && candidate?.hazardBlockMode === "stay"
      ? t?.("routeHazardBlockerStay") ||
        "Veðuráhætta á einum degi kemur í veg fyrir flutningsráðleggingu."
      : candidate?.hazardBlocked && candidate?.hazardBlockMode === "consider"
        ? t?.("routeHazardBlockerConsider") ||
          "Veðuráhætta á einum degi dregur úr styrk ráðleggingar."
        : null;

  const className =
    candidate?.hazardBlockMode === "stay"
      ? "text-rose-700 dark:text-rose-300 font-semibold"
      : "text-amber-700 dark:text-amber-300";

  return { text, className };
}

export function getRouteRiskSummary(routeRiskData, t) {
  if (!routeRiskData || routeRiskData.routeRisk === "LOW") return null;

  const level =
    routeRiskData.routeRisk === "HIGH"
      ? t?.("routeRiskHigh") || "Mikil"
      : routeRiskData.routeRisk === "MED"
        ? t?.("routeRiskMed") || "Miðlungs"
        : t?.("routeRiskLow") || "Lág";

  const tooltip =
    routeRiskData.routeRisk === "HIGH"
      ? t?.("routeRiskHighTooltip") || "Difficult driving conditions along the route"
      : routeRiskData.routeRisk === "MED"
        ? t?.("routeRiskMedTooltip") || "Some wind-related driving risk along the route"
        : null;

  return { level, tooltip };
}
