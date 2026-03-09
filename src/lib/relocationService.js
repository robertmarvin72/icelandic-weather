// src/lib/relocationService.js

import { getForecast } from "./forecastCache";
import { relocationEngine } from "./relocationEngine";

/**
 * Build radius steps up to maxRadius (inclusive).
 * Robust growth: 50 -> 100 -> 200 -> 300 -> 400 ... (clamped)
 */
function buildRadiusSteps(maxRadiusKm) {
  const maxR = Number(maxRadiusKm);
  if (!Number.isFinite(maxR) || maxR <= 0) return [50];

  if (maxR <= 50) return [maxR];

  const steps = [];
  let r = 50;

  while (r < maxR) {
    steps.push(r);
    if (r < 200) r = r * 2;
    else r = r + 100;
  }

  if (steps[steps.length - 1] !== maxR) steps.push(maxR);

  return Array.from(new Set(steps)).sort((a, b) => a - b);
}

/**
 * Fetch forecasts for a list of sites and return forecastMap keyed by site.id.
 * Uses getForecast() caching + inflight coalescing automatically.
 */
async function buildForecastMapForSites(sites, opts = {}) {
  const list = Array.isArray(sites) ? sites : [];
  const fetchForecast =
    typeof opts?.getForecastFn === "function" ? opts.getForecastFn : getForecast;

  const entries = await Promise.all(
    list.map(async (s) => {
      const id = s?.id;
      const lat = s?.lat ?? s?.latitude;
      const lon = s?.lon ?? s?.lng ?? s?.longitude;

      if (!id || typeof lat !== "number" || typeof lon !== "number") {
        return [id || null, null];
      }

      const data = await fetchForecast({ lat, lon, site: s });
      return [id, data];
    })
  );

  const forecastMap = {};
  for (const [id, data] of entries) {
    if (id && data) forecastMap[id] = data;
  }
  return forecastMap;
}

/**
 * SINGLE run (one radius).
 * Keep this function as the one true engine call.
 */
async function getRelocationRecommendationSingle(baseSiteId, sites, opts = {}) {
  const { radiusKm = 50, days = 3, startDateISO, config } = opts;

  const campsites = Array.isArray(sites) ? sites : [];
  if (!campsites.length) throw new Error("No campsites provided");

  // Build forecast map for all sites we might score
  const forecastMap = await buildForecastMapForSites(campsites, opts);

  if (!forecastMap?.[baseSiteId]) {
    throw new Error("Base site forecast missing");
  }

  const out = relocationEngine({
    baseSiteId,
    radiusKm,
    startDateISO,
    days,
    campsites,
    forecastMap,
    config,
  });

  return out;
}

/**
 * ADAPTIVE wrapper:

/**
 * ADAPTIVE wrapper:
 * - UI radiusKm is MAX CAP
 * - escalates radii until it finds something >= minDeltaToConsider
 * - returns last attempt (usually the first “good enough”)
 */
export async function getRelocationRecommendation(baseSiteId, sites, opts = {}) {
  const maxRadiusKm = Number.isFinite(opts?.radiusKm) ? opts.radiusKm : 50;

  const cfg = opts?.config || {};
  const minDeltaToConsider =
    typeof cfg.minDeltaToConsider === "number" ? cfg.minDeltaToConsider : 1;

  const radiusSteps = buildRadiusSteps(maxRadiusKm);

  let last = null;
  const attempts = [];

  for (const r of radiusSteps) {
    const res = await getRelocationRecommendationSingle(baseSiteId, sites, {
      ...opts,
      radiusKm: r,
    });

    last = res;

    const bestDelta =
      typeof res?.delta === "number"
        ? res.delta
        : typeof res?.ranked?.[0]?.deltaVsBase === "number"
          ? res.ranked[0].deltaVsBase
          : 0;

    attempts.push({
      radiusKm: r,
      bestDelta,
      verdict: res?.verdict || null,
      candidatesScored: res?.debug?.candidatesScored ?? null,
    });

    if (bestDelta >= minDeltaToConsider) break;
  }

  if (last) {
    last.debug = {
      ...(last.debug || {}),
      adaptiveRadiusEnabled: true,
      adaptiveRadiusMaxKm: maxRadiusKm,
      adaptiveRadiusUsedKm: last.radiusKm ?? attempts[attempts.length - 1]?.radiusKm ?? maxRadiusKm,
      adaptiveRadiusAttempts: attempts,
    };
  }

  return last;
}
