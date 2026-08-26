// api/_lib/auroraDecision/orchestrate.test.js
//
// Integration-level tests for the full Ticket 3 orchestration, with sql,
// fetchImpl, and now() all injected — no real network, database, or wall
// clock (approved prompt §9).

import { describe, it, expect } from "vitest";
import { runAuroraDecision } from "./orchestrate.js";

const CANONICAL_LOCATIONS = [
  { id: "loc-clear", name: "Clear Site", lat: 64.1, lon: -21.9 },
  { id: "loc-partial", name: "Partial Site", lat: 65.2, lon: -18.5 },
  { id: "loc-cloudy", name: "Cloudy Site", lat: 66.3, lon: -15.0 },
];

const NIGHT = {
  eveningDate: "2026-08-24",
  auroraActivity: 9,
  sun: { sunset: "21:00", darknessStart: "22:00", dawn: "05:00", sunrise: "06:00" },
  moon: { ageDays: 0, rise: null, set: null, scheduleType: 1 },
};

const FRESH_FETCHED_AT = "2026-08-24T10:00:00.000Z";
const NOW_FRESH = () => new Date("2026-08-24T12:00:00.000Z"); // 2h after fetch -> fresh
const NOW_STALE = () => new Date("2026-08-24T20:00:00.000Z"); // 10h after fetch -> stale (360 < age <= 1440 min)
const NOW_TOO_OLD = () => new Date("2026-08-27T20:00:00.000Z"); // ~82h after fetch -> unavailable

function makeSql(rows) {
  return () => Promise.resolve(rows);
}

const cacheRowsWithNights = (nights, sourceFetchedAt = FRESH_FETCHED_AT) => [
  { snapshot: { nights }, source_fetched_at: sourceFetchedAt, updated_at: sourceFetchedAt },
];

// cloudByLat keyed by the exact lat.toFixed(4) string buildOpenMeteoUrl sends.
function makeFetchImpl(cloudByLat, { fail = new Set() } = {}) {
  return async (url) => {
    const lat = new URL(url).searchParams.get("latitude");
    if (fail.has(lat)) throw new Error("simulated network failure");
    const cloud = cloudByLat[lat] ?? 0;
    return {
      ok: true,
      json: async () => ({
        hourly: {
          time: ["2026-08-24T22:00", "2026-08-24T23:00", "2026-08-25T00:00", "2026-08-25T04:00"],
          cloudcover: [cloud, cloud, cloud, cloud],
          cloudcover_low: [cloud, cloud, cloud, cloud],
          cloudcover_mid: [0, 0, 0, 0],
          cloudcover_high: [0, 0, 0, 0],
          precipitation: [0, 0, 0, 0],
          windspeed_10m: [1, 1, 1, 1],
          visibility: [10000, 10000, 10000, 10000],
        },
      }),
    };
  };
}

const BASE_REQUEST = {
  canonicalLocations: CANONICAL_LOCATIONS,
  fetchImpl: makeFetchImpl({ "64.1000": 0, "65.2000": 50, "66.3000": 100 }),
};

describe("runAuroraDecision — success path", () => {
  it("1. ranks three valid locations (clear/partial/full cloud), best first, alternatives ordered", async () => {
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-cloudy", "loc-clear", "loc-partial"] },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });

    expect(result.httpStatus).toBe(200);
    expect(result.body.status).toBe("success");
    expect(result.body.best.locationId).toBe("loc-clear");
    expect(result.body.alternatives.map((a) => a.locationId)).toEqual(["loc-partial", "loc-cloudy"]);
    expect(result.body.excluded).toEqual([]);
    expect(result.body.auroraCache.state).toBe("fresh");
    expect(result.body.viewingWindow).toEqual({ start: "2026-08-24T22:00:00.000Z", end: "2026-08-25T05:00:00.000Z" });
    expect(result.body.warnings).toContain("national_reference_window");
  });

  it("10. produces the identical canonical result regardless of client-supplied tier/entitlement fields", async () => {
    const runOnce = (extra) =>
      runAuroraDecision({
        body: { evening: "2026-08-24", locationIds: ["loc-clear", "loc-partial"], ...extra },
        sql: makeSql(cacheRowsWithNights([NIGHT])),
        fetchImpl: BASE_REQUEST.fetchImpl,
        now: NOW_FRESH,
        canonicalLocations: CANONICAL_LOCATIONS,
      });

    const withoutTier = await runOnce({});
    const withTier = await runOnce({ tier: "pro", isPro: true, ranking: ["loc-partial", "loc-clear"] });
    expect(withTier.body).toEqual(withoutTier.body);
  });
});

