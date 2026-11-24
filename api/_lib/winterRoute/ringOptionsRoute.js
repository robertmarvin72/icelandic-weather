// api/_lib/winterRoute/ringOptionsRoute.js
//
// Ticket #503 ring-options -- weather/road data for the Ring Road option
// pairs: reykjavik-raudavatn<->selfoss and reykjavik-raudavatn<->hella,
// each with `option=south|north`, both directions: 8 route-variants.
// Reuses the exact same production geometry core as the geometry API via
// composeSouthOption/composeNorthOption (extracted verbatim into
// ./ringOptionGeometry.js, P5(b) -- no behavior change, see that module's
// own header and the before/after snapshot in
// docs/ai/tasks/ticket-503/ring-options/evidence/).
//
// Unlike the Westfjords modules (budardalurHolmavikRoute.js/
// westfjordsBatchRoute.js/westfjordsCompletionRoute.js), point membership
// here is NOT computed from coordinate presence in the composed route.
// P2 found that coordinate membership would wrongly attach 11-13 "ghost"
// points from the OTHER direction/option's own frozen table to each
// variant (north/south share some geography, and south's own endpoint
// vertex sits inside north's own coordinate chain). Each of the 8
// variants instead gets its own FROZEN, explicit, ordered point-id list
// (VARIANT_POINT_IDS below), built offline from the real composed
// geometry once (docs/ai/tasks/ticket-503/ring-options/evidence/
// offline-matrix.mjs/json) and reviewed/corrected by Jonesy/Ripley before
// this file existed -- never a runtime route-sampling engine.

import { composeSouthOption, composeNorthOption } from "./ringOptionGeometry.js";
import { loadGeometryDataset } from "./geometryDataset.js";

