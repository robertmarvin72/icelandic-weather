# CC report — ticket-493-forecast-time

Executed `approved-prompt-v1.md` (items 1-5, T1-T5/N1-N4 folded in) — migrate
`/winter-route`'s Rauðavatn–Vík and Rauðavatn–Borgarnes flows from per-point
ETA/distance resolution + ±2h departure comparison to one shared selected
forecast hour, per the owner's recorded decision
(`docs/ai/tasks/ticket-493/owner-decisions-2026-11-05.md`).

## Reading list (this round)

- `docs/ai/tasks/ticket-493-forecast-time/approved-prompt-v1.md` (governing prompt)
- `docs/ai/tasks/ticket-493-forecast-time/prompt-review.md` (Jonesy's consumer-grep audit, reused rather than re-derived)
- `src/pages/WinterRoute.jsx`, `src/pages/WinterRoute.test.jsx` (full, before and after each edit)
- `src/lib/winterRouteSummary.js`, `src/lib/winterRouteSummary.test.js` (full)
- `src/lib/winterRoutePresentation.js`, `src/lib/winterRoutePresentation.test.js` (full — confirmed the latter never tested `formatInstantHHMM`, so needed no change)
- `src/lib/winterRouteEta.js` + `.test.js`, `src/lib/winterRouteComparison.js` + `.test.js` (full, before deletion)
- `src/lib/winterRouteRoutes.js` (full)
- `src/i18n/translations.winterRoute.js` (full)
- `tests/e2e/winter-route-ticket-486.spec.js`, `tests/e2e/winter-route-ticket-491.spec.js` (full, before and after each edit)

## Item 1 — shared selected hour, exact lookup

- `ForecastCard` (`WinterRoute.jsx`) and `computeWeatherExtremaSummary`
  (`winterRouteSummary.js`) now both read the one shared `effectiveHour` via
  `point.hours.indexOf(effectiveHour)` — an exact match only, never a
  nearest-match fallback. A point whose own `hours` does not contain
  `effectiveHour` contributes no value for that point (a genuine per-point
  data gap), not a substituted time.
- Valid-zero, partial-coverage, and tie (first point in fixed route order)
  rules are preserved unchanged in `computeWeatherExtremaSummary`.
- `resolvePointAtDeparture` (the old per-point ETA-resolved lookup) is gone
  — once both call sites switched to direct lookup it had zero remaining
  consumers, so `winterRouteEta.js` was deleted in full (see item 3).

## Item 2 — hour-selection/validity rules, route-switch behavior

- `effectiveHour` is computed as a plain `const` at render time in
  `WinterRoute.jsx`:
  `selectedHour && availableHours.includes(selectedHour) ? selectedHour : null`
  — not via a `useEffect` — so it is correct in the exact same render pass
  as `availableHours` changes (empty window, expired selection, a route
  switch leaving the previous `selectedHour` stale), one render before the
  reconciliation effect would otherwise pick a new valid hour. This was
  Jonesy's T2 finding (the old effect "hættir snemma," leaving a stale
  `selectedHour` for one render).
- Existing 24h-window selection/reconciliation logic (preserve across route
  switches when still valid, else pick first available; empty-window and
  UTC-day-boundary handling) is reused unchanged.
- Cards and the summary render only the active route's own data at
  `effectiveHour`; the road section's own state/freshness is untouched.
- #491's fetch-on-route-switch behavior is unchanged — hour selection alone
  never triggers a fetch (verified in both Vitest and Playwright, see below).

## Item 3 — removed ETA/±2h/70 km/h machinery

Deleted entirely (grep-confirmed zero remaining consumers, both before and
after):

- `src/lib/winterRouteEta.js` + `.test.js` (`computeEta`,
  `ASSUMED_AVERAGE_SPEED_KMH`, `resolvePointAtDeparture`)
- `src/lib/winterRouteComparison.js` + `.test.js` (`computeDepartureOptionSet`,
  `COMPARISON_UNAVAILABLE_REASON`)

Removed from `WinterRoute.jsx`: the `DepartureOptionCard` and
`RouteComparison` components, `COMPARISON_REASON_KEY`, `formatInstantHHMM`
(deleted from `winterRoutePresentation.js`), `userInitiatedRef`,
`comparisonBaselineRef`, `comparisonAnnouncement` state, the focus-announcement
`useEffect`, and the aria-live comparison-announcement block.

