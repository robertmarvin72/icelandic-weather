# CC Report — Ticket 405 (Weather Voice Phase 1: condition taxonomy and deterministic rule engine)

Executed against: `docs/ai/tasks/ticket-405/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS), approved by Jonesy Round 2 after resolving the mood-coverage contradiction found in Round 1.

## 1. Pre-edit audit — read and confirmed against live source before any code was written

Read `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, GitHub issues #405 and #404, the approved prompt, and the full prompt-review discussion (Ripley v1 → Jonesy Round 1 REVISE → Ripley v2 → Jonesy Round 2 APPROVED). Then read the complete current implementations this ticket's design depends on:

- **`src/lib/scoring.js`** — confirmed `basePointsFromTemp`'s winter bands (`t>14→10, t>=12→8, t>=8→5, t>=6→2, else 0`) and `windPenaltyPoints`'s winter bands (`<=5→0, <=10→2, <=15→5, else 10`) match the ticket's table exactly, and that summer uses genuinely different boundaries (temperature `15/12/9/7/5/3/0`, wind `7/10/13/16`). Confirmed `rainPenaltyPoints` (`<1→0, <4→2, else 5`) and `isWetDay`'s default `>=3mm` are different-purpose thresholds, not reused here. Confirmed `scoreSiteDay` applies `round1()` (rounds to one decimal) to `tmax`/`rain`/`windMax`/`windGust` before any scoring math — Weather Voice's own comparisons deliberately do **not** round, a documented divergence (§3 of the design, proven by dedicated tests in §5 below).
- **`src/config/hazards.js`** — confirmed `HAZARDS_V1.rainWarn = 12` (and `rainHigh: 20`, `windWarn: 14`, `windHigh: 18`) exactly. `RAIN_HEAVY_MM` imports `HAZARDS_V1.rainWarn` directly rather than copying the number.
- **`src/lib/forecastCache.js`** — confirmed `windspeed_unit: "ms"` in the Open-Meteo request params; wind genuinely arrives in m/s.
- **`src/lib/forecastNormalize.js`** — confirmed `normalizeDailyToScoreInput` returns `{ date, tmax, tmin, rain, windMax, windGust, windDir, code, precipStartHour, precipEndHour, precipDurationHours, precipActiveHours, precipTimingBucket, precipType }`; with hourly data, `windMax`/`windGust`/`rain` are time-weighted (`getTimeWeight`: 0.45 overnight, 0.75 morning/late, 1.0 midday, plus a 0.85 floor for severe gusts); with no hourly data (`hourly = null`), `getDayHourlyMetrics` returns `null` and the row falls back to the provider's raw daily fields (`windspeed_10m_max`, `windgusts_10m_max`, `precipitation_sum`) unweighted. `rain` is precipitation, not guaranteed to be liquid — confirmed via `precipType`'s own snow/rain disambiguation logic living entirely inside this module, untouched by this ticket.
- **`src/hooks/useForecast.js`** — confirmed `scoreSiteDay(row)` runs on the untouched normalized row, and `summarizeDailyWeather(...)`'s `summaryCode`/`summaryTextKey` are merged in only afterward (Ticket 400/402's established boundary). Weather Voice's `code` field must be the raw `row.code`, never `summaryCode`.
- **`src/lib/weatherPresentation.js`** — confirmed `WEATHER_FAMILIES.CLEAR = [0, 1]`, `PARTLY_CLOUDY = [2]`, `OVERCAST = [3]`, and the exported `getWeatherCodeFamily`/`isSupportedWeatherCode` helpers. No `sunny` boolean exists anywhere; none was introduced.
- **`src/lib/dailyWeatherSummary.js`** (already fully audited in this session's Tickets 400/401/402/Revisions 1–3) — confirmed its temporal-narrative rules are untouched by this ticket; Weather Voice never imports from it.
- **`src/utils/precipitation.js`** — confirmed `getPrecipitationLabel`'s contextual presentation labels are a distinct purpose (UI caption text) from Weather Voice's rule engine; not reused, not duplicated.
- Searched the full `src/` and `public/` trees recursively: no `weatherVoice*` or `Tjaldur`-named file existed before this ticket. No SVG/asset paths were invented or added — the issue's 12-mood vocabulary was declared as JSDoc only.

This audit fully supports the reviewed design; no contradiction was found, so no STOP condition was triggered.

## 2. Design implemented

Three new flat pure-library modules plus colocated tests, exactly as scoped — no existing production module was modified:

### `src/lib/weatherVoiceTypes.js`
JSDoc typedefs only (no runtime exports — `export {}`), per the project's `.jsx`/`.js`-with-JSDoc convention (no TypeScript syntax, no `.ts`/`.tsx` files). Declares:
- `WeatherVoiceCondition` — the nine exact condition strings.
- `TjaldurMood` — all twelve exact mood strings, with the four Phase-1-unreachable ones (`neutral`, `nervous`, `amazed`, `sleeping`) explicitly documented as reserved vocabulary for later phases.
- `WeatherVoiceInput` — the four-field `{ tmax, windMax, rain, code }` contract, documented with units and provenance.
- `WeatherVoiceSilentResult` / `WeatherVoiceActiveResult` / `WeatherVoiceResult` — the discriminated result shape.

### `src/lib/weatherVoiceRules.js`
Exported threshold constants and family-evidence predicates, each with its policy provenance documented immediately beside it:
- `WIND_SUN_MS = 5`, `WIND_STRONG_MS = 10`, `WIND_EXTREME_MS = 15` — reuse `scoring.js`'s winter `windPenaltyPoints` band edges exactly, documented as an intentional season-independent expressive-voice reuse, not a claim of universality (summer's bands, `7/10/13/16`, are explicitly different and not used here).
- `TEMP_COLD_MAX_C = 6`, `TEMP_GOOD_MIN_C = 12`, `TEMP_EXCELLENT_MIN_C = 14` — reuse `scoring.js`'s winter `basePointsFromTemp` band edges exactly, same rationale.
- `RAIN_NEGLIGIBLE_MM = 1` — reuses `scoring.js`'s own negligible-precipitation boundary (`rainPenaltyPoints`'s `<1 → 0` tier and `getPrecipTimingMultiplier`'s `<1 → 0` cutoff).
- `RAIN_HEAVY_MM = HAZARDS_V1.rainWarn` (12) — imports the existing hazard constant directly rather than copying the number or reusing scoring's 4mm penalty ceiling; documented as Weather Voice's own policy decision to align "heavy" with the hazard system's "meaningful rain" amount, applied only to the normalized daily amount, and not a replacement for hazard evaluation.
- `hasLiquidEvidence(code)` — RAIN or DRIZZLE family only, via `getWeatherCodeFamily` (no WMO list duplicated).
- `hasDryEvidence(code)` — CLEAR, PARTLY_CLOUDY, or OVERCAST family.
- `isClearFamily(code)` — CLEAR family only (codes 0/1), stricter than dry evidence — this is what makes `good` (dry-family, code 2/3 included) and `excellent`/`sun_wind` (CLEAR only) genuinely different gates.

