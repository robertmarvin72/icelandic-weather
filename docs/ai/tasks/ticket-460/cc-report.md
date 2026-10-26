# #460 — CC report

P0 fix: route-weather estimation must never fabricate LOW from missing/invalid data. Executed `docs/ai/tasks/ticket-460/approved-prompt-v1.md` in full (audit-first → implementation → tests → browser evidence). No subagents, no commit/push/deploy/GitHub mutation, no instruction-file edit, no `.env`/account/provider work.

## Baseline

- `git rev-parse HEAD` before and after: `ba2327fd7fcb226b5d0aeadd99e2f930e875268c` (unchanged — no commit made).
- `git status --short` before: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-437/github-followups/`, `?? docs/ai/tasks/ticket-463/`.
- No application file touched before this round's own edits (confirmed by the pre-round status above).

## Repo-wide audit (J8)

Searched `src`, `api`, `scripts`, `tests`, `docs` for `routeRisk`/`estimateRouteRisk`/`classifyRouteRisk` and for any `analytics.js` coupling. Result: entirely frontend, confined to 7 files pre-existing (`src/lib/routeRisk.js`, `src/hooks/useRoutePlanner.js`, `src/components/RoutePlannerCard.jsx`, `src/components/routePlannerDetailsHelpers.js`, `src/components/RoutePlannerDetailsModal.jsx`, `src/lib/routePlannerSummary.js`, `src/lib/routePlannerNarrative.js`) plus the `translations.routePlanner.js` i18n keys. Zero hits in `api/`, `scripts/`, or `src/lib/analytics.js` — no server, cron, or analytics-payload coupling to this ticket.

## Consumer matrix (every branch, before vs. after)

| File | Branch | Before (bug) | After |
|---|---|---|---|
| `routeRisk.js` `classifyRouteRisk` | null/undefined/NaN/negative/string input | fell through to `"LOW"` (RC-01..RC-10) | `"UNKNOWN"` unless a valid reading independently reaches MED/HIGH |
| `routeRisk.js` `estimateRouteRisk` | all points fail (reject or resolve null/empty) | `maxWind`/`maxGust` stayed at their `0` initializers → `"LOW"` (RC-17, #437 F-04) | maxima stay `null` until a valid reading is seen; `"UNKNOWN"`, `coverage.status: "unavailable"` |
| `routeRisk.js` `estimateRouteRisk` | one point's fetch rejects | uncaught `await` — the throw aborted the WHOLE estimator, discarding every other point's result too | per-point `try/catch`, treated as a missing point, loop continues; only that point is excluded from the valid count |
| `useRoutePlanner.js` hook catch (estimator itself throws) | — | `setRouteRiskData(null)` — silent, renders nothing, indistinguishable from "no risk to show" | `setRouteRiskData({routeRisk:"UNKNOWN", coverage:{status:"unavailable",...}})`, `setRouteRiskStatus("failed")` — same visible message as "unavailable" |
| `RoutePlannerCard.jsx` verdict-block ternary (main ~1191-1201, pre-edit) | routeRisk is anything other than HIGH/MED | fell through to `t("routeRiskLow")` wording while the OUTER `routeRisk !== "LOW"` guard had already decided to render the box — i.e. a future UNKNOWN would show "Route risk: Low" | split into an explicit HIGH/MED amber box (+ partial qualifier) and a separate, neutral, non-amber UNKNOWN message; no path reads the Low word for a non-LOW value |
| `RoutePlannerCard.jsx` `verdictBlockHasIndicator` | routeRisk `!== "LOW"` (so MED **and any future value**) triggers the #436 source note | UNKNOWN would have silently triggered `HazardSourceNote` | explicit `=== "HIGH"` / `(!isPreview && === "MED")`; UNKNOWN never triggers it (J3) |
| `RoutePlannerCard.jsx` `routeRiskBadgeLabel()` | level is anything other than HIGH/MED | fell through to the Low word | explicit LOW branch + explicit Unknown fallback (defensive; current call sites only ever pass literal "HIGH"/"MED") |
| `routePlannerDetailsHelpers.js` `getRouteRiskSummary()` | routeRisk is anything other than HIGH/MED (and not LOW) | fell through to the Low word AND no tooltip — a future UNKNOWN would render "Lág"/"Low" with no caveat | ~~every one of {LOW, MED, HIGH, UNKNOWN} has its own explicit branch~~ **superseded, v2 R1**: the v1 "MED" branch was itself an unconditional fallthrough, not a real check — `undefined`/`null`/malformed values silently read as MED. Now genuinely explicit: HIGH/MED are real `===` checks, everything else (UNKNOWN + any unrecognised value) is the one fallback, always neutral-unknown. `unknown`/`partial` flags added. |
| `RoutePlannerDetailsModal.jsx` route-risk box | — | single amber box for any non-LOW `routeRiskSummary` | split: amber box only for HIGH/MED (+ partial qualifier + reused `routeRiskTomorrow`/`routeRiskBasedOn` context lines), separate neutral box for UNKNOWN |
| `routePlannerSummary.js` `deriveRoutePlannerSummary()` move→consider override | `routeRiskData?.routeRisk === "HIGH"` (strict equality) | **already correct** — this is the ONE consumer that was never buggy, because it used strict equality rather than `!== "LOW"`. Pinned with a new test file (`routePlannerSummary.test.js`) so a future edit can't regress it toward a `!== "LOW"`-style check. No code change. |
| `routePlannerNarrative.js` `buildRouteNarrative()` (exported) | strict equality on HIGH/MED | already correct, same reasoning | **confirmed unused in production** (see below) — no change, no new test added (would be testing dead code) |
| `RoutePlannerCard.jsx` local `buildRouteNarrative()` | strict equality on HIGH/MED | already correct | no change |

### J7 — the duplicate narrative implementation

`RoutePlannerCard.jsx` imports `getHazardBlockText`, `getStayReasonText`, `getHazardWindowNarrative`, `getRoughWeatherWindowText` from `src/lib/routePlannerNarrative.js`, but **not** `buildRouteNarrative` — it defines its own local copy (lines ~898-949) instead. Confirmed via the card's own import list (`src/components/RoutePlannerCard.jsx:16-21`) and a repo-wide grep: `lib/routePlannerNarrative.js`'s exported `buildRouteNarrative` is only exercised by its own test file, never imported anywhere else. Reported honestly per J7/J12; left untouched (no duplicate refactor, no scope creep) — both copies already use strict `=== "HIGH"`/`=== "MED"` equality, so neither needed a change for this ticket regardless of which one is "real."

## Finalized coverage/data contract (J1, binding)

Monotone contract, exactly as Ripley's J1 decision specifies:

- **HIGH** — any valid wind or gust reading (at any of the sampled points) reaches `windHigh`/`gustHigh`. Lower bound: true even with missing/invalid data elsewhere.
- **MED** — same, for `windWarn`/`gustWarn`, if no HIGH.
- **LOW** — only when every requested point has a valid wind AND a valid gust reading, and none reaches MED/HIGH.
- **UNKNOWN** — anything else (some points missing/invalid, nothing observed reaches MED/HIGH).
- **`coverage`**: `{ status: "complete"|"partial"|"unavailable", wind: {requested, returned, valid}, gust: {...}, rain: {...} }`. `requested` is always the sample count (7, deterministic, independent of success/failure). `returned` counts a point where the API gave *something* (even `null`) for that slot; `valid` counts the strict-validity subset.
- **Validity**: `typeof v === "number" && Number.isFinite(v) && v >= 0`. Strings are not coerced; negatives, `NaN`, `Infinity`, `null`, `undefined` are all invalid. `0` is valid (not treated as missing).
- **Rain**: tracked the same way (`rainMax`, `null` until a valid sample is seen) but never gates wind/gust completeness and never contributes to `classifyRouteRisk`. Unchanged from before this ticket in that respect — only the "stays `null` instead of defaulting to `0`" part is new.
- **No new numeric threshold, no coverage percentage, no upper-bound cap** — only the completeness/validity gate described above.

`classifyRouteRisk({maxWind, maxGust, windComplete, gustComplete, hazards})` (exported, J4): independently re-validates `maxWind`/`maxGust` at its own boundary (so a caller cannot reintroduce the bug by passing raw numbers without completeness info — omitting `windComplete`/`gustComplete` defaults to `false`, i.e. "unknown," never `"LOW"`). The numeric `>=` comparisons against `windWarn/windHigh/gustWarn/gustHigh` are byte-identical to before.

## Full-data parity / partial-high preservation

- **Full-valid parity**: `routeRisk.test.js`'s "complete calm route" and "complete windy route" tests, plus the browser `complete-calm` scenario, confirm LOW/HIGH for fully-valid input is unchanged from the old behavior (same thresholds, same maxima reported).
- **Known-HIGH under partial coverage is preserved, not silently lost**: `routeRisk.test.js`'s "mixed partial + known-HIGH" test and the browser `partial-high` scenario (5 of 7 points failed, the 2 remaining report wind=20) both confirm `routeRisk` is still `"HIGH"`, `routePlannerSummary.js`'s move→consider override still fires (`routePlannerSummary.test.js`), and the UI still shows the amber caution box — now additionally labelled "(based on partial route data)" per the prompt's explicit "lower-bound, qualified in UI" requirement.
- **Partly-observed subthreshold readings do not produce LOW reassurance**: `routeRisk.test.js`'s "mixed partial + subthreshold only" test and the browser `severe-partial-unknown` scenario (2 of 7 points succeed with calm/subthreshold readings, 5 of 7 fail) both confirm `"UNKNOWN"`, not `"LOW"` — this is the literal #437 F-04/RC-17 bug, now fixed and reproduced end-to-end in a real browser.

## "Tomorrow" truthfulness (J9)

`estimateRouteRisk` now records `routeDate` (the actual `daily.time[1]` value from the first point that returns one) and `dateVerified` (true only if every point that returned a date agrees). The hook (`useRoutePlanner.js`) compares `routeDate` to the real calendar tomorrow (`tomorrowISODate()`, already defined there) and exposes `dateVerifiedTomorrow` on `routeRiskData` — **only** this boolean gates showing the reused `routeRiskTomorrow` i18n key in the details modal; when the date is unverified or doesn't match, the heading is simply omitted (never a guess, never an invented date). The modal also always shows the reused `routeRiskBasedOn` caption ("Based on forecast wind and gust conditions along the route") for HIGH/MED, which makes no date claim at all. If `daily.time` is absent everywhere, `routeDate` stays `null` and `dateVerified` is `false` — confirmed by a dedicated test. This is UI-context only; the estimator's own index-1 ("tomorrow") sampling point is unchanged (J9 explicitly forbids changing date semantics).

## Known, accepted, unchanged limitations

- **J11 — sequential, no timeout**: `estimateRouteRisk`'s `for...of` loop with `await` inside is unchanged in order/count; a hanging per-point fetch still leaves the route in `loading`. Not fixed (out of scope per J11).
- **Architectural finding (new, discovered while building browser evidence, not previously documented)**: the route estimator's `origin`/`destination` are *exactly* the base/candidate campsite coordinates (`useRoutePlanner.js`'s `origin: {lat: baseLat, lon: baseLon}, destination: {lat: destLat, lon: destLon}`), and `interpolateRoutePoints` always includes the exact endpoints as sample index 0 and index (samples-1). `forecastCache.js` caches per-coordinate (`forecast:v8:<lat>,<lon>`, in-memory + localStorage, 30 min TTL) for the whole page lifetime. This means the relocation engine's own forecast fetch for the base/candidate sites and the route estimator's first/last sample points share the *same cache entry* — a genuine "all 7 of 7 route points fail" is not reachable in the real running app without the relocation engine's own recommendation also failing (since that would mean the base/candidate forecast itself failed). The real-app-achievable floor is 5-of-7 (every strictly-interior point failing, the two endpoints succeeding from the already-resolved base/candidate forecast) — which is exactly what "severe-partial-unknown" exercises below, and is arguably the more realistic/important case regardless. The literal all-failed/all-null/all-rejected case is still fully proven at the pure-function (`routeRisk.test.js`) and hook (`useRoutePlanner.test.js`, "thrown estimator") levels, just not as an integration/browser scenario. No code change proposed — this is a reported observation, not a bug in scope for #460; flagging per the contract's "report, don't guess" instruction.
- `#461`/`#462` (weighted-wind semantics, broad vocabulary) and the other `?? 0` default sites (F-05) are untouched, as instructed.

