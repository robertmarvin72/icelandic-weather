# Ticket 405 — Approved implementation prompt v1

Approved by Jonesy in Round 2; consolidates Ripley v1 with the approved v2 revisions.

Execution requires Róbert's `Prompt approved` instruction and CURRENT.md at READY_FOR_CC.

Issue: #405 — Weather Voice Phase 1: Condition taxonomy og deterministic rule engine.
Parent: #404 — Weather Voice. Parent UI, comments, CTA and analytics requirements are outside this child ticket.

### Pre-design audit findings

- `src/lib/scoring.js` is season-dependent. The ticket's temperature bands (>14, >=12, >=8, >=6) and wind bands (<=5, <=10, <=15) describe the current winter branch, not summer. Summer temperature boundaries are 15/12/9/7/5/3/0; summer wind boundaries are 7/10/13/16. `scoreSiteDay` rounds numeric inputs to one decimal before applying scoring. Do not restore old scoring or describe ticket bands as universal current scoring.
- `rainPenaltyPoints` uses <1 / <4 / >=4 mm; `isWetDay` defaults to >=3 mm. `HAZARDS_V1` separately uses rainWarn=12/rainHigh=20 and windWarn=14/windHigh=18. `src/utils/precipitation.js` has additional contextual presentation labels. These are different purposes, not one interchangeable classification.
- `forecastCache.js` requests wind in m/s. `normalizeDailyToScoreInput` returns `tmax`, `tmin`, `windMax`, `windGust`, `rain`, `code`, date and timing fields. With hourly data, wind/gust maxima and accumulated precipitation are time-weighted; with no hourly data they fall back to provider daily values. `rain` is precipitation, not guaranteed liquid rain. Normalization also contains zero defaults for missing hourly samples; this ticket must not repair or silently reinterpret those upstream defaults.
- `useForecast` scores the normalized row first, then attaches `summaryCode` and `summaryTextKey`. Raw `code` remains provider daily WMO code. #400/#402 deliberately keep presentation summaries out of scoring. `summaryCode` may represent a brief precipitation episode; it is not a promise of continuous weather or simultaneous sun/wind.
- `weatherPresentation.js` exports canonical WMO validation and family helpers. CLEAR is codes 0/1; code 2 is partly cloudy. No arbitrary `sunny` boolean is needed. #402's temporal rules must remain intact.
- No Weather Voice implementation or Tjaldur-named asset files were found by the initial tracked-file search. The issue supplies the 12-mood contract; do not claim asset-path verification or add assets in this ticket.
- UI entrypoint check: none is added in #405 by explicit scope. A pure exported engine is the deliverable; integration belongs to a later ticket.

### Objective and required pre-edit audit

You are Claude Code, implementing only the Jonesy-approved version of this prompt after Róbert says `Prompt approved` and CURRENT is READY_FOR_CC. Follow all required CURRENT transitions. Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md, issues #405/#404, and the approved prompt. Preserve unrelated owner changes; no commit or push.

Before code edits, read the complete current implementations and relevant tests for scoring, forecastNormalize, forecastCache, useForecast, weatherPresentation, dailyWeatherSummary, precipitation labels, hazards, and the daily/hourly forecast consumers. Consult #400/#402 reports when needed to understand the established presentation boundary. Record the actual input flow, units, weighting, rounding, raw-versus-summary distinction, seasonal bands and precipitation classifications in `cc-report.md` before implementing. Confirm this audit still supports the reviewed design below. Do not modify any of those existing production modules.

### Approved design

These are the reviewed Weather Voice policy choices, not claims that a universal canonical classifier already exists. Differences from summer scoring, the daily-input scope and the heavy-rain definition are intentional. CC must not invent replacements; follow the STOP conditions below.

Use `src/lib/weatherVoiceRules.js`, `weatherVoiceEngine.js`, `weatherVoiceTypes.js` and colocated `.test.js` files, following the existing flat pure-library pattern. Use ordinary JavaScript and JSDoc typedefs for the typed contract, not TypeScript syntax or new .ts/.tsx files. No explicit extensions in imports; no libraries.

