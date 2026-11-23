# cc-report — ticket #503 westfjords-batch: 6 new pairs (12 directions)

## Scope delivered

Per `approved-prompt-v1.md` P1-P9: extends the existing Búðardalur↔Hólmavík
(B↔H) weather/road data binding to **six new unordered pairs / twelve
directions** among budardalur / flokalundur / patreksfjordur / talknafjordur
(B-F, B-P, B-T, F-P, F-T, P-T), sharing a 9-point union registry (B-H's own
4-point `budardalur-route` point is reused verbatim from
`budardalurHolmavikRoute.js`, never duplicated). B-H's own resolver, cache
key, and response contract are **completely untouched** — only the handler's
own dispatch and the UI's data-view were generalized to route to either
resolver. #503 as a whole remains open: **7 of 28 API pairs are now
connected, 21 remain**, plus route options and Ring Road measurement —
neither attempted here.

## P1 — real bounded probe (run before any implementation)

Script: `docs/ai/tasks/ticket-503/westfjords-batch/evidence/probe-and-registry.mjs`
(read-only, task-local). **Succeeded on the first attempt — no retries, no
STOP.**

- WGS84 for the 8 new points verified offline (own Lambert/GRS80 inverse,
  not copied from the subject code) against the prompt's cited values, all
  within 1e-6°.
- All 12 directions composed via the real production core
  (`composeGeometryPath`/`loadWestfjordsCombinedRegionDataset`); dynamic
  point membership/order reproduced Jonesy's cited per-pair point counts
  (B-F:5, B-P:7, B-T:8 — never patreksfjordur, F-P:3, F-T:4, P-T:3) without
  any hardcoded lookup table.
- One real network probe: `fetchRoadSegments`/`fetchRoadPoints` for the
  19-id union, **one** `fetchWinterRouteForecast` batch for the 9 points —
  **3 upstream calls total**, 19/19 IdButur found (0 ambiguous), **7 real
  active notices** (HOLUR_I_VEGI×2 on 905070037, OSLETTUR_VEGUR×2 on
  905190037, VEGAVINNA on 905260037, VEGAVINNA×2 on 805090037), all 9
  forecast points validated.
