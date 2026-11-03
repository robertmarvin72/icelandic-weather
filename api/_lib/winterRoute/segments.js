// api/_lib/winterRoute/segments.js
//
// Ticket #486 — fixed Rauðavatn–Vík road-segment chain. IDBUTUR values and
// order are taken verbatim from docs/ai/tasks/ticket-483/route-segments.csv
// (1410010037 .. 801100037, already verified against the live faerd2017_1
// feed — all 13 present exactly once, in this order). Names are a small,
// fixed, hardcoded display label per segment (approved prompt: "Litlar
// fastar skilgreiningar í kóða eru heimilar") — not derived from the live
// feed, so an upstream name change can never desync this order (S5f).

export const WINTER_ROUTE_SEGMENTS = [
  { idButur: 1410010037, nameIs: "Rauðavatn – Nesjavallaleið", nameEn: "Rauðavatn – Nesjavallaleið" },
  { idButur: 903010037, nameIs: "Nesjavallaleið – Geirland", nameEn: "Nesjavallaleið – Geirland" },
  { idButur: 253020037, nameIs: "Fossvellir – Þrengslavegur", nameEn: "Fossvellir – Þrengslavegur" },
  { idButur: 252090037, nameIs: "Hellisheiði (til austurs)", nameEn: "Hellisheiði (eastbound)" },
  { idButur: 902030037, nameIs: "Selfoss – Hveragerði", nameEn: "Selfoss – Hveragerði" },
  { idButur: 902040037, nameIs: "Þjórsá – Selfoss", nameEn: "Þjórsá – Selfoss" },
  { idButur: 901130037, nameIs: "Hella – Þjórsá", nameEn: "Hella – Þjórsá" },
  { idButur: 901230037, nameIs: "Hvolsvöllur – Hella", nameEn: "Hvolsvöllur – Hella" },
  { idButur: 901220037, nameIs: "Hvolsvöllur – Markarfljót", nameEn: "Hvolsvöllur – Markarfljót" },
  { idButur: 901210037, nameIs: "Markarfljót – Steinar", nameEn: "Markarfljót – Steinar" },
  { idButur: 901050037, nameIs: "Dyrhólavegur – Steinar", nameEn: "Dyrhólavegur – Steinar" },
  { idButur: 901040037, nameIs: "Reynisfjall", nameEn: "Reynisfjall" },
  { idButur: 801100037, nameIs: "Vík", nameEn: "Vík" },
];

export const WINTER_ROUTE_IDBUTUR_LIST = WINTER_ROUTE_SEGMENTS.map((s) => s.idButur);

// Six frozen forecast points, reused verbatim from
// docs/ai/tasks/ticket-485/final-bounded-plan.md (coordinates/order already
// executed once in production research — ticket #485's RESEARCH GO).
// `nearIdButur` is a display cross-reference only (which segment this point
// represents for selection) — never used for forecast-response matching,
// which goes purely by coordinate order/distance (see validateForecast.js).
export const WINTER_ROUTE_FORECAST_POINTS = [
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
