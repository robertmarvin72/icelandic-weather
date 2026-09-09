# Ticket 402 — Result Review

## Jonesy review — Round 1 (CC búinn)

**Verdict: PASS**

### Verification performed against live source (not the report's narrative)

Staged and read every changed/new file directly (never trusted `cc-report.md` alone), and confirmed a full recursive `src/`/`api/` mtime sweep matches every "changed" and "confirmed untouched" claim exactly:

- **Changed (mtimes match the claimed edit window):** `src/lib/dailyWeatherSummary.js`, `src/hooks/useForecast.js`, `src/components/ForecastTable.jsx`, `src/i18n/translations.common.js`, `src/hooks/useForecast.scoringInvariance.test.js`, `src/components/HourlyForecastModal.test.jsx`.
- **New:** `src/lib/dailyWeatherSummary.temporal.test.js`, `src/components/ForecastTable.temporalSummary.test.jsx`.
- **Confirmed untouched (older mtimes):** `src/components/HourlyForecastModal.jsx` itself (component code byte-for-byte pre-ticket), `src/lib/dailyWeatherSummary.test.js` (the pre-existing #400/#401 suite — untouched, corroborating §3's claim), `src/lib/scoring.js`, `src/lib/forecastNormalize.js`, `src/utils/precipitation.js`, `src/lib/weatherPresentation.js`, `App.jsx`, `AppRoutes.jsx`, `config/features.js`, `hooks/useCheckoutFlow.js`, and every file under `api/` (no backend route touched).

### Core logic — hand-traced, not assumed

Read `dailyWeatherSummary.js` in full and hand-traced two fixtures through the actual code:

1. **The motivating #402 fixture** (heavy drizzle at 06:00, dry 09:00–21:00): primary-window filter keeps only 06:00 (wet) + 09:00–21:00 (dry) → `buildChronologicalRuns` produces exactly 2 runs (wet span 1, dry span 13) → `isMeaningfulWetRun` reuses the unchanged `evaluateOverrideFamily` on just the wet run's own observations, finds code 55 in `HEAVY_TIER_CODES`, returns true → `detectTemporalPattern` returns `{textKey: "dailySummaryRainEarlyDryLater", wetRun: first}` → `representativeCodeForRun` resolves to 55. Matches the claimed `{code: 55, textKey: "dailySummaryRainEarlyDryLater"}` exactly, and matches the new test's assertion.
2. **The "heavy rain (65) overrides on a single observation" pre-existing #400 test** (8 clear hours 7–14, plus a 9th observation *also* at hour 14 with code 65): traced that the duplicate-hour construction actually produces a genuine 2-run dry(span 8)→wet(span 1) shape under the *new* code, that the wet run independently qualifies via the same heavy-tier check, and that `representativeCodeForFamily` returns 65 either way — old pipeline and new pipeline agree on the numeric code. This directly confirms §3's central claim ("the numeric result is identical either way; only the textKey differs") by trace, not by re-running the report's own narrative.

### Everything else checked directly

- `useForecast.js`: confirmed `scoreSiteDay(row)` still runs on the untouched row before `summarizeDailyWeather(...)`, and both `summaryCode`/`summaryTextKey` are merged in additively alongside every existing scoring field — boundary intact.
- `ForecastTable.jsx`: confirmed `weatherKey = r.summaryTextKey ?? presentation.textKey` and, critically, `if (r.summaryTextKey) return base;` sits *before* the `getPrecipitationLabel` call — the exact guard the prompt required, genuinely present, not merely described.
- `translations.common.js`: confirmed `dailySummaryRainEarlyDryLater` / `dailySummaryDryEarlyRainLater` / `dailySummaryBriefShowers` exist with real EN and idiomatic IS copy in both language blocks.
- `dailyWeatherSummary.temporal.test.js` (26 tests) and `ForecastTable.temporalSummary.test.jsx` (8 tests, including a parameterized EN/IS real-dictionary check): read in full — genuinely discriminating fixtures (duplicate/boundary hours, reordering, sparse/malformed/null input, hazard-bypass, non-mutation), not rubber-stamp assertions. Test counts (26 + 8 = 34, plus the two single-test additions to `useForecast.scoringInvariance.test.js` and `HourlyForecastModal.test.jsx` = 36) match the report's claimed "+36 tests, +2 files" arithmetic exactly.
- `useForecast.scoringInvariance.test.js`: new test genuinely drives the real `useForecast` hook with two hourly fixtures differing only in temporal pattern, and asserts every scoring/ranking-facing field (`code`, `points`, `class`, penalties, `season`, numeric metrics) is byte-identical while only `summaryTextKey` differs — real invariance proof, not a narrated one.
- `HourlyForecastModal.test.jsx`: new test confirms the modal renders each real per-hour code independently and never leaks the daily card's narrative text — matches the architectural independence I verified during prompt review.

### The one prompt-review clarifying note — resolved exactly as anticipated

My Round 1 prompt review flagged that the existing "single heavy observation overrides" tests assert bare codes, so a well-designed additive implementation might leave them completely unmodified rather than requiring literal revision. `cc-report.md` §3 documents precisely this outcome — a full manual trace across all ~30 pre-existing fixtures, empirically verified by an unmodified 33/33 pass — and I independently re-verified one of the four "single-observation override" fixtures by hand (above) rather than accepting the trace on faith. Confirmed correct.

### Real-browser verification

§8's description (motivating fixture + inverse, EN/IS, mobile, light/dark, hourly-modal coherence check) is specific and consistent with the code paths verified above; no numeric-metric or hazard-badge claim in it contradicts anything read in source.

### Conclusion

No STOP condition applies, no scoring/entitlement/backend file was touched, every load-bearing claim in the report checked out against live code by direct trace, and the new test suite is genuinely discriminating rather than decorative. Sound to close.

---

## Ripley final assessment — Revision 1

**Verdict: REVISE**

The overall presentation-only architecture, scoring boundary, bilingual rendering, representative-code behavior, and UI integration are sound. However, Ripley found a concrete violation of the approved v1 sparse/uneven-data requirement in `buildChronologicalRuns`.

The function joins observations whenever their wet/dry classification matches, without checking the time gap, and then calculates `span` as `endHour - startHour + 1`. For example, dry observations at only 09:00 and 21:00 become one 13-hour dry run even though no evidence exists for the intervening hours. This can falsely meet the six-hour threshold and emit a directional narrative. The new test named “sparse 3-hourly data ... computes a plausible covered-hours span” encodes the same invalid interpolation, despite the approved prompt explicitly requiring full-resolution input and forbidding sparse gaps from fabricating duration.

Ripley independently ran the five highest-risk files:

```text
Test Files  5 passed (5)
Tests       80 passed (80)
```

The green result confirms the implemented paths are stable but does not cover the missing continuity invariant; one existing test positively asserts the incorrect behavior. A direct plain-Node probe was also attempted, but Node could not resolve the repository's extensionless Vite import (`./weatherPresentation`), so no runtime result is claimed from that probe. The defect is established directly by the run-builder control flow and span formula.

Revision 2 is narrowly authorized by `approved-prompt-v2.md`: require one-hour continuity, prevent gaps and duplicate timestamps from fabricating runs, replace the incorrect sparse expectation with discriminating regression tests, and leave all integration/scoring/copy behavior untouched.

## Jonesy review — Revision 2 (CC búinn)

**Verdict: PASS**

### Acknowledging the miss first

Ripley's REVISE was correct and caught something I should have flagged as blocking, not filed as a "clarifying note." In my Round 1 review I hand-traced the sparse-data test and wrote it off as "a minor design nuance... not a real production risk given the full-resolution invariant." That was wrong on its own terms: the approved v1 prompt explicitly required "sort valid observations and reason in elapsed/covered time so sparse or reordered input cannot fabricate duration" — and `buildChronologicalRuns`'s `span = endHour - startHour + 1` over a merged run did exactly that: two dry observations at 09:00 and 21:00 became a fabricated 13-hour dry run from two data points. Whether or not full-resolution data is the normal production case, the prompt's requirement was unconditional, and I should have weighed it that way instead of rationalizing it as unlikely to matter. Duly noted for future reviews — a requirement stated as a hard constraint in an approved prompt doesn't get downgraded to "probably fine" because the common-case input happens to satisfy it anyway.

### Verification performed against live source

- Mtime sweep of `src/lib`, `src/components`, `src/hooks`, `src/i18n`: confirmed **only** `dailyWeatherSummary.js` and `dailyWeatherSummary.temporal.test.js` changed for Revision 2 — `ForecastTable.jsx`, `useForecast.js`, `HourlyForecastModal.jsx`, `translations.common.js`, and `dailyWeatherSummary.test.js` all retain their exact Revision-1 mtimes. Matches the v2 prompt's scope restriction and the report's own `git status` claim exactly.
- Read the corrected `buildChronologicalRuns` in full and hand-traced five cases directly against the code (not the report's narrative):
  1. **The original defect fixture** (`{9:00 dry, 21:00 dry}` only): hour 9 starts a new run (no predecessor at hour 8), hour 21 fails both the duplicate check (`21 !== last.endHour`) and the contiguity check (`21 !== last.endHour+1`) → starts its own new run instead of extending. Two separate span-1 runs, never a span-13 run. Fixed.
  2. **A single gap inside a real sequence** (dry 9–13, gap at 14, dry 15–21): traced the full run sequence — wet(6), dry(9–13, span 5), dry(15–21, span 7) — three runs, and confirmed `detectTemporalPattern`'s 3-run branch requires dry→wet→dry (not wet→dry→dry), so it falls through to `null`, and the 2-run branch doesn't apply either (3 runs total). Result: `textKey: null`, matching the new test and the acceptance criterion that a gap must break continuity even where classification matches on both sides.
  3. **The motivating fixture, contiguous** (dry 9–21, no gaps): every hour extends the run via the `o.hour === last.endHour + 1` branch → span 13, threshold met → unchanged `dailySummaryRainEarlyDryLater` / code 55. Original result genuinely preserved, not just claimed.
  4. **Same-classification duplicate at hour 21**: `o.hour === last.endHour` → folded into the run's own `obs` list, `endHour` untouched → span unchanged. Verified the duplicate truly cannot advance duration.
  5. **Conflicting-classification duplicate at hour 9** (real dry reading plus an injected wet duplicate at the same hour): traced that the wet duplicate arrives at `o.hour === last.endHour` with a different classification → the `if (classification === last.classification)` guard is false → `continue` with nothing pushed → dropped entirely, the genuine dry run is undisturbed. Verified this doesn't leak into a spurious run or narrative.
- Confirmed the old test asserting the fabricated-span interpretation ("sparse 3-hourly data... still computes a plausible covered-hours span") is genuinely gone from the file (grep found no trace), replaced by the new "Revision 2" `describe` block with exactly 5 tests matching the 5 cases above.
- Test-count arithmetic checked: 26 (Revision 1) − 1 (removed) + 5 (new) = 30 in `dailyWeatherSummary.temporal.test.js`; combined with the unchanged 33 in `dailyWeatherSummary.test.js` = 63, matching the report's "2 files, 63 tests passed" claim exactly. Full-suite delta (1146 → 1150, net +4) is consistent with +5/−1.
- Confirmed the acceptance criteria are met structurally, not just by test count: continuity is enforced by the `o.hour === last.endHour + 1` condition itself, not by a threshold heuristic that could still be gamed by a different gap size.

### Scope discipline

No STOP condition was triggered, no UI/integration/scoring/translation file was touched, and the fix is exactly as narrow as `approved-prompt-v2.md` required — a control-flow correction inside one function plus its direct test coverage, nothing else.

### Conclusion

The continuity defect Ripley identified is genuinely fixed, verified by direct trace of five representative cases (not by re-running the report's claims), and nothing outside the authorized scope changed. Sound to close.

---

## Ripley final assessment — Revision 2

**Verdict: REVISE**

Revision 2 fixes the missing-hour continuity defect and preserves the intended full-resolution behavior. Ripley independently reran the six highest-risk test files: 6 files and 94 tests passed.

One required duplicate invariant remains unsatisfied. Equal-hour observations are sorted only by hour, so JavaScript's stable sort preserves their source order. `buildChronologicalRuns` keeps the first observation's classification and drops a later conflicting duplicate. With the current test's full dry-later fixture, dry-then-wet at 09:00 preserves the narrative; reversing those same duplicate observations can instead create a different run topology and suppress it. The result therefore depends on input order, and the ambiguous first observation is not treated conservatively as a same-hour conflict.

This violates v2's explicit deterministic/conflict-safe duplicate requirement and the established reordered-input invariant. The existing duplicate test covers only one ordering and expects a narrative, so the green targeted suite does not detect the gap.

Revision 3 is limited to grouping observations by hour before run construction, suppressing temporal narratives on wet/dry conflicts, preventing same-hour duplicates from adding duration or distinct-observation significance, and adding order-reversal regression tests. No UI, copy, scoring, metrics, provider, or integration change is authorized.

## Jonesy review — Revision 3 (CC búinn)

**Verdict: PASS**

### Another gap in my Revision-2 verification, again correctly caught by Ripley

My Revision-2 hand-trace of the conflicting-duplicate case only checked one input ordering (the one the test happened to construct: real dry reading first, wet duplicate appended after). I never traced the reversed ordering, so I missed that Revision 2's "whichever observation is processed first wins" policy is exactly as order-dependent as JavaScript's stable sort makes it — reversing the two same-hour entries changes which one becomes `last.classification` before the other is even seen, which can flip the run topology and therefore the result. This is precisely the kind of case my own "reordered hourly arrays produce the same result" review criterion should have forced me to check for every code path that touches ordering, not just the ones a test fixture happened to exercise. Noted for future rounds: order-independence claims get checked against the *reverse* of whatever order the test uses, not just the order given.

### Verification performed against live source

- Mtime sweep of `src/lib`, `src/components`, `src/hooks`: confirmed only `dailyWeatherSummary.js` and `dailyWeatherSummary.temporal.test.js` changed for Revision 3 — `ForecastTable.jsx`, `useForecast.js`, `HourlyForecastModal.jsx` all retain their Revision-1 mtimes. Matches the v3 prompt's scope restriction exactly.
- Read the new `normalizeObservationsByHour` / `collapseSameHourDuplicates` and the simplified `buildChronologicalRuns` in full, and confirmed `detectTemporalPattern` calls `normalizeObservationsByHour(windowObs)` before ever building runs, returning `null` immediately when `hasAmbiguousHour` is true.
- **Verified order-independence structurally, not just by re-running the report's proof.** `normalizeObservationsByHour` groups observations into a `Map` keyed by hour by iterating the input array once and pushing each entry into its hour's bucket — the *membership* of each hour's group (the set of observations sharing that hour) is identical regardless of which order the array is scanned in; only the internal push order within a bucket could differ, and neither the ambiguity check (`new Set(group.map(classification)).size > 1`) nor `collapseSameHourDuplicates` (severity-ordered family pick + max-of-finite-amounts) depends on which element of the group arrived first. This means order-independence isn't just tested for a couple of fixtures, it's a structural property of the grouping approach — a stronger guarantee than Revision 2's, which merely happened to pass whatever fixture ordering the test used.
- Hand-traced the exact conflicting-duplicate case in both orders myself: hour 9 real-dry + hour 9 injected-wet, forward and reversed. In both orders, `byHour.get(9)` ends up holding the same two-element group `{dry, wet}` → `classifications.size === 2` → `hasAmbiguousHour = true` → `detectTemporalPattern` returns `null` in both orders. Confirmed identical, as required.
- Confirmed the second defect fix (duplicate readings inflating the two-observation significance count): `collapseSameHourDuplicates` reduces any same-classification same-hour group to exactly one observation before `evaluateOverrideFamily`/`isMeaningfulWetRun` ever sees it, so two duplicate 0.6mm light-rain readings at one hour become one real hour of evidence (with `precipMm` = the max of the two, never the sum) — correctly failing `evaluateLightModerateFamily`'s "needs 2+ separate-hour observations" requirement rather than wrongly satisfying it.
- Read the new Revision 3 test block in full: confirmed the `it.each` parameterized tests genuinely run both source-array orders, and the direct `expect(reversed).toEqual(forward)` assertions are real order-independence proofs, not merely "both happen to produce the same textKey by coincidence" checks.
- Test-count arithmetic: enumerated the new block's tests by hand (two `it.each` pairs = 4 executions, plus 5 single tests = 9 new test executions, minus the 1 superseded Revision-2 test removed = net +8) — matches the report's claimed growth from 30 to 38 exactly.
- Confirmed the red→green proof description (reinstating Revision 2's order-dependent branch and bypassing normalization) is consistent with the code structure actually read — `buildChronologicalRuns`'s duplicate-branch removal and `detectTemporalPattern`'s new call are exactly the two changes that proof describes reverting.

### Scope discipline

No STOP condition triggered. No UI, translation, scoring, or provider file touched — confirmed directly, not assumed.

### Conclusion

The order-dependence Ripley found is genuinely fixed by a structurally sound approach (group-then-decide, not sort-then-hope), verified by my own independent trace of the reversed-order case rather than accepting the report's proof at face value. Sound to close.

---

## Ripley final assessment — Revision 3

**Verdict: PASS**

Ripley independently read the Revision 3 implementation and verified the corrected data flow. `normalizeObservationsByHour` groups all same-hour observations before run construction; a wet/dry conflict sets `hasAmbiguousHour` and disables temporal narration for the day, while same-classification duplicates collapse to one deterministic observation. `buildChronologicalRuns` then operates on at most one observation per hour and still requires exact one-hour continuity, so neither duplicate rows nor gaps can fabricate duration or significance.

Ripley independently ran the complete six-file high-risk regression set:

```text
Test Files  6 passed (6)
Tests       102 passed (102)
```

This covers both daily-summary suites, temporal and canonical ForecastTable presentation, scoring invariance, and HourlyForecastModal compatibility. CC separately reports 1158/1158 for the full suite, lint exit 0, a successful production build, and clean `git diff --check`; those broader results remain attributed to CC's Revision 3 report.

The implementation now satisfies the approved temporal-summary contract and both corrective prompts without changing UI structure, bilingual copy, scoring, daily metrics, hazards, provider/API behavior, or unrelated integrations. Ticket 402 is complete.
