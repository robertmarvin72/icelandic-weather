// src/lib/winterRoutePlaces.js
//
// Ticket #502 — the frozen, UI-facing 11-place Frá/Til list for the new
// Winter Route "Velja staði" search/select flow. Deliberately NOT read
// from server_data/winter-route-places.json at runtime (no frontend
// import of server_data JSON, per CLAUDE.md's api/<->src boundary and
// the same convention as winterRouteRoutes.js's own routeId table) — a
// small, separately-maintained list. Its own test file cross-checks
// these names against that JSON via `fs`, at test time only, never
// bundled into the frontend.
//
// Grouping is by NETWORK membership (which geometry surface an id
// belongs to, ticket #501), not geographic region: ring-pilot ids never
// connect to Westfjords ids, so the UI groups them the same way, to make
// that non-connection visible rather than implying a search across group
// boundaries could ever find a route. `budardalur` is geographically
// "Vesturland og Snæfellsnes" in winter-route-places.json, but it is one
// of the six Westfjords network ids (ticket #501 closure-implementation),
// so it is grouped under Westfjords here, not under its places.json
// region field.

export const WINTER_ROUTE_GROUP_RING = "ring";
export const WINTER_ROUTE_GROUP_WESTFJORDS = "westfjords";
// Ticket #492, direct-flow, C6 -- a THIRD presentation group, for the two
// fixed-route-adapter places only (vik/borgarnes). This is an optgroup/
// listbox-group label only, never a route-allowlist or a claim that
// these two places connect to each other or to any other place in this
// list -- see WINTER_ROUTE_DIRECT_PAIRS (winterRouteRoutes.js), which is
// the actual (and only) source of which pairs are supported.
export const WINTER_ROUTE_GROUP_OTHER = "other";

// reykjavik-raudavatn displays as "Reykjavík (Rauðavatn)" in both
// languages (approved-prompt-v1.md P2(b)) — the parenthetical names the
// actual chosen access point (the western end of IDFERILL 1436 at
// Rauðavatn), not the city centre, same distinction places.json's own
// `approach` field for this id already makes.
export const WINTER_ROUTE_PLACES = [
  { id: "reykjavik-raudavatn", nameIs: "Reykjavík (Rauðavatn)", nameEn: "Reykjavík (Rauðavatn)", group: WINTER_ROUTE_GROUP_RING },
  { id: "selfoss", nameIs: "Selfoss", nameEn: "Selfoss", group: WINTER_ROUTE_GROUP_RING },
  { id: "hella", nameIs: "Hella", nameEn: "Hella", group: WINTER_ROUTE_GROUP_RING },
  { id: "egilsstadir", nameIs: "Egilsstaðir", nameEn: "Egilsstaðir", group: WINTER_ROUTE_GROUP_RING },
  { id: "seydisfjordur", nameIs: "Seyðisfjörður", nameEn: "Seyðisfjörður", group: WINTER_ROUTE_GROUP_RING },
  { id: "budardalur", nameIs: "Búðardalur", nameEn: "Búðardalur", group: WINTER_ROUTE_GROUP_WESTFJORDS },
  { id: "flokalundur", nameIs: "Flókalundur", nameEn: "Flókalundur", group: WINTER_ROUTE_GROUP_WESTFJORDS },
  { id: "isafjordur", nameIs: "Ísafjörður", nameEn: "Ísafjörður", group: WINTER_ROUTE_GROUP_WESTFJORDS },
  { id: "holmavik", nameIs: "Hólmavík", nameEn: "Hólmavík", group: WINTER_ROUTE_GROUP_WESTFJORDS },
  { id: "patreksfjordur", nameIs: "Patreksfjörður", nameEn: "Patreksfjörður", group: WINTER_ROUTE_GROUP_WESTFJORDS },
  { id: "talknafjordur", nameIs: "Tálknafjörður", nameEn: "Tálknafjörður", group: WINTER_ROUTE_GROUP_WESTFJORDS },
  // Ticket #492, direct-flow, C6 -- exactly these two canonical ids,
  // names taken verbatim from server_data/winter-route-places.json
  // (`vik`/`borgarnes`, both single-language names there). Reused by the
  // fixed-route adapter (WINTER_ROUTE_DIRECT_PAIRS) for exactly the two
  // explicit pairs it supports -- adding them here does NOT itself make
  // any pair supported.
  { id: "vik", nameIs: "Vík", nameEn: "Vík", group: WINTER_ROUTE_GROUP_OTHER },
  { id: "borgarnes", nameIs: "Borgarnes", nameEn: "Borgarnes", group: WINTER_ROUTE_GROUP_OTHER },
];

export function isKnownWinterRoutePlaceId(id) {
  return WINTER_ROUTE_PLACES.some((p) => p.id === id);
}

export function winterRoutePlaceName(id, lang) {
  const place = WINTER_ROUTE_PLACES.find((p) => p.id === id);
  if (!place) return id;
  return lang === "en" ? place.nameEn : place.nameIs;
}

export function winterRoutePlacesByGroup(group) {
  return WINTER_ROUTE_PLACES.filter((p) => p.group === group);
}

// Diacritic-insensitive, case-insensitive search normalization — a
// literal character table (never an NFD accent-strip), since æ/ð/þ need
// digraphs, not accent removal: "þröskuldar" -> "throskuldar", not
// "proskuldar". approved-prompt-v1.md P3(a)'s own exact mapping.
const WINTER_ROUTE_DIACRITIC_MAP = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ý: "y", ö: "o", æ: "ae", ð: "d", þ: "th",
};

export function normalizeWinterRouteSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[áéíóúýöæðþ]/g, (ch) => WINTER_ROUTE_DIACRITIC_MAP[ch] ?? ch);
}

export function winterRoutePlaceMatchesSearch(place, lang, query) {
  const normalizedQuery = normalizeWinterRouteSearchText(query).trim();
  if (!normalizedQuery) return true;
  const name = lang === "en" ? place.nameEn : place.nameIs;
  return normalizeWinterRouteSearchText(name).includes(normalizedQuery);
}
