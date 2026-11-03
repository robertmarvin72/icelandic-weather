// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "./winter-route.js";
import { __resetWinterRouteCacheForTests } from "./_lib/winterRoute/cache.js";
import { WINTER_ROUTE_IDBUTUR_LIST } from "./_lib/winterRoute/segments.js";

function makeReq(method = "GET") {
  return { method, url: "/api/winter-route", headers: { host: "localhost:3000" } };
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
