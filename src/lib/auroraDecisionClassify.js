// src/lib/auroraDecisionClassify.js
//
// Pure classifier: transport/HTTP first, then Ticket 3's own real fields
// (ok, code, status, reason, auroraCache.state) — never re-scores, re-ranks,
// or reinterprets the canonical result itself (approved prompt §3/§4).
//
// Primary outcome (mutually exclusive): "success" | "partial" |
// "no_darkness" | "domain_unavailable" | "contract_defect" |
// "transport_error".
// Freshness (orthogonal): "fresh" | "stale" | "unavailable" | null.

function isUnambiguousNoDarkness(body) {
  // invalid_darkness_window: Ticket 3 found the requested night but its own
  // darkness window is absent/invalid — genuinely "no darkness to
  // evaluate," not a data gap.
  if (body.reason === "invalid_darkness_window") return true;

  // night_not_found is deliberately NOT treated as no-darkness here: it
  // means the cached snapshot has no record for the requested evening at
  // all — a data-availability gap, not an astronomical fact — so it maps to
  // domain_unavailable instead (see below). Inventing a semantic beyond
  // Ticket 3's own precise field meaning would risk misleading users into
  // thinking a data gap is a "no darkness tonight" fact.

  // no_locations_scored: only unambiguous when EVERY attempted location's
  // own scorer status agrees — a mix with weather-fetch failures or
  // insufficient_data is a genuinely ambiguous/generic unavailable case,
  // not "no darkness."
  if (body.reason === "no_locations_scored") {
    const excluded = Array.isArray(body.excluded) ? body.excluded : [];
    return excluded.length > 0 && excluded.every((loc) => loc?.status === "not_viewable_tonight");
  }

  return false;
}

export function classifyAuroraOutcome(outcome) {
  if (!outcome) return { primary: "transport_error", freshness: null };
  if (outcome.transportError) return { primary: "transport_error", freshness: null };

  const body = outcome.body;

  if (!outcome.httpOk) {
    if (body?.ok === false && body?.code === "unknown_location_ids") {
      return { primary: "contract_defect", freshness: null, unknownIds: body?.details?.unknownIds ?? [] };
    }
    // Any other non-2xx (validation errors that should never occur given
    // the fixed, audited candidate roster; 5xx) is a transport-shaped
    // failure from the UI's point of view — same neutral retry treatment.
    return { primary: "transport_error", freshness: null };
  }

  if (!body || typeof body !== "object" || body.ok !== true) {
    return { primary: "transport_error", freshness: null };
  }

  const freshness = body.auroraCache?.state ?? null;

  if (body.status === "success") return { primary: "success", freshness, body };
  if (body.status === "partial") return { primary: "partial", freshness, body };

  if (body.status === "unavailable") {
    if (isUnambiguousNoDarkness(body)) return { primary: "no_darkness", freshness, body };
    return { primary: "domain_unavailable", freshness, body };
  }

  return { primary: "domain_unavailable", freshness, body };
}
