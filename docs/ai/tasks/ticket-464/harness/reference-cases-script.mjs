// Ticket #464 — read-only research harness. Executes the REAL, retained
// scoring.js / forecastNormalize.js functions (no copies, no rewrites) to
// produce a reproducible, provenance-labelled breakdown for the owner's two
// example dates plus the counterfactual matrix required by the approved
// prompt's investigation contract items 4 and 5, and the J6 season/date
// boundary check. Run with:
//   node --import ./docs/ai/tasks/ticket-464/harness/esm-ext-loader.mjs docs/ai/tasks/ticket-464/harness/reference-cases-script.mjs
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./esm-ext-loader.mjs", import.meta.url);

const {
  getSeasonForDate,
  basePointsFromTemp,
  windPenaltyPoints,
  rainPenaltyPoints,
  getColdWindPenalty,
  getSkyComfortModifier,
  getWintryPrecipPenalty,
  getPleasantnessModifier,
  gustPenaltyPoints,
  pointsToClass,
  scoreSiteDay,
} = await import("../../../../../src/lib/scoring.js");

const { normalizeDailyToScoreInput } = await import("../../../../../src/lib/forecastNormalize.js");

function hr(title) {
  console.log("\n==== " + title + " ====");
}

function showBreakdown(label, row) {
  const season = getSeasonForDate(row.date);
  const baseRaw = basePointsFromTemp(row.tmax, season);
  const windPenRaw = windPenaltyPoints(row.windMax, season);
  const rainPenBase = rainPenaltyPoints(row.rain);
  const gustPenRaw = gustPenaltyPoints(row.windGust, row.windMax, season);
  const sky = getSkyComfortModifier(row.weatherCode);
  const coldWind = getColdWindPenalty(row.tmax, row.windMax);
  const wintry = getWintryPrecipPenalty(row.weatherCode, row.tmax);
  const pleasantness = getPleasantnessModifier({ tmax: row.tmax, windMax: row.windMax, weatherCode: row.weatherCode });
  const result = scoreSiteDay(row);

  console.log(`\n-- ${label} --`);
  console.log("input row:", JSON.stringify(row));
  console.log("season:", season);
  console.log("basePointsFromTemp(tmax,season) raw:", baseRaw, "-> scoreSiteDay basePts:", result.basePts);
  console.log("windPenaltyPoints(windMax,season) raw:", windPenRaw, "-> scoreSiteDay windPen:", result.windPen);
  console.log("rainPenaltyPoints(rain) raw:", rainPenBase, "-> scoreSiteDay rainPen:", result.rainPen);
  console.log("gustPenaltyPoints(windGust,windMax,season):", gustPenRaw, "(== scoreSiteDay gustPen:", result.gustPen, ")");
  console.log("getSkyComfortModifier(weatherCode):", sky);
  console.log("getColdWindPenalty(tmax,windMax):", coldWind);
  console.log("getWintryPrecipPenalty(weatherCode,tmax):", wintry);
  console.log("getPleasantnessModifier -> sky-coldWind-wintry:", pleasantness, "(== components.pleasantness:", result.components.pleasantness, ")");
  console.log("pointsRaw (basePts-windPen-rainPen-gustPen-rainStreakPen(0)+shelterBonus+pleasantness):", result.pointsRaw, "/ totalRaw:", result.totalRaw);
  console.log("points (clamped 0..10):", result.points, "/ total:", result.total);
  console.log("finalClass:", result.finalClass, "<- pointsToClass(", result.points, ") =", pointsToClass(result.points));
  console.log("components:", JSON.stringify(result.components));
  return result;
}

hr("Contract item 4 — Oct-27 and Oct-28 synthetic breakdown (owner-reported rounded values; weatherCode is UNKNOWN, tried as mainly-clear=1 per 'að mestu heiðskírt')");

// Owner-reported, rounded values from the approved prompt's Goal section.
// windMax/windGust here are treated as the value the owner read off
// ForecastTable (== row.windMax after normalizeDailyToScoreInput, per J2 —
// NOT necessarily Open-Meteo's own daily windspeed_10m_max). windGust is
// UNKNOWN (never reported) and is probed in the gust-feasibility block below.
showBreakdown("Oct-27 (owner-reported: Fair/Sæm, wind 4.8 m/s, rain 0.2mm, tmax 6.7)", {
  date: "2026-10-27",
  tmax: 6.7,
  tmin: 2.9,
  windMax: 4.8,
  windGust: null,
  rain: 0.2,
  weatherCode: null,
  shelter: 0,
});

showBreakdown("Oct-28 (owner-reported: Bad/Slæmt, wind 5.1 m/s, rain 0.0mm, tmax 5.8, 'mostly clear')", {
  date: "2026-10-28",
  tmax: 5.8,
  tmin: 2.6,
  windMax: 5.1,
  windGust: null,
  rain: 0.0,
  weatherCode: 1,
  shelter: 0,
});

hr("J3 — hidden-input (gust) feasibility sweep for Oct-28, weatherCode=1 (mainly clear), shelter=0");
for (const gust of [null, 5, 8, 10, 11, 11.1, 12, 13, 14, 14.9, 15, 16, 20]) {
  const r = scoreSiteDay({
    date: "2026-10-28",
    tmax: 5.8,
    tmin: 2.6,
    windMax: 5.1,
    windGust: gust,
    rain: 0.0,
    weatherCode: 1,
    shelter: 0,
  });
  console.log(
    `gust=${String(gust).padStart(5)}  diff(gust-windMax)=${gust == null ? "n/a" : (gust - 5.1).toFixed(1)}  gustPen=${r.gustPen}  points=${r.points}  class=${r.finalClass}`
  );
}

