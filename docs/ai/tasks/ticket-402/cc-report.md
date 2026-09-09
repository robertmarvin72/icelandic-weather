# CC Report — Ticket 402 (Daily summary should reflect the usable part of the day)

Executed against: `docs/ai/tasks/ticket-402/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS).

## 1. Mandatory preflight audit — pre-edit data flow

Read before editing: `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, this approved prompt, GitHub issue #402 (`gh issue view 402`), `src/lib/dailyWeatherSummary.js` + its full test file, `src/lib/weatherPresentation.js`, `src/hooks/useForecast.js`, `src/lib/forecastNormalize.js`, `src/components/ForecastTable.jsx` + its test files, `src/components/HourlyForecastModal.jsx` + its test file, `src/utils/precipitation.js`, EN/IS translation keys in `translations.common.js`, and Ticket 400's approved prompts/cc-report/result-reviews (confirmed the canonical mapping, null-safety, hourly-derived presentation boundary, and scoring-invariance contract as already established and untouched by this ticket).

### Where raw `weathercode` enters, and why the issue fixture became bare "Heavy drizzle"

`src/lib/forecastNormalize.js`'s `normalizeDailyToScoreInput` copies Open-Meteo's raw `daily.weathercode[i]` into `row.code` — this is the untouched scoring input and stays that way; not read by anything in this ticket. Separately, `src/hooks/useForecast.js` computed a **presentation-only** `summaryCode` via `dailyWeatherSummary.js`'s `summarizeDailyWeatherCode({ hourly, date, fallbackCode: row.code })`, called strictly after `scoreSiteDay(row)` had already consumed the pristine row (Ticket 400's boundary, unchanged).

`dailyWeatherSummary.js`'s existing algorithm: filter valid same-date hourly observations to the primary usable window (`06:00 <= hour < 22:00`, falling back to the whole day only if that window is empty); then `evaluateOverrideFamily(windowObs)` walks a fixed precedence (thunder/hail → freezing precipitation → snow → rain/showers → drizzle) and returns the **first family that qualifies at all** — for drizzle/rain, a single **heavy-tier** code (55/65/82) qualifies **unconditionally on its own**, regardless of how many other observations exist or how they're distributed. For the issue's exact fixture (heavy drizzle at 06:00, the only in-window wet observation, then dry 09:00–21:00 — 13 dry hours), this single 06:00 observation deterministically won the override check before dominance/vote-counting was ever consulted, so the representative code became 55 ("Heavy drizzle") regardless of the following 13 dry hours. This is precisely the "a single heavy precipitation observation always overrides the whole day's headline" behavior the approved prompt names as needing revision — confirmed by direct trace, not assumed.

### How `ForecastTable` chose its icon/headline/caption, and how the hourly modal derives its best window

`ForecastTable.jsx` reads `displayCode = r.summaryCode ?? r.code ?? null`, resolves it through `weatherPresentation.js`'s canonical `{textKey, iconId}` table (unchanged in this ticket), and separately layers a precipitation-duration caption via `getPrecipitationLabel` when the resolved family is rain/drizzle/snow. `HourlyForecastModal.jsx` is completely independent: it reads the **raw** `hourly.weathercode` per displayed (every-3rd-hour) row through the same canonical `weatherPresentation.js` table, and computes its own "best weather window" via a contiguous-good-hours scan over `getWindowState()` (wind/gust/rain/precip-probability thresholds) — entirely unrelated to `dailyWeatherSummary.js`. Neither of these was touched.

No STOP condition was triggered: no scoring/penalty/hazard/ranking/recommendation logic needed to change; no provider/API/timezone change was needed; no daily numeric metric needed to change; the fix stayed entirely within the existing presentation-only boundary; the new headline and its representative code are kept coherent by construction (§3 below); the HourlyForecastModal's own best-window algorithm was not touched, extracted, or redesigned.

## 2. Design — the new temporal layer (documented thresholds)

`dailyWeatherSummary.js` gained a **new layer on top of**, not a replacement of, the existing override/dominance pipeline (unchanged: `evaluateOverrideFamily`, `pickDominantFamily`, `representativeCodeForFamily`, `FAMILY_PRIORITY_ORDER`, `OVERRIDE_PRECEDENCE`, `HEAVY_TIER_CODES`, the primary-window computation). New pure helpers, in the same file:

- **`buildChronologicalRuns(obs)`** — sorts observations by hour (so a reordered input array can never change the result), classifies each into `"wet"` (drizzle/freezing-precip/rain/snow/thunder-hail family) or `"dry"` (clear/partly-cloudy/overcast/fog family), and groups consecutive same-classification observations into runs. Each run's `span` is computed as `endHour - startHour + 1` (elapsed **covered** hours), never a raw element count — so sparse or unevenly-gapped hourly data cannot fabricate a longer run than was actually observed, and reordering the input cannot change a run's span either.
- **`MIN_SUBSTANTIAL_DRY_SPAN_HOURS = 6`** — the approved prompt's own recommended minimum for "a substantial continuous dry span."
- **`MAX_BRIEF_EPISODE_SPAN_HOURS = 3`** — the maximum span for a wet run to count as "brief."
- **`isMeaningfulWetRun(run)`** — a wet run only counts as evidence for a directional story when `evaluateOverrideFamily(run.obs)` (the exact same, unchanged, already-tested significance rule) is non-null for that run's own observations alone. This is the single most important design choice: it means the new temporal layer requires **exactly the same evidence bar** the old override rule already required (heavy-tier single observation, or 2+ light/moderate observations with qualifying evidence) — so a truly trivial, non-qualifying blip (e.g. one light-rain hour) still cannot dominate or trigger a narrative, exactly as before.
- **`HAZARD_FAMILIES` bypass** — if **any** thunder/hail, freezing-precipitation, or snow observation exists anywhere in the window, the entire temporal layer is disabled for that day and control falls through unconditionally to the unchanged override/dominance pipeline. These families are safety-significant (approved prompt §2) and must never be softened into an "early/later/brief" framing — they keep their existing, unconditional, full-strength treatment.
- **`detectTemporalPattern(windowObs)`** recognizes exactly three chronological shapes, each requiring a meaningful wet run (per `isMeaningfulWetRun`) **and** the specified minimum dry evidence:
  1. **2 runs, wet then dry** (dry run's span ≥ 6h) → `dailySummaryRainEarlyDryLater`.
  2. **2 runs, dry (span ≥ 6h) then wet** → `dailySummaryDryEarlyRainLater` (no minimum imposed on the trailing wet run itself — the approved prompt only requires a substantial *dry* span, not a substantial trailing wet one).
  3. **3 runs, dry-wet-dry**, middle (wet) run's span ≤ 3h **and** the two dry runs' combined span ≥ 6h → `dailySummaryBriefShowers`.
  4. Any other shape (1 run, 4+ runs/genuinely intermittent, or evidence below threshold) → no narrative; the unchanged pipeline decides `code` exactly as before.
- **`representativeCodeForRun(run)`** derives the representative WMO code from **only the matched wet run's own observations**, reusing the exact same override/dominance/intensity-selection functions — so the icon and headline always describe the same underlying evidence, and the icon is never a generic/clear icon paired with copy that mentions precipitation (approved prompt §2's coherence requirement).

`summarizeDailyWeather({ hourly, date, fallbackCode })` is the new primary export, returning `{ code, textKey }`: `textKey` is one of the three keys above or `null`. `summarizeDailyWeatherCode(args)` is kept as a **backward-compatible thin wrapper** (`return summarizeDailyWeather(args).code`) — every existing consumer/test that only needs the code is unaffected without any change on their part.

## 3. Why every existing #400/#401 test kept its original expected result (full manual trace, not merely run-and-hope)

Before writing any new test, I traced all ~30 fixtures in the pre-existing `dailyWeatherSummary.test.js` against the new logic by hand:

- Fixtures with no wet-family code at all (clear/overcast/fog/partly-cloudy mixes): never reach a 2- or 3-run wet-adjacent shape — unaffected.
- "One isolated light-rain observation does not override": forms a dry-wet-dry 3-run shape by coincidence, but the wet run is a single non-heavy-tier, single-observation code — `isMeaningfulWetRun` returns false, so the pattern is rejected and the fixture falls through to the unchanged pipeline exactly as before.
- The two-observation-with-amount-threshold tests (rain 61 at two non-adjacent hours, interleaved with dry hours): produce 5 alternating runs (genuinely intermittent), never matching any of the three shapes — unaffected, unchanged result.
- The four single-observation "heavy rain/freezing rain/snow/thunderstorm overrides" tests: three of the four (freezing rain, snow, thunderstorm) contain a hazard-family code and are bypassed by the hazard check outright, deferring wholesale to the unchanged pipeline. The heavy-rain one (a non-hazard family) happens to form a 2-run dry-then-wet shape via the fixture's own construction (`Array.from({length:8})` generating hours 7–14, then a second observation *also* at hour 14) — but its wet run, evaluated alone, has the same single heavy-tier observation the old override rule already found significant, so `representativeCodeForRun` returns the identical code (65) the old pipeline already produced. The **numeric result is identical either way**; only the (invisible-to-that-old-test) `textKey` differs.
- The four "deterministic precedence" tests and the "representative-code intensity selection" tests: none contain a dry-family observation at all (pure wet mixes), so they can never match a wet-adjacent 2-/3-run shape — unaffected.
- The "order independence and purity" / "safe fallback behavior" blocks: either contain no wet-family code, no valid observations at all, or a dry-run span too short to qualify — unaffected.

