function toHourItems(hourly) {
  if (!hourly || !Array.isArray(hourly.time)) return [];

  const times = hourly.time;
  const winds = Array.isArray(hourly.windspeed_10m) ? hourly.windspeed_10m : [];
  const gusts = Array.isArray(hourly.windgusts_10m) ? hourly.windgusts_10m : [];
  const rains = Array.isArray(hourly.precipitation) ? hourly.precipitation : [];

  const out = [];

  for (let i = 0; i < times.length; i++) {
    out.push({
      time: times[i] ?? null,
      wind: typeof winds[i] === "number" ? winds[i] : 0,
      gust: typeof gusts[i] === "number" ? gusts[i] : 0,
      rain: typeof rains[i] === "number" ? rains[i] : 0,
    });
  }

  return out;
}

function isHazardHour(item, hazards = {}) {
  return (
    item.wind >= (hazards.windWarn ?? 14) ||
    item.gust >= (hazards.gustWarn ?? 20) ||
    item.rain >= (hazards.rainWarn ?? 12)
  );
}

function inSelectedWindow(isoTime, startDateISO, days) {
  if (!isoTime || !startDateISO || !Number.isInteger(days) || days <= 0) return false;

  const start = new Date(`${startDateISO}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  const t = new Date(isoTime);
  return t >= start && t < end;
}

export function detectHazardWindow({ hourly, startDateISO, days, hazards = {} }) {
  const allHours = toHourItems(hourly).filter((h) => inSelectedWindow(h.time, startDateISO, days));

  if (!allHours.length) return null;

  let currentCount = 0;
  let currentStart = null;
  let currentEnd = null;

  let bestCount = 0;
  let bestStart = null;
  let bestEnd = null;

  let hazardHits = 0;

  for (const h of allHours) {
    const hazard = isHazardHour(h, hazards);

    if (hazard) {
      hazardHits += 1;
      if (currentStart == null) currentStart = h.time;
      currentEnd = h.time;
      currentCount += 1;

      if (currentCount > bestCount) {
        bestCount = currentCount;
        bestStart = currentStart;
        bestEnd = currentEnd;
      }
    } else {
      currentCount = 0;
      currentStart = null;
      currentEnd = null;
    }
  }

  if (bestCount <= 0) return null;

  let type = "passingStorm";
  let factor = 1.1;

  if (bestCount >= 6) {
    type = "stormyPeriod";
    factor = 1.6;
  } else if (bestCount >= 3) {
    type = "roughWeather";
    factor = 1.3;
  }

  return {
    type,
    hours: bestCount,
    factor,
    startTime: bestStart,
    endTime: bestEnd,
  };
}
