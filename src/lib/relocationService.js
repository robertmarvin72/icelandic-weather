// src/lib/relocationService.js
import { distanceKm } from "../utils/distance";
import { getForecast } from "../lib/forecastCache";
import { relocationEngine } from "../lib/relocationEngine";

/**
 * Async wrapper for relocationEngine:
 * - preselect nearest candidates within radius (limit)
 * - fetch forecasts for base + candidates (resilient)
 * - run relocationEngine() with forecastMap
 *
 * @param {string} baseSiteId
 * @param {Array} campsites  // full sites list
 * @param {Object} opts
 * @returns {Promise<RelocationOutput & { debugFetch: any }>}
 */
export async function getRelocationRecommendation(baseSiteId, campsites, opts = {}) {
  const radiusKm = Number.isFinite(opts.radiusKm) ? opts.radiusKm : 50;
  const days = Number.isInteger(opts.days) ? opts.days : 3;

  const minDeltaToMoveDefault = days === 2 ? 1.8 : days === 3 ? 2.2 : days === 4 ? 2.5 : 2.8; // 5 dagar

  const minDeltaToConsiderDefault = days === 2 ? 0.7 : days === 3 ? 0.9 : days === 4 ? 1.0 : 1.1;

  const startDateISO = String(opts.startDateISO ?? "").slice(0, 10);
  if (!startDateISO) throw new Error("startDateISO is required");

  const limit = Number.isInteger(opts.limit) ? opts.limit : 30;

  // Engine config (pass-through with sane defaults handled in engine)
  const config = opts.config || {
    wetThresholdMm: 2,
    minDeltaToMove:
      typeof opts.minDeltaToMove === "number" ? opts.minDeltaToMove : minDeltaToMoveDefault,
    minDeltaToConsider:
      typeof opts.minDeltaToConsider === "number"
        ? opts.minDeltaToConsider
        : minDeltaToConsiderDefault,
    weightDecay: typeof opts.weightDecay === "number" ? opts.weightDecay : 0.85,
    useWorstDayGuardrail:
      typeof opts.useWorstDayGuardrail === "boolean" ? opts.useWorstDayGuardrail : days === 1,
    worstDayMin: typeof opts.worstDayMin === "number" ? opts.worstDayMin : 2,
    reasonMinDelta: typeof opts.reasonMinDelta === "number" ? opts.reasonMinDelta : 1,
    maxReasons: Number.isInteger(opts.maxReasons) ? opts.maxReasons : 4,
  };

  const sites = Array.isArray(campsites) ? campsites : [];
  const byId = new Map(sites.map((s) => [s.id, s]));
  const base = byId.get(baseSiteId);
  if (!base) throw new Error("Base site not found");

  // Preselect nearest candidates within radius (performance)
  const candidates = sites
    .filter((s) => s && s.id && s.id !== baseSiteId)
    .map((s) => ({ site: s, d: distanceKm(base, s) }))
    .filter(({ d }) => Number.isFinite(d) && d <= radiusKm)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.site);

  const toFetch = [base, ...candidates];

  // Allow dependency injection for tests
  const fetcher = typeof opts.getForecastFn === "function" ? opts.getForecastFn : getForecast;

  const forecastMap = {};
  const fetchStats = {
    requested: toFetch.length,
    ok: 0,
    failed: 0,
    missing: 0,
    ids: toFetch.map((s) => s.id),
  };

  // Fetch forecasts in parallel, resilient to per-site failures
  const settled = await Promise.allSettled(
    toFetch.map(async (s) => {
      const raw = await fetcher({ lat: s.lat, lon: s.lon });
      return { id: s.id, raw };
    })
  );

  for (const res of settled) {
    if (res.status === "fulfilled") {
      const { id, raw } = res.value;
      if (raw) {
        forecastMap[id] = raw;
        fetchStats.ok++;
      } else {
        fetchStats.missing++;
      }
    } else {
      fetchStats.failed++;
    }
  }

  if (!forecastMap[baseSiteId]) {
    throw new Error("Base site forecast missing (cannot compute recommendation)");
  }

  // Run the pure engine
  const out = relocationEngine({
    baseSiteId,
    radiusKm,
    startDateISO,
    days,
    campsites: sites,
    forecastMap,
    config,
  });

  return {
    ...out,
    debugFetch: fetchStats,
  };
}