This trace was then **verified empirically**: `npx vitest run src/lib/dailyWeatherSummary.test.js` → **33/33 passed, unmodified**, confirming the manual trace was correct. **No existing test needed to be revised, weakened, or deleted** — the approved prompt's own escape hatch ("do not silently delete or weaken unrelated #400 coverage... revise it explicitly as superseded") was not needed because the refined `isMeaningfulWetRun`/hazard-bypass design turned out to make the new layer a strict, backward-compatible superset rather than a replacement. This is recorded honestly rather than force-editing a test that didn't need it.

## 4. Files changed

**New:**
- `src/lib/dailyWeatherSummary.temporal.test.js` — 26 tests for the new `summarizeDailyWeather()` contract (the required 15 test categories, minus the ForecastTable/scoring-invariance/HourlyForecastModal ones covered in their own files below).
- `src/components/ForecastTable.temporalSummary.test.jsx` — 8 tests for the new rendering behavior.

**Modified:**
- `src/lib/dailyWeatherSummary.js` — added the temporal layer (§2) alongside the unchanged Ticket 400/401 pipeline; `summarizeDailyWeather` is the new primary export, `summarizeDailyWeatherCode` becomes a thin wrapper.
- `src/hooks/useForecast.js` — destructures `{code, textKey}` from `summarizeDailyWeather(...)` (still called after `scoreSiteDay(row)`, unchanged boundary) and merges both `summaryCode` and the new `summaryTextKey` into the returned row, alongside every existing field.
- `src/components/ForecastTable.jsx` — `weatherKey` now prefers `r.summaryTextKey` when present; the precipitation-caption block returns immediately when `r.summaryTextKey` is present, before ever calling `getPrecipitationLabel`, so a generic amount caption can never overwrite the richer narrative.
- `src/i18n/translations.common.js` — added `dailySummaryRainEarlyDryLater`, `dailySummaryDryEarlyRainLater`, `dailySummaryBriefShowers` (EN + idiomatic IS).
- `src/hooks/useForecast.scoringInvariance.test.js` — added one new test proving `summaryTextKey` is populated for the real #402 motivating pattern (through the actual `useForecast` hook) with every scoring/ranking-facing field byte-identical to an all-day-drizzle variant of the same daily raw code.
- `src/components/HourlyForecastModal.test.jsx` — added one new test proving the modal renders each real per-hour code independently for the #402 motivating pattern and never shows the daily card's temporal-narrative text.

