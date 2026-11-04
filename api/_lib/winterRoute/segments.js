// api/_lib/winterRoute/segments.js
//
// Ticket #486 — fixed Rauðavatn–Vík road-segment chain. IDBUTUR values and
// order are taken verbatim from docs/ai/tasks/ticket-483/route-segments.csv
// (1410010037 .. 801100037, already verified against the live faerd2017_1
// feed — all 13 present exactly once, in this order). Names are a small,
// fixed, hardcoded display label per segment (approved prompt: "Litlar
// fastar skilgreiningar í kóða eru heimilar") — not derived from the live
// feed, so an upstream name change can never desync this order (S5f).

// `lengthKm` is `length_km_vegnr1_tier0` from the same retained CSV, in
// the same fixed order — reused for the ETA follow-up's distance-from-
// start approximation below (NOT a new geodata fetch: this column was
// already in the retained file, just not previously carried into code).
export const WINTER_ROUTE_SEGMENTS = [
  { idButur: 1410010037, nameIs: "Rauðavatn – Nesjavallaleið", nameEn: "Rauðavatn – Nesjavallaleið", lengthKm: 2.55 },
  { idButur: 903010037, nameIs: "Nesjavallaleið – Geirland", nameEn: "Nesjavallaleið – Geirland", lengthKm: 1.89 },
  { idButur: 253020037, nameIs: "Fossvellir – Þrengslavegur", nameEn: "Fossvellir – Þrengslavegur", lengthKm: 12.29 },
  { idButur: 252090037, nameIs: "Hellisheiði (til austurs)", nameEn: "Hellisheiði (eastbound)", lengthKm: 16.5 },
  { idButur: 902030037, nameIs: "Selfoss – Hveragerði", nameEn: "Selfoss – Hveragerði", lengthKm: 12.63 },
  { idButur: 902040037, nameIs: "Þjórsá – Selfoss", nameEn: "Þjórsá – Selfoss", lengthKm: 18.51 },
  { idButur: 901130037, nameIs: "Hella – Þjórsá", nameEn: "Hella – Þjórsá", lengthKm: 17.64 },
  { idButur: 901230037, nameIs: "Hvolsvöllur – Hella", nameEn: "Hvolsvöllur – Hella", lengthKm: 12.81 },
  { idButur: 901220037, nameIs: "Hvolsvöllur – Markarfljót", nameEn: "Hvolsvöllur – Markarfljót", lengthKm: 21.96 },
  { idButur: 901210037, nameIs: "Markarfljót – Steinar", nameEn: "Markarfljót – Steinar", lengthKm: 17.38 },
  { idButur: 901050037, nameIs: "Dyrhólavegur – Steinar", nameEn: "Dyrhólavegur – Steinar", lengthKm: 28.08 },
  { idButur: 901040037, nameIs: "Reynisfjall", nameEn: "Reynisfjall", lengthKm: 12.06 },
  { idButur: 801100037, nameIs: "Vík", nameEn: "Vík", lengthKm: 1.34 },
];

export const WINTER_ROUTE_IDBUTUR_LIST = WINTER_ROUTE_SEGMENTS.map((s) => s.idButur);

// ETA follow-up (#486): cumulative distance-from-start (Rauðavatn) at the
// START of each segment, derived purely from the lengths above — no new
// geometry/geodata. Used only to approximate each forecast point's own
// distance below; never shown to the user directly.
function cumulativeStartKm(idButur) {
  let total = 0;
  for (const seg of WINTER_ROUTE_SEGMENTS) {
    if (seg.idButur === idButur) return total;
    total += seg.lengthKm;
  }
  return null; // unreachable for a real idButur in the fixed list above
}

// No retained research gives an exact within-segment position for any of
// the 6 forecast points (confirmed: route-segments.csv has only per-segment
// totals; final-bounded-plan.md explicitly calls the points "research point
// selection, not a claim of whole-section representativeness"; ticket-483's
// own ETA harness used a flat per-position hour assumption, not a distance
// computation). The segment's own MIDPOINT is therefore used as a clearly-
// defined, honest approximation — never claimed as the point's precise
// location — and every consumer of this value must present the resulting
// ETA as approximate (see eta.js / WinterRoute.jsx).
function approxDistanceFromStartKm(nearIdButur) {
  const segment = WINTER_ROUTE_SEGMENTS.find((s) => s.idButur === nearIdButur);
  if (!segment) return null;
  const start = cumulativeStartKm(nearIdButur);
  return start + segment.lengthKm / 2;
}

// Six frozen forecast points, reused verbatim from
// docs/ai/tasks/ticket-485/final-bounded-plan.md (coordinates/order already
// executed once in production research — ticket #485's RESEARCH GO).
// `nearIdButur` is a display cross-reference AND (ETA follow-up) the basis
// for `approxDistanceFromStartKm` below — still never used for forecast-
// response matching, which goes purely by coordinate order/distance (see
// validateForecast.js).
const FORECAST_POINT_DEFS = [
  {
    id: "P1",
    lat: 64.01137995,
    lon: -21.2507017,
    nearIdButur: 252090037,
    labelIs: "Rauðavatn–Sandskeið–vestari Hellisheiði",
    labelEn: "Rauðavatn–Sandskeið–western Hellisheiði",
  },
  {
    id: "P2",
    lat: 63.96197548,
    lon: -21.11948637,
    nearIdButur: 902030037,
    labelIs: "Eystri Hellisheiði–Hveragerði–Selfoss",
    labelEn: "Eastern Hellisheiði–Hveragerði–Selfoss",
  },
  {
    id: "P3",
    lat: 63.90527541,
    lon: -20.590946,
    nearIdButur: 901130037,
    labelIs: "Selfoss–Þjórsá–Hella",
    labelEn: "Selfoss–Þjórsá–Hella",
  },
  {
    id: "P4",
    lat: 63.82344501,
    lon: -20.36083533,
    nearIdButur: 901230037,
    labelIs: "Hella–Hvolsvöllur",
    labelEn: "Hella–Hvolsvöllur",
  },
  {
    id: "P5",
    lat: 63.5496223,
    lon: -19.76249937,
    nearIdButur: 901210037,
    labelIs: "Hvolsvöllur–Skógar",
    labelEn: "Hvolsvöllur–Skógar",
  },
  {
    id: "P6",
    lat: 63.41954011,
    lon: -19.00662528,
    nearIdButur: 801100037,
    labelIs: "Skógar–Vík",
    labelEn: "Skógar–Vík",
  },
];

export const WINTER_ROUTE_FORECAST_POINTS = FORECAST_POINT_DEFS.map((p) => ({
  ...p,
  approxDistanceFromStartKm: approxDistanceFromStartKm(p.nearIdButur),
}));
