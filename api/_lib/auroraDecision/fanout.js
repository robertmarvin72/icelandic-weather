// api/_lib/auroraDecision/fanout.js
//
// Bounded-concurrency Open-Meteo fan-out across the requested locations.
// Results are written into a pre-sized array by INDEX, not appended on
// completion — so the returned order always matches `locations` input order
// regardless of which network call finishes first (required for
// deterministic ranking: approved prompt §7, test #2).

import { WEATHER_FETCH_CONCURRENCY } from "./constants.js";
import { fetchLocationWeather } from "./openMeteo.js";

export async function fetchWeatherForLocations({
  locations,
  startDate,
  endDate,
  fetchImpl,
  concurrency = WEATHER_FETCH_CONCURRENCY,
}) {
  const results = new Array(locations.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const i = nextIndex++;
      if (i >= locations.length) return;
      const loc = locations[i];
      const result = await fetchLocationWeather({ lat: loc.lat, lon: loc.lon, startDate, endDate, fetchImpl });
      results[i] = { location: loc, ...result };
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, locations.length));
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}
