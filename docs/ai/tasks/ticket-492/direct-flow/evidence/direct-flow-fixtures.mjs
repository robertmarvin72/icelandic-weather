// Ticket #492, direct-flow, C7/P8 -- fixture generator for the browser
// evidence below. Calls the REAL api/winter-route.js handler directly
// (makeReq/makeRes + a stubbed global.fetch standing in for Vegagerðin/
// Open-Meteo), the same technique every prior round's own evidence
// script in this ticket used (see ../../time-slider/evidence/
// time-slider-fixtures.mjs). Kept on disk after running (P8 convention
// from the time-slider round -- never delete the evidence script).
//
// Run from the repo root with vite dev NOT required for this script
// itself (only the later *-evidence.mjs driver needs vite dev running):
//   node docs/ai/tasks/ticket-492/direct-flow/evidence/direct-flow-fixtures.mjs
process.env.OPEN_METEO_API_KEY = "test-key";

import winterRouteHandler from "../../../../../../api/winter-route.js";
import { __resetWinterRouteCacheForTests } from "../../../../../../api/_lib/winterRoute/cache.js";
import { WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS } from "../../../../../../api/_lib/winterRoute/segments.js";
import { BORGARNES_IDBUTUR_LIST, BORGARNES_FORECAST_POINTS } from "../../../../../../api/_lib/winterRoute/routes.js";
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

// A plain, fully-"known" row for a given IdButur -- GREIDFAERT surface,
// no additional-info code, fresh timestamps.
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

// `segmentRows(idButurList)` returns the faerd2017_1 rows (default: every
// id plain/known); `pointRows` are the faerdpunktar2017_1 rows (default:
// none). `forecastPoints` is the route's own WINTER_ROUTE_FORECAST_POINTS/
// BORGARNES_FORECAST_POINTS list, used only to shape the Open-Meteo stub.
async function buildFixedRoute(routeId, idButurList, forecastPoints, { segmentRows, pointRows = [] } = {}) {
  __resetWinterRouteCacheForTests();
  const rows = segmentRows ? segmentRows(idButurList) : idButurList.map(plainSegmentRow);

  global.fetch = async (url) => {
    const u = String(url);
    if (u.includes("faerdpunktar")) return okJsonResponse(pointRows);
    if (u.includes("faerd2017_1")) return okJsonResponse(rows);
    const params = new URL(u).searchParams;
    const start = params.get("start_hour"), end = params.get("end_hour");
    const window = [];
    let cur = new Date(start);
    const endDate = new Date(end);
    while (cur.getTime() <= endDate.getTime()) {
      window.push(cur.toISOString().slice(0, 13) + ":00");
      cur = new Date(cur.getTime() + 3600000);
    }
    return okJsonResponse(forecastApiResponse(forecastPoints, window));
  };

  const req = makeReq("GET", { routeId });
  const res = makeRes();
  await winterRouteHandler(req, res);
  if (res.statusCode !== 200) throw new Error(`winter-route (${routeId}) failed ${res.statusCode} ${JSON.stringify(res.body)}`);
  return res.body;
}

const out = {};

// --- Plain Vík / Borgarnes (the two fixed-route-adapter pairs, C1/C2/C3). ---
out.vik = await buildFixedRoute("raudavatn-vik", WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS);
out.borgarnes = await buildFixedRoute("raudavatn-borgarnes", BORGARNES_IDBUTUR_LIST, BORGARNES_FORECAST_POINTS);

