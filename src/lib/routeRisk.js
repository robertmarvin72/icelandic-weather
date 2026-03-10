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

export function classifyRouteRisk({ maxWind, maxGust, hazards }) {
  const { windWarn, windHigh, gustWarn, gustHigh } = hazards;

  if (maxWind >= windHigh || maxGust >= gustHigh) return "HIGH";
  if (maxWind >= windWarn || maxGust >= gustWarn) return "MED";

  return "LOW";
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

  let maxWind = 0;
  let maxGust = 0;
  let rainMax = 0;

  for (const p of points) {
    const forecast = await getForecast({ lat: p.lat, lon: p.lon });

    if (!forecast || !forecast.daily) continue;

    const TOMORROW_INDEX = 1;

    const windRaw = forecast?.daily?.windspeed_10m_max?.[TOMORROW_INDEX];
    const gustRaw = forecast?.daily?.windgusts_10m_max?.[TOMORROW_INDEX];
    const rainRaw = forecast?.daily?.precipitation_sum?.[TOMORROW_INDEX];

    const wind = windRaw ?? 0;
    const gust = gustRaw ?? 0;
    const rain = rainRaw ?? 0;

    maxWind = Math.max(maxWind, wind);
    maxGust = Math.max(maxGust, gust);
    rainMax = Math.max(rainMax, rain);
  }

  const routeRisk = classifyRouteRisk({ maxWind, maxGust, hazards });

  return {
    routeRisk,
    maxWind,
    maxGust,
    rainMax,
  };
}
