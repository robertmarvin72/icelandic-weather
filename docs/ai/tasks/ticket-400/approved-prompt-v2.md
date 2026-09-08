# Approved Prompt v2 — Ticket 400 null-code regression

Apply only the narrow Revision 2 correction identified by Jonesy and confirmed by Ripley after Ticket 400's first implementation. Preserve the complete Revision 1 implementation and audit history except for the exact guard/test/report additions authorized below.

## Required workflow preflight

1. Read `docs/ai/README.md`, `docs/ai/CURRENT.md`, this prompt, the existing `cc-report.md`, and `result-review.md` in full.
2. Verify `CURRENT.md` names `ticket-400`, references this `approved-prompt-v2.md`, and is `READY_FOR_CC`.
3. Set `CURRENT.md` to `CC_IN_PROGRESS` before editing.
4. Do not alter or overwrite `approved-prompt-v1.md`, `approved-prompt-v2.md`, prompt-review history, prior CC-report text, or prior result-review text.

## Authorized production fix

In `src/lib/dailyWeatherSummary.js`, inside `parseValidObservations`, exclude a missing per-hour weather code before any numeric coercion:

```js
const rawCode = codes ? codes[i] : null;
if (rawCode == null) continue;
const code = typeof rawCode === "number" ? rawCode : Number(rawCode);
```

Keep the existing supported-code validation immediately afterward. `null` and `undefined` are unusable observations and must contribute no family vote; they must never become WMO `0` through `Number(null)`. Preserve existing handling of supported numeric/numeric-string values and malformed/unsupported codes.

Do not change family definitions, dominance, time window, tie-breaks, intensity selection, precipitation/storm overrides, fallback behavior, shared presentation mapping, integration, scoring, or any component behavior.

## Required regression test

Add a focused case to `src/lib/dailyWeatherSummary.test.js` that places at least one literal `null` entry inside `hourly.weathercode` during the primary window alongside an otherwise non-clear dominant family such as overcast.

The test must prove the null observation is ignored rather than counted as clear sky and that the resulting summary remains the expected non-clear WMO code. Include the `hourly.weather_code` alias too, either in the same parameterized test or a second compact case, so both accepted arrays enforce the same missing-value rule.

Do not weaken existing tests. No other production or test file is authorized unless the preflight proves the same helper contract cannot be tested through this file; if so, STOP and report rather than broadening scope.

## Validation

Run and record exact results for:

- `src/lib/dailyWeatherSummary.test.js`;
- the five-file Ticket 400 targeted set: `dailyWeatherSummary.test.js`, `weatherPresentation.test.js`, `useForecast.scoringInvariance.test.js`, `ForecastTable.weatherPresentation.test.jsx`, and `HourlyForecastModal.test.jsx`;
- the full Vitest suite;
- `npm run lint`;
- `npm run build`;
- `git diff --check`.

Append a clearly labeled **Revision 2** section to the existing `docs/ai/tasks/ticket-400/cc-report.md`. Preserve all Revision 1 report text. Record the exact code/test changes, commands and results, deviations, remaining risks, and confirm no unrelated file changed during Revision 2.

Finally keep/populate the canonical CC report path in `CURRENT.md` and set the stage to `CC_COMPLETE`.

Do not commit. Do not push.