## Changed files

**Implementation:**
- `src/lib/routeRisk.js` — `classifyRouteRisk` hardened (independent validity re-check, `windComplete`/`gustComplete` params, safe default); `estimateRouteRisk` rewritten (per-point try/catch so a rejection no longer aborts the whole route; strict validity checks; `null`-until-valid maxima for wind/gust/rain; `coverage` object with requested/returned/valid per variable; `routeDate`/`dateVerified`).
- `src/hooks/useRoutePlanner.js` — new optional `routeRiskStatus` state (`undefined`/"loading" implicit via existing `routeRiskLoading`/"complete"/"partial"/"unknown"/"failed"); catch path now sets a visible UNKNOWN `routeRiskData` instead of `null`; `dateVerifiedTomorrow` computed and attached.
- `src/components/RoutePlannerCard.jsx` — `routeRiskBadgeLabel()` hardened (no Low fallback); `verdictBlockHasIndicator` no longer treats "not LOW" as "has indicator" (UNKNOWN excluded); verdict-block ternary split into an explicit HIGH/MED box (+ partial qualifier) and a separate neutral UNKNOWN message.
- `src/components/routePlannerDetailsHelpers.js` — `getRouteRiskSummary()` rewritten with an explicit branch per `{LOW, MED, HIGH, UNKNOWN}`; added `unknown`/`partial` flags to its return shape. ~~(this v1 description itself overclaimed — see "v2 Correction — R1" below: the MED branch was not actually a real `===` check until the v2 round.)~~
- `src/components/RoutePlannerDetailsModal.jsx` — route-risk box split into amber (HIGH/MED, + partial qualifier + reused `routeRiskTomorrow`/`routeRiskBasedOn` lines) vs. neutral (UNKNOWN).
- `src/i18n/translations.routePlanner.js` — added `routeRiskUnknown`, `routeRiskUnknownDetail`, `routeRiskPartialQualifier` in both `en`/`is` (parity-checked: 234 keys each, no mismatches; no forbidden word ("low"/"safe"/"fine"/"lág"/"öruggt"/"fínt"), no official body named).

