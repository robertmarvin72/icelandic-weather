// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { createHash } from "node:crypto";

const SEL_PATH = path.join(process.cwd(), "server_data/winter-route-approach-selections.json");
const selections = JSON.parse(fs.readFileSync(SEL_PATH, "utf8")).selections;

const PLACES_PATH = path.join(process.cwd(), "server_data/winter-route-places.json");
const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8")).places;

const ACQ_DIR = path.join(process.cwd(), "docs/ai/tasks/ticket-500/acquisition/samples");
const SOUTH = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server_data/winter-route-south-connections.json"), "utf8"));

// Independent expected list -- not derived from the selections file itself.
const EXPECTED_SELECTED = {
  thingeyri: { idferill: 2272, field: "start", lat: 65.8665326, lon: -23.47396873, db: "approach-analysis" },
  bildudalur: { idferill: 2273, field: "start", lat: 65.67709936, lon: -23.61288347, db: "approach-analysis" },
  saudarkrokur: { idferill: 2485, field: "end", lat: 65.74380077, lon: -19.62028698, db: "approach-analysis" },
  varmahlid: { idferill: 2477, field: "end", lat: 65.55340044, lon: -19.44533505, db: "approach-analysis" },
  patreksfjordur: { idferill: 53127, field: "start", lat: 65.58993681, lon: -23.97181157, db: "approach-analysis" },
  talknafjordur: { idferill: 2889, field: "end", lat: 65.62399623, lon: -23.81359943, db: "approach-analysis" },
  "keflavikurflugvollur-kef": { idferill: 3488, field: "end", lat: 63.99929831, lon: -22.62803395, db: "approach-analysis" },
  selfoss: { idferill: 2138, field: "start", lat: 63.93759503, lon: -21.00380428, db: "south-connections" },
  hella: { idferill: 3591, field: "start", lat: 63.83460817, lon: -20.40236144, db: "south-connections" },
  hvolsvollur: { idferill: 3593, field: "end", lat: 63.75128586, lon: -20.23549109, db: "south-connections" },
  "reykjahlid-myvatn": { idferill: 3566, field: "start", lat: 65.63990944593598, lon: -16.910730687949837, db: "remaining-coverage" },
};
// Reyðarfjörður/Fáskrúðsfjörður were CURRENT_CANDIDATE_NOT_SELECTED through the
// retained-selection round; the east-selection round below selects a DIFFERENT
// source endpoint for each (never the previously-rejected one) after a
// Ripley-attributed visual map check. Kept as an empty array (not deleted) so
// any future round reintroducing a real rejection has an obvious place to list it.
const EXPECTED_NOT_SELECTED = [];
const ALL_45_UNCHANGED_SAMPLE = ["kopavogur", "hofn", "akranes", "dalvik", "husavik"]; // spot-check, not exhaustive

// Independent expected list for the 2 junction selections added in the
// east-selection round -- not derived from the selections file itself.
const EXPECTED_JUNCTION = {
  reydarfjordur: {
    idferill: 2553, field: "start", lat: 65.02999390726326, lon: -14.266008824536579,
    sharedIdferill: 2813, sharedField: "end", previousIdferill: 2520, previousField: "start",
  },
  faskrudsfjordur: {
    // Same idferill as the OLD rejected point (2536), but the opposite stored
    // field -- START was rejected (gangamunni), END is the new selection.
    idferill: 2536, field: "end", lat: 64.93458924724804, lon: -14.051426350254996,
    sharedIdferill: 3843, sharedField: "start", previousIdferill: 2536, previousField: "start",
  },
};

// Independent expected list for the 10 places added in the retained-selection
// round -- not derived from the selections file itself.
const EXPECTED_RETAINED = {
  grindavik: { idferill: 53459, field: "start", lat: 63.85083976, lon: -22.43242783, db: "approach-analysis" },
  bolungarvik: { idferill: 2215, field: "start", lat: 66.14305273, lon: -23.2225211, db: "approach-analysis" },
  siglufjordur: { idferill: 3564, field: "start", lat: 66.1605843, lon: -18.90330291, db: "approach-analysis" },
  olafsfjordur: { idferill: 15361, field: "end", lat: 66.06730376, lon: -18.65429271, db: "approach-analysis" },
  vopnafjordur: { idferill: 3707, field: "end", lat: 65.7641206, lon: -14.82399559, db: "approach-analysis" },
  grundarfjordur: { idferill: 3774, field: "start", lat: 64.92345384, lon: -23.27382147, db: "approach-analysis" },
  olafsvik: { idferill: 2698, field: "start", lat: 64.90014373, lon: -23.72850184, db: "approach-analysis" },
  hveragerdi: { idferill: 2135, field: "end", lat: 63.99538228, lon: -21.19270972, db: "south-connections" },
  vik: { idferill: 3849, field: "start", lat: 63.41782798, lon: -19.00028197, db: "south-connections" },
  borgarnes: { idferill: 2819, field: "end", lat: 64.55996252, lon: -21.89753371, db: "remaining-coverage" },
};
const ALL_35_UNCHANGED_SAMPLE = ["kopasker", "raufarhofn", "fludir", "laugarvatn", "mosfellsbaer"]; // spot-check

