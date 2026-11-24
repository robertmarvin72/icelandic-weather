# cc-report — ticket #503 westfjords-completion: the last 8 pairs (isafjordur)

## Scope delivered

Per `approved-prompt-v1.md` P1-P9 (+ Ripley's own binding P2(B)/P1(c) decisions):
connects the final **8 unordered pairs / 16 directions** among the 6
Westfjords places now wired into `/winter-route`: budardalur, flokalundur,
patreksfjordur, talknafjordur, holmavik and (new this round) **isafjordur**.
Pairs: budardalur↔isafjordur, flokalundur↔isafjordur, isafjordur↔holmavik,
isafjordur↔patreksfjordur, isafjordur↔talknafjordur, flokalundur↔holmavik,
holmavik↔patreksfjordur, holmavik↔talknafjordur. Reuses the 9 existing
westfjords-batch points + 4 B↔H points verbatim (12 unique after the shared
`budardalur-route`) plus **6 new points** (frozen table, P2(B) decision:
`sudavikurhlid-route` = 3535v0, not 3392v2). B↔H's and the six
westfjords-batch pairs' own resolvers/cache keys/contracts are **completely
untouched**. After this round: **15/15 Westfjords pairs connected, 15/25
UI-selectable pairs (10 Ring Road pairs remain), 15/28 API pairs (13
remain, 3 of which are junction-only, not reachable from the UI)**. #503 as
a whole is **not closed** — route options and full Ring Road measurement
are explicitly out of scope here.

## P1 — real bounded probe (18-point/41-IdButur union, run before any implementation)

Script: `docs/ai/tasks/ticket-503/westfjords-completion/evidence/probe-and-registry.mjs`
(read-only, task-local). **Succeeded on the first attempt — no retries, no STOP.**
Full output saved to `evidence/probe-output.json` (no URLs/keys/raw snapshots).

- All 18 union points' WGS84 independently re-derived offline (own Lambert/
  GRS80 inverse), matching Jonesy's own cited sandbox figures to the
  printed precision for every point, including the P2(B) decision point
  (`sudavikurhlid-route`: 66.02459271 / −22.99225430).
