# cc-report — ticket #503 ring-completion: the last 8 Ring Road pairs

## Scope delivered

Per `approved-prompt-v1.md` P1-P9 (+ Ripley's own binding corrections):
connects the final **8 unordered Ring Road pairs, 16 directions**, with
**no south/north option at all** — the geometry handler's own existing
plain/undirected `composeGeometryPath` branch already resolves them:

1. Rauðavatn ↔ Egilsstaðir
2. Rauðavatn ↔ Seyðisfjörður
3. Selfoss ↔ Hella
4. Selfoss ↔ Egilsstaðir
5. Selfoss ↔ Seyðisfjörður
6. Hella ↔ Egilsstaðir
7. Hella ↔ Seyðisfjörður
8. Egilsstaðir ↔ Seyðisfjörður

A third, mutually-exclusive response identity shape was introduced:
`datasetVersion` only (no `selectedOption`/`policyVersion`, unlike the two
ring-option pairs; no `regionVersion`, unlike the 15 Westfjords pairs).
After this round: **25/25 of the currently UI-selectable pairs are
connected, 25/28 API pairs (3 junction-only pairs remain)**. This is
**not** full 56-place national coverage, not continuous weather
coverage, and not authorization to automatically close GitHub issue
#503 — the owner decides that separately.

## P5(b)-style reuse, not a new algorithm

No new geometry algorithm: `resolveRingCompletionGeometry` calls the
exact same `composeGeometryPath` + `loadGeometryDataset` the geometry
handler's own generic (non-MVP/non-ring-options) branch already uses, with
the same 5 real dataset endpoints (`reykjavik-raudavatn`, `selfoss`,
`hella`, `egilsstadir`, `seydisfjordur` — all already present in
`geometryDataset.js`, confirmed directly). Verified: a direct call with
Rauðavatn↔Egilsstaðir's own real endpoints returns the exact same
`geometryId` (`2e22ddd927a7ba2f56c30f282c855501`) as the real
`/api/winter-route-geometry` handler, for all 16 directions (own
dedicated cross-check test, not resolver-vs-itself).

## P1 — three new points, frozen registry

Three new points added (own module, reusing all 30 existing `ring-options`
points unchanged — `egilsstadir-route`, `seydisfjordur-route`,
`fjardarheidi-route`). `egilsstadir-route`/`seydisfjordur-route` **are**
the real `dataset.endpoints` (not a free-standing town-centre guess) —
confirmed by a dedicated test. `fjardarheidi-route` carries the real
highest z (615.77 m) among the lines literally named "Fjarðarheiði" — not
a confirmed official mountain height, not a claim about forecast-grid
accuracy at that elevation. WGS84 for all three independently re-derived
(own offline Lambert/GRS80 inverse) and matched to Jonesy's own cited
reference within 1e-6°. 16 frozen, explicit, ordered point-id sequences
(never coordinate membership, which the Westfjords modules' own earlier
experience showed would attach ghost points) — all 16 counts (14/14/16/16/
2/2/14/14/15/15/13/13/14/14/3/3) match the approved prompt's own table and
the pre-existing `offline-matrix.json` exactly, on the first attempt.

## P1/P2 real bounded probe (max 18 upstream calls)

Script: `docs/ai/tasks/ticket-503/ring-completion/evidence/probe-and-registry.mjs`.
**Succeeded on the first attempt — exactly 18 calls (the maximum), no
retries, no STOP, no even a thin-margin flag.** Full output in
`evidence/probe-output.json`.

- 1 `fetchRoadSegments` + 1 `fetchRoadPoints` for the 67-id union: 67/67
  found (including the one genuinely new id, `911170037` "Fjarðarheiði",
  confirmed found and unambiguous), 0 ambiguous, 7 real active notices.
- **Egilsstaðir→Seyðisfjörður (3 points, via Fjarðarheiði) forecast batch
  run FIRST** per Ripley's own binding instruction, since this is the
  tightest real ordering case in the whole #503 series (haversine
  separations only 7.7/10.0/17.7 km between the three points). Then the
  other 15 directions, one batch each, per-route (never a union-forecast
  flow, per Ripley's own explicit choice) — **exactly 18 total calls (2
  road + 16 forecast)**.
- **Ordering margins for the tight E→Sey case, measured for real**:
  Egilsstaðir 6.82 km, Fjarðarheiði 7.34 km, Seyðisfjörður 10.04 km — all
  comfortably above both the "STOP if ≤0" hard limit and the "flag if
  <1 km" thin-margin threshold Ripley's own binding set. No STOP, no flag,
  `validateForecast` untouched. Largest forecast response: ~17.4 kB (the
  16-point R↔Seyðisfjörður variant).