hr("J3 — same sweep but with weatherCode=3 (overcast, sky=-1) instead of clear, to show class without any gust at all under worse sky");
for (const sky of [0, 1, 3, 45]) {
  const r = scoreSiteDay({
    date: "2026-10-28",
    tmax: 5.8,
    tmin: 2.6,
    windMax: 5.1,
    windGust: null,
    rain: 0.0,
    weatherCode: sky,
    shelter: 0,
  });
  console.log(`weatherCode=${sky}  pleasantness=${r.components.pleasantness}  points=${r.points}  class=${r.finalClass}`);
}

hr("Contract item 5 — counterfactuals around exact winter wind boundary (<=5 vs >5..10)");
for (const w of [4.9, 5.0, 5.0001, 5.1, 10.0, 10.1]) {
  const r = scoreSiteDay({ date: "2026-10-28", tmax: 5.8, windMax: w, windGust: null, rain: 0, weatherCode: 1, shelter: 0 });
  console.log(`windMax=${w}  windPenaltyPoints=${windPenaltyPoints(w, "winter")}  windPen=${r.windPen}  points=${r.points}  class=${r.finalClass}`);
}

hr("Contract item 5 — legitimate zero/negative and missing/non-finite/type-mismatched inputs fed to scoreSiteDay");
const edgeRows = [
  { label: "all nulls", row: { date: "2026-10-28", tmax: null, windMax: null, windGust: null, rain: null, weatherCode: null, shelter: null } },
  { label: "negative wind/rain", row: { date: "2026-10-28", tmax: 5.8, windMax: -3, windGust: -1, rain: -2, weatherCode: 1, shelter: 0 } },
  { label: "NaN tmax/wind/rain", row: { date: "2026-10-28", tmax: NaN, windMax: NaN, windGust: NaN, rain: NaN, weatherCode: 1, shelter: 0 } },
  { label: "Infinity wind", row: { date: "2026-10-28", tmax: 5.8, windMax: Infinity, windGust: null, rain: 0, weatherCode: 1, shelter: 0 } },
  { label: "numeric-string wind ('5.1')", row: { date: "2026-10-28", tmax: 5.8, windMax: "5.1", windGust: null, rain: 0, weatherCode: 1, shelter: 0 } },
  { label: "missing date (season defaults to summer)", row: { date: undefined, tmax: 5.8, windMax: 5.1, windGust: null, rain: 0, weatherCode: 1, shelter: 0 } },
];
for (const { label, row } of edgeRows) {
  const r = scoreSiteDay(row);
  console.log(`${label.padEnd(40)} season=${r.season}  basePts=${r.basePts}  points=${r.points}  class=${r.finalClass}  totalRaw=${r.totalRaw}`);
}

hr("J6 — getSeasonForDate UTC-parse vs local getMonth(), secondary counterfactual (date-only string ambiguity near month boundaries)");
console.log("process.env.TZ at script start:", process.env.TZ, " Intl default TZ:", Intl.DateTimeFormat().resolvedOptions().timeZone);
for (const d of ["2026-10-01", "2026-05-01", "2026-10-27", "2026-10-28"]) {
  console.log(`getSeasonForDate(${d}) with current process TZ ->`, getSeasonForDate(d));
}

hr("normalizeDailyToScoreInput — confirm daily windMax/windGust/rain are time-weighted hourly maxima/sum, not raw provider daily fields, when hourly is present");
const dailyFixture = {
  time: ["2026-10-28"],
  temperature_2m_max: [5.8],
  temperature_2m_min: [2.6],
  precipitation_sum: [0.0],
  windspeed_10m_max: [9.0], // deliberately different from any weighted hourly max below, to prove which one wins
  windgusts_10m_max: [20.0],
  winddirection_10m_dominant: [180],
  weathercode: [1],
};
const hourlyFixture = {
  time: Array.from({ length: 24 }, (_, h) => `2026-10-28T${String(h).padStart(2, "0")}:00`),
  windspeed_10m: Array.from({ length: 24 }, (_, h) => (h === 13 ? 11 : 5)), // spike only at hour 13 (unsampled by the 3-hourly modal)
  windgusts_10m: Array.from({ length: 24 }, (_, h) => (h === 13 ? 14 : 8)),
  precipitation: Array.from({ length: 24 }, () => 0),
};
const normalized = normalizeDailyToScoreInput(dailyFixture, hourlyFixture);
console.log("provider daily windspeed_10m_max:", dailyFixture.windspeed_10m_max[0], " windgusts_10m_max:", dailyFixture.windgusts_10m_max[0]);
console.log("normalizeDailyToScoreInput output row (fed into scoreSiteDay):", JSON.stringify(normalized[0]));
console.log(
  "note: hour 13 raw wind=11 at weight 1.0 (9<=13<22) -> weighted 11.0 is the max across the day, so normalized windMax == 11.0, NOT the provider's own daily windspeed_10m_max (9.0) and NOT the modal's 3-hourly-sampled rows (which never include hour 13 at all)."
);
const scoredFromNormalized = scoreSiteDay(normalized[0]);
console.log("scoreSiteDay on that normalized row:", scoredFromNormalized.finalClass, scoredFromNormalized.points, JSON.stringify(scoredFromNormalized.components));

hr("done");