Export a pure `evaluateWeatherVoice(input)` accepting one normalized daily row's `{ tmax, windMax, rain, code }` subset. Document tmax in Celsius, windMax in m/s, rain as normalized effective daily precipitation in mm, and code as raw provider daily WMO code. Ignore unrelated row fields, including points, season, tier, summaryCode and summaryTextKey. Do not accept multiple aliases or choose among conflicting weather-code fields. Do not fetch, normalize, select dates/sites, aggregate hourly samples or wire the engine into a hook/UI. This daily interpretation is not suitable for current-hour claims; later surface integration must review that distinction explicitly.

Validate strictly: finite numeric tmax/windMax/rain, windMax/rain nonnegative, and a supported numeric WMO code. Missing/malformed input returns exactly `{ show: false }`; no coercion of null, strings, booleans, NaN or Infinity to real conditions. For MVP require the whole four-field input even for wind rules; document the conservative suppression with incomplete data. Do not round the supplied values; these comparisons use the unrounded normalized input. Scoring's one-decimal quantization remains its own existing behavior.

Use canonical `getWeatherCodeFamily`, `isSupportedWeatherCode` and `WEATHER_FAMILIES` without copying the WMO table. Liquid-family evidence means RAIN or DRIZZLE. Dry-family evidence means CLEAR, PARTLY_CLOUDY or OVERCAST. Snow/freezing precipitation/thunder-hail/fog/unknown cannot qualify as good/excellent. Never call snow accumulation liquid rain.

Evaluate in precisely this order and return only the first match:

| Condition | Predicate | Mood | Severity |
| --- | --- | --- | --- |
| extreme_wind | windMax > 15 | wrecked | 3 |
| heavy_rain | liquid-family evidence and rain >= 12 | sad | 2 |
| strong_wind | windMax > 10 | struggling | 2 |
| cold_wet | tmax < 6, liquid-family evidence and rain >= 1 | unimpressed | 2 |
| cold | tmax < 6 | freezing | 1 |
| rain | liquid-family evidence and rain >= 1 | unimpressed | 1 |
| sun_wind | CLEAR family, windMax > 5, rain < 1 | suspicious | 1 |
| excellent | CLEAR family, tmax > 14, windMax <= 5, rain < 1 | excellent | 0 |
| good | dry-family evidence, tmax >= 12, windMax <= 5, rain < 1 | happy | 0 |

Otherwise return exactly `{ show: false }`. Matching predicates may overlap; priority resolves them. `sun_wind` describes a daily combination only, not proof of simultaneous hourly sunshine and wind. The 8°C / 4 m/s / overcast / zero-precipitation example must be silent.

Policy provenance: wind 5/10/15 and cold <6 retain the ticket's explicit voice bands, also present in winter scoring; they are intentionally season-independent expressive thresholds, not a new scoring system or hazard warning. Good >=12 and excellent >14 similarly use the ticket's warmth bands. Dry/rain boundary 1 mm follows the negligible-precipitation scoring boundary; heavy rain uses the existing 12 mm hazard warning amount, not the 4 mm scoring penalty ceiling or WMO intensity alone. Import the existing hazard constant for the 12 mm threshold; document that it is applied to the normalized amount, and does not replace hazard evaluation. WMO intensity alone must not make one brief heavy observation an all-day heavy-rain assessment. All conjunctions and severity mappings are explicit new Weather Voice policy. Document them beside named rules/constants. Do not call scoring to manufacture classifications, copy seasonal scoring tables, or export these voice rules as shared weather classification.

### Contract and purity

JSDoc must define the nine exact condition strings from the table, all twelve mood strings (`happy`, `excellent`, `neutral`, `suspicious`, `nervous`, `struggling`, `sad`, `freezing`, `unimpressed`, `wrecked`, `amazed`, `sleeping`), and the discriminated result: `{ show: false }` or `{ show: true, condition, mood, severity }`. Severity is a fixed integer 0–3 expressing voice intensity only; 0 is positive, 1 mild, 2 pronounced, 3 extreme. It never changes points, warnings, recommendations or entitlement. No ordinary condition, no randomization, clock dependency, storage, user-specific logic, actual comment text, translations, LLM/API calls, asset rendering or side effects. Do not mutate input or expose shared mutable result state between calls.

