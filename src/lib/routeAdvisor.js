// src/lib/routeAdvisor.js
import { distanceKm } from "../utils/distance";
import { getForecast } from "../lib/forecastCache";
import { normalizeDailyToScoreInput } from "../lib/forecastNormalize";
import { scoreDaysWithRainStreak } from "../lib/scoring";

/**
 * Normalizes different score shapes into a single numeric value.
 * Supports:
 *  - number
 *  - { tomorrow: number }
 *  - { tomorrowScore: number }
 *  - { score: number }
 *  - nested { tomorrow: { score: number } }
 */
function readScore(v) {
  if (v == null) return null;

  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }

  if (typeof v === "object") {
    // direct numeric props
    for (const x of [v.tomorrow, v.tomorrowScore, v.score]) {
      if (typeof x === "number" && Number.isFinite(x)) {
        return x;
      }
    }

    // nested objects containing { score }
    for (const x of [v.tomorrow, v.tomorrowScore, v.score]) {
      if (x && typeof x === "object") {
        const s = x.score;
        if (typeof s === "number" && Number.isFinite(s)) {
          return s;
        }
      }
    }
  }

  return null;
}

/**
 * Pure recommendation engine (V1).
 *
 * @param {string} baseSiteId
 * @param {Object} scoresById
 * @param {Array} sites
 * @param {number} radiusKm (default 50)
 *
 * @returns {{
 *   verdict: "stay" | "consider" | "move",
 *   currentScore: number,
 *   bestSiteId: string | null,
 *   bestScore: number,
 *   delta: number,
 *   radiusKmUsed: number,
 *   candidatesConsidered: number
 * }}
 */
export function getTomorrowRecommendation(baseSiteId, scoresById, sites, radiusKm = 50) {
  const byId = new Map((sites || []).map((s) => [s.id, s]));
  const base = byId.get(baseSiteId);

  if (!base) {
    throw new Error("Base site not found");
  }

  const currentScore = readScore(scoresById?.[baseSiteId]) ?? 0;

  let bestSiteId = null;
  let bestAltScore = null;
  let candidatesConsidered = 0;

  for (const s of sites || []) {
    if (!s || s.id === baseSiteId) continue;

    const d = distanceKm(base, s);
    if (!Number.isFinite(d) || d > radiusKm) continue;

    const sc = readScore(scoresById?.[s.id]);
    if (sc == null) continue;

    candidatesConsidered++;

    if (bestAltScore == null || sc > bestAltScore) {
      bestAltScore = sc;
      bestSiteId = s.id;
    }
  }

  const bestScore = bestAltScore ?? currentScore;
  const delta = bestScore - currentScore;

  let verdict = "stay";
  if (delta === 1) verdict = "consider";
  else if (delta >= 2) verdict = "move";

  return {
    verdict,
    currentScore,
    bestSiteId,
    bestScore,
    delta,
    radiusKmUsed: radiusKm,
    candidatesConsidered,
  };
}

function tomorrowISODate() {
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return t.toISOString().slice(0, 10);
}

function pickDayExplain(d) {
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

    // raw inputs used (helps UI + debugging)
    tmax: d?.tmax ?? null,
    rain: d?.rain ?? null,
    windMax: d?.windMax ?? null,
    windGust: d?.windGust ?? null,

    season: d?.season ?? null,

    shelter: d?.shelter ?? null,
    shelterBonus: d?.components?.shelter ?? null,
  };
}

// ── Shelter hardening helpers (Ticket #108) --------------------------------

function toFiniteNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function clamp01to10(v) {
  const n = toFiniteNumber(v);
  if (n == null) return 0;
  return Math.max(0, Math.min(10, n));
}

function pickSiteShelter(site) {
  // Try known fields in priority order; accept numbers or numeric strings.
  const candidates = [site?.shelter, site?.shelterScore, site?.shelter_rating];

  for (const c of candidates) {
    const n = toFiniteNumber(c);
    if (n != null) return clamp01to10(n);
  }

  return 0;
}

async function getScoredWindowForSite(site, opts) {
  const { windowDays = 3, wetThresholdMm = 3, targetDateISO, getForecastFn } = opts || {};
  if (!site || !targetDateISO) return null;

  const fetcher = typeof getForecastFn === "function" ? getForecastFn : getForecast;

  try {
    const raw = await fetcher({ lat: site.lat, lon: site.lon });
    const days = normalizeDailyToScoreInput(raw?.daily);
    if (!days.length) return null;

    // --- Shelter injection (Ticket #108) ---
    // Always a number, always clamped 0..10, preserves 0 (no falsy bug).
    const siteShelter = pickSiteShelter(site);

    const daysWithShelter = days.map((d) => ({
      ...d,
      shelter: siteShelter, // 0..10 expected by scoring.js
    }));

    const scoredDays = scoreDaysWithRainStreak(daysWithShelter, {
      wetThresholdMm,
    });

    const idx = scoredDays.findIndex((d) => String(d.date).slice(0, 10) === targetDateISO);
    if (idx < 0) return null;

    const slice = scoredDays.slice(idx, idx + windowDays);
    if (!slice.length) return null;

    const windowAvg = slice.reduce((s, d) => s + (d.points ?? 0), 0) / slice.length;

    const dayScore = scoredDays[idx]?.points ?? 0;
    const rainStreakLen = scoredDays[idx]?.rainStreak ?? 0;
    const rainStreakPen = scoredDays[idx]?.rainStreakPen ?? 0;

    return {
      windowAvg,
      dayScore,
      rainStreakLen,
      rainStreakPen,

      // Explainability: only the selected window (not the whole week)
      windowDaysSlice: slice.map(pickDayExplain),
    };
  } catch (e) {
    // Swallow per-site forecast failures so Route Planner stays resilient
    return null;
  }
}

