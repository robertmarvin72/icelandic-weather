// Ticket #460 — routeRisk.js had NO test file before this ticket. The P0
// bug (#437 F-04/RC-17): missing/invalid route-weather data fell through
// classifyRouteRisk/estimateRouteRisk to "LOW", indistinguishable from a
// genuinely confirmed-calm route. These tests pin the fix: LOW now requires
// every requested point to have a valid wind AND gust reading; anything
// short of that is UNKNOWN unless an observed value actually reaches
// MED/HIGH (a lower bound, so partial-but-known-bad data still warns).
import { describe, it, expect } from "vitest";
import { classifyRouteRisk, estimateRouteRisk, interpolateRoutePoints } from "./routeRisk";

const HAZARDS = { windWarn: 14, windHigh: 18, gustWarn: 20, gustHigh: 24 };

const ORIGIN = { lat: 64.0, lon: -21.0 };
const DEST = { lat: 64.5, lon: -20.0 };

function dailyAt(index, { wind, gust, rain, date } = {}) {
  const arr = (v) => {
    const a = [];
    a[index] = v;
    return a;
  };
  return {
    windspeed_10m_max: arr(wind),
    windgusts_10m_max: arr(gust),
    precipitation_sum: arr(rain),
    time: arr(date),
  };
}

describe("classifyRouteRisk", () => {
  it("boundary >= behavior unchanged for complete, valid input", () => {
    expect(
      classifyRouteRisk({ maxWind: 18, maxGust: 0, windComplete: true, gustComplete: true, hazards: HAZARDS })
    ).toBe("HIGH");
    expect(
      classifyRouteRisk({ maxWind: 17.9, maxGust: 0, windComplete: true, gustComplete: true, hazards: HAZARDS })
    ).toBe("MED");
    expect(
      classifyRouteRisk({ maxWind: 14, maxGust: 0, windComplete: true, gustComplete: true, hazards: HAZARDS })
    ).toBe("MED");
    expect(
      classifyRouteRisk({ maxWind: 13.9, maxGust: 0, windComplete: true, gustComplete: true, hazards: HAZARDS })
    ).toBe("LOW");
    expect(
      classifyRouteRisk({ maxWind: 0, maxGust: 24, windComplete: true, gustComplete: true, hazards: HAZARDS })
    ).toBe("HIGH");
    expect(
      classifyRouteRisk({ maxWind: 0, maxGust: 20, windComplete: true, gustComplete: true, hazards: HAZARDS })
    ).toBe("MED");
  });

  it("legitimate zeros are valid and, when complete, LOW", () => {
    expect(
      classifyRouteRisk({ maxWind: 0, maxGust: 0, windComplete: true, gustComplete: true, hazards: HAZARDS })
    ).toBe("LOW");
  });

  it("RC-01..RC-10 class: null/undefined/NaN/negative/string no longer fall through to LOW", () => {
    const base = { windComplete: true, gustComplete: true, hazards: HAZARDS };
    expect(classifyRouteRisk({ ...base, maxWind: null, maxGust: null })).toBe("UNKNOWN");
    expect(classifyRouteRisk({ ...base, maxWind: undefined, maxGust: undefined })).toBe("UNKNOWN");
    expect(classifyRouteRisk({ ...base, maxWind: NaN, maxGust: NaN })).toBe("UNKNOWN");
    expect(classifyRouteRisk({ ...base, maxWind: -5, maxGust: -5 })).toBe("UNKNOWN");
    expect(classifyRouteRisk({ ...base, maxWind: "14", maxGust: "20" })).toBe("UNKNOWN");
    expect(classifyRouteRisk({ ...base, maxWind: Infinity, maxGust: 0 })).toBe("UNKNOWN");
  });

  it("missing completeness info defaults to incomplete (no LOW without it)", () => {
    // No windComplete/gustComplete passed at all — safe default, not LOW.
    expect(classifyRouteRisk({ maxWind: 5, maxGust: 5, hazards: HAZARDS })).toBe("UNKNOWN");
  });

  it("an observed exceedance is HIGH/MED even if the OTHER variable is invalid or incomplete", () => {
    expect(
      classifyRouteRisk({
        maxWind: 20,
        maxGust: NaN,
        windComplete: false,
        gustComplete: false,
        hazards: HAZARDS,
      })
    ).toBe("HIGH");
    expect(
      classifyRouteRisk({
        maxWind: null,
        maxGust: 22,
        windComplete: false,
        gustComplete: false,
        hazards: HAZARDS,
      })
    ).toBe("MED");
  });

  it("subthreshold values are LOW only with BOTH variables valid and complete", () => {
    expect(
      classifyRouteRisk({ maxWind: 10, maxGust: 15, windComplete: true, gustComplete: true, hazards: HAZARDS })
    ).toBe("LOW");
    expect(
      classifyRouteRisk({ maxWind: 10, maxGust: 15, windComplete: false, gustComplete: true, hazards: HAZARDS })
    ).toBe("UNKNOWN");
    expect(
      classifyRouteRisk({ maxWind: 10, maxGust: null, windComplete: true, gustComplete: true, hazards: HAZARDS })
    ).toBe("UNKNOWN");
  });
});

