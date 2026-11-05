// api/_lib/winterRoute/routes.js
//
// Ticket #491 — two-route allowlist. Rauðavatn–Vík (segments.js, #486,
// UNCHANGED — reused verbatim here, not redefined) plus a new
// Rauðavatn–Borgarnes definition. Every Borgarnes number below is a fixed,
// reviewed constant (B1/C1–C4, Jonesy sandbox cross-check ±0.01km,
// independently reproduced by CC in the final-validation round) — not a
// live/per-request computation. See
// docs/ai/tasks/ticket-491/final-validation/evidence-table-final.md and
// result-review-final-validation.md for sourcing/derivation.
//
// H1 (VEGHLUTI role 1/6, with the named 814700037/"Hvalfjarðargöng til
// suðurs" exclusion to avoid double-counting the tunnel) is an INFERRED
// topological approximation to the northbound direction — never a proven
// traffic/driving-direction authority, and never presented as one (see
// WinterRoute.jsx's route-specific ETA disclaimer). Roundabout arcs are not
// computed — the ~10 roundabouts the chain passes are bridged by their
// already-recorded straight native-ISN93 gap distances (B1/C2), not a new
// arc-length model.

import {
  WINTER_ROUTE_SEGMENTS as VIK_SEGMENTS,
  WINTER_ROUTE_IDBUTUR_LIST as VIK_IDBUTUR_LIST,
  WINTER_ROUTE_FORECAST_POINTS as VIK_FORECAST_POINTS,
} from "./segments.js";

// B6 — fixed IS/EN display names, taken verbatim (IS) from the retained
// WFS StuttNafnButs field for each IDBUTUR; EN is a fixed CC translation
// (flagged for owner/Jonesy review in cc-report-implementation.md, same
// convention as the Vík segment names in segments.js). Order matches the
// B6-specified færð-tenging order; 1410010037 (Rauðavatn) is the start
// reference only, never a 9th entry here.
export const BORGARNES_SEGMENTS = [
  { idButur: 914020037, nameIs: "Suðurlandsv. um Hádegismóa", nameEn: "Suðurlandsvegur via Hádegismóar" },
  { idButur: 903020037, nameIs: "Vesturlandsvegur", nameEn: "Vesturlandsvegur" },
  { idButur: 903030037, nameIs: "Kjalarnes", nameEn: "Kjalarnes" },
  { idButur: 904690037, nameIs: "Hvalfjarðargöng", nameEn: "Hvalfjörður Tunnel" },
  { idButur: 904000037, nameIs: "Hvalfjarðargöng–Grundartangi", nameEn: "Hvalfjörður Tunnel–Grundartangi" },
  { idButur: 904010037, nameIs: "Melasveit", nameEn: "Melasveit" },
  { idButur: 804020037, nameIs: "Hafnarfjall", nameEn: "Hafnarfjall" },
  { idButur: 904040037, nameIs: "Borgarnes–Baulan", nameEn: "Borgarnes–Baula" },
];

export const BORGARNES_IDBUTUR_LIST = BORGARNES_SEGMENTS.map((s) => s.idButur);

// B1 — independently recomputed (CC, this round) haversine (R=6,371,008.8m)
// sum over the 29-piece tier0 WGS84 chain plus the already-measured native
// (EPSG:3057) connection gaps, cumulative from Rauðavatn's own western
// 1436-end. Matches Jonesy's sandbox reference (P1 23.559 / P2 34.288 /
// P3 53.738 / P4 70.566 km) to within the agreed ±0.01km tolerance — no
// blocking deviation found, so these fixed figures are used as-is.
// `nearIdButur` per B6: P1/P2/P3/P4 = 903030037/904690037/804020037/904040037.
export const BORGARNES_FORECAST_POINTS = [
  {
    id: "P1",
    lat: 64.24274349,
    lon: -21.82931336,
    nearIdButur: 903030037,
    approxDistanceFromStartKm: 23.559,
    labelIs: "Kjalarnes",
    labelEn: "Kjalarnes",
  },
  {
    id: "P2",
    lat: 64.30823023,
    lon: -21.91184988,
    nearIdButur: 904690037,
    approxDistanceFromStartKm: 34.288,
    labelIs: "Norðan Hvalfjarðargöngum",
    labelEn: "North of Hvalfjörður Tunnel",
  },
  {
    id: "P3",
    lat: 64.42797038,
    lon: -21.95619825,
    nearIdButur: 804020037,
    approxDistanceFromStartKm: 53.738,
    labelIs: "Hafnarfjall",
    labelEn: "Hafnarfjall",
  },
  {
    id: "P4",
    lat: 64.55996252,
    lon: -21.89753371,
    nearIdButur: 904040037,
    approxDistanceFromStartKm: 70.566,
    labelIs: "Borgarnes-aðkoma",
    labelEn: "Borgarnes approach",
  },
];

export const DEFAULT_ROUTE_ID = "raudavatn-vik";

export const ROUTE_DEFS = new Map([
  [
    "raudavatn-vik",
    {
      routeId: "raudavatn-vik",
      nameIs: "Rauðavatn – Vík",
      nameEn: "Rauðavatn – Vík",
      segments: VIK_SEGMENTS,
      idButurList: VIK_IDBUTUR_LIST,
      forecastPoints: VIK_FORECAST_POINTS,
      expectedPointCount: VIK_FORECAST_POINTS.length,
    },
  ],
  [
    "raudavatn-borgarnes",
    {
      routeId: "raudavatn-borgarnes",
      nameIs: "Rauðavatn – Borgarnes",
      nameEn: "Rauðavatn – Borgarnes",
      segments: BORGARNES_SEGMENTS,
      idButurList: BORGARNES_IDBUTUR_LIST,
      forecastPoints: BORGARNES_FORECAST_POINTS,
      expectedPointCount: BORGARNES_FORECAST_POINTS.length,
    },
  ],
]);

/**
 * B2 — strict allowlist resolution, own-property only (Map#has/#get, never
 * a plain-object bracket lookup that could resolve an inherited property
 * like `constructor`/`toString`/`__proto__`). `rawValue` is whatever
 * `req.query?.routeId` is (itself optional-chained by the caller, since the
 * existing test mocks/some runtimes never set `req.query` at all).
 *
 * - `undefined` (missing entirely) => the default Vík route, unchanged
 *   default behaviour (S3a).
 * - an empty string, an array (repeated `?routeId=`), or any string not an
 *   own key of `ROUTE_DEFS` => `{ ok: false, reason: "invalid_route_id" }`,
 *   never echoing the input back.
 */
export function resolveRouteId(rawValue) {
  if (rawValue === undefined) {
    return { ok: true, routeId: DEFAULT_ROUTE_ID, route: ROUTE_DEFS.get(DEFAULT_ROUTE_ID) };
  }
  if (typeof rawValue !== "string" || rawValue === "" || !ROUTE_DEFS.has(rawValue)) {
    return { ok: false, reason: "invalid_route_id" };
  }
  return { ok: true, routeId: rawValue, route: ROUTE_DEFS.get(rawValue) };
}
