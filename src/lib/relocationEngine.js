// src/lib/relocationEngine.js
import { distanceKm } from "../utils/distance";
import { normalizeDailyToScoreInput } from "../lib/forecastNormalize";
import { scoreDaysWithRainStreak } from "../lib/scoring";
import { getHazardsConfig } from "../config/hazards";

/**
 * Relocation engine core (UI-independent).
 */

function toFiniteNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function clamp0to10(v) {
  const n = toFiniteNumber(v);
  if (n == null) return 0;
  return Math.max(0, Math.min(10, n));
}

function pickSiteShelter(site) {
  // Priority order of known fields
  const candidates = [site?.shelter, site?.shelterScore, site?.shelter_rating];
  for (const c of candidates) {
    const n = toFiniteNumber(c);
    if (n != null) return clamp0to10(n);
  }
  return 0;
}

function normalizeConfig(cfg = {}) {
  return {
    // scoring window
    wetThresholdMm: typeof cfg.wetThresholdMm === "number" ? cfg.wetThresholdMm : 3,

    // aggregation
    weightDecay: typeof cfg.weightDecay === "number" ? cfg.weightDecay : 0.85, // day0=1, day1=0.85, ...
    useWorstDayGuardrail:
      typeof cfg.useWorstDayGuardrail === "boolean" ? cfg.useWorstDayGuardrail : true,
    worstDayMin: typeof cfg.worstDayMin === "number" ? cfg.worstDayMin : 2, // if worst day < 2, clamp total down

    // decision (legacy; your UI decision tool may override)
    minDeltaToMove: typeof cfg.minDeltaToMove === "number" ? cfg.minDeltaToMove : 2,
    minDeltaToConsider: typeof cfg.minDeltaToConsider === "number" ? cfg.minDeltaToConsider : 1,

    // reasons
    reasonMinDelta: typeof cfg.reasonMinDelta === "number" ? cfg.reasonMinDelta : 1,
    maxReasons: Number.isInteger(cfg.maxReasons) ? cfg.maxReasons : 4,

    hazards: getHazardsConfig(cfg?.hazards),
  };
}

function dayWeights(n, decay) {
  const w = [];
  for (let i = 0; i < n; i++) w.push(Math.pow(decay, i));
  return w;
}

function sliceWindow(scoredDays, startDateISO, days) {
  const idx = scoredDays.findIndex((d) => String(d?.date ?? "").slice(0, 10) === startDateISO);
  if (idx < 0) return null;
  const slice = scoredDays.slice(idx, idx + days);
  if (!slice.length) return null;
  return slice;
}

function weightedAvg(values, weights) {
  let num = 0;
  let den = 0;
  for (let i = 0; i < values.length; i++) {
    const v = typeof values[i] === "number" && Number.isFinite(values[i]) ? values[i] : 0;
    const w = typeof weights[i] === "number" && Number.isFinite(weights[i]) ? weights[i] : 0;
    num += v * w;
    den += w;
  }
  return den > 0 ? num / den : 0;
}

function aggregateSiteWindow(windowDays, weights, cfg) {
  // ✅ clamped (UI-friendly)
  const pointsArr = windowDays.map((d) => (typeof d.points === "number" ? d.points : 0));
  const totalRawClamped = weightedAvg(pointsArr, weights);
  const worstDay = pointsArr.length ? Math.min(...pointsArr) : 0;

  const total =
    cfg.useWorstDayGuardrail && worstDay < cfg.worstDayMin
      ? Math.min(totalRawClamped, worstDay)
      : totalRawClamped;

  // ✅ raw (comparison-friendly) – can go negative
  const pointsRawArr = windowDays.map((d) =>
    typeof d.pointsRaw === "number" && Number.isFinite(d.pointsRaw) ? d.pointsRaw : 0
  );
  const totalRaw = weightedAvg(pointsRawArr, weights);

  // Aggregate components too (for reasons)
  const compKeys = ["temp", "wind", "rain", "gust", "rainStreak", "shelter"];
  const components = {};
  for (const k of compKeys) {
    const vals = windowDays.map((d) => {
      const v = d?.components?.[k];
      return typeof v === "number" && Number.isFinite(v) ? v : 0;
    });
    components[k] = weightedAvg(vals, weights);
  }

  return { total, totalRaw, worstDay, components };
}

