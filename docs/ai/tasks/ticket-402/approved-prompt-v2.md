# Approved Corrective Implementation Prompt — Ticket 402 (v2)

## Context and verdict

Ticket 402's temporal-summary architecture and integration are otherwise correct, but the run-duration implementation violates the approved sparse/uneven-data contract.

`buildChronologicalRuns` currently merges every later observation with the same wet/dry classification into the active run regardless of the elapsed gap, then computes `span = endHour - startHour + 1`. Consequently, two dry observations at 09:00 and 21:00 are treated as a continuous 13-hour dry run even though the intervening 11 hours are unobserved. That can fabricate the six-hour evidence required for `Rain early, dry later`, `Dry early, rain later`, or `Brief showers, otherwise dry`.

The new temporal test explicitly endorses this incorrect assumption for sparse 3-hourly input. The approved v1 prompt required the opposite: sparse or uneven gaps must not fabricate duration, and the summarizer must use the full-resolution hourly payload rather than the modal's sampled three-hour display rows.

Execute only the narrow correction below on top of the existing v1 implementation. Preserve all other v1 behavior and files unless directly required by this fix.

## Required correction

1. In `src/lib/dailyWeatherSummary.js`, make chronological run construction continuity-aware:
   - sort valid observations chronologically as it does now;
   - join an observation to the preceding run only when its wet/dry classification matches **and** the timestamp evidence is genuinely contiguous at the source's hourly cadence;
   - a missing intervening hour must break the run and must not count as covered dry/wet duration;
   - do not fill, interpolate, or assume the state of an unobserved hour;
   - handle duplicate timestamps conservatively and deterministically: duplicates must not add duration, and conflicting wet/dry observations at the same hour must not create a directional narrative.

   A simple one-hour-contiguity rule is appropriate because the production input to this summarizer is Open-Meteo's full-resolution hourly payload. Do not derive continuity from the HourlyForecastModal's three-hour sampling.

2. Compute each run's qualifying span from observed contiguous hourly coverage only. Keep the existing six-hour substantial-dry threshold, three-hour brief-wet threshold, wet-significance check, hazard bypass, temporal shapes, representative-code behavior, and primary `[06:00, 22:00)` window unchanged.

3. Correct `src/lib/dailyWeatherSummary.temporal.test.js`:
   - replace the test that currently claims sparse three-hour observations cover the hours between them;
   - prove that `{06:00 wet, 09:00 dry, 21:00 dry}` does **not** produce a dry-later narrative;
   - prove that a missing hour inside an otherwise same-classification dry sequence breaks continuity and cannot fabricate the six-hour minimum;
   - prove that truly contiguous full-resolution dry observations still satisfy the threshold and preserve the motivating #402 result;
   - add deterministic duplicate-hour cases for same-classification duplicates and conflicting wet/dry duplicates;
   - retain and rerun the reordered, malformed, null-code, hazard, fallback, and non-mutation cases.

4. Do not change `useForecast.js`, `ForecastTable.jsx`, translations, `HourlyForecastModal`, scoring, normalization, provider/API code, or any other production integration unless the audit demonstrates the continuity correction cannot be made locally. If that occurs, STOP and report.

5. Append a clearly labeled Revision 2 section to `docs/ai/tasks/ticket-402/cc-report.md`. Record the original fabricated-span example, the corrected continuity rule, duplicate-hour policy, exact test changes, and validation results. Preserve the existing report history.

## Acceptance criteria

- No unobserved hour contributes to a wet or dry run's duration.
- Sparse `{09:00 dry, 21:00 dry}` evidence cannot become a 13-hour continuous dry span.
- A gap within a run breaks continuity and prevents false directional/brief narratives.
- Duplicate hours cannot fabricate duration or order-dependent transitions.
- The full-resolution motivating fixture still returns `dailySummaryRainEarlyDryLater` with the existing representative code.
- All other Ticket 402 temporal states, Ticket 400 code/fallback behavior, bilingual rendering, icon/headline alignment, and scoring invariance remain unchanged.
- No files outside the summarizer, its temporal tests, the CC report, and workflow pointer change for Revision 2.

## Validation

Run at minimum:

1. `src/lib/dailyWeatherSummary.temporal.test.js` and `src/lib/dailyWeatherSummary.test.js`;
2. `src/components/ForecastTable.temporalSummary.test.jsx` and `src/components/ForecastTable.weatherPresentation.test.jsx`;
3. `src/hooks/useForecast.scoringInvariance.test.js` and `src/components/HourlyForecastModal.test.jsx`;
4. the full Vitest suite;
5. `npm run lint`;
6. `npm run build`;
7. `git diff --check` and a Revision-2-only scope inspection.

Include a red→green proof showing the new sparse/gap regression test fails against the v1 run builder and passes after the correction. A repeat browser check is not required because this correction changes evidence qualification only, not rendered structure or styling; rerun it only if a UI/integration file unexpectedly changes.

## STOP conditions

STOP if the correction requires changing the provider cadence/request, interpolating missing data, changing temporal thresholds or product copy, altering representative-code/family logic, modifying scoring/daily metrics/hazards/recommendations, or touching UI/integration files beyond tests.

Do not commit and do not push.
