// Ticket #492, time-slider, P8 -- fixture generator for the browser
// evidence screenshots/measurements below. Calls the REAL
// api/winter-route-geometry.js + api/winter-route-data.js handlers
// directly (makeReq/makeRes + a stubbed global.fetch standing in for
// Vegagerðin/Open-Meteo), same technique api/winter-route-data.test.js
// and every prior round's own evidence script used.
//
// UNLIKE every prior round's own evidence script, this one is kept
// (P8: "vistuð skripta ... aldrei eyða henni eftir keyrslu" -- Jonesy's
// own round-3 finding R4 was that the script had been deleted three
// times in a row). Run from the repo root: `node docs/ai/tasks/ticket-
// 492/time-slider/evidence/time-slider-fixtures.mjs`.
//
// The REAL computeForecastWindow always returns a fixed 24-hour window
// starting at the next full UTC hour -- it cannot itself produce a
// 1-slot or 0-slot window. The 24-slot fixture below is the real,
// unmodified handler output (naturally crossing midnight whenever the
// script happens to run close enough to it; otherwise still 24 real
// contiguous hours, which is what the slider actually renders against
// day in day out). The 1-slot and 0-slot fixtures are the SAME real
// handler output with `forecast.window.expectedHours`/`points[].hours`/
// `points[].series` truncated afterwards -- the same technique already
// used throughout this ticket's own WinterRoute.test.jsx fixtures (e.g.
// manually overriding `d.forecast.window.expectedHours`), not a new
// convention.
process.env.OPEN_METEO_API_KEY = "test-key";

import geometryHandler from "../../../../../../api/winter-route-geometry.js";
import dataHandler from "../../../../../../api/winter-route-data.js";
import { __resetWinterRouteCacheForTests } from "../../../../../../api/_lib/winterRoute/cache.js";
import { resolveBudardalurHolmavikGeometry, BUDARDALUR_HOLMAVIK_FORECAST_POINTS } from "../../../../../../api/_lib/winterRoute/budardalurHolmavikRoute.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function makeReq(method, query) {
  return { method, url: "/api/x", query };
}
function makeRes() {
  return {
    statusCode: 200, headers: {}, body: null,
    setHeader(n, v) { this.headers[n] = v; },
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
    end() { return this; },
  };
}
function okJsonResponse(body) {
  return { ok: true, text: async () => JSON.stringify(body) };
}
function validSegmentRow(idButur, overrides = {}) {
  return {
    IdButur: idButur, AstandYfirbord: "GREIDFAERT", AstandVidbotaruppl: null,
    AstandLysing: "Greiðfært", AstandLysingEn: "Easily passable",
    DagsSkrad: "2026-11-25T08:00:00Z", DagsKeyrtUt: "2026-11-25T08:05:00Z",
    ...overrides,
  };
}
function forecastApiResponse(points, window) {
  return points.map((p, i) => ({
    latitude: p.lat, longitude: p.lon, elevation: 10 + i, utc_offset_seconds: 0,
    hourly_units: { temperature_2m: "°C", wind_speed_10m: "m/s", wind_gusts_10m: "m/s", precipitation: "mm", weather_code: "wmo code" },
    hourly: {
      time: window,
      temperature_2m: window.map((_, h) => -2 - h * 0.3 - i),
      wind_speed_10m: window.map((_, h) => 3 + h * 0.4),
      wind_gusts_10m: window.map((_, h) => 6 + h * 0.5),
      precipitation: window.map((_, h) => (h % 4 === 0 ? 0.6 : 0)),
      weather_code: window.map((_, h) => (h % 6 === 0 ? 71 : 3)),
    },
  }));
}

// marks-fix round, P2(ii) -- the real `computeForecastWindow` always
// starts at the next full UTC hour after "now", read fresh inside the
// real handler itself (`const now = new Date()`), not an injectable
// parameter. To get a window that starts at a SPECIFIC hour (23:00,
// 03:00, or an sm:-threshold hour) this temporarily substitutes
// `global.Date` for the duration of the real handler call only, then
// restores the real one -- the same idea as `vi.useFakeTimers`, done
// manually since this is a plain Node script, not a vitest file.
async function withFakeNow(fakeNowIso, fn) {
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...args) {
      super(...(args.length === 0 ? [fakeNowIso] : args));
    }
    static now() {
      return new RealDate(fakeNowIso).getTime();
    }
  }
  global.Date = FakeDate;
  try {
    return await fn();
  } finally {
    global.Date = RealDate;
  }
}