/**
 * Async relocation recommendation engine (multi-day + rain streak) + explainability.
 *
 * Notes:
 * - Only intended for Route Planner/Advisor; does not alter Top5/Forecast scoring unless used there.
 * - Performance: preselect nearest candidates (default 30) before fetching forecasts.
 *
 * opts:
 * - radiusKm (default 50)
 * - windowDays (default 3)
 * - wetThresholdMm (default 3)
 * - limit (default 30)  // nearest preselect
 * - topN (default 3)    // explainability list
 * - getForecastFn (optional for tests)
 */
export async function getRouteRecommendationV2(baseSiteId, sites, opts = {}) {
  const targetDateISO = tomorrowISODate();

  const radiusKm = Number.isFinite(opts.radiusKm) ? opts.radiusKm : 50;
  const windowDays = Number.isInteger(opts.windowDays) ? opts.windowDays : 3;
  const wetThresholdMm = typeof opts.wetThresholdMm === "number" ? opts.wetThresholdMm : 3;
  const limit = Number.isInteger(opts.limit) ? opts.limit : 30;
  const topN = Number.isInteger(opts.topN) ? opts.topN : 3;

  const getForecastFn = typeof opts.getForecastFn === "function" ? opts.getForecastFn : null;

  const byId = new Map((sites || []).map((s) => [s.id, s]));
  const base = byId.get(baseSiteId);
  if (!base) throw new Error("Base site not found");

  // Score base site (safe)
  const baseRes = await getScoredWindowForSite(base, {
    windowDays,
    wetThresholdMm,
    targetDateISO,
    getForecastFn,
  });

  const currentScore = baseRes?.windowAvg ?? 0;

  // Preselect nearest candidates within radius (performance)
  const candidates = (sites || [])
    .filter((s) => s && s.id !== baseSiteId)
    .map((s) => ({ site: s, d: distanceKm(base, s) }))
    .filter(({ d }) => Number.isFinite(d) && d <= radiusKm)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit);

  let candidatesConsidered = 0;

  // Collect scored results so we can pick top 3 + explain them
  const scoredResults = [];

  for (const { site: s, d } of candidates) {
    const res = await getScoredWindowForSite(s, {
      windowDays,
      wetThresholdMm,
      targetDateISO,
      getForecastFn,
    });
    if (!res) continue;

    candidatesConsidered++;

    scoredResults.push({
      siteId: s.id,
      siteName: s.name,
      distanceKm: d,
      windowAvg: res.windowAvg,
      dayScore: res.dayScore,
      rainStreakLen: res.rainStreakLen,
      rainStreakPen: res.rainStreakPen,
      windowDaysSlice: res.windowDaysSlice,
    });
  }

  // Sort best first (by windowAvg), tie-breaker closer distance
  scoredResults.sort((a, b) => {
    if (b.windowAvg !== a.windowAvg) return b.windowAvg - a.windowAvg;
    return a.distanceKm - b.distanceKm;
  });

  const top = scoredResults.slice(0, Math.max(0, topN));

  const bestAlt = top.length ? top[0] : null;
  const bestSiteId = bestAlt?.siteId ?? null;
  const bestScore = bestAlt?.windowAvg ?? currentScore;
  const delta = bestScore - currentScore;

  let verdict = "stay";
  if (delta >= 1 && delta < 2) verdict = "consider";
  else if (delta >= 2) verdict = "move";

  // Explainability payload (only base + topN)
  const explainCandidates = {};
  for (const x of top) {
    explainCandidates[x.siteId] = {
      windowAvg: x.windowAvg,
      distanceKm: x.distanceKm,
      windowDays: x.windowDaysSlice,
      meta: {
        dayScore: x.dayScore,
        rainStreakLen: x.rainStreakLen,
        rainStreakPen: x.rainStreakPen,
      },
    };
  }

  return {
    verdict,
    currentScore,
    bestSiteId,
    bestScore,
    delta,
    radiusKmUsed: radiusKm,

    // Performance/debug counters:
    candidatesPreselected: candidates.length,
    candidatesConsidered,

    basis: {
      targetDateISO, // tomorrow
      windowDays,
      wetThresholdMm,
      limit,

      baseDayScore: baseRes?.dayScore ?? null,
      baseRainStreakLen: baseRes?.rainStreakLen ?? null,
      baseRainStreakPen: baseRes?.rainStreakPen ?? null,
    },

    // ✅ topN list for UI
    top3: top.map((x) => ({
      siteId: x.siteId,
      siteName: x.siteName,
      windowAvg: x.windowAvg,
      deltaVsBase: x.windowAvg - currentScore,
      distanceKm: x.distanceKm,
    })),

    // ✅ breakdown for base + topN
    explain: {
      base: {
        siteId: baseSiteId,
        windowAvg: currentScore,
        windowDays: baseRes?.windowDaysSlice ?? [],
        meta: {
          dayScore: baseRes?.dayScore ?? null,
          rainStreakLen: baseRes?.rainStreakLen ?? null,
          rainStreakPen: baseRes?.rainStreakPen ?? null,
        },
      },
      candidates: explainCandidates,
    },
  };
}
