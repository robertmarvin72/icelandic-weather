# CC report — ticket-492, direct-flow

Executed against `docs/ai/tasks/ticket-492/direct-flow/approved-prompt-v1.md` (Festar ákvarðanir + C1–C7 + carried P1–P8) and `source.md`'s two newest additions. No STOP condition was hit — a frontend-only adapter against the unchanged `/api/winter-route` endpoint was able to carry both fixed routes without losing any existing UI coverage.

## What changed, in one paragraph

The "Fastar veðurleiðir"/"Velja staði" mode toggle is gone; `/winter-route` is now a single direct Frá→Til→"Sýna leið" flow. The two existing fixed routes (Rauðavatn–Vík default, Rauðavatn–Borgarnes) are now reachable through that same flow via two new place ids (`vik`, `borgarnes`) that resolve directly to `/api/winter-route?routeId=...` — a 4th "fixed" identity kind alongside the existing three geometry-based ones. The road-section list was redesigned to show notice content directly in one dense list by default (no more separate name-only chip + a second collapsed-but-DOM-present full list), with exactly one "Sjá alla vegkafla" control. A real mislabeling bug ("Óþekkt ástand" shown over a known road surface whenever an unrelated point notice couldn't be classified) is fixed. **No file under `api/` changed** (`git diff --stat -- api/` is empty).

## Parity table

| Route | routeId | Points | Segments | Direction note |
|---|---|---|---|---|
| Rauðavatn–Vík (default) | `raudavatn-vik` | 6 (P1–P6) | 13 idButur | unchanged from #486/#491 |
| Rauðavatn–Borgarnes | `raudavatn-borgarnes` | 4 (P1–P4) | 8 idButur | unchanged from #491 |

Both parity-checked against the real backend (`api/_lib/winterRoute/segments.js`, `api/_lib/winterRoute/routes.js`) by `src/lib/winterRoutePairParity.test.js` (point-id order, idButur order) and `src/lib/winterRouteRoutes.test.js` (routeId set, expectedPointCount, default id — pre-existing test, untouched).

**Supported directions:** the old 25 unordered pairs (50 directions) stand unchanged. 13 places now give 156 directional pairs total; exactly 52 are supported (the original 50 + exactly these 2 new ones): `reykjavik-raudavatn→vik` and `reykjavik-raudavatn→borgarnes`. The reverse direction (`vik→reykjavik-raudavatn`, `borgarnes→reykjavik-raudavatn`) and every other combination involving `vik`/`borgarnes` (including `vik↔borgarnes`) are `unsupported` with the existing "no route yet" text — never an invented reversal. Covered by `winterRoutePairParity.test.js`'s own negative cases and component tests.

**Group label:** "Aðrir studdir staðir" / "Other supported places" — a listbox-group label only; it does not imply the two places connect to each other or to the ring/Westfjords groups.

**Same-place handling:** `vik→vik` and `borgarnes→borgarnes` are handled by a new **client-side** same-place guard (`WINTER_ROUTE_CLIENT_SAME_PLACE_IDS`), scoped to exactly these two ids — zero fetch sent, same `SAME_PLACE` message as the real geometry path. The original 11 places are untouched: they keep using the real geometry endpoint's own `same_place` classification (needed because an existing test depends on a *real* `accessApproach`/`routeEndsShortOfOwnerCoordinate` flag for `talknafjordur|talknafjordur`, which a uniform client-side guard would have broken).

## Migrated vs. dropped legacy caveats

| Caveat | Fate |
|---|---|
| `winterRouteSectionCoverageNote` (Borgarnes reuses IDBUTUR extending past the actual drive) | **Migrated** — now rendered conditionally inside the new `RoadOverviewSection` for Borgarnes only (`sectionCoverageNote` prop, true only when `routeId === "raudavatn-borgarnes"`). |
| Vík's access point is ~629 m short of the real fixed-route endpoint (places.json's own provenance note: "innri samskeyti stykkja 3849/23041 ... heldur um 629 m lengra austur") | **Not re-stated in UI** — this is a place-registry provenance note about *why* `vik`'s coordinate was chosen, not a per-response runtime fact the page can observe; it was never shown in the legacy UI either. Documented here per C5, not added as new UI copy (out of scope — a new UI caveat would be a product-copy decision, not a bugfix). |
| Borgarnes = P4 (`places.json`'s own `approach: "Endapunktur Borgarnes–Baulan-vegkafla."`) | Same as above — registry provenance, not previously UI-visible, not added. |
| `routes.js`'s own header-comment caveat that the north/south-pair "inferred-northbound" direction is a data convention, never a driving-direction authority | **Unaffected** — applies only to ring-completion/ring-option pairs, not to the two fixed routes; nothing in this round touches that code path. |
| Legacy attribution block (Vegagerðin/Open-Meteo CC BY 4.0, "no endorsement", "official closures override", "not safety advice", links) | **Migrated** — the choose-flow's own `WinterRouteDataView` already renders the identical attribution block for every data-eligible result (geometry-based or fixed); no duplicate block was added. |
| Legacy "Nýjasta tiltæka staða, ekki spáð færð" / forecast-time wording | **Superseded** — the choose-flow has its own equivalent copy (`winterRouteDataHourLabel`, `winterRouteRoadCurrentRegardlessOfTimeNote`) from the time-slider round; not duplicated. |
| `winterRouteStaleBadge`/`winterRouteOldBadge` pill badges (`FlaggedSegmentChip`) | **Dropped** — `FlaggedSegmentChip` itself is deleted; `SegmentRow`'s own existing plain-text `winterRouteExportStale`/`winterRouteRegistrationOld` lines are reused instead (suppressed per-row via `hideStaleOldBadges` when `staleOldUniformity` already states it once). |
| "Sjá tilkynningar" action / `noticesOnly` filter | **Dropped** — notice content is already visible by default in the dense list; a separate notices-only filter view is redundant once nothing is hidden. |
| ACTIVE notice's own "— Tilkynning í gildi" suffix | **Dropped** (adds no information once the notice is already shown by default). "Útrunnin tilkynning – staðfestu hjá Vegagerðinni" and "Óþekktur gildistími" are **kept** (they carry real information), as is the prominent-expired-closure treatment. |

## The "Óþekkt ástand" fix (P6)

Root cause confirmed by reading `api/_lib/winterRoute/roadConditionCodes.js`/`roadSegmentPresentation.js`: a segment's composite `category` is the *worst* of (its own surface codes, every point notice on it). A single **unclassified point notice** on an otherwise perfectly well-known surface (e.g. `GREIDFAERT`) pulls the *whole segment* to `unknown_unclassified`, which then rendered as "Óþekkt ástand" directly over a concrete, known surface description — the literal bug.

Three independent causes can produce a composite `unknown_unclassified`, and only one of them is this bug:

- **(A) a point notice has an unregistered `Astand` code**, surface otherwise known → **this is the bug**. Fixed.
- **(B) `ambiguous: true`** (conflicting duplicate IDBUTUR rows, no forced closure) → genuinely unknown, left unchanged (per (a): never presented as a known surface).
- **(C) the surface's own `AstandYfirbord`/`AstandVidbotaruppl` code is itself unregistered** → genuinely unknown, left unchanged.

Fix: a new, small, **parity-tested** frontend copy of just the two surface-code tables (`src/lib/winterRouteRoadConditionCodes.js`, cross-checked against the real backend tables by `winterRouteRoadConditionCodes.test.js`'s own repo-read parity test, per P6(c)'s "protected by a repo-read parity test" allowance — no new backend field, no owner authorization needed, since `astandYfirbord`/`astandVidbotaruppl`/`ambiguous` were already present in the payload sent to the frontend). `winterRouteSurfaceDisplayCategory(segment)` recomputes the segment's surface-only category (excluding notices) and swaps the **pill only** to that value in exactly the case where the composite is `unknown_unclassified`, not ambiguous, and the surface's own codes resolve to something real. Every other category (closed/hazard/etc., however reached) is untouched — no new risk/category classification, no downgrading of a real closure. Proven live in a real browser (see evidence `05-p6-caseA.png`: pill now reads "Greiðfært", with both the unclassified notice's own text and a second, classified notice shown directly beneath it) and in jsdom (`winterRouteRoadConditionCodes.test.js`, cases A/B/C/D + "known road, no unknowns" + "missing segment data").

**Adjacent, out-of-scope observation (reported, not fixed):** for the ambiguous (B) and surface-own-Vidbotaruppl-unclassified (D) cases, the segment's own `astandLysing` *description line* (unaffected by this change — that logic predates this round) can still show the representative row's real surface text (e.g. "Greiðfært") directly under an "Óþekkt ástand" pill, which reads slightly contradictory (see `06-p6-caseB.png`, `08-p6-caseD.png`). This is pre-existing behavior, not introduced or made worse by this change, and redesigning the description line for these specific cases is a new product-copy decision beyond P6's authorized scope — flagging per CLAUDE.md's "report adjacent UX gap, don't fix without authorization."

## Code changes (frontend only)

- **`src/lib/winterRouteRoutes.js`**: added `idButurOrder`/`pointIdOrder` to both `WINTER_ROUTE_OPTIONS` entries, `WINTER_ROUTE_DIRECT_PAIRS`/`resolveDirectPairRouteId` (exactly the two pairs, explicit `routeId` per the prompt's own highest-priority override), `expectedPointIdOrderForRoute`/`expectedIdButurOrderForRoute` (exported but not currently consumed by `WinterRoute.jsx` itself — `validFixedRouteData` reads `route.idButurOrder`/`route.pointIdOrder` directly off the `WINTER_ROUTE_OPTIONS` entry it already has in hand).
- **`src/lib/winterRoutePlaces.js`**: `WINTER_ROUTE_GROUP_OTHER` + the two new place entries.
- **`src/lib/winterRouteGeometryResponse.js`**: `WINTER_ROUTE_OUTCOME.FIXED_ROUTE` (a sibling UI-facing outcome, never produced by `classifyWinterRouteGeometryResponse` itself — set directly by the caller after a successful fixed-route fetch).
- **`src/lib/winterRouteRoadConditionCodes.js`** (new): the P6 fix, described above.
- **`src/pages/WinterRoute.jsx`**:
  - `validRoadSectionsShape`/`validForecastShape` extracted and shared between the existing `validRouteData` (geometry pairs) and new `validFixedRouteData` (the 4th identity kind) — the C4 registration-bug fix (`segmentDataAvailable:false` sections may lack `registration`) lives in one place, fixing it for old pairs too.
  - `validFixedRouteData`: requires `routeId`/`expectedPointCount` match, the *absence* of `geometryId`/`regionVersion`/`selectedOption`/`datasetVersion`/`policyVersion`, and exact idButur/point-id order match — a blended/wrong-generation response is rejected, not just tolerated.
  - `WinterRouteGeometrySection`: `runFixedRequest` (reuses the existing geometry request's own abort/requestId/draft-vs-applied machinery), the client-side same-place guard, `resolveDirectPairRouteId` dispatch in `handleSubmit`, `isFixedRoute`/`dataView` computed synchronously from the single fetch (the existing separate `/api/winter-route-data` effect is untouched and simply never fires for fixed routes, since `dataGeometryId` is forced `null`).
  - `RoadOverviewSection`: full redesign (described above) — `FlaggedSegmentChip` deleted; one list at a time (`flaggedRoadSegments` when closed, all `data.roadSections` when open), one `<button aria-expanded aria-controls>` control (plain button, not `<details>`, so a section is never queryable twice in the DOM at once and the control naturally keeps its own focus after a click — no custom focus-restoring effect needed).
  - `SegmentRow`: `winterRouteSurfaceDisplayCategory` for the pill, dropped the active-notice suffix, new `hideStaleOldBadges` prop (replaces `FlaggedSegmentChip`'s own `showStaleOldBadges` for the "one shared stale/old sentence" case).
  - Top-level `WinterRoute` component: `mode`/`setMode`, `WINTER_ROUTE_MODE_CHOOSE`/`WINTER_ROUTE_MODE_LEGACY`, the toggle button group, the legacy `routeId`/`data`/`loadError`/`selectedHour` state + fetch effect + `view`/`viewErrorKey` masking, and the entire legacy JSX block (route `<select>`, road list, attribution block) removed. `ForecastCard`, `RouteSummary`, `SummaryMetricLine` deleted (every remaining caller was inside the removed block). `pageTitle` collapsed to `geometryTitle` alone; its pre-applied fallback changed from `t("winterRouteModeChooseLabel")` ("Velja staði", a button label) to a new neutral `t("winterRouteDefaultHeading")`.
- **`src/i18n/translations.winterRoute.js`**: added `winterRouteGroupOtherLabel`, `winterRouteDefaultHeading`; renamed `winterRouteViewAllSectionsAction` text to "Sjá alla vegkafla" / "View all road sections"; removed now-fully-unreachable keys (confirmed via grep, zero remaining references): `winterRouteModeChooseLabel`, `winterRouteModeLegacyLabel`, `winterRouteModeGroupLabel`, `winterRouteRouteSelectLabel`, `winterRouteSubtitle`, `winterRouteLatestStatusNote`, `winterRouteHourLabel`, `winterRouteNoHoursAvailable`, `winterRouteSameForecastTimeNote` (distinct from the still-used `winterRouteSameForecastTimeNoteChoose`), `winterRouteForecastSectionTitle`, `winterRouteRouteDataMismatch`, `winterRouteValidFor`, `winterRouteTemperature`, `winterRouteWind`, `winterRouteGust`, `winterRoutePrecip`, `winterRouteSummaryHeading`, `winterRouteSummaryGust*`, `winterRouteSummaryPrecip*`, `winterRouteSummaryMinTemp*`, `winterRouteSummaryPartialSuffix`, `winterRouteSummaryNoticeCount*`, `winterRouteSummaryNoticeScope`, `winterRouteViewNoticesAction`, `winterRouteFilteredNoticeNote`, `winterRouteStaleBadge`, `winterRouteOldBadge`. Keys still shared with the live choose-flow (`winterRouteForecastUnavailable`, `winterRouteGridDisclaimer`, `winterRoutePointUnavailable`, attribution lines, etc.) were left untouched.

**No file under `api/` changed.**

## Tests

- `src/lib/winterRouteRoadConditionCodes.test.js` (new, 10 tests): table parity + the P6 A/B/C/D + 2 required cases.
- `src/lib/winterRoutePairParity.test.js` (new, 6 tests): idButur/point-id order parity for both fixed routes, direct-pair resolution, reverse/other-combination rejection.
- `src/lib/winterRoutePlaces.test.js` (updated, 13 tests): 13-id list, 3 groups (5+6+2), the two new ids known, verbatim-name check extended to 12/13.
- `src/pages/WinterRouteOverview.test.jsx` (updated, 19 tests): the dense-default/single-control redesign (no duplicate rendering, single list mounted at a time, active-notice suffix dropped, stale/old uniformity via the new mechanism).
- `src/pages/WinterRouteTimeSlider.test.jsx` (fixture tweak, 22 tests): unaffected by this round except one shared fixture segment made genuinely flagged so it still renders in the default list (this file's own tests are about the time slider, not road-section flagging).
- `src/pages/WinterRoute.test.jsx` (large cleanup, 76 tests, now 1681 fewer lines than before): every test exercising the removed legacy UI (mode toggle, legacy `<select>`, `RouteSummary`, `ForecastCard`) deleted with a reason; every genuinely-affected choose-flow test (a non-flagged section no longer visible without opening "Sjá alla vegkafla", a renamed i18n key, a new 3rd ARIA group) fixed in place. **No identity/race/draft/fetch-count assertion was touched.**
- `src/lib/winterRouteRoutes.test.js` (pre-existing, untouched, still passes).

**Totals:** 212 tests passing across the 8 touched/new test files (`npx vitest run` via PowerShell); `npx eslint` clean on every touched file; `npm run build` succeeds.

## i18n / IS-EN status

No in-page language toggle exists on `/winter-route` today (confirmed via code: `usePageRouteProps`/`useLanguage` reads `lang` from `localStorage` once at mount, no `storage` listener) — this round does not add one (out of scope per P7). All tests and evidence load IS and EN as **separate page loads**; "a live toggle preserves state" is explicitly **not verified**, because there is nothing to toggle.

## Browser STUB evidence

`docs/ai/tasks/ticket-492/direct-flow/evidence/` — `direct-flow-fixtures.mjs` (builds fixtures by calling the real `api/winter-route.js` handler directly, stubbed upstream fetch, no live network) + `direct-flow-evidence.mjs` (Playwright driver, `page.route` interception only, vite dev on :5173, no mode-toggle click since it no longer exists). Both kept on disk per this ticket's own established convention.

- **Negative control**: a deliberately duplicated DOM (every section name doubled) is correctly detected as a duplicate by the same check used below — proves the check isn't vacuous.
- **Vík, 4 combinations** (1280px/360px × IS/EN), each narrow → open "Sjá alla vegkafla" → close again: exactly 1 fetch total, exactly 1 toggle control, zero duplicate section names at every step (`00`–`03` screenshots + `results.json`). Note: this particular fixture's fixed export timestamp happened to read as stale relative to real wall-clock time when the script ran, so every section was flagged and the narrow/open lists were the same size — the narrow-vs-full *content* distinction is already thoroughly covered by `WinterRouteOverview.test.jsx`'s own controlled (non-stale) fixtures; the browser run's job here was real-layout/real-click/real-DOM proof, which it gives.
- **Borgarnes**: one representative capture (1280px/IS), `winterRouteSectionCoverageNote` confirmed visible (`04`).
- **P6 cases A/B/C/D**: one capture each (1280px/IS) — case A visually confirms the fix ("Greiðfært" pill + both notices shown directly); B/C/D visually confirm the fix does *not* fire where it shouldn't (`05`–`08`).
- **Regression check**: one old ring-option pair (Búðardalur↔Hólmavík, real geometry/data endpoints, untouched by this round) still renders correctly with the redesigned `RoadOverviewSection` (`09`).
- **Not covered in the browser run** (left to the jsdom suite above, or genuinely NOT_TESTED): zoom, screen-reader, touch, mobile-as-resize (real viewport widths were used instead, per this ticket's own established rule).

## Scope discipline

- Zero commits, zero pushes, zero GitHub writes, zero deploys at any point.
- `#492` stays open; map/EPSG:3057/national-coverage work remains deferred, untouched.
- No backend file touched; no new dependency added.
- The STOP condition in the approved prompt ("ef afmarkaður frontendadapter getur ekki varðveitt leiðir samkvæmt C1–C7") was not triggered.

---

# Round 2 — `approved-prompt-v2.md` (V1–V6, fixing Jonesy's R1–R6)

Jonesy's result-review on the round-1 delivery above returned **REVISE** against 5 concrete findings (R1–R6; R6 was a disclosed-deviation decision, not a code defect). This section documents the fix for each, executed strictly within V1–V6's own binding text — no UI redesign, no adapter-architecture rework, no re-litigating round 1's own already-settled decisions.

## R1/V1 — retry now dispatches through the fixed adapter, never geometry

`handleSubmit`'s own dispatch (`resolveDirectPairRouteId` → `runFixedRequest`, else `runRequest`) was never mirrored in the `ERROR` branch's retry `onClick`, which unconditionally called `runRequest(...)` (the geometry endpoint). For a fixed pair, a transient failure's own retry therefore hit `/api/winter-route-geometry`, got `unsupported`, and showed "Engin leið er í leiðargrunninum" for a route that **is** supported — exactly Jonesy's reproduction. Fixed: the retry handler now re-resolves `resolveDirectPairRouteId(applied.from, applied.to)` and calls `runFixedRequest(..., "retry")` when it matches, falling through to `runRequest` only for geometry pairs. `runFixedRequest` gained the same `focusTarget`/`pendingFocusRef` parameter `runRequest` already had (it previously silently dropped focus restoration for every fixed-route retry/option action, though fixed routes have no options — this matters for retry specifically). Tests: `WinterRouteFixed.test.jsx`'s own "R1/V1" describe block — a transient network error on Vík and a 200-but-`validFixedRouteData`-invalid response on Borgarnes, both: retry re-sends the fixed request (never geometry), data appears, no "no route yet" text survives.

## R2/V2 — the OLD `src/pages/winterRoutePairParity.test.js` fixed, not left behind

Round 1 added a new `src/lib/winterRoutePairParity.test.js` but never touched the **pre-existing** `src/pages/winterRoutePairParity.test.js`, whose own `PLACES` array derives from `WINTER_ROUTE_PLACES` (now 13, not 11) — its second test's hardcoded `totalUnordered === 55` became `78` (C(13,2)), a real failing test the round-1 "212 tests passing" count silently excluded. Fixed: that file is restructured into three independent describe blocks that never blend the two layers: (a) the **old** classification layer, now explicitly scoped to `OLD_PLACES` (derived from group membership, not hardcoded) — unchanged assertions, still 25 unordered pairs/50 directions; (b) the **new** fixed-pair layer (`WINTER_ROUTE_DIRECT_PAIRS`/`resolveDirectPairRouteId`) — exactly 2 directions, confirmed **not** also claimed by the old layer; (c) the **combined total**, computed from `WINTER_ROUTE_PLACES` itself (not hardcoded): 156 directional pairs, 52 supported (50 + 2), 104 unsupported — "78 unordered pairs" is never used as a claim about connectivity anywhere. 5 tests → 10 tests, all passing; before/after documented here per C6/V2's own requirement.

## R3/V3 — a dedicated component-test file for the fixed flow (`src/pages/WinterRouteFixed.test.jsx`, new, 42 tests)

Jonesy's own mutation table found the fixed-route-adapter had **zero** repo component-test coverage: disabling the entire dispatch, every identity guard, the same-place guard, the C4 fix, the requestId guard, the Borgarnes caveat, and the counter semantics all left the existing suite 283/283 green. This file closes that gap:

- **Fetch count** (V3(a)): exactly 1 fixed request for each of Vík/Borgarnes, 0 geometry calls, and 0 additional fetch when the time slider is stepped.
- **C4, real-handler-shaped fixtures** (V3(b)): a new `docs/ai/tasks/ticket-492/direct-flow/evidence/followup/c4-fixtures.mjs` calls the REAL `api/winter-route.js` (fixed pair) and `api/winter-route-data.js` (Búðardalur↔Hólmavík) with a stubbed upstream `fetch` simulating (i) the road feed failing while the forecast succeeds and (ii) the reverse — producing a genuine `segmentDataAvailable:false` section **without** `registration` (the real bug shape), saved as `c4-fixtures.json` and read directly by the test file (never a hand-made fixture with a fabricated `registration` field). Both scenarios, for both the fixed pair and the old pair, show the real partial data (never a generic error).
- **The 4th identity kind's negative cases** (V3(c)): 10 named rejection cases (wrong routeId, wrong `expectedPointCount`, a `geometryId`/`datasetVersion`/`regionVersion` present, a missing/extra/reordered segment, a missing/reordered forecast point, a Borgarnes-shaped response on a Vík request) — each its own `it`, each independently confirmed (via mutation, see below) to actually exercise the guard it claims to.
- **Client same-place guard, reverse direction, swap cycle**: `vik→vik`/`borgarnes→borgarnes` send 0 fetch; the reverse direction and every other new combination (`hella→vik`, `vik↔borgarnes`) show "no route yet" via the real geometry endpoint's own `unsupported` response; a full supported→swap→unsupported→swap-back→supported cycle re-fetches correctly (1 fixed + 1 geometry + 1 fixed).
- **Stale-response races** (V3(d)): two scenarios — a *different*-pair race (fixed↔fixed, fixed↔geometry) that the existing `requestState.key === currentKey` check alone already protects against; and a **same-key** race (Vík requested, abandoned for Borgarnes, then Vík requested again, with the *first* Vík response arriving last) which the key-match check *cannot* distinguish — only the `requestIdRef` guard can, and does.
- **Borgarnes-only coverage caveat**, and **notice-counter semantics**: 0/1/many notice-carrying segments, 2 notices on 1 segment counting as 1, an expired notice still counting its own segment, an `unknown_unclassified` segment with zero real notices not counting, IS/EN plural forms.
- **V4(5) — SegmentRow A/B/C/D + closure, rendered, IS and EN**: 9 tests render the actual component (not just the pure-function unit tests in `winterRouteRoadConditionCodes.test.js`) for every one of P6's root causes plus the closure-protection case, confirming the exact visible pill text, description line, and (for case D) the new "Óþekktar viðbótarupplýsingar: {code}" line.

### Mutation-proof log (every claimed guard independently confirmed to fail on a named test, then reverted via `Edit`, never `git`)

| # | Mutation | Target file | Result |
|---|---|---|---|
| M1 | `validFixedRouteData`: idButur order check removed | `WinterRoute.jsx` | **Caught** — "rejects: segments in swapped order" |
| M1b | `validFixedRouteData`: forecast point order check removed | `WinterRoute.jsx` | **Caught** — "rejects: forecast points in swapped order" |
| M2 | `validFixedRouteData`: geometryId/regionVersion/datasetVersion/policyVersion rejection removed | `WinterRoute.jsx` | **Caught** — 3 "carries a ..." tests |
| M2b | `validFixedRouteData`: routeId check removed | `WinterRoute.jsx` | **Caught** — "rejects: wrong routeId in the payload" |
| M3 | client same-place guard disabled | `WinterRoute.jsx` | **Caught** — "vik -> vik: 0 fetch" |
| M4 | C4 fix reverted (`registration` always required) | `WinterRoute.jsx` | **Caught** — both "road feed down" C4 tests |
| M5 | fixed-route dispatch disabled (falls through to geometry) | `WinterRoute.jsx` | **Caught** — all 3 fetch-count tests |
| M6 | `winterRouteSurfaceDisplayCategory`'s ambiguous guard removed | `winterRouteRoadConditionCodes.js` | **Caught** — the lib "path B" test + both component "path B" (IS/EN) tests |
| M6b | the "surface-own-unknown" guard (path C) removed | `winterRouteRoadConditionCodes.js` | **Confirmed behaviorally equivalent, as Jonesy's own result-review already found** — the function's final `return yfirbord` line returns the identical value (`unknown_unclassified`) this guard would have returned via `segment.category`, since `segment.category === "unknown_unclassified"` is this branch's own entry condition. No test can distinguish the two code paths because they are not, in fact, two different behaviors. Left in place for readability/documentation, not because a test depends on it. |
| M7 | Borgarnes's own `sectionCoverageNote` prop forced `false` | `WinterRoute.jsx` | **Caught** — "Borgarnes shows winterRouteSectionCoverageNote" |
| M8 | `runFixedRequest`'s own `requestIdRef` guard removed | `WinterRoute.jsx` | **Caught** — the new same-key race test (the different-pair race tests do *not* catch this one, since the key-match check alone already protects them — this is exactly why a same-key race test was added) |
| M9 | notice counter counts only `status === "active"` notices | `WinterRoute.jsx` | **Caught** — "an expired notice still counts its own segment" |
| M10 | `SegmentRow` reads `segment.category` directly, bypassing the P6 fix | `WinterRoute.jsx` | **Caught** — "path A"/"path D" component tests (IS and EN) |

## R4/V4 — SegmentRow text decisions (Ripley's exact wording, both EN and IS)

1. **Closure never disappears** (V4(1)): `winterRouteSurfaceDisplayCategory` only ever acts on a composite `"unknown_unclassified"` category — a real closure's composite category is `"closed"` (escalated server-side via `classifySegmentAmbiguous`'s own `forcedCategory`), so the function is never even invoked for it; the pill is therefore untouched by construction. Only the **description line** changes for any ambiguous segment (closed or not) — see point 2.
2. **Ambiguous segments** (V4(1)/(the "B" case)): `SegmentRow` no longer renders `segment.astandLysing`/`astandLysingEn` (one contradictory duplicate row's own text, presented as if it were a known surface) for an ambiguous segment. It now shows the fixed string **"Ósamræmi í færðargögnum" / "Conflicting road-condition data"** instead — for every ambiguous segment, including one that is *also* a real closure (so a closed segment keeps its "Lokað" pill and gets this replacement description, never the stale representative-row text).
3. **Path D — known surface + unclassified `AstandVidbotaruppl`, round-2 correction** (V4(2)): round 1's `winterRouteSurfaceDisplayCategory` folded `AstandVidbotaruppl` into its own swap decision, so this case stayed `"Óþekkt ástand"` — wrongly hiding a known `GREIDFAERT` surface. The swap condition is now exactly what Ripley specified: **only** `!ambiguous && AstandYfirbord known` (never mentions `AstandVidbotaruppl` at all) — so this case now correctly shows the real surface category. The unclassified addition itself is never swallowed: a new line, **"Óþekktar viðbótarupplýsingar: {code}" / "Unknown supplementary condition: {code}"**, renders by default (not behind any control), with the code as plain text (React's own default escaping — no `dangerouslySetInnerHTML` anywhere). `positiveStyleEligible` is read unchanged from the payload, so this never renders with "confirmed good" green styling while an unclassified addition is present. The existing round-1 lib test asserting this case "never swapped" is updated in place with a stated reason (not hidden) — see `winterRouteRoadConditionCodes.test.js`'s own comment at that test.
4. **Path A** (unclassified notice, known surface): unchanged from round 1 — the pill still swaps to the real surface category. New in round 2: a notice without its own `lysing`/`lysingEn` now falls back to its raw `astand` code as plain text (previously would have rendered blank).
5. **Path C / missing data**: unchanged — an unregistered surface code, or a `segmentDataAvailable:false` segment, still show "Óþekkt ástand" / "Engin færðargögn tiltæk fyrir þennan kafla."

## R5/V5 — evidence re-run with a clock that matches the fixtures (`evidence/followup/`)

Round 1's evidence used a hardcoded past timestamp, which read as genuinely stale by the time the script ran — every section was flagged, so "narrow → open" proved nothing (`namesNarrowCount === namesOpenCount` in every combination), and no frozen clock/DOM n-and-first-slot/header-hit-test evidence existed at all. Fixed:

- `r5-fixtures.mjs` builds fresh fixtures via the real `api/winter-route.js` handler using `withFakeNow` (same technique as the time-slider round's own fixture generator), freezing generation at `2026-11-26T09:15:00Z` with segment/point timestamps ~25 minutes earlier — comfortably fresh, confirmed via `export.isStale === false` and `pointsFeedUnavailableOrStale === false` on every segment.
- `direct-flow-evidence-v2.mjs` freezes the **browser** clock to the identical timestamp (`page.clock.setFixedTime`, before navigation) so `useNowTicking`'s own `availableHours` filtering sees the same "now" the fixtures were built against.
- Both fixed routes × 1280/360 × IS/EN (8 combinations), each narrow → open → closed-again, with real DOM proof saved to `results-v2.json`: `n` (24, the real handler's own always-24-hour window) and the first slot's `aria-valuetext`, read from the DOM; `header.sticky`'s own measured `bottom` (153px @1280, 105px @360); a scroll-then-`elementFromPoint` hit-test confirming the real slider and the real first notice line sit under those points after scrolling below the header; `narrowLessThanOpen: true` and `narrowEqualsClosedAgain: true` in **every** one of the 8 combinations (the actual bug from round 1, now fixed); 0 extra fetch on a time-step keypress; fetch totals (1 fixed / 0 geometry) confirmed per combination.
- `staleLinePresent: false` confirmed in every combination (the fresh fixtures genuinely don't trigger the staleness line, unlike round 1's own screenshots).
- `vikMain`'s own screenshot (`vik-360-is-01-narrow.png`) visually shows both the R4 ambiguous-text fix ("Ósamræmi í færðargögnum") and the R4/round-1 P6(b) fix ("Greiðfært" pill with both notices shown directly) live, side by side, in the same real render.
- 0/1-notice separate runs (`04-zero-notices.png`/`04-one-notice.png`): the zero-notice run shows a genuine "Engar tilkynningar eða lokanir á leiðinni núna." (confirmed via `allClearVisible: true`); the one-notice run shows the correct singular count text and is confirmed *not* all-clear.
- One ring-option pair (Rauðavatn→Selfoss, south) as a regression check: the redesigned `RoadOverviewSection` still renders correctly for an existing geometry-based option pair, untouched by this round.
- Round 1's own `evidence/` files (scripts, fixtures, images, `results.json`) are untouched; everything new lives only under `evidence/followup/`.
- Still NOT_TESTED (genuinely not run, not claimed): real pinch-zoom, touch, screen reader. No visual PASS is claimed by CC anywhere in this round either — the owner reviews the screenshots.

## R6/V6 — the same-place deviation, now explicitly documented as a deviation

Round 1's cc-report described the client-side same-place guard's scope (vik/borgarnes only, the original 11 unchanged) as a design decision, but never explicitly labeled it as a **deviation from `approved-prompt-v1.md`'s own literal text** ("fyrir alla þekktu UI-staði"). Per Ripley's round-2 text, this is now stated plainly: **the original 11 places' own same-place case continues to go through the real geometry endpoint (1 fetch), preserving `accessApproach` metadata** (needed by the existing `talknafjordur|talknafjordur` test); **only `vik`/`borgarnes` use the new client-side 0-fetch guard**. This is a deliberate, narrower implementation than v1's own wording, approved by Ripley and Jonesy in round 2 (V6) specifically because the alternative (a uniform 0-fetch guard for all 13 places) would have silently dropped real `accessApproach` data for the original 11 and regressed an existing, passing test. Tested directly: `selfoss→selfoss` → 1 geometry fetch + `winterRouteSamePlaceMessage`; `vik→vik`/`borgarnes→borgarnes` → 0 fetch + the identical message text; and (via the stale-response race tests above) a same-place result is never shown under a stale `applied`/`draft` state.

## Round 2 totals

- **Tests**: 269 passing across 10 touched/new test files (`npx vitest run`, PowerShell) — up from round 1's 212, net new: `WinterRouteFixed.test.jsx` (42, new), `src/pages/winterRoutePairParity.test.js` (10, was 5, fixed not just left behind), plus the updated `winterRouteRoadConditionCodes.test.js`/`WinterRouteOverview.test.jsx`/`WinterRouteTimeSlider.test.jsx` assertions described above.
- `npx eslint` clean on every touched file; `npm run build` succeeds; `git diff --stat -- api/` remains empty.
- No commit, push, deploy, or GitHub write at any point in this round either. `#492` stays open.
