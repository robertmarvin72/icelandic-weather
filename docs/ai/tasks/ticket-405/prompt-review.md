# Ticket 405 — Prompt Review

## Ripley — Initial prompt (v1)

Status: discussion material for Jonesy; NOT an execution authorization.

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

### Proposed v1 design — explicit Jonesy review required

These are proposed Weather Voice policy choices for this review round, not claims that a universal canonical classifier already exists. Jonesy must specifically assess the differences from summer scoring, the daily-input scope, and the heavy-rain definition. If they cannot be approved, return REVISE with the unresolved decisions; CC must not invent replacements.

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

### Targeted tests and validation

- Cover every condition, exact mood/severity and exact silent result. Exercise all 12 moods in the declared vocabulary without inventing rules to use every mood.
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

Acceptance requires the documented pre-edit audit, reviewed predicates with provenance, nine deterministic conditions, twelve-mood contract, at most one match, ordinary-weather silence, fixed severity, strict invalid-data behavior, passing targeted tests, and no changes to existing scoring/data/UI. Write the full audit, changed-file list, tests, limitations and any deviations to `docs/ai/tasks/ticket-405/cc-report.md`; populate CURRENT's CC report path and set CC_COMPLETE only after work and report are complete. Producing a report alone is not a handoff. No commit or push.

## Jonesy — Review pending

Review the proposed policy explicitly, especially the stale ticket bands, season-independent voice thresholds, normalized daily input, strict missing-data behavior, liquid-family checks and 12 mm heavy-rain amount. Return APPROVED or REVISE. Do not implement.

## Jonesy review — Round 1 (Initial prompt tilbúið)

**Verdict: REVISE**

### The blocking issue: an unsatisfiable test requirement

Required Tests, first bullet: "Cover every condition, exact mood/severity and exact silent result. **Exercise all 12 moods in the declared vocabulary without inventing rules to use every mood.**"

I worked through the 9-row rule table by hand to see which moods it can actually produce:

| Condition | Mood |
| --- | --- |
| extreme_wind | wrecked |
| heavy_rain | sad |
| strong_wind | struggling |
| cold_wet | unimpressed |
| cold | freezing |
| rain | unimpressed |
| sun_wind | suspicious |
| excellent | excellent |
| good | happy |

That's **8 distinct moods** (`unimpressed` is shared by `cold_wet` and `rain`). The twelve-mood JSDoc vocabulary (line 58) also includes `neutral`, `nervous`, `amazed`, `sleeping` — none of which any of the 9 rules can ever return. Since `evaluateWeatherVoice`'s entire output is determined by which row matches (or `{ show: false }`), there is no fixture, however constructed, that can make it return `neutral`/`nervous`/`amazed`/`sleeping` — doing so would require a 10th rule, which the same sentence explicitly forbids ("without inventing rules to use every mood").

This is a direct, unsatisfiable contradiction inside one requirement, not a stylistic nitpick — CC cannot write a passing test suite against this instruction as written. I don't think it's a sign the architecture is wrong; it reads like the "exercise all 12 moods" line was written against an earlier or larger mood set (or was meant as "the JSDoc type must declare the full 12-string vocabulary for future phases," not "the engine must be shown to return all 12 now") and wasn't reconciled with the final 9-row table. Ripley should pick one and say so explicitly:

- Scope the mood-coverage test requirement down to the 8 moods the Phase 1 table actually reaches, and note in the prompt that `neutral`/`nervous`/`amazed`/`sleeping` are reserved vocabulary for later phases, not required Phase 1 coverage; or
- If some of those 4 moods are meant to be reachable in Phase 1, say which rule(s) should produce them and add the row(s) to the table (which would need its own review pass).

Either is fine with me — I just need the contradiction resolved before CC starts, since "cover every mood" is stated as a hard acceptance/test requirement and CC has no authority to relax or reinterpret it unilaterally.

### Everything else checked out against live source

I verified every numeric/behavioral claim in the pre-design audit directly, not just trusted the write-up:

- `src/lib/scoring.js`: winter `basePointsFromTemp` bands (`>14→10, >=12→8, >=8→5, >=6→2`) and winter `windPenaltyPoints` bands (`<=5→0, <=10→2, <=15→5`) match the ticket's bands exactly — confirming these *are* today's winter behavior, not a fabricated baseline. Summer bands are genuinely different: temperature boundaries `15/12/9/7/5/3/0`, wind boundaries `7/10/13/16` — exactly as the audit states, and correctly flagged as distinct from what the ticket's table happens to reuse. `rainPenaltyPoints` (`<1→0, <4→2, else 5`) and `isWetDay`'s default `>=3mm` also match exactly. `round1()` is genuinely applied to `tmax`/`rain`/`windMax`/`windGust` inside `scoreSiteDay` before any scoring math — confirming the audit's rounding claim and, in turn, the design's explicit choice *not* to round Weather Voice's own comparisons (a real, documented divergence, not an oversight).
- `src/config/hazards.js`: confirmed `rainWarn: 12, rainHigh: 20, windWarn: 14, windHigh: 18` exactly — the design's reuse of the 12mm hazard constant for `heavy_rain` (rather than scoring's 4mm penalty ceiling) is grounded in a real, correctly-cited constant.
- `src/lib/forecastCache.js`: confirmed `windspeed_unit: "ms"` — wind genuinely arrives in m/s, matching the documented input contract.
- Re-confirmed (from this session's own extensive #402 work) `forecastNormalize.js`'s output shape, its hourly-weighted-with-daily-fallback behavior, and its zero-defaults for missing hourly samples; `useForecast.js`'s `scoreSiteDay(row)` still runs before any presentation field is attached; `weatherPresentation.js`'s `CLEAR = [0,1]`, `PARTLY_CLOUDY = [2]`, and its exported family/validation helpers — all as the audit describes.
- Searched the full `src/` tree (recursive listing) and `public/` for any existing `weatherVoice*`/`Tjaldur`-named file: none exist. The "no prior implementation, no assets" claim is genuinely true, not an assumption.

### The rule table itself is sound

I hand-traced representative fixtures through all 9 rows in priority order (extreme+cold+rain combos, the explicit 4°C/17m/s/rain → extreme_wind case, the explicit 8°C/4m/s/overcast/dry → silent case, a partly-cloudy warm-calm-dry day, a warm "sunny-looking" snow-coded day) and confirmed: every one of the 9 conditions is genuinely reachable by some valid input (no dead rule); the silent 8°C/overcast/dry example is genuinely silent under the table as written; snow/fog/freezing-precip codes can never satisfy `good`/`excellent` (both require `CLEAR`/dry-family membership, which excludes them) or any liquid-gated rule (both require RAIN/DRIZZLE specifically); and priority ordering correctly lets `extreme_wind`/`heavy_rain` override an otherwise-mild-looking day. This part of the design is internally consistent and matches its own stated provenance.

### Once the mood-coverage contradiction is resolved

Nothing else here needs rework — the architecture (pure standalone module, no hook/UI wiring, no scoring/hazard/entitlement touch, explicit STOP conditions), the strict-validation contract, and the provenance documentation are all sound and ready to implement.

## Ripley — Revised prompt (v2)

Status: discussion material for Jonesy; NOT an execution authorization.

### Response to Jonesy Round 1

Agreed. The first test bullet conflated the full declared mood vocabulary with reachable Phase 1 engine outputs. The nine conditions produce eight distinct moods. No rule or mapping needs to change.

### Authoritative v2 revision

The initial v1 prompt remains the proposed implementation specification, with the following explicit replacements/additions. This section supersedes the conflicting v1 test sentence; all other requirements, predicates, priority, mappings, severity, scope and STOP conditions remain unchanged. When approved, the standalone approved prompt must incorporate these revisions and omit the superseded wording and review discussion.

Replace the first bullet under **Targeted tests and validation** with:

- Cover all nine conditions, their exact mapped mood/severity, and the exact silent result. Runtime engine tests must cover the eight reachable Phase 1 moods: `wrecked`, `sad`, `struggling`, `unimpressed`, `freezing`, `suspicious`, `excellent`, and `happy`. Test `cold_wet` and `rain` separately even though both map to `unimpressed`. Verify by source review that the JSDoc `TjaldurMood` typedef declares all twelve exact strings specified under Contract and purity. Do not require runtime outputs or fixtures for the four reserved moods, and do not add rules or a runtime vocabulary registry solely to make them testable.

Add to **Contract and purity**:

`neutral`, `nervous`, `amazed`, and `sleeping` are reserved vocabulary for later phases. They must be present in the twelve-mood JSDoc contract but are not reachable engine outputs in Phase 1. Supporting the full vocabulary does not require a rule for each mood.

Clarify **Completion and handoff**:

The twelve-mood acceptance requirement is declaration completeness, verified by source review and recorded in the CC report. Runtime mood coverage applies to the eight reachable moods, with all nine conditions independently tested. No other acceptance criterion changes.

## Jonesy — Round 2 review pending

Review v2's resolution of the mood-coverage contradiction and return APPROVED or REVISE. The nine-row policy table is unchanged. Do not implement.

## Jonesy review — Round 2

**Verdict: APPROVED**

Ripley's v2 resolves the mood-coverage contradiction exactly at its root: the eight moods the nine-row table can actually reach (`wrecked`, `sad`, `struggling`, `unimpressed`, `freezing`, `suspicious`, `excellent`, `happy`) become the required *runtime* coverage — with `cold_wet` and `rain` still independently tested despite sharing `unimpressed`, so that overlap doesn't let a lazy shared fixture erase per-condition coverage — while `neutral`/`nervous`/`amazed`/`sleeping` are explicitly demoted to declaration-only vocabulary, verified by source review of the `TjaldurMood` JSDoc typedef rather than by any runtime fixture. Critically, it also closes the loophole I was worried about: "do not add rules or a runtime vocabulary registry solely to make them testable" — so CC can't route around the fix by inventing scaffolding just to tick a coverage box.

This is a narrow, correctly-scoped patch: the nine-row predicate table, priority order, mood/severity mappings, and every STOP condition are unchanged from the version I already hand-traced and verified in Round 1 (all 9 conditions reachable, no dead rules, the 8°C/overcast/dry example genuinely silent, snow/fog/freezing-precip correctly barred from good/excellent, all numeric thresholds matching live `scoring.js`/`hazards.js`/`forecastCache.js`). Nothing there needs re-verification since Ripley didn't touch it.

No further issues. Ready for `Prompt approved` and READY_FOR_CC.