// ---------------------------------------------------------------------
// P1/P2 -- the 30 unique native points (registry id = native x/y; a
// native coordinate reused across source:vertex entries, e.g.
// 2138:0 === 8676:2, shares the SAME registry id, never a second alias).
// Native x/y/z read from the real geometry dataset via the loader;
// WGS84 computed offline (same GRS80/Lambert parameters as every prior
// round) and independently re-verified in ringOptionsRoute.test.js.
//
// P3(a) label rule: endpoints use their own place name; the five named
// heath/mountain slices (Hellisheiði/Holtavörðuheiði/Öxnadalsheiði/
// Mývatnsöræfi/Fagridalur) use "Nærri {name}"; every other ~100 km
// marker uses the fixed, reviewed "Leiðarpunktur nærri {place}" form --
// never a raw IdButur id, never an invented town name. z<=0 is "no
// elevation data", never sea level or a real height.
export const RING_OPTION_POINTS = [
  { id: "raudavatn-route", labelIs: "Rauðavatn", labelEn: "Rauðavatn", lat: 64.10152892, lon: -21.75906405, sourceId: 1436, vertexIndex: 3, nativeX: 365522.0175, nativeY: 402772.762, nativeZ: 0 },
  { id: "hellisheidi-east-route", labelIs: "Hellisheiði — austanverð leið", labelEn: "Hellisheiði — east side", lat: 64.0220354, lon: -21.30237752, sourceId: 2117, vertexIndex: 5, nativeX: 387447.6056, nativeY: 393025.2882, nativeZ: 0 },
  { id: "selfoss-route", labelIs: "Selfoss", labelEn: "Selfoss", lat: 63.93759501, lon: -21.00380428, sourceId: 2138, vertexIndex: 0, nativeX: 401739.85, nativeY: 383119.047, nativeZ: 16.877 },
  { id: "hellisheidi-west-route", labelIs: "Hellisheiði — vestanverð leið", labelEn: "Hellisheiði — west side", lat: 64.02209738, lon: -21.30211162, sourceId: 2134, vertexIndex: 6, nativeX: 387460.85, nativeY: 393031.72, nativeZ: 0 },
  { id: "hella-route", labelIs: "Hella", labelEn: "Hella", lat: 63.83460815, lon: -20.40236144, sourceId: 3591, vertexIndex: 0, nativeX: 430972.1263, nativeY: 370845.6043, nativeZ: 28.6819 },
  { id: "nordura-route", labelIs: "Leiðarpunktur nærri Norðurá", labelEn: "Route point near Norðurá", lat: 64.80100772, lon: -21.46502232, sourceId: 2753, vertexIndex: 2, nativeX: 382885.8765, nativeY: 480099.5847, nativeZ: 60.7962 },
  { id: "holtavorduheidi-route", labelIs: "Nærri Holtavörðuheiði", labelEn: "Near Holtavörðuheiði", lat: 64.98778171, lon: -21.05499746, sourceId: 3408, vertexIndex: 1, nativeX: 403035.5, nativeY: 500214.02, nativeZ: 392.4806 },
  { id: "gljufura-route", labelIs: "Leiðarpunktur nærri Gljúfurá", labelEn: "Route point near Gljúfurá", lat: 65.45523809, lon: -20.55584995, sourceId: 3569, vertexIndex: 1, nativeX: 427864.62, nativeY: 551641.13, nativeZ: 65.8826 },
  { id: "kjalkavegur-route", labelIs: "Leiðarpunktur nærri Kjálkavegi", labelEn: "Route point near Kjálkavegur", lat: 65.43343935, lon: -19.16043028, sourceId: 2736, vertexIndex: 3, nativeX: 492554.9048, nativeY: 548332.4551, nativeZ: 95.6991 },
  { id: "oxnadalsheidi-route", labelIs: "Nærri Öxnadalsheiði", labelEn: "Near Öxnadalsheiði", lat: 65.46800234, lon: -18.69561144, sourceId: 3258, vertexIndex: 1, nativeX: 514107.18, nativeY: 552210.51, nativeZ: 544.4727 },
  { id: "ljosavatnsskard-route", labelIs: "Leiðarpunktur nærri Ljósavatnsskarði", labelEn: "Route point near Ljósavatnsskarð", lat: 65.7037007, lon: -17.62203344, sourceId: 3391, vertexIndex: 2, nativeX: 563285.5868, nativeY: 579146.1259, nativeZ: 119.6414 },
  { id: "myvatnsoraefi-route", labelIs: "Nærri Mývatnsöræfum", labelEn: "Near Mývatnsöræfi", lat: 65.64729486, lon: -16.82595479, sourceId: 3420, vertexIndex: 1, nativeX: 600051.4, nativeY: 573887.63, nativeZ: 419.3205 },
  { id: "biskupshals-route", labelIs: "Leiðarpunktur nærri Biskupshálsi", labelEn: "Route point near Biskupsháls", lat: 65.56371318, lon: -16.02887191, sourceId: 3325, vertexIndex: 2, nativeX: 637148.2723, nativeY: 566071.3501, nativeZ: 500.3798 },
  { id: "fellabaer-route", labelIs: "Leiðarpunktur nærri Fellabæ", labelEn: "Route point near Fellabær", lat: 65.36973288, lon: -14.52797393, sourceId: 3440, vertexIndex: 4, nativeX: 707862.7295, nativeY: 548575.514, nativeZ: 189.7738 },
  { id: "fagridalur-route", labelIs: "Nærri Fagradal", labelEn: "Near Fagridalur", lat: 65.09327459, lon: -14.32871136, sourceId: 2426, vertexIndex: 1, nativeX: 719383.51, nativeY: 518507.73, nativeZ: 0 },
  { id: "breiddalsvik-route", labelIs: "Leiðarpunktur nærri Breiðdalsvík", labelEn: "Route point near Breiðdalsvík", lat: 64.79326082, lon: -13.93645298, sourceId: 3832, vertexIndex: 2, nativeX: 740443.85, nativeY: 486587.01, nativeZ: 12.357 },
  { id: "thvotta-route", labelIs: "Leiðarpunktur nærri Þvottá", labelEn: "Route point near Þvottá", lat: 64.49613488, lon: -14.47545899, sourceId: 3167, vertexIndex: 1, nativeX: 717264.02, nativeY: 451607.03, nativeZ: 16.2646 },
  { id: "hofn-route", labelIs: "Leiðarpunktur nærri Höfn", labelEn: "Route point near Höfn", lat: 64.157141, lon: -15.94023451, sourceId: 3187, vertexIndex: 1, nativeX: 648823.46, nativeY: 409639.78, nativeZ: 16.0042 },
  { id: "kirkjubaejarklaustur-route", labelIs: "Leiðarpunktur nærri Kirkjubæjarklaustri", labelEn: "Route point near Kirkjubæjarklaustur", lat: 63.95659416, lon: -17.45932652, sourceId: 1964, vertexIndex: 1, nativeX: 575503.254, nativeY: 384599.86, nativeZ: 55.244 },
  { id: "myrdalssandur-route", labelIs: "Leiðarpunktur nærri Mýrdalssandi", labelEn: "Route point near Mýrdalssandur", lat: 63.43723005, lon: -18.85790357, sourceId: 3736, vertexIndex: 1, nativeX: 507094.51, nativeY: 325782.82, nativeZ: 0 },
  { id: "hvolsvollur-route", labelIs: "Leiðarpunktur nærri Hvolsvelli", labelEn: "Route point near Hvolsvöllur", lat: 63.83432189, lon: -20.40208165, sourceId: 3638, vertexIndex: 2, nativeX: 430985.188, nativeY: 370813.392, nativeZ: 28.638 },
  { id: "steinar-route", labelIs: "Leiðarpunktur nærri Steinum", labelEn: "Route point near Steinar", lat: 63.49974764, lon: -19.40607089, sourceId: 3852, vertexIndex: 0, nativeX: 479770.8197, nativeY: 332810.4508, nativeZ: 56.632 },
  { id: "nupsstadur-route", labelIs: "Leiðarpunktur nærri Núpsstað", labelEn: "Route point near Núpsstaður", lat: 63.79467017, lon: -18.03969197, sourceId: 8675, vertexIndex: 4, nativeX: 547338.551, nativeY: 365986.872, nativeZ: 0 },
  { id: "fagurholsmyri-route", labelIs: "Leiðarpunktur nærri Fagurhólsmýri", labelEn: "Route point near Fagurhólsmýri", lat: 63.93728359, lon: -16.43378966, sourceId: 3751, vertexIndex: 0, nativeX: 625826.6636, nativeY: 384081.1425, nativeZ: 23.8262 },
  { id: "hvalnes-route", labelIs: "Leiðarpunktur nærri Hvalnesi", labelEn: "Route point near Hvalnes", lat: 64.37510356, lon: -14.92390677, sourceId: 3701, vertexIndex: 4, nativeX: 696630.86, nativeY: 436677.54, nativeZ: 26.0055 },
  { id: "djupivogur-route", labelIs: "Leiðarpunktur nærri Djúpavogi", labelEn: "Route point near Djúpivogur", lat: 64.73397433, lon: -14.3387266, sourceId: 3265, vertexIndex: 0, nativeX: 721864.801, nativeY: 478526.3063, nativeZ: 20.6113 },
  { id: "haereksstadir-route", labelIs: "Leiðarpunktur nærri Háreksstöðum", labelEn: "Route point near Háreksstaðir", lat: 65.45920424, lon: -15.50762717, sourceId: 3190, vertexIndex: 0, nativeX: 661829.8422, nativeY: 555666.8264, nativeZ: 463.1281 },
  { id: "myvatnsheidi-route", labelIs: "Leiðarpunktur nærri Mývatnsheiði", labelEn: "Route point near Mývatnsheiði", lat: 65.5971576, lon: -17.19510017, sourceId: 3498, vertexIndex: 4, nativeX: 583227.69, nativeY: 567765.01, nativeZ: 329.9139 },
  { id: "langidalur-route", labelIs: "Leiðarpunktur nærri Langadal", labelEn: "Route point near Langidalur", lat: 65.65304918, lon: -20.18322256, sourceId: 2456, vertexIndex: 2, nativeX: 445551.55, nativeY: 573318.24, nativeZ: 0 },
  // P3(a) explicit example from the approved prompt: NOT "Hvalfjarðargöng-Grundartangi".
  { id: "grundartangi-route", labelIs: "Leiðarpunktur nærri Grundartanga", labelEn: "Route point near Grundartangi", lat: 64.34103007, lon: -21.82213655, sourceId: 3794, vertexIndex: 4, nativeX: 363641.4, nativeY: 429581.83, nativeZ: 0 },
];
const RING_OPTION_POINTS_BY_ID = new Map(RING_OPTION_POINTS.map((p) => [p.id, p]));

