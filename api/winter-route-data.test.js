// @vitest-environment node
// api/winter-route-data.test.js — Ticket #503, P7(a)/(b)
import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./winter-route-data.js";
import { __resetWinterRouteCacheForTests } from "./_lib/winterRoute/cache.js";
import { computeForecastWindow } from "./_lib/winterRoute/forecastFetch.js";
import { resolveBudardalurHolmavikGeometry, BUDARDALUR_HOLMAVIK_FORECAST_POINTS } from "./_lib/winterRoute/budardalurHolmavikRoute.js";
import { resolveWestfjordsBatchGeometry } from "./_lib/winterRoute/westfjordsBatchRoute.js";
import { resolveWestfjordsCompletionGeometry } from "./_lib/winterRoute/westfjordsCompletionRoute.js";
import { resolveRingOptionGeometry } from "./_lib/winterRoute/ringOptionsRoute.js";
import { resolveRingCompletionGeometry } from "./_lib/winterRoute/ringCompletionRoute.js";

const EXPECTED_IDBUTUR = [805030037, 905070037, 905080037, 805090037, 907000037, 707040037, 907040037];
const FORWARD_GEOMETRY_ID = resolveBudardalurHolmavikGeometry("budardalur", "holmavik").geometryId;
const REVERSE_GEOMETRY_ID = resolveBudardalurHolmavikGeometry("holmavik", "budardalur").geometryId;

function makeReq(method, query) {
  return { method, url: "/api/winter-route-data", query };
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
    DagsSkrad: "2026-11-23T17:00:00Z", DagsKeyrtUt: "2026-11-23T17:05:00Z",
    ...overrides,
  };
}
function validPointRow(idButur, overrides = {}) {
  return {
    IdButur: idButur, IdPunktur: 1, Astand: "VEGAVINNA", Lysing: "is", LysingEn: "en",
    DagsSkrad: "2026-11-23T17:00:00Z", GildirTil: "2027-01-01T00:00:00Z", DagsKeyrtUt: "2026-11-23T17:05:00Z",
    ...overrides,
  };
}
function forecastApiResponse(window) {
  return BUDARDALUR_HOLMAVIK_FORECAST_POINTS.map((p, i) => ({
    latitude: p.lat, longitude: p.lon, elevation: 10 + i, utc_offset_seconds: 0,
    hourly_units: { temperature_2m: "°C", wind_speed_10m: "m/s", wind_gusts_10m: "m/s", precipitation: "mm", weather_code: "wmo code" },
    hourly: {
      time: window.expectedHours,
      temperature_2m: window.expectedHours.map(() => i),
      wind_speed_10m: window.expectedHours.map(() => 1),
      wind_gusts_10m: window.expectedHours.map(() => 1),
      precipitation: window.expectedHours.map(() => 0),
      weather_code: window.expectedHours.map(() => 0),
    },
  }));
}
function fullStubFetch({ segmentRows, pointRows, forecastBody, forecastCallCount } = {}) {
  const calls = { segments: 0, points: 0, forecast: 0 };
  return {
    calls,
    fn: vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("faerdpunktar")) { calls.points += 1; return Promise.resolve(okJsonResponse(pointRows ?? [])); }
      if (u.includes("faerd2017_1")) { calls.segments += 1; return Promise.resolve(okJsonResponse(segmentRows ?? EXPECTED_IDBUTUR.map((id) => validSegmentRow(id)))); }
      calls.forecast += 1;
      if (forecastCallCount) forecastCallCount.n = (forecastCallCount.n ?? 0) + 1;
      return Promise.resolve(okJsonResponse(forecastBody ?? forecastApiResponse(computeForecastWindow())));
    }),
  };
}

beforeEach(() => {
  __resetWinterRouteCacheForTests();
  vi.restoreAllMocks();
  process.env.OPEN_METEO_API_KEY = "test-key";
});

