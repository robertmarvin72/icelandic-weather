// @vitest-environment node
//
// JSON data-contract validation for
// server_data/westfjords-region-flokalundur-isafjordur.json
// (westfjords-isafjordur-mvp approved-prompt-v1.md P1/P2/P3/P4/P5/P6).
// This file reads retained owner-provided docs/ data directly (same
// precedent as the sibling region test files) -- the PRODUCTION loader
// never does this.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadWestfjordsFlokalundurIsafjordurRegionDataset } from "./westfjordsFlokalundurIsafjordurRegionDataset.js";
import { loadWestfjordsFlokalundurRegionDataset } from "./westfjordsFlokalundurRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-westfjords-isafjordur-dataset-test");
const GEOJSON_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-501/owner-packages-2026-11-19/vegagerdin-ids/Vegagerdin-faerdferlar-WGS84.geojson");
const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

// Same standard, publicly documented ISN93/Lambert-1993 parameters,
// re-implemented independently here (not imported from the production
// build script) so this test cannot pass merely by sharing a bug with it.
const A = 6378137.0, F_ELL = 1 / 298.257222101, E2 = F_ELL * (2 - F_ELL), E = Math.sqrt(E2);
const LAT0 = (65 * Math.PI) / 180, LON0 = (-19 * Math.PI) / 180, LAT1 = (64.25 * Math.PI) / 180, LAT2 = (65.75 * Math.PI) / 180;
const X0 = 500000, Y0 = 500000;
function mFunc(phi) { return Math.cos(phi) / Math.sqrt(1 - E2 * Math.sin(phi) ** 2); }
function tFunc(phi) { const s = Math.sin(phi); return Math.tan(Math.PI / 4 - phi / 2) / ((1 - E * s) / (1 + E * s)) ** (E / 2); }
const m1 = mFunc(LAT1), m2 = mFunc(LAT2), t0 = tFunc(LAT0), t1 = tFunc(LAT1), t2 = tFunc(LAT2);
const N = (Math.log(m1) - Math.log(m2)) / (Math.log(t1) - Math.log(t2));
const FF = m1 / (N * t1 ** N);
const RHO0 = A * FF * t0 ** N;
function forward(lonDeg, latDeg) {
  const lon = (lonDeg * Math.PI) / 180, lat = (latDeg * Math.PI) / 180;
  const t = tFunc(lat), rho = A * FF * t ** N, theta = N * (lon - LON0);
  return { x: X0 + rho * Math.sin(theta), y: Y0 + RHO0 - rho * Math.cos(theta) };
}

const CHAIN_IDFERILL = [3009, 3008, 2870, 38085, 38087, 38088, 2994, 3003, 2767, 2993, 2297, 2890, 2618, 2600, 3835, 3833, 3834];
const FORBIDDEN_DETOUR_VEGNR = ["62", "63", "64", "65", "621", "622", "624", "625", "626", "627", "631"];
const FORBIDDEN_DETOUR_SOURCE_IDS = [2318, 3698, 38082, 17922, 39700, 3006, 40005, 2272, 2399, 2089, 2144, 53123, 2019, 2888, 2739, 3830, 3829, 3846, 3392, 25602, 25603];

