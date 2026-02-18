import { distanceKm } from "../utils/distance";

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
 * Pure recommendation engine.
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
export function getTomorrowRecommendation(
  baseSiteId,
  scoresById,
  sites,
  radiusKm = 50
) {
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
