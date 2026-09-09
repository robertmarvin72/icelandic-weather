# Approved Corrective Implementation Prompt — Ticket 402 (v3)

## Context and verdict

Revision 2 correctly prevents gaps from fabricating continuous duration, but its conflicting-duplicate policy is still input-order-dependent.

`buildChronologicalRuns` sorts only by hour. For equal-hour wet/dry conflicts, stable sort preserves source order: the first observation becomes or remains the active run and the later conflicting duplicate is dropped. Reversing the two same-hour observations can therefore change whether a temporal narrative is returned. This does not satisfy v2's requirement that duplicate timestamps be handled conservatively and deterministically, nor the original order-independence contract.

Execute only the narrow duplicate-hour normalization below. Preserve the Revision 1 implementation and Revision 2 gap-continuity correction unchanged.

## Required correction

1. Normalize valid observations by hour **before** constructing chronological wet/dry runs.
   - Group all observations for the same hour independent of input order.
   - If a group contains both wet and dry classifications, mark the hour ambiguous and make temporal-pattern detection return `null` for that day. Do not let either observation win by array order and do not interpolate around it.
   - Same-classification duplicates count as one hour of duration and one chronological observation for temporal significance; they must not turn one light-rain hour into the existing two-observation significance threshold.
   - When same-classification duplicates differ in code/amount, normalize them deterministically using existing family precedence/intensity semantics and a documented conservative finite-amount rule. Do not add or duplicate a WMO mapping.

2. Keep the corrected one-hour-contiguity rule, six-hour dry threshold, three-hour brief threshold, hazard bypass, primary window, fallback, representative-code contract, UI integration, copy, and scoring boundary unchanged.

3. Extend `src/lib/dailyWeatherSummary.temporal.test.js` with discriminating coverage:
   - the same conflicting wet/dry duplicate-hour fixture in both input orders returns the identical result;
   - either order suppresses temporal narrative (`textKey: null`) because the hour is ambiguous;
   - same-classification duplicates in either order do not extend run duration;
   - two duplicate light-rain rows for one hour do not qualify as two distinct observations;
   - reordered non-duplicate fixtures and all Revision 2 sparse/gap tests remain green.

4. Only `src/lib/dailyWeatherSummary.js`, `src/lib/dailyWeatherSummary.temporal.test.js`, the CC report, and workflow pointer may change. STOP if another production/UI/scoring/translation/provider file is required.

5. Append a clearly labeled Revision 3 section to `docs/ai/tasks/ticket-402/cc-report.md` documenting the order-dependent v2 behavior, normalization policy, red→green proof, exact tests, and validation.

## Acceptance criteria

- Reversing equal-hour observations cannot change the temporal result.
- Any same-hour wet/dry conflict conservatively disables the temporal narrative.
- Duplicate rows never add covered duration or distinct-hour significance evidence.
- Revision 2's missing-hour fix and the full-resolution motivating fixture remain correct.
- All Ticket 400/402 compatibility, UI, bilingual copy, metrics, hazards, and scoring behavior remain unchanged.

## Validation

Run:

1. both daily-summary test files;
2. ForecastTable temporal/presentation tests, scoring-invariance tests, and HourlyForecastModal tests;
3. full Vitest suite;
4. lint, build, and `git diff --check`;
5. Revision-3-only scope inspection.

Include a red→green proof that reversing the conflicting duplicate order produces different results under Revision 2 and identical conservative results after Revision 3. No browser rerun is required unless a UI file changes.

## STOP conditions

STOP if this requires changing temporal product rules beyond duplicate normalization, changing representative WMO mappings globally, modifying UI/copy/scoring/daily metrics/provider data, or touching any production file other than `dailyWeatherSummary.js`.

Do not commit and do not push.
