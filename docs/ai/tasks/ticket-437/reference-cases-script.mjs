// Ticket #437 — read-only reference-case script (J9). Imports the REAL,
// unmodified repo functions and runs synthetic/hypothetical inputs through
// them to OBSERVE actual current behavior. Makes no application changes.
// Run from repo root: node docs/ai/tasks/ticket-437/reference-cases-script.mjs
import { classifyRouteRisk } from "../../../../src/lib/routeRisk.js";
import { detectHazardWindow } from "../../../../src/lib/hazardWindow.js";
import { scoreAuroraVisibility } from "../../../../src/lib/auroraScoring.js";
import { HAZARDS_V1 } from "../../../../src/config/hazards.js";
import { evaluateWeatherVoice } from "../../../../src/lib/weatherVoiceEngine.js";
import { normalizeDailyToScoreInput } from "../../../../src/lib/forecastNormalize.js";

function out(label, value) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(value, null, 2));
}

console.log("# classifyRouteRisk(hazards=HAZARDS_V1) — app thresholds 14/18/20/24");
console.log(JSON.stringify(HAZARDS_V1));

// --- classifyRouteRisk boundary cases ---
for (const maxWind of [0, 13.9, 14, 17.9, 18, 20.7, NaN, -5, null, undefined]) {
  try {
    const r = classifyRouteRisk({ maxWind, maxGust: 0, hazards: HAZARDS_V1 });
    out(`classifyRouteRisk maxWind=${maxWind} maxGust=0`, r);
  } catch (e) {
    out(`classifyRouteRisk maxWind=${maxWind} maxGust=0 THREW`, String(e));
  }
}
for (const maxGust of [19.9, 20, 23.9, 24, null]) {
  try {
    const r = classifyRouteRisk({ maxWind: 0, maxGust, hazards: HAZARDS_V1 });
    out(`classifyRouteRisk maxWind=0 maxGust=${maxGust}`, r);
  } catch (e) {
    out(`classifyRouteRisk maxWind=0 maxGust=${maxGust} THREW`, String(e));
  }
}

// Official-simplified and Beaufort-term boundaries run through the APP's
// own route-risk classifier (hypothetical: the official table is not an app
// input anywhere — this only shows what the app's OWN thresholds would say
// about these officially-defined boundary values, for comparison).
for (const v of [4.99, 5, 9.99, 10, 19.99, 20, 29.99, 30, 20.8, 24.5, 28.5, 32.7]) {
  const r = classifyRouteRisk({ maxWind: v, maxGust: 0, hazards: HAZARDS_V1 });
  out(`classifyRouteRisk (official/Beaufort boundary) maxWind=${v}`, r);
}

// --- detectHazardWindow: duration-based "storm" family labels ---
function hourlyOf(values, { gust = [], rain = [] } = {}) {
  const time = values.map((_, i) => `2026-11-0${1 + Math.floor(i / 24)}T${String(i % 24).padStart(2, "0")}:00`);
  return {
    time,
    windspeed_10m: values,
    windgusts_10m: values.map((_, i) => gust[i] ?? 0),
    precipitation: values.map((_, i) => rain[i] ?? 0),
  };
}

// 6 consecutive hours at exactly windWarn (14) -> stormyPeriod? (duration, not Beaufort Stormur magnitude)
out(
  "detectHazardWindow: 6 consecutive hours at wind=14 (app windWarn, NOT Beaufort Stormur 20.8)",
  detectHazardWindow({
    hourly: hourlyOf([14, 14, 14, 14, 14, 14, 0, 0]),
    startDateISO: "2026-11-01",
    days: 2,
    hazards: HAZARDS_V1,
  }),
);

// 6 consecutive hours of RAIN ONLY at rainWarn (12mm), wind=0 -> same "stormyPeriod" label from rain alone
out(
  "detectHazardWindow: 6 consecutive hours of rain=12 ONLY, wind=0, gust=0 (rain-only 'storm' label)",
  detectHazardWindow({
    hourly: hourlyOf([0, 0, 0, 0, 0, 0, 0, 0], { rain: [12, 12, 12, 12, 12, 12, 0, 0] }),
    startDateISO: "2026-11-01",
    days: 2,
    hazards: HAZARDS_V1,
  }),
);

