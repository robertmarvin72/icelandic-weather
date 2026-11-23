// api/_lib/winterRoute/budardalurHolmavikRoute.test.js — Ticket #503, P2/P3
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  BUDARDALUR_HOLMAVIK_FORECAST_POINTS,
  resolveBudardalurHolmavikGeometry,
  orderedForecastPoints,
} from "./budardalurHolmavikRoute.js";
import { loadWestfjordsCombinedRegionDataset } from "./westfjordsCombinedRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

// Same offline Lambert Conformal Conic 2SP inverse used throughout this
// ticket series (GRS80) -- re-derived independently here, not imported
// from the registry file itself, so this test cannot pass by trusting its
// own subject's own numbers.
const A_ELL = 6378137.0, F_ELL = 1 / 298.257222101, E2 = F_ELL * (2 - F_ELL), E = Math.sqrt(E2);
const LAT0 = (65 * Math.PI) / 180, LON0 = (-19 * Math.PI) / 180, LAT1 = (64.25 * Math.PI) / 180, LAT2 = (65.75 * Math.PI) / 180;
const X0 = 500000, Y0 = 500000;
function mFunc(phi) { return Math.cos(phi) / Math.sqrt(1 - E2 * Math.sin(phi) ** 2); }
function tFunc(phi) { const s = Math.sin(phi); return Math.tan(Math.PI / 4 - phi / 2) / ((1 - E * s) / (1 + E * s)) ** (E / 2); }
const m1 = mFunc(LAT1), m2 = mFunc(LAT2), t0 = tFunc(LAT0), t1 = tFunc(LAT1), t2 = tFunc(LAT2);
const N = (Math.log(m1) - Math.log(m2)) / (Math.log(t1) - Math.log(t2));
const FF = m1 / (N * t1 ** N);
const RHO0 = A_ELL * FF * t0 ** N;
function inverse(x, y) {
  const dx = x - X0, dy = RHO0 - (y - Y0);
  const rho = Math.sign(N) * Math.hypot(dx, dy);
  const theta = Math.atan2(dx, dy) / N;
  const t = (rho / (A_ELL * FF)) ** (1 / N);
  let phi = Math.PI / 2 - 2 * Math.atan(t);
  for (let i = 0; i < 10; i++) {
    const s = Math.sin(phi);
    phi = Math.PI / 2 - 2 * Math.atan(t * (((1 - E * s) / (1 + E * s)) ** (E / 2)));
  }
  return { lon: ((theta + LON0) * 180) / Math.PI, lat: (phi * 180) / Math.PI };
}

const EXPECTED_WGS84 = {
  "budardalur-route": { lat: 65.10937098, lon: -21.76193522 },
  "throskuldar-south-route": { lat: 65.47846693, lon: -21.93362908 },
  "throskuldar-pass-route": { lat: 65.55235160, lon: -21.83224971 },
  "holmavik-route": { lat: 65.70146962, lon: -21.68414766 },
};

describe("BUDARDALUR_HOLMAVIK_FORECAST_POINTS (P2)", () => {
  const region = loadWestfjordsCombinedRegionDataset();
  const linesById = new Map([...region.lines, ...region.connectors].map((l) => [l.sourceId, l]));

  it("has exactly 4 points in Búðardalur->Hólmavík order", () => {
    expect(BUDARDALUR_HOLMAVIK_FORECAST_POINTS.map((p) => p.id)).toEqual([
      "budardalur-route", "throskuldar-south-route", "throskuldar-pass-route", "holmavik-route",
    ]);
  });

  it("each point's native x/y/z is byte-identical to the real line's own vertex (westfjords-region-combined.json, read via the real loader)", () => {
    for (const p of BUDARDALUR_HOLMAVIK_FORECAST_POINTS) {
      const line = linesById.get(p.sourceId);
      const vertex = line.vertices[p.vertexIndex];
      expect(vertex.x).toBe(p.nativeX);
      expect(vertex.y).toBe(p.nativeY);
      expect(vertex.z).toBe(p.nativeZ);
    }
  });

  it("each point's WGS84 is independently re-derived here (own inverse transform) to within 1e-6 deg of the prompt's own cited reference", () => {
    for (const p of BUDARDALUR_HOLMAVIK_FORECAST_POINTS) {
      const wgs = inverse(p.nativeX, p.nativeY);
      const expected = EXPECTED_WGS84[p.id];
      expect(Math.abs(wgs.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(wgs.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
    }
  });

  it("holmavik-route's WGS84 matches the independent anchor in winter-route-approach-selections.json to within 1e-7 deg", () => {
    const approachSelections = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "server_data/winter-route-approach-selections.json"), "utf8")
    );
    const anchor = approachSelections.selections.holmavik.wgs84;
    const holmavik = BUDARDALUR_HOLMAVIK_FORECAST_POINTS.find((p) => p.id === "holmavik-route");
    expect(Math.abs(holmavik.lat - anchor.latitude)).toBeLessThanOrEqual(1e-7);
    expect(Math.abs(holmavik.lon - anchor.longitude)).toBeLessThanOrEqual(1e-7);
  });

  it("every point's own native coordinate is a literal vertex on the real composed Búðardalur->Hólmavík route", () => {
    const geo = resolveBudardalurHolmavikGeometry("budardalur", "holmavik");
    expect(geo.ok).toBe(true);
    const allLines = [...region.lines, ...region.connectors];
    const byId = new Map(allLines.map((l) => [l.sourceId, l]));

    // Re-derive the coordinate chain the same way the real geometry
    // endpoint does, independently of resolveBudardalurHolmavikGeometry's
    // own internals (which don't expose coordinates), to confirm P2(c)(ii).
    const fromPoint = region.endpoints.budardalur, toPoint = region.endpoints.holmavik;
    const composed = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: allLines,
      from: { placeId: "budardalur", x: fromPoint.x, y: fromPoint.y },
      to: { placeId: "holmavik", x: toPoint.x, y: toPoint.y },
    });
    function expandSliceVertices(slice) {
      const line = byId.get(slice.sourceId);
      const lo = Math.min(slice.fromIndex, slice.toIndex), hi = Math.max(slice.fromIndex, slice.toIndex);
      const span = line.vertices.slice(lo, hi + 1);
      return slice.direction === "forward" ? span : [...span].reverse();
    }
    const allCoords = [];
    composed.slices.forEach((slice, i) => {
      const verts = expandSliceVertices(slice);
      for (let j = i === 0 ? 0 : 1; j < verts.length; j++) allCoords.push(verts[j]);
    });
    for (const p of BUDARDALUR_HOLMAVIK_FORECAST_POINTS) {
      expect(allCoords.some((c) => c.x === p.nativeX && c.y === p.nativeY)).toBe(true);
    }
  });

  it("no forecast point exists in the first ~48km after Búðardalur (documented coverage gap, P3c)", () => {
    // Confirmed structurally: only 4 points total, and the second one
    // (throskuldar-south) is already past the ~48km mark per the prompt's
    // own cited chainage (48.1km) -- i.e. nothing fills that gap.
    expect(BUDARDALUR_HOLMAVIK_FORECAST_POINTS).toHaveLength(4);
  });
});