### `src/lib/weatherVoiceEngine.js`
Exports the single pure function `evaluateWeatherVoice(input)`:
- **Validation**: requires the complete four-field input (`tmax`/`windMax`/`rain` finite numbers, `windMax`/`rain` non-negative, `code` a supported WMO number per `isSupportedWeatherCode`). Any missing/malformed field — including for rules that only read one or two fields, e.g. `extreme_wind` only needs `windMax` — returns exactly `{ show: false }` rather than partially evaluating. Negative temperatures are valid and pass validation.
- **No rounding**: reads `tmax`/`windMax`/`rain` exactly as given; never applies `scoring.js`'s one-decimal quantization.
- **Nine rules in fixed priority order**, returning the first match only, exactly as the approved table specifies (`extreme_wind → wrecked/3`, `heavy_rain → sad/2`, `strong_wind → struggling/2`, `cold_wet → unimpressed/2`, `cold → freezing/1`, `rain → unimpressed/1`, `sun_wind → suspicious/1`, `excellent → excellent/0`, `good → happy/0`).
- **Purity**: every returned object is a fresh `Object.freeze()`'d literal (the silent case too — `silent()` builds a new frozen object per call rather than sharing one constant reference, so no caller can ever observe or mutate shared state across calls); the input is only ever destructured, never assigned to or mutated.

## 3. Contract completeness (declaration vs. runtime reachability)

