// src/config/auroraCandidates.js
//
// Ticket 4 (issue #392) — critical preflight finding, recorded here and in
// cc-report.md:
//
// /api/aurora-decision (Ticket 3) requires explicit canonical location IDs
// resolved against server_data/campsites.full.json. Every existing
// client-side candidate source (useCampsites' siteList, top5, Route
// Planner's candidate search) is drawn from the TIER-FILTERED /api/campsites
// response (Free gets campsites.limited.json, Pro gets campsites.full.json)
// — reusing any of them would make Free and Pro select different Aurora
// candidates for the same context, which this ticket's canonical-request
// requirement forbids. No existing tier-independent, multi-location
// candidate-discovery endpoint exists, and building one (a new route, or a
// new param on an existing route) is out of this ticket's UI-only/
// no-new-backend scope. Importing campsites.full.json into the frontend is
// separately forbidden (see AGENTS.md gotchas).
//
// Resolution: a small, fixed, versioned roster of canonical location IDs,
// used IDENTICALLY for every request regardless of tier or the user's
// currently selected site. This sidesteps tier-dependent candidate
// selection entirely — there is no "selection" step at all, just a constant
// list. IDs were verified against server_data/campsites.full.json at
// authoring time and chosen for rough geographic spread across Iceland
// (a genuinely useful product answer to "where's best for aurora viewing
// across the country tonight", not an arbitrary technical workaround).
//
// Bump AURORA_CANDIDATE_VERSION if this roster ever changes, so any cached
// request identity (see src/lib/auroraCandidateRequest.js) naturally
// invalidates rather than mixing old and new candidate sets.

export const AURORA_CANDIDATE_VERSION = "1";

export const AURORA_CANDIDATE_LOCATION_IDS = [
  "osm_way_712155124", // Camper Resort Reykjavík — capital area / southwest
  "osm_relation_17808139", // Vík í Mýrdal — south
  "osm_relation_13660177", // Höfn í Hornafirði — southeast
  "osm_way_249836961", // Camp Egilsstaðir — east
  "osm_way_202178652", // Tjaldsvæðið á Þórshöfn — north
  "osm_way_233309453", // Breiðavík við Látrabjarg — Westfjords
];
