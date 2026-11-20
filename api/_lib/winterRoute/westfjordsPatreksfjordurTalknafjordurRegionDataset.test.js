// @vitest-environment node
//
// JSON data-contract validation for
// server_data/westfjords-region-patreksfjordur-talknafjordur.json
// (westfjords-talknafjordur-mvp approved-prompt-v1.md
// P1/P2/P3/P4/P5/P6/P7/P8). This file reads retained owner-provided
// docs/ data directly (same precedent as the sibling region test files)
// -- the PRODUCTION loader never does this.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadWestfjordsPatreksfjordurTalknafjordurRegionDataset } from "./westfjordsPatreksfjordurTalknafjordurRegionDataset.js";
import { loadWestfjordsFlokalundurPatreksfjordurRegionDataset } from "./westfjordsFlokalundurPatreksfjordurRegionDataset.js";
import { composeGeometryPath } from "./geometryComposition.js";

const SCRATCH_DIR = path.join(process.cwd(), "node_modules/.cache/ticket-501-westfjords-talknafjordur-dataset-test");
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

const FORBIDDEN_DETOUR_SOURCE_IDS = [2271, 3332, 3334, 3339, 3698, 3648, 3009, 2318, 2319, 2997, 34243, 3111, 2088, 3868, 3869, 3651, 34245, 2102];

describe("westfjords-region-patreksfjordur-talknafjordur.json -- data contract (real retained data)", () => {
  const region = loadWestfjordsPatreksfjordurTalknafjordurRegionDataset();

  it("tier 0, real CRS, exactly 53127 + 3361 + 2889, veghluti 1, vegnr 62/63/617 respectively", () => {
    expect(region.tier).toBe(0);
    expect(region.crs).toBe("EPSG:3057");
    expect(region.lines.map((l) => l.sourceId)).toEqual([53127, 3361, 2889]);
    expect(region.lines.every((l) => l.tier === 0)).toBe(true);
    expect(region.lines.every((l) => l.veghluti === 1)).toBe(true);

    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    expect(String(byId.get(3361).properties.VEGNR)).toBe("63");
    expect(String(byId.get(2889).properties.VEGNR)).toBe("617");
  });

  it("P8: the recorded source file/SHA-256 matches the real retained raw GeoJSON on disk, including the exact prefix cited in the approved prompt", () => {
    expect(region.source.file).toContain("Vegagerdin-faerdferlar-WGS84.geojson");
    const hash = sha256File(GEOJSON_PATH);
    expect(hash).toBe(region.source.sha256);
    expect(hash.startsWith("cab197ad")).toBe(true);
  });

  it("P2: 53127 and the connector are byte-identical to the ones already established in westfjords-region-flokalundur-patreksfjordur.json -- never recomputed differently, never a shared runtime reference between the two region files; the connector's own first vertex is byte-identical to 3361's own vertex 0", () => {
    const patRegion = loadWestfjordsFlokalundurPatreksfjordurRegionDataset();
    const line53127 = region.lines.find((l) => l.sourceId === 53127);
    const patLine53127 = patRegion.lines.find((l) => l.sourceId === 53127);
    expect(line53127.vertices).toEqual(patLine53127.vertices);

    expect(region.connector.sourceId).toBe(patRegion.connector.sourceId);
    expect(region.connector.vertices).toEqual(patRegion.connector.vertices);
    expect(region.connector.idbutur).toBeNull();
    expect(region.connector.evidenceRef).toBe(patRegion.connector.evidenceRef);

    const line3361 = region.lines.find((l) => l.sourceId === 3361);
    expect(region.connector.vertices[0].x).toBe(line3361.vertices[0].x);
    expect(region.connector.vertices[0].y).toBe(line3361.vertices[0].y);
    expect(region.connector.vertices[0].z).toBe(line3361.vertices[0].z);

    expect(region.patreksfjordur.insertedNode.x).toBe(patRegion.patreksfjordur.insertedNode.x);
    expect(region.patreksfjordur.insertedNode.y).toBe(patRegion.patreksfjordur.insertedNode.y);
  });

  it("P1: the 3361<->2889 join is a real, literal 0 m connection -- independently re-verified here from the raw GeoJSON vertices, never the production build script", () => {
    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    const f3361 = byId.get(3361);
    const f2889 = byId.get(2889);
    const l3361End = forward(...f3361.geometry.coordinates[f3361.geometry.coordinates.length - 1]);
    const l2889Start = forward(...f2889.geometry.coordinates[0]);
    expect(Math.hypot(l3361End.x - l2889Start.x, l3361End.y - l2889Start.y)).toBeLessThan(0.001);
  });

  it("P3: Tálknafjörður endpoint is 2889's own literal, EXISTING vertex 12 -- 2889 stays unchanged at 13 vertices, never a new/inserted point; byte-identical to the existing winter-route-places.json coordinate for talknafjordur", () => {
    const line2889 = region.lines.find((l) => l.sourceId === 2889);
    expect(line2889.vertices).toHaveLength(13);
    expect(region.talknafjordur.endpoint.x).toBe(line2889.vertices[12].x);
    expect(region.talknafjordur.endpoint.y).toBe(line2889.vertices[12].y);

    const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8"));
    const talPlace = places.places.find((p) => p.id === "talknafjordur");
    const placesNative = forward(talPlace.coordinates.longitude, talPlace.coordinates.latitude);
    expect(region.talknafjordur.endpoint.x).toBeCloseTo(placesNative.x, 3);
    expect(region.talknafjordur.endpoint.y).toBeCloseTo(placesNative.y, 3);
  });

  it("P3: the owner-coordinate offset and the coverage-gap flag match the real measured values -- routeEndsShortOfOwnerCoordinate is true, never counted as part of a route length by this loader, and the nearest-other-line check matches the cited 2,825.6 m figure", () => {
    expect(region.talknafjordur.ownerCoordinateOffsetM).toBeCloseTo(995.4294251530142, 1);
    expect(region.talknafjordur.routeEndsShortOfOwnerCoordinate).toBe(true);
    expect(region.talknafjordur).not.toHaveProperty("lengthM");
    expect(region.talknafjordur.coverageCheck.nearestOtherRetainedLineSourceId).toBe(2088);
    expect(region.talknafjordur.coverageCheck.nearestOtherRetainedLineOffsetM).toBeCloseTo(2825.6, 0);
  });

  it("regionVersion is stable for the unchanged file and throws on a synthetic schema-invalid fixture (never the real file)", () => {
    const a = loadWestfjordsPatreksfjordurTalknafjordurRegionDataset();
    const b = loadWestfjordsPatreksfjordurTalknafjordurRegionDataset();
    expect(a.regionVersion).toBe(b.regionVersion);

    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    const badPath = path.join(SCRATCH_DIR, "schema-invalid.json");
    fs.writeFileSync(badPath, JSON.stringify({ crs: "EPSG:4326", tier: 0, lines: [] }), "utf8");
    expect(() => loadWestfjordsPatreksfjordurTalknafjordurRegionDataset(badPath)).toThrow();
    fs.rmSync(badPath, { force: true });
  });
});