describe("GET /api/winter-route-data", () => {
  it("rejects non-GET methods and sets Cache-Control: no-store", async () => {
    const res = makeRes();
    await handler(makeReq("POST"), res);
    expect(res.statusCode).toBe(405);
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("400 missing_param when from/to/geometryId are absent", async () => {
    const res1 = makeRes();
    await handler(makeReq("GET", { to: "holmavik", geometryId: "x" }), res1);
    expect(res1.statusCode).toBe(400);
    expect(res1.body).toEqual({ error: "missing_param", field: "from" });

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik" }), res2);
    expect(res2.statusCode).toBe(400);
    expect(res2.body).toEqual({ error: "missing_param", field: "geometryId" });
  });

  it("400 unsupported for any pair other than B<->H, never fabricated data", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "selfoss", geometryId: "x" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("unsupported");
  });

  it("400 geometry_mismatch when the client-supplied geometryId doesn't match the real, server-recomputed one", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: "not-the-real-one" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("geometry_mismatch");
  });

  it("B->H: real 7 IdButur n:1 in exact prompt order, routeLengthM sums to ~78697.77m, edge segments flagged", async () => {
    const stub = fullStubFetch({});
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.from).toBe("budardalur");
    expect(res.body.to).toBe("holmavik");
    expect(res.body.geometryId).toBe(FORWARD_GEOMETRY_ID);
    expect(res.body.roadSections.map((s) => s.idButur)).toEqual(EXPECTED_IDBUTUR);

    const sum = res.body.roadSections.reduce((a, s) => a + s.routeLengthM, 0);
    expect(Math.abs(sum - res.body.routeLengthM)).toBeLessThan(0.01);
    expect(res.body.routeLengthM).toBeCloseTo(78697.77054505677, 1);

    const byId = new Map(res.body.roadSections.map((s) => [s.idButur, s]));
    expect(byId.get(805030037).isEdgeSegment).toBe(true);
    expect(byId.get(907040037).isEdgeSegment).toBe(true);
    expect(byId.get(905070037).isEdgeSegment).toBe(false);
  });

  it("each road section carries the real retained name (IS) and a fixed reviewed EN translation, never a placeholder", async () => {
    const stub = fullStubFetch({});
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    const byId = new Map(res.body.roadSections.map((s) => [s.idButur, s]));
    expect(byId.get(907000037).nameIs).toBe("Þröskuldar");
    expect(byId.get(805090037).nameIs).toBe("Gilsfjörður");
    expect(res.body.roadSections.every((s) => typeof s.nameIs === "string" && s.nameIs.length > 0)).toBe(true);
    expect(res.body.roadSections.every((s) => typeof s.nameEn === "string" && s.nameEn.length > 0)).toBe(true);
  });

  it("H->B: the exact reverse IdButur order, a different geometryId from the forward direction", async () => {
    const stub = fullStubFetch({});
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "budardalur", geometryId: REVERSE_GEOMETRY_ID }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.geometryId).toBe(REVERSE_GEOMETRY_ID);
    expect(res.body.geometryId).not.toBe(FORWARD_GEOMETRY_ID);
    expect(res.body.roadSections.map((s) => s.idButur)).toEqual([...EXPECTED_IDBUTUR].reverse());
  });

  it("forecast points are returned in request-direction order, each point's own data", async () => {
    const stub = fullStubFetch({});
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    expect(res.body.forecast.available).toBe(true);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual([
      "budardalur-route", "throskuldar-south-route", "throskuldar-pass-route", "holmavik-route",
    ]);
    expect(res.body.forecast.points.every((p) => p.available)).toBe(true);
    expect(res.body.forecast.window.expectedHours).toHaveLength(24);

    const resReverse = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "budardalur", geometryId: REVERSE_GEOMETRY_ID }), resReverse);
    expect(resReverse.body.forecast.points.map((p) => p.id)).toEqual([
      "holmavik-route", "throskuldar-pass-route", "throskuldar-south-route", "budardalur-route",
    ]);
  });

  it("key_missing: zero forecast upstream requests, road data unaffected", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    const stub = fullStubFetch({});
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    expect(res.body.forecast.available).toBe(false);
    expect(res.body.forecast.reason).toBe("key_missing");
    expect(stub.calls.forecast).toBe(0);
    expect(res.body.roadSections).toHaveLength(7);
    expect(res.body.roadMeta.available).toBe(true);
  });

  it("P5(c): concurrent B->H and H->B requests on a cold cache share exactly 3 upstream calls (segment+point+forecast), never 6", async () => {
    const stub = fullStubFetch({});
    global.fetch = stub.fn;
    const [res1, res2] = await Promise.all([
      handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), makeRes()),
      handler(makeReq("GET", { from: "holmavik", to: "budardalur", geometryId: REVERSE_GEOMETRY_ID }), makeRes()),
    ]);
    void res1; void res2;
    expect(stub.calls.segments).toBe(1);
    expect(stub.calls.points).toBe(1);
    expect(stub.calls.forecast).toBe(1);
  });

  it("a repeated request within TTL makes zero new upstream calls", async () => {
    const stub = fullStubFetch({});
    global.fetch = stub.fn;
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), makeRes());
    const callsAfterFirst = { ...stub.calls };
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), makeRes());
    expect(stub.calls).toEqual(callsAfterFirst);
  });

  it("a closure on the edge segment 907040037 never implies the whole route is closed — the other 6 sections keep their own real category", async () => {
    const rows = EXPECTED_IDBUTUR.map((id) => (id === 907040037 ? validSegmentRow(id, { AstandYfirbord: "LOKAD" }) : validSegmentRow(id)));
    const stub = fullStubFetch({ segmentRows: rows });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    const byId = new Map(res.body.roadSections.map((s) => [s.idButur, s]));
    expect(byId.get(907040037).category).toBe("closed");
    expect(byId.get(907040037).isEdgeSegment).toBe(true);
    for (const id of [805030037, 905070037, 905080037, 805090037, 907000037, 707040037]) {
      expect(byId.get(id).category).toBe("passable");
    }
  });

  it("closure != roadwork != notice: a point-feed notice is carried as its own category, never collapsed into the segment's base category", async () => {
    const points = [validPointRow(905070037, { Astand: "VEGAVINNA" })];
    const stub = fullStubFetch({ pointRows: points });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    const section = res.body.roadSections.find((s) => s.idButur === 905070037);
    expect(section.notices).toHaveLength(1);
    expect(section.notices[0].astand).toBe("VEGAVINNA");
    expect(section.notices[0].status).toBe("active");
  });

  it("expired notices are marked expired, never silently dropped or treated as active", async () => {
    const points = [validPointRow(905070037, { GildirTil: "2020-01-01T00:00:00Z" })];
    const stub = fullStubFetch({ pointRows: points });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    const section = res.body.roadSections.find((s) => s.idButur === 905070037);
    expect(section.notices[0].status).toBe("expired");
  });

  it("missing row (segment feed has no row for an IdButur) classifies as segmentDataAvailable:false, never a fabricated 'passable'", async () => {
    const rows = EXPECTED_IDBUTUR.filter((id) => id !== 805030037).map((id) => validSegmentRow(id));
    const stub = fullStubFetch({ segmentRows: rows });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    const section = res.body.roadSections.find((s) => s.idButur === 805030037);
    expect(section.segmentDataAvailable).toBe(false);
    expect(section.positiveStyleEligible).toBe(false);
  });

  it("R1a: point feed down => no segment anywhere gets positive styling, even though the segment feed itself says passable", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("faerdpunktar")) return Promise.resolve({ ok: false, status: 500 });
      if (u.includes("faerd2017_1")) return Promise.resolve(okJsonResponse(EXPECTED_IDBUTUR.map((id) => validSegmentRow(id))));
      return Promise.resolve(okJsonResponse(forecastApiResponse(computeForecastWindow())));
    });
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    expect(res.body.roadMeta.pointsFeedUnavailableOrStale).toBe(true);
    expect(res.body.roadSections.every((s) => s.positiveStyleEligible === false)).toBe(true);
  });

  it("24-hour window: exact UTC hours, matching computeForecastWindow", async () => {
    const stub = fullStubFetch({});
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), res);

    const window = computeForecastWindow();
    expect(res.body.forecast.window.startHour).toBe(window.startHour);
    expect(res.body.forecast.window.endHour).toBe(window.endHour);
    expect(res.body.forecast.window.expectedHours).toEqual(window.expectedHours);
  });

  // Note: every upstream fetch helper used here (fetchRoadSegments/
  // fetchRoadPoints/fetchWinterRouteForecast, via fetchJsonBounded) is
  // already exception-safe by design (returns a structured {ok:false},
  // never throws) -- the same reason api/winter-route.test.js has no
  // equivalent test for its own 502 catch-all path. Not forcing an
  // artificial throw here to manufacture one; the catch-all itself is
  // visible by code review (identical pattern to winter-route.js's own).
});

