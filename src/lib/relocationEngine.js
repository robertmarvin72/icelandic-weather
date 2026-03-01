// src/lib/relocationEngine.js
import { distanceKm } from "../utils/distance";
import { normalizeDailyToScoreInput } from "../lib/forecastNormalize";
import { scoreDaysWithRainStreak } from "../lib/scoring";

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

function pickExplainDay(d) {
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
    (baseScore?.windowDays || []).map((d) => [
      String(d?.date ?? "").slice(0, 10),
      {
        points: typeof d?.points === "number" ? d.points : 0,
        pointsRaw:
          typeof d?.pointsRaw === "number"
            ? d.pointsRaw
            : typeof d?.totalRaw === "number"
              ? d.totalRaw
              : 0,
      },
    ])
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
      const baseDay = baseByDate.get(dateKey) || { points: 0, pointsRaw: 0 };
      return pickExplainDay({
        ...day,
        baseSitePoints: baseDay.points,
        baseSitePointsRaw: baseDay.pointsRaw,
      });
    });

    const row = {
      siteId: site.id,
      siteName: site.name,
      distanceKm: d,

      // keep both for debugging/UX
      total: sc.total,
      totalRaw: sc.totalRaw,

      // legacy field used across UI: make it meaningful again
      deltaVsBase,

      worstDay: sc.worstDay,
      reasons,
      windowDays: windowDaysExplained,
    };

    ranked.push(row);

    explainCandidates[site.id] = {
      total: sc.total,
      totalRaw: sc.totalRaw,
      deltaVsBase,
      worstDay: sc.worstDay,
      windowDays: row.windowDays,
    };
  }

  ranked.sort((a, b) => {
    // ✅ sort by raw first (comparison-friendly), then distance
    if (b.totalRaw !== a.totalRaw) return b.totalRaw - a.totalRaw;
    if (b.total !== a.total) return b.total - a.total;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    return String(a.siteId).localeCompare(String(b.siteId));
  });

  const best = ranked.length ? ranked[0] : null;
  const bestSiteId = best?.siteId ?? null;

  // Use RAW delta for the engine verdict too (more honest signal)
  const bestTotal = best?.total ?? baseTotal;
  const bestTotalRaw = best?.totalRaw ?? baseTotalRaw;

  const delta = bestTotalRaw - baseTotalRaw;

  let verdict = "STAY";
  if (delta >= cfg.minDeltaToMove) verdict = "MOVE";
  else if (delta >= cfg.minDeltaToConsider) verdict = "CONSIDER";

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

    ranked,

    explain: {
      base: {
        siteId: baseSiteId,
        total: baseTotal,
        totalRaw: baseTotalRaw,
        worstDay: baseScore?.worstDay ?? 0,
        windowDays: (baseScore?.windowDays || []).map((d) => pickExplainDay(d)),
      },
      candidates: explainCandidates,
    },

    debug: {
      candidatesPreselected: candidates.length,
      candidatesScored: ranked.length,
    },
  };
}
