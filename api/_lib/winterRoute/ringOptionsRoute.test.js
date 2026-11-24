// api/_lib/winterRoute/ringOptionsRoute.test.js — Ticket #503 ring-options, P1/P2/P3/P4
import { describe, it, expect } from "vitest";
import {
  RING_OPTION_POINTS,
  isRingOptionPair,
  isValidRingOption,
  ringOptionCacheKey,
  resolveRingOptionGeometry,
  ringOptionForecastPoints,
} from "./ringOptionsRoute.js";
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

// A representative subset of Jonesy's own 30 cited WGS84 reference values
// (full table in approved-prompt-v1.md P1) -- spot-checked independently.
const EXPECTED_WGS84 = {
  "raudavatn-route": { lat: 64.10152892, lon: -21.75906405 },
  "hellisheidi-east-route": { lat: 64.0220354, lon: -21.30237752 },
  "selfoss-route": { lat: 63.93759501, lon: -21.00380428 },
  "hellisheidi-west-route": { lat: 64.02209738, lon: -21.30211162 },
  "hella-route": { lat: 63.83460815, lon: -20.40236144 },
  "holtavorduheidi-route": { lat: 64.98778171, lon: -21.05499746 },
  "oxnadalsheidi-route": { lat: 65.46800234, lon: -18.69561144 },
  "myvatnsoraefi-route": { lat: 65.64729486, lon: -16.82595479 },
  "fagridalur-route": { lat: 65.09327459, lon: -14.32871136 },
  "grundartangi-route": { lat: 64.34103007, lon: -21.82213655 },
};