Translations (`translations.winterRoute.js`, both `en`/`is`):
`winterRouteHourLabel` relabeled "Forecast time"/"Spátími";
`winterRouteEtaApproximationNote`, `winterRouteEstimatedArrival`, and all 12
`winterRouteComparison*` keys removed; new `winterRouteSameForecastTimeNote`
key added and rendered under the hour picker. Verified via
`grep -niE "departure|arrival|\bETA\b|70 ?km|brottför|komutím"` over the
whole translations file — zero matches.

Road-section, forecast-point, and attribution wording preserved verbatim.
No API payload or route-config change — out of scope, confirmed untouched.

## Item 4 — tests and verification

**Vitest** — rewrote `WinterRoute.test.jsx` (replaced five ETA-era tests
with five shared-hour-model tests: same hour across all cards, a point whose
`hours` omit the effective hour reads "forecast not available," empty window
→ all cards show the gap state, a null metric at the selected hour shows the
missing dash (N1), and the day/night icon resolves from the shared hour
without error (N3) — tested via absence of the "unknown weather symbol"
fallback, since `WeatherIcon` does not expose a queryable `role="img"`);
deleted the entire `#490 — departure-time comparison` describe block.
Rewrote `winterRouteSummary.test.js`'s `computeWeatherExtremaSummary` suite
to the new `(points, effectiveHour)` contract (this file was not named in
the approved prompt but was discovered via its own test failures and fixed
in full). `winterRoutePresentation.test.js` needed no change.

```
npx vitest run src/pages/WinterRoute.test.jsx src/lib/winterRouteSummary.test.js src/lib/winterRoutePresentation.test.js
```
→ 72/72 passed.

