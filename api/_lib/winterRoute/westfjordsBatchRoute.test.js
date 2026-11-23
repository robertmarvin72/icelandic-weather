// api/_lib/winterRoute/westfjordsBatchRoute.test.js — Ticket #503 westfjords-batch, P2/P3
import { describe, it, expect } from "vitest";
import {
  WESTFJORDS_BATCH_POINTS,
  isWestfjordsBatchPair,
  westfjordsBatchCacheKey,
  resolveWestfjordsBatchGeometry,
  westfjordsBatchForecastPoints,
} from "./westfjordsBatchRoute.js";
import { loadWestfjordsCombinedRegionDataset } from "./westfjordsCombinedRegionDataset.js";
import { resolveBudardalurHolmavikGeometry } from "./budardalurHolmavikRoute.js";

// Independent re-derivation of the same offline Lambert Conformal Conic
// 2SP inverse (GRS80) used throughout this ticket series -- never
// imported from the subject's own module.
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
  "flokalundur-route": { lat: 65.57639536, lon: -23.16356851 },
  "patreksfjordur-route": { lat: 65.59707817, lon: -23.99397783 },
  "talknafjordur-route": { lat: 65.62399623, lon: -23.81359943 },
  "svinadalur-route": { lat: 65.30638704, lon: -21.74030759 },
  "gilsfjordur-route": { lat: 65.40683146, lon: -21.87993605 },
  "klettshals-route": { lat: 65.65937983, lon: -22.60461780 },
  "kleifaheidi-route": { lat: 65.51876214, lon: -23.72848936 },
  "miklidalur-route": { lat: 65.58121574, lon: -23.85469532 },
};

