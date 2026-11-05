// @vitest-environment node
import { describe, it, expect } from "vitest";
import { resolveRouteId, ROUTE_DEFS, DEFAULT_ROUTE_ID, BORGARNES_SEGMENTS, BORGARNES_FORECAST_POINTS } from "./routes.js";
import { WINTER_ROUTE_SEGMENTS, WINTER_ROUTE_IDBUTUR_LIST, WINTER_ROUTE_FORECAST_POINTS } from "./segments.js";

describe("resolveRouteId — B2 strict allowlist", () => {
  it("resolves undefined (missing routeId, incl. req.query itself being undefined) to the default Vík route", () => {
    const result = resolveRouteId(undefined);
    expect(result.ok).toBe(true);
    expect(result.routeId).toBe(DEFAULT_ROUTE_ID);
    expect(result.route.idButurList).toEqual(WINTER_ROUTE_IDBUTUR_LIST);
  });

  it("resolves a known routeId", () => {
    const result = resolveRouteId("raudavatn-borgarnes");
    expect(result.ok).toBe(true);
    expect(result.routeId).toBe("raudavatn-borgarnes");
    expect(result.route.expectedPointCount).toBe(4);
  });

  it("rejects an empty string", () => {
    expect(resolveRouteId("").ok).toBe(false);
  });

  it("rejects an array (repeated ?routeId=a&routeId=b)", () => {
    expect(resolveRouteId(["raudavatn-vik", "raudavatn-borgarnes"]).ok).toBe(false);
  });

  it("rejects an unknown string", () => {
    expect(resolveRouteId("nonexistent-route").ok).toBe(false);
  });

  it("rejects prototype-pollution-style values — own-property Map lookup only, never a bracket lookup against a plain object", () => {
    for (const bad of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      expect(resolveRouteId(bad).ok).toBe(false);
    }
  });

  it("never echoes the rejected input back in the result", () => {
    const result = resolveRouteId("__proto__");
    expect(JSON.stringify(result)).not.toContain("__proto__");
  });
});

describe("ROUTE_DEFS — Vík unchanged, Borgarnes fixed shape", () => {
  it("Vík entry reuses segments.js verbatim, unchanged", () => {
    const vik = ROUTE_DEFS.get("raudavatn-vik");
    expect(vik.segments).toBe(WINTER_ROUTE_SEGMENTS);
    expect(vik.idButurList).toBe(WINTER_ROUTE_IDBUTUR_LIST);
    expect(vik.forecastPoints).toBe(WINTER_ROUTE_FORECAST_POINTS);
    expect(vik.expectedPointCount).toBe(6);
  });

  it("Borgarnes has exactly 8 fixed IDBUTUR in the B6-specified order (1410010037 is not a 9th entry)", () => {
    expect(BORGARNES_SEGMENTS.map((s) => s.idButur)).toEqual([
      914020037, 903020037, 903030037, 904690037, 904000037, 904010037, 804020037, 904040037,
    ]);
  });

  it("Borgarnes has exactly 4 forecast points with the B6-specified nearIdButur and B1-cross-checked distances", () => {
    expect(BORGARNES_FORECAST_POINTS).toHaveLength(4);
    expect(BORGARNES_FORECAST_POINTS.map((p) => p.nearIdButur)).toEqual([903030037, 904690037, 804020037, 904040037]);
    expect(BORGARNES_FORECAST_POINTS.map((p) => p.approxDistanceFromStartKm)).toEqual([23.559, 34.288, 53.738, 70.566]);
  });

  it("Borgarnes forecast points are in strictly increasing distance-from-start order", () => {
    const distances = BORGARNES_FORECAST_POINTS.map((p) => p.approxDistanceFromStartKm);
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThan(distances[i - 1]);
    }
  });

  it("every Borgarnes forecast point lat/lon is a finite number (no stray station/grid-snap coordinate)", () => {
    for (const p of BORGARNES_FORECAST_POINTS) {
      expect(Number.isFinite(p.lat)).toBe(true);
      expect(Number.isFinite(p.lon)).toBe(true);
    }
  });
});
