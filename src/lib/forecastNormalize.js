// src/lib/forecastNormalize.js
export function normalizeDailyToScoreInput(daily, hourly = null) {
  if (!daily?.time || !Array.isArray(daily.time)) return [];

  const {
    time,
    temperature_2m_max,
    temperature_2m_min,
    precipitation_sum,
    windspeed_10m_max,
    windgusts_10m_max,
    winddirection_10m_dominant,
    weathercode,
  } = daily;

  function getTimeWeight(hour) {
    if (hour >= 0 && hour < 6) return 0.45;
    if (hour >= 6 && hour < 9) return 0.75;
    if (hour >= 9 && hour < 22) return 1.0;
    return 0.75;
  }

  function getDayHourlyMetrics(hourly, date) {
    if (!hourly?.time || !Array.isArray(hourly.time)) return null;

    const times = hourly.time;
    const winds = Array.isArray(hourly.windspeed_10m) ? hourly.windspeed_10m : [];
    const gusts = Array.isArray(hourly.windgusts_10m) ? hourly.windgusts_10m : [];
    const rains = Array.isArray(hourly.precipitation) ? hourly.precipitation : [];

    let windMax = null;
    let windGust = null;
    let rain = 0;
    let found = false;

    for (let j = 0; j < times.length; j++) {
      const ts = String(times[j] ?? "");
      if (!ts.startsWith(date)) continue;

      found = true;

      const hour = Number(ts.slice(11, 13));
      let weight = getTimeWeight(hour);

      const rawWind = Number(winds[j] ?? 0);
      const rawGust = Number(gusts[j] ?? 0);
      const rawRain = Number(rains[j] ?? 0);

      const severe = rawWind >= 22 || rawGust >= 28;
      if (severe) weight = Math.max(weight, 0.85);

      const weightedWind = rawWind * weight;
      const weightedGust = rawGust * weight;
      const weightedRain = rawRain * weight;

      windMax = windMax == null ? weightedWind : Math.max(windMax, weightedWind);
      windGust = windGust == null ? weightedGust : Math.max(windGust, weightedGust);
      rain += weightedRain;
    }

    if (!found) return null;

    return { windMax, windGust, rain };
  }

  return time.map((date, i) => {
    const weighted = getDayHourlyMetrics(hourly, date);

    return {
      date,
      tmax: temperature_2m_max?.[i] ?? null,
      tmin: temperature_2m_min?.[i] ?? null,
      rain: weighted?.rain ?? precipitation_sum?.[i] ?? null,
      windMax: weighted?.windMax ?? windspeed_10m_max?.[i] ?? null,
      windGust: weighted?.windGust ?? windgusts_10m_max?.[i] ?? null,
      windDir: winddirection_10m_dominant?.[i] ?? null,
      code: weathercode?.[i] ?? null,
    };
  });
}
