// api/_lib/auroraDecision/resolveLocations.js
//
// Canonical, server-owned location dataset. Deliberately reads
// server_data/campsites.full.json directly rather than calling or reusing
// api/campsites.js, which is entitlement-filtered (Free/Pro) — Ticket 3's
// decision must be resolvable from the same canonical set regardless of the
// caller's tier (approved prompt §4: "Do not call or reuse the
// entitlement-filtered behavior of api/campsites.js").

import fs from "fs/promises";
import path from "path";

let cachedLocations = null;

/**
 * Loads the full canonical location dataset once per process and caches it
 * in memory (small static file, ~242 entries at time of writing). Never
 * returns entitlement-filtered data.
 */
export async function loadCanonicalLocations() {
  if (cachedLocations) return cachedLocations;
  const filePath = path.join(process.cwd(), "server_data/campsites.full.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  cachedLocations = Array.isArray(parsed) ? parsed : [];
  return cachedLocations;
}

/**
 * Resolves an array of caller-supplied canonical IDs against the canonical
 * dataset. Never trusts client-supplied lat/lon/name — only the id string is
 * taken from the request; every other field comes from canonicalLocations.
 */
export function resolveLocationIds(ids, canonicalLocations) {
  const byId = new Map(canonicalLocations.map((loc) => [loc.id, loc]));
  const resolved = [];
  const unknownIds = [];

  for (const id of ids) {
    const loc = byId.get(id);
    if (loc) resolved.push(loc);
    else unknownIds.push(id);
  }

  return { resolved, unknownIds };
}