describe("estimateRouteRisk — RC-17 and real getForecast failure-path reproduction (7 points)", () => {
  it("RC-17 reproduced with 7 points: every point resolves null -> UNKNOWN, not LOW", async () => {
    const getForecast = async () => null;
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("UNKNOWN");
    expect(risk.maxWind).toBeNull();
    expect(risk.maxGust).toBeNull();
    expect(risk.rainMax).toBeNull();
    expect(risk.coverage.status).toBe("unavailable");
    expect(risk.coverage.wind).toEqual({ requested: 7, returned: 0, valid: 0 });
  });

  it("real getForecast rejection path: every point throws -> estimator does not abort, resolves UNKNOWN", async () => {
    const getForecast = async () => {
      throw new Error("network down");
    };
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("UNKNOWN");
    expect(risk.coverage.status).toBe("unavailable");
  });

  it("empty daily arrays / missing index -> UNKNOWN, not LOW", async () => {
    const getForecast = async () => ({
      daily: { windspeed_10m_max: [], windgusts_10m_max: [], precipitation_sum: [], time: [] },
    });
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("UNKNOWN");
    expect(risk.coverage.status).toBe("unavailable");
  });

  it("missing daily entirely on every point -> UNKNOWN", async () => {
    const getForecast = async () => ({});
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("UNKNOWN");
  });

  // Correction v2, R2 (Jonesy/Ripley) — explicit coverage for a genuinely
  // SHORT array (length 1, index 1 does not exist at all) as distinct from
  // the already-covered "present but null" and "empty array" cases.
  it("short wind/gust arrays (length 1, index 1 does not exist) on every point -> UNKNOWN, no invented maxima", async () => {
    const getForecast = async () => ({
      daily: {
        windspeed_10m_max: [5],
        windgusts_10m_max: [8],
        precipitation_sum: [2],
        time: ["2026-10-27"],
      },
    });
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("UNKNOWN");
    expect(risk.maxWind).toBeNull();
    expect(risk.maxGust).toBeNull();
    expect(risk.rainMax).toBeNull();
    expect(risk.coverage.status).toBe("unavailable");
  });

  // Distinct from the short-array case above: the array is long enough,
  // but the value AT index 1 is explicitly `null` (e.g. an Open-Meteo gap),
  // not merely absent.
  it("explicit null VALUES at index 1 (array present, long enough) on every point -> UNKNOWN, no invented maxima", async () => {
    const getForecast = async () => ({
      daily: {
        windspeed_10m_max: [5, null, 6],
        windgusts_10m_max: [8, null, 9],
        precipitation_sum: [2, null, 1],
        time: ["2026-10-26", "2026-10-27", "2026-10-28"],
      },
    });
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("UNKNOWN");
    expect(risk.maxWind).toBeNull();
    expect(risk.maxGust).toBeNull();
    expect(risk.rainMax).toBeNull();
    expect(risk.coverage.status).toBe("unavailable");
    // "returned" must still count the null as a response that WAS
    // delivered (distinct from the short-array case, which never even
    // returns a slot) — only "valid" stays 0.
    expect(risk.coverage.wind.returned).toBe(7);
    expect(risk.coverage.wind.valid).toBe(0);
  });

  it("one variable only (wind present at every point, gust never present) -> UNKNOWN, partial coverage", async () => {
    const getForecast = async () => ({ daily: dailyAt(1, { wind: 10 }) });
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("UNKNOWN");
    expect(risk.maxWind).toBe(10);
    expect(risk.maxGust).toBeNull();
    expect(risk.coverage.status).toBe("partial");
    expect(risk.coverage.wind.valid).toBe(7);
    expect(risk.coverage.gust.valid).toBe(0);
  });

  it("mixed partial + known-HIGH: one point has HIGH wind, rest missing -> HIGH, partial coverage (lower bound)", async () => {
    let call = 0;
    const getForecast = async () => {
      call += 1;
      if (call === 1) return { daily: dailyAt(1, { wind: 20 }) };
      return null;
    };
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("HIGH");
    expect(risk.maxWind).toBe(20);
    expect(risk.coverage.status).toBe("partial");
  });

  it("mixed partial + subthreshold only: one point has calm wind, rest missing -> UNKNOWN, not LOW", async () => {
    let call = 0;
    const getForecast = async () => {
      call += 1;
      if (call === 1) return { daily: dailyAt(1, { wind: 5 }) };
      return null;
    };
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("UNKNOWN");
    expect(risk.maxWind).toBe(5);
    expect(risk.coverage.status).toBe("partial");
  });

  it("NaN/Infinity/string/negative per-point values are excluded from maxima and from the valid count", async () => {
    const bad = [NaN, Infinity, "14", -5];
    let call = 0;
    const getForecast = async () => {
      const wind = bad[call % bad.length];
      call += 1;
      return { daily: dailyAt(1, { wind, gust: 5 }) };
    };
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.maxWind).toBeNull();
    expect(risk.coverage.wind.valid).toBe(0);
    expect(risk.coverage.wind.returned).toBe(7);
    expect(risk.coverage.gust.valid).toBe(7);
    expect(risk.routeRisk).toBe("UNKNOWN"); // gust valid+complete but wind invalid -> incomplete overall
  });

  it("missing rain stays null (not coerced to 0), independent of wind/gust completeness", async () => {
    const getForecast = async () => ({ daily: dailyAt(1, { wind: 5, gust: 5 }) }); // no rain key
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.rainMax).toBeNull();
    expect(risk.routeRisk).toBe("LOW"); // rain never gates wind/gust classification
  });

  it("complete calm route: full valid coverage, all subthreshold -> LOW with real maxima", async () => {
    const getForecast = async () => ({ daily: dailyAt(1, { wind: 10, gust: 15, rain: 2 }) });
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("LOW");
    expect(risk.maxWind).toBe(10);
    expect(risk.maxGust).toBe(15);
    expect(risk.rainMax).toBe(2);
    expect(risk.coverage.status).toBe("complete");
  });

  it("complete windy route: full valid coverage, HIGH exceedance", async () => {
    const getForecast = async () => ({ daily: dailyAt(1, { wind: 20, gust: 10, rain: 5 }) });
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("HIGH");
    expect(risk.coverage.status).toBe("complete");
  });

  it("legitimate zero wind/gust across all points is valid and, when complete, LOW (not treated as missing)", async () => {
    const getForecast = async () => ({ daily: dailyAt(1, { wind: 0, gust: 0, rain: 0 }) });
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeRisk).toBe("LOW");
    expect(risk.maxWind).toBe(0);
    expect(risk.maxGust).toBe(0);
    expect(risk.rainMax).toBe(0);
  });

  it("routeDate/dateVerified: all points agree -> verified, records the actual date", async () => {
    const getForecast = async () => ({ daily: dailyAt(1, { wind: 5, gust: 5, date: "2026-10-27" }) });
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeDate).toBe("2026-10-27");
    expect(risk.dateVerified).toBe(true);
  });

  it("routeDate/dateVerified: points disagree -> not verified, first-seen date kept, no throw", async () => {
    let call = 0;
    const dates = ["2026-10-27", "2026-10-28"];
    const getForecast = async () => {
      const date = dates[call % dates.length];
      call += 1;
      return { daily: dailyAt(1, { wind: 5, gust: 5, date }) };
    };
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeDate).toBe("2026-10-27");
    expect(risk.dateVerified).toBe(false);
  });

  it("routeDate/dateVerified: no daily.time anywhere -> unverified, null date, no invented date", async () => {
    const getForecast = async () => ({ daily: dailyAt(1, { wind: 5, gust: 5 }) }); // no date key
    const risk = await estimateRouteRisk({ origin: ORIGIN, destination: DEST, getForecast, hazards: HAZARDS });

    expect(risk.routeDate).toBeNull();
    expect(risk.dateVerified).toBe(false);
  });

  it("per-point request count is deterministic (does not depend on success/failure)", async () => {
    const getForecast = async () => null;
    const risk = await estimateRouteRisk({
      origin: ORIGIN,
      destination: DEST,
      getForecast,
      hazards: HAZARDS,
      samples: 7,
    });
    expect(risk.coverage.wind.requested).toBe(7);
    expect(risk.coverage.gust.requested).toBe(7);
    expect(risk.coverage.rain.requested).toBe(7);
    expect(interpolateRoutePoints(ORIGIN, DEST, 7)).toHaveLength(7);
  });
});