**Confirmed untouched**: `src/components/HourlyForecastModal.jsx` itself (only its test file gained a new test — the component's own best-window algorithm/copy/rows are byte-for-byte unchanged), `src/lib/scoring.js`, `src/lib/forecastNormalize.js`, `src/utils/precipitation.js`, `src/lib/weatherPresentation.js`, every relocation/comparison/leaderboard file, `api/forecast.js` and every other backend route, entitlement/checkout/analytics code. No dependency added. No `.tsx`/TypeScript. Not committed. Not pushed.

## 5. Required tests — status (approved prompt's 15 categories)

All 15 covered:

1. Exact #402 fixture (light rain/drizzle/heavy drizzle 00:00–06:00, dry 09:00–21:00) → `dailySummaryRainEarlyDryLater`, never plain "Heavy drizzle" — `dailyWeatherSummary.temporal.test.js`, plus a **red→green proof** (§6).
2. Inverse dry-early/rain-later pattern — same file.
3. Precipitation through most/all of the usable day stays precipitation-led (`textKey: null`) — same file.
4. One short intense episode surrounded by long dry spans (two variants: 2-hour heavy rain, single-hour heavy drizzle) → `dailySummaryBriefShowers`, code still reflects the precipitation family — same file.
5. Persistent dry/clear and persistent overcast/cloudy → `textKey: null`, existing dominant presentation — same file.
6. Intermittent wet/dry/wet with no honest directional narrative, **and** a genuinely trivial isolated blip (mirroring the pre-existing Ticket 400 fixture shape) — same file.
7. Snow/freezing-precipitation/thunder-hail patterns, brief and sustained, always bypass the temporal layer — same file (4 tests).
8. Boundary hours around 06:00 and 22:00 (wet exactly at 06:00; wet at 21:00 with the trailing edge; an observation at 22:00 itself excluded) — same file (3 tests).
9. Reordered hourly arrays produce the identical result after chronological normalization — same file.
10. Sparse (every-3-hours) data, missing precipitation array, malformed timestamps mixed with unsupported codes, and a literal null code mixed into the pattern — same file (4 tests), plus a non-mutation test.
11. No same-date usable hourly observations preserves the existing safe fallback (including the "never coerces to 0" case) — same file (3 tests).
12. `ForecastTable` renders the semantic key with a coherent icon, and `getPrecipitationLabel` never overwrites it — `ForecastTable.temporalSummary.test.jsx`, with a **red→green proof** (§6).
13. Exact EN and IS rendering with no untranslated-key leakage, for all three narrative keys — same file, using the real merged translation dictionary (not an identity `t`).
14. Scoring invariance: only `summaryCode`/`summaryTextKey` change across hourly patterns, never `code`/`points`/`class`/any penalty/any daily numeric metric — `useForecast.scoringInvariance.test.js`, through the real `useForecast` hook, with a **red→green proof** implicit in the existing invariance methodology (the two fixtures differ only in hourly weathercode placement, both isolated to zero precipitation so only the pattern-under-test varies).
15. `HourlyForecastModal` rows/best-window unchanged for the motivating fixture — `HourlyForecastModal.test.jsx`, confirming each real per-hour code renders independently and the daily narrative text never leaks into the modal.

## 6. Red→green proofs actually performed (not narrated from memory)

- **Motivating fixture** (`dailyWeatherSummary.temporal.test.js`): temporarily short-circuited `detectTemporalPattern`'s call site (`const pattern = null && detectTemporalPattern(windowObs);`) and reran the file — **12 of 26 tests failed** exactly as expected (every test whose fixture depends on the new temporal layer), while the other 14 (which correctly fall through to unchanged behavior) still passed. Restored the real call and reran — all 26 passed again.
- **`ForecastTable`'s `getPrecipitationLabel` non-overwrite guard**: temporarily disabled the early-return (`if (false && r.summaryTextKey) return base;`) and reran `ForecastTable.temporalSummary.test.jsx` — the "never overwrites" test failed exactly as expected (a generic amount caption appeared instead of the narrative). Restored and reran — all 8 passed.

## 7. Tests, lint, and build actually run — in the required order

1. **Focused temporal-summarizer + ForecastTable rendering tests** — `npx vitest run src/lib/dailyWeatherSummary.temporal.test.js src/components/ForecastTable.temporalSummary.test.jsx` → **34/34 passed**, 2 files.
2. **Ticket 400's complete presentation/null-safety/scoring-invariance test set** — `npx vitest run src/lib/dailyWeatherSummary.test.js src/lib/weatherPresentation.test.js src/components/ForecastTable.weatherPresentation.test.jsx src/components/ForecastTable.analytics.test.jsx src/hooks/useForecast.scoringInvariance.test.js` → **90/90 passed**, all pre-existing assertions unmodified, +1 new scoring-invariance test.
3. **HourlyForecastModal + relevant forecast-normalization/scoring tests** — `npx vitest run src/components/HourlyForecastModal.test.jsx src/lib/forecastNormalize.test.js src/lib/scoring.test.js src/lib/relocationEngine.timeWeight.test.js` → **91/91 passed** (rolled into the combined 10-file/215-test run below).
4. **`npm test -- --run`** → **1146/1146 passed**, 97 files (up from 1110/95 before this ticket — +36 tests, +2 files).
5. **`npm run lint`** → exit 0, no output.
6. **`npm run build`** → succeeded (`✓ built in 4.28s`). Same pre-existing "chunks larger than 500 kB" advisory as every prior run this session, unrelated to this ticket.
7. **`git diff --check`** → exit 0 (only pre-existing informational LF→CRLF autocrlf notices). **Final scope inspection**: `git status --short` shows exactly the files listed in §4 — confirmed `HourlyForecastModal.jsx`, `scoring.js`, `forecastNormalize.js`, `weatherPresentation.js`, every backend route, and every entitlement/checkout/analytics file absent from the diff.
8. **Real-browser verification** (§8 below).

No command was skipped or reported as passing without actually running.

## 8. Real-browser verification — motivating fixture and its inverse, EN/IS, mobile, light/dark

Started `npm run dev`, stubbed `/api/campsites` and `/api/forecast` via a throwaway Playwright script (the same established `page.route()` pattern used throughout this project's prior verification passes; deleted afterward, nothing added to the repo) with a realistic 7-day forecast: day 1 = the exact issue #402 fixture (raw daily code 55 "heavy drizzle"; hourly heavy drizzle at 06:00 only, dry 09:00–21:00), day 2 = the inverse (raw daily code 0 "clear"; hourly dry 06:00–15:00, rain 18:00–21:00 continuing to the window's last hour). Ran at viewport 390×1400 (mobile), once with `lang="en", theme="light"` and once with `lang="is", theme="dark"`.

**Observed directly** (screenshots inspected, not inferred):
- **Headline/icon coherence**: day 1 rendered "Rain early, dry later" (EN) / "Rigning framan af, þurrt síðar" (IS) with a light-drizzle-family icon and the existing hazard/class badge — never a plain "Heavy drizzle" or a contradictory clear icon. Day 2 rendered "Dry early, rain later" (EN) / "Þurrt framan af, rigning síðar" (IS) with a rain-family icon and the existing high-rain hazard warning triangle (14.0mm total, correctly still flagged — the hazard badge system is untouched and unaffected by the new headline). Days 3–7 (uniform dry filler) correctly showed "Clear sky" / "Heiðskírt" with sun icons.
- **Unchanged numeric metrics**: both fixture days showed their real full-day min/max temperature, wind, and total rain (2.5mm for day 1, 14.0mm for day 2) — the totals reflect the complete 24-hour Open-Meteo data regardless of the headline's temporal framing, exactly as required.
- **No clipping in the area this ticket touches**: the weather-condition cell and its text wrapped normally within the narrow 390px column in both languages/themes; the table's own separate `overflow-x-auto` scroll container for its unrelated metric columns is the same pre-existing (Ticket 400-documented) behavior, not a regression from this ticket.
- **Hourly detail tells the same story**: opened the hourly modal for day 1 — it showed "The best weather window today is from 09:00 to 21:00" (the modal's own unchanged best-window algorithm), 00:00/03:00 as "Clear sky," 06:00 specifically flagged "Heavy drizzle / Rough conditions," and 09:00/12:00/15:00 onward as "Clear sky / Good time." This is a direct, visible confirmation that the daily headline ("Rain early, dry later") and the hourly detail (one rough hour at 06:00, good from 09:00 onward) now tell the coherent same story — the exact contradiction issue #402 reported no longer exists.
- Both themes rendered readably with correct dark/light contrast; both languages produced real translated copy with no raw key leakage.

No visual combination from the required set (motivating fixture, inverse, EN, IS, mobile, light, dark) was skipped.

## 9. Deviations and residual risks

1. **No existing Ticket 400/401 test required modification** (§3) — the approved prompt anticipated this might be necessary ("revise it explicitly as superseded... do not silently delete or weaken"), but the refined `isMeaningfulWetRun`/hazard-bypass design made the new layer a strict backward-compatible superset. Documented via a full manual trace, verified by an unmodified 33/33 pass, rather than silently claiming compatibility.
2. **`dailySummaryDryEarlyRainLater` imposes no minimum duration on the trailing wet run** — only the leading dry run must meet the 6-hour threshold, matching the approved prompt's literal wording ("a long usable dry period followed by precipitation later"); the trailing wet run still must independently pass `isMeaningfulWetRun` (the same override-significance bar), so trivial trailing evidence still cannot trigger it.
3. **The "brief showers" representative code/icon always reflects the specific wet family that occurred** (e.g. heavy drizzle vs. heavy rain) rather than a single generic "showers" icon — a deliberate choice to keep icon and copy coherent per the approved prompt's explicit requirement, at the cost of the icon alone not visually distinguishing "brief" from "sustained" (the headline text carries that distinction).
4. No other risk identified: scoring, hazards, rankings, recommendations, the hourly modal's own algorithm, provider/API behavior, and Free/Pro gating are all confirmed unchanged and re-verified green, not merely assumed.

## 10. Confirmation (Revision 1)

`docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**

---

## Revision 2 — continuity-aware run construction (`docs/ai/tasks/ticket-402/approved-prompt-v2.md`)

Round 1 review: Jonesy PASS (independently hand-traced the algorithm against live code); Ripley REVISE — found that `buildChronologicalRuns` merged any later observation sharing a run's wet/dry classification regardless of the elapsed gap between hours, then computed `span = endHour - startHour + 1`. Sparse or uneven hourly data could therefore fabricate a long continuous run out of a few widely-spaced same-classification readings.

### The fabricated-span example (as found)

Two dry observations at `09:00` and `21:00`, with nothing observed in between, were merged into a single run with `span = 21 - 9 + 1 = 13` hours — meeting the six-hour "substantial dry" threshold from only two real data points. The pre-existing sparse-data test in `dailyWeatherSummary.temporal.test.js` positively asserted this as correct behavior ("sparse 3-hourly data ... still computes a plausible covered-hours span"), which is exactly the interpretation the approved v1 prompt forbade ("sparse or uneven gaps must not fabricate duration").

### The corrected continuity rule

`buildChronologicalRuns` (`src/lib/dailyWeatherSummary.js`) now joins an observation to the active run only when **both** conditions hold: its classification matches the run's, **and** its hour is exactly `last.endHour + 1` (the very next hour). Any other case — a genuine classification change, **or** a gap of one or more unobserved hours even when the classification matches on both sides — starts a new run instead. A run's `span` is therefore always genuine observed, contiguous coverage; an unobserved hour can never be silently counted as covered duration. Six-hour substantial-dry / three-hour brief-wet thresholds, the wet-significance gate (`isMeaningfulWetRun`), the hazard bypass, the three recognized temporal shapes, representative-code selection, and the primary `[06:00, 22:00)` window are all unchanged — the correction is scoped entirely to how a run's boundaries are detected.

### Duplicate-timestamp policy (new, required by v2 §1)

A duplicate observation at the run's current end hour never advances `endHour`, so it can never add duration either way:
- **Same classification as the run:** folded into the run's own observation list (extra evidence for that hour) without changing the run's span.
- **Conflicting classification at that same hour:** the ambiguous duplicate is dropped outright rather than starting a same-hour run, so a contradictory same-hour reading can never itself manufacture a directional narrative.

This is deterministic given a fixed input order (ties at the same hour keep the underlying stable-sort order of the source array), satisfying the "conservatively and deterministically" requirement without inventing an ordering rule the real Open-Meteo payload doesn't need — production input is single-valued per hour, so this path only matters for malformed/duplicated payloads.

### Exact test changes — `src/lib/dailyWeatherSummary.temporal.test.js`

Removed the one test that positively asserted the fabricated-span interpretation ("sparse 3-hourly data ... still computes a plausible covered-hours span"). Added a new `describe` block, "Revision 2 (#402): sparse/gapped data must not fabricate continuous duration," with 5 tests:

1. `{06:00 wet, 09:00 dry, 21:00 dry}` (only 3 real data points) → `textKey` is `null` — the gaps are not covered hours, nowhere near the 6-hour threshold.
2. A single missing hour inside an otherwise-dry sequence (`dryRun(9,13)` + gap at 14 + `dryRun(15,21)`) → `textKey` is `null` — proves a gap breaks a same-classification sequence into two separate runs rather than one span-13 run (the exact defect Ripley found: under the old formula this fixture would have wrongly qualified as `dailySummaryRainEarlyDryLater`).
3. Truly contiguous full-resolution `dryRun(9,21)` still satisfies the threshold and returns `dailySummaryRainEarlyDryLater` / code 55 — re-asserts the original #402 motivating result is preserved, not just the negative cases.
4. A duplicate hour-21 observation (same classification, appended) → result unchanged (`dailySummaryRainEarlyDryLater` / 55) — duplicates don't add duration.
5. A duplicate hour-9 observation with a conflicting code (wet vs. the real dry reading) → result unchanged (`dailySummaryRainEarlyDryLater` / 55) — the ambiguous duplicate is dropped rather than disrupting the genuine dry run or fabricating its own narrative.

All other Revision-1 tests in the file (motivating fixture, inverse pattern, precipitation-led, brief episodes, persistent dry/cloudy, intermittent, hazard bypass ×4, boundary hours ×3, reordering, missing-precipitation-array, malformed-timestamps, null-code, non-mutation, fallback ×3) were retained and rerun unmodified — all still pass, since every one of them already used either a single uniform run or genuinely hour-by-hour contiguous data (`dryRun(...)` builds one entry per hour) and was never relying on the gap-merging defect.

### Red→green proof

Temporarily reverted `buildChronologicalRuns`'s contiguity condition to unconditionally merge on classification match alone (the pre-fix behavior) and reran `dailyWeatherSummary.temporal.test.js`: the 2 new gap-sensitive tests failed exactly as expected (`expected 'dailySummaryRainEarlyDryLater' to be null`), while the other 28 tests still passed. Restored the fix and reran — all 30 tests green again.

### Validation run (Revision 2)

1. `npx vitest run src/lib/dailyWeatherSummary.temporal.test.js src/lib/dailyWeatherSummary.test.js` → 2 files, 63 tests passed.
2. `npx vitest run ... ForecastTable.temporalSummary.test.jsx ForecastTable.weatherPresentation.test.jsx useForecast.scoringInvariance.test.js HourlyForecastModal.test.jsx` (combined with #1) → 6 files, 94 tests passed.
3. `npm test -- --run` → **97 files, 1150 tests passed** (1146 + 4 net new: 5 added, 1 removed).
4. `npm run lint` → exit 0, no output.
5. `npm run build` → succeeded (`✓ built in 4.16s`), same pre-existing chunk-size advisory, unrelated.
6. `git diff --check` → exit 0 (only pre-existing informational LF→CRLF notices). Scope inspection: only `src/lib/dailyWeatherSummary.js` and `src/lib/dailyWeatherSummary.temporal.test.js` changed for Revision 2, alongside this report and `docs/ai/CURRENT.md` (the workflow pointer) — no UI/integration file, translation, scoring, or backend file touched, matching the v2 prompt's required scope exactly.
7. No real-browser recheck performed — this correction changes evidence qualification (run continuity) only, not rendered structure, styling, or any file `ForecastTable.jsx`/`HourlyForecastModal.jsx` depend on; both remain byte-for-byte as verified in Revision 1, and the v2 prompt explicitly does not require a repeat browser check for this class of fix.

### Acceptance criteria — status

- No unobserved hour contributes to a wet or dry run's duration — enforced structurally (`o.hour === last.endHour + 1` required to extend a run).
- Sparse `{09:00 dry, 21:00 dry}` cannot become a 13-hour run — test 1 above.
- A gap within a run breaks continuity and prevents false narratives — test 2 above.
- Duplicate hours cannot fabricate duration or order-dependent transitions — tests 4-5 above.
- The full-resolution motivating fixture still returns `dailySummaryRainEarlyDryLater` / code 55 — test 3 above, plus the original Revision-1 motivating-fixture test (unmodified, still passing).
- All other temporal states, Ticket 400 code/fallback behavior, bilingual rendering, icon/headline alignment, and scoring invariance unchanged — confirmed by the unmodified 33/33 `dailyWeatherSummary.test.js` pass and the full 1150-test suite.
- No file outside the summarizer, its temporal tests, the CC report, and the workflow pointer changed — confirmed by `git status --short` (§6 above).

### Confirmation (Revision 2)

`docs/ai/CURRENT.md` updated: `Stage: CC_COMPLETE`, CC report path unchanged (this file). **Not committed. Not pushed.**

---

## Revision 3 — order-independent same-hour duplicate resolution (`docs/ai/tasks/ticket-402/approved-prompt-v3.md`)

Round 2 review: Jonesy PASS (independently hand-traced five cases, including explicitly acknowledging a Round-1 miss); Ripley REVISE — found that Revision 2's conflicting-duplicate handling was still input-order-dependent.

### The order-dependent v2 behavior (as found)

`buildChronologicalRuns` sorted observations by hour only. For two observations sharing an hour, JavaScript's stable sort preserved their *source array* order, and Revision 2's duplicate branch let whichever one was processed first become (or extend) the active run, silently dropping a later conflicting one. Reversing the same two same-hour observations in the input array could therefore change which classification "won" that hour — and, in turn, whether a temporal narrative was returned at all. This violated both the v2 prompt's "conservatively and deterministically" duplicate requirement and the module's own established reordered-input invariance guarantee (proven elsewhere in the file for non-duplicate data, but never actually true for same-hour conflicts).

### The normalization policy (Revision 3)

`src/lib/dailyWeatherSummary.js` gained `normalizeObservationsByHour(obs)`, called from `detectTemporalPattern` *before* `buildChronologicalRuns` is ever invoked:

- Observations are grouped into a `Map` keyed by hour — grouping, not sorting, so which entry a stable sort would have picked "first" never enters the decision.
- **A group containing both wet and dry classifications is genuinely ambiguous.** Neither observation is allowed to win by array position; the entire day's temporal layer is disabled (`hasAmbiguousHour → detectTemporalPattern returns null`), and the caller falls through to the unchanged, unmodified override/dominance fallback pipeline, which still evaluates the raw (non-normalized) window exactly as Ticket 400 established. This is a stricter, safer policy than Revision 2's "drop the later duplicate" — an ambiguous hour is now evidence the whole day's story is unclear, not something to quietly resolve by picking a side.
- **A group agreeing on wet-vs-dry collapses to one observation** via `collapseSameHourDuplicates(group)`, reusing existing semantics rather than inventing new ones: the winning family is the most severe one present in the group according to `FAMILY_PRIORITY_ORDER` (already used elsewhere in this module as the ultimate dominant-family tie-break — reused here, not duplicated), then `representativeCodeForFamily` picks that family's highest-intensity code actually observed among the group — no new WMO mapping introduced. The collapsed amount uses a conservative finite-amount rule: the larger of any finite `precipMm` readings in the group (never the sum, never an assumed zero), matching the "missing amount is never treated as zero" principle already documented for `evaluateLightModerateFamily`.
- `buildChronologicalRuns` itself was simplified back to a pure continuity check (the Revision 2 duplicate-hour branch is no longer needed or reachable, since its input is now guaranteed to have at most one observation per hour) — a single call site (`detectTemporalPattern`), so this was safe to simplify rather than leave as dead defensive code.

This also fixed a second, previously-unnoticed defect in Revision 2's own duplicate branch: it prevented a duplicate from extending a run's *span* (by never advancing `endHour`), but still pushed the duplicate into the run's `obs` array — so two same-hour light-rain readings could inflate `evaluateOverrideFamily`'s "2+ observations" significance count from 1 real hour into 2, wrongly qualifying a single trivial hour as significant evidence. Collapsing duplicates to one observation *before* any run is built removes this path entirely — required explicitly by v3 §1: "duplicates ... must not turn one light-rain hour into the existing two-observation significance threshold."

### Exact test changes — `src/lib/dailyWeatherSummary.temporal.test.js`

Replaced the single Revision-2 "conflicting wet/dry duplicate" test (which asserted the *old, now-superseded* order-dependent outcome — dry wins, narrative preserved) with a new `describe` block, "Revision 3 (#402): same-hour duplicates are resolved order-independently before run construction," containing 7 tests:

1. A same-hour wet/dry conflict at 09:00 suppresses the narrative, parameterized over both source-array orders (`it.each`) — proves the ambiguous-hour policy applies regardless of which observation appears first.
2. The same conflicting fixture, forward and reversed, asserted `toEqual` each other — direct order-independence proof, not just "both happen to be null."
3. A same-classification duplicate (hour 21, dry) never extends run duration, parameterized over both orders — the narrative and code stay exactly as the original motivating fixture.
4. Two duplicate light-rain rows at hour 10 (each 0.6mm, under the 1.0mm single-observation floor) do not qualify as two distinct observations — proves the significance-inflation defect above is fixed.
5. Revision 2's original missing-hour gap-continuity fixture re-asserted unchanged after hour-normalization.
6. The full-resolution motivating #402 fixture re-asserted unchanged after hour-normalization.
7. A reordered non-duplicate fixture (the existing brief-showers shape, reversed) re-asserted unchanged — hour-normalization doesn't affect fixtures with no duplicates.

All Revision 1/2 tests elsewhere in the file (motivating fixture, inverse pattern, precipitation-led, brief episodes, persistent dry/cloudy, intermittent, hazard bypass ×4, boundary hours ×3, sparse-gap ×3, missing-precipitation-array, malformed-timestamps, null-code, non-mutation, fallback ×3) were retained and rerun unmodified.

### Red→green proof

Temporarily reinstated Revision 2's order-dependent duplicate branch inside `buildChronologicalRuns` (drop-by-array-order) and bypassed the new `normalizeObservationsByHour` call in `detectTemporalPattern` (fed raw `windowObs` straight into run construction, exactly as Revision 2 did). Reran `dailyWeatherSummary.temporal.test.js`: **3 tests failed exactly as expected** — the parameterized ambiguous-conflict test (`expected 'dailySummaryRainEarlyDryLater' to be null`), the forward/reversed equality test (`toEqual` mismatch: forward result carried a narrative, reversed didn't — direct proof of the order-dependence Ripley found), and the duplicate-light-rain-significance test (`expected 'dailySummaryBriefShowers' to be null`). The other 35 tests in the file still passed. Restored both changes and reran — all 38 tests green again.

### Validation run (Revision 3)

1. `npx vitest run src/lib/dailyWeatherSummary.temporal.test.js src/lib/dailyWeatherSummary.test.js` → 2 files, 71 tests passed.
2. `npx vitest run ... ForecastTable.temporalSummary.test.jsx ForecastTable.weatherPresentation.test.jsx useForecast.scoringInvariance.test.js HourlyForecastModal.test.jsx` (combined with #1) → 6 files, 102 tests passed.
3. `npm test -- --run` → **97 files, 1158 tests passed** (1150 + 8 net new: the temporal test file grew from 30 to 38 tests).
4. `npm run lint` → exit 0, no output.
5. `npm run build` → succeeded (`✓ built in 4.19s`), same pre-existing chunk-size advisory, unrelated.
6. `git diff --check` → exit 0 (only pre-existing informational LF→CRLF notices). Scope inspection: only `src/lib/dailyWeatherSummary.js` and `src/lib/dailyWeatherSummary.temporal.test.js` changed for Revision 3, alongside this report and `docs/ai/CURRENT.md` — no UI/integration/scoring/translation/provider file touched, matching the v3 prompt's required scope exactly.
7. No real-browser recheck performed — no UI file changed for this revision (`ForecastTable.jsx`/`HourlyForecastModal.jsx` remain byte-for-byte as verified in Revision 1), matching the v3 prompt's "no browser rerun ... unless a UI file changes."

### Acceptance criteria — status

- Reversing equal-hour observations cannot change the temporal result — proven directly by the forward/reversed `toEqual` test, and structurally by grouping-before-sorting instead of relying on stable-sort order.
- Any same-hour wet/dry conflict conservatively disables the temporal narrative — the whole day, not just the hour, per v3 §1's explicit instruction; tests 1-2 above.
- Duplicate rows never add covered duration (Revision 2, re-verified) or distinct-hour significance evidence (Revision 3, new) — tests 3-4 above.
- Revision 2's missing-hour fix and the full-resolution motivating fixture remain correct — tests 5-6 above, plus the original unmodified Revision 1/2 tests.
- All Ticket 400/402 compatibility, UI, bilingual copy, metrics, hazards, and scoring behavior unchanged — confirmed by the unmodified 33/33 `dailyWeatherSummary.test.js` pass, the unmodified `ForecastTable`/`useForecast`/`HourlyForecastModal` test files, and the full 1158-test suite.

### Confirmation (Revision 3)

`docs/ai/CURRENT.md` updated: `Stage: CC_COMPLETE`, CC report path unchanged (this file). **Not committed. Not pushed.**