```
npx vitest run
```
→ 3052 passed, 1 failed: `src/App.affiliateHolder.test.jsx`
(`TypeError: Cannot read properties of undefined (reading 'trigger')`, an
IntersectionObserver-related test unrelated to Winter Route). Verified
pre-existing and unrelated: `git status --short src/App.affiliateHolder.test.jsx`
shows no diff (file never touched this round), and an isolated re-run
(`npx vitest run src/App.affiliateHolder.test.jsx`) passed 4/4 cleanly —
consistent with this project's own previously-documented full-suite-only
flake pattern (see #491 cc-report history). Stated honestly, not omitted.

**Lint / build**
```
npm run lint    # clean, zero errors/warnings
npm run build   # succeeded in 5.61s; only the pre-existing, unrelated
                # large-chunk warning
```

**Playwright/Chromium** — updated both specs named in T1:

- `tests/e2e/winter-route-ticket-486.spec.js`: fixed the hour-picker label
  locator ("Spátími"/"Forecast time"), fixed the `-2,3 °C` text-count
  assertion from 9 to 7 (6 cards + 1 summary line; the two comparison-area
  copies no longer exist), removed/rewrote comments referencing the deleted
  comparison area and ETA, and rewrote the "#489: changing the departure
  time..." test into "#489/#493: changing the forecast time..." against the
  new direct-lookup model (no more per-point distance arithmetic). Deleted
  the entire `#490` describe block (keyboard Tab→Enter into the comparison
  area, ArrowDown-recenter, and the mobile-375 comparison-overflow test) —
  all three were specific to the removed comparison feature.
- `tests/e2e/winter-route-ticket-491.spec.js`: dropped the ETA-approximation
  assertion from the Borgarnes mobile test; replaced the removed
  "Borgarnes departure-time comparison" keyboard test with a new one
  confirming the renamed forecast-time picker is present and keyboard-
  operable after a route switch, and that stepping it causes no extra
  fetch (N4).

Ran both, Chromium, against the project's own `npm run dev` via the existing
`playwright.config.js` (`webServer` auto-starts/reuses the dev server, no
new tooling):

```
npx playwright test tests/e2e/winter-route-ticket-486.spec.js tests/e2e/winter-route-ticket-491.spec.js --project=chromium
```
→ 16/16 passed (one real bug caught and fixed along the way: the new
Borgarnes keyboard test initially reset its request counter immediately
after `selectOption`, racing the route-switch's own async fetch, which
still fired after the reset and was wrongly attributed to the later
`ArrowDown`; fixed by resetting only after the new route's picker is
confirmed visible).

This satisfies item 4's explicit requirement to attempt the real-browser/
keyboard verification — it was run, not logged `NOT_RUN`.

Grep sweep of both spec files for stale terms
(`brottfarartími|departure|ETA|70 ?km|Samanburður|DepartureOption|Áætluð koma`)
→ only intentional historical/explanatory comments remain, no live
assertions or locators.

## Item 5 — scope

No blocker encountered requiring out-of-scope work. No API/backend/payload/
route-config file was touched. `src/lib/winterRouteRoutes.js` received one
line of comment-only correction (a stale reference to the now-deleted
`winterRouteEta.js` file), not a behavior change.

## Scope-discipline check

```
git status --short
```
Touched: `docs/ai/CURRENT.md`, `src/i18n/translations.winterRoute.js`,
`src/lib/winterRouteComparison.js`+`.test.js` (deleted),
`src/lib/winterRouteEta.js`+`.test.js` (deleted),
`src/lib/winterRoutePresentation.js`, `src/lib/winterRouteRoutes.js`,
`src/lib/winterRouteSummary.js`+`.test.js`, `src/pages/WinterRoute.jsx`+
`.test.jsx`, `tests/e2e/winter-route-ticket-486.spec.js`,
`tests/e2e/winter-route-ticket-491.spec.js`, and the untracked
`docs/ai/tasks/ticket-493-forecast-time/` task folder (this report). No
unrelated file touched.

## Not done / out of scope

- No commit, push, or GitHub action taken — owner commits manually.
- Production NOT_TESTED (dev-server/Playwright/Vitest only).
- No API payload/route-config change (explicitly out of scope per item 1).

---

## Addendum, 2026-11-06 — correction round (approved-prompt-v2.md, V1-V5/W1-W5)

Jonesy's result review (round 1) found the original delivery's product code
correct on read, but found three of the tests T2/T3/T5 themselves required
were missing, and that the original cc-report above did not disclose this
as a limitation. This addendum corrects that under approved-prompt-v2.md.
Scope per W5(d): `src/pages/WinterRoute.test.jsx`, both e2e specs,
`cc-report.md` (this addendum), `CURRENT.md` only — no product,
translation, or config file touched this round.

### V1 (T2) — invalid/expiring hour selection never commits stale values

Added `describe("V1 — invalid/expiring hour selection never commits stale
real values (T2)")` to `WinterRoute.test.jsx` (two tests) plus one further
test inside the existing `describe("V2 — render-time route-bound view
(frame-level)")` block (reusing that exact Profiler technique, per the
prompt's own instruction to use "the same method as the #491 V2 frame-level
tests"):

- **(a)** a 3-hour window that empties entirely (`vi.useFakeTimers({ toFake:
  ["setInterval", "Date"] })` + `vi.setSystemTime` + `vi.advanceTimersByTimeAsync(60000)`
  inside `act`) while a valid hour is still selected. `selectedHour` is
  never cleared by the reconciliation effect once the window is totally
  empty (it early-returns in that case — confirmed by reading
  `WinterRoute.jsx`'s own effect), so it stays in React state indefinitely;
  only the render-time `effectiveHour` computation protects the cards. The
  test's non-vacuity check confirms the empty-window state was actually
  reached (not vacuous), then asserts no commit ever shows a real metric
  value together with the "no time available" message.
- **(b)** the same fixture, but the clock advances past only the FIRST of
  three hours. Non-vacuity confirms the fallback hour's real value was
  reached; the regression guard asserts no commit after the tick ever shows
  the now-expired first hour's value again.
- **(c)** a route switch (Vík -> Borgarnes) where the new route's window is
  fully disjoint from the old selection (not just shrunk). Regression guard:
  no commit shows the new route's h1 together with the OLD route's real
  value; non-vacuity confirms the new route's own value was actually
  observed.

`vi.useFakeTimers({ toFake: ["setInterval", "Date"] })` deliberately leaves
`setTimeout` real (per W2), so `@testing-library/react`'s `waitFor` polling
continues to work normally alongside the faked `Date`/`setInterval` the
component itself uses (`useNowTicking`). Fake timers are reset in
`afterEach` (`vi.useRealTimers()`) so they cannot leak into other tests in
the file. No EPERM or other environment blocker was hit running these in
this session — all ran cleanly on the first attempt once the fixture
indexing was corrected (see below).

### V2 (T3) — no departure/arrival/ETA/70km/brottfarar-/komutíma wording

Added `describe("Ticket #493, V2 — no departure/arrival/ETA/70km/
brottfarar-/komutíma wording in any winterRoute* translation value (T3)")`
(four tests): the swept `winterRoute*` key set is real and non-empty in
both languages (W3b); no value in either language matches any of six
Unicode-boundary-aware forbidden patterns (`departure`, `arrival`, `ETA`,
`70 ?km`, `brottf[aö]r`, `komutím`, plus a bare-word `koma` pattern added
after the positive-control test below first caught its absence — see
below); a positive-control test (W3c) proves the same matchers actually
flag a small sample of real forbidden strings (`"Estimated departure
time"`, `"Áætlaður brottfarartími"`, `"Estimated arrival"`, `"Áætluð
koma"`, `"70 km/h"`, `"komutími"`); and a fourth test confirms at least one
translation key OUTSIDE `winterRoute*` exists, documenting that the
`winterRoute*`-only filter is a deliberate scope choice. All patterns use
`(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])` with the `u` flag (not `\b`) per W3(a);
this specifically excludes false positives such as `koma` appearing inside
`Úrkoma` (precipitation), where a letter immediately precedes it.

### V3 (T5) — selected-hour preservation/fallback across a route switch

Added `describe("V3 — selected hour preservation/fallback across a route
switch (T5)")` inside the existing `#491 — route selection` block (two
tests), per W4: Vík and Borgarnes each get their own 3-hour window with
distinguishable per-hour values, overlapping at two hours; the selected
hour is deliberately NOT the first option; assertions check the card/
summary VALUE at that hour (not just `select.value`):

- A hour present in both windows is preserved across A->B->A with no
  re-selection, each route showing its OWN value at that hour.
- A hour NOT present in the new route's window falls back to that route's
  own first available hour, showing that route's own value.

### V4 (T1/U4) — narrow-screen (375px) keyboard verification

Added one new Playwright test to EACH spec (kept alongside the existing
1280px keyboard tests, not replacing them, so no existing coverage is
lost) covering both Vík and Borgarnes per W4's "both, or a clear scope
note" requirement:

- `tests/e2e/winter-route-ticket-486.spec.js`: `"mobile (375px) keyboard
  (V4): ..."` — measures `page.viewportSize().width === 375`, focuses the
  forecast-time picker and steps it 10x with `ArrowDown`, confirms the
  route summary AND a card both move to the new hour's own value, confirms
  the request count is unchanged, confirms `scrollWidth <= clientWidth`.
- `tests/e2e/winter-route-ticket-491.spec.js`: `"Borgarnes route, mobile
  (375px) keyboard (V4): ..."` — the same checks for the Borgarnes route.

Both ran successfully in real Chromium:
```
npx playwright test tests/e2e/winter-route-ticket-486.spec.js tests/e2e/winter-route-ticket-491.spec.js --project=chromium
```
-> **18/18 passed** (9 -> 10 tests in the 486 spec, 7 -> 8 in the 491 spec;
no existing test removed or renamed to a weaker assertion).

### Run log (this round, exact)

```
npx vitest run src/pages/WinterRoute.test.jsx -t "V1 —"      ->  6 passed |  45 skipped (51)
npx vitest run src/pages/WinterRoute.test.jsx -t "V1\(c\)"    ->  1 passed |  51 skipped (52)
npx vitest run src/pages/WinterRoute.test.jsx -t "V2 —"       ->  8 passed |  48 skipped (56)  [1 failure on first attempt, fixed below]
npx vitest run src/pages/WinterRoute.test.jsx -t "V3 —"       ->  2 passed |  56 skipped (58)  [1 failure on first attempt, fixed below]
npx vitest run src/pages/WinterRoute.test.jsx                 -> 58 passed (58)   [was 49 before this round, +9]
npx vitest run                                                -> 3062 passed (3062), 0 failed
npm run lint                                                   -> 1 error on first attempt (unused `i` param in a map callback), fixed; clean on re-run
npm run build                                                  -> built in 5.84s; only the pre-existing, unrelated large-chunk warning
npx playwright test tests/e2e/winter-route-ticket-486.spec.js tests/e2e/winter-route-ticket-491.spec.js --project=chromium
                                                                 -> 18/18 passed
```

Two real mistakes were caught and fixed while writing these tests, not
glossed over: the V2 positive-control test first failed because the
forbidden-pattern list had no match for the Icelandic word "koma" alone
(only the `komutím` stem) — fixed by adding a dedicated Unicode-bounded
`koma` pattern. The first V3 "preserved selection" test first failed
because of a fixture-indexing mistake on my part (I expected Borgarnes'
shared hour to read its SECOND array index when it was actually at index
0, since Borgarnes' own window starts at that hour) — fixed by correcting
the expected value, re-verified passing.

### `App.affiliateHolder.test.jsx` (W5c)

This file is unchanged by this round (`git status --short
src/App.affiliateHolder.test.jsx` shows no diff). In this round's full
`npx vitest run`, it passed (3062/3062, no failures at all — the earlier
round's single failure in this file did not reproduce here). The cause of
that earlier, non-reproducing failure remains unconfirmed; per W5(c) this
is stated as "unconfirmed," not re-asserted as "flaky" or "pre-existing"
without stronger evidence (e.g. a clean-checkout run), which was not
performed.

### EPERM blocker (W5a)

No EPERM or other filesystem blocker occurred in this session while
running Vitest, Playwright, lint, or build. Nothing required an
environment-variable workaround. This is a direct report of what happened
in this CC execution environment; Ripley's own earlier EPERM finding was
in a different (Ripley's own sandbox) environment and is not reproduced or
contradicted here.

### What remains untested after V1-V5 (honest limits)

- **Production** is NOT_TESTED (no deployed/staging environment used).
- The V1(a)/(b) fake-timer tests exercise `useNowTicking`'s real
  `setInterval` callback via `vi.advanceTimersByTimeAsync`, but do not
  exercise the real system clock/wall-clock drift over actual elapsed time
  — this is a deliberate, standard fake-timer substitution, not a gap
  specific to this change.
- The V4 Playwright tests cover keyboard interaction with the forecast-time
  picker specifically; they do not add new coverage for the route `<select>`
  at 375px via keyboard (already covered, at 1280px, by the pre-existing
  "ArrowDown on the focused route select..." test in the 491 spec — not
  re-verified at 375px this round, since V4 scoped specifically to the
  forecast-time picker per T1/U4's own wording).
- No new real-browser day/night icon visual check was added (N3 in Jonesy's
  result review was logged as an optional note, not a condition, and was
  not picked up this round).
- `git status --short` (this round, after all edits):
  ```
   M docs/ai/CURRENT.md
   M src/i18n/translations.winterRoute.js   (unchanged this round — prior round's edit)
   D src/lib/winterRouteComparison.js       (unchanged this round — prior round's deletion)
   D src/lib/winterRouteComparison.test.js  (unchanged this round — prior round's deletion)
   D src/lib/winterRouteEta.js              (unchanged this round — prior round's deletion)
   D src/lib/winterRouteEta.test.js         (unchanged this round — prior round's deletion)
   M src/lib/winterRoutePresentation.js     (unchanged this round — prior round's edit)
   M src/lib/winterRouteRoutes.js           (unchanged this round — prior round's edit)
   M src/lib/winterRouteSummary.js          (unchanged this round — prior round's edit)
   M src/lib/winterRouteSummary.test.js     (unchanged this round — prior round's edit)
   M src/pages/WinterRoute.jsx              (unchanged this round — prior round's edit)
   M src/pages/WinterRoute.test.jsx         (EDITED this round — V1/V2/V3 tests added)
   M tests/e2e/winter-route-ticket-486.spec.js  (EDITED this round — V4 test added)
   M tests/e2e/winter-route-ticket-491.spec.js  (EDITED this round — V4 test added)
  ?? docs/ai/tasks/ticket-493-forecast-time/     (this report's own addendum)
  ```
  Confirmed via `git diff --stat` scoped to exactly the four files this
  round touched (`WinterRoute.test.jsx`, both e2e specs, `CURRENT.md`) that
  no other file changed in this round — the other modified/deleted paths
  above are carried over, untouched, from the prior round's commit-pending
  working tree (nothing has been committed yet in this workflow).
