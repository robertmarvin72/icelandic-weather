export function getHazardBlockText(candidateRow, t) {
  if (!candidateRow?.hazardBlocked) return null;

  if (candidateRow?.hazardBlockMode === "stay") {
    return `🚨 ${
      t("routeHazardBlockerStay") ||
      "Veðuráhætta á einum degi kemur í veg fyrir flutningsráðleggingu."
    }`;
  }

  if (candidateRow?.hazardBlockMode === "consider") {
    return `⚠️ ${
      t("routeHazardBlockerConsider") || "Veðuráhætta á einum degi dregur úr ráðleggingu."
    }`;
  }

  return `⚠️ ${t("routeHazardBlockerShort") || "Hazard dagur veikti niðurstöðu."}`;
}

export function getStayReasonText(candidateRow, decisionLower, t) {
  if (decisionLower !== "stay") return null;

  if (!candidateRow) {
    return (
      t("routeStayReasonAlreadyBest") || "Þú ert líklega nú þegar á besta staðnum í nágrenninu."
    );
  }

  if (candidateRow?.hazardBlocked) {
    return t("routeStayReasonHazard") || "Veðuráhætta annars staðar gerir flutning ekki ráðlagðan.";
  }

  if (
    typeof candidateRow?.deltaVsBase === "number" &&
    candidateRow.deltaVsBase > 0 &&
    candidateRow.deltaVsBase < 0.5
  ) {
    return t("routeStayReasonSmallDifference") || "Munurinn er of lítill til að réttlæta flutning.";
  }

  return t("routeStayReasonAlreadyBest") || "Þú ert líklega nú þegar á besta staðnum í nágrenninu.";
}

export function getHazardWindowNarrative(candidateRow, t) {
  const hw = candidateRow?.hazardWindow;
  if (!hw?.type) return null;

  switch (hw.type) {
    case "passingStorm":
      return t("routeHazardWindowPassingStorm");
    case "roughWeather":
      return t("routeHazardWindowRoughWeather");
    case "stormyPeriod":
      return t("routeHazardWindowStormyPeriod");
    default:
      return null;
  }
}

export function buildRouteNarrative({
  baseSite,
  best,
  shownHazardWindowNarrative,
  bestEscapeSuggestion,
  routeRiskData,
  decisionLower,
}) {
  const parts = [];

  if (shownHazardWindowNarrative && baseSite?.name) {
    parts.push(`${shownHazardWindowNarrative} á ${baseSite.name}.`);
  } else if (shownHazardWindowNarrative) {
    parts.push(shownHazardWindowNarrative);
  }

  if (bestEscapeSuggestion?.destinationLine) {
    parts.push(`Betri aðstæður gætu verið í nágrenninu: ${bestEscapeSuggestion.destinationLine}.`);
  } else if (best?.siteName && Number.isFinite(best?.distanceKm) && decisionLower !== "stay") {
    parts.push(
      `Betri aðstæður gætu verið í ${best.siteName}, um ${Math.round(best.distanceKm)} km í burtu.`
    );
  }

  if (routeRiskData?.routeRisk === "HIGH") {
    parts.push("Aðstæður á leiðinni gætu þó verið erfiðar núna.");
  } else if (routeRiskData?.routeRisk === "MED") {
    parts.push("Aðstæður á leiðinni gætu verið aðeins erfiðar.");
  }

  return parts.filter(Boolean);
}

export function getRoughWeatherWindowText(candidateRow, t, formatDate, interpolate) {
  const rw = candidateRow?.roughWeatherWindow;
  if (!rw?.hasWindow || !rw?.startDate || !rw?.endDate) return null;

  const start = formatDate(rw.startDate);
  const end = formatDate(rw.endDate);

  if (rw.dayCount <= 1) {
    return interpolate(t("routeRoughWeatherWindowSingle"), {
      date: start,
    });
  }

  return interpolate(t("routeRoughWeatherWindowRange"), {
    start,
    end,
    days: rw.dayCount,
  });
}