function reasonText(type, days) {
  const n = Math.max(1, Number(days) || 1);
  const span = n === 1 ? "tomorrow" : `next ${n} days`;
  switch (type) {
    case "wind":
      return `Significantly less wind ${span}`;
    case "gust":
      return `Fewer gust spikes ${span}`;
    case "rain":
      return `Drier ${span}`;
    case "temp":
      return `Warmer ${span}`;
    case "rainStreak":
      return `Less “wet streak” risk ${span}`;
    case "shelter":
      return `Better shelter in wind ${span}`;
    default:
      return `Better conditions ${span}`;
  }
}

function buildReasons(deltaComponents, cfg, days) {
  const items = [];

  const candidates = [
    { type: "wind", delta: deltaComponents.wind },
    { type: "gust", delta: deltaComponents.gust },
    { type: "rain", delta: deltaComponents.rain },
    { type: "rainStreak", delta: deltaComponents.rainStreak },
    { type: "shelter", delta: deltaComponents.shelter },
    { type: "temp", delta: deltaComponents.temp },
  ];

  for (const c of candidates) {
    if (typeof c.delta !== "number" || !Number.isFinite(c.delta)) continue;
    if (c.delta >= cfg.reasonMinDelta) {
      items.push({
        type: c.type,
        delta: Math.round(c.delta * 10) / 10,
        text: reasonText(c.type, days),
      });
    }
  }

  items.sort((a, b) => b.delta - a.delta);
  return items.slice(0, cfg.maxReasons);
}

function computeDayWarnings(d, cfg) {
  const hz = cfg?.hazards || {};
  const out = [];

  const wind = typeof d?.windMax === "number" ? d.windMax : null;
  const gust = typeof d?.windGust === "number" ? d.windGust : null;
  const rain = typeof d?.rain === "number" ? d.rain : null;

  // NOTE: relocationEngine day objects currently have tmax, but not tmin.
  // Cold warnings should be based on tmin (night temps). Until we have tmin
  // in the engine pipeline, we intentionally SKIP tempLow warnings here to avoid inconsistency.
  const tmax = typeof d?.tmax === "number" ? d.tmax : null;

  function push(type, level, value) {
    out.push({ type, level, value });
  }

  if (wind != null) {
    if (wind >= (hz.windHigh ?? 18)) push("wind", "high", wind);
    else if (wind >= (hz.windWarn ?? 14)) push("wind", "warn", wind);
  }

  if (gust != null) {
    if (gust >= (hz.gustHigh ?? 24)) push("gust", "high", gust);
    else if (gust >= (hz.gustWarn ?? 20)) push("gust", "warn", gust);
  }

  if (rain != null) {
    if (rain >= (hz.rainHigh ?? 20)) push("rain", "high", rain);
    else if (rain >= (hz.rainWarn ?? 12)) push("rain", "warn", rain);
  }

  // Heat warnings (tmax is appropriate for heat risk)
  if (tmax != null) {
    if (tmax >= (hz.tempHighHigh ?? 28)) push("tempHigh", "high", tmax);
    else if (tmax >= (hz.tempHighWarn ?? 24)) push("tempHigh", "warn", tmax);
  }

  return out;
}

function pickExplainDay(d, cfg) {
  return {
    date: String(d?.date ?? "").slice(0, 10),

    // candidate scores
    points: d?.points ?? null,
    pointsRaw: d?.pointsRaw ?? d?.totalRaw ?? null,
    finalClass: d?.finalClass ?? null,

    // NOTE: basePts is temp-derived base, not "base site"
    basePts: d?.basePts ?? null,

    windPen: d?.windPen ?? null,
    rainPen: d?.rainPen ?? null,
    gustPen: d?.gustPen ?? null,

    rainStreak: d?.rainStreak ?? 0,
    rainStreakPen: d?.rainStreakPen ?? 0,

    tmax: d?.tmax ?? null,
    rain: d?.rain ?? null,
    windMax: d?.windMax ?? null,
    windGust: d?.windGust ?? null,

    season: d?.season ?? null,

    shelter: d?.shelter ?? null,
    shelterBonus: d?.components?.shelter ?? null,

    // injected later (for true base-site comparison)
    baseSitePoints: d?.baseSitePoints ?? null,
    baseSitePointsRaw: d?.baseSitePointsRaw ?? null,
    // ✅ NEW: base-site warnings for this date (so RouteCompareTable can show base chips)
    baseSiteWarnings: Array.isArray(d?.baseSiteWarnings) ? d.baseSiteWarnings : null,
    warnings: computeDayWarnings(d, cfg),
  };
}