## P3 — third identity shape, repo-checked negative tests

- Response carries **exactly one** of three shapes now: `regionVersion`
  (Westfjords), `selectedOption`+`datasetVersion`+`policyVersion`
  (ring-options), or `datasetVersion` alone (ring-completion, this round)
  — confirmed by dedicated tests asserting the "wrong" fields are
  `undefined` for each shape, including a new frontend-side
  `hasValidIdentityShape` check in `validRouteData` that rejects a
  blended/mismatched response (e.g. a generic pair's own response somehow
  carrying `selectedOption`), not just a missing one.
- `compositionVersion` (present in the geometry response) is **not** added
  to the data identity — unchanged `ring-options` behavior, confirmed.

## P4 — stray `option`, 16 direction-specific cache buckets

- A stray `option=north` (or any value) on a ring-completion pair is
  simply **ignored** — same `200`, same `geometryId` as without it,
  exactly like the geometry handler's own existing behavior — confirmed
  by a dedicated test (both at the resolver/handler level and against the
  real geometry handler itself).
- A new, distinct cache-key prefix (`winter-route-data:ring-completion:`,
  neither the ring-options prefix nor the Westfjords sorted-pair
  convention), direction-specific (no reverse-sharing, same convention
  ring-options established). Confirmed: 16 buckets never collide with
  each other, with the 8 ring-option buckets, or with any Westfjords
  bucket; concurrent forward+reverse of the same pair makes 6 calls (not
  3), matching the "no reverse-sharing" design.

## P5 — road sections, edge rule, names

- Section counts 37/38/2/29/31/28/30/2 exactly for all 16 directions,
  `unmappedLengthM = 0` in all (real data shows no null-ID connector and
  no non-adjacent IdButur repeat for this group — confirmed, not
  fabricated as a false "everything aggregates correctly" claim). The
  global first-come IdButur-aggregation pattern is reused unchanged from
  `ringOptionsRoute.js`; its own synthetic/real proof against a genuinely
  non-adjacent case (914020037) already exists in that file's own test
  suite and was **not** duplicated here with new synthetic infrastructure,
  per the approved prompt's own explicit instruction not to pad test count.
- Edge rule (`<100 m` absolute, not 1%) reused unchanged: confirmed
  exactly `1410010037` (Rauðavatn↔Egilsstaðir/Seyðisfjörður) and
  `901130037` (Hella↔Egilsstaðir/Seyðisfjörður) flag, nothing else.
- EN name table: 66 of the 67 touched names were already in the existing
  72-name table (now `export`ed from `ringOptionsRoute.js` and reused,
  not re-duplicated a third time); the one genuinely new name,
  `911170037` "Fjarðarheiði", has no separate English form and is
  confirmed to render as "Fjarðarheiði" in both languages.

## P6/P7 — tests (464 total across 14 focused files)