// Actual Beaufort "Stormur" magnitude (20.8 m/s) for only 2 consecutive hours -> roughWeather, NOT stormyPeriod
out(
  "detectHazardWindow: 2 consecutive hours at wind=20.8 (Beaufort Stormur magnitude, short duration)",
  detectHazardWindow({
    hourly: hourlyOf([20.8, 20.8, 0, 0, 0, 0, 0, 0]),
    startDateISO: "2026-11-01",
    days: 2,
    hazards: HAZARDS_V1,
  }),
);

// Missing/NaN hourly values
out(
  "detectHazardWindow: hourly windspeed_10m contains non-numbers (missing-data pattern)",
  detectHazardWindow({
    hourly: { time: ["2026-11-01T00:00", "2026-11-01T01:00"], windspeed_10m: [null, "x"], windgusts_10m: [undefined, NaN], precipitation: [0, 0] },
    startDateISO: "2026-11-01",
    days: 1,
    hazards: HAZARDS_V1,
  }),
);

// --- scoreAuroraVisibility: HIGH_WIND_MS_THRESHOLD=12 boundary, missing windSpeed ---
// v2 correction (R4): v1's hand-built fixture never reached the "scored"
// branch (it fell into "not_viewable_tonight"/no_observation_data every
// time), so the >=12 flag comparator was never actually observed. Reusing
// (read-only, unmodified) the exact known-good scored-branch fixture shape
// from src/lib/auroraScoring.test.js's "high activity + clear sky" case --
// EVENING_DATE "2026-08-24", the same baseNight()/WIDE_VIEWING_WINDOW, and
// the same rowTimeIso()/WINDOW_HOURS hourly-row construction -- so the only
// thing varied here is windSpeed itself, isolating the wind-flag boundary.
const EVENING_DATE = "2026-08-24";
function baseNight(overrides = {}) {
  return {
    eveningDate: EVENING_DATE,
    auroraActivity: 9,
    sun: { sunset: "21:13", darknessStart: "22:00", dawn: "05:00", sunrise: "05:49" },
    moon: { ageDays: 0, rise: null, set: null, scheduleType: 1 },
    ...overrides,
  };
}
const WINDOW_HOURS = ["22:00", "23:00", "00:00", "01:00", "02:00", "03:00", "04:00"];
function rowTimeIso(hhmm) {
  const [h] = hhmm.split(":").map(Number);
  const dayOffset = h < 12 ? 1 : 0;
  const base = Date.parse(`${EVENING_DATE}T00:00:00Z`);
  const ms = base + dayOffset * 24 * 3600 * 1000 + h * 3600 * 1000;
  return new Date(ms).toISOString();
}
function baseHourlyRows({ cloudTotal = 0, precipitation = 0, windSpeed = 1 } = {}) {
  return WINDOW_HOURS.map((hhmm) => ({
    time: rowTimeIso(hhmm),
    cloudTotal,
    cloudLow: cloudTotal,
    cloudMid: 0,
    cloudHigh: 0,
    precipitation,
    windSpeed,
    visibility: 10000,
  }));
}
const WIDE_VIEWING_WINDOW = { start: "2026-08-24T18:00:00Z", end: "2026-08-25T08:00:00Z" };

for (const windSpeed of [11.9, 12, null]) {
  const r = scoreAuroraVisibility({
    night: baseNight(),
    hourlyRows: baseHourlyRows({ cloudTotal: 0, windSpeed }),
    viewingWindow: WIDE_VIEWING_WINDOW,
  });
  const reachedScored = r.status === "scored";
  out(`scoreAuroraVisibility windSpeed=${windSpeed} (scored-branch fixture)`, {
    reachedScoredBranch: reachedScored,
    status: r.status,
    score: r.score,
    flags: r.flags,
    hasHighWindFlag: reachedScored ? r.flags.includes("high_wind") : "N/A — did not reach scored branch, see status",
  });
}

// --- J9 required case: the SAME 18 m/s value as daily max / hourly raw /
// time-weighted, showing different outcomes in voice vs hazard vs route. ---
console.log("\n\n# === Same 18 m/s value: daily-max vs hourly-raw vs time-weighted ===");

// (a) As a provider DAILY MAX field -- what routeRisk.classifyRouteRisk sees directly.
out("routeRisk (daily-max basis, always raw, any hour): maxWind=18", classifyRouteRisk({ maxWind: 18, maxGust: 0, hazards: HAZARDS_V1 }));

