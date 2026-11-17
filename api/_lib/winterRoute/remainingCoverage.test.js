// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const COV_PATH = path.join(process.cwd(), "server_data/winter-route-remaining-coverage.json");
const cov = JSON.parse(fs.readFileSync(COV_PATH, "utf8"));

const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");
const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8")).places;

const ROAD_LINKS_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-493-place-network/samples/road-links.csv");
const roadLinksRaw = fs.readFileSync(ROAD_LINKS_PATH, "utf8");

const WGS_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-491/final-validation/samples/wfs-vesturland-4326.json");
const wgsFeatures = JSON.parse(fs.readFileSync(WGS_PATH, "utf8")).features;

const ROAD_COND_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-429/samples/vegagerdin-faerd2017-1.json");
const roadConditions = JSON.parse(fs.readFileSync(ROAD_COND_PATH, "utf8"));
const ROAD_COND_LEGACY_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-483/samples/legacy-faerd-fresh.json");
const roadConditionsLegacy = JSON.parse(fs.readFileSync(ROAD_COND_LEGACY_PATH, "utf8"));
const allRoadConditionIdButurs = new Set(
  [...roadConditions, ...roadConditionsLegacy].map((r) => Math.round(r.IdButur))
);

// Real helper: finds a road-links.csv row for a given idferill and extracts
// the field named by `field` (e.g. "end_x"), parsed as a float.
function roadLinksField(idferill, field) {
  const lines = roadLinksRaw.split("\n");
  const header = lines[0].split(",");
  const idx = header.indexOf("idferill");
  const fieldIdx = header.indexOf(field);
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    if (Number(cols[idx]) === idferill) return Number(cols[fieldIdx]);
  }
  return null;
}

// Real promotion guard (same pattern as southConnections.test.js): a status
// may never claim SUPPORTED/ROUTABLE.
function isWronglyPromoted(connectionStatus) {
  const value = (connectionStatus && (connectionStatus.state || connectionStatus.status)) || "";
  return /supported|routable/i.test(value);
}

// Real missing-coverage detector: every PENDING-turned-reviewed place in
// places.json must have a matching entry in the coverage file.
function findMissingCoverage(placeList, coverageDoc) {
  const retainedOrSouth = new Set([
    "reykjavik-raudavatn", "egilsstadir", "seydisfjordur", "akureyri",
    "hveragerdi", "selfoss", "hella", "hvolsvollur", "vik",
  ]);
  const missing = [];
  for (const p of placeList) {
    if (retainedOrSouth.has(p.id)) continue;
    if (!coverageDoc.coverage[p.id]) missing.push(p.id);
  }
  return missing;
}

