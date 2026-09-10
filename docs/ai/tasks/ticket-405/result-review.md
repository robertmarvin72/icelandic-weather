# Ticket 405 — Result review

## Jonesy review — Round 1 (CC búinn)

**Verdict: PASS**

### Scope verification (file-level)

Recursive/non-recursive `device_list_dir` sweep of `src/lib`, `src/hooks`, `src/config` confirms exactly six new files, all with fresh mtimes at implementation time, and zero mtime drift on any pre-existing file I checked (`scoring.js`, `forecastCache.js`, `forecastNormalize.js`, `weatherPresentation.js`, `useForecast.js`, `useForecast.scoringInvariance.test.js`, `hazards.js`, `dailyWeatherSummary.js`, `dailyWeatherSummary.temporal.test.js`). No existing production module was touched, matching the report's claimed scope-restricted `git status` and the approved prompt's "no changes to existing scoring/data/UI" requirement.

New files: `weatherVoiceTypes.js`, `weatherVoiceRules.js`, `weatherVoiceEngine.js`, `weatherVoiceTypes.test.js`, `weatherVoiceRules.test.js`, `weatherVoiceEngine.test.js`.

### Implementation verification (content-level, read in full)

- **`weatherVoiceTypes.js`** — JSDoc-only (`export {}`, no runtime exports). `WeatherVoiceCondition` declares exactly the nine condition strings in table order. `TjaldurMood` declares exactly the twelve mood strings, with `neutral`/`nervous`/`amazed`/`sleeping` explicitly documented as reserved/Phase-1-unreachable. `WeatherVoiceInput`/result typedefs match the approved four-field contract and discriminated-union shape.
- **`weatherVoiceRules.js`** — `WIND_SUN_MS=5`, `WIND_STRONG_MS=10`, `WIND_EXTREME_MS=15`, `TEMP_COLD_MAX_C=6`, `TEMP_GOOD_MIN_C=12`, `TEMP_EXCELLENT_MIN_C=14`, `RAIN_NEGLIGIBLE_MM=1` — all match the winter bands in `scoring.js` I independently verified during prompt review. `RAIN_HEAVY_MM = HAZARDS_V1.rainWarn` is a direct import, not a copied literal — confirmed by reading the import statement and the assignment. `hasLiquidEvidence`/`hasDryEvidence`/`isClearFamily` are built on `getWeatherCodeFamily`/`WEATHER_FAMILIES` imported from `weatherPresentation.js`, no WMO table duplicated.
- **`weatherVoiceEngine.js`** — `evaluateWeatherVoice` implements the nine-row table in exactly the approved priority order, first-match-wins, `Object.freeze()`'d on every return path (silent and active), strict `isValidInput` (finite tmax; finite nonnegative windMax/rain; `isSupportedWeatherCode(code)`), no rounding applied anywhere in the comparisons, and destructures only `{tmax, windMax, rain, code}` from input so unrelated fields are structurally ignored rather than merely unused.
- **`weatherPresentation.js`** (unchanged, re-read to verify the dependency) — confirms `WEATHER_FAMILIES.RAIN = [61,63,65,80,81,82]`, `DRIZZLE = [51,53,55]`, `CLEAR = [0,1]`, `PARTLY_CLOUDY = [2]`, `OVERCAST = [3]`, `FOG = [45,48]`, `FREEZING_PRECIP = [56,57,66,67]`, `SNOW = [71,73,75,77,85,86]`, `THUNDER_HAIL = [95,96,99]`, and that `isSupportedWeatherCode`/`getWeatherCodeFamily` are real exports with those exact names. Every family assumption baked into the rules/tests matches this table exactly.

### Test verification (content-level, read in full, hand-traced independently — not trusting the report's narrative)

Hand-traced ~35 individual assertions across all three test files directly against `evaluateWeatherVoice`'s actual branch order, not the report's description of it. Specifically confirmed:

- Every boundary pair resolves exactly where the `>` vs `>=` operators in the engine say it should (wind 5/5.1, 10/10.1, 15/15.1; temp 6/12/14; rain 1/12mm) — including the two cases where a strictly-greater rule sits directly above a plain rule in priority (e.g. 10.0 falls through to `sun_wind`, 10.1 hits `strong_wind`).
- The no-rounding proof (`windMax:15.02`, `rain:11.999`) is genuine: `scoring.js`'s `round1()` would flip both outcomes, so this is a real regression guard against someone later reusing scoring's rounding by habit, not a redundant assertion.
- All seven priority-overlap fixtures resolve to the correct winner by walking the engine's actual `if` sequence, including the least obvious one (clear sky + 5mm "rain" at tmax16 → silent, because `excellent`/`good` both require `rain < 1` and no liquid-gated rule can fire on a CLEAR code).
- WMO family exclusions (snow/freezing-precip/thunder/fog barred from `good`/`excellent` even at warm/calm/dry-looking inputs) are correct given the family table above.
- The "real normalizer fixture" test is genuine, not decorative: I independently traced `normalizeDailyToScoreInput` from `forecastNormalize.js` (re-read in full, unchanged mtime) for both the hourly-weighted case (`windspeed_10m:[1,1]` at hours 0/12 → time-weighted `windMax=1.0`) and the `hourly:null` fallback case (`windMax` falls back to `windspeed_10m_max[0]=2` via the `??` chain) — both independently reproduce the exact values the test asserts (`dailyFallbackRow.windMax === 2`, both rows evaluating to `excellent`).
- Invalid-input tests correctly cover the full `isValidInput` surface: missing object, missing individual fields, null/undefined fields, string/boolean/NaN/Infinity coercion attempts, unsupported/null code, negative wind/rain (rejected) versus negative tmax (valid, correctly reaches `cold`).
- Purity tests (frozen-input non-mutation, determinism, extra-field ignoring, `scoreSiteDay` before/after invariance) match the engine's actual implementation — no mutation, no shared state, no call into `scoring.js`.
- `weatherVoiceTypes.test.js` performs a genuine source-text check (regex against the JSDoc typedef literal, asserting exact 12/9 quoted-string counts) rather than importing a mood list to iterate over — this is exactly the "source review, not a runtime registry" approach the approved prompt required, and correctly avoids the loophole flagged in Round 1.
- `weatherVoiceRules.test.js`'s heavy-rain provenance test asserts `RAIN_HEAVY_MM === HAZARDS_V1.rainWarn` via direct import comparison (both imported from `../config/hazards`), not a hardcoded duplicate — a real regression guard if the hazard constant ever changes.

All three describe blocks' total test count sums to 60, matching the report's claim, with no filler or rubber-stamp assertions found.

### Conclusion

Implementation and tests match `approved-prompt-v1.md` exactly: nine conditions in the correct priority order, twelve-mood JSDoc contract with four moods correctly reserved, strict validation, no rounding, no mutation, no existing module touched, no scope creep into normalization/hooks/UI. No issues found. No misses to disclose this round.

## Ripley — Final assessment (2026-09-10)

**Verdict: PASS**

Read the approved prompt, CC report, Jonesy review, all three implementation modules and their tests. Independently checked the nine predicates, first-match priority, exact mood/severity mapping, complete twelve-mood declaration, invalid-data silence, unrounded comparisons, canonical family/threshold imports and absence of shared mutable results. The implementation satisfies the approved Phase 1 scope. No blocking finding or required implementation revision.

### Independent verification

- `node node_modules/vitest/vitest.mjs run src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/lib/weatherVoiceTypes.test.js src/lib/scoring.test.js src/lib/scoring.rainStreak.test.js src/lib/weatherPresentation.test.js src/lib/dailyWeatherSummary.test.js src/lib/dailyWeatherSummary.temporal.test.js src/hooks/useForecast.scoringInvariance.test.js` — **9 files, 246 tests passed**. The first sandboxed attempt failed during esbuild configuration loading with directory access denied, before tests ran; the same command succeeded with approved elevated access.
- `node node_modules/eslint/bin/eslint.js src/lib/weatherVoiceTypes.js src/lib/weatherVoiceRules.js src/lib/weatherVoiceEngine.js src/lib/weatherVoiceTypes.test.js src/lib/weatherVoiceRules.test.js src/lib/weatherVoiceEngine.test.js` — exit 0.
- `git diff --check` — passed, with an informational LF/CRLF notice. `git status --short` and `git diff --name-only` show only the new six Weather Voice files, ticket workflow documents and CURRENT; no existing production file changes. Search of other source files found no Weather Voice consumer wiring.

Full-project lint, the 1218-test full suite and production build remain **CC-reported validation**, not independently rerun by Ripley. Repeating those broader checks was unnecessary for these isolated, currently unconsumed modules after the targeted and regression suites passed.

Minor report correction: the new suites contain **44 engine tests, 11 rules tests and 5 types tests**, totaling 60. CC's 42/13/5 split is inaccurate; the total and independent pass result are correct. This is a reporting discrepancy, not a missing behavior or blocker.

### Limits and handoff

The reviewed daily-input policy and strict four-field requirement remain intentional limits. No current-hour claim, UI, assets, comments or analytics are delivered by #405. Existing normalization's missing-hourly-value defaults are not repaired here. The engine must receive raw daily `code`, not presentation `summaryCode`, when a later ticket integrates it.

Set CURRENT to CLOSED. No commit, push or GitHub issue closure performed; those remain Róbert's subsequent actions under the workflow.
