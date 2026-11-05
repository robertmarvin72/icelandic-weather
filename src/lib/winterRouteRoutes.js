// src/lib/winterRouteRoutes.js
//
// Ticket #491, B3 — the frontend's OWN small fixed routeId -> display
// name / expectedPointCount table. Deliberately NOT imported from
// api/_lib/winterRoute/routes.js (that file is server-only, never bundled
// into the frontend — same api/<->src boundary as winterRouteEta.js's own
// doc-comment) — this is a small, separately-maintained duplicate so the
// page can validate the backend's response (`routeId`/`expectedPointCount`)
// against ITS OWN expectation rather than trusting the response blindly.
// Route display names are literal IS/EN pairs (same convention as
// segments.js's own labelIs/labelEn), not translation keys — they are
// place names, identical in both languages, same as the existing Vík
// route's own name.

export const DEFAULT_WINTER_ROUTE_ID = "raudavatn-vik";

export const WINTER_ROUTE_OPTIONS = [
  { routeId: "raudavatn-vik", nameIs: "Rauðavatn – Vík", nameEn: "Rauðavatn – Vík", expectedPointCount: 6 },
  { routeId: "raudavatn-borgarnes", nameIs: "Rauðavatn – Borgarnes", nameEn: "Rauðavatn – Borgarnes", expectedPointCount: 4 },
];

export function expectedPointCountForRoute(routeId) {
  const found = WINTER_ROUTE_OPTIONS.find((r) => r.routeId === routeId);
  return found ? found.expectedPointCount : null;
}

export function isKnownWinterRouteId(routeId) {
  return WINTER_ROUTE_OPTIONS.some((r) => r.routeId === routeId);
}
