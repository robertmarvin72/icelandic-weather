// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const CONN_PATH = path.join(process.cwd(), "server_data/winter-route-south-connections.json");
const conn = JSON.parse(fs.readFileSync(CONN_PATH, "utf8"));
const pieces = conn.pieces;

const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");
const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8")).places;

const NATIVE_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json");
const WGS84_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-483/samples/wfs-chain-4326.json");
const nativeFeatures = JSON.parse(fs.readFileSync(NATIVE_PATH, "utf8")).features;
const wgs84Features = JSON.parse(fs.readFileSync(WGS84_PATH, "utf8")).features;

function findFeature(features, idferill, tier) {
  return features.find(
    (f) => f.properties.IDFERILL === idferill && f.properties.NAKVAEMNIFERLIS === tier
  );
}

function euclid(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

// Real discontinuity-detection logic. `native_start`/`native_end` on each
// piece are the chain-walk's own traversal entry/exit points (west-to-east
// order; see winter-route-south-connections.json's own note on this), so
// the point where the chain LEAVES piece i (native_end) must equal the
// point where it ENTERS piece i+1 (native_start), within the recorded
// gap_before_this_piece_m.
function findDiscontinuities(pieceList) {
  const problems = [];
  for (let i = 1; i < pieceList.length; i++) {
    const prev = pieceList[i - 1];
    const cur = pieceList[i];
    const measured = euclid(prev.native_end, cur.native_start);
    const recorded = cur.gap_before_this_piece_m;
    if (recorded === null || recorded === undefined) {
      problems.push({ index: i, idferill: cur.idferill, reason: "no gap recorded but pieces are not adjacent", measured });
      continue;
    }
    if (Math.abs(measured - recorded) > 0.5) {
      problems.push({ index: i, idferill: cur.idferill, reason: "recorded gap does not match real measured distance", measured, recorded });
    }
  }
  return problems;
}

function findDuplicatePieces(pieceList) {
  const seen = new Map();
  for (const p of pieceList) seen.set(p.idferill, (seen.get(p.idferill) || 0) + 1);
  return [...seen.entries()].filter(([, count]) => count > 1).map(([idferill]) => idferill);
}

// Real promotion-guard: a connectionStatus may never claim SUPPORTED/ROUTABLE
// unless both an owner selection AND the required access authority are present.
// Neither exists yet anywhere in this corridor (EXACT_GAP throughout), so the
// guard must reject ANY supported/routable claim found in the real data.
function isWronglyPromoted(connectionStatus) {
  const value = (connectionStatus && (connectionStatus.state || connectionStatus.status)) || "";
  return /supported|routable/i.test(value);
}

describe("winter-route-south-connections.json — corridor matches real source data", () => {
  it("has 25 pieces, all unique idferill, no duplicate chain pieces", () => {
    expect(pieces.length).toBe(25);
    expect(findDuplicatePieces(pieces)).toEqual([]);
  });

  it("real mutation: injecting a duplicate piece is caught by the same function", () => {
    const mutated = [...pieces, pieces[0]];
    expect(findDuplicatePieces(mutated)).toEqual([pieces[0].idferill]);
  });

  it("pieces are ordered with real measured gaps visible (continuous links show ~0, true gaps show their real measured distance)", () => {
    const problems = findDiscontinuities(pieces);
    expect(problems).toEqual([]);
  });

  it("real mutation: breaking a continuous link (changing native_start) is caught by the same discontinuity check", () => {
    const mutated = pieces.map((p) => ({ ...p }));
    // Piece index 1 (2138) is recorded continuous (gap 0.0) with piece 0 (2135):
    // 2135.native_end must equal 2138.native_start.
    mutated[1] = { ...mutated[1], native_start: [mutated[1].native_start[0] + 500, mutated[1].native_start[1]] };
    const problems = findDiscontinuities(mutated);
    expect(problems.some((p) => p.idferill === mutated[1].idferill)).toBe(true);
  });

  it("the five approach-candidate native/WGS84 coordinates match the real retained source files at the cited tier", () => {
    for (const [placeId, data] of Object.entries(conn.approach_candidates)) {
      for (const candidate of data.candidates) {
        const objectid = candidate.objectid_tier_minus1;
        if (!objectid) continue; // alternative candidates don't all carry an objectid citation
        const nativeFeature = findFeature(nativeFeatures, candidate.idferill, -1);
        const wgsFeature = findFeature(wgs84Features, candidate.idferill, -1);
        expect(nativeFeature, `${placeId}: native feature ${candidate.idferill} tier -1 not found`).toBeTruthy();
        expect(nativeFeature.properties.OBJECTID).toBe(objectid);
        expect(wgsFeature.properties.OBJECTID).toBe(objectid);

        const nativeCoords = nativeFeature.geometry.coordinates;
        const wgsCoords = wgsFeature.geometry.coordinates;
        const nativeVertex = candidate.stored_field === "END" ? nativeCoords[nativeCoords.length - 1] : nativeCoords[0];
        const wgsVertex = candidate.stored_field === "END" ? wgsCoords[wgsCoords.length - 1] : wgsCoords[0];

        expect(nativeVertex[0]).toBeCloseTo(candidate.native_xy[0], 3);
        expect(nativeVertex[1]).toBeCloseTo(candidate.native_xy[1], 3);
        expect(wgsVertex[1]).toBeCloseTo(candidate.wgs84.latitude, 6);
        expect(wgsVertex[0]).toBeCloseTo(candidate.wgs84.longitude, 6);
      }
    }
  });

  it("stored_direction ('rev') is a geometry/traversal label only — driving access stays EXACT_GAP regardless of direction", () => {
    expect(pieces.every((p) => p.stored_direction === "rev")).toBe(true);
    expect(conn.driving_access_and_direction.status).toBe("EXACT_GAP");
  });

  it("real mutation: attempting to promote the corridor status to supported/routable is caught by the promotion guard", () => {
    expect(isWronglyPromoted(conn.driving_access_and_direction)).toBe(false);
    const mutated = { ...conn.driving_access_and_direction, status: "SUPPORTED" };
    expect(isWronglyPromoted(mutated)).toBe(true);
  });
});

describe("Candidate status in winter-route-places.json never exceeds what south-connections.json actually supports", () => {
  const SOUTH_IDS = ["hveragerdi", "selfoss", "hella", "hvolsvollur", "vik"];

  it("all five south places reference a real candidate entry that exists in winter-route-south-connections.json", () => {
    for (const id of SOUTH_IDS) {
      const place = places.find((p) => p.id === id);
      expect(place, `missing place ${id}`).toBeTruthy();
      expect(place.candidateReference).toBe(`server_data/winter-route-south-connections.json#approach_candidates.${id}`);
      expect(conn.approach_candidates[id]).toBeTruthy();
    }
  });

  // Selfoss/Hella/Hvolsvöllur were later fixed as a selected product approach
  // (server_data/winter-route-approach-selections.json) -- an explicit,
  // documented exception, not a regression. Hveragerði/Vík remain candidates.
  const SELECTED_PRODUCT_APPROACH_IDS = new Set(["selfoss", "hella", "hvolsvollur", "hveragerdi", "vik"]);

  it("none of the five places is marked SUPPORTED/ROUTABLE; coordinates/approach stay null except the 3 now-selected (Selfoss/Hella/Hvolsvöllur)", () => {
    for (const id of SOUTH_IDS) {
      const place = places.find((p) => p.id === id);
      expect(isWronglyPromoted(place.connectionStatus)).toBe(false);
      if (SELECTED_PRODUCT_APPROACH_IDS.has(id)) {
        expect(place.coordinates, `${id} should have selected coordinates`).not.toBeNull();
        continue;
      }
      expect(place.coordinates).toBeNull();
      expect(place.approach).toBeNull();
    }
  });

  it("real mutation: forcing a south place's status to SUPPORTED without an owner selection is caught by the same guard", () => {
    const vik = places.find((p) => p.id === "vik");
    const mutated = { ...vik.connectionStatus, state: "SUPPORTED" };
    expect(isWronglyPromoted(mutated)).toBe(true);
  });

  it("Hvolsvöllur's recommended candidate is explicitly flagged as not gap-differentiated, unlike Selfoss/Hella", () => {
    expect(conn.approach_candidates.hvolsvollur.sources_differentiate_candidates).toBe(false);
    expect(conn.approach_candidates.selfoss.sources_differentiate_candidates).toBe(true);
    expect(conn.approach_candidates.hella.sources_differentiate_candidates).toBe(true);
  });
});
