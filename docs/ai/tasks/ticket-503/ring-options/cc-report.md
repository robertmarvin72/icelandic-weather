# cc-report — ticket #503 ring-options: Rauðavatn↔Selfoss/Hella, south/north

## Scope delivered

Per `approved-prompt-v1.md` P1-P9 (+ Ripley's own binding corrections in
"Framkvæmdarsamræming Ripley"): weather/road data for **two unordered
pairs**, reykjavik-raudavatn↔selfoss and reykjavik-raudavatn↔hella, each
with `option=south|north`, both directions — **8 route-variants**, reusing
the same `/winter-route` Frá/Til flow and the existing south/north
option-selection UI (ticket #502). The longest variant (Rauðavatn→Selfoss
north, 1236 km) was measured specifically as required: 18 points, 10 total
upstream calls for the full 8-variant proof, ~19.5 kB forecast response, no
chunking needed. After this round: **17/25 UI-selectable pairs connected
(8 Ring Road UI pairs remain; 3 additional junction-only pairs exist in the API)**, **17/28 API
pairs**. The 15 Westfjords pairs keep their own unchanged behavior and
points. #503 as a whole is **not closed** — this is the first asymmetric
(south/north) Ring Road measurement, not full Ring Road coverage.

## P5(b) — pure extraction, byte-identical before/after

`composeSouthOption`/`composeNorthOption` (previously inline in
`api/winter-route-geometry.js`, lines ~274-331) were moved verbatim into
`api/_lib/winterRoute/ringOptionGeometry.js` — no logic changed, only
location. Verified two ways: (1) a full JSON snapshot of the real
handler's own 8 responses was captured **before** the move
(`evidence/extraction-snapshot-before.json`) and compared **byte-identical**
to a second snapshot taken **after** (`evidence/extraction-snapshot-after.json`)
— confirmed via direct `JSON.stringify` equality, not just a hash; (2) the
pre-existing `api/winter-route-geometry.test.js` suite (123 tests) passes
**unchanged**. `ringOptionGeometry.test.js` (11 tests) additionally proves
the real handler's response for all 8 variants still matches that same
before-snapshot, as a permanent regression guard.

## P1/P2 — frozen point registry (NOT coordinate membership)

Unlike the three Westfjords modules, point selection here is a **frozen,
explicit, per-variant ordered ID list** (`VARIANT_POINT_IDS` in
`api/_lib/winterRoute/ringOptionsRoute.js`), not computed from coordinate
presence in the composed route. P2's own investigation found that
coordinate membership would wrongly attach 11-13 "ghost" points from the
other direction/option's own table to each north variant. The frozen table
— corrected by Ripley's own binding #1 (z≤0 picks the midpoint of the
named span, not the first vertex) — gives counts **3/3/18/15/3/3/17/17 =
79** IdButur-touching points total, matching Jonesy's own re-verified
sandbox figures exactly. 30 unique native points (37 source:vertex
references, with reused coordinates like `2138v0 = 8676v2` sharing one
registry id, never a duplicate alias).

## P1 real bounded probe (72-IdButur union, max 10 upstream calls)

Script: `docs/ai/tasks/ticket-503/ring-options/evidence/probe-and-registry.mjs`.
**Succeeded on the first attempt — exactly 10 calls, no retries, no STOP.**
Full output in `evidence/probe-output.json`.

