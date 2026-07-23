// Shared comparison utilities used by InstantComparison and DecisionBanner.
// These thresholds are specific to the InstantComparison display layer
// (wind 1.5 m/s, rain 2 mm, temp 1.5°C) and are NOT the frozen Model v1.0
// baseline from compareCampsiteForecasts.js. Do not merge or conflate them.

import { haversine } from "./geo";

// Average wind (m/s) and temp (°C) and sum rain (mm) over the first 3 forecast days.
export function calcMetrics(rows) {
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

// Returns { strength, primaryKey, worseningsCount }.
// strength: "strong" (2+ improvements, 0 worsenings)
//         | "decent" (1 improvement, 0 worsenings)
//         | "weak"   (1+ improvements AND 1+ worsenings — mixed)
//         | "mixed"  (0 improvements)
// primaryKey: first dimension where nearby is meaningfully better ("wind"|"rain"|"temp"|null)
// worseningsCount: how many metrics are clearly worse at the nearby site (above threshold)
export function classifyMetrics(current, nearby) {
  if (!current || !nearby) return { strength: "weak", primaryKey: null, worseningsCount: 0 };

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

  return {
    strength,
    primaryKey: improvements.length > 0 ? improvements[0] : null,
    worseningsCount: worsenings.length,
  };
}

// Converts metric classification into a directional verdict for the banner.
// "nearby_better"   → nearby is meaningfully better; move recommendation is allowed
// "similar"         → no clear winner; banner must not recommend moving
// "current_better"  → current campsite is clearly better on at least one metric
//
// Label mapping (product decision, fixed):
//   strength strong/decent → nearby_better  (maps to "Betra" / "Miklu betra")
//   strength weak          → similar        (maps to "Örlítið betra" — not enough to justify move)
//   strength mixed + no worsenings → similar (within thresholds in all dimensions)
//   strength mixed + worsenings    → current_better (nearby is clearly worse on ≥1 metric)
export function classifyDirection(strength, worseningsCount) {
  if (strength === "strong" || strength === "decent") return "nearby_better";
  if (strength === "mixed" && worseningsCount > 0) return "current_better";
  return "similar";
}

export function scoreTier(diff) {
  if (diff >= 15) return 3;
  if (diff >= 8) return 2;
  if (diff >= 5) return 1;
  return 0;
}

export function metricCap(strength) {
  if (strength === "strong") return 3;
  if (strength === "decent") return 2;
  if (strength === "weak") return 1;
  return 0;
}

// Searches siteList within radiusKm of `site` for the highest-scoring candidate
// whose score exceeds currentScore by at least MIN_SCORE_DIFF.
export function selectBestCandidate(siteList, scoresById, site, currentScore, radiusKm) {
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