// P2 -- eight FROZEN, explicit, ordered point-id sequences (one per
// route-variant), read directly by the resolver. This is the actual
// execution input approved by Jonesy/Ripley (docs/ai/tasks/ticket-503/
// ring-options/approved-prompt-v1.md, "Bindandi P1-P9", P1's own frozen
// source:vertex@chainage table) -- never a coordinate-membership scan.
const VARIANT_POINT_IDS = {
  "reykjavik-raudavatn|selfoss|south": ["raudavatn-route", "hellisheidi-east-route", "selfoss-route"],
  "selfoss|reykjavik-raudavatn|south": ["selfoss-route", "hellisheidi-west-route", "raudavatn-route"],
  "reykjavik-raudavatn|selfoss|north": [
    "raudavatn-route", "nordura-route", "holtavorduheidi-route", "gljufura-route", "kjalkavegur-route",
    "oxnadalsheidi-route", "ljosavatnsskard-route", "myvatnsoraefi-route", "biskupshals-route", "fellabaer-route",
    "fagridalur-route", "breiddalsvik-route", "thvotta-route", "hofn-route", "kirkjubaejarklaustur-route",
    "myrdalssandur-route", "hvolsvollur-route", "selfoss-route",
  ],
  "selfoss|reykjavik-raudavatn|north": [
    "selfoss-route", "steinar-route", "nupsstadur-route", "fagurholsmyri-route", "hvalnes-route", "djupivogur-route",
    "fagridalur-route", "haereksstadir-route", "myvatnsoraefi-route", "myvatnsheidi-route", "oxnadalsheidi-route",
    "langidalur-route", "holtavorduheidi-route", "grundartangi-route", "raudavatn-route",
  ],
  "reykjavik-raudavatn|hella|south": ["raudavatn-route", "hellisheidi-east-route", "hella-route"],
  "hella|reykjavik-raudavatn|south": ["hella-route", "hellisheidi-west-route", "raudavatn-route"],
  "reykjavik-raudavatn|hella|north": [
    "raudavatn-route", "nordura-route", "holtavorduheidi-route", "gljufura-route", "kjalkavegur-route",
    "oxnadalsheidi-route", "ljosavatnsskard-route", "myvatnsoraefi-route", "biskupshals-route", "fellabaer-route",
    "fagridalur-route", "breiddalsvik-route", "thvotta-route", "hofn-route", "kirkjubaejarklaustur-route",
    "myrdalssandur-route", "hella-route",
  ],
  "hella|reykjavik-raudavatn|north": [
    "hella-route", "myrdalssandur-route", "kirkjubaejarklaustur-route", "hofn-route", "thvotta-route",
    "breiddalsvik-route", "fagridalur-route", "fellabaer-route", "biskupshals-route", "myvatnsoraefi-route",
    "ljosavatnsskard-route", "oxnadalsheidi-route", "kjalkavegur-route", "gljufura-route", "holtavorduheidi-route",
    "nordura-route", "raudavatn-route",
  ],
};

