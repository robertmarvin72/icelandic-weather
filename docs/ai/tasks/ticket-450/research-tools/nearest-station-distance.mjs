// Ticket #450 v2 correction (J4). Node built-ins only, no dependencies.
// Reads only the retained vedur-stations-all-v2.json catalog (no new
// request) and computes the nearest active station to each of the 4
// research points using the haversine (great-circle) formula.
// Run: node docs/ai/tasks/ticket-450/research-tools/nearest-station-distance.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const samplesDir = join(here, "..", "samples");
const stations = JSON.parse(readFileSync(join(samplesDir, "vedur-stations-all-v2.json"), "utf8"));

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0088; // mean Earth radius, km
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Coordinates as stated in v1's report text (requested coordinates; not
// themselves present in any retained API response/request — see J5).
const POINTS = [
  { name: "Keflavíkurflugvöllur (sea level/coast)", lat: 63.9828987122, lon: -22.6005191803 },
  { name: "Ísafjörður (narrow fjord)", lat: 66.075, lon: -23.12 },
  { name: "Hveravellir (highland)", lat: 64.8667, lon: -19.5667 },
  { name: "Egilsstaðir (distinct region)", lat: 65.2669, lon: -14.3948 },
];

const out = [];
const log = (s) => out.push(s);

log(`Total stations in catalogue: ${stations.length}`);
const active = stations.filter((s) => s.ending == null);
log(`Active (ending=null) stations: ${active.length}`);
log("");

for (const p of POINTS) {
  let best = null;
  let bestDist = Infinity;
  for (const s of active) {
    if (typeof s.lat !== "number" || typeof s.lon !== "number") continue;
    const d = haversineKm(p.lat, p.lon, s.lat, s.lon);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  log(`${p.name} (${p.lat}, ${p.lon})`);
  if (best) {
    log(
      `  nearest active station (any type): ${best.name} (IMO ${best.station}, type=${best.type}, ele=${best.ele}m, start=${best.start}) at (${best.lat}, ${best.lon})`
    );
    log(`  haversine distance: ${bestDist.toFixed(2)} km`);
    log(`  station elevation ele=${best.ele}m (the research point's own elevation has no cited source for 3 of 4 points -- see J5; this is NOT a comparison, just the station's own documented value)`);
  } else {
    log("  no station found");
  }

  // v3/N1 addition: per the retained OpenAPI's own station_type description
  // ("Automatic stations: sj | Synop stations: sk | Precipitation stations:
  // ur | Climate stations: vf"), find the nearest ACTIVE station of each
  // type separately -- since whether a station actually delivers
  // precipitation data is the open question (K5.2), not just whether any
  // station exists nearby. This is a distance-only heuristic, not a
  // verified-parameter-availability check (that would require an actual
  // observation request, not done here).
  for (const type of ["sj", "sk", "ur"]) {
    let typeBest = null, typeBestDist = Infinity;
    for (const s of active) {
      if (s.type !== type) continue;
      if (typeof s.lat !== "number" || typeof s.lon !== "number") continue;
      const d = haversineKm(p.lat, p.lon, s.lat, s.lon);
      if (d < typeBestDist) { typeBestDist = d; typeBest = s; }
    }
    if (typeBest) {
      log(`  nearest active '${type}'-type station: ${typeBest.name} (IMO ${typeBest.station}, ele=${typeBest.ele}m) at ${typeBestDist.toFixed(2)} km`);
    } else {
      log(`  nearest active '${type}'-type station: none found`);
    }
  }
  log("");
}

log("Station type codes per the retained OpenAPI's own /stations station_type parameter description (vedur-openapi.json): sj = Automatic stations, sk = Synop stations, ur = Precipitation stations, vf = Climate stations.");
log("Method: haversine (great-circle) distance on a spherical Earth, R=6371.0088 km, among stations with ending=null ('active' by this heuristic only -- a geographic/active-field filter, not a verified-parameter-availability or representativeness check). This ignores road/terrain distance and elevation difference in the horizontal distance figure. Representativeness limits: nearest-by-straight-line-distance does not account for sheltering terrain, fjord-wall effects, elevation difference, or instrument siting (unknown for both the station and the research point) -- see research-report.md section 2/next-step disposition for the full caveat.");

const text = out.join("\n");
writeFileSync(join(here, "nearest-station-distance.output.txt"), text, "utf8");
console.log(text);