**Tests (new files):**
- `src/lib/routeRisk.test.js` — 22 tests (classifyRouteRisk boundary/hardening + estimateRouteRisk integration, including RC-17 and the real-rejection-path reproduced with 7 points per J2).
- `src/hooks/useRoutePlanner.test.js` — 8 tests (status lifecycle, failed-path visible-UNKNOWN, date verification, cancellation/race).
- `src/lib/routePlannerSummary.test.js` — 6 tests (pins the already-correct move→consider override across LOW/MED/HIGH/partial-HIGH/UNKNOWN/null).

**Tests (extended existing files, no existing assertion weakened):**
- `src/components/routePlannerDetailsHelpers.test.js` — +8 tests for `getRouteRiskSummary` (new import added).
- `src/components/RoutePlannerCard.caution.test.jsx` — +3 tests (UNKNOWN no-note, UNKNOWN neutral message, partial-HIGH qualifier + note).
- `src/components/RoutePlannerDetailsModal.test.jsx` — +4 tests (UNKNOWN neutral block, partial-HIGH qualifier, dateVerifiedTomorrow heading present/absent).

**Test infrastructure (new):**
- `playwright.ticket460.config.js` (repo root) — a separate Playwright config whose `webServer` runs `npm run preview` (serving the real production `dist/` build) instead of the default config's `npm run dev`, per J6 ("a production build has no /api" — this config exists so the browser evidence genuinely exercises the production bundle, not dev-mode modules). Does not touch or replace the existing `playwright.config.js`.
- `tests/e2e/route-risk-ticket-460.spec.js` — 7 Playwright scenarios (see below).