describe("westfjords-region-flokalundur-isafjordur.json -- data contract (real retained data)", () => {
  const region = loadWestfjordsFlokalundurIsafjordurRegionDataset();

  it("tier 0, real CRS, 3648 (shared with the flokalundur region) + the 17-line chain, veghluti 1, vegnr 60 except 3833/3834 = 61", () => {
    expect(region.tier).toBe(0);
    expect(region.crs).toBe("EPSG:3057");
    expect(region.lines.map((l) => l.sourceId)).toEqual([3648, ...CHAIN_IDFERILL]);
    expect(region.lines.every((l) => l.tier === 0)).toBe(true);
    expect(region.lines.every((l) => l.veghluti === 1)).toBe(true);

    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    for (const id of CHAIN_IDFERILL) {
      const expected = id === 3833 || id === 3834 ? "61" : "60";
      expect(String(byId.get(id).properties.VEGNR)).toBe(expected);
    }
  });

  it("P7: the recorded source file/SHA-256 matches the real retained raw GeoJSON on disk", () => {
    expect(region.source.file).toContain("Vegagerdin-faerdferlar-WGS84.geojson");
    expect(sha256File(GEOJSON_PATH)).toBe(region.source.sha256);
  });

  it("P2: the Flókalundur inserted node is byte-identical to the one already established in westfjords-region-budardalur-flokalundur.json -- never recomputed differently, never a shared runtime reference between the two region files", () => {
    const flkRegion = loadWestfjordsFlokalundurRegionDataset();
    expect(region.flokalundur.insertedNode.x).toBe(flkRegion.flokalundur.insertedNode.x);
    expect(region.flokalundur.insertedNode.y).toBe(flkRegion.flokalundur.insertedNode.y);

    const line3648 = region.lines.find((l) => l.sourceId === 3648);
    expect(line3648.vertices).toHaveLength(54);
    expect(line3648.vertices[50].x).toBe(flkRegion.flokalundur.insertedNode.x);
    expect(line3648.vertices[50].y).toBe(flkRegion.flokalundur.insertedNode.y);
  });

  it("P1: every join in the 18-line chain (3648 included) is a real, literal 0 m connection -- independently re-verified here from the raw GeoJSON vertices, never the production build script", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const chainFromRaw = CHAIN_IDFERILL.map((id) => {
      const feat = byId.get(id);
      return { sourceId: id, vertices: feat.geometry.coordinates.map(([lon, lat]) => forward(lon, lat)) };
    });
    const line3648 = region.lines.find((l) => l.sourceId === 3648);
    const full = [{ sourceId: 3648, vertices: line3648.vertices }, ...chainFromRaw];
    for (let i = 0; i < full.length - 1; i++) {
      const a = full[i].vertices;
      const b = full[i + 1].vertices;
      const ends = [a[0], a[a.length - 1]];
      const starts = [b[0], b[b.length - 1]];
      let best = Infinity;
      for (const p of ends) for (const q of starts) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
      expect(best).toBeLessThan(0.001);
    }
  });

  it("P3: Ísafjörður endpoint is 3834's own literal, EXISTING vertex 5 -- 3834 stays unchanged at 13 vertices, never a new/inserted point; vertex 12 (3834's own end) is byte-identical to the existing winter-route-places.json coordinate for isafjordur and is NOT this pair's endpoint", () => {
    const line3834 = region.lines.find((l) => l.sourceId === 3834);
    expect(line3834.vertices).toHaveLength(13);
    expect(region.isafjordur.endpoint.x).toBe(line3834.vertices[5].x);
    expect(region.isafjordur.endpoint.y).toBe(line3834.vertices[5].y);

    const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8"));
    const isaPlace = places.places.find((p) => p.id === "isafjordur");
    const placesNative = forward(isaPlace.coordinates.longitude, isaPlace.coordinates.latitude);
    expect(region.isafjordur.placesJsonNode.x).toBeCloseTo(placesNative.x, 4);
    expect(region.isafjordur.placesJsonNode.y).toBeCloseTo(placesNative.y, 4);
    expect(region.isafjordur.placesJsonNode.x).toBe(line3834.vertices[12].x);
    expect(region.isafjordur.endpoint.x).not.toBe(region.isafjordur.placesJsonNode.x);
  });

  it("P3: the owner-coordinate offset is the real measured distance (~164.62 m), shown separately, never counted as part of a route length by this loader", () => {
    expect(region.isafjordur.offsetM).toBeCloseTo(164.61838967158116, 3);
    expect(region.isafjordur).not.toHaveProperty("lengthM");
  });

  it("P4: the roundabout caveat -- 3834[2->4] is literally coincident with 25602[0->2], ~39.18 m, recorded as data never corrected", () => {
    const line3834 = region.lines.find((l) => l.sourceId === 3834);
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const f25602 = byId.get(25602);
    const native25602 = f25602.geometry.coordinates.slice(0, 3).map(([lon, lat]) => forward(lon, lat));
    for (let i = 0; i < 3; i++) {
      expect(line3834.vertices[2 + i].x).toBeCloseTo(native25602[i].x, 6);
      expect(line3834.vertices[2 + i].y).toBeCloseTo(native25602[i].y, 6);
    }
    expect(region.roundaboutCaveat.sourceId).toBe(3834);
    expect(region.roundaboutCaveat.coincidesWithSourceId).toBe(25602);
    expect(region.roundaboutCaveat.lengthM).toBeCloseTo(39.18049953464036, 3);
  });

  it("regionVersion is stable for the unchanged file and throws on a synthetic schema-invalid fixture (never the real file)", () => {
    const a = loadWestfjordsFlokalundurIsafjordurRegionDataset();
    const b = loadWestfjordsFlokalundurIsafjordurRegionDataset();
    expect(a.regionVersion).toBe(b.regionVersion);

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 0, lines: [] }), "utf8");
    expect(() => loadWestfjordsFlokalundurIsafjordurRegionDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });
});

