// Ticket #492, direct-flow round 2, V3(b)/R3 -- real-handler-shaped C4
// fixtures. Calls the REAL api/winter-route.js (fixed pair) and REAL
// api/winter-route-data.js (one old pair, Búðardalur<->Hólmavík) with a
// stubbed upstream `fetch` that simulates (i) the road feed failing
// while the forecast succeeds, and (ii) the forecast failing while the
// road feed succeeds -- never a hand-made fixture shape with a
// fabricated `registration` field (the actual C4 bug: a segment the
// real handler marks `segmentDataAvailable:false` never carries
// `registration` at all). Kept on disk (same convention as every other
// evidence script in this ticket). Run from the repo root:
//   node docs/ai/tasks/ticket-492/direct-flow/evidence/followup/c4-fixtures.mjs
process.env.OPEN_METEO_API_KEY = "test-key";

import winterRouteHandler from "../../../../../../../api/winter-route.js";
import dataHandler from "../../../../../../../api/winter-route-data.js";
import { __resetWinterRouteCacheForTests } from "../../../../../../../api/_lib/winterRoute/cache.js";
import { WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS } from "../../../../../../../api/_lib/winterRoute/segments.js";
import { resolveBudardalurHolmavikGeometry, BUDARDALUR_HOLMAVIK_FORECAST_POINTS } from "../../../../../../../api/_lib/winterRoute/budardalurHolmavikRoute.js";
import geometryHandler from "../../../../../../../api/winter-route-geometry.js";
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
function downResponse() {
  return { ok: false, status: 503, text: async () => "" };
}
function plainSegmentRow(idButur) {
  return {
    IdButur: idButur, AstandYfirbord: "GREIDFAERT", AstandVidbotaruppl: null,
    AstandLysing: "Greiðfært", AstandLysingEn: "Easily passable",
    DagsSkrad: "2026-11-25T08:00:00Z", DagsKeyrtUt: "2026-11-25T08:05:00Z",
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
function forecastWindowFrom(url) {
  const params = new URL(url).searchParams;
  const start = params.get("start_hour"), end = params.get("end_hour");
  const window = [];
  let cur = new Date(start);
  const endDate = new Date(end);
  while (cur.getTime() <= endDate.getTime()) {
    window.push(cur.toISOString().slice(0, 13) + ":00");
    cur = new Date(cur.getTime() + 3600000);
  }
  return window;
}

// --- Fixed pair (Rauðavatn-Vík): road down + forecast ok, and forecast
// down + road ok. ---
async function buildFixedCase({ roadDown, forecastDown }) {
  __resetWinterRouteCacheForTests();
  global.fetch = async (url) => {
    const u = String(url);
    if (u.includes("faerdpunktar")) return roadDown ? downResponse() : okJsonResponse([]);
    if (u.includes("faerd2017_1")) return roadDown ? downResponse() : okJsonResponse(WINTER_ROUTE_IDBUTUR_LIST.map(plainSegmentRow));
    if (forecastDown) return downResponse();
    return okJsonResponse(forecastApiResponse(WINTER_ROUTE_FORECAST_POINTS, forecastWindowFrom(u)));
  };
  const req = makeReq("GET", { routeId: "raudavatn-vik" });
  const res = makeRes();
  await winterRouteHandler(req, res);
  if (res.statusCode !== 200) throw new Error(`winter-route failed ${res.statusCode} ${JSON.stringify(res.body)}`);
  return res.body;
}

// --- Old pair (Búðardalur<->Hólmavík): same two cases, via the real
// geometry handler (for geometryId) + the real data handler. ---
async function buildOldPairCase({ roadDown, forecastDown }) {
  __resetWinterRouteCacheForTests();
  const geoReq = makeReq("GET", { from: "budardalur", to: "holmavik" });
  const geoRes = makeRes();
  // The geometry handler itself needs no upstream fetch (static table).
  await geometryHandler(geoReq, geoRes);
  if (geoRes.statusCode !== 200) throw new Error(`geometry failed ${geoRes.statusCode}`);
  const geometryId = geoRes.body.geometryId;
  const geo = resolveBudardalurHolmavikGeometry("budardalur", "holmavik");

  global.fetch = async (url) => {
    const u = String(url);
    if (u.includes("faerdpunktar")) return roadDown ? downResponse() : okJsonResponse([]);
    if (u.includes("faerd2017_1")) return roadDown ? downResponse() : okJsonResponse(geo.idButurList.map(plainSegmentRow));
    if (forecastDown) return downResponse();
    return okJsonResponse(forecastApiResponse(BUDARDALUR_HOLMAVIK_FORECAST_POINTS, forecastWindowFrom(u)));
  };

  const dataReq = makeReq("GET", { from: "budardalur", to: "holmavik", geometryId });
  const dataRes = makeRes();
  await dataHandler(dataReq, dataRes);
  if (dataRes.statusCode !== 200) throw new Error(`data failed ${dataRes.statusCode} ${JSON.stringify(dataRes.body)}`);
  return { geometry: geoRes.body, data: dataRes.body };
}

const out = {
  fixedVik_roadDown_forecastOk: await buildFixedCase({ roadDown: true, forecastDown: false }),
  fixedVik_forecastDown_roadOk: await buildFixedCase({ roadDown: false, forecastDown: true }),
  oldPairBH_roadDown_forecastOk: await buildOldPairCase({ roadDown: true, forecastDown: false }),
  oldPairBH_forecastDown_roadOk: await buildOldPairCase({ roadDown: false, forecastDown: true }),
};

fs.writeFileSync(path.join(__dirname, "c4-fixtures.json"), JSON.stringify(out, null, 2));
console.log("wrote c4-fixtures.json");
console.log("fixedVik_roadDown_forecastOk: roadMeta.available=", out.fixedVik_roadDown_forecastOk.roadMeta.available, "segment0.segmentDataAvailable=", out.fixedVik_roadDown_forecastOk.segments[0].segmentDataAvailable, "segment0 has registration?", "registration" in out.fixedVik_roadDown_forecastOk.segments[0], "forecast.available=", out.fixedVik_roadDown_forecastOk.forecast.available);
console.log("fixedVik_forecastDown_roadOk: roadMeta.available=", out.fixedVik_forecastDown_roadOk.roadMeta.available, "forecast.available=", out.fixedVik_forecastDown_roadOk.forecast.available);
console.log("oldPairBH_roadDown_forecastOk: roadMeta.available=", out.oldPairBH_roadDown_forecastOk.data.roadMeta.available, "segment0 has registration?", "registration" in out.oldPairBH_roadDown_forecastOk.data.roadSections[0], "forecast.available=", out.oldPairBH_roadDown_forecastOk.data.forecast.available);
console.log("oldPairBH_forecastDown_roadOk: roadMeta.available=", out.oldPairBH_forecastDown_roadOk.data.roadMeta.available, "forecast.available=", out.oldPairBH_forecastDown_roadOk.data.forecast.available);