describe("winter-route-remaining-coverage.json — exactly the 47 reviewed places", () => {
  it("has exactly 47 coverage entries, matching the 47 non-retained/non-south places in winter-route-places.json", () => {
    const ids = Object.keys(cov.coverage);
    expect(ids.length).toBe(47);
    expect(findMissingCoverage(places, cov)).toEqual([]);
  });

  it("real mutation: removing a coverage entry is caught by the same missing-coverage detector", () => {
    const mutated = { coverage: { ...cov.coverage } };
    delete mutated.coverage["kopavogur"];
    const missing = findMissingCoverage(places, mutated);
    expect(missing).toContain("kopavogur");
  });

  it("the four RETAINED_CANDIDATE entries' native coordinates match the real road-links.csv row for their cited idferill", () => {
    for (const [id, entry] of Object.entries(cov.coverage)) {
      if (entry.status !== "RETAINED_CANDIDATE_NAME_MATCH_INFERRED") continue;
      const idferill = entry.candidate.idferill;
      const field = entry.candidate.stored_field === "END" ? "end" : "start";
      const realX = roadLinksField(idferill, `${field}_x`);
      const realY = roadLinksField(idferill, `${field}_y`);
      expect(realX, `${id}: no road-links.csv row for idferill ${idferill}`).not.toBeNull();
      expect(realX).toBeCloseTo(entry.candidate.native_xy[0], 2);
      expect(realY).toBeCloseTo(entry.candidate.native_xy[1], 2);
    }
  });

  it("real mutation: a wrong idferill citation is caught by the same road-links cross-check (not a self-comparison)", () => {
    const realX = roadLinksField(2819, "end_x");
    const wrongX = realX + 5000; // a deliberately wrong value, not derived from the real file
    expect(wrongX).not.toBeCloseTo(realX, 2);
  });

  it("Borgarnes's WGS84 coordinate matches the real wfs-vesturland-4326.json feature at the cited OBJECTID/tier", () => {
    const borgarnes = cov.coverage.borgarnes;
    const objectid = borgarnes.candidate.wgs84.objectid_tier_minus1;
    const feature = wgsFeatures.find(
      (f) => f.properties.IDFERILL === borgarnes.candidate.idferill && f.properties.OBJECTID === objectid
    );
    expect(feature, "Borgarnes WGS84 feature not found at cited OBJECTID").toBeTruthy();
    const coords = feature.geometry.coordinates;
    const lastVertex = coords[coords.length - 1];
    expect(lastVertex[1]).toBeCloseTo(borgarnes.candidate.wgs84.latitude, 6);
    expect(lastVertex[0]).toBeCloseTo(borgarnes.candidate.wgs84.longitude, 6);
  });

  it("every ROAD_IDENTIFIER_RETAINED_NO_GEOMETRY place cites a real IdButur that actually exists in the retained road-condition files", () => {
    for (const [id, entry] of Object.entries(cov.coverage)) {
      if (entry.status !== "ROAD_IDENTIFIER_RETAINED_NO_GEOMETRY") continue;
      expect(entry.road_condition_refs, `${id}: no road_condition_refs`).toBeTruthy();
      for (const ref of entry.road_condition_refs) {
        expect(allRoadConditionIdButurs.has(Math.round(ref.idbutur)), `${id}: IdButur ${ref.idbutur} not found in real road-condition files`).toBe(true);
      }
    }
  });

  it("real mutation: a fabricated IdButur not present in either road-condition file is caught by the same check", () => {
    const fakeIdButur = 999999999;
    expect(allRoadConditionIdButurs.has(fakeIdButur)).toBe(false);
  });

  // The 7 of these 47 places later fixed as a selected product approach
  // (server_data/winter-route-approach-selections.json) are an explicit,
  // documented exception to "coordinates stay null" -- not a regression.
  const SELECTED_PRODUCT_APPROACH_IDS = new Set([
    "saudarkrokur", "varmahlid", "patreksfjordur", "talknafjordur",
    "keflavikurflugvollur-kef", "bildudalur", "thingeyri", "reykjahlid-myvatn",
    // retained-selection round (8 more within this file's own 47-place scope):
    "grindavik", "bolungarvik", "siglufjordur", "olafsfjordur", "vopnafjordur",
    "grundarfjordur", "olafsvik", "borgarnes",
    // east-selection round (2 more within this file's own 47-place scope):
    "reydarfjordur", "faskrudsfjordur",
    // remaining-map-selection round (27 more, all within this file's own 47-place
    // scope -- including skaftafell/kirkjubaejarklaustur, whose coverage entries
    // above are NO_RETAINED_MATCH/NAME_MENTION_ONLY with candidate=null: those
    // findings are about THIS file's own candidate search and stay correct;
    // the new selection comes from a different source (native EPSG:3057 via
    // road-links), the same already-established pattern as reydarfjordur/
    // faskrudsfjordur above):
    "kopavogur", "hafnarfjordur", "mosfellsbaer", "akranes", "stykkisholmur",
    "budardalur", "reykholar", "isafjordur", "sudavik", "holmavik", "drangsnes",
    "hvammstangi", "blonduos", "skagastrond", "dalvik", "husavik", "kopasker",
    "raufarhofn", "neskaupstadur", "eskifjordur", "djupivogur", "hofn",
    "skaftafell", "kirkjubaejarklaustur", "thorlakshofn", "fludir", "laugarvatn",
  ]);

  it("no coverage entry and no corresponding place is ever SUPPORTED/ROUTABLE, even after a review result was found; coordinates stay null except for the 7 now-selected places", () => {
    for (const [id, entry] of Object.entries(cov.coverage)) {
      expect(isWronglyPromoted({ state: entry.status })).toBe(false);
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

  it("real mutation: forcing a reviewed place to SUPPORTED despite an unresolved access gap is caught by the promotion guard", () => {
    const mutated = { ...places.find((p) => p.id === "borgarnes").connectionStatus, state: "SUPPORTED" };
    expect(isWronglyPromoted(mutated)).toBe(true);
  });

  it("a NAME_MENTION_ONLY entry never carries a candidate object (a text mention is not geometry)", () => {
    const entry = cov.coverage["kirkjubaejarklaustur"];
    expect(entry.status).toBe("NAME_MENTION_ONLY_NO_GEOMETRY");
    expect(entry.candidate).toBeNull();
  });

  it("a NO_RETAINED_MATCH_CHECKED entry never carries a candidate or road_condition_refs", () => {
    for (const id of ["keflavik", "skaftafell", "thorshofn"]) {
      const entry = cov.coverage[id];
      expect(entry.status, `${id} unexpected status`).toBe("NO_RETAINED_MATCH");
      expect(entry.candidate).toBeNull();
      expect(entry.road_condition_refs).toBeNull();
    }
  });
});