// Independent expected list for the 27 places added in the remaining-map-selection
// round -- hand-typed from the approved prompt's own table, NOT derived from
// candidate-review.json/map-review.md (the prompt explicitly forbids treating those
// as the test's own source of truth). field is lowercase "start"/"end".
const EXPECTED_PRODUCT = {
  kopavogur: { idferill: 3073, field: "start", lat: 64.10411666, lon: -21.90418005, db: "acquisition-raw" },
  hafnarfjordur: { idferill: 10287, field: "start", lat: 64.07380373, lon: -21.93959097, db: "acquisition-raw" },
  mosfellsbaer: { idferill: 2469, field: "end", lat: 64.17602806, lon: -21.67652824, db: "acquisition-raw" },
  akranes: { idferill: 3797, field: "end", lat: 64.32768822, lon: -22.05256417, db: "acquisition-raw" },
  stykkisholmur: { idferill: 3466, field: "start", lat: 65.06799806, lon: -22.73935627, db: "acquisition-raw" },
  budardalur: { idferill: 2769, field: "start", lat: 65.10591772, lon: -21.76505686, db: "acquisition-raw" },
  reykholar: { idferill: 2662, field: "end", lat: 65.44592572, lon: -22.20532007, db: "acquisition-raw" },
  isafjordur: { idferill: 3834, field: "end", lat: 66.08035668, lon: -23.12399231, db: "acquisition-raw" },
  sudavik: { idferill: 3535, field: "start", lat: 66.02459271, lon: -22.9922543, db: "acquisition-raw" },
  holmavik: { idferill: 3883, field: "end", lat: 65.70146962, lon: -21.68414766, db: "acquisition-raw" },
  drangsnes: { idferill: 3245, field: "end", lat: 65.69125093, lon: -21.44027942, db: "acquisition-raw" },
  hvammstangi: { idferill: 3487, field: "start", lat: 65.39804115, lon: -20.94389335, db: "acquisition-raw" },
  blonduos: { idferill: 2593, field: "end", lat: 65.65634119, lon: -20.28373541, db: "acquisition-raw" },
  skagastrond: { idferill: 2455, field: "end", lat: 65.82381799, lon: -20.29628289, db: "acquisition-raw" },
  dalvik: { idferill: 3567, field: "start", lat: 65.96755395, lon: -18.52948806, db: "acquisition-raw" },
  husavik: { idferill: 3092, field: "start", lat: 66.03234853, lon: -17.34984614, db: "acquisition-raw" },
  kopasker: { idferill: 8674, field: "start", lat: 66.30152838, lon: -16.44081709, db: "acquisition-raw" },
  raufarhofn: { idferill: 3169, field: "start", lat: 66.44545468, lon: -15.94764087, db: "acquisition-raw" },
  neskaupstadur: { idferill: 2832, field: "start", lat: 65.14719331, lon: -13.71556128, db: "acquisition-raw" },
  eskifjordur: { idferill: 2834, field: "end", lat: 65.07554219, lon: -14.02122438, db: "acquisition-raw" },
  djupivogur: { idferill: 3761, field: "end", lat: 64.65406062, lon: -14.29799027, db: "acquisition-raw" },
  hofn: { idferill: 3652, field: "end", lat: 64.2784739, lon: -15.19843537, db: "acquisition-raw" },
  thorlakshofn: { idferill: 2280, field: "end", lat: 63.86300272, lon: -21.3913311, db: "acquisition-raw" },
  fludir: { idferill: 3548, field: "start", lat: 64.13080082, lon: -20.32143333, db: "acquisition-raw" },
  laugarvatn: { idferill: 3252, field: "start", lat: 64.21194753, lon: -20.74278069, db: "acquisition-raw" },
};
// The 2 native EPSG:3057 points (road-links), verified separately below against
// wfs-vegnr1-all.json + road-links.csv using the tighter OR2 tolerance.
const EXPECTED_PRODUCT_NATIVE = {
  skaftafell: { idferill: 3513, field: "end", lat: 64.00546696040198, lon: -16.943978236220662, nativeX: 600573.7864, nativeY: 390763.984 },
  kirkjubaejarklaustur: { idferill: 2313, field: "end", lat: 63.79468083177732, lon: -18.039733574570896, nativeX: 547336.4823, nativeY: 365988.029 },
};
const EXPECTED_PRODUCT_ALL_IDS = [...Object.keys(EXPECTED_PRODUCT), ...Object.keys(EXPECTED_PRODUCT_NATIVE)];

function findRawFeature(idferill) {
  for (const fname of fs.readdirSync(ACQ_DIR)) {
    if (!fname.startsWith("raw-") || !fname.endsWith(".json")) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(ACQ_DIR, fname), "utf8"));
    for (const feat of doc.features) {
      if (feat.properties.IDFERILL === idferill && feat.properties.NAKVAEMNIFERLIS === -1) return feat;
    }
  }
  return null;
}

// Reyðarfjörður/Fáskrúðsfjörður's junction candidates come from a different
// retained source (road-links.csv / the native EPSG:3057 wfs-vegnr1-all.json),
// not the acquisition round's raw-*.json files -- a separate real lookup.
const VEGNR1_PATH = path.join(process.cwd(), "docs/ai/tasks/ticket-483/samples/wfs-vegnr1-all.json");
let vegnr1FeaturesCache = null;
function findVegnr1Feature(idferill) {
  if (!vegnr1FeaturesCache) {
    vegnr1FeaturesCache = JSON.parse(fs.readFileSync(VEGNR1_PATH, "utf8")).features;
  }
  return vegnr1FeaturesCache.find((f) => f.properties.IDFERILL === idferill && f.properties.NAKVAEMNIFERLIS === -1) || null;
}

// Real, independently-implemented inverse Lambert Conformal Conic (ISN93 / EPSG:3057 -> WGS84),
// GRS80, lat1=64.25 lat2=65.75 lat0=65 lon0=-19 x0=y0=500000 -- used to verify Reykjahlíð's
// projected coordinate against the real native value, not against the selections file's own claim.
function lambertInverse(x, y) {
  const A = 6378137.0;
  const fEll = 1 / 298.257222101;
  const e2 = fEll * (2 - fEll);
  const e = Math.sqrt(e2);
  const toRad = (d) => (d * Math.PI) / 180;
  const phi1 = toRad(64.25), phi2 = toRad(65.75), phi0 = toRad(65.0), lon0 = toRad(-19.0);
  const x0 = 500000.0, y0 = 500000.0;
  const m = (phi) => Math.cos(phi) / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const t = (phi) => Math.tan(Math.PI / 4 - phi / 2) / ((1 - e * Math.sin(phi)) / (1 + e * Math.sin(phi))) ** (e / 2);
  const m1 = m(phi1), m2 = m(phi2);
  const t1 = t(phi1), t2 = t(phi2), t0 = t(phi0);
  const n = (Math.log(m1) - Math.log(m2)) / (Math.log(t1) - Math.log(t2));
  const F = m1 / (n * t1 ** n);
  const rho0 = A * F * t0 ** n;

  const dx = x - x0;
  const dy = rho0 - (y - y0);
  const rho = Math.sign(n) * Math.hypot(dx, dy);
  const tPrime = (rho / (A * F)) ** (1 / n);
  const theta = Math.atan2(dx, dy);
  const lon = theta / n + lon0;
  const chi = Math.PI / 2 - 2 * Math.atan(tPrime);
  const e4 = e2 ** 2, e6 = e2 ** 3, e8 = e2 ** 4;
  const phi =
    chi +
    (e2 / 2 + (5 * e4) / 24 + e6 / 12 + (13 * e8) / 360) * Math.sin(2 * chi) +
    ((7 * e4) / 48 + (29 * e6) / 240 + (811 * e8) / 11520) * Math.sin(4 * chi) +
    ((7 * e6) / 120 + (81 * e8) / 1120) * Math.sin(6 * chi) +
    ((4279 * e8) / 161280) * Math.sin(8 * chi);
  const toDeg = (r) => (r * 180) / Math.PI;
  return [toDeg(phi), toDeg(lon)];
}

function isWronglyPromoted(connectionStatus) {
  const value = (connectionStatus && (connectionStatus.state || connectionStatus.status)) || "";
  return /supported|routable/i.test(value);
}

