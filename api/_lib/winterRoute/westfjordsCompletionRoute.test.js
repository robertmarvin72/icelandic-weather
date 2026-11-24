// api/_lib/winterRoute/westfjordsCompletionRoute.test.js — Ticket #503
// westfjords-completion, P2/P3
import { describe, it, expect } from "vitest";
import {
  WESTFJORDS_COMPLETION_POINTS,
  WESTFJORDS_COMPLETION_NEW_POINTS,
  isWestfjordsCompletionPair,
  westfjordsCompletionCacheKey,
  resolveWestfjordsCompletionGeometry,
  westfjordsCompletionForecastPoints,
} from "./westfjordsCompletionRoute.js";
import { loadWestfjordsCombinedRegionDataset } from "./westfjordsCombinedRegionDataset.js";
import { resolveBudardalurHolmavikGeometry } from "./budardalurHolmavikRoute.js";
import { resolveWestfjordsBatchGeometry, isWestfjordsBatchPair } from "./westfjordsBatchRoute.js";

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

// P2(B) decision: sudavikurhlid-route = 3535v0, not 3392v2.
const EXPECTED_WGS84 = {
  "isafjordur-route": { lat: 66.07499186, lon: -23.12369279 },
  "dynjandisheidi-route": { lat: 65.65161252, lon: -23.2584075 },
  "gemlufallsheidi-route": { lat: 65.99851778, lon: -23.41778318 },
  "sudavikurhlid-route": { lat: 66.02459271, lon: -22.9922543 },
  "vatnsfjardarhals-route": { lat: 65.92586622, lon: -22.52468975 },
  "steingrimsfjardarheidi-route": { lat: 65.74993838, lon: -22.12307405 },
};