// --- P6 path A: a KNOWN surface (GREIDFAERT) + an UNCLASSIFIED point
// notice on the SAME segment (the first Vík idButur) -- plus a second,
// classified notice on the SAME segment too (proves "2 notices on 1
// segment counts as 1" in the summary line), and one more classified
// notice on a DIFFERENT segment (proves the count is 2 distinct
// segments, not 3 notices). The composite category for the first
// segment is pulled to "unknown_unclassified" by the undocumented
// notice code alone -- the frontend fix must show the real "Greiðfært"
// pill there, not "Óþekkt ástand".
{
  const first = WINTER_ROUTE_IDBUTUR_LIST[0];
  const second = WINTER_ROUTE_IDBUTUR_LIST[1];
  out.caseA_knownSurfaceUnclassifiedNotice = await buildFixedRoute(
    "raudavatn-vik", WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS,
    {
      pointRows: [
        // Undocumented code, same sample as roadConditionCodes.js's own
        // retained-sample comment ("TONN_ALLS and HOLUR_I_VEGI").
        { IdButur: first, IdPunktur: 9001, Astand: "TONN_ALLS", Lysing: "Tonn alls á dag: 8", LysingEn: "Total tonnes per day: 8", DagsSkrad: "2026-11-25T08:00:00Z", GildirTil: "2026-12-25T00:00:00Z" },
        { IdButur: first, IdPunktur: 9002, Astand: "VEGAVINNA", Lysing: "Vegavinna á kafla", LysingEn: "Roadworks on this section", DagsSkrad: "2026-11-25T08:00:00Z", GildirTil: "2026-12-25T00:00:00Z" },
        { IdButur: second, IdPunktur: 9003, Astand: "STEINKAST", Lysing: "Hætta á grjóthruni", LysingEn: "Risk of rockfall", DagsSkrad: "2026-11-25T08:00:00Z", GildirTil: "2026-12-25T00:00:00Z" },
      ],
    }
  );
}

// --- P6 path B: ambiguous -- two contradictory faerd2017_1 rows for the
// SAME idButur (GREIDFAERT vs HALKA), neither a closure, so no
// forcedCategory. Must stay "Óþekkt ástand" (never swapped to either
// candidate's own surface label).
{
  const first = WINTER_ROUTE_IDBUTUR_LIST[0];
  out.caseB_ambiguous = await buildFixedRoute("raudavatn-vik", WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS, {
    segmentRows: (ids) => ids.flatMap((id) =>
      id === first
        ? [plainSegmentRow(id), { ...plainSegmentRow(id), AstandYfirbord: "HALKA", AstandLysing: "Hálka", AstandLysingEn: "Icy" }]
        : [plainSegmentRow(id)]
    ),
  });
}

// --- P6 path C: the surface's OWN AstandYfirbord code is itself
// unregistered (never seen in the documented table) -- must also stay
// "Óþekkt ástand" (the surface itself genuinely is unknown here, unlike
// path A).
{
  const first = WINTER_ROUTE_IDBUTUR_LIST[0];
  out.caseC_unclassifiedSurface = await buildFixedRoute("raudavatn-vik", WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS, {
    segmentRows: (ids) => ids.map((id) =>
      id === first ? { ...plainSegmentRow(id), AstandYfirbord: "HOLUR_I_VEGI", AstandLysing: "Holur í vegi", AstandLysingEn: "Potholes" } : plainSegmentRow(id)
    ),
  });
}

// --- known surface + unclassified astandVidbotaruppl (the 5th P6(e)
// required case) -- also must stay "Óþekkt ástand".
{
  const first = WINTER_ROUTE_IDBUTUR_LIST[0];
  out.caseD_knownSurfaceUnclassifiedVidbotaruppl = await buildFixedRoute("raudavatn-vik", WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS, {
    segmentRows: (ids) => ids.map((id) =>
      id === first ? { ...plainSegmentRow(id), AstandVidbotaruppl: "EINHVER_OSKRASET_KODI" } : plainSegmentRow(id)
    ),
  });
}

fs.writeFileSync(path.join(__dirname, "direct-flow-fixtures.json"), JSON.stringify(out, null, 2));
console.log("wrote direct-flow-fixtures.json");
for (const [k, v] of Object.entries(out)) {
  console.log(k, "-> routeId:", v.routeId, "segments:", v.segments?.length, "forecast points:", v.forecast?.points?.length);
}