function requiredDeltaForDistance(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0.5;
  if (distanceKm <= 25) return 0.5;
  if (distanceKm <= 75) return 1.5;
  if (distanceKm <= 150) return 3;
  return 5;
}

function getExplainDayDelta(d) {
  const basePts =
    typeof d?.baseSitePoints === "number"
      ? d.baseSitePoints
      : typeof d?.baseSitePointsRaw === "number"
        ? d.baseSitePointsRaw
        : 0;

  const candPts =
    typeof d?.points === "number" ? d.points : typeof d?.pointsRaw === "number" ? d.pointsRaw : 0;

  const baseRaw =
    typeof d?.baseSitePointsRaw === "number"
      ? d.baseSitePointsRaw
      : typeof d?.baseSitePoints === "number"
        ? d.baseSitePoints
        : 0;

  const candRaw =
    typeof d?.pointsRaw === "number" ? d.pointsRaw : typeof d?.points === "number" ? d.points : 0;

  const deltaPts = candPts - basePts;
  const deltaRaw = candRaw - baseRaw;

  const useRaw =
    (candPts === basePts && (candPts <= 0.0001 || candPts >= 9.9999)) ||
    Math.abs(deltaPts) < 0.0001;

  return useRaw ? deltaRaw : deltaPts;
}

function getDayCounts(windowDays, threshold = 0.75) {
  const days = Array.isArray(windowDays) ? windowDays : [];

  let betterDays = 0;
  let sameDays = 0;
  let worseDays = 0;

  for (const d of days) {
    const delta = getExplainDayDelta(d);
    if (delta > threshold) betterDays += 1;
    else if (delta < -threshold) worseDays += 1;
    else sameDays += 1;
  }

  return {
    betterDays,
    sameDays,
    worseDays,
    totalDays: days.length,
  };
}

function warningSeverityRank(warnings = []) {
  if (!Array.isArray(warnings) || warnings.length === 0) return 0;
  if (warnings.some((w) => w?.level === "high")) return 2;
  if (warnings.some((w) => w?.level === "warn")) return 1;
  return 0;
}

function hasHazardImprovement(windowDays) {
  const days = Array.isArray(windowDays) ? windowDays : [];
  return days.some((d) => {
    const baseRank = warningSeverityRank(d?.baseSiteWarnings);
    const candRank = warningSeverityRank(d?.warnings);
    return candRank < baseRank;
  });
}