async function buildBudardalurHolmavik() {
  __resetWinterRouteCacheForTests();
  const geo = resolveBudardalurHolmavikGeometry("budardalur", "holmavik");

  const geoReq = makeReq("GET", { from: "budardalur", to: "holmavik" });
  const geoRes = makeRes();
  await geometryHandler(geoReq, geoRes);
  if (geoRes.statusCode !== 200) throw new Error(`geometry failed ${geoRes.statusCode} ${JSON.stringify(geoRes.body)}`);
  const geometryId = geoRes.body.geometryId;

  global.fetch = async (url) => {
    const u = String(url);
    if (u.includes("faerdpunktar")) return okJsonResponse([]);
    if (u.includes("faerd2017_1")) return okJsonResponse(geo.idButurList.map((id) => validSegmentRow(id)));
    const params = new URL(u).searchParams;
    const start = params.get("start_hour"), end = params.get("end_hour");
    const window = [];
    let cur = new Date(start);
    const endDate = new Date(end);
    while (cur.getTime() <= endDate.getTime()) {
      window.push(cur.toISOString().slice(0, 13) + ":00");
      cur = new Date(cur.getTime() + 3600000);
    }
    return okJsonResponse(forecastApiResponse(BUDARDALUR_HOLMAVIK_FORECAST_POINTS, window));
  };

  const dataReq = makeReq("GET", { from: "budardalur", to: "holmavik", geometryId });
  const dataRes = makeRes();
  await dataHandler(dataReq, dataRes);
  if (dataRes.statusCode !== 200) throw new Error(`data failed ${dataRes.statusCode} ${JSON.stringify(dataRes.body)}`);

  return { geometry: geoRes.body, data: dataRes.body };
}

function truncateTo(data, count) {
  const d = JSON.parse(JSON.stringify(data));
  const hours = d.forecast.window.expectedHours.slice(0, count);
  d.forecast.window = { startHour: hours[0] ?? null, endHour: hours[hours.length - 1] ?? null, expectedHours: hours };
  d.forecast.points = d.forecast.points.map((p) => ({
    ...p,
    hours,
    series: Object.fromEntries(Object.entries(p.series).map(([k, v]) => [k, v.slice(0, count)])),
  }));
  return d;
}

const { geometry, data: data24 } = await buildBudardalurHolmavik();
const data1 = truncateTo(data24, 1);
const data0 = truncateTo(data24, 0);

const out = { geometry, data24, data1, data0 };
fs.writeFileSync(path.join(__dirname, "time-slider-fixtures.json"), JSON.stringify(out, null, 2));
console.log("wrote time-slider-fixtures.json");
console.log("data24 hours:", data24.forecast.window.expectedHours.length, data24.forecast.window.expectedHours[0], "..", data24.forecast.window.expectedHours.at(-1));
console.log("data1 hours:", data1.forecast.window.expectedHours.length);
console.log("data0 hours:", data0.forecast.window.expectedHours.length);

// marks-fix round, P2(ii) -- real 24-hour windows starting at 23:00 and
// 03:00 UTC (the exact class of window Jonesy's own measurement found
// overlapping on the OLD fixed-6-mark scheme), plus one window starting
// at an hour that collides with the `sm:` secondary-mark threshold
// (11:00 -- chosen from Jonesy's own list of colliding start hours:
// 02,11,13,15,17,19,21,23).
const marksFixDir = path.join(__dirname, "marks-fix");
fs.mkdirSync(marksFixDir, { recursive: true });

const { geometry: geo2300, data: data2300 } = await withFakeNow("2026-11-25T22:45:00.000Z", () => buildBudardalurHolmavik());
const { geometry: geo0300, data: data0300 } = await withFakeNow("2026-11-25T02:45:00.000Z", () => buildBudardalurHolmavik());
const { geometry: geo1100, data: data1100 } = await withFakeNow("2026-11-25T10:45:00.000Z", () => buildBudardalurHolmavik());

const marksFixOut = {
  start2300: { geometry: geo2300, data: data2300 },
  start0300: { geometry: geo0300, data: data0300 },
  start1100: { geometry: geo1100, data: data1100 },
};
fs.writeFileSync(path.join(marksFixDir, "marks-fix-fixtures.json"), JSON.stringify(marksFixOut, null, 2));
console.log("wrote marks-fix/marks-fix-fixtures.json");
console.log("start2300:", data2300.forecast.window.expectedHours[0], "..", data2300.forecast.window.expectedHours.at(-1));
console.log("start0300:", data0300.forecast.window.expectedHours[0], "..", data0300.forecast.window.expectedHours.at(-1));
console.log("start1100:", data1100.forecast.window.expectedHours[0], "..", data1100.forecast.window.expectedHours.at(-1));
