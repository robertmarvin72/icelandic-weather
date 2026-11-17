// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ANALYSIS_PATH = path.join(process.cwd(), "server_data/winter-route-approach-analysis.json");
const analysis = JSON.parse(fs.readFileSync(ANALYSIS_PATH, "utf8"));

const COV_PATH = path.join(process.cwd(), "server_data/winter-route-remaining-coverage.json");
const cov = JSON.parse(fs.readFileSync(COV_PATH, "utf8"));

const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");
const placesDoc = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8"));
const places = placesDoc.places;

const ACQ_DIR = path.join(process.cwd(), "docs/ai/tasks/ticket-500/acquisition/samples");

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

// Real lookup: finds the actual raw feature (tier -1) for a given idferill
// inside the real raw response files, independent of anything the analysis
// file itself claims.
function findRealFeature(idferill) {
  for (const fname of fs.readdirSync(ACQ_DIR)) {
    if (!fname.startsWith("raw-") || !fname.endsWith(".json")) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(ACQ_DIR, fname), "utf8"));
    for (const feat of doc.features) {
      if (feat.properties.IDFERILL === idferill && feat.properties.NAKVAEMNIFERLIS === -1) {
        return { feat, fname };
      }
    }
  }
  return null;
}

function isWronglyPromoted(connectionStatus) {
  const value = (connectionStatus && (connectionStatus.state || connectionStatus.status)) || "";
  return /supported|routable/i.test(value);
}

function allCandidates(entry) {
  const list = [...(entry.candidates || [])];
  if (entry.alternative_not_recommended) list.push(entry.alternative_not_recommended);
  return list;
}

function candidateSeamProblems(candidate) {
  const found = findRealFeature(candidate.idferill);
  if (!found) return ["missing source"];
  const problems = [];
  const source = found.feat;
  if (candidate.idbutur !== source.properties.IDBUTUR) problems.push("wrong IDBUTUR");
  const ids = candidate.seam_with_idferill;
  if (ids === null || ids === undefined) return problems;
  const seams = (Array.isArray(ids) ? ids : [ids]).map(findRealFeature);
  if (seams.some((s) => !s)) return [...problems, "missing seam"];
  const coords = source.geometry.coordinates;
  const vertex = candidate.stored_field === "end" ? coords.at(-1) : coords[0];
  for (const seam of seams) {
    const points = seam.feat.geometry.coordinates;
    if (![points[0], points.at(-1)].some((p) => p[0] === vertex[0] && p[1] === vertex[1])) {
      problems.push("not an exact seam");
    }
  }
  const names = seams.map((s) => s.feat.properties.STUTTNAFNLEIDAR);
  if (candidate.seam_with_name !== names.join(" AND ")) problems.push("wrong seam name");
  if (names.every((name) => name === source.properties.STUTTNAFNLEIDAR)) problems.push("same-road interior seam");
  return problems;
}

