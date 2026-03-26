export function deriveRoutePlannerSummary({
  result,
  sites,
  effectiveRadiusKm,
  effectiveWindowDays,
  routeRiskData,
  isPreview,
  isPro,
}) {
  const top3 = Array.isArray(result?.ranked) ? result.ranked.slice(0, 3) : [];

  const best = top3[0] || null;

  let decisionLower = String(
    result?.recommendation || best?.recommendation || "stay"
  ).toLowerCase();

  // 🚧 Route safety override
  if (routeRiskData?.routeRisk === "HIGH" && decisionLower === "move") {
    decisionLower = "consider";
  }

  const candidateSite = best
    ? (Array.isArray(sites) ? sites : []).find((s) => s?.id === best?.siteId) || best?.site || null
    : null;

  const summary = {
    ready: !!result,
    verdict: decisionLower,
    isPreview,
    isPro,
    radiusKm: effectiveRadiusKm,
    windowDays: effectiveWindowDays,
    candidate: candidateSite
      ? {
          id: candidateSite?.id || best?.siteId || null,
          name: candidateSite?.name || null,
          distanceKm:
            typeof best?.distanceKm === "number"
              ? best.distanceKm
              : typeof best?.distance === "number"
                ? best.distance
                : null,
        }
      : null,
  };

  return {
    top3,
    best,
    decisionLower,
    summary,
  };
}