// (b) As an HOURLY RAW value at a DAYTIME hour (14:00, weight=1.0) -- hazardWindow sees this raw, unweighted.
out(
  "hazardWindow (hourly-raw basis, unweighted): single hour wind=18 at 14:00",
  detectHazardWindow({
    hourly: { time: ["2026-11-01T14:00"], windspeed_10m: [18], windgusts_10m: [0], precipitation: [0] },
    startDateISO: "2026-11-01",
    days: 1,
    hazards: HAZARDS_V1,
  }),
);

// (c) Same raw hourly 18 m/s, but at a NIGHTTIME hour (02:00, weight=0.45) -- hazardWindow is still
// unweighted, so this is identical in hazardWindow's eyes regardless of hour.
out(
  "hazardWindow (hourly-raw basis, unweighted): single hour wind=18 at 02:00 (same tier as daytime)",
  detectHazardWindow({
    hourly: { time: ["2026-11-01T02:00"], windspeed_10m: [18], windgusts_10m: [0], precipitation: [0] },
    startDateISO: "2026-11-01",
    days: 1,
    hazards: HAZARDS_V1,
  }),
);

// (d) Feed the SAME raw hourly 18 m/s through forecastNormalize.normalizeDailyToScoreInput,
// once peaking at a daytime hour and once at a nighttime hour, to get the real TIME-WEIGHTED
// windMax that actually reaches weatherVoiceEngine.evaluateWeatherVoice.
function dayRow(peakHour) {
  const daily = {
    time: ["2026-11-01"],
    temperature_2m_max: [10],
    temperature_2m_min: [5],
    precipitation_sum: [0],
    windspeed_10m_max: [18], // raw provider daily max field, same in both cases
    windgusts_10m_max: [0],
    winddirection_10m_dominant: [180],
    weathercode: [1],
  };
  const hours = Array.from({ length: 24 }, (_, h) => `2026-11-01T${String(h).padStart(2, "0")}:00`);
  const winds = hours.map((_, h) => (h === peakHour ? 18 : 0));
  const hourly = { time: hours, windspeed_10m: winds, windgusts_10m: hours.map(() => 0), precipitation: hours.map(() => 0) };
  return normalizeDailyToScoreInput(daily, hourly)[0];
}

const daytimeRow = dayRow(14); // weight 1.0
const nighttimeRow = dayRow(2); // weight 0.45
out("forecastNormalize time-weighted windMax: raw 18 m/s peak at 14:00 (daytime, weight 1.0)", { windMax: daytimeRow.windMax });
out("forecastNormalize time-weighted windMax: raw 18 m/s peak at 02:00 (nighttime, weight 0.45)", { windMax: nighttimeRow.windMax });

out(
  "weatherVoiceEngine on the DAYTIME time-weighted windMax (same raw 18 m/s event)",
  evaluateWeatherVoice({ windMax: daytimeRow.windMax, tmax: daytimeRow.tmax, rain: daytimeRow.rain, code: daytimeRow.code }),
);
out(
  "weatherVoiceEngine on the NIGHTTIME time-weighted windMax (same raw 18 m/s event, different hour)",
  evaluateWeatherVoice({ windMax: nighttimeRow.windMax, tmax: nighttimeRow.tmax, rain: nighttimeRow.rain, code: nighttimeRow.code }),
);
out(
  "weatherVoiceEngine on the NO-HOURLY-DATA fallback (raw unweighted daily max = 18, same as routeRisk sees)",
  (() => {
    const daily = {
      time: ["2026-11-01"],
      temperature_2m_max: [10],
      temperature_2m_min: [5],
      precipitation_sum: [0],
      windspeed_10m_max: [18],
      windgusts_10m_max: [0],
      winddirection_10m_dominant: [180],
      weathercode: [1],
    };
    const row = normalizeDailyToScoreInput(daily, null)[0];
    return { windMaxUsed: row.windMax, result: evaluateWeatherVoice({ windMax: row.windMax, tmax: row.tmax, rain: row.rain, code: row.code }) };
  })(),
);

// --- J5 case 4: estimateRouteRisk when every sampled point's forecast fetch fails ---
import { estimateRouteRisk } from "../../../../src/lib/routeRisk.js";
(async () => {
  const r = await estimateRouteRisk({
    origin: { lat: 64.0, lon: -21.0 },
    destination: { lat: 64.5, lon: -20.0 },
    getForecast: async () => null, // every point's fetch "fails"
    hazards: HAZARDS_V1,
    samples: 4,
  });
  out("estimateRouteRisk: every sampled point's forecast fetch returns null (all-failed path)", r);
})();
