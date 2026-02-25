// src/lib/relocationEngine.js
import { distanceKm } from "../utils/distance";
import { normalizeDailyToScoreInput } from "../lib/forecastNormalize";
import { scoreDaysWithRainStreak } from "../lib/scoring";

/**
 * Relocation engine core (UI-independent).
 *
 * API:
 * relocationEngine({
 *   baseSiteId,
 *   radiusKm,
 *   startDateISO,
 *   days,
 *   campsites,
 *   forecastMap,
 *   config
 * }) => RelocationOutput
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

    // decision
    minDeltaToMove: typeof cfg.minDeltaToMove === "number" ? cfg.minDeltaToMove : 2, // matches your MOVE threshold vibe
    minDeltaToConsider: typeof cfg.minDeltaToConsider === "number" ? cfg.minDeltaToConsider : 1,

    // reasons
    reasonMinDelta: typeof cfg.reasonMinDelta === "number" ? cfg.reasonMinDelta : 1, // show reason if >= 1pt swing
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
  const pointsArr = windowDays.map((d) => (typeof d.points === "number" ? d.points : 0));
  const totalRaw = weightedAvg(pointsArr, weights);

  const worstDay = pointsArr.length ? Math.min(...pointsArr) : 0;

  // Worst-day guardrail: if you have one atrocious day, don’t “average it away”
  const total =
    cfg.useWorstDayGuardrail && worstDay < cfg.worstDayMin
      ? Math.min(totalRaw, worstDay)
      : totalRaw;

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

  // Interpreting deltas:
  // components are already “goodness” oriented in your scoring shape:
  // temp positive, wind/rain/gust typically negative penalties (so “less penalty” => higher component value).
  const candidates = [
    { type: "wind", delta: deltaComponents.wind },
    { type: "gust", delta: deltaComponents.gust },
    { type: "rain", delta: deltaComponents.rain },
    { type: "rainStreak", delta: deltaComponents.rainStreak },
    { type: "shelter", delta: deltaComponents.shelter },
    { type: "temp", delta: deltaComponents.temp },
  ];

  // Keep only meaningful improvements
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

  // Sort by biggest improvement first
  items.sort((a, b) => b.delta - a.delta);

  return items.slice(0, cfg.maxReasons);
}

function pickExplainDay(d) {
  return {
    date: String(d?.date ?? "").slice(0, 10),
    points: d?.points ?? null,
    finalClass: d?.finalClass ?? null,

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
  };
}

/**
 * @returns {{
 *   verdict: "MOVE" | "STAY" | "CONSIDER",
 *   baseSiteId: string,
 *   startDateISO: string,
 *   days: number,
 *   radiusKm: number,
 *   baseTotal: number,
 *   bestSiteId: string | null,
 *   bestTotal: number,
 *   delta: number,
 *   stayRecommended: boolean,
 *   ranked: Array<{
 *     siteId: string,
 *     siteName?: string,
 *     distanceKm: number,
 *     total: number,
 *     deltaVsBase: number,
 *     worstDay: number,
 *     reasons: Array<{type:string, delta:number, text:string}>,
 *     windowDays: Array<any>,
 *   }>,
 *   explain: {
 *     base: { siteId: string, total: number, worstDay: number, windowDays: Array<any> },
 *     candidates: Record<string, { total:number, deltaVsBase:number, worstDay:number, windowDays:Array<any> }>
 *   },
 *   debug: {
 *     candidatesPreselected: number,
 *     candidatesScored: number,
 *   }
 * }}
 */
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
      total: agg.total,
      totalRaw: agg.totalRaw,
      worstDay: agg.worstDay,
      components: agg.components,
      windowDays,
      shelter,
    };
  }

  // Base score
  const baseScore = scoreOneSite(base);
  const baseTotal = baseScore?.total ?? 0;

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

    const deltaVsBase = sc.total - baseTotal;

    const deltaComponents = {};
    const compKeys = ["temp", "wind", "rain", "gust", "rainStreak", "shelter"];
    for (const k of compKeys) {
      const cVal = typeof sc.components?.[k] === "number" ? sc.components[k] : 0;
      const bVal = typeof baseScore?.components?.[k] === "number" ? baseScore.components[k] : 0;
      deltaComponents[k] = cVal - bVal;
    }

    const reasons = buildReasons(deltaComponents, cfg, days);

    const row = {
      siteId: site.id,
      siteName: site.name,
      distanceKm: d,
      total: sc.total,
      deltaVsBase,
      worstDay: sc.worstDay,
      reasons,
      windowDays: sc.windowDays.map(pickExplainDay),
    };

    ranked.push(row);

    explainCandidates[site.id] = {
      total: sc.total,
      deltaVsBase,
      worstDay: sc.worstDay,
      windowDays: row.windowDays,
    };
  }

  ranked.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.distanceKm - b.distanceKm;
  });

  const best = ranked.length ? ranked[0] : null;
  const bestSiteId = best?.siteId ?? null;
  const bestTotal = best?.total ?? baseTotal;
  const delta = bestTotal - baseTotal;

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

    baseTotal,
    bestSiteId,
    bestTotal,
    delta,

    stayRecommended,

    ranked,

    explain: {
      base: {
        siteId: baseSiteId,
        total: baseTotal,
        worstDay: baseScore?.worstDay ?? 0,
        windowDays: (baseScore?.windowDays || []).map(pickExplainDay),
      },
      candidates: explainCandidates,
    },

    debug: {
      candidatesPreselected: candidates.length,
      candidatesScored: ranked.length,
    },
  };
}