describe("WESTFJORDS_COMPLETION_POINTS (P2)", () => {
  const region = loadWestfjordsCombinedRegionDataset();
  const linesById = new Map([...region.lines, ...region.connectors].map((l) => [l.sourceId, l]));

  it("has 18 union points: 12 reused unchanged (B<->H's 4 + batch's 9, budardalur shared) + 6 new", () => {
    expect(WESTFJORDS_COMPLETION_POINTS).toHaveLength(18);
    expect(WESTFJORDS_COMPLETION_NEW_POINTS).toHaveLength(6);
    const ids = WESTFJORDS_COMPLETION_POINTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(18); // no accidental duplicate
    expect(ids).toContain("budardalur-route");
    expect(ids).toContain("throskuldar-south-route");
    expect(ids).toContain("holmavik-route");
    expect(ids).toContain("flokalundur-route");
  });

  it("budardalur-route is byte-identical to the B<->H round's own value (never redrawn)", () => {
    const p = WESTFJORDS_COMPLETION_POINTS.find((x) => x.id === "budardalur-route");
    expect(p.lat).toBe(65.10937097662715);
  });

  it("each new point's native x/y/z is byte-identical to the real line's own vertex", () => {
    for (const p of WESTFJORDS_COMPLETION_NEW_POINTS) {
      const line = linesById.get(p.sourceId);
      const vertex = line.vertices[p.vertexIndex];
      expect(vertex.x).toBe(p.nativeX);
      expect(vertex.y).toBe(p.nativeY);
      expect(vertex.z).toBe(p.nativeZ);
    }
  });

  it("each new point's WGS84 is independently re-derived here to within 1e-6 deg of Jonesy's own cited reference", () => {
    for (const [id, expected] of Object.entries(EXPECTED_WGS84)) {
      const p = WESTFJORDS_COMPLETION_NEW_POINTS.find((x) => x.id === id);
      const wgs = inverse(p.nativeX, p.nativeY);
      expect(Math.abs(wgs.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(wgs.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
    }
  });

  it("isafjordur-route IS region.endpoints.isafjordur (the real route endpoint, not a town-centre guess)", () => {
    const p = WESTFJORDS_COMPLETION_NEW_POINTS.find((x) => x.id === "isafjordur-route");
    expect(p.nativeX).toBe(region.endpoints.isafjordur.x);
    expect(p.nativeY).toBe(region.endpoints.isafjordur.y);
  });

  it("dynjandisheidi/vatnsfjardarhals/steingrimsfjardarheidi each carry their own line's highest z", () => {
    for (const id of ["dynjandisheidi-route", "vatnsfjardarhals-route", "steingrimsfjardarheidi-route"]) {
      const p = WESTFJORDS_COMPLETION_NEW_POINTS.find((x) => x.id === id);
      const line = linesById.get(p.sourceId);
      const maxZ = Math.max(...line.vertices.map((v) => v.z ?? -Infinity));
      expect(p.nativeZ).toBeCloseTo(maxZ, 3);
    }
  });

  it("gemlufallsheidi-route does NOT carry its own line's highest z (2.8441 < 19.63) -- it is only a retained mid-point, never a mountain-top claim", () => {
    const p = WESTFJORDS_COMPLETION_NEW_POINTS.find((x) => x.id === "gemlufallsheidi-route");
    const line = linesById.get(p.sourceId);
    const maxZ = Math.max(...line.vertices.map((v) => v.z ?? -Infinity));
    expect(p.nativeZ).toBeLessThan(maxZ);
    expect(maxZ).toBeCloseTo(19.63, 1);
  });
});

describe("isWestfjordsCompletionPair / westfjordsCompletionCacheKey", () => {
  const PAIRS = [
    ["budardalur", "isafjordur"], ["flokalundur", "isafjordur"], ["isafjordur", "holmavik"],
    ["isafjordur", "patreksfjordur"], ["isafjordur", "talknafjordur"], ["flokalundur", "holmavik"],
    ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"],
  ];

  it("accepts exactly the eight new pairs, both directions; rejects B<->H, the six batch pairs, and anything else", () => {
    for (const [a, b] of PAIRS) {
      expect(isWestfjordsCompletionPair(a, b)).toBe(true);
      expect(isWestfjordsCompletionPair(b, a)).toBe(true);
    }
    expect(isWestfjordsCompletionPair("budardalur", "holmavik")).toBe(false);
    expect(isWestfjordsCompletionPair("budardalur", "flokalundur")).toBe(false);
    expect(isWestfjordsCompletionPair("isafjordur", "isafjordur")).toBe(false);
    expect(isWestfjordsCompletionPair("budardalur", "selfoss")).toBe(false);
  });

  it("the cache key is identical for both directions of the same pair, different per pair, and disjoint from the batch module's own keys", () => {
    expect(westfjordsCompletionCacheKey("budardalur", "isafjordur")).toBe(westfjordsCompletionCacheKey("isafjordur", "budardalur"));
    expect(westfjordsCompletionCacheKey("budardalur", "isafjordur")).not.toBe(westfjordsCompletionCacheKey("isafjordur", "holmavik"));
  });
});

describe("resolveWestfjordsCompletionGeometry (P2b/P3a/b)", () => {
  // Pinned from the real, independent probe run
  // (docs/ai/tasks/ticket-503/westfjords-completion/evidence/probe-and-registry.mjs),
  // matching both Jonesy's own cited sandbox figures and the pre-existing
  // read-only evidence/offline-matrix.json exactly.
  const EXPECTED = {
    "budardalur|isafjordur": { lengthM: 260092.771, idButurCount: 24, unmappedLengthM: 0.005, points: ["budardalur-route", "svinadalur-route", "gilsfjordur-route", "klettshals-route", "flokalundur-route", "dynjandisheidi-route", "gemlufallsheidi-route", "isafjordur-route"] },
    "flokalundur|isafjordur": { lengthM: 87618.548, idButurCount: 13, unmappedLengthM: 0, points: ["flokalundur-route", "dynjandisheidi-route", "gemlufallsheidi-route", "isafjordur-route"] },
    "isafjordur|holmavik": { lengthM: 223136.989, idButurCount: 9, unmappedLengthM: 0, points: ["isafjordur-route", "sudavikurhlid-route", "vatnsfjardarhals-route", "steingrimsfjardarheidi-route", "holmavik-route"] },
    "isafjordur|patreksfjordur": { lengthM: 148325.102, idButurCount: 17, unmappedLengthM: 4.3932, points: ["isafjordur-route", "gemlufallsheidi-route", "dynjandisheidi-route", "kleifaheidi-route", "patreksfjordur-route"] },
    "isafjordur|talknafjordur": { lengthM: 162670.769, idButurCount: 18, unmappedLengthM: 0, points: ["isafjordur-route", "gemlufallsheidi-route", "dynjandisheidi-route", "kleifaheidi-route", "miklidalur-route", "talknafjordur-route"] },
    "flokalundur|holmavik": { lengthM: 154887.083, idButurCount: 11, unmappedLengthM: 0.005, points: ["flokalundur-route", "klettshals-route", "throskuldar-south-route", "throskuldar-pass-route", "holmavik-route"] },
    "holmavik|patreksfjordur": { lengthM: 216287.182, idButurCount: 16, unmappedLengthM: 4.3982, points: ["holmavik-route", "throskuldar-pass-route", "throskuldar-south-route", "klettshals-route", "flokalundur-route", "kleifaheidi-route", "patreksfjordur-route"] },
    "holmavik|talknafjordur": { lengthM: 230632.850, idButurCount: 17, unmappedLengthM: 0.005, points: ["holmavik-route", "throskuldar-pass-route", "throskuldar-south-route", "klettshals-route", "flokalundur-route", "kleifaheidi-route", "miklidalur-route", "talknafjordur-route"] },
  };

  it("all 16 directions resolve geometry_only with the exact pinned length/IdButur-count/unmappedLengthM/point-membership-and-order (8/4/5/5/6/5/7/8 points)", () => {
    const expectedCounts = [8, 4, 5, 5, 6, 5, 7, 8];
    Object.values(EXPECTED).forEach((e, i) => expect(e.points).toHaveLength(expectedCounts[i]));
    for (const [key, expected] of Object.entries(EXPECTED)) {
      const [a, b] = key.split("|");
      for (const [from, to] of [[a, b], [b, a]]) {
        const geo = resolveWestfjordsCompletionGeometry(from, to);
        expect(geo.ok).toBe(true);
        expect(geo.lengthM).toBeCloseTo(expected.lengthM, 0);
        expect(geo.idButurList).toHaveLength(expected.idButurCount);
        expect(geo.unmappedLengthM).toBeCloseTo(expected.unmappedLengthM, 3);
        const expectedPoints = from === a ? expected.points : [...expected.points].reverse();
        expect(geo.pointIds).toEqual(expectedPoints);
      }
    }
  });

  it("P3(a) ghost-point guard: throskuldar-south-route/throskuldar-pass-route NEVER appear on budardalur<->isafjordur, flokalundur<->isafjordur, isafjordur<->holmavik, isafjordur<->patreksfjordur, or isafjordur<->talknafjordur (no real 907000037 section there)", () => {
    for (const [a, b] of [["budardalur", "isafjordur"], ["flokalundur", "isafjordur"], ["isafjordur", "holmavik"], ["isafjordur", "patreksfjordur"], ["isafjordur", "talknafjordur"]]) {
      const geo = resolveWestfjordsCompletionGeometry(a, b);
      expect(geo.idButurList).not.toContain(907000037);
      expect(geo.pointIds).not.toContain("throskuldar-south-route");
      expect(geo.pointIds).not.toContain("throskuldar-pass-route");
    }
  });

  it("throskuldar-south-route/throskuldar-pass-route DO appear on flokalundur<->holmavik, holmavik<->patreksfjordur, holmavik<->talknafjordur (real 907000037 section present)", () => {
    for (const [a, b] of [["flokalundur", "holmavik"], ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"]]) {
      const geo = resolveWestfjordsCompletionGeometry(a, b);
      expect(geo.idButurList).toContain(907000037);
      expect(geo.pointIds).toContain("throskuldar-south-route");
      expect(geo.pointIds).toContain("throskuldar-pass-route");
    }
  });

  it("isafjordur-route/gemlufallsheidi-route/dynjandisheidi-route never appear on flokalundur<->holmavik/holmavik<->patreksfjordur/holmavik<->talknafjordur (wrong side of the region)", () => {
    for (const [a, b] of [["flokalundur", "holmavik"], ["holmavik", "patreksfjordur"], ["holmavik", "talknafjordur"]]) {
      const geo = resolveWestfjordsCompletionGeometry(a, b);
      expect(geo.pointIds).not.toContain("isafjordur-route");
      expect(geo.pointIds).not.toContain("gemlufallsheidi-route");
      expect(geo.pointIds).not.toContain("dynjandisheidi-route");
    }
  });

  it("an unsupported pair (same-place, B<->H, a batch pair, and any other pair) returns ok:false", () => {
    expect(resolveWestfjordsCompletionGeometry("isafjordur", "isafjordur").ok).toBe(false);
    expect(resolveWestfjordsCompletionGeometry("budardalur", "holmavik").ok).toBe(false);
    expect(resolveWestfjordsCompletionGeometry("budardalur", "flokalundur").ok).toBe(false);
    expect(resolveWestfjordsCompletionGeometry("budardalur", "selfoss").ok).toBe(false);
  });

  it("P4(c)/P5(a): isafjordur<->holmavik's own largest gap (sudavikurhlid->vatnsfjardarhals, P2(B)) is ~106.3 km", () => {
    const geo = resolveWestfjordsCompletionGeometry("isafjordur", "holmavik");
    expect(geo.pointChainageKm["isafjordur-route"]).toBeCloseTo(0, 1);
    expect(geo.pointChainageKm["sudavikurhlid-route"]).toBeCloseTo(21.3, 1);
    expect(geo.pointChainageKm["vatnsfjardarhals-route"]).toBeCloseTo(127.6, 1);
    expect(geo.pointChainageKm["steingrimsfjardarheidi-route"]).toBeCloseTo(195.9, 1);
    expect(geo.pointChainageKm["holmavik-route"]).toBeCloseTo(223.1, 1);
    const gap = geo.pointChainageKm["vatnsfjardarhals-route"] - geo.pointChainageKm["sudavikurhlid-route"];
    expect(gap).toBeCloseTo(106.3, 0);
  });

  it("P4(c): budardalur<->isafjordur's own largest gap (gilsfjordur->klettshals) is ~83.6 km (unaffected by the longer route continuing past flokalundur)", () => {
    const geo = resolveWestfjordsCompletionGeometry("budardalur", "isafjordur");
    const gap = geo.pointChainageKm["klettshals-route"] - geo.pointChainageKm["gilsfjordur-route"];
    expect(gap).toBeCloseTo(83.6, 1);
  });

  it("reverse direction's chainage is measured from its OWN start (not reused from the forward direction)", () => {
    const forward = resolveWestfjordsCompletionGeometry("isafjordur", "holmavik");
    const reverse = resolveWestfjordsCompletionGeometry("holmavik", "isafjordur");
    expect(reverse.pointChainageKm["holmavik-route"]).toBeCloseTo(0, 1);
    expect(reverse.pointChainageKm["isafjordur-route"]).toBeCloseTo(forward.pointChainageKm["holmavik-route"], 1);
  });

  it("union of IdButur across all eight pairs is exactly 41, matching Jonesy's own cited figure", () => {
    const union = new Set();
    for (const key of Object.keys(EXPECTED)) {
      const [a, b] = key.split("|");
      resolveWestfjordsCompletionGeometry(a, b).idButurList.forEach((id) => union.add(id));
    }
    expect(union.size).toBe(41);
  });

  it("every road section carries a real retained nameIs and a fixed reviewed nameEn (Flugvöllur -> Airport, Djúpvegur: Ísafjörður unchanged)", () => {
    const geo = resolveWestfjordsCompletionGeometry("isafjordur", "holmavik");
    expect(geo.idButurSections.every((s) => typeof s.nameIs === "string" && s.nameIs.length > 0)).toBe(true);
    expect(geo.idButurSections.every((s) => typeof s.nameEn === "string" && s.nameEn.length > 0)).toBe(true);

    const biGeo = resolveWestfjordsCompletionGeometry("budardalur", "isafjordur");
    const airportSection = biGeo.idButurSections.find((s) => s.nameIs === "Flugvöllur-Ísafjörður");
    expect(airportSection.nameEn).toBe("Airport–Ísafjörður");

    const ihGeo = resolveWestfjordsCompletionGeometry("isafjordur", "holmavik");
    const djupvegurSection = ihGeo.idButurSections.find((s) => s.nameIs === "Djúpvegur: Ísafjörður");
    expect(djupvegurSection.nameEn).toBe("Djúpvegur: Ísafjörður");
  });

  it("geometryId is deterministic and direction-dependent (never equal between forward/reverse)", () => {
    const forward = resolveWestfjordsCompletionGeometry("budardalur", "isafjordur");
    const reverse = resolveWestfjordsCompletionGeometry("isafjordur", "budardalur");
    expect(forward.geometryId).not.toBe(reverse.geometryId);
    expect(forward.lengthM).toBeCloseTo(reverse.lengthM, 6);
  });
});

describe("westfjordsCompletionForecastPoints", () => {
  it("maps ordered point ids to their own full point definitions, in the same order", () => {
    const geo = resolveWestfjordsCompletionGeometry("isafjordur", "holmavik");
    const points = westfjordsCompletionForecastPoints(geo.pointIds);
    expect(points.map((p) => p.id)).toEqual(geo.pointIds);
    expect(points.every((p) => typeof p.lat === "number" && typeof p.lon === "number")).toBe(true);
  });
});

describe("the other two modules' own pairs/resolvers stay completely untouched by this round (P3b golden check)", () => {
  it("resolveBudardalurHolmavikGeometry still only accepts (budardalur,holmavik)/(holmavik,budardalur)", () => {
    expect(resolveBudardalurHolmavikGeometry("budardalur", "holmavik").ok).toBe(true);
    expect(resolveBudardalurHolmavikGeometry("budardalur", "isafjordur").ok).toBe(false);
  });

  it("the six westfjords-batch pairs keep their own pinned pointIds/lengthM/unmappedLengthM unchanged", () => {
    const EXPECTED_BATCH = {
      "budardalur|flokalundur": { lengthM: 172474.223, points: ["budardalur-route", "svinadalur-route", "gilsfjordur-route", "klettshals-route", "flokalundur-route"] },
      "patreksfjordur|talknafjordur": { lengthM: 17114.943, points: ["patreksfjordur-route", "miklidalur-route", "talknafjordur-route"] },
    };
    for (const [key, expected] of Object.entries(EXPECTED_BATCH)) {
      const [a, b] = key.split("|");
      const geo = resolveWestfjordsBatchGeometry(a, b);
      expect(geo.ok).toBe(true);
      expect(geo.lengthM).toBeCloseTo(expected.lengthM, 0);
      expect(geo.pointIds).toEqual(expected.points);
    }
    expect(isWestfjordsBatchPair("isafjordur", "holmavik")).toBe(false);
  });
});
