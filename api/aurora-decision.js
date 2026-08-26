// api/aurora-decision.js
//
// Ticket 3 (issue #391): canonical, tier-independent Northern Lights
// decision endpoint. Combines the Ticket 1 Aurora cache, server-side
// Open-Meteo weather, and the unchanged Ticket 2 scorer into one ranked
// decision for a caller-selected set of canonical locations.
//
// POST only — the request carries a JSON body (an explicit evening date and
// an array of canonical location IDs), which does not fit cleanly in a GET
// query string. Mirrors the existing POST + JSON body convention already
// used by api/checkout.js.
//
// Request-triggered Neon connection (no `max: 1`) — mirrors api/checkout.js
// and api/_lib/getMe.js, deliberately NOT api/cron/refresh-aurora.js's
// `{ max: 1 }`, which is specific to that endpoint's infrequent
// single-flight refresh role and would throttle concurrent user requests
// here (approved prompt §1.4).
import postgres from "postgres";
import { runAuroraDecision } from "./_lib/auroraDecision/orchestrate.js";
import { loadCanonicalLocations } from "./_lib/auroraDecision/resolveLocations.js";

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, code: "method_not_allowed", error: "Method Not Allowed" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ ok: false, code: "invalid_body", error: "Request body must be valid JSON." });
  }

  try {
    const canonicalLocations = await loadCanonicalLocations();

    const result = await runAuroraDecision({
      body,
      sql,
      fetchImpl: fetch,
      now: () => new Date(),
      canonicalLocations,
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(result.httpStatus).json(result.body);
  } catch (err) {
    console.error("[aurora-decision] unexpected error:", err?.message);
    return res.status(500).json({ ok: false, code: "internal_error", error: "Internal error" });
  }
}