// P3(b) -- fixed IdButur-id tunnel guard (never a "göng" substring search,
// which would also wrongly catch 904000037 "Hvalfjarðargöng-Grundartangi"
// and 909350037 "Akureyri-Vaðlaheiðargöng", both ordinary roads). None of
// the frozen points above resolve to one of these three lines; this is a
// defensive invariant check, not expected to ever trigger.
// Exported (not just used locally) so ticket #503 ring-completion's own
// generic-pair module can reuse the exact same tunnel-id set and EN name
// table, rather than a second, possibly-drifting copy.
export const TUNNEL_IDBUTUR_IDS = new Set([904690037, 909000037, 911260037]);

// P3(c) -- fixed, reviewed EN translations for all 72 real IdButur names
// touched across the eight variants (0 of 72 existed in any prior table).
// Proper names are kept unchanged; en-dash normalizes every hyphenated
// compound; the three tunnel lines get an explicit "X Tunnel" rendering
// (also applied to the two ordinary roads whose own name happens to
// include one of those tunnel names, e.g. "Hvalfjarðargöng-Grundartangi",
// for display consistency -- this does NOT change tunnel-guard matching,
// which stays a fixed-id check against the three tunnel segments only).
export const IDBUTUR_NAME_EN = {
  "Hellisheiði til austurs": "Hellisheiði eastbound",
  "Fossvellir-Þrengslavegur": "Fossvellir–Þrengslavegur",
  "Víðigerði-Gljúfurá": "Víðigerði–Gljúfurá",
  "Skaftárunguvegur-Skálm": "Skaftárunguvegur–Skálm",
  "Vík": "Vík",
  "Hafnarfjall": "Hafnarfjall",
  "Reykjahlíð": "Reykjahlíð",
  "Hornafjarðarfljót": "Hornafjarðarfljót",
  "Fagurhólsmýri-Freysnes": "Fagurhólsmýri–Freysnes",
  "Klaustur-Núpsstaður": "Klaustur–Núpsstaður",
  "Eldhraun": "Eldhraun",
  "Mýrdalssandur": "Mýrdalssandur",
  "Reynisfjall": "Reynisfjall",
  "Dyrhólavegur-Steinar": "Dyrhólavegur–Steinar",
  "Hella-Þjórsá": "Hella–Þjórsá",
  "Markarfljót-Steinar": "Markarfljót–Steinar",
  "Hvolsvöllur-Markarfljót": "Hvolsvöllur–Markarfljót",
  "Hvolsvöllur-Hella": "Hvolsvöllur–Hella",
  "Þrengslavegur-Fossvellir": "Þrengslavegur–Fossvellir",
  "Hellisheiði til vesturs": "Hellisheiði westbound",
  "Selfoss-Hveragerði": "Selfoss–Hveragerði",
  "Þjórsá-Selfoss": "Þjórsá–Selfoss",
  "Nesjavallaleið - Geirland": "Nesjavallaleið–Geirland",
  "Vesturlandsvegur": "Vesturlandsvegur",
  "Kjalarnes": "Kjalarnes",
  "Hvalfjarðargöng-Grundartangi": "Hvalfjörður Tunnel–Grundartangi",
  "Melasveit": "Melasveit",
  "Borgarnes-Baulan": "Borgarnes–Baulan",
  "Baulan-Norðurá": "Baulan–Norðurá",
  "Holtavörðuheiði": "Holtavörðuheiði",
  "Hvalfjarðargöng": "Hvalfjörður Tunnel",
  "Staðarskáli-Hvammstangavegur": "Staðarskáli–Hvammstangavegur",
  "Hvammstangavegur-Víðigerði": "Hvammstangavegur–Víðigerði",
  "Gljúfurá-Blönduós": "Gljúfurá–Blönduós",
  "Langidalur": "Langidalur",
  "Vatnsskarð": "Vatnsskarð",
  "Varmahlíð-Kjálkavegur": "Varmahlíð–Kjálkavegur",
  "Kjálkavegur - Fremri-Kot": "Kjálkavegur–Fremri-Kot",
  "Vaðlaheiðargöng": "Vaðlaheiði Tunnel",
  "Öxnadalsheiði": "Öxnadalsheiði",
  "Öxnadalur": "Öxnadalur",
  "Ólafsfjarðarvegur-Akureyri": "Ólafsfjarðarvegur–Akureyri",
  "Ljósavatnsskarð": "Ljósavatnsskarð",
  "Akureyri-Vaðlaheiðargöng": "Akureyri–Vaðlaheiði Tunnel",
  "Akureyri": "Akureyri",
  "Fljótsheiði": "Fljótsheiði",
  "Mývatnsheiði": "Mývatnsheiði",
  "Mývatnssveit": "Mývatnssveit",
  "Mývatnsöræfi": "Mývatnsöræfi",
  "Biskupsháls": "Biskupsháls",
  "Háreksstaðaleið N": "Háreksstaðaleið N",
  "Háreksstaðaleið S": "Háreksstaðaleið S",
  "Jökuldalur": "Jökuldalur",
  "Hlíðarvegur-Fellabær": "Hlíðarvegur–Fellabær",
  "Egilsstaðir": "Egilsstaðir",
  "Breiðdalsvík-Streiti": "Breiðdalsvík–Streiti",
  "Fagridalur": "Fagridalur",
  "Fáskrúðsfjarðargöng": "Fáskrúðsfjörður Tunnel",
  "Fáskrúðsfjörður-Stöðvarfjörður": "Fáskrúðsfjörður–Stöðvarfjörður",
  "Stöðvarfjörður-Breiðdalsvík": "Stöðvarfjörður–Breiðdalsvík",
  "Reyðarfjörður": "Reyðarfjörður",
  "Fáskrúðsfjörður": "Fáskrúðsfjörður",
  "Streiti - Djúpivogur": "Streiti–Djúpivogur",
  "Djúpivogur-Þvottá": "Djúpivogur–Þvottá",
  "Þvottá-Hvalnes": "Þvottá–Hvalnes",
  "Hvalnes-Höfn": "Hvalnes–Höfn",
  "Jökulsá-Höfn": "Jökulsá–Höfn",
  "Breiðamerkursandur": "Breiðamerkursandur",
  "Fagurhólsmýri-Kvísker": "Fagurhólsmýri–Kvísker",
  "Skeiðarársandur": "Skeiðarársandur",
  "Suðurlandsv. um Hádegismóa": "Suðurlandsvegur around Hádegismóar",
  "Rauðavatn - Nesjavallaleið": "Rauðavatn–Nesjavallaleið",
};