- All 16 directions composed via the real production core; geometryId/
  lengthM/points/unmappedLengthM matched the pre-existing read-only
  `evidence/offline-matrix.json` (Ripley/Jonesy's own prior proof)
  **exactly** on every field, for every direction.
- One real network probe: `fetchRoadSegments`/`fetchRoadPoints` for the
  41-id union, **one** `fetchWinterRouteForecast` batch for the 18 points —
  **3 upstream calls total**. 41/41 IdButur found, 0 ambiguous. **7 real
  active notices** (VEGAVINNA×2 on 805090037, HOLUR_I_VEGI×2 on 905070037,
  OSLETTUR_VEGUR×2 on 905190037, VEGAVINNA on 905260037 — identical set to
  the westfjords-batch round's own probe, since those segments are shared).
  All 18 forecast points validated (snap distances 0.3–3.2 km, all
  plausible grid-point offsets).
- **P1(c) ordering-margin check on production subsets**, all 16 directions: all pass as recorded in probe-output.json. Margin means distance from the returned coordinate to the nearest other requested point minus distance to its own requested point. Per-route minima recomputed by Jonesy are 5.77 km (B–I/F–I), 6.12 (I–H), 12.9 (I–P), 2.64 (I–T/H–T), and 7.71 (F–H/H–P). The overall minimum is 2.64 km. The saved tightestMarginCheck value 7.60 km is a separate single-point check, not the overall minimum. P2(B) uses3535v0 near Súðavík, about8.2 km from the Ísafjörður endpoint; the earlier2.21 km statement described rejected3392v2 and was incorrect here. No STOP triggered; validateForecast untouched.

## P2 — six new points, WGS84, P2(B) decision applied

- `api/_lib/winterRoute/westfjordsCompletionRoute.js` exports
  `WESTFJORDS_COMPLETION_NEW_POINTS` (6, frozen sourceId/vertexIndex/native
  x/y/z table) and `WESTFJORDS_COMPLETION_POINTS` (18 union, the 6 new +
  12 reused verbatim via a dedup-by-id merge of
  `BUDARDALUR_HOLMAVIK_FORECAST_POINTS` and `WESTFJORDS_BATCH_POINTS`).
- Independent test-level re-derivation
  (`westfjordsCompletionRoute.test.js`): each point's native x/y/z is
  byte-identical to the real line's own vertex; each WGS84 is
  independently re-computed (own inverse, not copied from the module) and
  matches Jonesy's cited reference within 1e-6°; `isafjordur-route` is
  confirmed to literally be `region.endpoints.isafjordur`; `dynjandisheidi
  /vatnsfjardarhals/steingrimsfjardarheidi` are each confirmed to carry
  their own line's real maximum z; `gemlufallsheidi-route` is confirmed to
  **not** carry its line's maximum z (2.8441 vs. the real 19.63) — label
  stays "Near Gemlufallsheiði", never a mountain-top claim.
- **P2(B) applied as decided, not re-litigated**: `sudavikurhlid-route` =
  3535v0 (end of IdButur 906140037 at Súðavík itself), not the originally
  proposed 3392v2. Chainage/label/largest-gap figures throughout this
  report use the B-decision values (I–H largest gap 106.3 km, not 118.5 km).

## P3 — route-specific membership, "ghost point" guard

- Point membership + chainage order are computed **dynamically** every
  request (coordinate presence in the composed route's own coordinate
  chain), never a hardcoded per-pair table — same pattern as the other two
  modules.
- **P3(a) guard, implemented exactly as specified**: `throskuldar-south-
  route`/`throskuldar-pass-route` are only counted as on-route when the
  composed route's own IdButur list actually contains `907000037` — not
  merely because their native coordinate happens to sit on a shared
  endpoint vertex with lines used by budardalur-anchored routes. Verified
  by a dedicated test: both points are **absent** from
  budardalur↔isafjordur, flokalundur↔isafjordur, isafjordur↔holmavik,
  isafjordur↔patreksfjordur, isafjordur↔talknafjordur, and **present** on
  flokalundur↔holmavik, holmavik↔patreksfjordur, holmavik↔talknafjordur —
  matching the real probe/offline-matrix output exactly.
- **P3(b) golden regression**: a dedicated test confirms the six
  westfjords-batch pairs' own pinned `lengthM`/`pointIds` are unchanged,
  and B↔H's own resolver still only accepts its own two directions.

## P4 — geometry, IdButur, connectors, edges, names

- Section counts match exactly: **24/13/9/17/18/11/16/17** IdButur
  sections for B-I/F-I/I-H/I-P/I-T/F-H/H-P/H-T.
- Null-ID connectors confirmed per pair: B-I −4 only (≈0.005 m), F-I/I-H/
  I-T none, I-P −5 only (≈4.393 m), F-H −4 only (≈0.005 m), H-P both −4
  and −5 (≈4.398 m), H-T −4 only (≈0.005 m) — matches Jonesy's cited
  figures exactly.
- Edge segments (<1% of own route) verified live in the real browser run:
  **906700037 Tungudalsleggur flagged at 0.8% on budardalur↔isafjordur**,
  562070037 flagged at 0.93% on isafjordur↔patreksfjordur.
- **19 new IdButur names** extracted directly from the real composed
  geometry (not guessed) and given fixed, reviewed EN translations in
  `westfjordsCompletionRoute.js`'s own `IDBUTUR_NAME_EN` table (superset of
  the 41-id union, same duplication convention the other two modules
  already use between each other): proper names kept unchanged
  (en-dash-normalized where hyphenated), "Flugvöllur" → "Airport" per the
  approved prompt, "Djúpvegur: Ísafjörður" kept unchanged per the approved
  prompt. Confirmed correct in the real browser: "Airport–Ísafjörður" and
  "Djúpvegur: Ísafjörður" both render as specified.
- No tunnel/Helluskarð/Dýrafjörður/Ísafjarðardjúp coverage claim is made
  anywhere; those IdButur sections show with their own real status, no
  weather card is attached to them.

## P5 — coverage honesty (gaps, names)

- Largest gaps (planar, "um"/approximate, never driving distance):
  **B-I 83.6 km** (Gilsfjörður→Klettsháls, same as the batch round's own
  B-F gap since the route shares that segment), **I-H 106.3 km**
  (Súðavík→Vatnsfjarðarháls, P2(B) applied), **F-I/I-P/I-T 59.4 km**
  (Dynjandisheiði→Gemlufallsheiði), **F-H/H-P/H-T 74.2 km**
  (Klettsháls→Þröskuldar syðri) — all confirmed in the real browser run
  across the sampled pairs.
- Gap text uses the clean place name only (no "— leiðarpunktur"/"— route
  point" suffix mid-sentence) — this already worked via the existing
  `labelIs`/`labelEn` display fields; no new display-field split was
  needed this round.
- **P5(a) fix applied**: the largest-gap calculation (`WinterRouteDataView`
  in `WinterRoute.jsx`) now filters to `point.available && Number.isFinite
  (...)` — a point without its own forecast data no longer silently counts
  as "a point" in the gap calculation (previously it only filtered by
  chainage presence, which could understate a real gap if a point was
  temporarily unavailable). Small, in-scope fix directly serving this
  round's own explicit P5(a) requirement.

## P6 — API, cache, call counts

- `api/winter-route-data.js` dispatch extended with a third branch:
  `isWestfjordsCompletionPair` → `resolveWestfjordsCompletionGeometry` /
  `westfjordsCompletionCacheKey` / `westfjordsCompletionForecastPoints`,
  same canonical-fetch-order/display-order-by-id pattern as the other two
  branches. `geometryId` is verified against the real geometry handler for
  all 16 directions in a dedicated cross-check test (not resolver-vs-
  itself) — `westfjordsCompletionGeometryCrossCheck.test.js`.
- **P5b(i) cache**: one fixed bucket per unordered pair (both directions
  share it), disjoint key space from the other two modules — confirmed by
  a dedicated test showing budardalur↔isafjordur never shares a bucket
  with isafjordur↔holmavik, a westfjords-batch pair, or B↔H.
- **Call counts**: cold pair = 3 upstream calls (1 forecast batch + 2 road
  feeds); **8 new cold pairs × 3 = 24 calls**; all 15 Westfjords pairs
  cold = **45 calls (30 of which are national-feed downloads)** — matches
  the approved prompt's own cited figures exactly. Within-TTL repeat
  requests on an already-warm pair make zero new calls (confirmed by
  test). Production forecast requests never exceed 8 points per request
  (the 18-point union is a probe-only artifact).
- `key_missing` ⇒ `forecast:{available:false, reason:"key_missing"}`,
  road data unaffected, zero forecast calls — confirmed for a
  westfjords-completion pair too.

## P7 — UI, i18n

- Frontend request gate (`isWinterRouteDataPair` in `WinterRoute.jsx`)
  extended with a third frontend-only pair list (`WESTFJORDS_COMPLETION_
  PAIRS`, same convention as the other two — `src/` cannot import `api/`
  code). `WinterRouteDataView` required **no structural change** — it was
  already generic over point count (3-8, now also 4-8) and over the
  presence/absence of `approxDistanceFromStartKm` from the earlier round.
- S1-S3 baseline re-confirmed untouched: `forecast.available:false` never
  renders "Weather at 0 points" (shows the existing unavailable text
  instead — this was already fixed before this round and stays fixed);
  live-region scoping, stale/partial marking, response validation before
  render, and the abort/dedup/requestId lifecycle are all unchanged.
- IS/EN, comma-decimal for IS / period-decimal for EN, T3 (no ETA/arrival/
  departure) — all confirmed in the real browser run (IS and EN
  screenshots both reviewed).

## P8 — tests (228 total across 7 focused files)

| File | Tests |
| --- | --- |
| `api/_lib/winterRoute/westfjordsCompletionRoute.test.js` | 23 |
| `api/_lib/winterRoute/westfjordsCompletionGeometryCrossCheck.test.js` | 18 |
| `api/winter-route-data.test.js` | 44 (30 pre-existing, unchanged + 14 new) |
| `api/_lib/winterRoute/westfjordsBatchRoute.test.js` | 20 (unchanged, confirms no regression) |
| `api/_lib/winterRoute/westfjordsBatchGeometryCrossCheck.test.js` | 13 (unchanged) |
| `api/_lib/winterRoute/budardalurHolmavikRoute.test.js` | 11 (unchanged) |
| `src/pages/WinterRoute.test.jsx` | 99 (96 pre-existing + 1 new UI test; 2 pre-existing tests were updated, not weakened — see "deviations" below) |
| **Total** | **228** |

ESLint clean on every touched/new file. `git diff --check` clean (only
benign LF→CRLF normalization warnings). `git status` confirms the diff is
exactly: `api/winter-route-data.js`, `api/winter-route-data.test.js`,
`api/_lib/winterRoute/westfjordsCompletionRoute.js` (+2 test files),
`src/pages/WinterRoute.jsx`, `src/pages/WinterRoute.test.jsx`,
`docs/ai/CURRENT.md`, and this round's own task directory — no i18n file
changes were needed (the generic keys added in the westfjords-batch round
already cover 4-8 points).

### Deviation found and fixed: two pre-existing tests assumed "isafjordur" was still unconnected

Two tests from the westfjords-batch round (`src/pages/WinterRoute.test.jsx`)
deliberately used `budardalur<->isafjordur` as their own "genuinely
unconnected pair" example, and one ticket-502-era test used
`isafjordur<->patreksfjordur` specifically because it was "unaffected by
#503" at the time. Since **this round connects exactly those pairs**, all
three tests' own premises became stale and failed once the real
`isWinterRouteDataPair` gate was extended. Fixed by swapping the example
place to `selfoss` (a Ring Road place still outside all three #503
modules) in all three spots — no assertion was weakened, only the
now-invalid example pair was replaced. This is an expected, honest
consequence of the round's own scope, not a product bug.

## P8(b) — real browser verification

`vercel dev` (3000) and `vite dev` (5173) were already running outside
this session (confirmed via `curl` before use, never started/stopped by
me). A disposable, uncommitted Playwright script (deleted after use, not
saved anywhere) drove the real, unstubbed backend:

- **Longest new pair (B↔I), both directions** — desktop/IS. Real
  response: 8 points ("Veður á 8 punktum"), 83.6 km gap note, 24 road
  sections including the new names (Helluskarð, Dynjandisheiði — flagged
  "Aðgát – tilkynning" with a real live notice, Tungudalsleggur correctly
  flagged as a 0.8% edge segment), no raw technical fields leaked.
- **I↔H, both directions (largest gap, new Djúpvegur section)** —
  desktop/EN. Real response: "Weather at 5 points", "The largest gap
  without a point is about 106.3 km, between Near Súðavík and Near
  Vatnsfjarðarháls" (exact P2(B) figure), "Steingrímsfjarðarheiði" flagged
  "Caution — notice" / "Spots of ice" (a real live notice), "Airport–
  Ísafjörður" and "Djúpvegur: Ísafjörður" both render exactly as specified.
- **H↔T (longest H-anchored pair)**, mobile 360px/IS, plus a mode/pair
  switch race: H↔T (connected) → budardalur↔selfoss (unconnected,
  correctly 0 data sections) → budardalur↔isafjordur (connected again,
  fresh correct 8-point data, no stale leak) — confirmed via screenshot
  and an explicit data-section-count log.
- **Keyboard**: isafjordur↔patreksfjordur desktop/IS — Tab from the "Til"
  select reaches the swap button then "Sýna leið"; Enter submits; real
  data renders (5 points, 59.4 km gap between Near Gemlufallsheiði and
  Near Dynjandisheiði, matching the pinned test figure exactly).

All 8 screenshots were genuinely reviewed (not just claimed) and saved
only into `docs/ai/tasks/ticket-503/westfjords-completion/evidence/`:
`budardalur-isafjordur-data-desktop-is.png`,
`isafjordur-budardalur-data-desktop-is.png`,
`isafjordur-holmavik-data-desktop-en.png`,
`holmavik-isafjordur-data-desktop-en.png`,
`holmavik-isafjordur-hour-changed-desktop-en.png`,
`holmavik-talknafjordur-data-mobile-is.png`,
`mode-switch-budardalur-isafjordur-mobile-is.png`,
`isafjordur-patreksfjordur-keyboard-desktop-is.png`. No prior round's own
evidence images (#502, B↔H, westfjords-batch) were touched — confirmed via
`git status` (the whole `westfjords-completion/` directory, including its
own pre-existing `offline-matrix.json`/`.mjs` from the prompt-review stage,
was untracked before this round and nothing in the other rounds' own
evidence folders changed).

Not every one of the 16 directions got its own screenshot (not required —
the offline matrix test covers all 16 numerically); the 8 directions not
screenshotted are: flokalundur↔isafjordur (both), isafjordur↔patreksfjordur
reverse, isafjordur↔talknafjordur (both), flokalundur↔holmavik (both),
holmavik↔patreksfjordur (both).

## Honest gaps / not done here (per P9)

- #503 is **not** closed. After this round: **15/25 UI-selectable pairs
  connected (10 Ring Road pairs remain)**; **15/28 API pairs (13 remain,
  3 of which are junction-only, never reachable from the UI)**.
- Route options (e.g. reykjavik-raudavatn↔selfoss north/south) have no
  weather/road data binding at all yet.
- Full Ring Road length measurement is not attempted.
- A future Ísafjarðardjúp point (between Súðavík and Vatnsfjarðarháls, the
  I-H 106.3 km gap) is only noted in `remaining.md` as possible future
  work — not a blocker, not attempted here.
- No "safe/open/passable" route-wide claim is made anywhere — closed/
  caution rows still read as closed/caution only on their own section.

No commit/push/deploy/GitHub action was taken.