Per the approved v2 revision, the twelve-mood acceptance requirement is **declaration completeness**, verified by source review, not runtime reachability for all twelve. `weatherVoiceTypes.test.js` performs this "source review" as an automated text check against the JSDoc typedef's literal string union — reading the file's own source text and asserting the exact twelve mood strings and nine condition strings appear in their respective typedefs (and that the count is exactly 12/9, catching any accidental extra/missing entry) — rather than importing a runtime list to iterate over. No rule, mapping, or runtime vocabulary registry was added to make the four reserved moods (`neutral`, `nervous`, `amazed`, `sleeping`) reachable or "testable" — they remain declaration-only, exactly as the approved prompt requires ("do not add rules or a runtime vocabulary registry solely to make them testable").

Runtime coverage (`weatherVoiceEngine.test.js`) independently exercises all eight reachable Phase 1 moods (`wrecked`, `sad`, `struggling`, `unimpressed`, `freezing`, `suspicious`, `excellent`, `happy`), with `cold_wet` and `rain` tested as separate cases despite both mapping to `unimpressed` — so the shared mood cannot mask a missing per-condition test.

## 4. Files changed

**New (no existing file modified):**
- `src/lib/weatherVoiceTypes.js` + `weatherVoiceTypes.test.js` (5 tests)
- `src/lib/weatherVoiceRules.js` + `weatherVoiceRules.test.js` (13 tests)
- `src/lib/weatherVoiceEngine.js` + `weatherVoiceEngine.test.js` (42 tests)
- `docs/ai/tasks/ticket-405/cc-report.md` (this file)

**Modified:** `docs/ai/CURRENT.md` only (workflow pointer/stage).

**Confirmed untouched**: `src/lib/scoring.js`, `src/lib/forecastNormalize.js`, `src/lib/forecastCache.js`, `src/hooks/useForecast.js`, `src/lib/weatherPresentation.js`, `src/lib/dailyWeatherSummary.js`, `src/utils/precipitation.js`, `src/config/hazards.js`, every UI component, every backend route, entitlement/checkout/analytics code. No dependency added. No `.tsx`/TypeScript. No hook/UI wiring. Not committed. Not pushed.

## 5. Required tests — mapped to the approved prompt's "Targeted tests and validation"

All covered in `weatherVoiceEngine.test.js` unless noted:

1. **All nine conditions, exact mood/severity, exact silent result; eight reachable moods; `cold_wet`/`rain` tested separately** — `describe("all nine conditions...")`, 9 tests, one per condition, each asserting the complete `{show, condition, mood, severity}` object.
2. **Boundary pairs** (wind 5/5.1, 10/10.1, 15/15.1; temp 6/12/14; precip 1/12mm) **+ high-precision proof of no rounding** — `describe("boundary pairs...")`, 9 tests, including an explicit pair (`windMax: 15.02`, `rain: 11.999`) chosen so that `scoring.js`'s `round1()` would flip the result if mistakenly applied, directly proving the unrounded-comparison contract.
3. **Priority fixtures** (extreme wind+rain, strong wind+cold, cold+rain, excellent+strong wind, sun+strong wind, heavy rain+strong wind, cold_wet vs. cold/rain, excellent vs. good) **+ the explicit 4°C/17m/s/rain → extreme_wind/wrecked/3 case** — `describe("priority resolves overlapping conditions...")`, 7 tests (the explicit 4°C case is the first "nine conditions" test, reused/confirmed here too).
4. **Ordinary 8°C/4m/s/overcast/dry → show:false; every rule reachable; uncovered moderate conditions stay silent** — the exact issue example plus two additional silent moderate-condition fixtures (mild breezy non-clear day; negligible light rain under the 1mm floor). Every rule's reachability is independently confirmed by test category 1.
5. **WMO 0/1 vs. 2; rain and drizzle codes; snow/freezing/thunder/fog barred from good/excellent; heavy code with <1mm; amount-alone-with-snow; inconsistent code/amount fixtures follow the table conservatively** — `describe("WMO family boundaries")`, 7 tests covering each sub-case explicitly, including a dedicated "supported but internally inconsistent" fixture (clear-sky code with a real rain amount) proving the conservative silent outcome.
6. **Missing object/fields, null, undefined, strings, booleans, non-finite, unsupported codes, negative wind/rain; negative temperature valid; unknown code never assumed sunny** — `describe("strict invalid-input handling")`, 7 tests.
7. **Deep-frozen input + repeated calls prove no mutation/determinism; extra fields ignored; real-normalizer fixture proving the four-field contract and weighted-vs-daily fallback; scoring identical before/after** — `describe("purity, determinism, and ignoring unrelated fields")`, 4 tests. The normalizer fixture test calls the real `normalizeDailyToScoreInput` twice (once with hourly data present, once with `hourly: null`) and confirms `evaluateWeatherVoice` reads whichever value ended up in `windMax`/`rain` either way, with no special-casing of its own; it also asserts the row still carries normalizer-only fields (`precipStartHour`, `tmin`) that the engine genuinely ignores. The scoring-identity test calls `scoreSiteDay(row)` before and after `evaluateWeatherVoice(row)` on the same object and asserts byte-identical results.

