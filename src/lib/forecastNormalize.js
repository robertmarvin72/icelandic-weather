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

  function getDayHourlyMetrics(hourly, date, dayCode = null, tmax = null) {
    if (!hourly?.time || !Array.isArray(hourly.time)) return null;

    const times = hourly.time;
    const winds = Array.isArray(hourly.windspeed_10m) ? hourly.windspeed_10m : [];
    const gusts = Array.isArray(hourly.windgusts_10m) ? hourly.windgusts_10m : [];
    const rains = Array.isArray(hourly.precipitation) ? hourly.precipitation : [];

    let windMax = null;
    let windGust = null;
    let rain = 0;
    let found = false;

    let precipStartHour = null;
    let precipEndHour = null;
    let precipDurationHours = 0;
    let precipActiveHours = 0;

    const PRECIP_ACTIVE_THRESHOLD = 0.1;

    const SNOW_CODES = [71, 73, 75, 77, 85, 86];
    const RAIN_CODES = [51, 53, 55, 61, 63, 65, 80, 81, 82];

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

      if (rawRain >= PRECIP_ACTIVE_THRESHOLD) {
        if (precipStartHour == null) precipStartHour = hour;
        precipEndHour = hour;
        precipDurationHours += 1;
        precipActiveHours += 1;
      }
    }

    if (!found) return null;

    let precipTimingBucket = null;
    if (precipStartHour != null) {
      if (precipStartHour >= 0 && precipStartHour < 6) precipTimingBucket = "overnight";
      else if (precipStartHour >= 6 && precipStartHour < 12) precipTimingBucket = "early";
      else if (precipStartHour >= 12 && precipStartHour < 18) precipTimingBucket = "midday";
      else precipTimingBucket = "late";
    }

    let precipType = null;
    if (rain >= PRECIP_ACTIVE_THRESHOLD) {
      if (SNOW_CODES.includes(Number(dayCode))) precipType = "snow";
      else if (RAIN_CODES.includes(Number(dayCode))) precipType = "rain";
      else precipType = Number(tmax) <= 1 ? "snow" : "rain";
    }

    return {
      windMax,
      windGust,
      rain,
      precipStartHour,
      precipEndHour,
      precipDurationHours,
      precipActiveHours,
      precipTimingBucket,
      precipType,
    };
  }

  return time.map((date, i) => {
    const weighted = getDayHourlyMetrics(
      hourly,
      date,
      weathercode?.[i] ?? null,
      temperature_2m_max?.[i] ?? null
    );

    return {
      date,
      tmax: temperature_2m_max?.[i] ?? null,
      tmin: temperature_2m_min?.[i] ?? null,
      rain: weighted?.rain ?? precipitation_sum?.[i] ?? null,
      windMax: weighted?.windMax ?? windspeed_10m_max?.[i] ?? null,
      windGust: weighted?.windGust ?? windgusts_10m_max?.[i] ?? null,
      windDir: winddirection_10m_dominant?.[i] ?? null,
      code: weathercode?.[i] ?? null,
      precipStartHour: weighted?.precipStartHour ?? null,
      precipEndHour: weighted?.precipEndHour ?? null,
      precipDurationHours: weighted?.precipDurationHours ?? 0,
      precipActiveHours: weighted?.precipActiveHours ?? 0,
      precipTimingBucket: weighted?.precipTimingBucket ?? null,
      precipType: weighted?.precipType ?? null,
    };
  });
}