// P3(c) -- the one IS display string that is also expanded (not merely
// translated to EN): "Suðurlandsv." -> "Suðurlandsvegur" (the raw
// retained name is an abbreviation, never shown verbatim in the UI).
export const IDBUTUR_NAME_IS_DISPLAY_OVERRIDE = {
  "Suðurlandsv. um Hádegismóa": "Suðurlandsvegur um Hádegismóa",
};

// P4(c) -- ring routes use an ABSOLUTE length threshold, not the 1% used
// by the Westfjords modules (which would wrongly flag 19-20 perfectly
// normal ~1000 km-route sections, e.g. Hvalfjarðargöng at 0.46%).
export const RING_EDGE_SEGMENT_LENGTH_THRESHOLD_M = 100;

const RING_PAIR_KEYS = new Set([
  "reykjavik-raudavatn|selfoss", "selfoss|reykjavik-raudavatn",
  "reykjavik-raudavatn|hella", "hella|reykjavik-raudavatn",
]);

export function isRingOptionPair(from, to) {
  return RING_PAIR_KEYS.has(`${from}|${to}`);
}

export function isValidRingOption(option) {
  return option === "south" || option === "north";
}

// P6(a) -- fixed bucket name per variant: direction + option + the
// server-recomputed geometryId (never a client-supplied string). No
// reverse-sharing (unlike the Westfjords modules' own canonical-order
// sharing) -- forward and reverse are always two separate buckets (P6a).
export function ringOptionCacheKey(from, to, option, geometryId) {
  return `winter-route-data:ring:${from}|${to}|${option}|${geometryId}`;
}