describe("westfjords Flókalundur<->Ísafjörður -- real end-to-end composition (production core, unchanged)", () => {
  const region = loadWestfjordsFlokalundurIsafjordurRegionDataset();

  function compose(fromPoint, toPoint) {
    return composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: region.lines,
      from: { placeId: "a", x: fromPoint.x, y: fromPoint.y },
      to: { placeId: "b", x: toPoint.x, y: toPoint.y },
    });
  }

  it("P1: the literal sourceId chain in order (no connector), both directions, same length, different geometryId, no forbidden-detour sourceId, no double-counted edge", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.isafjordur.endpoint);
    expect(fwd.status).toBe("geometry_only");
    const expectedForward = [3648, ...CHAIN_IDFERILL];
    expect(fwd.slices.map((s) => s.sourceId)).toEqual(expectedForward);
    expect(fwd.lengthM).toBeCloseTo(87618.55, 0);
    expect(new Set(fwd.slices.map((s) => s.sourceId)).size).toBe(fwd.slices.length);
    for (const forbidden of FORBIDDEN_DETOUR_SOURCE_IDS) expect(expectedForward).not.toContain(forbidden);

    const rev = compose(region.isafjordur.endpoint, region.flokalundur.insertedNode);
    expect(rev.status).toBe("geometry_only");
    expect(rev.slices.map((s) => s.sourceId)).toEqual([...expectedForward].reverse());
    expect(rev.lengthM).toBeCloseTo(fwd.lengthM, 2);
    expect(rev.geometryId).not.toBe(fwd.geometryId);

    const coordLen = (() => {
      let total = 0;
      for (const slice of fwd.slices) {
        const line = region.lines.find((l) => l.sourceId === slice.sourceId);
        const lo = Math.min(slice.fromIndex, slice.toIndex);
        const hi = Math.max(slice.fromIndex, slice.toIndex);
        const span = line.vertices.slice(lo, hi + 1);
        for (let j = 0; j < span.length - 1; j++) total += Math.hypot(span[j + 1].x - span[j].x, span[j + 1].y - span[j].y);
      }
      return total;
    })();
    expect(coordLen).toBeCloseTo(fwd.lengthM, 4);
  });

  it("P2: slice 3648[50->53] is the real ~346.77 m tail, and [0->50] (prior leg) + [50->53] (this leg) sum to the full, unmodified 3648 length -- no overlap", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.isafjordur.endpoint);
    const slice3648 = fwd.slices.find((s) => s.sourceId === 3648);
    expect(slice3648.fromIndex).toBe(50);
    expect(slice3648.toIndex).toBe(53);
    expect(slice3648.lengthM).toBeCloseTo(346.7728648450341, 3);

    const line3648 = region.lines.find((l) => l.sourceId === 3648);
    let fullLength = 0;
    for (let i = 0; i < line3648.vertices.length - 1; i++) fullLength += Math.hypot(line3648.vertices[i + 1].x - line3648.vertices[i].x, line3648.vertices[i + 1].y - line3648.vertices[i].y);

    const flkRegion = loadWestfjordsFlokalundurRegionDataset();
    const priorLeg = composeGeometryPath({
      crs: flkRegion.crs, tier: flkRegion.tier, lines: [...flkRegion.lines, flkRegion.connector],
      from: { placeId: "bd", x: flkRegion.budardalur.insertedNode.x, y: flkRegion.budardalur.insertedNode.y },
      to: { placeId: "flk", x: flkRegion.flokalundur.insertedNode.x, y: flkRegion.flokalundur.insertedNode.y },
    });
    const priorSlice3648 = priorLeg.slices.find((s) => s.sourceId === 3648);
    expect(priorSlice3648.fromIndex).toBe(0);
    expect(priorSlice3648.toIndex).toBe(50);
    expect(priorSlice3648.lengthM + slice3648.lengthM).toBeCloseTo(fullLength, 3);

    // Optional offline-only proof (P2): budardalur->isafjordur in one
    // hypothetical future call, WITH the prior round's own connector --
    // never a new API route, no double-counting across the two legs.
    const combined = priorLeg.lengthM + fwd.lengthM;
    expect(combined).toBeCloseTo(260092.771, 0);
  });

  it("P5 (negative, tunnel-is-necessary): on the full retained national tier-0 graph, removing 38087 (Dýrafjarðargöng) makes the real core return the WRONG ~115,085 m detour (not a disconnection); restoring it gives back the correct ~87,618.55 m chain", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const rawLines = geojson.features.map((feat) => {
      const p = feat.properties;
      return {
        sourceId: p.IDFERILL, idbutur: p.IDBUTUR, tier: 0, veghluti: p.VEGHLUTI, name: p.STUTTNAFNLEIDAR,
        vertices: feat.geometry.coordinates.map(([lon, lat, z]) => {
          const { x, y } = forward(lon, lat);
          return { x, y, z: z ?? null };
        }),
      };
    });
    const regionLinesById = new Map(region.lines.map((l) => [l.sourceId, l]));
    const patchedLines = rawLines.map((l) => regionLinesById.get(l.sourceId) ?? l);

    const withTunnel = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: patchedLines,
      from: { placeId: "flk", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
      to: { placeId: "isa", x: region.isafjordur.endpoint.x, y: region.isafjordur.endpoint.y },
    });
    expect(withTunnel.status).toBe("geometry_only");
    expect(withTunnel.lengthM).toBeCloseTo(87618.55, 0);
    expect(withTunnel.slices.map((s) => s.sourceId)).toEqual([3648, ...CHAIN_IDFERILL]);

    const withoutTunnelLines = patchedLines.filter((l) => l.sourceId !== 38087);
    const withoutTunnel = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: withoutTunnelLines,
      from: { placeId: "flk", x: region.flokalundur.insertedNode.x, y: region.flokalundur.insertedNode.y },
      to: { placeId: "isa", x: region.isafjordur.endpoint.x, y: region.isafjordur.endpoint.y },
    });
    expect(withoutTunnel.status).toBe("geometry_only"); // the real danger: a plausible WRONG answer, not an error
    expect(withoutTunnel.lengthM).toBeCloseTo(115085.18, 0);
    const detourSourceIds = withoutTunnel.slices.map((s) => s.sourceId);
    expect(detourSourceIds.some((id) => FORBIDDEN_DETOUR_SOURCE_IDS.includes(id))).toBe(true);

    const idButurWithout = [];
    for (const s of withoutTunnel.slices) { if (idButurWithout[idButurWithout.length - 1] !== s.idbutur) idButurWithout.push(s.idbutur); }
    for (const forbiddenIdbutur of [906210037, 906020037, 662210037, 906540037]) expect(idButurWithout).toContain(forbiddenIdbutur);
  });

  it("P5: no slice in the real positive result has a forbidden detour vegnr or sourceId", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.isafjordur.endpoint);
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    for (const slice of fwd.slices) {
      expect(FORBIDDEN_DETOUR_SOURCE_IDS).not.toContain(slice.sourceId);
      const vegnr = String(byId.get(slice.sourceId)?.properties.VEGNR ?? "");
      expect(FORBIDDEN_DETOUR_VEGNR).not.toContain(vegnr);
    }
  });

  it("P6: the real route-validated IdButur list matches exactly, including 660350037/906120037 (3009 and 3833/3834 are literally on this chain)", () => {
    const fwd = compose(region.flokalundur.insertedNode, region.isafjordur.endpoint);
    const idButurIds = [];
    for (const s of fwd.slices) {
      if (s.idbutur == null) continue;
      if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
    }
    const expectedIdButur = [905170037, 660350037, 905310037, 906010037, 906720037, 806030037, 906040037, 906070037, 906080037, 664020037, 906700037, 806110037, 906120037];
    expect(idButurIds).toEqual(expectedIdButur);
    for (const forbidden of [905180037, 905300037, 606210037, 906210037, 906540037, 906050037, 662710037, 662510037, 906090037, 665010037, 906130037, 906140037, 906710037]) {
      expect(idButurIds).not.toContain(forbidden);
    }
  });

  it("P4/P9: drivingAccess/status discipline holds for this pair exactly like every other -- UNVERIFIED, geometry_only, never a legal driving claim", () => {
    const result = compose(region.flokalundur.insertedNode, region.isafjordur.endpoint);
    expect(result.drivingAccess).toBe("UNVERIFIED");
    expect(result.status).toBe("geometry_only");
  });
});