## Test commands and results

```
npx vitest run src/lib/routeRisk.test.js src/lib/routePlannerSummary.test.js src/hooks/useRoutePlanner.test.js src/components/routePlannerDetailsHelpers.test.js src/components/RoutePlannerCard.test.jsx src/components/RoutePlannerCard.caution.test.jsx src/components/RoutePlannerCard.canonicalTone.test.jsx src/components/RoutePlannerDetailsModal.test.jsx src/lib/routePlannerNarrative.test.js
  Test Files  9 passed (9)
  Tests  149 passed (149)

npm run test:run   (full suite)
  Test Files  187 passed (187)
  Tests  2807 passed (2807)
  (pre-existing "Not implemented: navigation to another Document" jsdom warnings, unrelated baseline noise)

npm run lint
  (clean, no output)

npm run build
  ✓ 3039 modules transformed, built in 8.76s
  (pre-existing >500kB chunk-size warning, unrelated baseline — same chunks as before this ticket)
```

## Browser acceptance (production build, full real app wiring)

Run via `npx playwright test --config=playwright.ticket460.config.js` (serves the just-built `dist/` through `vite preview` on port 4460; every `/api/*` response is mocked with `page.route()` — session/`/api/me` as Pro, `/api/campsites` with 2 real sites 34km apart, `/api/forecast` keyed by exact lat/lon so the base site is deliberately rainy and the candidate deliberately dry — giving a reliable "move"/"consider" recommendation regardless of which route-risk scenario is under test, since wind is equal between the two sites and only rain drives that comparison).