describe("winter-route-approach-selections.json -- exactly 50 dispositions, all now SELECTED_PRODUCT_APPROACH", () => {
  it("has exactly 50 SELECTED_PRODUCT_APPROACH entries (11 MAP + 10 RETAINED + 2 MAP_JUNCTION + 27 MAP_PRODUCT); none CURRENT_CANDIDATE_NOT_SELECTED any more", () => {
    const ids = Object.keys(selections);
    expect(ids.length).toBe(50);
    const selected = ids.filter((id) => selections[id].status === "SELECTED_PRODUCT_APPROACH");
    const notSelected = ids.filter((id) => selections[id].status === "CURRENT_CANDIDATE_NOT_SELECTED");
    expect(selected.length).toBe(50);
    expect(new Set(selected)).toEqual(
      new Set([...Object.keys(EXPECTED_SELECTED), ...Object.keys(EXPECTED_RETAINED), ...Object.keys(EXPECTED_JUNCTION), ...EXPECTED_PRODUCT_ALL_IDS]),
    );
    expect(notSelected.length).toBe(0);
    expect(EXPECTED_NOT_SELECTED.length).toBe(0);
  });

  it("the original 11 MAP-selected entries are byte-for-byte unchanged by this round", () => {
    for (const id of Object.keys(EXPECTED_SELECTED)) {
      expect(selections[id].selection_basis).toBe("MAP_RECOMMENDATION_APPROVED_VIA_PROMPT");
    }
  });

  it("each of the 2 new junction selections carries selection_basis MAP_JUNCTION_APPROVED_VIA_PROMPT, matches the independent expected list, and points to the Ripley map-check (not a new CC/Jonesy visual check)", () => {
    for (const [id, exp] of Object.entries(EXPECTED_JUNCTION)) {
      const sel = selections[id];
      expect(sel.status).toBe("SELECTED_PRODUCT_APPROACH");
      expect(sel.selection_basis).toBe("MAP_JUNCTION_APPROVED_VIA_PROMPT");
      expect(sel.source.database).toBe("road-links");
      expect(sel.source.idferill).toBe(exp.idferill);
      expect(sel.source.stored_field).toBe(exp.field);
      expect(sel.wgs84.latitude).toBeCloseTo(exp.lat, 6);
      expect(sel.wgs84.longitude).toBeCloseTo(exp.lon, 6);
      expect(sel.access_status).toBe("EXACT_GAP");
      expect(sel.map_reference).toBe("docs/ai/tasks/ticket-500/east-selection/map-check.md");
      expect(sel.map_observation.source_role).toBe("RIPLEY_VISUAL_CHECK");
      expect(sel.map_observation.url).toMatch(/^https:\/\/www\.openstreetmap\.org\//);
      expect(sel.map_observation.estimated_offset_m).toEqual([0, 10]);
    }
  });

  it("the 2 junction selections' native_xy resolve to the real retained tier -1 feature (wfs-vegnr1-all.json) and a shared (0.0 m) endpoint, not just the new file's own claim", () => {
    for (const [id, exp] of Object.entries(EXPECTED_JUNCTION)) {
      const sel = selections[id];
      const feat = findVegnr1Feature(exp.idferill);
      expect(feat, `${id}: idferill ${exp.idferill} not found in wfs-vegnr1-all.json`).toBeTruthy();
      const coords = feat.geometry.coordinates;
      const vertex = exp.field === "end" ? coords[coords.length - 1] : coords[0];
      expect(vertex[0]).toBeCloseTo(sel.native_xy[0], 2);
      expect(vertex[1]).toBeCloseTo(sel.native_xy[1], 2);

      const sharedFeat = findVegnr1Feature(exp.sharedIdferill);
      expect(sharedFeat, `${id}: shared idferill ${exp.sharedIdferill} not found`).toBeTruthy();
      const sharedCoords = sharedFeat.geometry.coordinates;
      const sharedVertex = exp.sharedField === "end" ? sharedCoords[sharedCoords.length - 1] : sharedCoords[0];
      expect(sharedVertex[0]).toBeCloseTo(vertex[0], 2);
      expect(sharedVertex[1]).toBeCloseTo(vertex[1], 2);

      const [lat, lon] = lambertInverse(sel.native_xy[0], sel.native_xy[1]);
      expect(lat).toBeCloseTo(exp.lat, 6);
      expect(lon).toBeCloseTo(exp.lon, 6);
    }
  });

  it("each junction selection's previous_disposition preserves the OLD rejection verbatim, about a DIFFERENT source point than the new selection", () => {
    for (const [id, exp] of Object.entries(EXPECTED_JUNCTION)) {
      const prev = selections[id].previous_disposition;
      expect(prev.status).toBe("CURRENT_CANDIDATE_NOT_SELECTED");
      expect(prev.source.idferill).toBe(exp.previousIdferill);
      expect(prev.source.stored_field).toBe(exp.previousField);
      expect(prev.reason_text.length).toBeGreaterThan(0);
      // The new selection must not be the same (idferill, field) pair as the old rejection.
      const sameIdferill = selections[id].source.idferill === prev.source.idferill;
      const sameField = selections[id].source.stored_field === prev.source.stored_field;
      expect(sameIdferill && sameField).toBe(false);
    }
  });

  it("real mutation: re-inserting the old rejected endpoint as the live selection is caught by the previous-vs-new distinctness check", () => {
    const isSamePoint = (a, b) => a.idferill === b.idferill && a.stored_field === b.stored_field;
    for (const id of Object.keys(EXPECTED_JUNCTION)) {
      // Real data: live selection and its own preserved previous_disposition must differ.
      expect(isSamePoint(selections[id].source, selections[id].previous_disposition.source)).toBe(false);
      // Real mutation: force the live source to literally equal the old rejected one -- the same
      // check, run against this corrupted copy, must now report "same point" (true).
      const mutated = { ...selections[id].source, ...selections[id].previous_disposition.source };
      expect(isSamePoint(mutated, selections[id].previous_disposition.source)).toBe(true);
    }
  });

  it("each of the 10 new retained selections carries selection_basis RETAINED_CANDIDATE_APPROVED_VIA_PROMPT and matches the independent expected list", () => {
    for (const [id, exp] of Object.entries(EXPECTED_RETAINED)) {
      const sel = selections[id];
      expect(sel.status).toBe("SELECTED_PRODUCT_APPROACH");
      expect(sel.selection_basis).toBe("RETAINED_CANDIDATE_APPROVED_VIA_PROMPT");
      expect(sel.source.idferill).toBe(exp.idferill);
      expect(sel.source.stored_field).toBe(exp.field);
      expect(sel.source.database).toBe(exp.db);
      expect(sel.wgs84.latitude).toBeCloseTo(exp.lat, 6);
      expect(sel.wgs84.longitude).toBeCloseTo(exp.lon, 6);
      expect(sel.access_status).toBe("EXACT_GAP");
    }
  });

  it("the 7 acquisition-sourced retained selections resolve to the real raw tier -1 feature at the cited idferill/field", () => {
    for (const [id, exp] of Object.entries(EXPECTED_RETAINED)) {
      if (exp.db !== "approach-analysis") continue;
      const feat = findRawFeature(exp.idferill);
      expect(feat, `${id}: idferill ${exp.idferill} not found in real raw data`).toBeTruthy();
      const coords = feat.geometry.coordinates;
      const vertex = exp.field === "end" ? coords[coords.length - 1] : coords[0];
      expect(vertex[1]).toBeCloseTo(exp.lat, 6);
      expect(vertex[0]).toBeCloseTo(exp.lon, 6);
    }
  });

  it("Vopnafjörður's seam is cited against 3182 (Vopnafjörður-Skógavegur), not the first-encountered same-named piece 3671 (OI2)", () => {
    const feat3707 = findRawFeature(3707);
    const feat3182 = findRawFeature(3182);
    const feat3671 = findRawFeature(3671);
    const end3707 = feat3707.geometry.coordinates[feat3707.geometry.coordinates.length - 1];
    const start3182 = feat3182.geometry.coordinates[0];
    const end3671 = feat3671.geometry.coordinates[feat3671.geometry.coordinates.length - 1];
    // Real check: 3707's END is close to BOTH 3182's start and 3671's end (both are real seams) --
    // the selections file's own reason must name 3182 specifically, per OI2, not just "a seam".
    expect(Math.abs(end3707[0] - start3182[0])).toBeLessThan(0.0005);
    expect(Math.abs(end3707[1] - start3182[1])).toBeLessThan(0.0005);
    expect(Math.abs(end3707[0] - end3671[0])).toBeLessThan(0.0005);
    expect(Math.abs(end3707[1] - end3671[1])).toBeLessThan(0.0005);
    expect(selections.vopnafjordur.map_recommendation_reason).toContain("3182");
  });

  it("Hveragerði/Vík/Borgarnes carry the OI1-required cautious approach wording and their own technical caveats", () => {
    const hveragerdi = places.find((p) => p.id === "hveragerdi");
    expect(hveragerdi.approach).toContain("vestast");
    expect(hveragerdi.approach.toLowerCase()).not.toMatch(/aðkoma|bæjarmörk|miðbæ/);
    expect(hveragerdi.connectionStatus.reason).toContain("34,75");

    const vik = places.find((p) => p.id === "vik");
    expect(vik.approach).toContain("innri samskeyti");
    expect(vik.approach.toLowerCase()).not.toMatch(/aðkoma|bæjarmörk|miðbæ/);
    expect(vik.connectionStatus.reason).toContain("629");

    const borgarnes = places.find((p) => p.id === "borgarnes");
    expect(borgarnes.approach).toContain("Endapunktur");
    expect(borgarnes.approach.toLowerCase()).not.toMatch(/aðkoma|bæjarmörk|miðbæ/);
    expect(borgarnes.connectionStatus.reason.toLowerCase()).toContain("cw_long");
  });

  it("real mutation: a retained selection pointed at a non-existent idferill is caught by the same raw lookup", () => {
    expect(findRawFeature(888888888)).toBeNull();
  });

  it("each selected entry's coordinate matches the independent expected list exactly", () => {
    for (const [id, exp] of Object.entries(EXPECTED_SELECTED)) {
      const sel = selections[id];
      expect(sel.source.idferill).toBe(exp.idferill);
      expect(sel.source.stored_field).toBe(exp.field);
      expect(sel.source.database).toBe(exp.db);
      expect(sel.wgs84.latitude).toBeCloseTo(exp.lat, 6);
      expect(sel.wgs84.longitude).toBeCloseTo(exp.lon, 6);
      expect(sel.access_status).toBe("EXACT_GAP");
      expect(sel.selection_basis).toBe("MAP_RECOMMENDATION_APPROVED_VIA_PROMPT");
    }
  });

  it("the 7 acquisition-sourced selections resolve to the real raw tier -1 feature at the cited idferill/field", () => {
    for (const [id, exp] of Object.entries(EXPECTED_SELECTED)) {
      if (exp.db !== "approach-analysis") continue;
      const feat = findRawFeature(exp.idferill);
      expect(feat, `${id}: idferill ${exp.idferill} not found in real raw data`).toBeTruthy();
      const coords = feat.geometry.coordinates;
      const vertex = exp.field === "end" ? coords[coords.length - 1] : coords[0];
      expect(vertex[1]).toBeCloseTo(exp.lat, 6);
      expect(vertex[0]).toBeCloseTo(exp.lon, 6);
    }
  });

  it("real mutation: a selection pointed at a non-existent idferill is caught by the same raw lookup", () => {
    expect(findRawFeature(777777777)).toBeNull();
  });

  it("Selfoss/Hella select the real ALTERNATIVE_NOT_RECOMMENDED candidate from south-connections.json, not the RECOMMENDED one", () => {
    for (const id of ["selfoss", "hella"]) {
      const cands = SOUTH.approach_candidates[id].candidates;
      const alt = cands.find((c) => c.label === "ALTERNATIVE_NOT_RECOMMENDED");
      const rec = cands.find((c) => c.label === "RECOMMENDED");
      const sel = selections[id];
      expect(sel.wgs84.latitude).toBeCloseTo(alt.wgs84.latitude, 6);
      expect(sel.wgs84.longitude).toBeCloseTo(alt.wgs84.longitude, 6);
      expect(sel.wgs84.latitude).not.toBeCloseTo(rec.wgs84.latitude, 3);
      expect(sel.map_recommendation_reason.toLowerCase()).toMatch(/bil|gap/);
    }
  });

  it("Reykjahlíð's projected coordinate matches a real, independently-implemented inverse Lambert projection of its native EPSG:3057 point", () => {
    const [lat, lon] = lambertInverse(596178.6007, 572933.0514);
    const sel = selections["reykjahlid-myvatn"];
    expect(lat).toBeCloseTo(sel.wgs84.latitude, 6);
    expect(lon).toBeCloseTo(sel.wgs84.longitude, 6);
  });

  it("the Lambert projection is independently verified against 3 other retained native/WGS84 pairs within 1e-7 degree", () => {
    const pairs = [
      { native: [365522.0175, 402772.762], wgs: [64.10152894, -21.75906405] }, // R1 Rauðavatn
      { native: [540259.2615, 577843.7582], wgs: [65.69570405, -18.12371406] }, // Akureyri C
      { native: [361119.191, 454127.5752], wgs: [64.55996252, -21.89753371] }, // Borgarnes P4
    ];
    for (const { native, wgs } of pairs) {
      const [lat, lon] = lambertInverse(native[0], native[1]);
      expect(Math.abs(lat - wgs[0])).toBeLessThan(1e-7);
      expect(Math.abs(lon - wgs[1])).toBeLessThan(1e-7);
    }
  });

  it("there are no CURRENT_CANDIDATE_NOT_SELECTED entries left (both Reyðarfjörður and Fáskrúðsfjörður are now selected, at a different point than before)", () => {
    expect(Object.values(selections).some((s) => s.status === "CURRENT_CANDIDATE_NOT_SELECTED")).toBe(false);
  });
});

describe("remaining-map-selection round -- 27 new MAP_PRODUCT_APPROVED_VIA_PROMPT selections", () => {
  it("each of the 25 acquisition-raw selections carries selection_basis MAP_PRODUCT_APPROVED_VIA_PROMPT and matches the independent expected list", () => {
    for (const [id, exp] of Object.entries(EXPECTED_PRODUCT)) {
      const sel = selections[id];
      expect(sel, `${id} missing from selections`).toBeTruthy();
      expect(sel.status).toBe("SELECTED_PRODUCT_APPROACH");
      expect(sel.selection_basis).toBe("MAP_PRODUCT_APPROVED_VIA_PROMPT");
      expect(sel.source.database).toBe("acquisition-raw");
      expect(sel.source.idferill).toBe(exp.idferill);
      expect(sel.source.stored_field).toBe(exp.field);
      // OR2: Math.abs(...) < 1e-7, not toBeCloseTo(...,6) -- tighter tolerance.
      expect(Math.abs(sel.wgs84.latitude - exp.lat)).toBeLessThan(1e-7);
      expect(Math.abs(sel.wgs84.longitude - exp.lon)).toBeLessThan(1e-7);
      expect(sel.access_status).toBe("EXACT_GAP");
      expect(sel.map_reference).toBe("docs/ai/tasks/ticket-500/remaining-map-selection/map-review.md");
      expect(sel.map_observation.source_role).toBe("RIPLEY_VISUAL_CHECK");
      expect(sel.map_observation.url).toMatch(/^https:\/\/www\.openstreetmap\.org\//);
      // Explicitly NOT a uniform fabricated distance figure for this round.
      expect(sel.map_observation.estimated_offset_m).toBeUndefined();
    }
  });

  it("each of the 25 acquisition-raw selections resolves to the real raw tier -1 feature at the cited idferill/field -- literal equality on the raw, unrounded EPSG:4326 vertex", () => {
    for (const [id, exp] of Object.entries(EXPECTED_PRODUCT)) {
      const feat = findRawFeature(exp.idferill);
      expect(feat, `${id}: idferill ${exp.idferill} not found in real raw data`).toBeTruthy();
      const coords = feat.geometry.coordinates;
      const vertex = exp.field === "end" ? coords[coords.length - 1] : coords[0];
      // Raw EPSG:4326 endpoints are not rounded -- literal equality, not toBeCloseTo.
      expect(vertex[1]).toBe(exp.lat);
      expect(vertex[0]).toBe(exp.lon);
    }
  });

  it("the 2 native EPSG:3057 selections (Skaftafell, Kirkjubæjarklaustur) carry selection_basis MAP_PRODUCT_APPROVED_VIA_PROMPT, correct native_xy/native_crs, and project to WGS84 within OR2's 1e-7 tolerance", () => {
    for (const [id, exp] of Object.entries(EXPECTED_PRODUCT_NATIVE)) {
      const sel = selections[id];
      expect(sel.status).toBe("SELECTED_PRODUCT_APPROACH");
      expect(sel.selection_basis).toBe("MAP_PRODUCT_APPROVED_VIA_PROMPT");
      expect(sel.source.database).toBe("road-links");
      expect(sel.source.idferill).toBe(exp.idferill);
      expect(sel.source.stored_field).toBe(exp.field);
      expect(sel.native_crs).toBe("EPSG:3057");
      expect(sel.native_xy[0]).toBe(exp.nativeX);
      expect(sel.native_xy[1]).toBe(exp.nativeY);

      const feat = findVegnr1Feature(exp.idferill);
      expect(feat, `${id}: idferill ${exp.idferill} not found in wfs-vegnr1-all.json`).toBeTruthy();
      const coords = feat.geometry.coordinates;
      const vertex = exp.field === "end" ? coords[coords.length - 1] : coords[0];
      expect(vertex[0]).toBeCloseTo(exp.nativeX, 2);
      expect(vertex[1]).toBeCloseTo(exp.nativeY, 2);

      const [lat, lon] = lambertInverse(sel.native_xy[0], sel.native_xy[1]);
      expect(Math.abs(lat - exp.lat)).toBeLessThan(1e-7);
      expect(Math.abs(lon - exp.lon)).toBeLessThan(1e-7);
      expect(Math.abs(sel.wgs84.latitude - exp.lat)).toBeLessThan(1e-7);
      expect(Math.abs(sel.wgs84.longitude - exp.lon)).toBeLessThan(1e-7);
    }
  });

  it("OR3: approach_en is present, non-empty, and introduces no new entrance/town-limit/confirmation claim beyond approach_is", () => {
    for (const id of EXPECTED_PRODUCT_ALL_IDS) {
      const sel = selections[id];
      expect(typeof sel.approach_en).toBe("string");
      expect(sel.approach_en.length).toBeGreaterThan(0);
      expect(sel.approach_en.toLowerCase()).not.toMatch(/confirmed|town limit|town boundary|entrance to the town/);
    }
  });

  it("OR1: Akranes' text states the 2.5 m gap to ring piece 21441 remains unresolved -- not a new exact-seam claim", () => {
    const place = places.find((p) => p.id === "akranes");
    const sel = selections.akranes;
    for (const text of [place.connectionStatus.reason, sel.map_recommendation_reason]) {
      expect(text).toContain("2,5");
      expect(text).toContain("21441");
      expect(text.toLowerCase()).toMatch(/óleyst|ekki lei[ðd]r[ée]tt/);
    }
  });

  it("OR1: Dalvík's text names idferill 3501 and describes the seam as internal (innri), not an external connection", () => {
    const place = places.find((p) => p.id === "dalvik");
    const sel = selections.dalvik;
    for (const text of [place.connectionStatus.reason, sel.map_recommendation_reason]) {
      expect(text).toContain("3501");
      expect(text).toContain("innri");
    }
  });

  it("OR1: Kirkjubæjarklaustur's text names idferill 2409 and states the source gap remains unresolved", () => {
    const place = places.find((p) => p.id === "kirkjubaejarklaustur");
    const sel = selections.kirkjubaejarklaustur;
    for (const text of [place.connectionStatus.reason, sel.map_recommendation_reason]) {
      expect(text).toContain("2409");
      expect(text.toLowerCase()).toMatch(/óleyst/);
    }
  });

  it("OR1: Höfn's text names the airport road (982/3170) only to explicitly deny it was used as the town point", () => {
    const place = places.find((p) => p.id === "hofn");
    const sel = selections.hofn;
    for (const text of [place.connectionStatus.reason, sel.map_recommendation_reason]) {
      expect(text).toMatch(/982|3170/);
      expect(text.toUpperCase()).toContain("EKKI");
    }
    // Must not claim the airport road point itself was chosen.
    expect(place.approach).not.toMatch(/Flugvallarveg/);
  });

  it("OR1: Kópavogur's text describes a through-road (gegnumveg) and never claims a junction (gatnamót)", () => {
    const place = places.find((p) => p.id === "kopavogur");
    const sel = selections.kopavogur;
    for (const text of [place.connectionStatus.reason, sel.map_recommendation_reason]) {
      expect(text.toLowerCase()).toContain("gegnumveg");
      expect(text.toLowerCase()).not.toContain("gatnamót");
    }
    // The short approach sentence itself must never claim a confirmed junction either.
    for (const text of [place.approach, sel.approach_is]) {
      expect(text.toLowerCase()).not.toContain("gatnamót");
    }
  });

  it("Hafnarfjörður's new point (10287 START) is explicitly distinguished from the earlier withdrawn 2807 START candidate, which is not revived", () => {
    const sel = selections.hafnarfjordur;
    expect(sel.source.idferill).toBe(10287);
    expect(sel.map_recommendation_reason).toContain("2807");
    expect(sel.map_recommendation_reason.toLowerCase()).toMatch(/ekki endurvak/);
  });

  it("real negative check: a MAP_PRODUCT selection claiming a confirmed external connection would be caught by the no-false-routability guard", () => {
    for (const id of EXPECTED_PRODUCT_ALL_IDS) {
      const place = places.find((p) => p.id === id);
      expect(isWronglyPromoted(place.connectionStatus)).toBe(false);
      expect(place.connectionStatus.reason.toLowerCase()).not.toMatch(/staðfest ytri graph|staðfest akstursleið|staðfest bæjarmörk/);
    }
    // Mutation: a corrupted copy that DOES claim a confirmed external connection must be caught.
    const mutated = { state: "ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED", reason: "staðfest ytri graph-tenging" };
    expect(mutated.reason.toLowerCase()).toMatch(/staðfest ytri graph/);
  });

  it("real mutation: a MAP_PRODUCT selection pointed at the wrong source file/CRS is caught by the real lookup helpers", () => {
    // Wrong file: acquisition-raw idferill that only exists in the native vegnr1 set must not be found by findRawFeature.
    expect(findRawFeature(EXPECTED_PRODUCT_NATIVE.skaftafell.idferill)).toBeNull();
    // Wrong CRS: feeding a native EPSG:3057 metre pair straight into the WGS84 field (no projection) would be wildly wrong --
    // the real Lambert projection output must NOT equal the raw native numbers.
    const native = EXPECTED_PRODUCT_NATIVE.kirkjubaejarklaustur;
    expect(native.nativeX).not.toBeCloseTo(native.lon, 0);
    expect(native.nativeY).not.toBeCloseTo(native.lat, 0);
  });

  it("real mutation: moving Búðardalur's selected coordinate away from its real source vertex is caught by the literal-equality raw check", () => {
    const exp = EXPECTED_PRODUCT.budardalur;
    const feat = findRawFeature(exp.idferill);
    const coords = feat.geometry.coordinates;
    const vertex = exp.field === "end" ? coords[coords.length - 1] : coords[0];
    // Real check that would catch a moved coordinate: literal equality to the raw vertex.
    expect(selections.budardalur.wgs84.latitude).toBe(vertex[1]);
    expect(selections.budardalur.wgs84.longitude).toBe(vertex[0]);
    // Mutation: a coordinate nudged by 0.01 degrees must fail that same literal check.
    const mutatedLat = vertex[1] + 0.01;
    expect(mutatedLat).not.toBe(vertex[1]);
  });

  it("no unauthorized change was made to Keflavík (town) or Þórshöfn, and none of the prior 23 dispositions were touched by this round", () => {
    for (const id of ["keflavik", "thorshofn"]) {
      expect(selections[id]).toBeUndefined();
    }
    for (const id of Object.keys(EXPECTED_SELECTED)) {
      expect(selections[id].selection_basis).toBe("MAP_RECOMMENDATION_APPROVED_VIA_PROMPT");
    }
    for (const id of Object.keys(EXPECTED_RETAINED)) {
      expect(selections[id].selection_basis).toBe("RETAINED_CANDIDATE_APPROVED_VIA_PROMPT");
    }
    for (const id of Object.keys(EXPECTED_JUNCTION)) {
      expect(selections[id].selection_basis).toBe("MAP_JUNCTION_APPROVED_VIA_PROMPT");
    }
  });
});

describe("remaining-map-selection round -- places.json reflects the same 27 selections", () => {
  it("each of the 27 places has real coordinates/approach text matching the independent expected list, and the right connection state/reference", () => {
    for (const [id, exp] of Object.entries({ ...EXPECTED_PRODUCT, ...EXPECTED_PRODUCT_NATIVE })) {
      const place = places.find((p) => p.id === id);
      expect(place.coordinates, `${id} should have coordinates`).not.toBeNull();
      expect(place.approach, `${id} should have approach text`).not.toBeNull();
      expect(Math.abs(place.coordinates.latitude - exp.lat)).toBeLessThan(1e-7);
      expect(Math.abs(place.coordinates.longitude - exp.lon)).toBeLessThan(1e-7);
      expect(place.connectionStatus.state).toBe("ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED");
      expect(place.selectionReference).toBe(`server_data/winter-route-approach-selections.json#selections.${id}`);
      expect(place.selection_basis).toBe("MAP_PRODUCT_APPROVED_VIA_PROMPT");
      expect(place.approach).toBe(selections[id].approach_is);
    }
  });

  it("the 2 native-derived places carry coordinateDerivationReference pointing at their own selection's wgs84_derivation", () => {
    for (const id of Object.keys(EXPECTED_PRODUCT_NATIVE)) {
      const place = places.find((p) => p.id === id);
      expect(place.coordinateDerivationReference).toBe(`server_data/winter-route-approach-selections.json#selections.${id}.wgs84_derivation`);
    }
  });

  it("all prior reference fields (coverageReference, acquiredGeometryReference, approachAnalysisReference, placeEvidenceReference) are preserved, not dropped, for these 27 places", () => {
    for (const id of EXPECTED_PRODUCT_ALL_IDS) {
      const place = places.find((p) => p.id === id);
      expect(place.coverageReference).toBeTruthy();
      expect(place.placeEvidenceReference).toBeTruthy();
    }
    // Skaftafell/Kirkjubæjarklaustur never had acquiredGeometry/approachAnalysis references (native-only places) -- unchanged.
    for (const id of Object.keys(EXPECTED_PRODUCT_NATIVE)) {
      const place = places.find((p) => p.id === id);
      expect(place.acquiredGeometryReference).toBeUndefined();
      expect(place.approachAnalysisReference).toBeUndefined();
    }
    // The 25 acquisition-raw places DO have those references from earlier rounds.
    for (const id of Object.keys(EXPECTED_PRODUCT)) {
      const place = places.find((p) => p.id === id);
      expect(place.acquiredGeometryReference).toBeTruthy();
      expect(place.approachAnalysisReference).toBeTruthy();
    }
  });
});

describe("selection provenance and unresolved source gaps", () => {
  it("retains Reykjahlíð native source coordinates and a traceable projection", () => {
    const sel = selections["reykjahlid-myvatn"];
    const csv = fs.readFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-493-place-network/samples/road-links.csv"), "utf8");
    const lines = csv.trim().split(/\r?\n/);
    const header = lines[0].split(",");
    const row = lines.find((line) => line.startsWith("3566,")).split(",");
    expect(sel.native_xy).toEqual([Number(row[header.indexOf("start_x")]), Number(row[header.indexOf("start_y")])]);
    expect(sel.native_crs).toBe("EPSG:3057");
    expect(sel.wgs84_derivation.ellipsoid).toBe("GRS80");
    expect(sel.wgs84_derivation.parameters).toEqual({ lat_1: 64.25, lat_2: 65.75, lat_0: 65, lon_0: -19, x_0: 500000, y_0: 500000 });
    expect(places.find((p) => p.id === "reykjahlid-myvatn").coordinateDerivationReference).toBe("server_data/winter-route-approach-selections.json#selections.reykjahlid-myvatn.wgs84_derivation");
  });

  it("distinguishes prompt-approved map selections, retained-approved selections, map-junction selections, and the earlier owner-selected places (five categories, not a binary)", () => {
    for (const p of places) {
      if (EXPECTED_SELECTED[p.id]) {
        expect(p.selection_basis).toBe("MAP_RECOMMENDATION_APPROVED_VIA_PROMPT");
        expect(p.approach).not.toMatch(/eigandaval/i);
      } else if (EXPECTED_RETAINED[p.id]) {
        expect(p.selection_basis).toBe("RETAINED_CANDIDATE_APPROVED_VIA_PROMPT");
        expect(p.approach).not.toMatch(/eigandaval/i);
      } else if (EXPECTED_JUNCTION[p.id]) {
        expect(p.selection_basis).toBe("MAP_JUNCTION_APPROVED_VIA_PROMPT");
        expect(p.approach).not.toMatch(/eigandaval/i);
        expect(p.approach.toLowerCase()).not.toMatch(/staðfest aðkoma|bæjarmörk|miðbæ|staðfest akstursleið/);
        expect(p.coordinateDerivationReference).toBe(`server_data/winter-route-approach-selections.json#selections.${p.id}.wgs84_derivation`);
      } else if (EXPECTED_PRODUCT[p.id] || EXPECTED_PRODUCT_NATIVE[p.id]) {
        expect(p.selection_basis).toBe("MAP_PRODUCT_APPROVED_VIA_PROMPT");
      } else {
        expect(p.selection_basis).toBeUndefined();
      }
    }
    for (const [id, gap] of [["selfoss", "30,1"], ["hella", "32,63"]]) {
      const p = places.find((p) => p.id === id);
      for (const text of [p.approach, p.connectionStatus.reason]) {
        expect(text).toContain("ALTERNATIVE_NOT_RECOMMENDED");
        expect(text).toContain(gap);
        expect(text).toContain("óleyst");
      }
    }
  });

  it("each junction selection's preserved previous_disposition still resolves against remaining-coverage's own candidate (the old rejection's own grounding is untouched)", () => {
    const coverage = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server_data/winter-route-remaining-coverage.json"), "utf8")).coverage;
    for (const id of Object.keys(EXPECTED_JUNCTION)) {
      const prev = selections[id].previous_disposition;
      expect(prev.source.database).toBe("remaining-coverage");
      expect(prev.source.idferill).toBe(coverage[id].candidate.idferill);
      expect(prev.source.stored_field).toBe(coverage[id].candidate.stored_field.toLowerCase());
    }
    expect(selections.reydarfjordur.previous_disposition.reason_text).toContain("Reyðarfjörður - Fáskrúðsfjörður");
  });
});

describe("east-junction source attribution and projection metadata", () => {
  it("retains the right CRS, projection, per-place map URL and qualified copy", () => {
    const urls = {
      reydarfjordur: "https://www.openstreetmap.org/?mlat=65.02999391&mlon=-14.26600882#map=18/65.02999391/-14.26600882",
      faskrudsfjordur: "https://www.openstreetmap.org/?mlat=64.93458925&mlon=-14.05142635#map=18/64.93458925/-14.05142635",
    };
    const mapCheck = fs.readFileSync(path.join(process.cwd(), "docs/ai/tasks/ticket-500/east-selection/map-check.md"), "utf8");
    for (const [id, url] of Object.entries(urls)) {
      const sel = selections[id];
      const place = places.find((p) => p.id === id);
      expect(sel.native_crs).toBe("EPSG:3057");
      expect(sel.wgs84_derivation.ellipsoid).toBe("GRS80");
      expect(sel.wgs84_derivation.parameters).toEqual({ lat_1: 64.25, lat_2: 65.75, lat_0: 65, lon_0: -19, x_0: 500000, y_0: 500000 });
      expect(mapCheck).toContain(url);
      expect(sel.map_observation.url).toBe(url);
      expect(place.approach).toBe(sel.approach_is);
      expect(sel.approach_is).not.toMatch(/staðfest.*aðkoma|aðkoma.*staðfest|bæjarmörk|miðbæ|staðfest.*akstursleið/i);
      expect(place.connectionStatus.reason).toContain("Ripley");
      expect(place.connectionStatus.reason).toContain("EXACT_GAP");
      expect(place.connectionStatus.reason).toContain("ekki staðfest ytri graph");
    }
  });
});

describe("winter-route-places.json -- exactly 50 places have a selectionReference, 6 do not", () => {
  it("exactly the 11 MAP-selected places still have real coordinates/approach text, unchanged by this round", () => {
    for (const id of Object.keys(EXPECTED_SELECTED)) {
      const place = places.find((p) => p.id === id);
      expect(place.coordinates, `${id} should have coordinates`).not.toBeNull();
      expect(place.approach, `${id} should have approach text`).not.toBeNull();
      expect(place.coordinates.latitude).toBeCloseTo(EXPECTED_SELECTED[id].lat, 6);
      expect(place.coordinates.longitude).toBeCloseTo(EXPECTED_SELECTED[id].lon, 6);
      expect(place.connectionStatus.state).toBe("ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED");
      expect(place.selectionReference).toBe(`server_data/winter-route-approach-selections.json#selections.${id}`);
    }
  });

  it("exactly the 10 new RETAINED-selected places now have real coordinates/approach text", () => {
    for (const id of Object.keys(EXPECTED_RETAINED)) {
      const place = places.find((p) => p.id === id);
      expect(place.coordinates, `${id} should have coordinates`).not.toBeNull();
      expect(place.approach, `${id} should have approach text`).not.toBeNull();
      expect(place.coordinates.latitude).toBeCloseTo(EXPECTED_RETAINED[id].lat, 6);
      expect(place.coordinates.longitude).toBeCloseTo(EXPECTED_RETAINED[id].lon, 6);
      expect(place.connectionStatus.state).toBe("ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED");
      expect(place.selectionReference).toBe(`server_data/winter-route-approach-selections.json#selections.${id}`);
    }
  });

  it("Reyðarfjörður and Fáskrúðsfjörður now have real coordinates/approach text at a Ripley-map-confirmed junction, distinct from their previously-rejected point", () => {
    for (const [id, exp] of Object.entries(EXPECTED_JUNCTION)) {
      const place = places.find((p) => p.id === id);
      expect(place.coordinates, `${id} should have coordinates`).not.toBeNull();
      expect(place.approach, `${id} should have approach text`).not.toBeNull();
      expect(place.coordinates.latitude).toBeCloseTo(exp.lat, 6);
      expect(place.coordinates.longitude).toBeCloseTo(exp.lon, 6);
      expect(place.connectionStatus.state).toBe("ACCESS_POINT_SELECTED_ACCESS_UNCONFIRMED");
      expect(place.selectionReference).toBe(`server_data/winter-route-approach-selections.json#selections.${id}`);
    }
  });

  it("Keflavík (town) and Þórshöfn -- the only 2 places with no source geometry -- are completely unaffected by this round", () => {
    for (const id of ["keflavik", "thorshofn"]) {
      const place = places.find((p) => p.id === id);
      expect(place.coordinates).toBeNull();
      expect(place.approach).toBeNull();
      expect(place.selectionReference).toBeUndefined();
      expect(place.selection_basis).toBeUndefined();
    }
  });

  it("all 56 places/ids/names/regions/order/aliases are unchanged; exactly 50 have a selectionReference, 6 do not", () => {
    expect(places.length).toBe(56);
    const withSelection = places.filter((p) => p.selectionReference);
    expect(withSelection.length).toBe(50);
    const withoutSelection = places.filter((p) => !p.selectionReference);
    expect(withoutSelection.length).toBe(6);
  });

  it("exactly 54 of 56 places have real coordinates (4 earlier owner-selected + 11 MAP + 10 RETAINED + 2 MAP_JUNCTION + 27 MAP_PRODUCT); only Keflavík (town) and Þórshöfn remain null", () => {
    const withCoords = places.filter((p) => p.coordinates !== null);
    expect(withCoords.length).toBe(54);
    const withoutCoords = places.filter((p) => p.coordinates === null);
    expect(withoutCoords.length).toBe(2);
    expect(new Set(withoutCoords.map((p) => p.id))).toEqual(new Set(["keflavik", "thorshofn"]));
  });

  it("the four earlier owner-selected points (R1/E1/S2/C) are untouched and keep their own prior coordinates", () => {
    const prior = {
      "reykjavik-raudavatn": [64.10152894, -21.75906405],
      egilsstadir: [65.25861764, -14.39028964],
      seydisfjordur: [65.26021788, -14.00953135],
      akureyri: [65.69570405, -18.12371406],
    };
    for (const [id, [lat, lon]] of Object.entries(prior)) {
      const place = places.find((p) => p.id === id);
      expect(place.coordinates.latitude).toBe(lat);
      expect(place.coordinates.longitude).toBe(lon);
      expect(place.selectionReference).toBeUndefined();
    }
  });

  it("Keflavík (town) and Keflavíkurflugvöllur (KEF) remain two separate places; only KEF was selected this round", () => {
    const keflavik = places.find((p) => p.id === "keflavik");
    const kef = places.find((p) => p.id === "keflavikurflugvollur-kef");
    expect(keflavik.id).not.toBe(kef.id);
    expect(kef.coordinates).not.toBeNull();
    expect(keflavik.coordinates).toBeNull();
  });

  it("no place anywhere is SUPPORTED/ROUTABLE as a result of this round", () => {
    for (const p of places) {
      expect(isWronglyPromoted(p.connectionStatus)).toBe(false);
    }
  });

  it("real mutation: forcing a selected place's status to SUPPORTED is caught by the same promotion guard", () => {
    const mutated = { state: "SUPPORTED" };
    expect(isWronglyPromoted(mutated)).toBe(true);
  });
});


describe("27 product-point source provenance", () => {
  it("binds source file/hash/feature and map coordinates to the correct selected place", () => {
    for (const [id, exp] of Object.entries({ ...EXPECTED_PRODUCT, ...EXPECTED_PRODUCT_NATIVE })) {
      const sel = selections[id];
      const bytes = fs.readFileSync(path.join(process.cwd(), sel.source.file));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(sel.source.sha256);
      expect(sel.source.tier).toBe(-1);
      const feature = JSON.parse(bytes.toString("utf8")).features.find((f) =>
        f.properties.IDFERILL === exp.idferill && f.properties.NAKVAEMNIFERLIS === -1);
      expect(feature).toBeTruthy();
      expect(feature.properties.OBJECTID).toBe(sel.source.objectid);
      const coords = feature.geometry.coordinates;
      const vertex = sel.source.stored_field === "start" ? coords[0] : coords[coords.length - 1];
      if (EXPECTED_PRODUCT_NATIVE[id]) {
        expect(vertex.slice(0, 2)).toEqual(sel.native_xy);
        expect(sel.native_crs).toBe("EPSG:3057");
        expect(sel.wgs84_derivation.parameters).toEqual({ lat_1: 64.25, lat_2: 65.75, lat_0: 65, lon_0: -19, x_0: 500000, y_0: 500000 });
      } else {
        expect(vertex.slice(0, 2)).toEqual([sel.wgs84.longitude, sel.wgs84.latitude]);
      }
      const url = new URL(sel.map_observation.url);
      expect(Math.abs(Number(url.searchParams.get("mlat")) - sel.wgs84.latitude)).toBeLessThan(1e-7);
      expect(Math.abs(Number(url.searchParams.get("mlon")) - sel.wgs84.longitude)).toBeLessThan(1e-7);
      expect(places.find((p) => p.id === id).connectionStatus.reason).toContain("Ripley");
    }
  });
});