describe("RING_OPTION_POINTS (P1/P2)", () => {
  const dataset = loadGeometryDataset();
  const linesById = new Map(dataset.lines.map((l) => [l.sourceId, l]));

  it("has exactly 30 unique native points", () => {
    expect(RING_OPTION_POINTS).toHaveLength(30);
    const coordKeys = new Set(RING_OPTION_POINTS.map((p) => `${p.nativeX}|${p.nativeY}`));
    expect(coordKeys.size).toBe(30);
  });

  it("each point's native x/y/z is byte-identical to the real line's own vertex", () => {
    for (const p of RING_OPTION_POINTS) {
      const line = linesById.get(p.sourceId);
      const vertex = line.vertices[p.vertexIndex];
      expect(vertex.x).toBe(p.nativeX);
      expect(vertex.y).toBe(p.nativeY);
      expect(vertex.z).toBe(p.nativeZ);
    }
  });

  it("each spot-checked point's WGS84 is independently re-derived here to within 1e-6 deg of Jonesy's own cited reference", () => {
    for (const [id, expected] of Object.entries(EXPECTED_WGS84)) {
      const p = RING_OPTION_POINTS.find((x) => x.id === id);
      const wgs = inverse(p.nativeX, p.nativeY);
      expect(Math.abs(wgs.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(wgs.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lat - expected.lat)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(p.lon - expected.lon)).toBeLessThanOrEqual(1e-6);
    }
  });

  it("P1 z-rule: holtavorduheidi/oxnadalsheidi/myvatnsoraefi carry their own named slice's real positive z-max", () => {
    for (const id of ["holtavorduheidi-route", "oxnadalsheidi-route", "myvatnsoraefi-route"]) {
      const p = RING_OPTION_POINTS.find((x) => x.id === id);
      expect(p.nativeZ).toBeGreaterThan(0);
    }
  });

  it("P1 z-rule: hellisheidi-east/west and fagridalur have z<=0 (no elevation data) and use the midpoint-of-span binding, never a town/height claim", () => {
    for (const id of ["hellisheidi-east-route", "hellisheidi-west-route", "fagridalur-route"]) {
      const p = RING_OPTION_POINTS.find((x) => x.id === id);
      expect(p.nativeZ).toBeLessThanOrEqual(0);
    }
  });

  it("P3(a): the grundartangi point is never labeled with the raw 'Hvalfjarðargöng-Grundartangi' IdButur name", () => {
    const p = RING_OPTION_POINTS.find((x) => x.id === "grundartangi-route");
    expect(p.labelIs).not.toMatch(/göng/i);
    expect(p.labelIs).toBe("Leiðarpunktur nærri Grundartanga");
  });

  it("no point's labelIs is a raw IdButur id or an unreviewed abbreviation", () => {
    for (const p of RING_OPTION_POINTS) {
      expect(p.labelIs).not.toMatch(/^\d+$/);
      expect(p.labelIs.length).toBeGreaterThan(2);
    }
  });
});

describe("isRingOptionPair / isValidRingOption / ringOptionCacheKey", () => {
  it("accepts exactly the two ring pairs, both directions; rejects Westfjords pairs and anything else", () => {
    expect(isRingOptionPair("reykjavik-raudavatn", "selfoss")).toBe(true);
    expect(isRingOptionPair("selfoss", "reykjavik-raudavatn")).toBe(true);
    expect(isRingOptionPair("reykjavik-raudavatn", "hella")).toBe(true);
    expect(isRingOptionPair("hella", "reykjavik-raudavatn")).toBe(true);
    expect(isRingOptionPair("selfoss", "hella")).toBe(false);
    expect(isRingOptionPair("budardalur", "holmavik")).toBe(false);
    expect(isRingOptionPair("reykjavik-raudavatn", "egilsstadir")).toBe(false);
  });

  it("isValidRingOption accepts only the exact strings south/north", () => {
    expect(isValidRingOption("south")).toBe(true);
    expect(isValidRingOption("north")).toBe(true);
    expect(isValidRingOption("bogus")).toBe(false);
    expect(isValidRingOption(null)).toBe(false);
    expect(isValidRingOption(undefined)).toBe(false);
    expect(isValidRingOption("")).toBe(false);
  });

  it("cache key is unique per direction+option+geometryId -- NO reverse sharing (unlike the Westfjords modules)", () => {
    const fwd = ringOptionCacheKey("reykjavik-raudavatn", "selfoss", "south", "geo-a");
    const rev = ringOptionCacheKey("selfoss", "reykjavik-raudavatn", "south", "geo-b");
    expect(fwd).not.toBe(rev);
    const sameDirDifferentOption = ringOptionCacheKey("reykjavik-raudavatn", "selfoss", "north", "geo-c");
    expect(fwd).not.toBe(sameDirDifferentOption);
  });
});

describe("resolveRingOptionGeometry (P1/P2/P4)", () => {
  // Pinned from the real, independent probe run
  // (docs/ai/tasks/ticket-503/ring-options/evidence/probe-output.json),
  // matching both the approved prompt's own cited sandbox figures and the
  // pre-existing offline-matrix.json exactly.
  const EXPECTED = {
    "reykjavik-raudavatn|selfoss|south": { lengthM: 44984.8, idButurCount: 5, unmappedLengthM: 0, points: ["raudavatn-route", "hellisheidi-east-route", "selfoss-route"] },
    "selfoss|reykjavik-raudavatn|south": { lengthM: 45101.8, idButurCount: 5, unmappedLengthM: 44.215, points: ["selfoss-route", "hellisheidi-west-route", "raudavatn-route"] },
    "reykjavik-raudavatn|hella|south": { lengthM: 80681.3, idButurCount: 7, unmappedLengthM: 0, points: ["raudavatn-route", "hellisheidi-east-route", "hella-route"] },
    "hella|reykjavik-raudavatn|south": { lengthM: 80748.0, idButurCount: 7, unmappedLengthM: 44.215, points: ["hella-route", "hellisheidi-west-route", "raudavatn-route"] },
  };

  it("all 4 south-option directions resolve geometry_only with the exact pinned length/IdButur-count/unmappedLengthM/point-membership-and-order", () => {
    for (const [key, expected] of Object.entries(EXPECTED)) {
      const [from, to, option] = key.split("|");
      const geo = resolveRingOptionGeometry(from, to, option);
      expect(geo.ok).toBe(true);
      expect(geo.lengthM).toBeCloseTo(expected.lengthM, 0);
      expect(geo.idButurList).toHaveLength(expected.idButurCount);
      expect(geo.unmappedLengthM).toBeCloseTo(expected.unmappedLengthM, 2);
      expect(geo.pointIds).toEqual(expected.points);
      expect(geo.selectedOption).toBe(option);
    }
  });

  it("R->Selfoss north: 66 IdButur, 18 points (the production maximum), correct frozen order", () => {
    const geo = resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "north");
    expect(geo.ok).toBe(true);
    expect(geo.lengthM).toBeCloseTo(1236038.3, 0);
    expect(geo.idButurList).toHaveLength(66);
    expect(geo.pointIds).toHaveLength(18);
    expect(geo.pointIds[0]).toBe("raudavatn-route");
    expect(geo.pointIds.at(-1)).toBe("selfoss-route");
    expect(geo.pointIds).toContain("fagridalur-route");
  });

  it("Selfoss->R north: 66 IdButur, 15 points (fewer than forward -- geometry is NOT symmetric)", () => {
    const geo = resolveRingOptionGeometry("selfoss", "reykjavik-raudavatn", "north");
    expect(geo.ok).toBe(true);
    expect(geo.lengthM).toBeCloseTo(1236224.0, 0);
    expect(geo.idButurList).toHaveLength(66);
    expect(geo.pointIds).toHaveLength(15);
    expect(geo.pointIds).toContain("grundartangi-route");
    expect(geo.pointIds).not.toContain("nordura-route"); // frozen table difference from the forward direction
  });

  it("R->Hella north / Hella->R north: 65 IdButur, 17 points each", () => {
    for (const [from, to] of [["reykjavik-raudavatn", "hella"], ["hella", "reykjavik-raudavatn"]]) {
      const geo = resolveRingOptionGeometry(from, to, "north");
      expect(geo.ok).toBe(true);
      expect(geo.lengthM).toBeCloseTo(from === "hella" ? 1200533.8 : 1200394.7, 0);
      expect(geo.idButurList).toHaveLength(65);
      expect(geo.pointIds).toHaveLength(17);
    }
  });

  it("P4(a): 914020037 is a single aggregated section (not two) on both reverse-north variants, with its own summed length and the expanded IS display name", () => {
    for (const [from, to] of [["selfoss", "reykjavik-raudavatn"], ["hella", "reykjavik-raudavatn"]]) {
      const geo = resolveRingOptionGeometry(from, to, "north");
      const occurrences = geo.idButurList.filter((id) => id === 914020037);
      expect(occurrences).toHaveLength(1);
      const section = geo.idButurSections.find((s) => s.idButur === 914020037);
      expect(section.nameIs).toBe("Suðurlandsvegur um Hádegismóa"); // expanded, not the raw abbreviation
      expect(section.nameEn).toBe("Suðurlandsvegur around Hádegismóar");
      expect(section.routeLengthM).toBeGreaterThan(0);
    }
  });

  it("P4(c): edge segments use an ABSOLUTE <100m threshold (never 1%) -- 1410010037 (~1m) flags on all 4 north variants, 901130037 (~39-42m) flags only on the two Hella-north variants", () => {
    const rsNorth = resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "north");
    const srNorth = resolveRingOptionGeometry("selfoss", "reykjavik-raudavatn", "north");
    const rhNorth = resolveRingOptionGeometry("reykjavik-raudavatn", "hella", "north");
    const hrNorth = resolveRingOptionGeometry("hella", "reykjavik-raudavatn", "north");

    for (const geo of [rsNorth, srNorth, rhNorth, hrNorth]) {
      const s = geo.idButurSections.find((x) => x.idButur === 1410010037);
      expect(s.isEdgeSegment).toBe(true);
      expect(s.routeLengthM).toBeLessThan(2);
    }
    for (const geo of [rhNorth, hrNorth]) {
      const s = geo.idButurSections.find((x) => x.idButur === 901130037);
      expect(s.isEdgeSegment).toBe(true);
      expect(s.routeLengthM).toBeLessThan(100);
    }
    // The same real IdButur also appears on the Selfoss-north variants, but
    // with a much longer traveled sub-length there (a different, non-short
    // clip of the same real road) -- so it must NOT be flagged there.
    for (const geo of [rsNorth, srNorth]) {
      const s = geo.idButurSections.find((x) => x.idButur === 901130037);
      expect(s?.isEdgeSegment ?? false).toBe(false);
    }

    // A normal ~1000km-route section (e.g. the real tunnel line, several
    // km long) must NOT be flagged despite being a tiny fraction of the
    // total route length -- the Westfjords 1% rule would wrongly flag it.
    const tunnelSection = rsNorth.idButurSections.find((x) => x.idButur === 904690037);
    expect(tunnelSection.routeLengthM).toBeGreaterThan(1000);
    expect(tunnelSection.isEdgeSegment).toBe(false);
  });

  it("south variants have no edge segments at all", () => {
    for (const [from, to] of [["reykjavik-raudavatn", "selfoss"], ["selfoss", "reykjavik-raudavatn"], ["reykjavik-raudavatn", "hella"], ["hella", "reykjavik-raudavatn"]]) {
      const geo = resolveRingOptionGeometry(from, to, "south");
      expect(geo.idButurSections.some((s) => s.isEdgeSegment)).toBe(false);
    }
  });

  it("an invalid option, an unsupported pair, or a Westfjords pair all return ok:false", () => {
    expect(resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "bogus").ok).toBe(false);
    expect(resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", null).ok).toBe(false);
    expect(resolveRingOptionGeometry("selfoss", "hella", "south").ok).toBe(false);
    expect(resolveRingOptionGeometry("budardalur", "holmavik", "south").ok).toBe(false);
  });

  it("P4(c) chainage: R->Selfoss north matches the approved prompt's own frozen chainage table (±0.2 km)", () => {
    const geo = resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "north");
    const expectedKm = {
      "raudavatn-route": 0, "nordura-route": 100.9, "holtavorduheidi-route": 132.9, "gljufura-route": 201.8,
      "kjalkavegur-route": 300.6, "oxnadalsheidi-route": 323.3, "ljosavatnsskard-route": 402.0,
      "myvatnsoraefi-route": 457.7, "biskupshals-route": 499.1, "fellabaer-route": 600.9, "fagridalur-route": 634.6,
      "breiddalsvik-route": 699.7, "thvotta-route": 800.0, "hofn-route": 899.3, "kirkjubaejarklaustur-route": 1000.2,
      "myrdalssandur-route": 1100.6, "hvolsvollur-route": 1200.3, "selfoss-route": 1236.0,
    };
    for (const [id, km] of Object.entries(expectedKm)) {
      expect(geo.pointChainageKm[id]).toBeCloseTo(km, 1);
    }
  });

  it("every road section carries a real retained nameIs and a fixed reviewed nameEn; a known tunnel line reads 'X Tunnel'", () => {
    const geo = resolveRingOptionGeometry("reykjavik-raudavatn", "selfoss", "north");
    expect(geo.idButurSections.every((s) => typeof s.nameIs === "string" && s.nameIs.length > 0)).toBe(true);
    expect(geo.idButurSections.every((s) => typeof s.nameEn === "string" && s.nameEn.length > 0)).toBe(true);
    const tunnel = geo.idButurSections.find((s) => s.idButur === 904690037);
    expect(tunnel.nameIs).toBe("Hvalfjarðargöng");
    expect(tunnel.nameEn).toBe("Hvalfjörður Tunnel");
  });
});

describe("ringOptionForecastPoints", () => {
  it("maps ordered point ids to their own full point definitions, in the same order", () => {
    const geo = resolveRingOptionGeometry("reykjavik-raudavatn", "hella", "south");
    const points = ringOptionForecastPoints(geo.pointIds);
    expect(points.map((p) => p.id)).toEqual(geo.pointIds);
    expect(points.every((p) => typeof p.lat === "number" && typeof p.lon === "number")).toBe(true);
  });
});