```
Running 7 tests using 1 worker
  ok 1 complete-calm — EN desktop: full coverage, LOW, no Route risk block at all (1.8s)
  ok 2 severe-partial-unknown — EN desktop: 5/7 points fail, UNKNOWN shown, never 'Low' (1.8s)
  ok 3 partial-high — EN desktop: 5/7 points fail but 2 known-HIGH readings still caution (lower bound) (1.8s)
  ok 4 severe-partial-unknown — IS desktop: same scenario, Icelandic copy, never 'Lág' (1.8s)
  ok 5 partial-high — IS desktop: Icelandic 'Há' caution with partial qualifier (1.8s)
  ok 6 severe-partial-unknown — EN mobile 320: unknown message stays within viewport, no overflow (1.7s)
  ok 7 severe-partial-unknown — EN desktop: opening the details modal shows the same neutral message (1.8s)
  7 passed (14.5s/14.7s across two runs)
```

Full log, screenshots (7 PNGs), and self-contained copies of the spec/config are saved under `outputs/ticket-460-browser-evidence/` (`results.txt`, `*.png`, `route-risk-ticket-460.spec.js`, `playwright.ticket460.config.js`). Mock/emulation limits, stated explicitly: no live Open-Meteo/provider/account/key used anywhere; `/api/*` is 100% mocked; the "severe-partial-unknown"/"partial-high" scenarios' 5-of-7 (not 7-of-7) failure ratio is the real-app-achievable floor explained above, not a rounding choice; IS/EN + mobile/desktop coverage is a representative subset (not the full 3 scenarios × 2 languages × 2 viewports cross-product) chosen to cover the headline UNKNOWN case most thoroughly (IS, mobile, and the details-modal all specifically exercise it) while still confirming HIGH/LOW and the IS "Há"/caution path once each. This is browser-emulated evidence against a real production bundle with mocked network, not a claim about live production behavior.