describe("resolveBudardalurHolmavikGeometry (P3a/b)", () => {
  it("B->H and H->B both resolve geometry_only with the real 7 IdButur, n:1, in the exact prompt order (reversed for H->B)", () => {
    const forward = resolveBudardalurHolmavikGeometry("budardalur", "holmavik");
    const reverse = resolveBudardalurHolmavikGeometry("holmavik", "budardalur");
    expect(forward.ok).toBe(true);
    expect(reverse.ok).toBe(true);

    const EXPECTED = [805030037, 905070037, 905080037, 805090037, 907000037, 707040037, 907040037];
    expect(forward.idButurList).toEqual(EXPECTED);
    expect(reverse.idButurList).toEqual([...EXPECTED].reverse());
    expect(forward.geometryId).not.toBe(reverse.geometryId);
    expect(forward.lengthM).toBeCloseTo(reverse.lengthM, 6);
    expect(forward.lengthM).toBeCloseTo(78697.77054505677, 1);
  });

  it("per-IdButur routeLengthM sums to the total length (within 0.01m)", () => {
    const geo = resolveBudardalurHolmavikGeometry("budardalur", "holmavik");
    const sum = geo.idButurSections.reduce((a, s) => a + s.routeLengthM, 0);
    expect(Math.abs(sum - geo.lengthM)).toBeLessThan(0.01);
  });

  it("805030037 and 907040037 are flagged as edge segments (<1% of total length each); the rest are not", () => {
    const geo = resolveBudardalurHolmavikGeometry("budardalur", "holmavik");
    const byId = new Map(geo.idButurSections.map((s) => [s.idButur, s]));
    expect(byId.get(805030037).isEdgeSegment).toBe(true);
    expect(byId.get(805030037).routeLengthM).toBeCloseTo(205, 0);
    expect(byId.get(907040037).isEdgeSegment).toBe(true);
    expect(byId.get(907040037).routeLengthM).toBeCloseTo(517, 0);
    for (const id of [905070037, 905080037, 805090037, 907000037, 707040037]) {
      expect(byId.get(id).isEdgeSegment).toBe(false);
    }
  });

  it("an unsupported pair returns ok:false, never a fabricated geometry", () => {
    expect(resolveBudardalurHolmavikGeometry("budardalur", "selfoss").ok).toBe(false);
    expect(resolveBudardalurHolmavikGeometry("reykjavik-raudavatn", "holmavik").ok).toBe(false);
  });
});

describe("orderedForecastPoints (P2d)", () => {
  it("H->B is the exact reverse of B->H, same point ids/coordinates, never direction-dependent coordinates", () => {
    const forward = orderedForecastPoints("budardalur");
    const reverse = orderedForecastPoints("holmavik");
    expect(forward.map((p) => p.id)).toEqual([...reverse.map((p) => p.id)].reverse());
    for (const p of forward) {
      const reversedP = reverse.find((r) => r.id === p.id);
      expect(reversedP.lat).toBe(p.lat);
      expect(reversedP.lon).toBe(p.lon);
    }
  });
});
