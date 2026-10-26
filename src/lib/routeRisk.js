export function interpolateRoutePoints(origin, destination, samples = 7) {
  const points = [];

  const latStep = (destination.lat - origin.lat) / (samples - 1);
  const lonStep = (destination.lon - origin.lon) / (samples - 1);

  for (let i = 0; i < samples; i++) {
    points.push({
      lat: origin.lat + latStep * i,
      lon: origin.lon + lonStep * i,
    });
  }

  return points;
}

function isValidNonNegativeFinite(v) {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

// Ticket #460 — classification must never fabricate LOW for missing/invalid
// data (#437 F-04/RC-17: all-missing input previously fell through to LOW).
// `windComplete`/`gustComplete` describe whether EVERY requested route point
// (not just the max-holding one) had a valid reading for that variable —
// the estimator computes these; a caller that omits them gets the safe
// default (incomplete), so LOW can only ever come from the estimator's own
// completeness accounting, never from a bare maxWind/maxGust pair alone.
export function classifyRouteRisk({
  maxWind,
  maxGust,
  windComplete = false,
  gustComplete = false,
  hazards,
}) {
  const { windWarn, windHigh, gustWarn, gustHigh } = hazards;

  const windValid = isValidNonNegativeFinite(maxWind);
  const gustValid = isValidNonNegativeFinite(maxGust);

  // Observed maxima are lower bounds: a valid reading that reaches a
  // threshold is HIGH/MED even if the OTHER variable is missing/invalid or
  // coverage is partial — see Ripley J1 (ticket-460), monotone contract.
  if ((windValid && maxWind >= windHigh) || (gustValid && maxGust >= gustHigh)) return "HIGH";
  if ((windValid && maxWind >= windWarn) || (gustValid && maxGust >= gustWarn)) return "MED";

  // LOW requires both variables to be valid AND complete across every
  // requested point — a subthreshold reading from a partial sample is not
  // reassuring, it's unknown (#437 F-04).
  if (windValid && gustValid && windComplete && gustComplete) return "LOW";

  return "UNKNOWN";
}

export async function estimateRouteRisk({
  origin,
  destination,
  getForecast,
  hazards,
  samples = 7,
}) {
  const safeSamples = Math.max(2, Number(samples) || 7);
  const points = interpolateRoutePoints(origin, destination, safeSamples);
  const requested = points.length;

  const TOMORROW_INDEX = 1;

  let maxWind = null;
  let maxGust = null;
  let rainMax = null;

  let windReturned = 0;
  let windValidCount = 0;
  let gustReturned = 0;
  let gustValidCount = 0;
  let rainReturned = 0;
  let rainValidCount = 0;

  let routeDate = null;
  let anyDateSeen = false;
  let dateMismatch = false;

  for (const p of points) {
    let forecast = null;

    try {
      // Ticket #460 — a rejected per-point fetch must not abort the whole
      // route estimate (it previously did: an uncaught throw here meant the
      // hook's catch discarded every other point's result too). Treat a
      // failed point like a missing one and keep going.
      forecast = await getForecast({ lat: p.lat, lon: p.lon });
    } catch {
      continue;
    }

    if (!forecast || !forecast.daily) continue;

    const windRaw = forecast.daily.windspeed_10m_max?.[TOMORROW_INDEX];
    const gustRaw = forecast.daily.windgusts_10m_max?.[TOMORROW_INDEX];
    const rainRaw = forecast.daily.precipitation_sum?.[TOMORROW_INDEX];
    const dateRaw = forecast.daily.time?.[TOMORROW_INDEX];

    if (windRaw !== undefined) windReturned += 1;
    if (isValidNonNegativeFinite(windRaw)) {
      windValidCount += 1;
      maxWind = maxWind === null ? windRaw : Math.max(maxWind, windRaw);
    }

    if (gustRaw !== undefined) gustReturned += 1;
    if (isValidNonNegativeFinite(gustRaw)) {
      gustValidCount += 1;
      maxGust = maxGust === null ? gustRaw : Math.max(maxGust, gustRaw);
    }

    // Rain is tracked independently — it never gates wind/gust coverage and
    // never contributes to classifyRouteRisk (unchanged from before #460).
    if (rainRaw !== undefined) rainReturned += 1;
    if (isValidNonNegativeFinite(rainRaw)) {
      rainValidCount += 1;
      rainMax = rainMax === null ? rainRaw : Math.max(rainMax, rainRaw);
    }

    if (typeof dateRaw === "string" && dateRaw) {
      if (!anyDateSeen) {
        routeDate = dateRaw;
        anyDateSeen = true;
      } else if (routeDate !== dateRaw) {
        dateMismatch = true;
      }
    }
  }

  const windComplete = windValidCount === requested;
  const gustComplete = gustValidCount === requested;

  const coverageStatus =
    windComplete && gustComplete
      ? "complete"
      : windValidCount > 0 || gustValidCount > 0
        ? "partial"
        : "unavailable";

  const routeRisk = classifyRouteRisk({ maxWind, maxGust, windComplete, gustComplete, hazards });

  return {
    routeRisk,
    maxWind,
    maxGust,
    rainMax,
    coverage: {
      status: coverageStatus,
      wind: { requested, returned: windReturned, valid: windValidCount },
      gust: { requested, returned: gustReturned, valid: gustValidCount },
      rain: { requested, returned: rainReturned, valid: rainValidCount },
    },
    // Ticket #460 J9 — the estimator records the date it actually used
    // (daily.time[TOMORROW_INDEX]) instead of assuming "tomorrow"; the hook
    // compares this to the real calendar tomorrow before any UI copy is
    // allowed to say the word.
    routeDate,
    dateVerified: anyDateSeen && !dateMismatch,
  };
}