Additional supporting coverage (not separately required but natural given the module split): `weatherVoiceRules.test.js` (13 tests) verifies each exported threshold's exact value and provenance (including `RAIN_HEAVY_MM === HAZARDS_V1.rainWarn` by direct import-comparison, not a hardcoded duplicate) and each family-evidence predicate in isolation from engine priority; `weatherVoiceTypes.test.js` (5 tests) verifies typedef declaration completeness as described in §3.

## 6. Validation — exact commands and results

1. `npx vitest run src/lib/weatherVoiceEngine.test.js src/lib/weatherVoiceRules.test.js src/lib/weatherVoiceTypes.test.js` → **3 files, 60 tests passed** (42 + 13 + 5).
2. `npx vitest run src/lib/scoring.test.js src/lib/scoring.rainStreak.test.js src/lib/weatherPresentation.test.js src/lib/dailyWeatherSummary.test.js src/lib/dailyWeatherSummary.temporal.test.js src/hooks/useForecast.scoringInvariance.test.js` → **6 files, 186 tests passed**, all pre-existing, none modified — confirms Weather Voice introduced zero regressions in scoring, presentation, daily-summary, or the scoring-invariance boundary.
3. `npx eslint src/lib/weatherVoiceTypes.js src/lib/weatherVoiceRules.js src/lib/weatherVoiceEngine.js src/lib/weatherVoiceTypes.test.js src/lib/weatherVoiceRules.test.js src/lib/weatherVoiceEngine.test.js` → exit 0, no output.
4. `npm run lint` (full project) → exit 0, no output.
5. `npm test -- --run` (full suite) → **100 files, 1218 tests passed** (up from 97 files/1158 tests before this ticket — +3 files, +60 tests, exactly matching §5's count; zero pre-existing failures, so nothing to distinguish as "existing vs. new").
6. `npm run build` → succeeded (`✓ built in 7.35s`). Bundle size is essentially unchanged from the pre-ticket build — expected and correct, since nothing imports the new modules yet (no hook/UI wiring is in this ticket's scope), so Vite's tree-shaking excludes them entirely from the shipped bundle.
7. `git diff --check` → exit 0 (only a pre-existing informational LF→CRLF notice on `docs/ai/CURRENT.md`). `git status --short` scope inspection: only the six new `weatherVoice*` files, the new `docs/ai/tasks/ticket-405/` directory, and `docs/ai/CURRENT.md` — no existing production module, UI, scoring, hazards, or backend file appears in the diff.

No browser/UI testing was performed — correctly out of scope for this pure-engine ticket (no UI entrypoint exists yet; explicitly noted in the pre-design audit).

## 7. STOP conditions — none triggered

The audit did not contradict the reviewed input/threshold policy; every canonical mapping (`getWeatherCodeFamily`, `isSupportedWeatherCode`, `WEATHER_FAMILIES`, `HAZARDS_V1.rainWarn`) was reused by direct import with no changes to its source module; no shared forecast/scoring/normalization/recommendation/hazards/Free-Pro/entitlement/checkout/backend/UI file needed editing. No neighboring weather bug was repaired. No summer bands were substituted for the ticket's bands. `summaryCode` was never used as raw `code`. No `sunny` field was introduced. No second hourly adapter was added — the engine takes only the already-normalized four-field row. No SVG/asset path was invented despite none existing. Nothing from parent issue #404's later phases (UI, comment text, CTA, GA4 events, English content, sharing, admin) was implemented.

## 8. Deviations and limitations

None. The implementation follows the approved v1 prompt (incorporating the v2 mood-coverage revision) exactly as reviewed — no design choice was substituted, no threshold was altered, and no additional scope was added. The only judgment calls made were internal to test design (exact fixture values for boundary/priority proofs) and are documented inline in the test file's comments and in §5 above.

## 9. Confirmation

`docs/ai/CURRENT.md` updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**