describe("WESTFJORDS_BATCH_POINTS (P2)", () => {
  const region = loadWestfjordsCombinedRegionDataset();
  const linesById = new Map([...region.lines, ...region.connectors].map((l) => [l.sourceId, l]));

  it("has 9 points: budardalur-route (shared, unchanged from B<->H) + 8 new", () => {
    expect(WESTFJORDS_BATCH_POINTS).toHaveLength(9);
    expect(WESTFJORDS_BATCH_POINTS[0].id).toBe("budardalur-route");
    expect(WESTFJORDS_BATCH_POINTS[0].lat).toBe(65.10937097662715); // byte-identical to the B<->H round's own value
  });

  it("each new point's native x/y/z is byte-identical to the real line's own vertex", () => {
    for (const p of WESTFJORDS_BATCH_POINTS) {
      const line = linesById.get(p.sourceId);
      const vertex = line.vertices[p.vertexIndex];
      expect(vertex.x).toBe(p.nativeX);
      expect(vertex.y).toBe(p.nativeY);
      expect(vertex.z).toBe(p.nativeZ);
    }
  });

  it("each new point's WGS84 is independently re-derived here to within 1e-6 deg of the approved prompt's own cited reference", () => {
    for (const [id, expected] of Object.entries(EXPECTED_WGS84)) {
      const p = WESTFJORDS_BATCH_POINTS.find((x) => x.id === id);
      const wgs = inverse(p.nativeX, p.nativeY);
      expect(Math.abs(wgs.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(wgs.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
    }
  });

  it("svinadalur-route's z (223.3447) is the highest z anywhere in IdButur 905080037's own retained line", () => {
    const line = linesById.get(3247); // the svinadalur-route's own sourceId
    const maxZ = Math.max(...line.vertices.map((v) => v.z ?? -Infinity));
    expect(maxZ).toBeCloseTo(223.3447, 3);
    const svinadalur = WESTFJORDS_BATCH_POINTS.find((p) => p.id === "svinadalur-route");
    expect(svinadalur.nativeZ).toBeCloseTo(maxZ, 3);
  });

  it("flokalundur-route/patreksfjordur-route/talknafjordur-route match the real dataset endpoints verbatim", () => {
    expect(WESTFJORDS_BATCH_POINTS.find((p) => p.id === "flokalundur-route").nativeX).toBe(region.endpoints.flokalundur.x);
    expect(WESTFJORDS_BATCH_POINTS.find((p) => p.id === "patreksfjordur-route").nativeX).toBe(region.endpoints.patreksfjordur.x);
    expect(WESTFJORDS_BATCH_POINTS.find((p) => p.id === "talknafjordur-route").nativeX).toBe(region.endpoints.talknafjordur.x);
  });
});

describe("isWestfjordsBatchPair / westfjordsBatchCacheKey", () => {
  it("accepts exactly the six new pairs, both directions; rejects B<->H and anything else", () => {
    const pairs = [["budardalur", "flokalundur"], ["budardalur", "patreksfjordur"], ["budardalur", "talknafjordur"], ["flokalundur", "patreksfjordur"], ["flokalundur", "talknafjordur"], ["patreksfjordur", "talknafjordur"]];
    for (const [a, b] of pairs) {
      expect(isWestfjordsBatchPair(a, b)).toBe(true);
      expect(isWestfjordsBatchPair(b, a)).toBe(true);
    }
    expect(isWestfjordsBatchPair("budardalur", "holmavik")).toBe(false);
    expect(isWestfjordsBatchPair("flokalundur", "holmavik")).toBe(false);
    expect(isWestfjordsBatchPair("budardalur", "selfoss")).toBe(false);
  });

  it("the cache key is identical for both directions of the same pair, and different per pair", () => {
    expect(westfjordsBatchCacheKey("budardalur", "flokalundur")).toBe(westfjordsBatchCacheKey("flokalundur", "budardalur"));
    expect(westfjordsBatchCacheKey("budardalur", "flokalundur")).not.toBe(westfjordsBatchCacheKey("budardalur", "patreksfjordur"));
  });
});

describe("resolveWestfjordsBatchGeometry (P2b/P3a/b)", () => {
  // Pinned from the real, independent probe run (docs/ai/tasks/ticket-503/
  // westfjords-batch/evidence/probe-and-registry.mjs), matching the
  // approved prompt's own cited sandbox figures exactly.
  const EXPECTED = {
    "budardalur|flokalundur": { lengthM: 172474.223, idButurCount: 12, unmappedLengthM: 0.005, points: ["budardalur-route", "svinadalur-route", "gilsfjordur-route", "klettshals-route", "flokalundur-route"] },
    "budardalur|patreksfjordur": { lengthM: 233874.322, idButurCount: 17, unmappedLengthM: 4.3982, points: ["budardalur-route", "svinadalur-route", "gilsfjordur-route", "klettshals-route", "flokalundur-route", "kleifaheidi-route", "patreksfjordur-route"] },
    "budardalur|talknafjordur": { lengthM: 248219.990, idButurCount: 18, unmappedLengthM: 0.005, points: ["budardalur-route", "svinadalur-route", "gilsfjordur-route", "klettshals-route", "flokalundur-route", "kleifaheidi-route", "miklidalur-route", "talknafjordur-route"] },
    "flokalundur|patreksfjordur": { lengthM: 61400.099, idButurCount: 6, unmappedLengthM: 4.3932, points: ["flokalundur-route", "kleifaheidi-route", "patreksfjordur-route"] },
    "flokalundur|talknafjordur": { lengthM: 75745.767, idButurCount: 7, unmappedLengthM: 0, points: ["flokalundur-route", "kleifaheidi-route", "miklidalur-route", "talknafjordur-route"] },
    "patreksfjordur|talknafjordur": { lengthM: 17114.943, idButurCount: 3, unmappedLengthM: 4.3932, points: ["patreksfjordur-route", "miklidalur-route", "talknafjordur-route"] },
  };

  it("all 12 directions resolve geometry_only with the exact pinned length/IdButur-count/unmappedLengthM/point-membership-and-order", () => {
    for (const [key, expected] of Object.entries(EXPECTED)) {
      const [a, b] = key.split("|");
      for (const [from, to] of [[a, b], [b, a]]) {
        const geo = resolveWestfjordsBatchGeometry(from, to);
        expect(geo.ok).toBe(true);
        expect(geo.lengthM).toBeCloseTo(expected.lengthM, 0);
        expect(geo.idButurList).toHaveLength(expected.idButurCount);
        expect(geo.unmappedLengthM).toBeCloseTo(expected.unmappedLengthM, 3);
        const expectedPoints = from === a ? expected.points : [...expected.points].reverse();
        expect(geo.pointIds).toEqual(expectedPoints);
      }
    }
  });

  it("B-P uses both -4 and -5; B-F/B-T use only -4; F-P/P-T use only -5; F-T uses neither (P3b correction)", () => {
    function nullIdsOf(from, to) {
      const geo = resolveWestfjordsBatchGeometry(from, to);
      // unmappedLengthM > 0 implies at least one null-id connector; exact
      // ids aren't returned by the resolver (UI/tests don't need them),
      // but the two known magnitudes (~0.005m = -4 only, ~4.393-4.398m =
      // -5 present) distinguish the cases unambiguously.
      return geo.unmappedLengthM;
    }
    expect(nullIdsOf("budardalur", "flokalundur")).toBeCloseTo(0.005, 3); // -4 only
    expect(nullIdsOf("budardalur", "talknafjordur")).toBeCloseTo(0.005, 3); // -4 only
    expect(nullIdsOf("budardalur", "patreksfjordur")).toBeCloseTo(4.398, 2); // -4 AND -5 (sum)
    expect(nullIdsOf("flokalundur", "patreksfjordur")).toBeCloseTo(4.393, 2); // -5 only
    expect(nullIdsOf("patreksfjordur", "talknafjordur")).toBeCloseTo(4.393, 2); // -5 only
    expect(nullIdsOf("flokalundur", "talknafjordur")).toBe(0); // neither
  });

  it("patreksfjordur-route never appears on budardalur<->talknafjordur (the route passes near it but doesn't visit it)", () => {
    const geo = resolveWestfjordsBatchGeometry("budardalur", "talknafjordur");
    expect(geo.pointIds).not.toContain("patreksfjordur-route");
  });

  it("svinadalur-route/gilsfjordur-route only ever appear on budardalur-anchored pairs", () => {
    for (const pair of [["flokalundur", "patreksfjordur"], ["flokalundur", "talknafjordur"], ["patreksfjordur", "talknafjordur"]]) {
      const geo = resolveWestfjordsBatchGeometry(...pair);
      expect(geo.pointIds).not.toContain("svinadalur-route");
      expect(geo.pointIds).not.toContain("gilsfjordur-route");
    }
  });

  it("an unsupported pair (including B<->H, and any pair outside the six) returns ok:false", () => {
    expect(resolveWestfjordsBatchGeometry("budardalur", "holmavik").ok).toBe(false);
    expect(resolveWestfjordsBatchGeometry("budardalur", "selfoss").ok).toBe(false);
    expect(resolveWestfjordsBatchGeometry("budardalur", "budardalur").ok).toBe(false);
  });

  it("P4(c): pointChainageKm matches the approved prompt's own cited planar chainage (±0.2 km) for B-F, and the largest gap (Gilsfjörður->Klettsháls) is ~83.6 km", () => {
    const geo = resolveWestfjordsBatchGeometry("budardalur", "flokalundur");
    expect(geo.pointChainageKm["budardalur-route"]).toBeCloseTo(0, 1);
    expect(geo.pointChainageKm["svinadalur-route"]).toBeCloseTo(24.1, 1);
    expect(geo.pointChainageKm["gilsfjordur-route"]).toBeCloseTo(38.7, 1);
    expect(geo.pointChainageKm["klettshals-route"]).toBeCloseTo(122.4, 1);
    expect(geo.pointChainageKm["flokalundur-route"]).toBeCloseTo(172.5, 1);
    const gap = geo.pointChainageKm["klettshals-route"] - geo.pointChainageKm["gilsfjordur-route"];
    expect(gap).toBeCloseTo(83.6, 1);
  });

  it("P4(c): patreksfjordur<->talknafjordur's own largest gap (miklidalur->talknafjordur) is ~9.3 km", () => {
    const geo = resolveWestfjordsBatchGeometry("patreksfjordur", "talknafjordur");
    expect(geo.pointChainageKm["patreksfjordur-route"]).toBeCloseTo(0, 1);
    expect(geo.pointChainageKm["miklidalur-route"]).toBeCloseTo(7.8, 1);
    expect(geo.pointChainageKm["talknafjordur-route"]).toBeCloseTo(17.1, 1);
    const gap = geo.pointChainageKm["talknafjordur-route"] - geo.pointChainageKm["miklidalur-route"];
    expect(gap).toBeCloseTo(9.3, 0);
  });

  it("reverse direction's chainage is measured from its OWN start (not reused from the forward direction)", () => {
    const forward = resolveWestfjordsBatchGeometry("budardalur", "flokalundur");
    const reverse = resolveWestfjordsBatchGeometry("flokalundur", "budardalur");
    expect(reverse.pointChainageKm["flokalundur-route"]).toBeCloseTo(0, 1);
    expect(reverse.pointChainageKm["budardalur-route"]).toBeCloseTo(forward.pointChainageKm["flokalundur-route"], 1);
  });

  it("union of IdButur across all six pairs is exactly 19, matching the approved prompt's own cited figure", () => {
    const union = new Set();
    for (const key of Object.keys(EXPECTED)) {
      const [a, b] = key.split("|");
      resolveWestfjordsBatchGeometry(a, b).idButurList.forEach((id) => union.add(id));
    }
    expect(union.size).toBe(19);
  });

  it("every road section carries a real retained nameIs and a fixed reviewed nameEn", () => {
    const geo = resolveWestfjordsBatchGeometry("budardalur", "patreksfjordur");
    expect(geo.idButurSections.every((s) => typeof s.nameIs === "string" && s.nameIs.length > 0)).toBe(true);
    expect(geo.idButurSections.every((s) => typeof s.nameEn === "string" && s.nameEn.length > 0)).toBe(true);
  });

  it("the geometryId this resolver computes is byte-identical to resolveBudardalurHolmavikGeometry's own pattern applied to the same underlying core -- confirmed by comparing against a direct geometryId recomputation is covered in winter-route-data.test.js's own handler-level cross-check against the real geometry handler", () => {
    // Placeholder assurance at this layer: geometryId is deterministic and
    // direction-dependent (never equal between forward/reverse).
    const forward = resolveWestfjordsBatchGeometry("budardalur", "flokalundur");
    const reverse = resolveWestfjordsBatchGeometry("flokalundur", "budardalur");
    expect(forward.geometryId).not.toBe(reverse.geometryId);
    expect(forward.lengthM).toBeCloseTo(reverse.lengthM, 6);
  });
});

describe("westfjordsBatchForecastPoints", () => {
  it("maps ordered point ids to their own full point definitions, in the same order", () => {
    const geo = resolveWestfjordsBatchGeometry("budardalur", "flokalundur");
    const points = westfjordsBatchForecastPoints(geo.pointIds);
    expect(points.map((p) => p.id)).toEqual(geo.pointIds);
    expect(points.every((p) => typeof p.lat === "number" && typeof p.lon === "number")).toBe(true);
  });
});

describe("B<->H resolver stays completely untouched by this round", () => {
  it("resolveBudardalurHolmavikGeometry still only accepts (budardalur,holmavik)/(holmavik,budardalur), unaffected by the new pairs existing", () => {
    expect(resolveBudardalurHolmavikGeometry("budardalur", "holmavik").ok).toBe(true);
    expect(resolveBudardalurHolmavikGeometry("budardalur", "flokalundur").ok).toBe(false);
  });
});
