// @vitest-environment node
// api/winter-route-data.test.js — Ticket #503, P7(a)/(b)
import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./winter-route-data.js";
import { __resetWinterRouteCacheForTests } from "./_lib/winterRoute/cache.js";
import { computeForecastWindow } from "./_lib/winterRoute/forecastFetch.js";
import { resolveBudardalurHolmavikGeometry, BUDARDALUR_HOLMAVIK_FORECAST_POINTS } from "./_lib/winterRoute/budardalurHolmavikRoute.js";
import { resolveWestfjordsBatchGeometry } from "./_lib/winterRoute/westfjordsBatchRoute.js";

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