| File | Tests |
| --- | --- |
| `api/_lib/winterRoute/ringCompletionRoute.test.js` | 18 |
| `api/_lib/winterRoute/ringCompletionGeometryCrossCheck.test.js` | 17 |
| `src/pages/winterRoutePairParity.test.js` | 5 (new, P7's own repo-checked parity test) |
| `api/winter-route-data.test.js` | 70 (59 pre-existing, unchanged + 11 new) |
| `api/winter-route-geometry.test.js` | 123 (unchanged) |
| `src/pages/WinterRoute.test.jsx` | 106 (103 pre-existing, unchanged + 3 new) |
| `api/_lib/winterRoute/ringOptionGeometry.test.js` + `ringOptionsRoute.test.js` + its cross-check | unchanged |
| `api/_lib/winterRoute/westfjordsCompletionRoute.test.js` + its cross-check, `westfjordsBatchRoute.test.js` + its cross-check, `budardalurHolmavikRoute.test.js` | unchanged |
| **Total** | **464** |

ESLint clean on every touched/new file. `git diff --check` clean (only
benign LF→CRLF normalization warnings).

### P7's own repo-checked parity test (closes ring-options' own S1)

`src/pages/winterRoutePairParity.test.js` imports the frontend's own pair
classification (`isWinterRouteDataPair`/`isRingOptionPair`/
`isRingCompletionPair`) and every backend resolver's own exported pair
check, and iterates all 110 ordered directions among the 11 UI places:
confirms **exactly 25 of 55 unordered pairs are connected (50 ordered
directions)**, no two backend branches ever both claim the same pair, and
a representative mixed Ring↔Westfjords pair is rejected on both sides.
**Deliberate implementation deviation from the approved prompt's own
literal wording** ("próf les pörin... WinterRoute.jsx"): the pair-
classification functions were extracted out of `WinterRoute.jsx` into a
new sibling module, `src/pages/winterRoutePairClassification.js` —
`export`ing them directly from `WinterRoute.jsx` tripped the
`react-refresh/only-export-components` ESLint rule (a real lint error,
not suppressed). The parity test still imports the frontend's own actual
pair-classification code, now via its proper home; `WinterRoute.jsx`
itself imports the exact same functions from that module, so there is no
behavior change, only a file-location change for lint cleanliness.

## P8/P9(b) — real browser verification

`vercel dev` (3000) and `vite dev` (5173) were already running outside
this session (confirmed via `curl` before use, never started/stopped by
me). A disposable, uncommitted Playwright script (deleted after use, not
saved anywhere) drove the real, unstubbed backend:

- **Rauðavatn↔Egilsstaðir, desktop/IS**: "Veður á 14 punktum", **0 option
  radios rendered** (confirmed programmatically) — a generic pair never
  shows the option control.
- **Selfoss↔Seyðisfjörður (longest new pair, 15 points), desktop/EN +
  UTC hour change**: "Weather at 15 points", the ≥400 km long-route
  comparison note shown, the real "largest gap... about 67.3 km, between
  Route point near Þvottá and Route point near Djúpivogur" — matching
  Jonesy's own cited 67.3 km figure exactly; a real "Unknown condition"
  row shown honestly (Stöðvarfjörður–Breiðdalsvík, "Animals on the road").
- **Egilsstaðir↔Seyðisfjörður (the tightest ordering case, via
  Fjarðarheiði), desktop/IS**: "Veður á 3 punktum", gap note "um 13,5 km,
  milli Nærri Fjarðarheiði og Seyðisfjörður" — matches the matrix's own
  13.5 km figure exactly.
- **Selfoss↔Hella (shortest new pair), mobile 360px/IS**: renders
  cleanly, no horizontal overflow.
- **Race**: Rauðavatn↔Selfoss north (2 option radios present, confirmed)
  → Rauðavatn↔Egilsstaðir (0 radios present, confirmed) — the prior
  pair's own `selectedOption`/option UI never leaks into the generic pair.
- **Keyboard**: Hella↔Seyðisfjörður — Tab from the "Til" select reaches
  the swap button then "Sýna leið"; Enter submits; real data renders.

All 7 screenshots were genuinely reviewed (not just claimed) and saved
only into `docs/ai/tasks/ticket-503/ring-completion/evidence/`:
`rvk-egilsstadir-data-desktop-is.png`,
`selfoss-seydisfjordur-data-desktop-en.png`,
`selfoss-seydisfjordur-hour-changed-desktop-en.png`,
`egilsstadir-seydisfjordur-data-desktop-is.png`,
`selfoss-hella-data-mobile-is.png`,
`switch-from-options-north-to-generic-desktop-is.png`,
`hella-seydisfjordur-keyboard-desktop-is.png`. No prior round's own
evidence images were touched — confirmed via `git status` (this task's
own `evidence/` directory, including its pre-existing `offline-matrix.*`
from the prompt-review stage, was untracked before this round).

## Honest coverage status for #503 (not a closure decision)

- **25/25 of the currently UI-selectable pairs are connected; 25/28 API
  pairs (3 junction-only pairs remain, never reachable from the UI)** —
  this is the full extent of what the existing 11-place UI list can
  reach, not 56-place national coverage.
- Rauðavatn↔Egilsstaðir and Rauðavatn↔Seyðisfjörður use **only** the
  single existing northern Ring Road route — no south/north choice was
  added or measured for them; this is an explicit, deliberate scope
  limit, not a gap to fix automatically.
- Point coverage remains "thin" over long stretches: the largest real
  gaps between forecast points are 80.5 km (Rauðavatn↔Egilsstaðir,
  Egilsstaðir→Háreksstaðir), 78.7 km (Rauðavatn↔Seyðisfjörður), 67.3 km
  (the Selfoss/Hella↔Egilsstaðir/Seyðisfjörður group), 35.6 km
  (Selfoss↔Hella, its own full length, only 2 points), and 13.5 km
  (Egilsstaðir↔Seyðisfjörður). None of this implies continuous weather
  coverage along any of these routes.
- No "safe/open/passable" route-wide claim is made anywhere — individual
  road sections (including the real "Unknown condition" row seen in the
  live run) read on their own, never as a whole-route verdict.
- CC does not compute or assert a "#503 closed" conclusion — that is the
  owner's own decision per the approved prompt's own explicit instruction.

No commit/push/deploy/GitHub action was taken.