describe("runAuroraDecision — partial and failure isolation", () => {
  it("4. one location failing (timeout/network) still produces a partial decision for the rest", async () => {
    const fetchImpl = makeFetchImpl({ "64.1000": 0, "66.3000": 100 }, { fail: new Set(["65.2000"]) });
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear", "loc-partial", "loc-cloudy"] },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });

    expect(result.body.status).toBe("partial");
    expect(result.body.best.locationId).toBe("loc-clear");
    expect(result.body.excluded).toEqual([
      { locationId: "loc-partial", name: "Partial Site", status: "weather_fetch_failed", reasons: ["weather_fetch_failed"] },
    ]);
    expect(result.body.warnings).toContain("some_locations_excluded");
  });

  it("6. Ticket 2 insufficient_data/not_viewable results are preserved and excluded from ranking", async () => {
    const nightWithoutActivity = { ...NIGHT, auroraActivity: null };
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear"] },
      sql: makeSql(cacheRowsWithNights([nightWithoutActivity])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });

    expect(result.body.status).toBe("unavailable");
    expect(result.body.reason).toBe("no_locations_scored");
    expect(result.body.excluded).toEqual([
      { locationId: "loc-clear", name: "Clear Site", status: "insufficient_data", reasons: ["missing_activity"] },
    ]);
  });
});

describe("runAuroraDecision — Aurora cache freshness states", () => {
  it("7a. classifies a fresh cache and still produces a decision", async () => {
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear"] },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.body.auroraCache.state).toBe("fresh");
    expect(result.body.warnings).not.toContain("aurora_data_stale");
  });

  it("7b. classifies a stale-but-usable cache, flags it, and still produces a decision", async () => {
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear"] },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_STALE,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.body.auroraCache.state).toBe("stale");
    expect(result.body.status).toBe("success");
    expect(result.body.warnings).toContain("aurora_data_stale");
  });

  it("7c. treats a too-old cache as unavailable and never fabricates a score", async () => {
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear"] },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_TOO_OLD,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.body.status).toBe("unavailable");
    expect(result.body.reason).toBe("aurora_cache_unavailable");
    expect(result.body.auroraCache.reason).toBe("too_old");
    expect(result.body.best).toBeNull();
  });

  it("7d. treats a missing cache row as unavailable", async () => {
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear"] },
      sql: makeSql([]),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.body.status).toBe("unavailable");
    expect(result.body.auroraCache.reason).toBe("missing");
  });

  it("7e. treats a malformed cache row (bad source_fetched_at) as unavailable", async () => {
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear"] },
      sql: makeSql([{ snapshot: { nights: [NIGHT] }, source_fetched_at: "not-a-date" }]),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.body.status).toBe("unavailable");
    expect(result.body.auroraCache.reason).toBe("malformed");
  });

  it("8. missing matching evening/night yields a stable unavailable response, never a fabricated score", async () => {
    const result = await runAuroraDecision({
      body: { evening: "2026-09-01", locationIds: ["loc-clear"] },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.body.status).toBe("unavailable");
    expect(result.body.reason).toBe("night_not_found");
    expect(result.body.viewingWindow).toBeNull();
  });

  it("8b. an invalid national darkness window yields a stable unavailable response", async () => {
    const brokenNight = { ...NIGHT, sun: { ...NIGHT.sun, darknessStart: null } };
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear"] },
      sql: makeSql(cacheRowsWithNights([brokenNight])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.body.status).toBe("unavailable");
    expect(result.body.reason).toBe("invalid_darkness_window");
  });
});

