// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./winter-route.js";
import { __resetWinterRouteCacheForTests } from "./_lib/winterRoute/cache.js";
import { WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS } from "./_lib/winterRoute/segments.js";
import { computeForecastWindow } from "./_lib/winterRoute/forecastFetch.js";
import { BORGARNES_IDBUTUR_LIST, BORGARNES_FORECAST_POINTS } from "./_lib/winterRoute/routes.js";

function makeReq(method = "GET", query) {
  const req = { method, url: "/api/winter-route", headers: { host: "localhost:3000" } };
  if (query !== undefined) req.query = query;
  return req;
}

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

function okJsonResponse(body) {
  return { ok: true, text: async () => JSON.stringify(body) };
}

function validSegmentRow(idButur) {
  return {
    IdButur: idButur,
    AstandYfirbord: "GREIDFAERT",
    AstandVidbotaruppl: null,
    AstandLysing: "Greiðfært",
    AstandLysingEn: "Easily passable",
    DagsSkrad: "2026-11-03T17:55:00Z",
    DagsKeyrtUt: "2026-11-03T17:59:00Z",
  };
}

beforeEach(() => {
  __resetWinterRouteCacheForTests();
  vi.restoreAllMocks();
});

describe("GET /api/winter-route", () => {
  it("rejects non-GET methods", async () => {
    const res = makeRes();
    await handler(makeReq("POST"), res);
    expect(res.statusCode).toBe(405);
  });

  it("always sets Cache-Control: no-store", async () => {
    global.fetch = vi.fn().mockResolvedValue(okJsonResponse([]));
    process.env.OPEN_METEO_API_KEY = "";
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("returns all 13 fixed segments in fixed order, and forecast unavailable when the key is missing — road data is not hidden by a missing key", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      if (String(url).includes("faerd2017_1")) {
        return Promise.resolve(okJsonResponse(WINTER_ROUTE_IDBUTUR_LIST.map(validSegmentRow)));
      }
      throw new Error("unexpected fetch (forecast must not be called when key is missing)");
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.segments).toHaveLength(13);
    expect(res.body.segments.map((s) => s.idButur)).toEqual(WINTER_ROUTE_IDBUTUR_LIST);
    expect(res.body.segments.every((s) => s.category === "passable")).toBe(true);
    expect(res.body.forecast.available).toBe(false);
    expect(res.body.forecast.reason).toBe("key_missing");
  });

  it("one road feed failing does not hide the other feed's valid data", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve({ ok: false, status: 500, text: async () => "" });
      if (String(url).includes("faerd2017_1")) {
        return Promise.resolve(okJsonResponse(WINTER_ROUTE_IDBUTUR_LIST.map(validSegmentRow)));
      }
      throw new Error("forecast must not be called when key is missing");
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq(), res);

    expect(res.body.roadMeta.segmentsAvailable).toBe(true);
    expect(res.body.roadMeta.pointsAvailable).toBe(false);
    expect(res.body.segments.every((s) => s.category === "passable")).toBe(true);
  });

  it("Round 2 (R1a): no segment gets positive styling while the points feed is down, even though categories stay 'passable'", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve({ ok: false, status: 500, text: async () => "" });
      if (String(url).includes("faerd2017_1")) {
        return Promise.resolve(okJsonResponse(WINTER_ROUTE_IDBUTUR_LIST.map(validSegmentRow)));
      }
      throw new Error("forecast must not be called when key is missing");
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq(), res);

    expect(res.body.roadMeta.pointsFeedUnavailableOrStale).toBe(true);
    expect(res.body.segments.every((s) => s.category === "passable")).toBe(true);
    expect(res.body.segments.every((s) => s.positiveStyleEligible === false)).toBe(true);
  });

  it("Round 2 (R1a): a points feed that returns successfully but with no usable export time also denies positive styling", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      return Promise.resolve(okJsonResponse(WINTER_ROUTE_IDBUTUR_LIST.map(validSegmentRow)));
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq(), res);

    expect(res.body.roadMeta.pointsFeedUnavailableOrStale).toBe(true);
    expect(res.body.segments.every((s) => s.positiveStyleEligible === false)).toBe(true);
  });

  it("Round 2 (R1c): a segment missing from the segment feed, but with a real active closure notice, reads 'closed' — not stuck at unknown", async () => {
    const missingId = WINTER_ROUTE_IDBUTUR_LIST[5];
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) {
        return Promise.resolve(
          okJsonResponse([
            {
              IdButur: missingId,
              IdPunktur: 1,
              Astand: "ALLUR_AKSTUR_BANN",
              DagsSkrad: "2026-11-03T17:00:00Z",
              GildirTil: "2099-01-01T00:00:00Z",
            },
          ])
        );
      }
      const rows = WINTER_ROUTE_IDBUTUR_LIST.filter((id) => id !== missingId).map(validSegmentRow);
      return Promise.resolve(okJsonResponse(rows));
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq(), res);

    const segment = res.body.segments.find((s) => s.idButur === missingId);
    expect(segment.segmentDataAvailable).toBe(false);
    expect(segment.category).toBe("closed");
    expect(segment.positiveStyleEligible).toBe(false);
  });

  it("Round 2 (R2): a genuinely contradictory duplicate IDBUTUR (GREIDFAERT + LOKAD) is never passable end-to-end, and the closure is preserved", async () => {
    const id = WINTER_ROUTE_IDBUTUR_LIST[7];
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      const rows = WINTER_ROUTE_IDBUTUR_LIST.map(validSegmentRow);
      rows.push({ ...validSegmentRow(id), AstandYfirbord: "LOKAD" });
      return Promise.resolve(okJsonResponse(rows));
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq(), res);

    const segment = res.body.segments.find((s) => s.idButur === id);
    expect(segment.ambiguous).toBe(true);
    expect(segment.category).toBe("closed");
    expect(segment.positiveStyleEligible).toBe(false);
  });

  it("ETA follow-up: each available forecast point carries its own approxDistanceFromStartKm through to the response, matching the fixed segment data", async () => {
    const window = computeForecastWindow();
    const forecastResults = WINTER_ROUTE_FORECAST_POINTS.map((p, i) => ({
      latitude: p.lat,
      longitude: p.lon,
      elevation: 1,
      utc_offset_seconds: 0,
      hourly_units: {
        temperature_2m: "°C",
        wind_speed_10m: "m/s",
        wind_gusts_10m: "m/s",
        precipitation: "mm",
        weather_code: "wmo code",
      },
      hourly: {
        time: window.expectedHours,
        temperature_2m: window.expectedHours.map(() => i),
        wind_speed_10m: window.expectedHours.map(() => 1),
        wind_gusts_10m: window.expectedHours.map(() => 1),
        precipitation: window.expectedHours.map(() => 0),
        weather_code: window.expectedHours.map(() => 0),
      },
    }));

    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      if (String(url).includes("faerd2017_1")) {
        return Promise.resolve(okJsonResponse(WINTER_ROUTE_IDBUTUR_LIST.map(validSegmentRow)));
      }
      return Promise.resolve(okJsonResponse(forecastResults));
    });
    process.env.OPEN_METEO_API_KEY = "test-key";

    const res = makeRes();
    await handler(makeReq(), res);

    expect(res.body.forecast.available).toBe(true);
    expect(res.body.forecast.points).toHaveLength(6);
    res.body.forecast.points.forEach((point, i) => {
      expect(point.available).toBe(true);
      expect(point.approxDistanceFromStartKm).toBeCloseTo(WINTER_ROUTE_FORECAST_POINTS[i].approxDistanceFromStartKm, 6);
    });
    // Strictly increasing P1..P6, matching the corridor order.
    const distances = res.body.forecast.points.map((p) => p.approxDistanceFromStartKm);
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThan(distances[i - 1]);
    }
  });

  it("default request (no query, incl. req.query itself undefined) still returns the unchanged Vík routeId/expectedPointCount", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      return Promise.resolve(okJsonResponse(WINTER_ROUTE_IDBUTUR_LIST.map(validSegmentRow)));
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq(), res); // no query at all, same as every pre-#491 test

    expect(res.statusCode).toBe(200);
    expect(res.body.routeId).toBe("raudavatn-vik");
    expect(res.body.expectedPointCount).toBe(6);
    expect(res.body.segments).toHaveLength(13);
  });

  it("a closed segment's category is 'closed' regardless of other segments", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      const rows = WINTER_ROUTE_IDBUTUR_LIST.map(validSegmentRow);
      rows[3].AstandYfirbord = "LOKAD";
      return Promise.resolve(okJsonResponse(rows));
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq(), res);

    expect(res.body.segments[3].category).toBe("closed");
    expect(res.body.segments.filter((s) => s.category === "closed")).toHaveLength(1);
  });
});

