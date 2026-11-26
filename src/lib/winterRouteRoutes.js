// src/lib/winterRouteRoutes.js
//
// Ticket #491, B3 — the frontend's OWN small fixed routeId -> display
// name / expectedPointCount table. Deliberately NOT imported from
// api/_lib/winterRoute/routes.js (that file is server-only, never bundled
// into the frontend — see CLAUDE.md/openMeteoAuth.js's own doc-comment on
// the api/<->src boundary) — this is a small, separately-maintained duplicate so the
// page can validate the backend's response (`routeId`/`expectedPointCount`)
// against ITS OWN expectation rather than trusting the response blindly.
// Route display names are literal IS/EN pairs (same convention as
// segments.js's own labelIs/labelEn), not translation keys — they are
// place names, identical in both languages, same as the existing Vík
// route's own name.

export const DEFAULT_WINTER_ROUTE_ID = "raudavatn-vik";

// Ticket #492, direct-flow, C1/C3 — the frontend's own copy of the exact
// expected forecast-point id order and road-segment idButur order for
// each fixed route, used ONLY to validate a `/api/winter-route` response
// before trusting it as the choose-flow's 4th ("fixed") identity kind
// (never to compute/derive anything — see C3's own "normalisering bætir
// engu við"). Deliberately NOT imported from api/_lib/winterRoute/
// routes.js (server-only, never bundled into the frontend — same
// api/<->src boundary as this file's own existing header comment) — a
// small, separately-maintained duplicate, cross-checked by
// winterRoutePairParity.test.js against the real backend definitions
// (segments.js/routes.js) via a repo-read parity test, not trusted blind.
export const WINTER_ROUTE_OPTIONS = [
  {
    routeId: "raudavatn-vik",
    nameIs: "Rauðavatn – Vík",
    nameEn: "Rauðavatn – Vík",
    expectedPointCount: 6,
    pointIdOrder: ["P1", "P2", "P3", "P4", "P5", "P6"],
    idButurOrder: [
      1410010037, 903010037, 253020037, 252090037, 902030037, 902040037,
      901130037, 901230037, 901220037, 901210037, 901050037, 901040037, 801100037,
    ],
  },
  {
    routeId: "raudavatn-borgarnes",
    nameIs: "Rauðavatn – Borgarnes",
    nameEn: "Rauðavatn – Borgarnes",
    expectedPointCount: 4,
    pointIdOrder: ["P1", "P2", "P3", "P4"],
    idButurOrder: [914020037, 903020037, 903030037, 904690037, 904000037, 904010037, 804020037, 904040037],
  },
];

export function expectedPointCountForRoute(routeId) {
  const found = WINTER_ROUTE_OPTIONS.find((r) => r.routeId === routeId);
  return found ? found.expectedPointCount : null;
}

export function isKnownWinterRouteId(routeId) {
  return WINTER_ROUTE_OPTIONS.some((r) => r.routeId === routeId);
}

export function expectedPointIdOrderForRoute(routeId) {
  return WINTER_ROUTE_OPTIONS.find((r) => r.routeId === routeId)?.pointIdOrder ?? null;
}

export function expectedIdButurOrderForRoute(routeId) {
  return WINTER_ROUTE_OPTIONS.find((r) => r.routeId === routeId)?.idButurOrder ?? null;
}

// Ticket #492, direct-flow, C1 — the ONLY two cross-pair keys the choose-
// flow's own Frá/Til submit resolves directly to a fixed `/api/winter-
// route?routeId=...` request, bypassing the geometry endpoint entirely
// (C2: geometry has no data for these two routes at all). Deliberately a
// flat two-entry map, never a sort/wildcard/generated key -- adding a
// third pair is a new product decision, not a side effect of this one.
export const WINTER_ROUTE_DIRECT_PAIRS = {
  "reykjavik-raudavatn|vik": "raudavatn-vik",
  "reykjavik-raudavatn|borgarnes": "raudavatn-borgarnes",
};

export function resolveDirectPairRouteId(from, to) {
  return WINTER_ROUTE_DIRECT_PAIRS[`${from}|${to}`] ?? null;
}