// Ticket #503 westfjords-batch — six new pairs through the SAME handler
// (P5a: allowlist extended, not a new handler). B<->H's own 17 tests
// above stay unchanged/unaffected.
describe("GET /api/winter-route-data — westfjords-batch pairs", () => {
  const BF_FORWARD = resolveWestfjordsBatchGeometry("budardalur", "flokalundur").geometryId;
  const BF_REVERSE = resolveWestfjordsBatchGeometry("flokalundur", "budardalur").geometryId;
  const BP_FORWARD = resolveWestfjordsBatchGeometry("budardalur", "patreksfjordur").geometryId;
  const FT_FORWARD = resolveWestfjordsBatchGeometry("flokalundur", "talknafjordur").geometryId;
  const PT_FORWARD = resolveWestfjordsBatchGeometry("patreksfjordur", "talknafjordur").geometryId;

  function batchForecastApiResponse(pointCount, window) {
    return Array.from({ length: pointCount }, (_, i) => ({
      latitude: window.coordinates?.[i]?.lat ?? 65, longitude: window.coordinates?.[i]?.lon ?? -22, elevation: 10 + i, utc_offset_seconds: 0,
      hourly_units: { temperature_2m: "°C", wind_speed_10m: "m/s", wind_gusts_10m: "m/s", precipitation: "mm", weather_code: "wmo code" },
      hourly: {
        time: window.expectedHours,
        temperature_2m: window.expectedHours.map(() => i),
        wind_speed_10m: window.expectedHours.map(() => 1),
        wind_gusts_10m: window.expectedHours.map(() => 1),
        precipitation: window.expectedHours.map(() => 0),
        weather_code: window.expectedHours.map(() => 0),
      },
    }));
  }
  function batchStubFetch({ segmentIds, forecastPointCount } = {}) {
    const calls = { segments: 0, points: 0, forecast: 0 };
    return {
      calls,
      fn: vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("faerdpunktar")) { calls.points += 1; return Promise.resolve(okJsonResponse([])); }
        if (u.includes("faerd2017_1")) { calls.segments += 1; return Promise.resolve(okJsonResponse((segmentIds ?? []).map((id) => validSegmentRow(id)))); }
        calls.forecast += 1;
        return Promise.resolve(okJsonResponse(batchForecastApiResponse(forecastPointCount ?? 5, { ...computeForecastWindow(), coordinates: new URL(u).searchParams.get("latitude").split(",").map((lat, i) => ({ lat: Number(lat), lon: Number(new URL(u).searchParams.get("longitude").split(",")[i]) })) })));
      }),
    };
  }

  it("maps distinct validated forecasts to the correct point in all twelve directions", async () => {
    const pairs = [["budardalur", "flokalundur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"], ["flokalundur", "patreksfjordur"], ["flokalundur", "talknafjordur"], ["patreksfjordur", "talknafjordur"]];
    for (const [a, b] of pairs) {
      __resetWinterRouteCacheForTests();
      const geo = resolveWestfjordsBatchGeometry(a, b);
      const stub = batchStubFetch({ segmentIds: geo.idButurList, forecastPointCount: geo.pointIds.length });
      global.fetch = stub.fn;
      let forward;
      for (const [from, to] of [[a, b], [b, a]]) {
        const resolved = resolveWestfjordsBatchGeometry(from, to);
        const res = makeRes();
        await handler(makeReq("GET", { from, to, geometryId: resolved.geometryId }), res);
        expect(res.statusCode).toBe(200);
        const points = res.body.forecast.points;
        for (const point of points) expect(point.available).toBe(true);
        if (!forward) forward = points;
        else expect(points.map((p) => [p.id, p.series.temperature_2m, p.returnedLatitude, p.returnedLongitude])).toEqual([...forward].reverse().map((p) => [p.id, p.series.temperature_2m, p.returnedLatitude, p.returnedLongitude]));
        const [canonicalFrom, canonicalTo] = [a, b].sort();
        const canonicalIds = resolveWestfjordsBatchGeometry(canonicalFrom, canonicalTo).pointIds;
        points.forEach((point) => expect(point.series.temperature_2m[0]).toBe(canonicalIds.indexOf(point.id)));
      }
      expect(stub.calls).toEqual({ segments: 1, points: 1, forecast: 1 });
    }
  });

  it("budardalur<->flokalundur: 12 road sections, 5 forecast points in real travel order, unmappedLengthM ~0.005 (-4 only)", async () => {
    const stub = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("budardalur", "flokalundur").idButurList, forecastPointCount: 5 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur", geometryId: BF_FORWARD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(12);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["budardalur-route", "svinadalur-route", "gilsfjordur-route", "klettshals-route", "flokalundur-route"]);
    expect(res.body.unmappedLengthM).toBeCloseTo(0.005, 3);
  });

  it("reverse direction (flokalundur->budardalur) returns the reverse point order and a different geometryId", async () => {
    const stub = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("flokalundur", "budardalur").idButurList, forecastPointCount: 5 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "budardalur", geometryId: BF_REVERSE }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.geometryId).toBe(BF_REVERSE);
    expect(res.body.geometryId).not.toBe(BF_FORWARD);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["flokalundur-route", "klettshals-route", "gilsfjordur-route", "svinadalur-route", "budardalur-route"]);
  });

  it("budardalur<->patreksfjordur: both -4 and -5 (unmappedLengthM ~4.398), 17 road sections, 7 points", async () => {
    const stub = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("budardalur", "patreksfjordur").idButurList, forecastPointCount: 7 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "patreksfjordur", geometryId: BP_FORWARD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(17);
    expect(res.body.unmappedLengthM).toBeCloseTo(4.398, 2);
    expect(res.body.forecast.points.map((p) => p.id)).not.toContain("talknafjordur-route");
  });

  it("flokalundur<->talknafjordur: unmappedLengthM is 0 (neither -4 nor -5), 7 road sections, 4 points", async () => {
    const stub = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("flokalundur", "talknafjordur").idButurList, forecastPointCount: 4 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "talknafjordur", geometryId: FT_FORWARD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(7);
    expect(res.body.unmappedLengthM).toBe(0);
  });

  it("patreksfjordur<->talknafjordur: the shortest new pair, 3 road sections, 3 points, edge-segment-free", async () => {
    const stub = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("patreksfjordur", "talknafjordur").idButurList, forecastPointCount: 3 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "patreksfjordur", to: "talknafjordur", geometryId: PT_FORWARD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(3);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["patreksfjordur-route", "miklidalur-route", "talknafjordur-route"]);
  });

  it("400 unsupported for a pair outside the allowlist (e.g. svinadalur-only ids aren't place ids, or ring-pilot ids)", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "selfoss", geometryId: "x" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("unsupported");
  });

  it("geometry_mismatch when the client geometryId doesn't match the real recomputed one, for a new pair", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur", geometryId: "not-real" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("geometry_mismatch");
  });

  it("P5(c)/P5b(i): concurrent forward+reverse of the SAME pair on a cold cache share exactly 3 upstream calls", async () => {
    const stub = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("budardalur", "flokalundur").idButurList, forecastPointCount: 5 });
    global.fetch = stub.fn;
    await Promise.all([
      handler(makeReq("GET", { from: "budardalur", to: "flokalundur", geometryId: BF_FORWARD }), makeRes()),
      handler(makeReq("GET", { from: "flokalundur", to: "budardalur", geometryId: BF_REVERSE }), makeRes()),
    ]);
    expect(stub.calls.segments).toBe(1);
    expect(stub.calls.points).toBe(1);
    expect(stub.calls.forecast).toBe(1);
  });

  it("cache isolation: budardalur<->flokalundur and budardalur<->patreksfjordur never share a bucket — each pair gets its own fresh fetch", async () => {
    const stub = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      if (u.includes("faerd2017_1")) return Promise.resolve(okJsonResponse([]));
      return Promise.resolve(okJsonResponse(batchForecastApiResponse(7, computeForecastWindow())));
    });
    global.fetch = stub;
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur", geometryId: BF_FORWARD }), makeRes());
    const callsAfterFirst = stub.mock.calls.length;
    await handler(makeReq("GET", { from: "budardalur", to: "patreksfjordur", geometryId: BP_FORWARD }), makeRes());
    expect(stub.mock.calls.length).toBeGreaterThan(callsAfterFirst); // a genuinely new fetch happened, not reused from the other pair's bucket
  });

  it("B<->H keeps using its own fixed cache key, isolated from the new pairs' own buckets", async () => {
    const stub = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      if (u.includes("faerd2017_1")) return Promise.resolve(okJsonResponse(EXPECTED_IDBUTUR.map((id) => validSegmentRow(id))));
      return Promise.resolve(okJsonResponse(forecastApiResponse(computeForecastWindow())));
    });
    global.fetch = stub;
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), makeRes());
    const callsAfterBH = stub.mock.calls.length;

    const stub2 = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("budardalur", "flokalundur").idButurList, forecastPointCount: 5 });
    global.fetch = stub2.fn;
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur", geometryId: BF_FORWARD }), makeRes());
    expect(stub2.calls.segments).toBe(1); // a genuinely fresh fetch, not reused from B<->H's own bucket
    void callsAfterBH;
  });

  it("each road section carries a real nameIs/nameEn, and the edge segment(s) are flagged for budardalur<->patreksfjordur (805030037, 562070037)", async () => {
    const stub = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("budardalur", "patreksfjordur").idButurList, forecastPointCount: 7 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "patreksfjordur", geometryId: BP_FORWARD }), res);

    const byId = new Map(res.body.roadSections.map((s) => [s.idButur, s]));
    expect(byId.get(805030037).isEdgeSegment).toBe(true);
    expect(byId.get(562070037).isEdgeSegment).toBe(true);
    expect(res.body.roadSections.every((s) => typeof s.nameIs === "string" && s.nameIs.length > 0)).toBe(true);
  });

  it("P4(c): each forecast point carries its own real approxDistanceFromStartKm, letting the UI compute the largest gap generically; absent for B<->H (unchanged behavior)", async () => {
    const stub = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("budardalur", "flokalundur").idButurList, forecastPointCount: 5 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur", geometryId: BF_FORWARD }), res);
    const byId = new Map(res.body.forecast.points.map((p) => [p.id, p]));
    expect(byId.get("budardalur-route").approxDistanceFromStartKm).toBeCloseTo(0, 1);
    expect(byId.get("flokalundur-route").approxDistanceFromStartKm).toBeCloseTo(172.5, 0);

    const stubBH = fullStubFetch({});
    global.fetch = stubBH.fn;
    const resBH = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), resBH);
    expect(resBH.body.forecast.points.every((p) => p.approxDistanceFromStartKm === undefined)).toBe(true);
  });

  it("key_missing: zero forecast calls, road data unaffected, for a new pair too", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    const stub = batchStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("flokalundur", "talknafjordur").idButurList, forecastPointCount: 4 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "talknafjordur", geometryId: FT_FORWARD }), res);

    expect(res.body.forecast.available).toBe(false);
    expect(res.body.forecast.reason).toBe("key_missing");
    expect(stub.calls.forecast).toBe(0);
    process.env.OPEN_METEO_API_KEY = "test-key";
  });
});

