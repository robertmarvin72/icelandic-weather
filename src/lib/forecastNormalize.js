// src/lib/forecastNormalize.js
export function normalizeDailyToScoreInput(daily) {
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

  return time.map((date, i) => ({
    date,
    tmax: temperature_2m_max?.[i] ?? null,
    tmin: temperature_2m_min?.[i] ?? null,
    rain: precipitation_sum?.[i] ?? null,
    windMax: windspeed_10m_max?.[i] ?? null,
    windGust: windgusts_10m_max?.[i] ?? null,
    windDir: winddirection_10m_dominant?.[i] ?? null,
    code: weathercode?.[i] ?? null,
  }));
}