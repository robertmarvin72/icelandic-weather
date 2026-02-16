// scripts/generateCampsitesFromOSM.mjs
import fs from "node:fs";
import path from "node:path";

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

// Retry + rotate endpoints
async function postOverpass(query, { tries = 8 } = {}) {
  let lastErr;

  for (let attempt = 1; attempt <= tries; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[(attempt - 1) % OVERPASS_ENDPOINTS.length];

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: new URLSearchParams({ data: query }),
      });

      const text = await res.text();

      if (!res.ok) {
        // Overpass often returns HTML errors; keep it short
        throw new Error(`Overpass error ${res.status}: ${text.slice(0, 400)}`);
      }

      // Some servers return JSON but with text/html header; parse manually
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;

      // exponential-ish backoff + a bit of jitter
      const base = Math.min(1500 * 2 ** (attempt - 1), 15000);
      const jitter = Math.floor(Math.random() * 600);
      const waitMs = base + jitter;

      console.warn(
        `Attempt ${attempt}/${tries} failed (${endpoint}). Retrying in ${waitMs}ms…\n` +
        `  ${String(e?.message || e).slice(0, 180)}`
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw lastErr;
}

// Output file
const OUT_FILE = path.resolve("server_data/campsites.full.json");

// Query notes:
// - Using ISO3166-1 alpha2 (IS) is often more reliable than name="Ísland".
// - Keep output light: "out tags center;"
// - Increase timeout to survive busy instances.
const QUERY = `
[out:json][timeout:180];
/* Iceland (try ISO first, fallback by name if needed) */
area["ISO3166-1"="IS"]["boundary"="administrative"]->.is;
(
  nwr["tourism"="camp_site"](area.is);
  nwr["tourism"="caravan_site"](area.is);
);
out tags center;
`;

function stableId(el) {
  // Stable + unique across runs
  return `osm_${el.type}_${el.id}`;
}

function pickLatLon(el) {
  // nodes have lat/lon, ways/relations have center
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center && typeof el.center.lat === "number" && typeof el.center.lon === "number") {
    return { lat: el.center.lat, lon: el.center.lon };
  }
  return { lat: null, lon: null };
}

async function run() {
  console.log("Fetching OSM campsites via Overpass…");

  // ✅ Use retry/rotation helper (this was missing before)
  const json = await postOverpass(QUERY, { tries: 8 });

  const elements = Array.isArray(json?.elements) ? json.elements : [];

  const rows = elements
    .map((el) => {
      const name = el.tags?.name?.trim();
      const { lat, lon } = pickLatLon(el);

      // Basic quality filters
      if (!name) return null;
      if (lat == null || lon == null) return null;

      return {
        id: stableId(el),
        name,
        lat: Number(lat.toFixed(6)),
        lon: Number(lon.toFixed(6)),
      };
    })
    .filter(Boolean);

  // De-dupe by id (safe)
  const byId = new Map();
  for (const r of rows) byId.set(r.id, r);

  // Optional: sort alphabetically for clean diffs
  const out = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, "is"));

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log(`✅ Wrote ${out.length} campsites to ${OUT_FILE}`);
  console.log(`(IDs are stable OSM ids: osm_<type>_<id>)`);
}

run().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});