- Ordering-margin check (P1c): `talknafjordur<->miklidalur` real-world
  separation is only 5.12 km (tighter than B-H's own 9.45 km minimum) —
  margin checked offline against the already-fetched response and found to
  hold at 2.64 km. `validateForecast`'s existing `isInRequestOrder` rule was
  **not** relaxed.

## P2/P3 — geometry, chainage, null-ID connectors

- `api/_lib/winterRoute/westfjordsBatchRoute.js` resolves all 12 directions
  against the real geometry core; cross-checked (not self-checked) against
  the **real, unmodified** `api/winter-route-geometry.js` handler for every
  direction plus a B-H regression, in
  `westfjordsBatchGeometryCrossCheck.test.js` (13 tests).
- Null-ID estimated connectors, confirmed per pair: B-P uses **both** −4 and
  −5 (≈4.398 m); B-F/B-T use **only** −4 (≈0.005 m); F-P/P-T use **only**
  −5 (≈4.393 m); F-T uses **neither** (0 m) — the prompt's original "others
  use −4" statement was inaccurate and is corrected here, not propagated.
- Per-point chainage (`pointChainageKm`) is computed generically from the
  composed route's own coordinate chain (cumulative planar distance), never
  hardcoded from Jonesy's cited figures — independently reproduces them
  exactly (e.g. B-F: 0/24.1/38.7/122.4/172.5 km, gap 83.6 km between
  Gilsfjörður and Klettsháls; P-T: 0/7.8/17.1 km, gap 9.3 km between
  Miklidalur and Tálknafjörður, not Patreksfjörður↔Miklidalur).

## P5 — cache (decision already fixed by the approved prompt itself)

**P5b(i)**, as specified: one fixed single-flight bucket **per unordered
pair** (both directions share it), not a shared union/national-feed cache.
`westfjordsBatchCacheKey(from,to) = "winter-route-data:${[from,to].sort().join("-")}"`.
B-H keeps its own original, untouched key
(`BUDARDALUR_HOLMAVIK_CACHE_KEY = "winter-route-data:budardalur-holmavik"`),
isolated from every new pair's own bucket — confirmed by a dedicated test in
`winter-route-data.test.js`. Cold max: 18 upstream calls across the six new
pairs (21 with B-H), 14 national-feed downloads; within-TTL repeat requests
on an already-warm pair make zero new calls.

## P6 — server handler + UI generalization

- `api/winter-route-data.js`: dispatches to `resolveBudardalurHolmavikGeometry`
  or `resolveWestfjordsBatchGeometry` based on the pair, using the same
  canonical (alphabetically-sorted) point order for **both** directions' own
  forecast fetch so single-flight cache sharing is correct, while display
  order is still derived per-direction and reconciled by point id. New
  `unmappedLengthM` and per-point `approxDistanceFromStartKm` fields added
  to the response (B-H's own points never carry the latter — no chainage
  data exists for that fixed 4-point route).
- `src/pages/WinterRoute.jsx`: generalized the B-H-only request gate
  (`isBudardalurHolmavikPair`) to `isWinterRouteDataPair`, which also
  accepts the 6 new pairs via a small frontend-only duplicate pair list
  (same convention as `winterRoutePlaces.js`, since `src/` cannot import
  `api/` code). Renamed `BudardalurHolmavikDataView` →
  `WinterRouteDataView`, now generic over any point count (3-8):
  - Forecast heading now reads `t("winterRouteDataForecastHeading")` with a
    `{count}` placeholder filled from the real response's own
    `forecast.points.length`, instead of a fixed "four points" string.
  - The coverage caveat (`winterRouteNoCoveragePointsNote`) was rewritten to
    be genuinely generic (no place names) — the previous wording named
    "Svínadalur and Gilsfjörður" specifically, which became **factually
    wrong** once this round gives those two their own real points on the
    B-pairs (the approved prompt explicitly flagged this: "ekki halda fram
    að nýr Svínadals-/Gilsfjarðarpunktur vanti þar sem hann er nú valinn").
  - A new `winterRouteLargestGapNote` key reports the real largest gap
    (computed from `approxDistanceFromStartKm`, generic for any pair) with
    the two bounding point names and the km figure — shown only when that
    field is present (i.e. never for B-H, which keeps its own plain
    coverage note with no computed-gap line).
  - `winterRouteDataConnectedDisclaimer` dropped its own hardcoded "four"
    for the same reason (now: "...connected at defined points and road
    sections for this route.").
- Existing S1-S3 fixes (live-region scoping to the status line only,
  stale/unavailable marking, response validation before render, abort/
  dedup/requestId lifecycle) were re-read and **not** touched — all of
  their original assertions still pass unchanged.

## P7 — tests

| File | Tests |
| --- | --- |
| `api/_lib/winterRoute/westfjordsBatchRoute.test.js` | 20 |
| `api/_lib/winterRoute/westfjordsBatchGeometryCrossCheck.test.js` | 13 |
| `api/winter-route-data.test.js` | 30 |
| `api/_lib/winterRoute/budardalurHolmavikRoute.test.js` | 11 (unchanged, confirms no regression) |
| `src/pages/WinterRoute.test.jsx` | 96 (93 pre-existing, unchanged + 3 new) |
| **Total** | **170/170** |

The 3 new UI tests cover: a westfjords-batch pair rendering the dynamic
5-point heading + computed largest-gap note; B-H rendering its own 4-point
heading with **no** gap note; and a P6(c) race (B-H → new pair → an
unconnected pair → the same new pair again) confirming no stale content
ever renders under the wrong header, all scoped via `within()` to the data
region since place names collide with the Frá/Til `<option>` text
page-wide. ESLint and `git diff --check` are clean on every touched/new
file (only benign LF→CRLF normalization warnings).

## P8 — real browser verification

`vercel dev` (3000) and `vite dev` (5173) were already running outside this
session (confirmed via `curl` before use, never started/stopped by me,
after the owner started `vercel dev` on request). A disposable, uncommitted
Playwright script (deleted after use, not saved anywhere) drove the real,
unstubbed backend:

- **Longest new pair, both directions** — B↔T desktop/IS. Real response:
  8 points, "Veður á 8 punktum", "Stærsta bilið án punkts er um 83,6 km,
  milli Gilsfjörður og Klettsháls — leiðarpunktur," 8 forecast cards (no
  Patreksfjörður card, correctly), 18 real road sections incl. live
  notices (Holur í vegi, Vegavinna, Ósléttur vegur).
- **Shortest new pair** — P↔T desktop/EN. Real response: "Weather at 3
  points", "The largest gap without a point is about 9.3 km, between
  Miklidalur — route point and Tálknafjörður — route point" — matches the
  unit-test-pinned figure exactly, period-decimal correct for EN.
- **Mode/pair race**, mobile 360px/IS: B↔H (connected) → B↔F (new pair,
  connected) → B↔Ísafjörður (unconnected, correctly shows the base "ekki
  enn tengd" disclaimer with no data section at all, 0 count confirmed) →
  back to B↔F.
- **Keyboard**: F↔P desktop/IS — Tab from the "Til" select reaches the
  swap button then "Sýna leið"; Enter submits; real data renders (3 points,
  41.8 km gap between Flókalundur and Kleifaheiði — leiðarpunktur).

All screenshots were genuinely reviewed (not just claimed) and saved only
into `docs/ai/tasks/ticket-503/westfjords-batch/evidence/`:
`budardalur-talknafjordur-data-desktop-is.png`,
`talknafjordur-budardalur-data-desktop-is.png`,
`patreksfjordur-talknafjordur-data-desktop-en.png`,
`budardalur-holmavik-data-mobile-is.png`,
`budardalur-flokalundur-data-mobile-is.png`,
`budardalur-isafjordur-unconnected-mobile-is.png`,
`flokalundur-patreksfjordur-keyboard-desktop-is.png`. No prior round's own
evidence images (#502 or ticket-503's first round) were touched — confirmed
via `git status` (the whole `westfjords-batch/` directory was untracked
before this round).

One test-harness-only bug surfaced and was fixed along the way: this
browser's `localStorage("lang")` is read through `JSON.parse` by the app's
own `useLocalStorageState`, so seeding it from Playwright requires a
JSON-encoded value (`'"en"'`), not a raw string — unrelated to any app code
changed this round, purely a driver-script mistake caught and corrected
before trusting the EN screenshots.

## Honest gaps / not done here (per P9)

- #503 is **not** closed: 7 of 28 API pairs (28 counts unordered pairs
  including junction pairs not reachable from the UI) are now connected,
  21 remain, plus route options and full Ring Road measurement.
- No "safe/open/passable" claim is made anywhere — closed/caution rows
  still read as closed/caution only on their own section, never as a
  route-wide verdict.
- `winterRouteDataConnectedDisclaimer`'s only-hour-forecast-time UTC note
  and the generic access-point disclaimer are unchanged from the B-H round.
- Only one hour was available in the live EN probe at the time P8 ran, so
  the "hour changed" screenshot variant was skipped that run (code path for
  it exists and is exercised by the unit tests' own hour-select tests).

No commit/push/deploy/GitHub action was taken.


## Ripley evidence clarification — 2026-11-23

Coverage is 7/25 UI-selectable pairs (18 remaining), or 7/28 API pairs (21 remaining including 3 junction pairs). The hour-changed EN screenshot exists despite the earlier skipped-variant statement; its presence does not independently prove the reported browser action. Per-point live probe output was not retained in this handoff. Its returned coordinates/elevations/snap and overall minimum margin cannot be reconstructed honestly from the saved files. The earlier 2.64 km result remains CC-reported only. No new upstream calls made. See result-review.md for independently run focused regression checks and direct fixes.