describe("westfjords Patreksfjörður<->Tálknafjörður -- real end-to-end composition (production core, unchanged)", () => {
  const region = loadWestfjordsPatreksfjordurTalknafjordurRegionDataset();
  const talLines = [...region.lines, region.connector];

  function compose(fromPoint, toPoint) {
    return composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: talLines,
      from: { placeId: "a", x: fromPoint.x, y: fromPoint.y },
      to: { placeId: "b", x: toPoint.x, y: toPoint.y },
    });
  }

  it("P1: the literal sourceId/slice/direction chain in order, both directions, CC's own measured length within 0.05 m of the prompt's own sandbox figure, exact per-slice lengths, no forbidden-detour sourceId, no double-counted edge, 0 z:null", () => {
    const fwd = compose(region.patreksfjordur.insertedNode, region.talknafjordur.endpoint);
    expect(fwd.status).toBe("geometry_only");
    const expectedForward = [53127, region.connector.sourceId, 3361, 2889];
    expect(fwd.slices.map((s) => s.sourceId)).toEqual(expectedForward);
    expect(fwd.slices.map((s) => s.direction)).toEqual(["reverse", "reverse", "forward", "forward"]);
    expect(fwd.lengthM).toBeCloseTo(17114.943419717, 1);
    expect(fwd.slices[0].lengthM).toBeCloseTo(1380.244556391751, 3);
    expect(fwd.slices[1].lengthM).toBeCloseTo(4.39318262751713, 3);
    expect(fwd.slices[2].lengthM).toBeCloseTo(12837.110304554233, 2);
    expect(fwd.slices[3].lengthM).toBeCloseTo(2893.1953761421687, 2);
    expect(new Set(fwd.slices.map((s) => s.sourceId)).size).toBe(fwd.slices.length);
    for (const forbidden of FORBIDDEN_DETOUR_SOURCE_IDS) expect(expectedForward).not.toContain(forbidden);

    const rev = compose(region.talknafjordur.endpoint, region.patreksfjordur.insertedNode);
    expect(rev.status).toBe("geometry_only");
    expect(rev.slices.map((s) => s.sourceId)).toEqual([...expectedForward].reverse());
    expect(rev.slices.map((s) => s.direction)).toEqual(["reverse", "reverse", "forward", "forward"]);
    expect(rev.lengthM).toBeCloseTo(fwd.lengthM, 1);
    expect(rev.geometryId).not.toBe(fwd.geometryId);

    // 3361 END = 2889 START literal, byte-identical (P1's own toBe requirement)
    const line3361 = region.lines.find((l) => l.sourceId === 3361);
    const line2889 = region.lines.find((l) => l.sourceId === 2889);
    const end3361 = line3361.vertices[line3361.vertices.length - 1];
    expect(end3361.x).toBe(line2889.vertices[0].x);
    expect(end3361.y).toBe(line2889.vertices[0].y);
    expect(end3361.z).toBe(line2889.vertices[0].z);

    const coordLen = (() => {
      let total = 0;
      for (const slice of fwd.slices) {
        const line = talLines.find((l) => l.sourceId === slice.sourceId);
        const lo = Math.min(slice.fromIndex, slice.toIndex);
        const hi = Math.max(slice.fromIndex, slice.toIndex);
        const span = line.vertices.slice(lo, hi + 1);
        for (let j = 0; j < span.length - 1; j++) total += Math.hypot(span[j + 1].x - span[j].x, span[j + 1].y - span[j].y);
      }
      return total;
    })();
    expect(coordLen).toBeCloseTo(fwd.lengthM, 4);

    const coords = [];
    fwd.slices.forEach((slice, i) => {
      const line = talLines.find((l) => l.sourceId === slice.sourceId);
      const lo = Math.min(slice.fromIndex, slice.toIndex);
      const hi = Math.max(slice.fromIndex, slice.toIndex);
      const span = line.vertices.slice(lo, hi + 1);
      const ordered = slice.direction === "forward" ? span : [...span].reverse();
      const startAt = i === 0 ? 0 : 1;
      for (let j = startAt; j < ordered.length; j++) coords.push(ordered[j]);
    });
    expect(coords.filter((c) => c.z === null)).toHaveLength(0);
  });

  it("P2: 2271 is NOT a slice on this route; the connector carries estimated semantics (null idbutur, negative sourceId)", () => {
    const fwd = compose(region.patreksfjordur.insertedNode, region.talknafjordur.endpoint);
    expect(fwd.slices.map((s) => s.sourceId)).not.toContain(2271);
    const connectorSlice = fwd.slices.find((s) => s.sourceId === region.connector.sourceId);
    expect(connectorSlice.idbutur).toBeNull();
    expect(connectorSlice.sourceId).toBeLessThan(0);
  });

  it("P7 (negative, a): removing the connector makes the real core return unsupported disconnected_graph -- no silent snapping", () => {
    const withoutConnector = composeGeometryPath({
      crs: region.crs, tier: region.tier, lines: region.lines,
      from: { placeId: "a", x: region.patreksfjordur.insertedNode.x, y: region.patreksfjordur.insertedNode.y },
      to: { placeId: "b", x: region.talknafjordur.endpoint.x, y: region.talknafjordur.endpoint.y },
    });
    expect(withoutConnector.status).toBe("unsupported");
    expect(withoutConnector.reason).toBe("disconnected_graph");
  });

  it("P7 (negative, b): on the full retained national tier-0 graph, removing 3361 makes the real core return the WRONG ~121,586.41 m detour via 2271/3332/3334/3339/3698/3009/2318/2319/2997/34243/3111/2088 (not a disconnection, not satisfying P1); restoring 3361 gives back the correct ~17,114.94 m chain", () => {
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

    function runOn(lines) {
      return composeGeometryPath({
        crs: region.crs, tier: region.tier, lines,
        from: { placeId: "pat", x: region.patreksfjordur.insertedNode.x, y: region.patreksfjordur.insertedNode.y },
        to: { placeId: "tal", x: region.talknafjordur.endpoint.x, y: region.talknafjordur.endpoint.y },
      });
    }

    const withAll = runOn([...patchedLines, region.connector]);
    expect(withAll.status).toBe("geometry_only");
    expect(withAll.lengthM).toBeCloseTo(17114.94, 0);
    expect(withAll.slices.map((s) => s.sourceId)).toEqual([53127, region.connector.sourceId, 3361, 2889]);

    const without3361 = runOn([...patchedLines.filter((l) => l.sourceId !== 3361), region.connector]);
    expect(without3361.status).toBe("geometry_only"); // the real danger: a plausible WRONG answer, not an error
    expect(without3361.lengthM).toBeCloseTo(121586.40835449164, 0);
    expect(without3361.slices.map((s) => s.sourceId)).toEqual([53127, region.connector.sourceId, 2271, 3332, 3334, 3339, 3698, 3009, 2318, 2319, 2997, 34243, 3111, 2088, 2889]);
  });

  it("P5: no slice in the real positive result has a forbidden detour sourceId, and the real route-validated IdButur list matches exactly (connector's own null skipped)", () => {
    const fwd = compose(region.patreksfjordur.insertedNode, region.talknafjordur.endpoint);
    for (const slice of fwd.slices) expect(FORBIDDEN_DETOUR_SOURCE_IDS).not.toContain(slice.sourceId);

    const idButurIds = [];
    for (const s of fwd.slices) {
      if (s.idbutur == null) continue;
      if (idButurIds[idButurIds.length - 1] !== s.idbutur) idButurIds.push(s.idbutur);
    }
    expect(idButurIds).toEqual([562070037, 905260037, 506170037]);
  });

  it("P6: via is EXACTLY [\"Miklidalur\"] (toEqual) -- \"Bíldudalur\" (present only in 3361's own STADARLYSING, never STUTTNAFNLEIDAR) must never leak in", () => {
    const fwd = compose(region.patreksfjordur.insertedNode, region.talknafjordur.endpoint);
    const linesById = new Map(talLines.map((l) => [l.sourceId, l]));
    const realNames = fwd.slices.map((s) => linesById.get(s.sourceId)?.name).filter(Boolean);
    expect(realNames).toContain("Miklidalur");
    expect(realNames.some((n) => n.includes("Bíldudalur"))).toBe(false);

    const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
    const byId = new Map(geojson.features.map((f) => [f.properties.IDFERILL, f]));
    expect(byId.get(3361).properties.STADARLYSING).toContain("Bíldudalur");

    const viaCandidates = [{ label: "Miklidalur", match: "Miklidalur" }];
    const realNamesSet = new Set(realNames);
    const via = viaCandidates.filter((c) => [...realNamesSet].some((n) => n.includes(c.match))).map((c) => c.label);
    expect(via).toEqual(["Miklidalur"]);
  });

  it("P8: no roundabout/split-carriageway segment on this chain -- VEGHLUTI is 1 throughout, and 3834 (the Ísafjörður roundabout line) is not on this route", () => {
    const fwd = compose(region.patreksfjordur.insertedNode, region.talknafjordur.endpoint);
    const linesById = new Map(talLines.map((l) => [l.sourceId, l]));
    expect(fwd.slices.filter((s) => s.sourceId >= 0).every((s) => linesById.get(s.sourceId).veghluti === 1)).toBe(true);
    expect(fwd.slices.map((s) => s.sourceId)).not.toContain(3834);
  });

  it("P8/P9: drivingAccess/status discipline holds for this pair exactly like every other -- UNVERIFIED, geometry_only, never a legal driving claim", () => {
    const result = compose(region.patreksfjordur.insertedNode, region.talknafjordur.endpoint);
    expect(result.drivingAccess).toBe("UNVERIFIED");
    expect(result.status).toBe("geometry_only");
  });
});
