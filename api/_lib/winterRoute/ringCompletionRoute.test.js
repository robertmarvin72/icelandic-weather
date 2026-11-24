// api/_lib/winterRoute/ringCompletionRoute.test.js — Ticket #503
// ring-completion, P1/P2/P5
import { describe, it, expect } from "vitest";
import {
  RING_COMPLETION_NEW_POINTS,
  isRingCompletionPair,
  ringCompletionCacheKey,
  resolveRingCompletionGeometry,
  ringCompletionForecastPoints,
} from "./ringCompletionRoute.js";
import { RING_OPTION_POINTS, resolveRingOptionGeometry } from "./ringOptionsRoute.js";
import { loadGeometryDataset } from "./geometryDataset.js";

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
  "egilsstadir-route": { lat: 65.25861762, lon: -14.39028964 },
  "seydisfjordur-route": { lat: 65.26021786, lon: -14.00953135 },
  "fjardarheidi-route": { lat: 65.25950964, lon: -14.2254024 },
};

describe("RING_COMPLETION_NEW_POINTS (P1)", () => {
  const dataset = loadGeometryDataset();
  const linesById = new Map(dataset.lines.map((l) => [l.sourceId, l]));

  it("has exactly 3 new points", () => {
    expect(RING_COMPLETION_NEW_POINTS).toHaveLength(3);
  });

  it("each new point's native x/y/z is byte-identical to the real line's own vertex", () => {
    for (const p of RING_COMPLETION_NEW_POINTS) {
      const line = linesById.get(p.sourceId);
      const vertex = line.vertices[p.vertexIndex];
      expect(vertex.x).toBe(p.nativeX);
      expect(vertex.y).toBe(p.nativeY);
      expect(vertex.z).toBe(p.nativeZ);
    }
  });

  it("each new point's WGS84 is independently re-derived here to within 1e-6 deg of Jonesy's own cited reference", () => {
    for (const [id, expected] of Object.entries(EXPECTED_WGS84)) {
      const p = RING_COMPLETION_NEW_POINTS.find((x) => x.id === id);
      const wgs = inverse(p.nativeX, p.nativeY);
      expect(Math.abs(wgs.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(wgs.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
    }
  });

  it("egilsstadir-route/seydisfjordur-route ARE the real dataset endpoints, not a free-standing town-centre guess", () => {
    const dataset2 = loadGeometryDataset();
    const e = RING_COMPLETION_NEW_POINTS.find((p) => p.id === "egilsstadir-route");
    const s = RING_COMPLETION_NEW_POINTS.find((p) => p.id === "seydisfjordur-route");
    expect(e.nativeX).toBe(dataset2.endpoints.egilsstadir.x);
    expect(e.nativeY).toBe(dataset2.endpoints.egilsstadir.y);
    expect(s.nativeX).toBe(dataset2.endpoints.seydisfjordur.x);
    expect(s.nativeY).toBe(dataset2.endpoints.seydisfjordur.y);
  });

  it("fjardarheidi-route carries the highest z among the named Fjarðarheiði lines (615.77, not a confirmed official mountain height)", () => {
    const p = RING_COMPLETION_NEW_POINTS.find((x) => x.id === "fjardarheidi-route");
    expect(p.nativeZ).toBeCloseTo(615.7701, 2);
    const named = dataset.lines.filter((l) => l.name?.includes("Fjarðarheiði"));
    const maxZ = Math.max(...named.flatMap((l) => l.vertices.map((v) => v.z ?? -Infinity)));
    expect(p.nativeZ).toBeCloseTo(maxZ, 2);
  });

  it("no new point's labelIs contains 'göng' (P3(a) tunnel-free naming)", () => {
    for (const p of RING_COMPLETION_NEW_POINTS) {
      expect(p.labelIs).not.toMatch(/göng/i);
    }
  });

  it("the 30 pre-existing ring-option points are completely unchanged (golden)", () => {
    expect(RING_OPTION_POINTS).toHaveLength(30);
    const raudavatn = RING_OPTION_POINTS.find((p) => p.id === "raudavatn-route");
    expect(raudavatn.lat).toBe(64.10152892);
  });
});

describe("isRingCompletionPair / ringCompletionCacheKey", () => {
  const PAIRS = [
    ["reykjavik-raudavatn", "egilsstadir"], ["reykjavik-raudavatn", "seydisfjordur"],
    ["selfoss", "hella"], ["selfoss", "egilsstadir"], ["selfoss", "seydisfjordur"],
    ["hella", "egilsstadir"], ["hella", "seydisfjordur"], ["egilsstadir", "seydisfjordur"],
  ];

  it("accepts exactly the eight new pairs, both directions; rejects ring-option pairs, Westfjords pairs, and same-place", () => {
    for (const [a, b] of PAIRS) {
      expect(isRingCompletionPair(a, b)).toBe(true);
      expect(isRingCompletionPair(b, a)).toBe(true);
    }
    expect(isRingCompletionPair("reykjavik-raudavatn", "selfoss")).toBe(false); // ring-option pair
    expect(isRingCompletionPair("budardalur", "holmavik")).toBe(false);
    expect(isRingCompletionPair("egilsstadir", "egilsstadir")).toBe(false);
    expect(isRingCompletionPair("selfoss", "isafjordur")).toBe(false);
  });

  it("the cache key is direction-specific (no reverse sharing) and uses a distinct prefix from ring-options/Westfjords", () => {
    const fwd = ringCompletionCacheKey("reykjavik-raudavatn", "egilsstadir", "geo-a", "ds-1");
    const rev = ringCompletionCacheKey("egilsstadir", "reykjavik-raudavatn", "geo-b", "ds-1");
    expect(fwd).not.toBe(rev);
    expect(fwd).toContain("ring-completion");
    expect(fwd).not.toContain("winter-route-data:ring:"); // ring-options' own prefix
  });
});

describe("resolveRingCompletionGeometry (P1/P2/P5)", () => {
  // Pinned from the real, independent probe run
  // (docs/ai/tasks/ticket-503/ring-completion/evidence/probe-output.json),
  // matching both Jonesy's own re-verified sandbox figures and the
  // pre-existing offline-matrix.json exactly. Exact-reverse assertions are
  // explicitly allowed here (confirmed symmetric by Jonesy's own sandbox).
  const EXPECTED = {
    "reykjavik-raudavatn|egilsstadir": { lengthM: 615333.3, idButurCount: 37, points: 14 },
    "reykjavik-raudavatn|seydisfjordur": { lengthM: 639482.2, idButurCount: 38, points: 16 },
    "selfoss|hella": { lengthM: 35646.2, idButurCount: 2, points: 2 },
    "selfoss|egilsstadir": { lengthM: 620628.5, idButurCount: 29, points: 14 },
    "selfoss|seydisfjordur": { lengthM: 644777.4, idButurCount: 31, points: 15 },
    "hella|egilsstadir": { lengthM: 584988.7, idButurCount: 28, points: 13 },
    "hella|seydisfjordur": { lengthM: 609137.6, idButurCount: 30, points: 14 },
    "egilsstadir|seydisfjordur": { lengthM: 24148.9, idButurCount: 2, points: 3 },
  };

  it("all 16 directions resolve geometry_only with the exact pinned length/IdButur-count/point-count, unmappedLengthM 0 in all", () => {
    for (const [key, expected] of Object.entries(EXPECTED)) {
      const [a, b] = key.split("|");
      for (const [from, to] of [[a, b], [b, a]]) {
        const geo = resolveRingCompletionGeometry(from, to);
        expect(geo.ok).toBe(true);
        expect(geo.lengthM).toBeCloseTo(expected.lengthM, 0);
        expect(geo.idButurList).toHaveLength(expected.idButurCount);
        expect(geo.pointIds).toHaveLength(expected.points);
        expect(geo.unmappedLengthM).toBe(0);
      }
    }
  });

  it("every direction's point order is the EXACT reverse of its own opposite direction (matrix proves real symmetry here)", () => {
    for (const key of Object.keys(EXPECTED)) {
      const [a, b] = key.split("|");
      const fwd = resolveRingCompletionGeometry(a, b);
      const rev = resolveRingCompletionGeometry(b, a);
      expect(rev.pointIds).toEqual([...fwd.pointIds].reverse());
      expect(fwd.geometryId).not.toBe(rev.geometryId);
      expect(fwd.lengthM).toBeCloseTo(rev.lengthM, 2);
    }
  });

  it("egilsstadir<->seydisfjordur (the tightest ordering case) resolves via Fjarðarheiði, in the right order both ways", () => {
    const fwd = resolveRingCompletionGeometry("egilsstadir", "seydisfjordur");
    expect(fwd.pointIds).toEqual(["egilsstadir-route", "fjardarheidi-route", "seydisfjordur-route"]);
    const rev = resolveRingCompletionGeometry("seydisfjordur", "egilsstadir");
    expect(rev.pointIds).toEqual(["seydisfjordur-route", "fjardarheidi-route", "egilsstadir-route"]);
  });

  it("P5: edge segments (<100m absolute) are exactly 1410010037 (R-E/R-Sey) and 901130037 (Hella-E/Hella-Sey), nothing else", () => {
    const re = resolveRingCompletionGeometry("reykjavik-raudavatn", "egilsstadir");
    expect(re.idButurSections.find((s) => s.idButur === 1410010037).isEdgeSegment).toBe(true);
    const rsey = resolveRingCompletionGeometry("reykjavik-raudavatn", "seydisfjordur");
    expect(rsey.idButurSections.find((s) => s.idButur === 1410010037).isEdgeSegment).toBe(true);
    const he = resolveRingCompletionGeometry("hella", "egilsstadir");
    expect(he.idButurSections.find((s) => s.idButur === 901130037).isEdgeSegment).toBe(true);
    const hsey = resolveRingCompletionGeometry("hella", "seydisfjordur");
    expect(hsey.idButurSections.find((s) => s.idButur === 901130037).isEdgeSegment).toBe(true);
    // Selfoss<->Egilsstaðir/Seyðisfjörður and Egilsstaðir<->Seyðisfjörður have none.
    const se = resolveRingCompletionGeometry("selfoss", "egilsstadir");
    expect(se.idButurSections.some((s) => s.isEdgeSegment)).toBe(false);
    const es = resolveRingCompletionGeometry("egilsstadir", "seydisfjordur");
    expect(es.idButurSections.some((s) => s.isEdgeSegment)).toBe(false);
  });

  it("P5: every road section carries a real retained nameIs and a fixed reviewed nameEn; the one genuinely new name (911170037 'Fjarðarheiði') has an EN entry too", () => {
    const geo = resolveRingCompletionGeometry("reykjavik-raudavatn", "seydisfjordur");
    expect(geo.idButurSections.every((s) => typeof s.nameIs === "string" && s.nameIs.length > 0)).toBe(true);
    expect(geo.idButurSections.every((s) => typeof s.nameEn === "string" && s.nameEn.length > 0)).toBe(true);
    const fjardarheidiSection = geo.idButurSections.find((s) => s.idButur === 911170037);
    expect(fjardarheidiSection.nameIs).toBe("Fjarðarheiði");
    expect(fjardarheidiSection.nameEn).toBe("Fjarðarheiði");
  });

  it("P5: global first-come IdButur aggregation -- real matrix has 0 unmapped / no non-adjacent repeat in all 16 directions (the synthetic-data proof of this exact aggregation pattern already exists in ringOptionsRoute.test.js's own P4(a) test against real non-adjacent data, 914020037; not duplicated here per P5's own instruction not to build new test infrastructure just for count)", () => {
    for (const [from, to] of [["reykjavik-raudavatn", "egilsstadir"], ["selfoss", "seydisfjordur"], ["hella", "egilsstadir"]]) {
      const geo = resolveRingCompletionGeometry(from, to);
      expect(geo.unmappedLengthM).toBe(0);
      const ids = geo.idButurList;
      expect(new Set(ids).size).toBe(ids.length); // no accidental duplicate entry
    }
  });

  it("an unsupported pair (same-place, a ring-option pair, a Westfjords pair, any other) returns ok:false", () => {
    expect(resolveRingCompletionGeometry("egilsstadir", "egilsstadir").ok).toBe(false);
    expect(resolveRingCompletionGeometry("reykjavik-raudavatn", "selfoss").ok).toBe(false);
    expect(resolveRingCompletionGeometry("budardalur", "holmavik").ok).toBe(false);
    expect(resolveRingCompletionGeometry("selfoss", "isafjordur").ok).toBe(false);
  });

  it("ring-option pairs' own resolver stays completely untouched by this round (golden regression)", () => {
    const geo = resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "south");
    expect(geo.ok).toBe(true);
    expect(geo.lengthM).toBeCloseTo(44984.8, 0);
  });
});

describe("ringCompletionForecastPoints", () => {
  it("maps ordered point ids to their own full point definitions, in the same order", () => {
    const geo = resolveRingCompletionGeometry("egilsstadir", "seydisfjordur");
    const points = ringCompletionForecastPoints(geo.pointIds);
    expect(points.map((p) => p.id)).toEqual(geo.pointIds);
    expect(points.every((p) => typeof p.lat === "number" && typeof p.lon === "number")).toBe(true);
  });
});