describe("Ticket #491, B2 — routeId validation", () => {
  it("rejects an unknown routeId with 400, without echoing the input", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { routeId: "nonexistent-route" }), res);
    expect(res.statusCode).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain("nonexistent-route");
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("rejects an empty routeId with 400", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { routeId: "" }), res);
    expect(res.statusCode).toBe(400);
  });

  it("rejects a repeated routeId (array) with 400", async () => {
    const res = makeRes();
    await handler(makeReq("GET", { routeId: ["raudavatn-vik", "raudavatn-borgarnes"] }), res);
    expect(res.statusCode).toBe(400);
  });

  it("rejects __proto__/constructor/toString as routeId with 400 — never resolves an inherited property", async () => {
    for (const bad of ["__proto__", "constructor", "toString"]) {
      const res = makeRes();
      await handler(makeReq("GET", { routeId: bad }), res);
      expect(res.statusCode).toBe(400);
    }
  });

  it("other query parameters stay ignored even when routeId is present and valid", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      return Promise.resolve(okJsonResponse(BORGARNES_IDBUTUR_LIST.map(validSegmentRow)));
    });
    delete process.env.OPEN_METEO_API_KEY;
    const res = makeRes();
    await handler(makeReq("GET", { routeId: "raudavatn-borgarnes", host: "evil.example", lat: "0", lon: "0" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.routeId).toBe("raudavatn-borgarnes");
  });
});