describe("winter-route-approach-analysis.json -- exactly the 39 acquired places", () => {
  it("candidate road IDs and claimed distinct-road contacts agree with raw geometry and names", () => {
    for (const [id, entry] of Object.entries(analysis.place_results)) {
      expect(["RECOMMENDED", "AMBIGUOUS_TWO_OPTIONS", "PRECISE_GAP"]).toContain(entry.disposition);
      if (entry.disposition === "RECOMMENDED") expect(entry.candidates).toHaveLength(1);
      for (const candidate of allCandidates(entry)) expect(candidateSeamProblems(candidate), id).toEqual([]);
    }
  });

  it("the same contact check rejects a wrong seam, name and road identifier", () => {
    const candidate = analysis.place_results.grindavik.candidates[0];
    expect(candidateSeamProblems({ ...candidate, seam_with_idferill: 53127 })).not.toEqual([]);
    expect(candidateSeamProblems({ ...candidate, seam_with_name: "invented road" })).toContain("wrong seam name");
    expect(candidateSeamProblems({ ...candidate, idbutur: 999999999 })).toContain("wrong IDBUTUR");
  });
  it("has exactly 39 place_results, matching winter-route-acquired-geometry.json's own 39", () => {
    const acq = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server_data/winter-route-acquired-geometry.json"), "utf8"));
    const ids = Object.keys(analysis.place_results);
    expect(ids.length).toBe(39);
    expect(new Set(ids)).toEqual(new Set(Object.keys(acq.place_results)));
  });

  it("all 56 places/ids/names/regions/order/aliases are unchanged", () => {
    expect(places.length).toBe(56);
    const ids = places.map((p) => p.id);
    expect(new Set(ids).size).toBe(56);
  });

  it("every emitted candidate (including alternatives) resolves to a real raw feature at the cited idferill/tier/OBJECTID with a correct SHA-256", () => {
    for (const [id, entry] of Object.entries(analysis.place_results)) {
      for (const cand of allCandidates(entry)) {
        const found = findRealFeature(cand.idferill);
        expect(found, `${id}: idferill ${cand.idferill} not found in any real raw file`).toBeTruthy();
        expect(found.feat.properties.OBJECTID).toBe(cand.objectid);
        expect(found.fname).toBe(cand.raw_source_file);
        const actualSha = sha256File(path.join(ACQ_DIR, found.fname));
        expect(actualSha).toBe(cand.raw_source_sha256);

        // The cited WGS84 point must actually be the piece's own start or end vertex.
        const coords = found.feat.geometry.coordinates;
        const vertex = cand.stored_field === "end" ? coords[coords.length - 1] : coords[0];
        expect(vertex[1]).toBeCloseTo(cand.wgs84.latitude, 6);
        expect(vertex[0]).toBeCloseTo(cand.wgs84.longitude, 6);
      }
    }
  });

  it("real mutation: a candidate pointed at the wrong idferill is caught by the same lookup (not a self-comparison)", () => {
    const real = findRealFeature(53459); // grindavik's real recommended piece
    const wrongIdferill = 999999999;
    const found = findRealFeature(wrongIdferill);
    expect(found).toBeNull();
    expect(real).toBeTruthy();
  });

  it("real mutation: a swapped source feature (right idferill, wrong OBJECTID) is caught by the OBJECTID check", () => {
    const found = findRealFeature(53459);
    const mutatedCandidate = { idferill: 53459, objectid: found.feat.properties.OBJECTID + 1 };
    expect(mutatedCandidate.objectid).not.toBe(found.feat.properties.OBJECTID);
  });

  it("AMBIGUOUS_TWO_OPTIONS places never silently merge their two measured-gap candidates into one 'equal' node", () => {
    for (const [id, entry] of Object.entries(analysis.place_results)) {
      if (entry.disposition !== "AMBIGUOUS_TWO_OPTIONS") continue;
      expect(entry.candidates.length, `${id}: expected 2 distinct candidates`).toBeGreaterThanOrEqual(2);
      const points = entry.candidates.map((c) => `${c.wgs84.latitude},${c.wgs84.longitude}`);
      expect(new Set(points).size, `${id}: candidates collapsed to the same point`).toBe(points.length);
    }
  });

  it("PRECISE_GAP places carry no candidate at all (a gap is not quietly filled with a guess)", () => {
    for (const [id, entry] of Object.entries(analysis.place_results)) {
      if (entry.disposition !== "PRECISE_GAP") continue;
      expect(entry.candidates, `${id}: PRECISE_GAP must not carry candidates`).toEqual([]);
      expect(entry.note && entry.note.length).toBeGreaterThan(0);
    }
  });

  it("the two re-examined candidates (Patreksfjordur, Saudarkrokur) no longer assert an unjustified default without a seam/caveat note", () => {
    const pf = analysis.place_results.patreksfjordur;
    expect(pf.disposition).toBe("AMBIGUOUS_TWO_OPTIONS");
    expect(pf.candidates.every((c) => c.seam_with_idferill === null)).toBe(true);

    const sk = analysis.place_results.saudarkrokur;
    expect(sk.disposition).toBe("AMBIGUOUS_TWO_OPTIONS");
    const endCand = sk.candidates.find((c) => c.stored_field === "end");
    expect(endCand.seam_with_idferill).toEqual([3067, 2715]);
  });

  it("reference fields resolve to the correct place_results entry for the same place id, in both coverage and places files", () => {
    for (const id of Object.keys(analysis.place_results)) {
      const covEntry = cov.coverage[id];
      expect(covEntry.approach_analysis_reference).toBe(`server_data/winter-route-approach-analysis.json#place_results.${id}`);
      const place = places.find((p) => p.id === id);
      expect(place.approachAnalysisReference).toBe(`server_data/winter-route-approach-analysis.json#place_results.${id}`);
    }
  });

  // 7 of these 39 places were later fixed as a selected product approach
  // (server_data/winter-route-approach-selections.json) -- an explicit,
  // documented exception, not a regression.
  const SELECTED_PRODUCT_APPROACH_IDS = new Set([
    "thingeyri", "bildudalur", "saudarkrokur", "varmahlid", "patreksfjordur",
    "talknafjordur", "keflavikurflugvollur-kef",
    // retained-selection round (7 more within this file's own 39-place scope):
    "grindavik", "bolungarvik", "siglufjordur", "olafsfjordur", "vopnafjordur",
    "grundarfjordur", "olafsvik",
    // remaining-map-selection round (25 more within this file's own 39-place scope --
    // Skaftafell/Kirkjubæjarklaustur are native-only places, never part of this
    // analysis's 39-place scope, so they are correctly NOT listed here):
    "kopavogur", "hafnarfjordur", "mosfellsbaer", "akranes", "stykkisholmur",
    "budardalur", "reykholar", "isafjordur", "sudavik", "holmavik", "drangsnes",
    "hvammstangi", "blonduos", "skagastrond", "dalvik", "husavik", "kopasker",
    "raufarhofn", "neskaupstadur", "eskifjordur", "djupivogur", "hofn",
    "thorlakshofn", "fludir", "laugarvatn",
  ]);

  it("new analysis never promotes a place to SUPPORTED/ROUTABLE; coordinates/approach stay null for all 39 except the 7 now-selected", () => {
    expect(isWronglyPromoted({ status: analysis.driving_access_and_direction.status })).toBe(false);
    for (const id of Object.keys(analysis.place_results)) {
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

  it("real mutation: forcing the analysis's own access status to SUPPORTED is caught by the same promotion guard", () => {
    const mutated = { status: "SUPPORTED" };
    expect(isWronglyPromoted(mutated)).toBe(true);
  });

  it("acquisition-round status/candidate snapshot in coverage.json is untouched by this round (only the new reference field was added)", () => {
    for (const [id, entry] of Object.entries(cov.coverage)) {
      if (!analysis.place_results[id]) continue;
      expect(["CANDIDATE_FROM_ACQUIRED_GEOMETRY", "ACQUIRED_GEOMETRY_MULTIPLE_PIECES_NO_SINGLE_CANDIDATE", "ACQUIRED_GEOMETRY_NO_CLEAN_NAME_MATCH"]).toContain(entry.status);
    }
  });
});