describe("GET /api/winter-route-data — westfjords-completion pairs (isafjordur + the last 8 pairs)", () => {
  const BI_FORWARD = resolveWestfjordsCompletionGeometry("budardalur", "isafjordur").geometryId;
  const BI_REVERSE = resolveWestfjordsCompletionGeometry("isafjordur", "budardalur").geometryId;
  const IH_FORWARD = resolveWestfjordsCompletionGeometry("isafjordur", "holmavik").geometryId;
  const FH_FORWARD = resolveWestfjordsCompletionGeometry("flokalundur", "holmavik").geometryId;
  const HT_FORWARD = resolveWestfjordsCompletionGeometry("holmavik", "talknafjordur").geometryId;

  function completionForecastApiResponse(pointCount, window) {
    return Array.from({ length: pointCount }, (_, i) => ({
      latitude: window.coordinates?.[i]?.lat ?? 65, longitude: window.coordinates?.[i]?.lon ?? -22, elevation: 10 + i, utc_offset_seconds: 0,
      hourly_units: { temperature_2m: "°C", wind_speed_10m: "m/s", wind_gusts_10m: "m/s", precipitation: "mm", weather_code: "wmo code" },
      hourly: {
        time: window.expectedHours,
        temperature_2m: window.expectedHours.map(() => i),
        wind_speed_10m: window.expectedHours.map(() => 1),
        wind_gusts_10m: window.expectedHours.map(() => 1),
        precipitation: window.expectedHours.map(() => 0),
        weather_code: window.expectedHours.map(() => 0),
      },
    }));
  }
  function completionStubFetch({ segmentIds, forecastPointCount } = {}) {
    const calls = { segments: 0, points: 0, forecast: 0 };
    return {
      calls,
      fn: vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("faerdpunktar")) { calls.points += 1; return Promise.resolve(okJsonResponse([])); }
        if (u.includes("faerd2017_1")) { calls.segments += 1; return Promise.resolve(okJsonResponse((segmentIds ?? []).map((id) => validSegmentRow(id)))); }
        calls.forecast += 1;
        return Promise.resolve(okJsonResponse(completionForecastApiResponse(forecastPointCount ?? 5, { ...computeForecastWindow(), coordinates: new URL(u).searchParams.get("latitude").split(",").map((lat, i) => ({ lat: Number(lat), lon: Number(new URL(u).searchParams.get("longitude").split(",")[i]) })) })));
      }),
    };
  }

  it("maps distinct validated forecasts to the correct point in all sixteen directions", async () => {
    const pairs = [
      ["budardalur", "isafjordur"], ["flokalundur", "isafjordur"], ["isafjordur", "holmavik"],
      ["isafjordur", "patreksfjordur"], ["isafjordur", "talknafjordur"], ["flokalundur", "holmavik"],
      ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"],
    ];
    for (const [a, b] of pairs) {
      __resetWinterRouteCacheForTests();
      const geo = resolveWestfjordsCompletionGeometry(a, b);
      const stub = completionStubFetch({ segmentIds: geo.idButurList, forecastPointCount: geo.pointIds.length });
      global.fetch = stub.fn;
      let forward;
      for (const [from, to] of [[a, b], [b, a]]) {
        const resolved = resolveWestfjordsCompletionGeometry(from, to);
        const res = makeRes();
        await handler(makeReq("GET", { from, to, geometryId: resolved.geometryId }), res);
        expect(res.statusCode).toBe(200);
        const points = res.body.forecast.points;
        for (const point of points) expect(point.available).toBe(true);
        if (!forward) forward = points;
        else expect(points.map((p) => [p.id, p.series.temperature_2m, p.returnedLatitude, p.returnedLongitude])).toEqual([...forward].reverse().map((p) => [p.id, p.series.temperature_2m, p.returnedLatitude, p.returnedLongitude]));
        const [canonicalFrom, canonicalTo] = [a, b].sort();
        const canonicalIds = resolveWestfjordsCompletionGeometry(canonicalFrom, canonicalTo).pointIds;
        points.forEach((point) => expect(point.series.temperature_2m[0]).toBe(canonicalIds.indexOf(point.id)));
      }
      expect(stub.calls).toEqual({ segments: 1, points: 1, forecast: 1 });
    }
  });

  it("budardalur<->isafjordur: the longest new pair, 24 road sections, 8 forecast points in real travel order, unmappedLengthM ~0.005 (-4 only)", async () => {
    const stub = completionStubFetch({ segmentIds: resolveWestfjordsCompletionGeometry("budardalur", "isafjordur").idButurList, forecastPointCount: 8 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "isafjordur", geometryId: BI_FORWARD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(24);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["budardalur-route", "svinadalur-route", "gilsfjordur-route", "klettshals-route", "flokalundur-route", "dynjandisheidi-route", "gemlufallsheidi-route", "isafjordur-route"]);
    expect(res.body.unmappedLengthM).toBeCloseTo(0.005, 3);
  });

  it("reverse direction (isafjordur->budardalur) returns the reverse point order and a different geometryId", async () => {
    const stub = completionStubFetch({ segmentIds: resolveWestfjordsCompletionGeometry("isafjordur", "budardalur").idButurList, forecastPointCount: 8 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "budardalur", geometryId: BI_REVERSE }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.geometryId).toBe(BI_REVERSE);
    expect(res.body.geometryId).not.toBe(BI_FORWARD);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["isafjordur-route", "gemlufallsheidi-route", "dynjandisheidi-route", "flokalundur-route", "klettshals-route", "gilsfjordur-route", "svinadalur-route", "budardalur-route"]);
  });

  it("isafjordur<->holmavik: no Þröskuldar points (no real 907000037 section), 9 road sections, 5 points, no null-ID connector", async () => {
    const stub = completionStubFetch({ segmentIds: resolveWestfjordsCompletionGeometry("isafjordur", "holmavik").idButurList, forecastPointCount: 5 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "holmavik", geometryId: IH_FORWARD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(9);
    expect(res.body.unmappedLengthM).toBe(0);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["isafjordur-route", "sudavikurhlid-route", "vatnsfjardarhals-route", "steingrimsfjardarheidi-route", "holmavik-route"]);
    expect(res.body.forecast.points.map((p) => p.id)).not.toContain("throskuldar-south-route");
  });

  it("flokalundur<->holmavik: Þröskuldar points DO appear (real 907000037 section present), 11 road sections, 5 points", async () => {
    const stub = completionStubFetch({ segmentIds: resolveWestfjordsCompletionGeometry("flokalundur", "holmavik").idButurList, forecastPointCount: 5 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "holmavik", geometryId: FH_FORWARD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(11);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["flokalundur-route", "klettshals-route", "throskuldar-south-route", "throskuldar-pass-route", "holmavik-route"]);
  });

  it("holmavik<->talknafjordur: the longest H-anchored pair, 17 road sections, 8 points", async () => {
    const stub = completionStubFetch({ segmentIds: resolveWestfjordsCompletionGeometry("holmavik", "talknafjordur").idButurList, forecastPointCount: 8 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "holmavik", to: "talknafjordur", geometryId: HT_FORWARD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(17);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["holmavik-route", "throskuldar-pass-route", "throskuldar-south-route", "klettshals-route", "flokalundur-route", "kleifaheidi-route", "miklidalur-route", "talknafjordur-route"]);
  });

  it("400 unsupported for isafjordur<->isafjordur (same place) and for a pair outside every allowlist", async () => {
    const res1 = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "isafjordur", geometryId: "x" }), res1);
    expect(res1.statusCode).toBe(400);
    expect(res1.body.error).toBe("unsupported");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "egilsstadir", geometryId: "x" }), res2);
    expect(res2.statusCode).toBe(400);
    expect(res2.body.error).toBe("unsupported");
  });

  it("geometry_mismatch when the client geometryId doesn't match the real recomputed one, for a new pair", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "isafjordur", geometryId: "not-real" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("geometry_mismatch");
  });

  it("P5(c)/P5b(i): concurrent forward+reverse of the SAME pair on a cold cache share exactly 3 upstream calls", async () => {
    const stub = completionStubFetch({ segmentIds: resolveWestfjordsCompletionGeometry("isafjordur", "holmavik").idButurList, forecastPointCount: 5 });
    global.fetch = stub.fn;
    await Promise.all([
      handler(makeReq("GET", { from: "isafjordur", to: "holmavik", geometryId: IH_FORWARD }), makeRes()),
      handler(makeReq("GET", { from: "holmavik", to: "isafjordur", geometryId: resolveWestfjordsCompletionGeometry("holmavik", "isafjordur").geometryId }), makeRes()),
    ]);
    expect(stub.calls.segments).toBe(1);
    expect(stub.calls.points).toBe(1);
    expect(stub.calls.forecast).toBe(1);
  });

  it("cache isolation: budardalur<->isafjordur never shares a bucket with isafjordur<->holmavik, a westfjords-batch pair, or B<->H", async () => {
    const emptyStub = () => vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      if (u.includes("faerd2017_1")) return Promise.resolve(okJsonResponse([]));
      return Promise.resolve(okJsonResponse(completionForecastApiResponse(8, computeForecastWindow())));
    });

    global.fetch = emptyStub();
    await handler(makeReq("GET", { from: "budardalur", to: "isafjordur", geometryId: BI_FORWARD }), makeRes());
    const callsAfterBI = global.fetch.mock.calls.length;

    global.fetch = emptyStub();
    await handler(makeReq("GET", { from: "isafjordur", to: "holmavik", geometryId: IH_FORWARD }), makeRes());
    expect(global.fetch.mock.calls.length).toBeGreaterThan(0); // a genuinely new fetch happened, not reused
    void callsAfterBI;

    // Isolated from an (unaffected) westfjords-batch pair's own bucket.
    const stubBatch = completionStubFetch({ segmentIds: resolveWestfjordsBatchGeometry("budardalur", "flokalundur").idButurList, forecastPointCount: 5 });
    global.fetch = stubBatch.fn;
    await handler(makeReq("GET", { from: "budardalur", to: "flokalundur", geometryId: resolveWestfjordsBatchGeometry("budardalur", "flokalundur").geometryId }), makeRes());
    expect(stubBatch.calls.segments).toBe(1); // fresh fetch, not reused from any westfjords-completion bucket

    // Isolated from B<->H's own fixed key.
    const stubBH = fullStubFetch({});
    global.fetch = stubBH.fn;
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), makeRes());
    expect(stubBH.calls.segments).toBe(1); // fresh fetch, not reused from any other bucket
  });

  it("edge segments are flagged dynamically: 906700037 Tungudalsleggur (0.80%) on budardalur<->isafjordur, 562070037 (0.93%) on isafjordur<->patreksfjordur", async () => {
    const stubBI = completionStubFetch({ segmentIds: resolveWestfjordsCompletionGeometry("budardalur", "isafjordur").idButurList, forecastPointCount: 8 });
    global.fetch = stubBI.fn;
    const resBI = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "isafjordur", geometryId: BI_FORWARD }), resBI);
    const byIdBI = new Map(resBI.body.roadSections.map((s) => [s.idButur, s]));
    expect(byIdBI.get(906700037).isEdgeSegment).toBe(true);
    expect(byIdBI.get(805030037).isEdgeSegment).toBe(true);

    const ipGeo = resolveWestfjordsCompletionGeometry("isafjordur", "patreksfjordur");
    const stubIP = completionStubFetch({ segmentIds: ipGeo.idButurList, forecastPointCount: 5 });
    global.fetch = stubIP.fn;
    const resIP = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "patreksfjordur", geometryId: ipGeo.geometryId }), resIP);
    const byIdIP = new Map(resIP.body.roadSections.map((s) => [s.idButur, s]));
    expect(byIdIP.get(562070037).isEdgeSegment).toBe(true);
    expect(resIP.body.roadSections.every((s) => typeof s.nameIs === "string" && s.nameIs.length > 0)).toBe(true);
  });

  it("P4(c)/P5(a): each forecast point carries its own real approxDistanceFromStartKm; isafjordur<->holmavik's largest gap is ~106.3 km (sudavikurhlid->vatnsfjardarhals)", async () => {
    const stub = completionStubFetch({ segmentIds: resolveWestfjordsCompletionGeometry("isafjordur", "holmavik").idButurList, forecastPointCount: 5 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "isafjordur", to: "holmavik", geometryId: IH_FORWARD }), res);
    const byId = new Map(res.body.forecast.points.map((p) => [p.id, p]));
    expect(byId.get("isafjordur-route").approxDistanceFromStartKm).toBeCloseTo(0, 1);
    expect(byId.get("sudavikurhlid-route").approxDistanceFromStartKm).toBeCloseTo(21.3, 1);
    expect(byId.get("vatnsfjardarhals-route").approxDistanceFromStartKm).toBeCloseTo(127.6, 1);
    const gap = byId.get("vatnsfjardarhals-route").approxDistanceFromStartKm - byId.get("sudavikurhlid-route").approxDistanceFromStartKm;
    expect(gap).toBeCloseTo(106.3, 0);
  });

  it("key_missing: zero forecast calls, road data unaffected, for a westfjords-completion pair too", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    const stub = completionStubFetch({ segmentIds: resolveWestfjordsCompletionGeometry("flokalundur", "holmavik").idButurList, forecastPointCount: 5 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "flokalundur", to: "holmavik", geometryId: FH_FORWARD }), res);

    expect(res.body.forecast.available).toBe(false);
    expect(res.body.forecast.reason).toBe("key_missing");
    expect(stub.calls.forecast).toBe(0);
    process.env.OPEN_METEO_API_KEY = "test-key";
  });
});

