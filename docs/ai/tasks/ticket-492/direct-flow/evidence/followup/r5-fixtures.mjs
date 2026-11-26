// Ticket #492, direct-flow round 2, V5/R5 -- fresh (non-stale), real-
// handler-built fixtures for the browser evidence re-run. Round 1's own
// fixtures used a hardcoded past timestamp (2026-11-25T08:00/08:05 UTC),
// which read as stale by the time the evidence script actually ran,
// making every section "flagged" and collapsing the narrow/full-list
// distinction entirely. Fixed here by freezing the generation clock
// (withFakeNow) to a time shortly before each segment's own DagsSkrad/
// DagsKeyrtUt, well within the freshness window, and recording that same
// frozen time so the evidence driver can freeze the BROWSER clock to
// match (same technique as the time-slider round's own
// time-slider-fixtures.mjs).
process.env.OPEN_METEO_API_KEY = "test-key";

import winterRouteHandler from "../../../../../../../api/winter-route.js";
import { __resetWinterRouteCacheForTests } from "../../../../../../../api/_lib/winterRoute/cache.js";
import { WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS } from "../../../../../../../api/_lib/winterRoute/segments.js";
import { BORGARNES_IDBUTUR_LIST, BORGARNES_FORECAST_POINTS } from "../../../../../../../api/_lib/winterRoute/routes.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The frozen "now" every fixture below is generated at, AND the time the
// evidence driver must freeze the browser clock to (recorded in the
// output JSON so the driver reads it, rather than restating it).
const FROZEN_NOW_ISO = "2026-11-26T09:15:00.000Z";
const FRESH_DAGS = "2026-11-26T08:50:00.000Z"; // 25 min before frozen now -- comfortably fresh

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
function freshSegmentRow(idButur, overrides = {}) {
  return {
    IdButur: idButur, AstandYfirbord: "GREIDFAERT", AstandVidbotaruppl: null,
    AstandLysing: "Greiðfært", AstandLysingEn: "Easily passable",
    DagsSkrad: FRESH_DAGS, DagsKeyrtUt: FRESH_DAGS,
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

async function buildFixedRoute(routeId, idButurList, forecastPoints, { segmentRows, pointRows = [] } = {}) {
  __resetWinterRouteCacheForTests();
  const rows = segmentRows ? segmentRows(idButurList) : idButurList.map((id) => freshSegmentRow(id));

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

  return withFakeNow(FROZEN_NOW_ISO, async () => {
    const req = makeReq("GET", { routeId });
    const res = makeRes();
    await winterRouteHandler(req, res);
    if (res.statusCode !== 200) throw new Error(`winter-route (${routeId}) failed ${res.statusCode} ${JSON.stringify(res.body)}`);
    return res.body;
  });
}

// "main" fixture per route: segment[0] = known surface + 2 notices (one
// unclassified, one classified -- proves "2 notices on 1 segment" AND
// case A); segment[1] = ambiguous (duplicate rows, no closure -- case
// B); every other segment plain/clean/NOT flagged (proves narrow < full).
function mainSegmentRows(idButurList) {
  const [first, second] = idButurList;
  return idButurList.flatMap((id) => {
    if (id === second) {
      // Two contradictory rows for the same IdButur -> ambiguous:true.
      return [freshSegmentRow(id), { ...freshSegmentRow(id), AstandYfirbord: "HALKA", AstandLysing: "Hálka", AstandLysingEn: "Icy" }];
    }
    return [freshSegmentRow(id)];
  });
}
function mainPointRows(idButurList) {
  const first = idButurList[0];
  return [
    { IdButur: first, IdPunktur: 9001, Astand: "TONN_ALLS", Lysing: "Tonn alls á dag: 8", LysingEn: "Total tonnes per day: 8", DagsSkrad: FRESH_DAGS, DagsKeyrtUt: FRESH_DAGS, GildirTil: "2026-12-26T00:00:00Z" },
    { IdButur: first, IdPunktur: 9002, Astand: "VEGAVINNA", Lysing: "Vegavinna á kafla", LysingEn: "Roadworks on this section", DagsSkrad: FRESH_DAGS, DagsKeyrtUt: FRESH_DAGS, GildirTil: "2026-12-26T00:00:00Z" },
  ];
}

// "zero notices" / "one notice" variants (V5(d), separate small runs).
// `FEED_MARKER_ROW` has an IdButur outside this route's own list, so it
// never becomes a real notice on any segment -- its only purpose is to
// carry a fresh `DagsKeyrtUt`, the same way the real feed's own shared
// per-export timestamp would, so `pointsFeedUnavailableOrStale` reads
// false for a genuinely confirmed "all clear" (an empty points response
// with NO row at all cannot tell "confirmed clear" apart from "the feed
// itself might be broken" -- real points feed timestamps are never
// actually empty in the live feed, so this only avoids a test artifact).
const FEED_MARKER_ROW = { IdButur: 0, IdPunktur: 0, Astand: "VEGAVINNA", Lysing: "n/a", LysingEn: "n/a", DagsSkrad: FRESH_DAGS, DagsKeyrtUt: FRESH_DAGS, GildirTil: FRESH_DAGS };
function oneNoticeRows(idButurList) {
  return [
    FEED_MARKER_ROW,
    { IdButur: idButurList[0], IdPunktur: 9101, Astand: "VEGAVINNA", Lysing: "Vegavinna", LysingEn: "Roadworks", DagsSkrad: FRESH_DAGS, DagsKeyrtUt: FRESH_DAGS, GildirTil: "2026-12-26T00:00:00Z" },
  ];
}

const out = {
  frozenNowIso: FROZEN_NOW_ISO,
  vikMain: await buildFixedRoute("raudavatn-vik", WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS, {
    segmentRows: mainSegmentRows, pointRows: mainPointRows(WINTER_ROUTE_IDBUTUR_LIST),
  }),
  borgarnesMain: await buildFixedRoute("raudavatn-borgarnes", BORGARNES_IDBUTUR_LIST, BORGARNES_FORECAST_POINTS, {
    segmentRows: mainSegmentRows, pointRows: mainPointRows(BORGARNES_IDBUTUR_LIST),
  }),
  vikZeroNotices: await buildFixedRoute("raudavatn-vik", WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS, {
    pointRows: [FEED_MARKER_ROW],
  }),
  vikOneNotice: await buildFixedRoute("raudavatn-vik", WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS, {
    pointRows: oneNoticeRows(WINTER_ROUTE_IDBUTUR_LIST),
  }),
};

fs.writeFileSync(path.join(__dirname, "r5-fixtures.json"), JSON.stringify(out, null, 2));
console.log("wrote r5-fixtures.json");
console.log("vikMain: segments", out.vikMain.segments.length, "seg0 category", out.vikMain.segments[0].category, "seg0 export.isStale", out.vikMain.segments[0].export.isStale, "seg1 ambiguous", out.vikMain.segments[1].ambiguous, "seg2 category", out.vikMain.segments[2].category);
console.log("borgarnesMain: segments", out.borgarnesMain.segments.length, "seg0 category", out.borgarnesMain.segments[0].category);
console.log("vikZeroNotices: any export.isStale?", out.vikZeroNotices.segments.some((s) => s.export.isStale));
console.log("vikOneNotice: notices total", out.vikOneNotice.segments.reduce((a, s) => a + s.notices.length, 0));
