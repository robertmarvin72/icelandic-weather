import { useMemo } from "react";
import {
  calcMetrics,
  classifyMetrics,
  classifyDirection,
  selectBestCandidate,
  scoreTier,
  metricCap,
} from "../lib/comparisonUtils";

// Single source of truth for the metric-based comparison between the current
// campsite and the best nearby candidate. Call once in App and pass the result
// to both DecisionBanner and InstantComparison so they always agree.
export function useComparisonState({
  site,
  currentScore,
  rows,
  siteList,
  scoresById,
  radiusKm = 50,
  routePlannerSummary,
}) {
  // Local fallback candidate selection (used when routePlannerSummary is not ready).
  const localBest = useMemo(
    () => selectBestCandidate(siteList, scoresById, site, currentScore, radiusKm),
    [siteList, scoresById, site, currentScore, radiusKm]
  );

  // When the route planner has a result, prefer its candidate so both components
  // always compare against the same site.
  const best = useMemo(() => {
    const verdict = String(routePlannerSummary?.verdict || "").toLowerCase();
    const candidateId = routePlannerSummary?.candidate?.id;

    if (routePlannerSummary?.ready && verdict === "stay") return null;

    if (routePlannerSummary?.ready && candidateId && verdict !== "stay") {
      const candidateSite = (siteList || []).find((s) => s.id === candidateId);
      if (candidateSite) {
        return {
          site: candidateSite,
          score: scoresById?.[candidateId]?.score ?? 0,
          distFromBase: routePlannerSummary.candidate.distanceKm ?? 0,
        };
      }
    }

    return localBest;
  }, [routePlannerSummary, siteList, scoresById, localBest]);

  const currentMetrics = useMemo(() => calcMetrics(rows), [rows]);

  const nearbyMetrics = useMemo(() => {
    if (!best) return null;
    const nearbyRows = scoresById?.[best.site?.id]?.rows;
    return calcMetrics(nearbyRows);
  }, [best, scoresById]);

  const { strength, primaryKey, worseningsCount } = useMemo(
    () => classifyMetrics(currentMetrics, nearbyMetrics),
    [currentMetrics, nearbyMetrics]
  );

  const isStrongOrDecent = strength === "strong" || strength === "decent";
  const scoreDiff = best ? best.score - currentScore : 0;
  const showComparison = best != null;
  const tier = showComparison ? Math.min(scoreTier(scoreDiff), metricCap(strength)) : -1;

  // "no_candidate" when no nearby candidate is available — banner falls back to
  // the route planner verdict rather than a metric-based direction.
  const direction = showComparison
    ? classifyDirection(strength, worseningsCount)
    : "no_candidate";

  return {
    best,
    currentMetrics,
    nearbyMetrics,
    strength,
    primaryKey,
    worseningsCount,
    isStrongOrDecent,
    scoreDiff,
    tier,
    showComparison,
    direction,
  };
}