describe("GET /api/winter-route-data — ring-options pairs (reykjavik-raudavatn<->selfoss/hella, option=south|north)", () => {
  const RS_SOUTH_FWD = resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "south").geometryId;
  const RS_SOUTH_REV = resolveRingOptionGeometry("selfoss", "reykjavik-raudavatn", "south").geometryId;
  const RS_NORTH_FWD = resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "north").geometryId;
  const RS_NORTH_REV = resolveRingOptionGeometry("selfoss", "reykjavik-raudavatn", "north").geometryId;
  const RH_NORTH_FWD = resolveRingOptionGeometry("reykjavik-raudavatn", "hella", "north").geometryId;

  function ringForecastApiResponse(pointCount, window) {
    return Array.from({ length: pointCount }, (_, i) => ({
      latitude: window.coordinates?.[i]?.lat ?? 65, longitude: window.coordinates?.[i]?.lon ?? -20, elevation: 10 + i, utc_offset_seconds: 0,
      hourly_units: { temperature_2m: "°C", wind_speed_10m: "m/s", wind_gusts_10m: "m/s", precipitation: "mm", weather_code: "wmo code" },
      hourly: {
        time: window.expectedHours,
        temperature_2m: window.expectedHours.map(() => i),
        wind_speed_10m: window.expectedHours.map(() => 1),
        wind_gusts_10m: window.expectedHours.map(() => 1),
        precipitation: window.expectedHours.map(() => 0),
        weather_code: window.expectedHours.map(() => 0),
      },
    }));
  }
  function ringStubFetch({ segmentIds, forecastPointCount } = {}) {
    const calls = { segments: 0, points: 0, forecast: 0 };
    return {
      calls,
      fn: vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("faerdpunktar")) { calls.points += 1; return Promise.resolve(okJsonResponse([])); }
        if (u.includes("faerd2017_1")) { calls.segments += 1; return Promise.resolve(okJsonResponse((segmentIds ?? []).map((id) => validSegmentRow(id)))); }
        calls.forecast += 1;
        return Promise.resolve(okJsonResponse(ringForecastApiResponse(forecastPointCount ?? 3, { ...computeForecastWindow(), coordinates: new URL(u).searchParams.get("latitude").split(",").map((lat, i) => ({ lat: Number(lat), lon: Number(new URL(u).searchParams.get("longitude").split(",")[i]) })) })));
      }),
    };
  }

  it("missing option: 400 invalid_option, zero network calls", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", geometryId: "x" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("invalid_option");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("invalid option string: 400 invalid_option, zero network calls", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "bogus", geometryId: "x" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("invalid_option");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("a non-ring pair ignores `option` entirely -- same golden 200 response as without it", async () => {
    const stub = fullStubFetch({});
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", option: "south", geometryId: FORWARD_GEOMETRY_ID }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.selectedOption).toBeUndefined();
    expect(res.body.regionVersion).toBeDefined();
  });

  it("south: 5 real IdButur road sections, 3 points in real travel order, response carries selectedOption/datasetVersion/policyVersion, never regionVersion", async () => {
    const geo = resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "south");
    const stub = ringStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 3 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "south", geometryId: RS_SOUTH_FWD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.selectedOption).toBe("south");
    expect(res.body.datasetVersion).toBeDefined();
    expect(res.body.policyVersion).toBeDefined();
    expect(res.body.regionVersion).toBeUndefined();
    expect(res.body.roadSections).toHaveLength(5);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["raudavatn-route", "hellisheidi-east-route", "selfoss-route"]);
  });

  it("north: R->Selfoss 66 road sections, 18 forecast points in real travel order", async () => {
    const geo = resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "north");
    const stub = ringStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 18 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "north", geometryId: RS_NORTH_FWD }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(66);
    expect(res.body.forecast.points).toHaveLength(18);
    expect(res.body.forecast.points[0].id).toBe("raudavatn-route");
    expect(res.body.forecast.points.at(-1).id).toBe("selfoss-route");
  });

  it("maps distinct validated forecasts to the correct point for all 8 variants (auðkennd spá, P6b)", async () => {
    const variants = [
      ["reykjavik-raudavatn", "selfoss", "south"], ["selfoss", "reykjavik-raudavatn", "south"],
      ["reykjavik-raudavatn", "selfoss", "north"], ["selfoss", "reykjavik-raudavatn", "north"],
      ["reykjavik-raudavatn", "hella", "south"], ["hella", "reykjavik-raudavatn", "south"],
      ["reykjavik-raudavatn", "hella", "north"], ["hella", "reykjavik-raudavatn", "north"],
    ];
    for (const [from, to, option] of variants) {
      __resetWinterRouteCacheForTests();
      const geo = resolveRingOptionGeometry(from, to, option);
      const stub = ringStubFetch({ segmentIds: geo.idButurList, forecastPointCount: geo.pointIds.length });
      global.fetch = stub.fn;
      const res = makeRes();
      await handler(makeReq("GET", { from, to, option, geometryId: geo.geometryId }), res);
      expect(res.statusCode).toBe(200);
      const points = res.body.forecast.points;
      expect(points).toHaveLength(geo.pointIds.length);
      points.forEach((point, i) => {
        expect(point.available).toBe(true);
        expect(point.id).toBe(geo.pointIds[i]);
        expect(point.series.temperature_2m[0]).toBe(i); // identified by own requested-coordinate index
      });
      expect(stub.calls).toEqual({ segments: 1, points: 1, forecast: 1 });
    }
  });

  it("geometry_mismatch when the client geometryId doesn't match the real recomputed one for the requested option", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "south", geometryId: "not-real" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("geometry_mismatch");
  });

  it("the SAME geometryId requested with the WRONG option is still geometry_mismatch (never silently serving the other option)", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "north", geometryId: RS_SOUTH_FWD }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("geometry_mismatch");
  });

  it("P6(a)/P5(c): concurrent forward+reverse of the SAME option share NO bucket -- each makes its own 3 upstream calls (no Westfjords-style reverse single-flight)", async () => {
    const stub = ringStubFetch({ segmentIds: resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "south").idButurList, forecastPointCount: 3 });
    global.fetch = stub.fn;
    await Promise.all([
      handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "south", geometryId: RS_SOUTH_FWD }), makeRes()),
      handler(makeReq("GET", { from: "selfoss", to: "reykjavik-raudavatn", option: "south", geometryId: RS_SOUTH_REV }), makeRes()),
    ]);
    expect(stub.calls.segments).toBe(2);
    expect(stub.calls.points).toBe(2);
    expect(stub.calls.forecast).toBe(2);
  });

  it("cache isolation: south and north of the SAME direction never share a bucket", async () => {
    const stubSouth = ringStubFetch({ segmentIds: resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "south").idButurList, forecastPointCount: 3 });
    global.fetch = stubSouth.fn;
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "south", geometryId: RS_SOUTH_FWD }), makeRes());

    const stubNorth = ringStubFetch({ segmentIds: resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "north").idButurList, forecastPointCount: 18 });
    global.fetch = stubNorth.fn;
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "north", geometryId: RS_NORTH_FWD }), makeRes());
    expect(stubNorth.calls.segments).toBe(1); // a genuinely fresh fetch, not reused from the south bucket
  });

  it("cache isolation: ring buckets never share with a Westfjords pair's own bucket", async () => {
    const stubBH = fullStubFetch({});
    global.fetch = stubBH.fn;
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), makeRes());

    const stubRing = ringStubFetch({ segmentIds: resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "south").idButurList, forecastPointCount: 3 });
    global.fetch = stubRing.fn;
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "south", geometryId: RS_SOUTH_FWD }), makeRes());
    expect(stubRing.calls.segments).toBe(1); // fresh fetch, not reused from B<->H's own bucket
  });

  it("warm cache: a second identical request makes zero new upstream calls", async () => {
    const stub = ringStubFetch({ segmentIds: resolveRingOptionGeometry("reykjavik-raudavatn", "hella", "north").idButurList, forecastPointCount: 17 });
    global.fetch = stub.fn;
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: "north", geometryId: RH_NORTH_FWD }), makeRes());
    const callsAfterFirst = stub.fn.mock.calls.length;
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: "north", geometryId: RH_NORTH_FWD }), makeRes());
    expect(stub.fn.mock.calls.length).toBe(callsAfterFirst); // nothing new within TTL
  });

  it("P4(a): 914020037 appears as exactly one road section (not two) in the response for a reverse-north variant", async () => {
    const geo = resolveRingOptionGeometry("selfoss", "reykjavik-raudavatn", "north");
    const stub = ringStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 15 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "reykjavik-raudavatn", option: "north", geometryId: RS_NORTH_REV }), res);
    const matches = res.body.roadSections.filter((s) => s.idButur === 914020037);
    expect(matches).toHaveLength(1);
  });

  it("P4(c): edge segments are flagged with an absolute threshold -- 1410010037 and 901130037 on a Hella-north variant", async () => {
    const geo = resolveRingOptionGeometry("reykjavik-raudavatn", "hella", "north");
    const stub = ringStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 17 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: "north", geometryId: RH_NORTH_FWD }), res);
    const byId = new Map(res.body.roadSections.map((s) => [s.idButur, s]));
    expect(byId.get(1410010037).isEdgeSegment).toBe(true);
    expect(byId.get(901130037).isEdgeSegment).toBe(true);
  });

  it("key_missing: zero forecast calls, road data unaffected, for a ring pair too", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    const geo = resolveRingOptionGeometry("reykjavik-raudavatn", "hella", "south");
    const stub = ringStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 3 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "hella", option: "south", geometryId: geo.geometryId }), res);

    expect(res.body.forecast.available).toBe(false);
    expect(res.body.forecast.reason).toBe("key_missing");
    expect(stub.calls.forecast).toBe(0);
    process.env.OPEN_METEO_API_KEY = "test-key";
  });
});

