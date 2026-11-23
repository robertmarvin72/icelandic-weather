# cc-report — ticket #503: Búðardalur ↔ Hólmavík weather/road MVP (first B↔H binding)

## Scope delivered

Per `approved-prompt-v1.md` P1-P9: the **first** weather/road-closure data
binding for a new (ticket #501/#502) geometry-based Frá/Til pair —
**Búðardalur↔Hólmavík um Þröskulda, both directions** — layered under the
existing "Velja staði" flow. #503 as a whole remains open: other
pairs/options/the Ring Road/full coverage are explicitly **not** done here.

## P1 — real bounded probe (run before any implementation)

Script: `docs/ai/tasks/ticket-503/evidence/probe-and-registry.mjs` (read-only,
task-local). Run via `node --env-file=.env.local --env-file=.env.development.local
docs/ai/tasks/ticket-503/evidence/probe-and-registry.mjs`, PowerShell,
2026-11-23. **Succeeded on the first attempt — no retries needed.**

- Auth: `resolveWinterRouteForecastAuth()` boolean `available: true` (key
  never printed/logged).
- Segment feed: ok, `feedDagsKeyrtUt` age 2.8 min (fresh), **7/7 of the 7
  IdButur found, 0 ambiguous**.
- Point feed: ok, age 2.7 min (fresh), **4 real active notices** on 2 of
  our 7 segments: `805090037` (Gilsfjörður) ×2 `VEGAVINNA`, `905070037`
  (Búðardalur–Laugar) ×2 `HOLUR_I_VEGI`.
- Forecast: ok, 24-hour window, all 4 points validated. Per-point
  elevation vs. route z: budardalur-route 2.5 m, throskuldar-south-route
  1.1 m, **throskuldar-pass-route (the highest point) 0.1 m** (well under
  the P4(b) 100 m documentation threshold — no limitation note required
  for that point specifically), holmavik-route 20.0 m (a real, larger
  grid/sea-level-reference gap at a low-elevation coastal point — noted
  honestly here, not hidden, though it doesn't trigger P4(b)'s own named
  Þröskuldar-hæst threshold).
- Reverse-order (H→B) cross-check reused the same already-fetched data
  offline (no second forecast request) — all 4 reversed correctly.

No `key_missing`/`too_large`/timeout/STOP condition was hit.

## P2 — point registry, WGS84 (no production transform exists)

Confirmed (consistent with Jonesy's own prompt review): no
`isn93ToWgs84` production adapter exists; `lambertInverse` is test-local
in `approachSelections.test.js`. Per the approved solution, WGS84 was
computed **offline** (same GRS80/Lambert parameters used throughout this
ticket series) and stored as small, fixed, reviewed constants in
`api/_lib/winterRoute/budardalurHolmavikRoute.js`.

`api/_lib/winterRoute/budardalurHolmavikRoute.test.js` (11 tests)
independently re-derives the SAME inverse transform (not importing the
subject's own numbers) and confirms:
- Each point's native x/y/z is byte-identical to the real
  `westfjords-region-combined.json` vertex (read via the real loader).
- Each WGS84 value is within **1e-6°** of the prompt's own cited
  reference (all 4 points).
- `holmavik-route` is within **1e-7°** of the independent anchor in
  `winter-route-approach-selections.json`.
- Each point's native coordinate is a literal vertex on the real composed
  Búðardalur↔Hólmavík route (not just "close to" it).
- Reverse direction uses the exact same point ids/coordinates (never
  direction-dependent hnit).

## P3 — IdButur, edge segments, coverage honesty

`resolveBudardalurHolmavikGeometry()` derives the 7 IdButur **dynamically
every request** from the real composed geometry's own slices (n:1,
first-occurrence order) — never a CSV/hardcoded list. Confirmed matching
the prompt's own cited order exactly:
`805030037, 905070037, 905080037, 805090037, 907000037, 707040037, 907040037`
(reverse for H→B). `routeLengthM` sums to **78,697.77 m** (within 0.01 m
of the real composed total, both directions).

Edge segments (routeLengthM / total < 1%, computed dynamically, not
hardcoded ids): `805030037` = **205 m (0.26%)**, `907040037`
(Hólmavík–Drangsnesvegur) = **517 m (0.66%)** — exactly the two the prompt
names. Both are flagged `isEdgeSegment: true` and the UI renders a
dedicated short-section caveat on each (never a whole-route status claim).
Real-browser evidence confirms this: in the live screenshots, both
sections render the caveat text, and the rest of the route's own sections
keep their own real, independent category.

No forecast point exists in the first ~48 km after Búðardalur (only 4
points total, structurally documented) — the UI's own
`winterRouteNoCoveragePointsNote` states this plainly
("Veður á fjórum völdum punktum; Svínadalur/Gilsfjörður hafa engan eigin
punkt.").

Display names (`nameIs`) are the real retained `name` field of each
IdButur's own first slice (never handwritten); `nameEn` is a small, fixed,
reviewed CC translation of those 7 specific real names (same convention
as `segments.js`'s own existing Vík/Borgarnes labels).

## P4 — elevation honesty

`forecast.points[].elevation` (grid elevation) is shown alongside no
route-z comparison in the UI (the UI never claims "weather at the
highest/Þröskuldar point itself" — card labels are the point's own name,
e.g. "Þröskuldar", with the existing `winterRouteGridDisclaimer`
("A forecast grid point from a weather model — not a direct measurement
on the road.") reused verbatim, same as every other forecast card on this
page). No new elevation-correction parameter was added. Per-point
`available:false` (never seen in this round's real probe, but covered by
`winter-route-data.test.js`) renders as the existing "forecast not
available" per-card state, not a blank "good".

## P5 — API contract and cache

**New endpoint (`api/winter-route-data.js`) justified over extending
`ROUTE_DEFS`:** the response contract genuinely differs — route identity
is `from/to/geometryId/regionVersion` (not a fixed `routeId` string), each
road section carries its own real `routeLengthM`/`routeLengthFraction`/
`isEdgeSegment`, and the request itself is validated against ticket
#501's own live geometry resolution (`geometryId` cross-check,
`geometry_mismatch` on any disagreement) — something the existing
`ROUTE_DEFS` allowlist has no concept of at all. Squeezing this into
`winter-route.js`'s existing shape would require conditionally changing
its entire response envelope per `routeId`, a larger and more invasive
change than a new thin handler. The shared per-segment/notice
classification logic (`computePointsFeedUnavailableOrStale`,
`buildNoticePayload`, `classifySegmentAmbiguous`) was **extracted
verbatim** from `winter-route.js` into
`api/_lib/winterRoute/roadSegmentPresentation.js` and is now imported by
both handlers — `winter-route.js`'s own 20 existing tests pass unchanged
(byte-identical output; a relocation, not a logic change), confirmed by
re-running that file's own test suite before/after.

**Function count:** `api/**` top-level handlers (excluding `_lib`/tests):
**16 → 17** (the new `winter-route-data.js`). I can only see this repo's
own staged files, not the owner's actual Vercel plan/limit — **I cannot
confirm whether 17 fits the owner's plan**; this is reported honestly
per P5(b), not assumed.

**Cache (P5c):** both directions key the exact same fixed bucket pair
(`CACHE_ROUTE_KEY = "winter-route-data:budardalur-holmavik"`, never built
from client `from`/`to`). `api/winter-route-data.test.js`'s own
`"P5(c)"` test fires concurrent `from=budardalur&to=holmavik` and
`from=holmavik&to=budardalur` requests on a cold cache and confirms
**exactly 3 upstream calls** (1 segment + 1 point + 1 forecast), never 6;
a repeated request within TTL makes 0 new calls.

**Contract:** GET only (`OPTIONS`/`405` as in `winter-route.js`),
`Cache-Control: no-store`, no client-supplied coordinates/IdButur/
providers; `from/to` outside `{(budardalur,holmavik),(holmavik,budardalur)}`
→ `400 unsupported`; **`geometryId` is required and independently
re-verified server-side every request** — a mismatch returns
`400 geometry_mismatch`, never trusted blindly. Errors never leak a
stack/key/raw upstream error (same `502 winter_route_error` pattern as
`winter-route.js`).

## P6 — UI, race isolation, accessibility

- The new `/api/winter-route-data` fetch is gated **strictly** on: applied
  pair is B↔H, draft still matches applied, the geometry request is not
  loading, and the on-screen result is a real `geometry_only` response —
  confirmed never firing for `same_place`/`unsupported`/other pairs
  (dedicated test + real-browser test).
- Own `AbortController`/`requestId`/`lastDataKeyRef` dedup (same proven
  pattern as the existing geometry/legacy-routeId effects elsewhere in
  this file); changing the draft away from B↔H aborts the in-flight data
  request and never shows it resolving late under the new pair (dedicated
  test with a manually-resolved Promise).
- **Accessibility — two separate `role="status"` regions**, a deliberate
  reading of P6(c): one for the Frá/Til request status (unchanged from
  ticket #502), one new one for the B↔H data section's own status
  ("Sæki veður og færð…" / error / the connected result) — never firing
  together as a double announcement of the same event. Documented here as
  an interpretation, since the prompt's own wording ("liggur utan 502
  `role="status"` svæðisins **eða hefur eigið**") explicitly allows this
  reading.
- The shared UTC hour `<select>` is local-only — confirmed by a dedicated
  real-browser test that selecting a different hour fires **zero** new
  requests, and a unit test confirming the same.
- Mode round-trip (Velja staði → Fastar veðurleiðir → Velja staði) never
  re-fetches or loses the already-connected B↔H data (real-browser test;
  this reuses the ticket #502 round's own `hidden`-attribute-not-unmount
  fix, so the data section's own local effect/state is never torn down by
  a mode switch).
- i18n: 5 new `winterRoute*` keys (IS/EN), swept clean by the existing T3
  forbidden-word test with no changes needed to that test itself.
- `winterRouteBaseDisclaimer` is swapped for the new
  `winterRouteDataConnectedDisclaimer` text **only** once the B↔H data
  endpoint has actually confirmed success (`dataConnected` prop) — never
  a false "not yet connected" once it IS connected, and never a false
  "all covered" before it is.

## P7 — tests (before/after, names unchanged where pre-existing)

| File | Before | After |
| --- | --- | --- |
| `api/winter-route.test.js` | 20 | **20 (unchanged, extraction only)** |
| `api/winter-route-data.test.js` | — | **17 (new)** |
| `api/_lib/winterRoute/roadSegmentPresentation.test.js` | — | **5 (new)** |
| `api/_lib/winterRoute/budardalurHolmavikRoute.test.js` | — | **11 (new)** |
| `src/pages/WinterRoute.test.jsx` | 80 | **87** (80 unchanged-assertion tests + 7 new; see note below) |
| `tests/e2e/winter-route-ticket-503.spec.js` | — | **5 (new, real backend)** |

Note on `WinterRoute.test.jsx`'s 80 pre-existing tests: two needed a
**test-isolation-only** adjustment, not a behavior/assertion change —
(a) the shared `geometryAwareFetch` test helper gained a URL-path guard
so a new `/api/winter-route-data` call (which this round introduces)
never wrongly matches an existing geometry-only fixture keyed by the same
`from`/`to` query params; (b) one existing test
("P4(d): a network failure shows the generic error...") was moved from
the `budardalur↔holmavik` pair to `isafjordur↔patreksfjordur` specifically
so its own call-count assertion (testing geometry retry, unrelated to
#503) isn't affected by the new B↔H-specific data fetch — its own
assertions/semantics are byte-identical, only the exercised place pair
changed.

Commands (PowerShell, vitest 4.1.10, Node v24.11.0, 2026-11-23):
```
npx vitest run api/winter-route.test.js api/winter-route-data.test.js api/winter-route-geometry.test.js api/_lib/winterRoute/roadSegmentPresentation.test.js api/_lib/winterRoute/budardalurHolmavikRoute.test.js src/pages/WinterRoute.test.jsx src/lib/winterRoutePlaces.test.js src/lib/winterRouteGeometryResponse.test.js
```
**Result: 8 files, 297/297 passing** (run twice for stability, no
flakiness). ESLint clean on every new/modified file. `git diff --check`:
benign CRLF-will-be-replaced warnings only (2 files), no real whitespace
errors. No full-suite/mutation run (not warranted — no file outside this
round's own scope was touched).

Environment note (consistent with tickets #501/#502): this session's
Bash/Git-Bash tool is known to break vitest's module runner here; not hit
this round since every vitest command was run via PowerShell.

## P8 — real browser (genuine, not imagined)

Both `vercel dev` (port 3000, serving the real unmocked handlers) and
`npm run dev` (Vite on 5173) were **already running** from outside this
session — confirmed serving the real, updated code via direct `curl`
checks before and after use; neither was started, stopped, or
reconfigured by this round.

`tests/e2e/winter-route-ticket-503.spec.js` — **deliberately does not
stub `/api/winter-route-geometry` or `/api/winter-route-data`**; every
request in this spec hits the real backend (real Vegagerðin feeds, real
Open-Meteo forecast, real `OPEN_METEO_API_KEY` present in that backend
process — if it had been missing, "forecast not available" would itself
have been the valid degraded-state signal per P8a, never a weather
confirmation; it was not missing this round). Covers: B→H and H→B (own
geometryId/own request each), UTC hour selection (local-only, 0 new
requests confirmed), mode round-trip preserving connected data, mobile
(360px, English, no horizontal scroll), and confirming a non-B↔H pair
never fetches `/api/winter-route-data` at all.

**5/5 passing.** 3 screenshots saved to `docs/ai/tasks/ticket-503/evidence/`:
`budardalur-holmavik-data-desktop-is.png`, `holmavik-budardalur-data-desktop-is.png`,
`budardalur-holmavik-data-mobile-en.png` — **each is real data, not a
stub** (noted per-screenshot here, not re-stated per-file). **CC itself
visually reviewed all 3 screenshots this round** (via the Read tool's
image support) and confirms they show: real live forecast values on all 4
cards, real road-condition categories and notices (including the 2 real
active notices the P1 probe found: `VEGAVINNA` on Gilsfjörður,
`HOLUR_I_VEGI` on Búðardalur–Laugar), the edge-segment caveat correctly
rendered on exactly the 2 expected short sections, correct reverse-order
rendering for H→B, and clean mobile layout with no horizontal scroll. The
owner's own review of these same files remains the final word, per the
prompt's own "ekkert ímyndað sjónrænt PASS."

Regression check (not required to change, confirmed unaffected): the
existing `winter-route-ticket-502/486/491.spec.js` real-browser suites —
**26/26 passing** unchanged after this round's `WinterRoute.jsx` edits.

## Per P9

No commit, push, deploy, or GitHub action of any kind was taken. Changes
are confined to: `api/winter-route.js` (extraction only, verified
byte-identical), new `api/winter-route-data.js` +
`api/_lib/winterRoute/{roadSegmentPresentation,budardalurHolmavikRoute}.js`
(+ their tests), `src/pages/WinterRoute.jsx` + its test file,
`translations.winterRoute.js`, the new e2e spec, `docs/ai/tasks/ticket-503/`,
and `CURRENT.md`. `api/winter-route-geometry.js` and `server_data/*.json`
are **untouched** — read-only reuse of their underlying lib modules only.

**Incidental side effect, noted honestly:** re-running the pre-existing
`winter-route-ticket-502.spec.js` real-browser suite as this round's own
regression check (P7/P8) regenerated 3 of that suite's own screenshots at
their same file paths (`docs/ai/tasks/ticket-502/evidence/
budardalur-holmavik-desktop-is.png`, `flokalundur-selfoss-400-desktop-is.png`,
`rvk-budardalur-unsupported-desktop-is.png`) with today's live
forecast/road data rather than ticket-502's own original approval-day
data — the same kind of incidental artifact growth prior rounds' own
`server.log` files showed, not a scope change. Ticket #502 is already
closed/PASS; these are illustrative screenshots, not load-bearing
approval records, and their content remains materially the same shape
(same pairs, same UI). Not reverted.

**#503 is NOT complete.** This round delivers exactly one bounded B↔H
binding, both directions, 4 points, 7 road sections. No other
pair/option/the Ring Road/broader coverage was implemented. No "safe/
open/passable" or continuous-coverage claim is made anywhere in this
round's own UI or API responses — every response carries
`drivingAccess: UNVERIFIED`-equivalent honesty (the geometry layer's own
existing disclaimer) plus this round's own edge-segment/coverage-gap
notes. See `503-remaining.md` for the explicit list of what is left.