## Scope confirmation

No `.env`/`.vercel`/account/GitHub/provider operation. No `docs/ai/README.md` edit. No scoring/gating/entitlement/payment file touched. No `#461`/`#462` work. No subagents. No `git add`/`commit`/`push`/`checkout`/`reset`/`stash`/`clean`/`config` run. `git status`/`git diff --check` confirmed clean of anything outside this ticket's own files (plus the pre-existing untracked task directories and `docs/ai/CURRENT.md`'s own lifecycle edits).

**Status: implementation + tests + browser evidence complete. Owner review next (Jonesy result review, then Ripley final assessment) — not automatically CLOSED by this report.**

---

## v2 Correction — 2026-10-26 (Jonesy R1/R2)

Executed `docs/ai/tasks/ticket-460/approved-prompt-v2.md` (narrow correction only). **Visibly superseding this report's own earlier claims where Jonesy's R1 found them inaccurate — not silently rewritten.**

### Baseline (re-checked)

- `git rev-parse HEAD` before this round: `ba2327fd7fcb226b5d0aeadd99e2f930e875268c`. After: unchanged — still `ba2327fd7fcb226b5d0aeadd99e2f930e875268c` (no commit).
- `git status --short` before this round: identical in shape to the v1 round's own end-state (the same modified/untracked files this ticket already owns, plus `docs/ai/CURRENT.md`'s lifecycle line).

### R1 — `getRouteRiskSummary`'s MED branch was an implicit fallthrough, not an explicit check

**Superseding this report's own earlier claim.** The "Consumer matrix" table above and this report's original code comment both asserted "every branch of the closed {LOW, MED, HIGH, UNKNOWN} set is now explicit." That was wrong: the v1 code's final branch was a bare `// risk === "MED"` comment followed by an *unconditional* return — not a real `if (risk === "MED")` check. In practice this meant any non-null `routeRiskData` whose `routeRisk` was `undefined`, `null`, or an unrecognised string (e.g. a future typo, a malformed upstream value) silently rendered with the MED word and MED tooltip. Jonesy's R1 finding is correct and is not refuted.

Fixed in `src/components/routePlannerDetailsHelpers.js`: `risk === "MED"` is now a real, explicit check, ordered after the real `risk === "HIGH"` check; the final `return` (covering `"UNKNOWN"` **and** any unrecognised/missing/null value) is the one and only fallback, and it always returns the neutral unknown shape (`unknown: true`, no tooltip, the Unknown word) — never MED or LOW wording. `routeRiskData === null`/`undefined` (→ `null`, "absent") and `routeRisk === "LOW"` (→ `null`, existing suppression) are unchanged.

Added 4 new tests to `src/components/routePlannerDetailsHelpers.test.js` (file total now 23, was 19): `routeRisk` `undefined` on a non-null object, `routeRisk: null` explicitly, `routeRisk: "FOO"` (malformed/unrecognised string), and a non-mutation check (frozen input object, function must not throw or alter it). All verified to return the neutral-unknown shape, never the MED or LOW word. Re-ran `RoutePlannerDetailsModal.test.jsx`/`RoutePlannerCard.caution.test.jsx`/`RoutePlannerCard.test.jsx`/`RoutePlannerCard.canonicalTone.test.jsx` (83 tests) — all still pass unchanged; this helper's existing HIGH/MED/LOW/UNKNOWN behavior for recognised values is byte-for-byte the same as before, only the malformed-input fallback changed.

### R2 — meaningful browser evidence: explicit request-response accounting

**Superseding this report's own earlier "browser evidence" section**, which showed screenshots and UI-text assertions but never inspected the mocked network layer itself — so a hypothetical bug where the interior-point mock silently returned 200 instead of the intended 500 would not have been caught by the v1 spec; only the resulting (correct, in that run) UI text was checked.