- Resolved all 8 variants offline first; union IdButur = **72** (matching
  Jonesy's own cited figure exactly).
- **1 `fetchRoadSegments` + 1 `fetchRoadPoints`** for the 72-id union: 72/72
  found, 0 ambiguous, **8 real active notices** (DYR_A_VEGI, VEGAVINNA×4,
  OSLETTUR_VEGUR, STEINKAST — all later visible honestly in the real
  browser run too).
- **8 forecast batches**, Rauðavatn→Selfoss north (18 points, the
  production maximum) **first** as required, then the remaining 7 —
  **exactly 10 total calls**, all `ok:true`. Max forecast response size
  **~19.5 kB** (the 18-point variant) — well within the existing single
  Open-Meteo batch call, so **no chunking was built or needed** (per P6c's
  own explicit "no chunk unless it fails" instruction).
- **P1(c) ordering-margin check on production subsets** (never the
  18-point union) for all 8 variants: **all pass**, minimum real margin
  **16.0 km** (well above the ~11.3–30 km range Jonesy's own sandbox
  predicted) — no STOP, `validateForecast` untouched.

## P3 — names, EN table, tunnel guard

- All 72 real IdButur names extracted directly from the composed geometry
  (not guessed) and given a fixed, reviewed EN table in
  `ringOptionsRoute.js`'s own `IDBUTUR_NAME_EN` (0 of 72 existed in any
  prior table). Tunnel lines translated explicitly (`Hvalfjarðargöng` →
  "Hvalfjörður Tunnel", `Vaðlaheiðargöng` → "Vaðlaheiði Tunnel",
  `Fáskrúðsfjarðargöng` → "Fáskrúðsfjörður Tunnel"), applied consistently
  to the two ordinary roads whose own name also contains one of those
  tunnel names (`Hvalfjarðargöng-Grundartangi`, `Akureyri-Vaðlaheiðargöng`)
  for display consistency — confirmed correct in the real browser
  (`"Hvalfjörður Tunnel–Grundartangi"`, `"Akureyri–Vaðlaheiði Tunnel"`).
  `Suðurlandsv. um Hádegismóa` is expanded in **both** the IS display
  (`"Suðurlandsvegur um Hádegismóa"`) and the EN translation (`"...around
  Hádegismóar"`), per the approved prompt's explicit instruction.
- **P3(a) explicit example honored**: the Grundartangi 100 km-marker point
  reads `"Leiðarpunktur nærri Grundartanga"` / `"Route point near
  Grundartangi"`, never the raw `"Hvalfjarðargöng-Grundartangi"` section
  name — confirmed by a dedicated test and visible in the real browser.
- **P3(b) tunnel-binding STOP guard**: a fixed 3-id list
  (`904690037`/`909000037`/`911260037`), never a `"göng"` substring search
  (which would wrongly catch the two ordinary roads above). This is a
  defensive invariant in the resolver — none of the 30 frozen points
  actually bind to a tunnel line, confirmed by the frozen table itself.

## P4 — road sections, connectors, edge rule

- Section counts **5/5/66/66/7/7/65/65** exactly, for all 8 variants.
- **P4(a) non-adjacent IdButur aggregation**: the resolver aggregates per
  IdButur in **first-come-order globally**, not just consecutive slices —
  required because `914020037` (Suðurlandsvegur um Hádegismóa) appears
  twice, non-adjacently, on both reverse-north variants. Confirmed by a
  dedicated test: it resolves to exactly **one** road section with one
  summed length (not two), both in the resolver's own unit tests and in
  the handler-level response.
- **P4(b) null-ID connectors**: `0 / 44.215 / 0 / 13.369 m` (south-fwd,
  south-rev, north-fwd, north-rev) for both pairs — matching Jonesy's own
  cited figures exactly.