describe("runAuroraDecision — request validation before any fan-out", () => {
  it("9a. rejects an invalid evening date", async () => {
    const result = await runAuroraDecision({
      body: { evening: "not-a-date", locationIds: ["loc-clear"] },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({ ok: false, code: "invalid_evening", error: expect.any(String) });
  });

  it("9b. rejects an empty selection", async () => {
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: [] },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.httpStatus).toBe(400);
    expect(result.body.code).toBe("empty_selection");
  });

  it("9c. rejects unknown location IDs and lists them, without ever reading the cache", async () => {
    let sqlCalled = false;
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear", "loc-ghost"] },
      sql: () => {
        sqlCalled = true;
        return Promise.resolve(cacheRowsWithNights([NIGHT]));
      },
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.httpStatus).toBe(400);
    expect(result.body).toEqual({
      ok: false,
      code: "unknown_location_ids",
      error: expect.any(String),
      details: { unknownIds: ["loc-ghost"] },
    });
    expect(sqlCalled).toBe(false);
  });

  it("9d. enforces the maximum location count before any fan-out", async () => {
    let fetchCalled = false;
    const ids = Array.from({ length: 9 }, (_, i) => `loc-${i}`);
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ids },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: async () => {
        fetchCalled = true;
        throw new Error("should not be called");
      },
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.httpStatus).toBe(400);
    expect(result.body.code).toBe("too_many_locations");
    expect(fetchCalled).toBe(false);
  });

  it("9e. duplicate IDs are deduplicated rather than rejected", async () => {
    const result = await runAuroraDecision({
      body: { evening: "2026-08-24", locationIds: ["loc-clear", "loc-clear"] },
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.httpStatus).toBe(200);
    expect(result.body.alternatives).toEqual([]);
  });

  it("9f. rejects a malformed body", async () => {
    const result = await runAuroraDecision({
      body: null,
      sql: makeSql(cacheRowsWithNights([NIGHT])),
      fetchImpl: BASE_REQUEST.fetchImpl,
      now: NOW_FRESH,
      canonicalLocations: CANONICAL_LOCATIONS,
    });
    expect(result.httpStatus).toBe(400);
    expect(result.body.code).toBe("invalid_body");
  });
});

describe("runAuroraDecision — determinism", () => {
  it("2/3. different completion orders and equal scores still produce byte-equivalent decision ordering", async () => {
    const fastFirst = makeFetchImpl({ "64.1000": 10, "65.2000": 10, "66.3000": 10 });
    const slowFirst = async (url) => {
      const lat = new URL(url).searchParams.get("latitude");
      const delay = lat === "64.1000" ? 20 : lat === "65.2000" ? 10 : 0;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fastFirst(url);
    };

    const runWith = (fetchImpl) =>
      runAuroraDecision({
        body: { evening: "2026-08-24", locationIds: ["loc-cloudy", "loc-clear", "loc-partial"] },
        sql: makeSql(cacheRowsWithNights([NIGHT])),
        fetchImpl,
        now: NOW_FRESH,
        canonicalLocations: CANONICAL_LOCATIONS,
      });

    const a = await runWith(fastFirst);
    const b = await runWith(slowFirst);
    expect(a.body).toEqual(b.body);
    // Equal scores across all three locations resolve via the canonical-ID
    // tie-break: loc-clear < loc-cloudy < loc-partial.
    expect(a.body.best.locationId).toBe("loc-clear");
    expect(a.body.alternatives.map((x) => x.locationId)).toEqual(["loc-cloudy", "loc-partial"]);
  });
});