describe("GET /api/winter-route-data — ring-completion pairs (no option, datasetVersion-only identity)", () => {
  const RE_FWD = resolveRingCompletionGeometry("reykjavik-raudavatn", "egilsstadir").geometryId;
  const RE_REV = resolveRingCompletionGeometry("egilsstadir", "reykjavik-raudavatn").geometryId;
  const ES_FWD = resolveRingCompletionGeometry("egilsstadir", "seydisfjordur").geometryId;
  const SH_FWD = resolveRingCompletionGeometry("selfoss", "hella").geometryId;

  function completionForecastApiResponse(pointCount, window) {
    return Array.from({ length: pointCount }, (_, i) => ({
      latitude: window.coordinates?.[i]?.lat ?? 65, longitude: window.coordinates?.[i]?.lon ?? -15, elevation: 10 + i, utc_offset_seconds: 0,
      hourly_units: { temperature_2m: "°C", wind_speed_10m: "m/s", wind_gusts_10m: "m/s", precipitation: "mm", weather_code: "wmo code" },
      hourly: {
        time: window.expectedHours,
        temperature_2m: window.expectedHours.map(() => i),
        wind_speed_10m: window.expectedHours.map(() => 1),
        wind_gusts_10m: window.expectedHours.map(() => 1),
        precipitation: window.expectedHours.map(() => 0),
        weather_code: window.expectedHours.map(() => 0),
      },
    }));
  }
  function completionStubFetch({ segmentIds, forecastPointCount } = {}) {
    const calls = { segments: 0, points: 0, forecast: 0 };
    return {
      calls,
      fn: vi.fn().mockImplementation((url) => {
        const u = String(url);
        if (u.includes("faerdpunktar")) { calls.points += 1; return Promise.resolve(okJsonResponse([])); }
        if (u.includes("faerd2017_1")) { calls.segments += 1; return Promise.resolve(okJsonResponse((segmentIds ?? []).map((id) => validSegmentRow(id)))); }
        calls.forecast += 1;
        return Promise.resolve(okJsonResponse(completionForecastApiResponse(forecastPointCount ?? 3, { ...computeForecastWindow(), coordinates: new URL(u).searchParams.get("latitude").split(",").map((lat, i) => ({ lat: Number(lat), lon: Number(new URL(u).searchParams.get("longitude").split(",")[i]) })) })));
      }),
    };
  }

  it("egilsstadir<->seydisfjordur (3 points via Fjarðarheiði): identity is datasetVersion only, never selectedOption/policyVersion/regionVersion", async () => {
    const geo = resolveRingCompletionGeometry("egilsstadir", "seydisfjordur");
    const stub = completionStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 3 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "seydisfjordur", geometryId: ES_FWD }), res);

    expect(res.statusCode).toBe(200);
    expect(typeof res.body.datasetVersion).toBe("string");
    expect(res.body.selectedOption).toBeUndefined();
    expect(res.body.policyVersion).toBeUndefined();
    expect(res.body.regionVersion).toBeUndefined();
    expect(res.body.roadSections).toHaveLength(2);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["egilsstadir-route", "fjardarheidi-route", "seydisfjordur-route"]);
  });

  it("a stray option=north is ignored: same 200 response, same geometryId, as without it", async () => {
    const geo = resolveRingCompletionGeometry("reykjavik-raudavatn", "egilsstadir");
    const stub = completionStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 14 });
    global.fetch = stub.fn;
    const resWith = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "egilsstadir", option: "north", geometryId: RE_FWD }), resWith);
    expect(resWith.statusCode).toBe(200);
    expect(resWith.body.geometryId).toBe(RE_FWD);
    expect(resWith.body.selectedOption).toBeUndefined();
  });

  it("selfoss<->hella (shortest new pair): 2 road sections, 2 points", async () => {
    const geo = resolveRingCompletionGeometry("selfoss", "hella");
    const stub = completionStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 2 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella", geometryId: SH_FWD }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.roadSections).toHaveLength(2);
    expect(res.body.forecast.points.map((p) => p.id)).toEqual(["selfoss-route", "hella-route"]);
  });

  it("maps distinct validated forecasts to the correct point for all 16 directions (auðkennd spá)", async () => {
    const variants = [
      ["reykjavik-raudavatn", "egilsstadir"], ["egilsstadir", "reykjavik-raudavatn"],
      ["reykjavik-raudavatn", "seydisfjordur"], ["seydisfjordur", "reykjavik-raudavatn"],
      ["selfoss", "hella"], ["hella", "selfoss"],
      ["selfoss", "egilsstadir"], ["egilsstadir", "selfoss"],
      ["selfoss", "seydisfjordur"], ["seydisfjordur", "selfoss"],
      ["hella", "egilsstadir"], ["egilsstadir", "hella"],
      ["hella", "seydisfjordur"], ["seydisfjordur", "hella"],
      ["egilsstadir", "seydisfjordur"], ["seydisfjordur", "egilsstadir"],
    ];
    for (const [from, to] of variants) {
      __resetWinterRouteCacheForTests();
      const geo = resolveRingCompletionGeometry(from, to);
      const stub = completionStubFetch({ segmentIds: geo.idButurList, forecastPointCount: geo.pointIds.length });
      global.fetch = stub.fn;
      const res = makeRes();
      await handler(makeReq("GET", { from, to, geometryId: geo.geometryId }), res);
      expect(res.statusCode).toBe(200);
      const points = res.body.forecast.points;
      expect(points).toHaveLength(geo.pointIds.length);
      points.forEach((point, i) => {
        expect(point.available).toBe(true);
        expect(point.id).toBe(geo.pointIds[i]);
        expect(point.series.temperature_2m[0]).toBe(i);
      });
      expect(stub.calls).toEqual({ segments: 1, points: 1, forecast: 1 });
    }
  });

  it("geometry_mismatch when the client geometryId doesn't match the real recomputed one", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "egilsstadir", geometryId: "not-real" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("geometry_mismatch");
  });

  it("400 unsupported for a mixed Ring<->Westfjords pair and for same-place, zero network calls", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;
    const res1 = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "isafjordur", geometryId: "x" }), res1);
    expect(res1.statusCode).toBe(400);
    expect(res1.body.error).toBe("unsupported");

    const res2 = makeRes();
    await handler(makeReq("GET", { from: "egilsstadir", to: "egilsstadir", geometryId: "x" }), res2);
    expect(res2.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("P4: concurrent forward+reverse share NO bucket (direction-specific) -- 6 upstream calls", async () => {
    const stub = completionStubFetch({ segmentIds: resolveRingCompletionGeometry("reykjavik-raudavatn", "egilsstadir").idButurList, forecastPointCount: 14 });
    global.fetch = stub.fn;
    await Promise.all([
      handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "egilsstadir", geometryId: RE_FWD }), makeRes()),
      handler(makeReq("GET", { from: "egilsstadir", to: "reykjavik-raudavatn", geometryId: RE_REV }), makeRes()),
    ]);
    expect(stub.calls.segments).toBe(2);
    expect(stub.calls.points).toBe(2);
    expect(stub.calls.forecast).toBe(2);
  });

  it("cache isolation: a ring-completion bucket never shares with a ring-option pair's own bucket or a Westfjords pair's own bucket", async () => {
    const stubOption = vi.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      if (u.includes("faerd2017_1")) return Promise.resolve(okJsonResponse([]));
      return Promise.resolve(okJsonResponse(completionForecastApiResponse(3, computeForecastWindow())));
    });
    global.fetch = stubOption;
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "selfoss", option: "south", geometryId: resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "south").geometryId }), makeRes());

    const stubCompletion = completionStubFetch({ segmentIds: resolveRingCompletionGeometry("reykjavik-raudavatn", "egilsstadir").idButurList, forecastPointCount: 14 });
    global.fetch = stubCompletion.fn;
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "egilsstadir", geometryId: RE_FWD }), makeRes());
    expect(stubCompletion.calls.segments).toBe(1); // fresh fetch, not reused from the option pair's own bucket

    const stubBH = fullStubFetch({});
    global.fetch = stubBH.fn;
    await handler(makeReq("GET", { from: "budardalur", to: "holmavik", geometryId: FORWARD_GEOMETRY_ID }), makeRes());
    expect(stubBH.calls.segments).toBe(1); // fresh fetch, not reused from any ring bucket
  });

  it("warm cache: a second identical request makes zero new upstream calls", async () => {
    const stub = completionStubFetch({ segmentIds: resolveRingCompletionGeometry("selfoss", "hella").idButurList, forecastPointCount: 2 });
    global.fetch = stub.fn;
    await handler(makeReq("GET", { from: "selfoss", to: "hella", geometryId: SH_FWD }), makeRes());
    const callsAfterFirst = stub.fn.mock.calls.length;
    await handler(makeReq("GET", { from: "selfoss", to: "hella", geometryId: SH_FWD }), makeRes());
    expect(stub.fn.mock.calls.length).toBe(callsAfterFirst); // nothing new within TTL
  });

  it("edge segments are flagged with the absolute threshold: 1410010037 on R<->Egilsstaðir", async () => {
    const geo = resolveRingCompletionGeometry("reykjavik-raudavatn", "egilsstadir");
    const stub = completionStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 14 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "reykjavik-raudavatn", to: "egilsstadir", geometryId: RE_FWD }), res);
    const byId = new Map(res.body.roadSections.map((s) => [s.idButur, s]));
    expect(byId.get(1410010037).isEdgeSegment).toBe(true);
  });

  it("key_missing: zero forecast calls, road data unaffected, for a ring-completion pair too", async () => {
    delete process.env.OPEN_METEO_API_KEY;
    const geo = resolveRingCompletionGeometry("selfoss", "hella");
    const stub = completionStubFetch({ segmentIds: geo.idButurList, forecastPointCount: 2 });
    global.fetch = stub.fn;
    const res = makeRes();
    await handler(makeReq("GET", { from: "selfoss", to: "hella", geometryId: SH_FWD }), res);

    expect(res.body.forecast.available).toBe(false);
    expect(res.body.forecast.reason).toBe("key_missing");
    expect(stub.calls.forecast).toBe(0);
    process.env.OPEN_METEO_API_KEY = "test-key";
  });
});