function expandSliceVertices(linesById, slice) {
  const line = linesById.get(slice.sourceId);
  const lo = Math.min(slice.fromIndex, slice.toIndex), hi = Math.max(slice.fromIndex, slice.toIndex);
  const span = line.vertices.slice(lo, hi + 1);
  return slice.direction === "forward" ? span : [...span].reverse();
}

// Resolves the real composed geometry for an allowlisted ring-option
// variant. Returns { ok:false } for any pair/option outside the eight
// allowlisted variants, for an invalid option string, or (defensively)
// if a frozen point were ever bound to a tunnel line.
export function resolveRingOptionGeometry(from, to, option) {
  if (!isRingOptionPair(from, to)) return { ok: false, reason: "unsupported_pair" };
  if (!isValidRingOption(option)) return { ok: false, reason: "invalid_option" };

  const dataset = loadGeometryDataset();
  const compose = option === "south" ? composeSouthOption : composeNorthOption;
  const result = compose(from, to, dataset);
  if (result.status !== "geometry_only") return { ok: false, reason: result.reason ?? "geometry_unavailable" };

  const linesById = result.linesById;

  // P4(a) -- aggregate per IdButur in FIRST-COME-ORDER globally (not just
  // consecutive slices): a ring route can revisit the same IdButur after
  // a gap (914020037 on both reverse-north variants), and that must still
  // collapse into ONE section with one summed length and one stable key,
  // never two separate entries for the same real road id.
  const idButurOrder = [];
  const seenIdButur = new Set();
  const lengthByIdButur = new Map();
  const nameIsByIdButur = new Map();
  for (const slice of result.slices) {
    if (slice.idbutur == null) continue;
    if (!seenIdButur.has(slice.idbutur)) {
      seenIdButur.add(slice.idbutur);
      idButurOrder.push(slice.idbutur);
    }
    lengthByIdButur.set(slice.idbutur, (lengthByIdButur.get(slice.idbutur) ?? 0) + slice.lengthM);
    if (!nameIsByIdButur.has(slice.idbutur)) nameIsByIdButur.set(slice.idbutur, linesById.get(slice.sourceId).name);
  }

  const idButurSections = idButurOrder.map((idButur) => {
    const routeLengthM = lengthByIdButur.get(idButur);
    const rawNameIs = nameIsByIdButur.get(idButur);
    return {
      idButur,
      nameIs: IDBUTUR_NAME_IS_DISPLAY_OVERRIDE[rawNameIs] ?? rawNameIs,
      nameEn: IDBUTUR_NAME_EN[rawNameIs] ?? rawNameIs,
      routeLengthM,
      routeLengthFraction: routeLengthM / result.lengthM,
      isEdgeSegment: routeLengthM < RING_EDGE_SEGMENT_LENGTH_THRESHOLD_M,
    };
  });

  const unmappedLengthM = result.slices.filter((s) => s.idbutur == null).reduce((sum, s) => sum + s.lengthM, 0);

  const variantKey = `${from}|${to}|${option}`;
  const pointIds = VARIANT_POINT_IDS[variantKey];
  if (!pointIds) return { ok: false, reason: "unsupported_pair" }; // unreachable given the checks above; defensive only

  // P3(b) tunnel-binding STOP guard -- defensive invariant, should never
  // actually trigger given the frozen table above.
  for (const pid of pointIds) {
    const p = RING_OPTION_POINTS_BY_ID.get(pid);
    const onTunnel = result.slices.some((s) => s.sourceId === p.sourceId && TUNNEL_IDBUTUR_IDS.has(s.idbutur));
    if (onTunnel) return { ok: false, reason: "point_binding_invalid_tunnel" };
  }

  // P4(c)/chainage -- cumulative planar distance along the real
  // coordinate chain (same pattern as the Westfjords modules), used only
  // to locate each frozen point's own position; never used to SELECT
  // points (that's the frozen list above).
  const allCoords = [];
  const cumulativeM = [0];
  result.slices.forEach((slice, i) => {
    const verts = expandSliceVertices(linesById, slice);
    for (let j = i === 0 ? 0 : 1; j < verts.length; j++) {
      allCoords.push(verts[j]);
      const prev = allCoords[allCoords.length - 2] ?? verts[j];
      const segLen = Math.hypot(verts[j].x - prev.x, verts[j].y - prev.y);
      cumulativeM.push(cumulativeM[cumulativeM.length - 1] + segLen);
    }
  });
  const pointChainageKm = {};
  for (const pid of pointIds) {
    const p = RING_OPTION_POINTS_BY_ID.get(pid);
    const idx = allCoords.findIndex((c) => c.x === p.nativeX && c.y === p.nativeY);
    if (idx !== -1) pointChainageKm[pid] = cumulativeM[idx + 1] / 1000;
  }

  return {
    ok: true,
    geometryId: result.geometryId,
    datasetVersion: dataset.datasetVersion,
    policyVersion: result.policyVersion,
    lengthM: result.lengthM,
    idButurSections,
    idButurList: idButurOrder,
    unmappedLengthM,
    pointIds,
    pointChainageKm,
    selectedOption: option,
  };
}

// Resolves the ordered forecast-point DEFINITIONS (full objects, not just
// ids) for a given variant's own frozen `pointIds`.
export function ringOptionForecastPoints(pointIds) {
  return pointIds.map((id) => RING_OPTION_POINTS_BY_ID.get(id));
}