`tests/e2e/route-risk-ticket-460.spec.js` now records every real `/api/forecast` request into a per-test `requestLog` (coordinate-matched kind — `base`/`candidate`/`interior` — plus the exact HTTP status this mock delivered), and `assertForecastRequestShape()` asserts directly against that log in all 7 scenarios (previously only 2 were explicitly required by the prompt; applied to all 7 for symmetry and because it's the SAME 2-site fixture in every one of them):

- Exactly 1 network request for the base coordinate, exactly 1 for the candidate coordinate — both succeed (200). Everything else referencing those same two coordinates (critically, the route estimator's own point[0]/point[6], which are numerically identical to base/candidate) is served from `forecastCache`'s in-page cache and never reaches the route handler again — this is the "cache-deduped endpoint requests" accounting. 7 total network requests, not 14, is the correct, asserted shape for this 2-site fixture.
- Exactly 5 network requests for the strictly-interior route-risk sample points, each asserted to carry the scenario's intended status (500 for `severe-partial-unknown`/`partial-high`, 200 for `complete-calm`).
- This is explicitly distinguished, in both the spec's header comment and this report, from the estimator's own **7** logical sample attempts (pinned at the unit level by `routeRisk.test.js`'s "per-point request count is deterministic" test) — only 5 of those 7 ever reach the network in this fixture; the other 2 are answered from cache.

**Verified the assertion can actually fail (red/green sensitivity check, done and reverted this round, not left in the file):** temporarily disabled the interior-failure branch in the mock (`if (interiorFails && false /* ... */)`) and re-ran the `severe-partial-unknown` test alone — it failed (the "insufficient data" text never appeared, since with all 7 points now succeeding with calm data the real result is LOW, not UNKNOWN), confirming the test is not vacuously green. Reverted immediately; confirmed via `grep` that no mutation marker remains in the file, and re-ran the full 7-scenario spec to confirm it is green again before finishing.

**Stale-candidate race — explicitly identified, not silently waived.** Per Ripley's instruction to name the exact test this waiver rests on: `src/hooks/useRoutePlanner.test.js`'s `"cancellation/new-candidate race: a stale resolve after a new candidate is selected must not win"` test (already present from the v1 round) directly asserts `result.current.routeRiskData.routeRisk === "LOW"` after resolving a stale `HIGH` promise *after* a new candidate's request is already in flight — i.e., the exact "old result cannot label a new pair" claim. No browser coverage is claimed for this scenario; the spec file's header comment now says so explicitly, by test name.

**7-of-7 network-rejection waiver — explicitly identified by test name**, per Ripley's narrow waiver (inside a still-successful recommendation, this is architecturally unreachable in the browser, see the "Known, accepted, unchanged limitations" section above): `routeRisk.test.js`'s `"RC-17 reproduced with 7 points..."` and `"real getForecast rejection path..."` tests, and `useRoutePlanner.test.js`'s `"thrown estimator (failed path)..."` test. **This waiver does NOT cover null/short-array inputs** — added 2 new focused estimator tests this round (file total now 24, was 22): a genuinely short array (length 1, index 1 does not exist at all — distinct from the already-covered zero-length-array case) and an array long enough but holding an explicit `null` *value* at index 1 (distinct from "missing" — also asserts `coverage.wind.returned === 7` vs `valid === 0`, proving "returned" and "valid" are tracked independently). Both confirm `"UNKNOWN"`, `null` maxima, no invented values.

**Provider-behavior disclaimer, restated per Jonesy's review-limits note:** every fixture in both the unit tests and the browser spec is a synthetic value chosen to exercise this app's own branches. What Open-Meteo's real API actually returns for a missing/invalid data point (null entries? omitted keys? a differently-shaped error body?) remains **UNKNOWN** — not claimed, not guessed, stated explicitly in both `routeRisk.test.js`'s file header reasoning (unchanged from v1) and the browser spec's header comment (new this round).

### Fresh final production build and rerun (R2's explicit requirement)

```
npm run build
  vite v7.3.6 building client environment for production...
  ✓ 3039 modules transformed, built in 5.19s
  dist/assets/index-CnjjhCHu.js, dist/assets/MapView-C5f4xywe.js (both hashes changed from the v1
  round's build, confirming this is a genuinely fresh build of the corrected code, not a stale cache hit)

npx playwright --version  →  Version 1.59.1
Chromium runtime version (via playwright-core chromium.launch().version())  →  147.0.7727.15
node -e "require('vite/package.json').version"  →  7.3.6

npx playwright test --config=playwright.ticket460.config.js   (serves the fresh dist/ above via `vite preview`)
  Running 7 tests using 1 worker
    ok 1 complete-calm — EN desktop (3.3s)
    ok 2 severe-partial-unknown — EN desktop (3.3s)
    ok 3 partial-high — EN desktop (3.3s)
    ok 4 severe-partial-unknown — IS desktop (3.3s)
    ok 5 partial-high — IS desktop (3.3s)
    ok 6 severe-partial-unknown — EN mobile 320 (3.2s)
    ok 7 severe-partial-unknown — EN desktop, details modal (3.2s)
  7 passed (25.1s)
```

A defensive PWA-update-toast dismiss step (`dismissPwaToastIfPresent`, clicking "Later"/"Síðar" if present, swallowed if absent) was added to `gotoAndExpandRoutePlanner` per R2's "dismiss optional PWA toast where feasible without app changes" — ~~no toast actually appeared in any of these runs~~ **Correction C1 (Ripley, 2026-10-26):** saved EN/IS screenshots do show the offline-ready toast with an X control. The Later/Síðar dismiss helper targets the update toast, not this offline-ready notification; it therefore did not dismiss the pictured toast. Some screenshot content is overlapped, while the asserted risk/unknown lines remain evidenced. No claim is made that this helper was validated against the offline-ready toast; re-capture is optional and not performed.

All 7 screenshots, the full `results.txt` log, and refreshed self-contained copies of the spec/config were re-saved to `outputs/ticket-460-browser-evidence/` from this exact rerun (not reused from the v1 round).

### Full suites rerun (fresh counts, not the v1 round's numbers)

```
npx vitest run <9 targeted files>
  Test Files  9 passed (9)
  Tests  155 passed (155)   (was 149 in the v1 round; +4 getRouteRiskSummary + +2 estimator)

npm run test:run   (full suite)
  Test Files  187 passed (187)
  Tests  2813 passed (2813)   (was 2807; +6 new tests this round)

npm run lint
  (clean, no output)

npm run build
  ✓ 3039 modules transformed, built in 5.19s (see fresh hashes above)
```

### Scope confirmation (this round)

Touched only: `src/components/routePlannerDetailsHelpers.js` (R1 fix), `src/components/routePlannerDetailsHelpers.test.js` (+4 tests), `src/lib/routeRisk.test.js` (+2 tests), `tests/e2e/route-risk-ticket-460.spec.js` (R2 request-accounting rewrite), `outputs/ticket-460-browser-evidence/` (refreshed artifacts), this report, and `docs/ai/CURRENT.md`'s lifecycle fields. No other application file. No `playwright.ticket460.config.js` change. No new package/service. No provider/threshold/scoring/gating/payment/instruction-file change. No live provider/account/secret access. No `git add`/`commit`/`push`/`checkout`/`reset`/`stash`/`clean`/`config` run; `git diff --check` clean; `git status --short` scoped to this ticket's own files plus the pre-existing untracked task directories.

**Status: v2 correction applied. R1 (helper fallback) and R2 (browser network accounting, exact waiver citations, fresh rerun) both complete. Owner next: Jonesy narrow re-review, then Ripley final whole-ticket assessment — not automatically CLOSED by this report.**