- **P4(c) ring-specific edge rule**: `isEdgeSegment ⇔ routeLengthM < 100m`
  (an **absolute** threshold), not the Westfjords 1%-of-route rule, which
  would wrongly flag 19-20 completely normal multi-km sections on a
  ~1200 km route (e.g. the real Hvalfjörður tunnel at 0.46%). Confirmed:
  `1410010037` (~1.3 m) flags on all 4 north variants; `901130037` (~39-42
  m) flags **only** on the two Hella-north variants, and does **not** flag
  on the Selfoss-north variants where the same real road carries a much
  longer traveled sub-length there. The UI never shows "0.0%" for these —
  a dedicated fallback sentence ("this section is a very short part of the
  route") is shown instead whenever the computed percent would display as
  zero, confirmed both in a unit test and in the real browser run.

## P5 — API identity, option validation

- `api/winter-route-data.js`'s existing dispatch chain gained a fourth
  branch: `isRingOptionPair` → `resolveRingOptionGeometry(from, to,
  option)`. A missing or invalid `option` for a ring pair returns `400
  invalid_option` **before any network call** — confirmed by a dedicated
  test (`fetchMock` never invoked). Every other pair (the 15 Westfjords
  pairs) ignores `option` entirely, exactly as the geometry handler
  already does — confirmed by a golden regression test that a Westfjords
  request with a stray `option=south` still returns its normal 200
  response, unaffected.
- The response carries **exactly one** of two identity shapes:
  `regionVersion` (Westfjords) or `selectedOption`+`datasetVersion`+
  `policyVersion` (ring) — the other resolver's own result simply never
  sets the other shape's fields, so no conditional branching was needed in
  the handler; confirmed by a dedicated test asserting the "wrong" fields
  are `undefined` on each shape.
- `geometryId` is independently recomputed server-side for the *requested*
  option every time; a client-supplied geometryId for the wrong option
  (e.g. requesting `option=north` with the real `south` geometryId) is
  `400 geometry_mismatch`, never silently served as the other option —
  confirmed by a dedicated test.

## P6 — cache, call counts

- **No reverse-sharing** (unlike the Westfjords modules' canonical-order
  sharing): each of the 8 variants is its own fixed bucket
  (`direction+option+geometryId`). Confirmed: concurrent forward+reverse
  of the same option makes **6** upstream calls (3+3), never 3 — a
  dedicated test asserts this explicitly, distinguishing it from the
  Westfjords single-flight-reverse pattern.
- Cache isolation confirmed between south/north of the same direction, and
  between a ring bucket and a Westfjords pair's own bucket.
- **Call-count math confirmed**: cold single variant = 3 calls (1 forecast
  + 2 road); **8 cold variants = 24 upstream calls (16 of which are
  national-feed downloads)** — matches the approved prompt's own cited
  figures exactly. Warm (within TTL) repeat requests make zero new calls
  (confirmed by test).
- **Auðkennd spá (P6b)**: every point in every one of the 8 variants
  returns its own identified series value (`temperature_2m[0] === own
  canonical index`) and its own requested coordinates, confirmed for all 8
  in one test loop — including the 18-point maximum.

## P7/P9(a) — tests (410 total across 11 focused files)

| File | Tests |
| --- | --- |
| `api/_lib/winterRoute/ringOptionGeometry.test.js` | 11 (extraction regression) |
| `api/_lib/winterRoute/ringOptionsGeometryCrossCheck.test.js` | 8 |
| `api/_lib/winterRoute/ringOptionsRoute.test.js` | 21 |
| `api/winter-route-data.test.js` | 59 (44 pre-existing, unchanged + 15 new) |
| `api/winter-route-geometry.test.js` | 123 (unchanged — confirms the extraction's own regression safety) |
| `src/pages/WinterRoute.test.jsx` | 103 (99 pre-existing, unchanged + 4 new) |
| `api/_lib/winterRoute/westfjordsCompletionRoute.test.js` + its cross-check | unchanged |
| `api/_lib/winterRoute/westfjordsBatchRoute.test.js` + its cross-check | unchanged |
| `api/_lib/winterRoute/budardalurHolmavikRoute.test.js` | unchanged |
| **Total** | **410** |

ESLint clean on every touched/new file. `git diff --check` clean (only
benign LF→CRLF normalization warnings). `git status` confirms the diff is
exactly: `api/winter-route-data.js`, `api/winter-route-data.test.js`,
`api/winter-route-geometry.js` (the pure extraction only — verified
byte-identical), `api/_lib/winterRoute/ringOptionGeometry.js` (+its own
test), `api/_lib/winterRoute/ringOptionsRoute.js` (+its own test and
geometry cross-check), `src/i18n/translations.winterRoute.js` (2 new
keys), `src/pages/WinterRoute.jsx`, `src/pages/WinterRoute.test.jsx`,
`docs/ai/CURRENT.md`, and this round's own task directory.

The new 4 UI tests cover: the default-south data fetch (`option=south` in
the URL, 3-point heading, no long-route note); selecting north re-fetches
both geometry **and** data with `option=north` (18-point heading, the
≥400 km long-route note shown); a P8(b) race (north selected, delayed data
in flight → switch to south before it resolves → the stale 18-point data
never appears under the south header once it does resolve); and the
"0.0%" edge-segment fallback text.

## P8/P9(b) — real browser verification

`vercel dev` (3000) and `vite dev` (5173) were already running outside
this session (confirmed via `curl` before use, never started/stopped by
me). A disposable, uncommitted Playwright script (deleted after use, not
saved anywhere) drove the real, unstubbed backend:

- **R↔Selfoss, south then north (same screen), desktop/IS**: south shows
  "Veður á 3 punktum"; clicking the north radio re-fetches and shows
  "Veður á 18 punktum", the long-route comparison note, all 18 real
  forecast cards correctly labeled (no raw IDs), 66 road sections with
  real live notices (Melasveit, Borgarnes-Baulan, Hvalfjarðargöng all
  flagged "Aðgát – tilkynning"), and the short edge-segment fallback text
  for "Rauðavatn – Nesjavallaleið" (never "0,0%").
- **Selfoss→Rauðavatn, north (reverse direction), desktop/IS + UTC hour
  change**: 15-point reverse order confirmed, hour-select interaction
  works without refetch/focus loss.
- **R↔Hella, option flip (south→north), desktop/EN**: "Weather at 17
  points", tunnels render as "Hvalfjörður Tunnel"/"Vaðlaheiði Tunnel",
  "Suðurlandsvegur around Hádegismóar" renders exactly as specified, a
  real "Unknown condition" row shown honestly (not fabricated as passable
  or closed), multiple real live notices visible.
- **Mobile 360px/IS**: R→Selfoss north renders cleanly, no horizontal
  overflow, all 18 cards and 66 road rows readable.
- **Keyboard**: R↔Hella, `ArrowRight` on the focused south radio switches
  to north (confirmed `aria-checked="true"` on the newly focused radio,
  focus retained, no stolen focus), real 17-point north data renders.

All 8 screenshots were genuinely reviewed (not just claimed) and saved
only into `docs/ai/tasks/ticket-503/ring-options/evidence/`:
`rvk-selfoss-south-desktop-is.png`, `rvk-selfoss-north-desktop-is.png`,
`selfoss-rvk-north-desktop-is.png`,
`selfoss-rvk-north-hour-changed-desktop-is.png`,
`rvk-hella-south-desktop-en.png`, `rvk-hella-north-desktop-en.png`,
`rvk-selfoss-north-mobile-is.png`,
`rvk-hella-keyboard-option-switch-desktop-is.png`. No prior round's own
evidence images were touched — confirmed via `git status` (this task's
own `evidence/` directory, including its pre-existing `offline-matrix.*`
from the prompt-review stage, was entirely untracked before this round).

Not screenshotted: R↔Hella south (both directions) and the
Selfoss→Rauðavatn south direction specifically — covered by the offline
matrix/handler tests instead, not a dedicated screenshot (P9b does not
require every one of the 8 variants to have its own image).

## Honest gaps / not done here (per P9)

- #503 is **not** closed. After this round: **17/25 UI-selectable pairs
  connected (8 Ring Road UI pairs remain; 3 additional junction-only pairs are not reachable from the UI)**; **17/28 API pairs (11 remain)**.
- This is the **first** asymmetric (north/south) Ring Road measurement —
  not full Ring Road weather coverage. The other Ring Road pairs
  (Selfoss↔Hella, Selfoss↔Egilsstaðir, Hella↔Egilsstaðir, etc.) are not
  attempted here.
- No "safe/open/passable" route-wide claim is made anywhere — individual
  road sections (including the real "Unknown condition" row seen in the
  live run) read on their own, never as a whole-route verdict.
- The ≥400 km comparison-not-ETA disclaimer is computed generically from
  `routeLengthM` (not hardcoded to "north"), but was only exercised this
  round on the two north variants, which are the only ones currently
  ≥400 km.

No commit/push/deploy/GitHub action was taken.


## Ripley clarification — 2026-11-24

Coverage is17/25UI pairs (8 remain),17/28API (11 remain including3junction-only). Eight screenshots do not mean all8variants were browser-tested. Browser evidence is sampled; complete8variant coverage is from offline/handler tests. No independent browser rerun by Ripley. The long-route same-time note is generic and remains subject to owner visual acceptance.
