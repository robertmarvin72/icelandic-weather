// src/lib/routeExplain.js

function sum(arr, fn) {
  return arr.reduce((s, x) => s + (fn ? fn(x) : x), 0);
}

function avg(arr, fn) {
  if (!arr?.length) return null;
  const vals = arr
    .map((x) => (fn ? fn(x) : x))
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function aggregatePenalties(windowDays) {
  return {
    rainStreak: sum(windowDays, (d) => d.rainStreakPen ?? 0),
    gust: sum(windowDays, (d) => d.gustPen ?? 0),
    wind: sum(windowDays, (d) => d.windPen ?? 0),
    rain: sum(windowDays, (d) => d.rainPen ?? 0),
  };
}

function aggregatePositives(windowDays) {
  return {
    avgTmax: avg(windowDays, (d) => d.tmax ?? null),
  };
}

/**
 * Returns structured reasons only (no text).
 */
export function getImprovementReasons(baseWindow, candidateWindow, opts = {}) {
  const {
    maxReasons = 3,
    minTempDeltaC = 1.0,
  } = opts;

  if (!baseWindow?.length || !candidateWindow?.length) return [];

  const basePen = aggregatePenalties(baseWindow);
  const candPen = aggregatePenalties(candidateWindow);

  const basePos = aggregatePositives(baseWindow);
  const candPos = aggregatePositives(candidateWindow);

  const reasons = [];

  // Penalty improvements (lower is better)
  const penaltyTypes = ["rainStreak", "gust", "wind", "rain"];

  for (const type of penaltyTypes) {
    const delta = (candPen[type] ?? 0) - (basePen[type] ?? 0);
    if (delta < 0) {
      reasons.push({
        type,
        kind: "penalty",
        delta,
        strength: Math.abs(delta),
      });
    }
  }

  // Temperature improvement (higher is better)
  if (
    typeof basePos.avgTmax === "number" &&
    typeof candPos.avgTmax === "number"
  ) {
    const tempDelta = candPos.avgTmax - basePos.avgTmax;
    if (tempDelta >= minTempDeltaC) {
      reasons.push({
        type: "tmax",
        kind: "positive",
        delta: tempDelta,
        strength: tempDelta,
      });
    }
  }

  reasons.sort((a, b) => b.strength - a.strength);

  return reasons.slice(0, Math.max(0, maxReasons)).map(({ strength, ...r }) => r);
}