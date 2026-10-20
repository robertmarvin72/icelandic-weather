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
      `  nearest active station: ${best.name} (IMO ${best.station}, type=${best.type}, ele=${best.ele}m, start=${best.start}) at (${best.lat}, ${best.lon})`
    );
    log(`  haversine distance: ${bestDist.toFixed(2)} km`);
    log(`  elevation difference (point has no cited source elevation for 3 of 4 points -- see J5): station ele=${best.ele}m`);
  } else {
    log("  no station found");
  }
  log("");
}

log("Method: haversine (great-circle) distance on a spherical Earth, R=6371.0088 km. This ignores road/terrain distance and elevation difference in the horizontal distance figure. Representativeness limits: nearest-by-straight-line-distance does not account for sheltering terrain, fjord-wall effects, elevation difference, or instrument siting (unknown for both the station and the research point) -- see research-report.md J4 disposition for the full caveat.");

const text = out.join("\n");
writeFileSync(join(here, "nearest-station-distance.output.txt"), text, "utf8");
console.log(text);