describe("Ticket #491 — Rauðavatn–Borgarnes route", () => {
  function borgarnesSegmentRow(idButur) {
    return validSegmentRow(idButur);
  }

  it("returns exactly the 8 fixed Borgarnes segments, in fixed order, and expectedPointCount 4", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      if (String(url).includes("faerd2017_1")) {
        return Promise.resolve(okJsonResponse(BORGARNES_IDBUTUR_LIST.map(borgarnesSegmentRow)));
      }
      throw new Error("unexpected fetch (forecast must not be called when key is missing)");
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq("GET", { routeId: "raudavatn-borgarnes" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.routeId).toBe("raudavatn-borgarnes");
    expect(res.body.expectedPointCount).toBe(4);
    expect(res.body.segments).toHaveLength(8);
    expect(res.body.segments.map((s) => s.idButur)).toEqual(BORGARNES_IDBUTUR_LIST);
    expect(res.body.segments.every((s) => s.category === "passable")).toBe(true);
    expect(res.body.forecast.available).toBe(false);
    expect(res.body.forecast.reason).toBe("key_missing");
  });

  it("Vík's own IDBUTUR rows never leak into a Borgarnes response, even if present in the feed", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      const rows = [...BORGARNES_IDBUTUR_LIST, ...WINTER_ROUTE_IDBUTUR_LIST].map(borgarnesSegmentRow);
      return Promise.resolve(okJsonResponse(rows));
    });
    delete process.env.OPEN_METEO_API_KEY;

    const res = makeRes();
    await handler(makeReq("GET", { routeId: "raudavatn-borgarnes" }), res);
    expect(res.body.segments).toHaveLength(8);
    expect(res.body.segments.map((s) => s.idButur)).toEqual(BORGARNES_IDBUTUR_LIST);
  });

  it("returns exactly 4 forecast points with the fixed Borgarnes lat/lon, in order, when the forecast is available", async () => {
    const window = computeForecastWindow();
    const forecastResults = BORGARNES_FORECAST_POINTS.map((p, i) => ({
      latitude: p.lat,
      longitude: p.lon,
      elevation: 1,
      utc_offset_seconds: 0,
      hourly_units: {
        temperature_2m: "°C",
        wind_speed_10m: "m/s",
        wind_gusts_10m: "m/s",
        precipitation: "mm",
        weather_code: "wmo code",
      },
      hourly: {
        time: window.expectedHours,
        temperature_2m: window.expectedHours.map(() => i),
        wind_speed_10m: window.expectedHours.map(() => 1),
        wind_gusts_10m: window.expectedHours.map(() => 1),
        precipitation: window.expectedHours.map(() => 0),
        weather_code: window.expectedHours.map(() => 0),
      },
    }));

    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      if (String(url).includes("faerd2017_1")) {
        return Promise.resolve(okJsonResponse(BORGARNES_IDBUTUR_LIST.map(borgarnesSegmentRow)));
      }
      return Promise.resolve(okJsonResponse(forecastResults));
    });
    process.env.OPEN_METEO_API_KEY = "test-key";

    const res = makeRes();
    await handler(makeReq("GET", { routeId: "raudavatn-borgarnes" }), res);

    expect(res.body.forecast.available).toBe(true);
    expect(res.body.forecast.points).toHaveLength(4);
    res.body.forecast.points.forEach((point, i) => {
      expect(point.available).toBe(true);
      expect(point.approxDistanceFromStartKm).toBe(BORGARNES_FORECAST_POINTS[i].approxDistanceFromStartKm);
    });
  });

  it("Vík and Borgarnes keep fully independent caches — stale/fallback Vík data never appears in a Borgarnes request", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url) => {
      if (String(url).includes("faerdpunktar")) return Promise.resolve(okJsonResponse([]));
      callCount += 1;
      if (callCount === 1) return Promise.resolve(okJsonResponse(WINTER_ROUTE_IDBUTUR_LIST.map(validSegmentRow)));
      return Promise.resolve({ ok: false, status: 500, text: async () => "" });
    });
    delete process.env.OPEN_METEO_API_KEY;

    const vikRes = makeRes();
    await handler(makeReq(), vikRes);
    expect(vikRes.body.routeId).toBe("raudavatn-vik");
    expect(vikRes.body.roadMeta.segmentsAvailable).toBe(true);

    const borgarnesRes = makeRes();
    await handler(makeReq("GET", { routeId: "raudavatn-borgarnes" }), borgarnesRes);
    expect(borgarnesRes.body.routeId).toBe("raudavatn-borgarnes");
    // Borgarnes's own first fetch failed (no prior cache entry for it) —
    // it must never be served Vík's successful cached segment rows.
    expect(borgarnesRes.body.roadMeta.segmentsAvailable).toBe(false);
  });
});