function getRoughWeatherWindow(windowDays) {
  const days = Array.isArray(windowDays) ? windowDays : [];

  let bestStart = null;
  let bestEnd = null;
  let bestCount = 0;
  let bestMaxRank = 0;

  let currentStart = null;
  let currentEnd = null;
  let currentCount = 0;
  let currentMaxRank = 0;

  for (const d of days) {
    const rank = warningSeverityRank(d?.warnings);
    const isHazardDay = rank >= 1;

    if (isHazardDay) {
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

  const hasWindow = bestCount > 0;

  return {
    hasWindow,
    startDate: hasWindow ? bestStart : null,
    endDate: hasWindow ? bestEnd : null,
    dayCount: hasWindow ? bestCount : 0,
    maxSeverity: bestMaxRank >= 2 ? "high" : bestMaxRank >= 1 ? "warn" : "none",
  };
}

function getCandidateHazardBlocker(windowDays) {
  const days = Array.isArray(windowDays) ? windowDays : [];

  let candidateHasHighHazardDay = false;
  let baseHasSameOrWorseHazardSameDay = false;
  let candidateOnlyHighHazardDay = false;

  for (const d of days) {
    const candRank = warningSeverityRank(d?.warnings);
    const baseRank = warningSeverityRank(d?.baseSiteWarnings);

    // We only care about candidate HIGH hazard days here
    if (candRank < 2) continue;

    candidateHasHighHazardDay = true;

    if (baseRank >= candRank) {
      baseHasSameOrWorseHazardSameDay = true;
    } else {
      candidateOnlyHighHazardDay = true;
    }
  }

  let triggered = false;
  let blockerMode = null;
  let reasonKey = null;

  if (candidateOnlyHighHazardDay) {
    triggered = true;
    blockerMode = "stay";
    reasonKey = "routeHazardBlockerStay";
  } else if (candidateHasHighHazardDay) {
    triggered = true;
    blockerMode = "consider";
    reasonKey = "routeHazardBlockerConsider";
  }

  return {
    triggered,
    blockerMode,
    reasonKey,
    candidateHasHighHazardDay,
    baseHasSameOrWorseHazardSameDay,
    candidateOnlyHighHazardDay,
  };
}

function decideCandidate({ windowDays, deltaVsBase, distanceKm }) {
  const counts = getDayCounts(windowDays, 0.75);
  const requiredDelta = requiredDeltaForDistance(distanceKm);
  const hazardImproved = hasHazardImprovement(windowDays);
  const hazardBlocker = getCandidateHazardBlocker(windowDays);
  const roughWeatherWindow = getRoughWeatherWindow(windowDays);

  const allDaysSame = counts.betterDays === 0 && counts.worseDays === 0;
  const hasPositiveDelta = typeof deltaVsBase === "number" && deltaVsBase > 0;

  let recommendation = "stay";
  let aggregateType = "same";
  let aggregateKey = "routeDaySame";

  if (counts.worseDays > counts.betterDays) {
    recommendation = "stay";
    aggregateType = "same";
    aggregateKey = "routeDaySame";
  } else if (allDaysSame) {
    recommendation = "stay";
    aggregateType = hasPositiveDelta ? "slight" : "same";
    aggregateKey = hasPositiveDelta ? "routeAggregateSlight" : "routeDaySame";
  } else if (hazardImproved) {
    if (counts.betterDays >= 2 && hasPositiveDelta) {
      recommendation = "move";
      aggregateType = "better";
      aggregateKey = "routeAggregateBetter";
    } else {
      recommendation = "consider";
      aggregateType = "slight";
      aggregateKey = "routeAggregateSlight";
    }
  } else if (!hasPositiveDelta || deltaVsBase < requiredDelta) {
    recommendation = "stay";
    aggregateType = hasPositiveDelta ? "slight" : "same";
    aggregateKey = hasPositiveDelta ? "routeAggregateSlight" : "routeDaySame";
  } else if (counts.betterDays >= 2 && counts.betterDays > counts.worseDays) {
    recommendation = "move";
    aggregateType = "better";
    aggregateKey = "routeAggregateBetter";
  } else if (counts.betterDays > counts.worseDays) {
    recommendation = "consider";
    aggregateType = "slight";
    aggregateKey = "routeAggregateSlight";
  }

  // Ticket #135: candidate high-hazard blocker
  if (hazardBlocker.candidateOnlyHighHazardDay) {
    recommendation = "stay";
    aggregateType = "same";
    aggregateKey = "routeDaySame";
  } else if (hazardBlocker.candidateHasHighHazardDay && recommendation === "move") {
    recommendation = "consider";
    aggregateType = "slight";
    aggregateKey = "routeAggregateSlight";
  }

  const recommendationRank =
    recommendation === "move"
      ? 3
      : recommendation === "consider"
        ? 2
        : aggregateType === "slight"
          ? 1
          : 0;

  return {
    ...counts,
    requiredDelta,
    hazardImproved,
    roughWeatherWindow,

    recommendation,
    aggregateType,
    aggregateKey,
    recommendationRank,

    hazardBlocked: hazardBlocker.triggered,
    hazardBlockMode: hazardBlocker.blockerMode,
    hazardBlockReasonKey: hazardBlocker.reasonKey,
    candidateHasHighHazardDay: hazardBlocker.candidateHasHighHazardDay,
    baseHasSameOrWorseHazardSameDay: hazardBlocker.baseHasSameOrWorseHazardSameDay,
  };
}

export function relocationEngine(input) {
  const baseSiteId = String(input?.baseSiteId ?? "");
  const radiusKm = Number.isFinite(input?.radiusKm) ? input.radiusKm : 50;
  const startDateISO = String(input?.startDateISO ?? "").slice(0, 10);
  const days = Number.isInteger(input?.days) ? input.days : 3;

  const campsites = Array.isArray(input?.campsites) ? input.campsites : [];
  const forecastMap = input?.forecastMap || {};
  const cfg = normalizeConfig(input?.config);

  if (!baseSiteId) throw new Error("baseSiteId is required");
  if (!startDateISO) throw new Error("startDateISO is required");
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) throw new Error("radiusKm must be > 0");
  if (!Number.isInteger(days) || days <= 0) throw new Error("days must be >= 1");

  const byId = new Map(campsites.map((s) => [s.id, s]));
  const base = byId.get(baseSiteId);
  if (!base) throw new Error("Base site not found");

  const weights = dayWeights(days, cfg.weightDecay);

  function scoreOneSite(site) {
    const raw = forecastMap?.[site.id];
    const daily = raw?.daily ?? raw; // allow passing either {daily:{...}} or {time:...} directly
    const normalized = normalizeDailyToScoreInput(daily);
    if (!normalized.length) return null;

    const shelter = pickSiteShelter(site);
    const daysWithShelter = normalized.map((d) => ({ ...d, shelter }));

    const scored = scoreDaysWithRainStreak(daysWithShelter, { wetThresholdMm: cfg.wetThresholdMm });
    const windowDays = sliceWindow(scored, startDateISO, days);
    if (!windowDays) return null;

    const agg = aggregateSiteWindow(windowDays, weights, cfg);

    return {
      total: agg.total, // clamped (UI-friendly)
      totalRaw: agg.totalRaw, // raw (comparison-friendly)
      worstDay: agg.worstDay,
      components: agg.components,
      windowDays,
      shelter,
    };
  }

  // Base score
  const baseScore = scoreOneSite(base);
  const baseTotal = baseScore?.total ?? 0;
  const baseTotalRaw = baseScore?.totalRaw ?? 0;

  // ✅ Map base-site by date so candidates can compare per day
  const baseByDate = new Map(
    (baseScore?.windowDays || []).map((d) => {
      const dateKey = String(d?.date ?? "").slice(0, 10);

      const points = typeof d?.points === "number" ? d.points : 0;
      const pointsRaw =
        typeof d?.pointsRaw === "number"
          ? d.pointsRaw
          : typeof d?.totalRaw === "number"
            ? d.totalRaw
            : 0;

      // ✅ NEW: compute base-site warnings for this day (same logic as candidate)
      const warnings = computeDayWarnings(d, cfg);

      return [dateKey, { points, pointsRaw, warnings }];
    })
  );

  // Preselect candidates within radius
  const candidates = campsites
    .filter((s) => s && s.id && s.id !== baseSiteId)
    .map((s) => ({ site: s, d: distanceKm(base, s) }))
    .filter(({ d }) => Number.isFinite(d) && d <= radiusKm)
    .sort((a, b) => a.d - b.d);

  const ranked = [];
  const explainCandidates = {};

  for (const { site, d } of candidates) {
    const sc = scoreOneSite(site);
    if (!sc) continue;

    // ✅ Use RAW for delta so it doesn't flatline at 0 when both clamp to 0
    const deltaVsBase = sc.totalRaw - baseTotalRaw;

    const deltaComponents = {};
    const compKeys = ["temp", "wind", "rain", "gust", "rainStreak", "shelter"];
    for (const k of compKeys) {
      const cVal = typeof sc.components?.[k] === "number" ? sc.components[k] : 0;
      const bVal = typeof baseScore?.components?.[k] === "number" ? baseScore.components[k] : 0;
      deltaComponents[k] = cVal - bVal;
    }

    const reasons = buildReasons(deltaComponents, cfg, days);

    // ✅ Inject base-site points per date into each candidate day
    const windowDaysExplained = sc.windowDays.map((day) => {
      const dateKey = String(day?.date ?? "").slice(0, 10);
      const baseDay = baseByDate.get(dateKey) || { points: 0, pointsRaw: 0, warnings: [] };

      return pickExplainDay(
        {
          ...day,

          // base-site points
          baseSitePoints: baseDay.points,
          baseSitePointsRaw: baseDay.pointsRaw,

          // ✅ NEW: base-site warnings for the same date
          baseSiteWarnings: baseDay.warnings,
        },
        cfg
      );
    });

    // aggregate warning flags for the candidate
    const hasHighWarning = windowDaysExplained.some(
      (d) => Array.isArray(d?.warnings) && d.warnings.some((w) => w?.level === "high")
    );

    const hasWarning = windowDaysExplained.some(
      (d) => Array.isArray(d?.warnings) && d.warnings.some((w) => w?.level === "warn")
    );

    const decision = decideCandidate({
      windowDays: windowDaysExplained,
      deltaVsBase,
      distanceKm: d,
    });

    const row = {
      siteId: site.id,
      siteName: site.name,
      distanceKm: d,

      hasWarning,
      hasHighWarning,

      total: sc.total,
      totalRaw: sc.totalRaw,
      deltaVsBase,

      worstDay: sc.worstDay,
      reasons,
      windowDays: windowDaysExplained,

      betterDays: decision.betterDays,
      sameDays: decision.sameDays,
      worseDays: decision.worseDays,
      requiredDelta: decision.requiredDelta,
      hazardImproved: decision.hazardImproved,
      roughWeatherWindow: decision.roughWeatherWindow,

      hazardBlocked: decision.hazardBlocked,
      hazardBlockMode: decision.hazardBlockMode,
      hazardBlockReasonKey: decision.hazardBlockReasonKey,
      candidateHasHighHazardDay: decision.candidateHasHighHazardDay,
      baseHasSameOrWorseHazardSameDay: decision.baseHasSameOrWorseHazardSameDay,

      recommendation: decision.recommendation,
      aggregateType: decision.aggregateType,
      aggregateKey: decision.aggregateKey,
      recommendationRank: decision.recommendationRank,
    };

    ranked.push(row);

    explainCandidates[site.id] = {
      total: sc.total,
      totalRaw: sc.totalRaw,
      deltaVsBase,
      worstDay: sc.worstDay,
      windowDays: row.windowDays,

      betterDays: row.betterDays,
      sameDays: row.sameDays,
      worseDays: row.worseDays,
      requiredDelta: row.requiredDelta,
      hazardImproved: row.hazardImproved,
      roughWeatherWindow: row.roughWeatherWindow,

      hazardBlocked: row.hazardBlocked,
      hazardBlockMode: row.hazardBlockMode,
      hazardBlockReasonKey: row.hazardBlockReasonKey,
      candidateHasHighHazardDay: row.candidateHasHighHazardDay,
      baseHasSameOrWorseHazardSameDay: row.baseHasSameOrWorseHazardSameDay,

      recommendation: row.recommendation,
      aggregateType: row.aggregateType,
      aggregateKey: row.aggregateKey,
    };
  }

  ranked.sort((a, b) => {
    if ((b.recommendationRank ?? 0) !== (a.recommendationRank ?? 0)) {
      return (b.recommendationRank ?? 0) - (a.recommendationRank ?? 0);
    }
    if ((b.hazardImproved ? 1 : 0) !== (a.hazardImproved ? 1 : 0)) {
      return (b.hazardImproved ? 1 : 0) - (a.hazardImproved ? 1 : 0);
    }
    if (b.deltaVsBase !== a.deltaVsBase) return b.deltaVsBase - a.deltaVsBase;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (b.totalRaw !== a.totalRaw) return b.totalRaw - a.totalRaw;
    if (b.total !== a.total) return b.total - a.total;
    return String(a.siteId).localeCompare(String(b.siteId));
  });

  const best = ranked.length ? ranked[0] : null;
  const bestSiteId = best?.siteId ?? null;

  const bestTotal = best?.total ?? baseTotal;
  const bestTotalRaw = best?.totalRaw ?? baseTotalRaw;
  const delta = best?.deltaVsBase ?? bestTotalRaw - baseTotalRaw;

  const bestRecommendation = String(best?.recommendation || "stay").toLowerCase();

  let verdict = "STAY";
  if (bestRecommendation === "move") verdict = "MOVE";
  else if (bestRecommendation === "consider") verdict = "CONSIDER";

  const stayRecommended = verdict !== "MOVE";

  return {
    verdict,
    baseSiteId,
    startDateISO,
    days,
    radiusKm,

    // keep both
    baseTotal,
    baseTotalRaw,
    bestSiteId,
    bestTotal,
    bestTotalRaw,

    delta,
    stayRecommended,

    recommendation: bestRecommendation,
    aggregateType: best?.aggregateType ?? "same",
    aggregateKey: best?.aggregateKey ?? "routeDaySame",
    betterDays: best?.betterDays ?? 0,
    sameDays: best?.sameDays ?? 0,
    worseDays: best?.worseDays ?? 0,
    requiredDelta: best?.requiredDelta ?? 0,
    hazardImproved: !!best?.hazardImproved,

    ranked,

    explain: {
      base: {
        siteId: baseSiteId,
        total: baseTotal,
        totalRaw: baseTotalRaw,
        worstDay: baseScore?.worstDay ?? 0,
        windowDays: (baseScore?.windowDays || []).map((d) => pickExplainDay(d, cfg)),
      },
      candidates: explainCandidates,
    },

    debug: {
      candidatesPreselected: candidates.length,
      candidatesScored: ranked.length,
    },
  };
}
