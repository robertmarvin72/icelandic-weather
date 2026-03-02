// scripts/migrateLimitedToOsm.mjs
import fs from "node:fs";
import path from "node:path";

const FULL_FILE = path.resolve("src/data/campsites.full.json");
const LIMITED_FILE = path.resolve("src/data/campsites.limited.json");

// output (skrifar yfir limited eða í nýja skrá — þú velur)
const OUT_FILE = path.resolve("src/data/campsites.limited.json");
// const OUT_FILE = path.resolve("src/data/campsites.limited.osm.json");

// Haversine distance (km)
function distanceKm(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function normName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function main() {
  const full = readJson(FULL_FILE);
  const limited = readJson(LIMITED_FILE);

  if (!Array.isArray(full) || !full.length) throw new Error("FULL is empty");
  if (!Array.isArray(limited) || !limited.length) throw new Error("LIMITED is empty");

  // sanity: full should be osm_ ids
  const fullBad = full.find((x) => !String(x?.id || "").startsWith("osm_"));
  if (fullBad) {
    console.warn("⚠️ FULL has non-osm id row:", fullBad);
  }

  const MAX_KM = 2.0; // robust threshold (2km). You can lower to 0.5km if you want strict.
  const results = [];
  const unmatched = [];

  for (const l of limited) {
    const lPos = { lat: l.lat, lon: l.lon };

    let best = null;
    let bestKm = Infinity;

    for (const f of full) {
      const km = distanceKm(lPos, { lat: f.lat, lon: f.lon });
      if (km < bestKm) {
        bestKm = km;
        best = f;
      }
    }

    // optional: name sanity (not required, but helpful)
    const nameOk = best && normName(best.name).includes(normName(l.name).split(" ")[0]);

    if (!best || bestKm > MAX_KM) {
      unmatched.push({ legacyId: l.id, name: l.name, lat: l.lat, lon: l.lon, bestKm });
      continue;
    }

    results.push({
      id: best.id, // ✅ OSM id becomes primary
      legacyId: l.id, // ✅ keep old id for backwards compat
      name: best.name || l.name,
      lat: best.lat,
      lon: best.lon,
      // debug (optional): distance from legacy point to matched full point
      _matchKm: Math.round(bestKm * 1000) / 1000,
      _nameHintOk: !!nameOk,
    });
  }

  // Sort for clean diffs
  results.sort((a, b) => String(a.name).localeCompare(String(b.name), "is"));

  writeJson(OUT_FILE, results);

  console.log(`✅ Migrated limited -> OSM`);
  console.log(`   matched:   ${results.length}`);
  console.log(`   unmatched: ${unmatched.length}`);
  if (unmatched.length) {
    console.log("⚠️ Unmatched rows (inspect):");
    console.log(unmatched);
    process.exitCode = 1; // so CI can catch if you want
  }
}

main();