`neutral`, `nervous`, `amazed`, and `sleeping` are reserved vocabulary for later phases. They must be present in the twelve-mood JSDoc contract but are not reachable engine outputs in Phase 1. Supporting the full vocabulary does not require a rule for each mood.

### Targeted tests and validation

- Cover all nine conditions, their exact mapped mood/severity, and the exact silent result. Runtime engine tests must cover the eight reachable Phase 1 moods: `wrecked`, `sad`, `struggling`, `unimpressed`, `freezing`, `suspicious`, `excellent`, and `happy`. Test `cold_wet` and `rain` separately even though both map to `unimpressed`. Verify by source review that the JSDoc `TjaldurMood` typedef declares all twelve exact strings specified under Contract and purity. Do not require runtime outputs or fixtures for the four reserved moods, and do not add rules or a runtime vocabulary registry solely to make them testable.
- Boundary pairs 5/5.1, 10/10.1, 15/15.1 m/s; just below/at/above 6°C, 12°C, 14°C; precipitation just below/at/above 1 and 12 mm. Include higher-precision numbers to prove the documented lack of score-style rounding.
- Priority fixtures: extreme wind + rain; strong wind + cold; cold + rain; excellent warmth + strong wind; sun + strong wind; heavy rain + strong wind; cold_wet versus cold/rain; excellent versus good. Explicitly test 4°C/17 m/s/rain -> extreme_wind, wrecked, 3.
- Ordinary 8°C/4 m/s/overcast/dry -> show:false. Ensure every rule is reachable with a valid fixture and uncovered moderate conditions stay silent.
- WMO 0 and 1 versus 2; supported rain and drizzle; snow/freezing/thunder/fog with warm-looking inputs must not produce good/excellent. Heavy WMO code with <1 mm must not produce heavy_rain. Amount alone with snow must not trigger rain conditions. Supported but inconsistent code/amount fixtures must follow the table conservatively.
- Missing object/fields, null, undefined, strings, booleans, non-finite values, unsupported codes, negative wind/rain. Negative temperatures are valid. Do not assume unknown code means sunny.
- Deep-frozen input and repeated calls prove no mutation/determinism. Extra tier/season/score/summary fields must not alter output. A fixture from the actual normalizer proves the four-field contract and weighted-vs-daily fallback semantics without changing normalization. Verify scoring results before/after evaluating the same row are identical.
- Run the new targeted Vitest suite and existing scoring, weatherPresentation, dailyWeatherSummary and useForecast scoring-invariance suites. Run lint on new JS files and `npm run build`. Report exact commands/results and distinguish existing failures from new ones. No browser/UI testing is required for this pure engine ticket.

### STOP conditions and scope boundaries

Stop and record the blocker before extending scope if the audit contradicts this reviewed input/threshold policy, if a canonical mapping cannot be reused without changing existing modules, or if the implementation requires shared forecast/scoring, normalization, recommendation, hazards, Free/Pro, entitlement, checkout, backend or UI edits. Do not repair neighboring weather bugs. Do not silently substitute summer bands, change heavy-rain thresholds, use summaryCode as raw code, introduce a sunny field, or add a second hourly adapter. Missing SVG files do not block declaring the issue's supplied mood vocabulary; do not invent asset paths. No work from the parent issue's later phases.

### Completion and handoff

The twelve-mood acceptance requirement is declaration completeness, verified by source review and recorded in the CC report. Runtime mood coverage applies to the eight reachable moods, with all nine conditions independently tested. No other acceptance criterion changes.

Acceptance requires the documented pre-edit audit, reviewed predicates with provenance, nine deterministic conditions, twelve-mood contract, at most one match, ordinary-weather silence, fixed severity, strict invalid-data behavior, passing targeted tests, and no changes to existing scoring/data/UI. Write the full audit, changed-file list, tests, limitations and any deviations to `docs/ai/tasks/ticket-405/cc-report.md`; populate CURRENT's CC report path and set CC_COMPLETE only after work and report are complete. Producing a report alone is not a handoff. No commit or push.
