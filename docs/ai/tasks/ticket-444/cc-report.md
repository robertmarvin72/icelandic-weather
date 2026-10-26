# #444 — CC report (Phase A: audit + proposal, read-only)

Executed `docs/ai/tasks/ticket-444/approved-prompt-v1.md` in full. **Phase A only — audit and proposal, never implemented.** No application/source/test/config/API/translation/instruction file was edited. No subagents. No commit/push/deploy/GitHub mutation. No `npm install`/full suite/lint/build/browser run (none required or permitted for a read-only audit).

## Baseline

- `git rev-parse HEAD` before and after this round: `a7813482dedd5c09d95929338a8cd0dfd1c42d6f` (unchanged).
- Branch: `main`.
- `git status --short` before: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-444/` (the task directory itself, pre-existing from Ripley/Jonesy's own prompt-review artifacts before CC started).
- `git status --short` after: identical in shape — only `docs/ai/CURRENT.md` (this round's lifecycle transition) and new files under `docs/ai/tasks/ticket-444/` (this round's own deliverables). No other file touched.
- `git diff --check`: clean, before and after.

## What was read (source citation hashes)

Every file cited in `audit.md` was read in full this session and its exact blob hash recorded there via `git hash-object <path>`, re-verifiable against the baseline HEAD above:

```
src/lib/weatherFinderRanking.js        5538db26dc7acfd82e664f6bcadb898b5ecefe77
src/lib/comparisonUtils.js             0ccf3b6ce121126508b92c1fe5060c097e00ea92
src/components/CampsiteComparisonSection.jsx  be071f3dadfd29484b4d83ff4cdc86d06aa0bcf4
src/lib/scoring.js                     5db18656b020e6bb992525acd2d65f5f9b594b09
src/components/ForecastTable.jsx       e60d5b47764510098aca03dce2dcbebef3e6215d
src/components/HourlyForecastModal.jsx d5dbffd6ddde1609d860a3f94343e442e8437d82
src/lib/forecastNormalize.js           0372916c87e82d067fdcd7eefc70f0a2b93806a6
src/hooks/useForecast.js               263e58244216dcb5eb6df55cc183421e0d4f0e3d
src/hooks/useLeaderboardScores.js      e81233f65988f6cb1ca055f575f408b6ce13f963
src/components/WeatherFinderCard.jsx   aba1cf577ee2f4b62517362c62dbdc127a78cfe5
src/components/WeatherFinder.jsx       e636f485a855c0a6441fa1553e59b3e3c4c79f99
src/components/InstantComparison.jsx   864198a1905fa14d29389cc73a638c82c51cf752
src/components/HomeDecisionCard.jsx    f6d52623aacc0917ccb5bd196d1de2ba09bd6d7b
src/hooks/useComparisonState.js        0f9924abd2305d5b0d1072c72b1767a176f4de5d
src/lib/weatherVoiceShareImage.js      3b5c3a568c159a43fa58028fa47b980ddfc06071
api/forecast.js                        d0307cf7f80befc4c613b91e13e5d57166a599b0
src/i18n/translations.common.js        2026d441a8b2c84ec0892d42ab6a6f27936a1bca
```

## Retained search/read commands (J1/J7 negative results)

```
grep -n "tmax\|tmin\|temperature_2m\|meðalhiti\|avgTemp" src/components/Top5Leaderboard.jsx src/MapView.jsx src/components/RouteCompareTable.jsx src/lib/weatherVoiceContent.js
grep -rn "tmax|tmin|temperature_2m|meðalhiti|avgTemp" src/pages src/hooks src/data
grep -rln "tmax|tmin|temperature_2m|meðalhiti|avgTemp" src/components/Blog* src/components/blog*
grep -rln "tmax|tmin|temperature_2m" api
grep -rln "tmax|tmin|temperature_2m|meðalhiti|avgTemp" src/i18n/translations.landing.js src/config api/_lib
grep -rn "api/forecast|fetchOpenMeteo" src --include="*.js" --include="*.jsx"
grep -n "temperature_2m\|tmax\|tmin" api/_lib/auroraDecision/openMeteo.test.js
```

Exact results for each are quoted in `audit.md` §3. All were re-run fresh this session (not copied from `approved-prompt-v1.md`'s own J1 leads), independently confirming (and in two cases — `api/admin.js`-style gaps don't apply here, but the `calcMetrics`/`HomeDecisionCard.jsx` import trace specifically — correcting/completing) Ripley's and Jonesy's starting observations.

## Provider documentation (J5, contract item 3)

`WebFetch` against `https://open-meteo.com/en/docs`, accessed 2026-10-26 — no live forecast/account probe, no provider choice made, cited as supporting evidence only. Full quoted findings in `audit.md` §2. Headline discovery: Open-Meteo already offers a true daily-mean temperature field (`temperature_2m_mean`) this app does not currently request — recorded as Option D2 in `implementation-proposal.md`, not implemented.

## Reference-cases script (J7)

`docs/ai/tasks/ticket-444/scratch/reference-cases-script.mjs` + `extensionless-loader.mjs` (a small Node built-in `module.register()` resolve-hook shim, not a new dependency — see `reference-cases.md`'s "Script safety" section for the full justification and the two failed attempts that preceded the working run). Both files and the full output (`reference-cases-output.txt`) are **retained** under `docs/ai/tasks/ticket-444/scratch/` — none deleted. `git status --short` was checked before and after running the script (see Baseline above) and is identical — confirming no filesystem/cache/localStorage side effect. 7 reference cases executed this round (RC-01 through RC-07), all results quoted verbatim in `reference-cases.md`, cross-referenced from `audit.md`. ~~The single highest-value finding: `scoreSiteDay` reclassifies an otherwise-pleasant day from `"Good"` (8 points) to `"Bad"` (0 points) purely because `tmax` is missing (RC-06) — a real, executed, reproducible behavior, recorded as a finding and left unfixed per the contract.~~ **Superseded — see "v2 Correction" below: this result is season-dependent (summer only), not a universal finding.**

## Deliverables

- `audit.md` — full per-surface inventory (8 surfaces + timezone/provider semantics section + negative-search results + active/demo/dormant classification + explicit uninspected UNKNOWNs), every row graded VERIFIED SOURCE / VERIFIED SAMPLE / INFERRED / UNKNOWN per J9.
- `implementation-proposal.md` — owner-readable options menu per surface (A-E plus the new D1/D2 split discovered via the Open-Meteo documentation lookup), each option's effect on `rankWarmest`/`calcMetrics`/`scoring.js` outputs stated explicitly, proposed IS/EN wording flagged for Róbert's own approval, and the 5 concrete decisions Róbert needs to make listed at the end.
- `reference-cases.md` — the 7 executed reference cases plus 3 code-read-only cases (no function exists to execute them), the unit/rounding table, and the script-safety writeup.
- `cc-report.md` — this file.
- `scratch/reference-cases-script.mjs`, `scratch/extensionless-loader.mjs`, `scratch/reference-cases-output.txt` — retained.

No proposed unapplied diff artifact was produced — the contract marks this optional ("if enough evidence"), and this ticket's Phase A output is a set of OPTIONS for the owner to choose between (not yet a single determined change), so a diff would be premature and potentially misleading before Decision 4 (scoring.js sentinels) in particular is made.

## Correction to a prompt-provided lead (J1, honestly reported rather than silently accepted)

J1's own starting observation states: "The file's comment says `HomeDecisionCard` also uses [`calcMetrics`], but I found no import of it in the staged `HomeDecisionCard.jsx` → record as UNKNOWN until traced." **Traced this session and resolved**: `HomeDecisionCard.jsx` does not import `comparisonUtils.js` directly, but genuinely does consume `avgHighTemp` indirectly via `useComparisonState.js` → `classifyMetrics` → `comparisonState.improvements` → the `t("icReasonWarmer")` qualitative chip (`audit.md` §1.2). The file's own top-of-file comment ("used by `InstantComparison` and `HomeDecisionCard`") is therefore accurate, just indirectly so — upgraded from J1's own UNKNOWN to VERIFIED SOURCE this round.

## Limits / explicit UNKNOWNs (restated from `audit.md` §5)

- Live Open-Meteo production response completeness — UNKNOWN, no live probe performed.
- `temperature_2m_mean`'s exact averaging/completeness method — UNKNOWN beyond the documentation's general 24-hour-aggregation statement.
- `src/utils/compareCampsiteForecasts.js`'s internal `TEMP_DIFF_THRESHOLD` logic — not re-read in full (deliberately; it is a separately-governed frozen contract per CLAUDE.md; its consumption was read and reported).
- Live `gh issue view 444` thread beyond the issue body already quoted in `approved-prompt-v1.md` — not re-fetched (would not change any source-code finding).
- Any feature flag/A-B test altering which surface a given user sees — not inspected.

## Scope confirmation

No `.env`/`.vercel`/account/GitHub/provider-key operation. No live forecast/account probe (the one web fetch was to Open-Meteo's own public documentation page, not a forecast/account endpoint). No instruction-file edit. No new test/app/config file. No `rankWarmest`/`calcMetrics`/`scoring.js` output changed (nothing was edited). No npm/build/lint/browser/service command run. No subagents. No `git add`/`commit`/`push`/`checkout`/`reset`/`stash`/`clean`/`config` run.

**Status: Phase A (audit + proposal) complete. Audit PASS does not authorize Phase B (J9) — #444 remains open. Owner reviews `implementation-proposal.md`'s 5 decisions; Phase B (if any) requires a new approved prompt through normal Jonesy review before any code is written.**

---

## v2 Correction — 2026-10-26 (Jonesy R1/R2)

Executed `docs/ai/tasks/ticket-444/approved-prompt-v2.md` (narrow documentation correction only). **No application/source/test/config/API/i18n/instruction file edited this round either.** No subagents. No commit/push/deploy/GitHub mutation. No full suite/lint/build/browser run (none required for a documentation-only correction).

### Baseline (re-checked)

- `git rev-parse HEAD` before this round: `a7813482dedd5c09d95929338a8cd0dfd1c42d6f`. After: unchanged — still `a7813482dedd5c09d95929338a8cd0dfd1c42d6f` (no commit).
- `git status --short` before and after: identical in shape to the v1 round's own end-state (only `docs/ai/CURRENT.md`'s lifecycle line and files under `docs/ai/tasks/ticket-444/` changed).
- `git diff --check`: clean, before and after.

### R1 — season-specific scoring evidence

```
Read src/lib/scoring.js's getSeasonForDate (lines 5-15) and getSeasonConfig (lines 17-32) in full.
Extended docs/ai/tasks/ticket-444/scratch/reference-cases-script.mjs's RC-06 to loop over 3 dates
  (2026-06-15, 2026-10-27, 2027-01-10) instead of one, logging season/tempWeight/basePts alongside
  points/finalClass for both the complete and missing-tmax day in each run.
node --import ./docs/ai/tasks/ticket-444/scratch/extensionless-loader.mjs
  docs/ai/tasks/ticket-444/scratch/reference-cases-script.mjs
  > docs/ai/tasks/ticket-444/scratch/reference-cases-output.txt 2>&1
  → exit code 0
git status --short  →  unchanged (only the scratch output file inside docs/ai/tasks/ticket-444/ changed)
```

**Local result, confirmed**: 2026-06-15 (summer) differs (`8`/"Good" vs `0`/"Bad"); 2026-10-27 and 2027-01-10 (both winter) are identical both ways (`3`/"Fair", `basePts` pinned at the winter `baseFloor` of `4` regardless of `tmax`). This matches Jonesy's own sandbox finding. **Root cause traced and explained** (not just reproduced): `basePointsFromTemp`'s maximum return is `10`; winter's `tempWeight` is `0.35`; `round(10 * 0.35) = 4` — so `basePts = max(4, ...)` cannot fall below the floor OR exceed it for ANY valid winter `tmax`, meaning the floor alone determines `basePts` in winter, independent of whether `tmax` is present. `audit.md` §1.4, `reference-cases.md`'s RC-06, `implementation-proposal.md`'s Surface 4, and this report's own earlier "highest-impact"/"any day" wording were all corrected in place (struck through, not deleted) to state this season-dependence explicitly and to stop generalizing a summer-fixture result into a universal claim. Production frequency of missing `tmax`, and whether some other winter input combination could still show a difference via a different code path, remain explicitly UNKNOWN.

### R2 — inventory and units completeness

```
rg "tmax|tmin|temperature_2m" src/lib --glob '!*.test.js'       → 64 occurrences, 11 files
rg "tmax|tmin|temperature_2m" src/components --glob '!*.test.jsx' → 28 occurrences, 3 files (no new file)
Read src/lib/relocationEngine.js lines 165-229 in full.
Read src/lib/weatherVoiceRules.js lines 1-40 in full.
Read src/lib/weatherVoiceEngine.js lines 40-134 (grepped context) in full.
Read src/lib/weatherVoiceShareSnapshot.js lines 1-90 (grepped context).
grep -n "units|imperial|convertTemp|convertWind" src/components/CampsiteComparisonSection.jsx → zero matches
```

Added new §1.4a to `audit.md` (extrema-only/hazard consumers: `relocationEngine.js`'s heat-only `tempHigh` warnings at the documented `24`/`28` thresholds, its deliberate, commented skip of cold/`tempLow` warnings because `tmin` isn't in the engine's day objects, and its `pickExplainDay` passthrough; `weatherVoiceRules.js`'s `TEMP_COLD_MAX_C`/`TEMP_GOOD_MIN_C`/`TEMP_EXCELLENT_MIN_C` thresholds and the `weatherVoiceEngine.js`/`useWeatherVoice.js`/`weatherVoiceShareSnapshot.js` single-day consumer chain). Added the two directory-wide search commands/counts to `audit.md` §3, explicitly distinguishing "searched this directory, these are the counts" from "every matched line was individually read and triaged" (both are true this round, stated separately per Jonesy's own instruction not to conflate them). Added `CampsiteComparisonSection.jsx`'s hardcoded `°C`/`m/s`/`mm` (no imperial handling at all) to both `audit.md` §1.3 and `reference-cases.md`'s unit table. **No threshold value was changed; none of these new findings were turned into new implementation scope** — confirmed by re-reading `implementation-proposal.md`'s own text, which does not propose touching `relocationEngine.js` or `weatherVoiceRules.js`/`weatherVoiceEngine.js` at all.

### Proposal accuracy and scope corrections

`implementation-proposal.md` corrected in place (struck through where a v1 claim was overstated, not deleted): the Open-Meteo `temperature_2m_mean` fact is now explicitly attributed to CC's own single `WebFetch` only (Jonesy's own re-fetch attempt was refused in their sandbox — no second source), with "cheapest"/"correct" language removed; Option D1 no longer implies an unconditional 24-sample design or a mandatory cache-key bump for unchanged raw hourly data (both corrected to "a future design task" / "not required on its own"); Option D2's wording now says the provider's own aggregation method is itself not fully documented, not that it is reliably handled. **Surface 1's Option B (fix the 0-coercion) and Surface 4's Option B (fix the scoring sentinels) are now explicitly placed OUTSIDE #444's own implementation scope** as separately-scoped follow-up candidates — selecting either in a future owner review does not, by itself, authorize implementing it under #444; #444's own Phase B must preserve scores/ranks/verdicts for identical inputs. Added an explicit statement that a Surface-1 relabel alone does not make the 0-coerced number a genuine observed mean, and that a Surface-1 Option C min/max row would show the extrema of each day's own HIGH, not the period's true minimum temperature (`tmin` is unused by this surface and by `scoring.js`'s ranking entirely). Added a note on `HomeDecisionCard.jsx`'s "warmer" chip's real semantics (mean of daily highs, up to 3 days, missing excluded) for the owner's awareness ahead of the Surface 2 decision, without changing that chip's behavior.

### RC-08 (Jonesy's suggested addition)

Added to the same pure, already-safety-reviewed script (no new import, no new side-effect surface): `rankWarmest` on candidate A `[10, null, 10]` vs B `[8, 8, 8]`, no rain/wind. **Observed, executed result**: `rankWarmest` ranks B ahead of A (B's `avgTemp` 8.0 vs A's 0-coerced `avgTemp` 6.67), while `calcMetrics`'s exclude-missing policy would rank A ahead of B (A's `avgHighTemp` 10.0 vs B's 8.0) — a concrete rank-inversion example. Stated explicitly as a hypothetical synthetic example, not a production-frequency claim. Full result in `reference-cases.md` RC-08.

### Tidy-up

Removed a garbled, leftover command-log line in this report's own "Retained search/read commands" section (`grep -rn "tmax\|estimateRouteRisk...n/a"...`) — an artifact copied from an unrelated prior ticket's report format, not a command actually run for #444. No past command was invented to replace it; the line was simply removed, and the surrounding genuine commands are unchanged.

### Scope confirmation (this round)

Touched only: `audit.md`, `implementation-proposal.md`, `reference-cases.md`, this report, the retained scratch script/loader/output (extended, not replaced — same files), and `docs/ai/CURRENT.md`'s lifecycle fields. No application/source/test/config/API/i18n/instruction file edited. No new dependency. No live provider/account/secret access (no new web fetch this round — the v1 round's single Open-Meteo documentation fetch is the only one, now more carefully attributed). No `git add`/`commit`/`push`/`checkout`/`reset`/`stash`/`clean`/`config` run. `git diff --check` clean; `git status --short` scoped to this ticket's own files plus the pre-existing untracked task directory and `docs/ai/CURRENT.md`.

**Status: v2 correction applied. R1 (season-dependence) and R2 (inventory/units completeness) both reflected consistently across audit/references/proposal/this report. No implementation approved; no issue closure. Owner next: Jonesy narrow re-check, then Ripley's corrected owner-facing proposal presentation — #444 remains incomplete until an explicitly approved Phase B passes normal prompt/result review.**

---

## Phase B — 2026-10-26 (presentation-only implementation)

Executed `docs/ai/tasks/ticket-444/approved-prompt-v3.md` in full. **Presentation-only, as authorized**: no scoring/ranking/recommendation/provider/API/cache-key/instruction-file change. No subagents, no commit/push/deploy/GitHub mutation.

### Baseline

- `git rev-parse HEAD` before and after: `a7813482dedd5c09d95929338a8cd0dfd1c42d6f` (unchanged — no commit).
- `git status --short` before: ` M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-444/` (this ticket's own prior-round artifacts only).
- `git diff --check`: clean, before and after.

### First read-only check (before any edit)

Read the relevant sections of `AGENTS.md`/`CLAUDE.md` (Homepage Canonical Decision Surface, Free/Pro feature gating, the `CampsiteComparisonSection` "do not switch to `normalizeDailyToScoreInput`" rule) — all already known from this session's own prior work and independently re-confirmed by grep this round. Re-traced the exact data flow before writing code:
- `WeatherFinder.jsx`'s `sites` (built once from `scoresById[id].rows`) feeds BOTH `rankWarmest(sites, options)` (whose output drops the forecast rows entirely — confirmed by reading `weatherFinderRanking.js`'s `buildResult`, which returns only `{id, name, distanceKm, score, metrics}`) AND, this round, a separate completeness map built from the SAME `sites`/`options.days` — so the card never has to (and cannot) infer coverage from `result` alone.
- `effectiveDays` is `isPro ? days : 3` (`WeatherFinder.jsx`), confirmed unchanged.
- `InstantComparison.jsx` confirmed Brochure-only (re-read `AGENTS.md`/`CLAUDE.md`'s own statement, and `src/pages/Brochure.jsx`'s "Static mock data... no API calls on this page" comment — meaning the Brochure browser scenario needed zero network mocking at all).
- `comparisonFactorTemp` and `weatherFinderAvgTemp` each independently re-confirmed (fresh `grep -rln`, excluding `node_modules`/`.git`/`dist`) to have exactly one real consumer each in `src/` before being touched — see "i18n" below.

No shared forecast/scoring/recommendation/gating/new-API-field/dependency change was needed to implement the owner-approved scope; nothing required a STOP.

### Implementation

- **`src/lib/weatherFinderDisplay.js`** (new, pure) — `getTmaxWindowCompleteness(forecastRows, days)` returns `{ complete, windowLength }` only. Does **not** compute a replacement mean — a complete window still displays the untouched `metrics.avgTemp` the engine already computed. Mirrors `weatherFinderRanking.js`'s `sliceForecast` integer-days rule for what "a day count" means, but deliberately diverges from the engine's own fallback: an invalid/missing `days` fails closed to `{complete: false, windowLength: null}` rather than reproducing the engine's "use the whole array" behavior, since there is no trustworthy period to state in that case (J3/J4). Checks each row index-by-index (not `.every()` on the array) so a true sparse-array hole cannot silently pass (J3). `0`/negative `tmax` values are valid; `null`/`undefined`/`NaN`/`Infinity`/non-numeric strings are not.
- **`src/components/WeatherFinder.jsx`** — builds `warmestCompletenessById`, a `useMemo` keyed by stable site `id`, from the exact same `sites`/`options.days` ranking itself depends on (same dependency array shape) — never derived from `ranked`'s own output, never positional (J5). Passed to each `WeatherFinderCard` only in `"warmest"` mode.
- **`src/components/WeatherFinderCard.jsx`** — `"warmest"` mode now reads `completeness` (new prop) rather than unconditionally formatting `result.metrics.avgTemp`. Complete: `"{value} — Average daily high"` + a period line (new, stacked second line, "two lines allowed" per J1). Incomplete (including an entirely absent/malformed `completeness` prop — fails closed, J4): `"Insufficient data"`, same period line when a valid window length is still known, otherwise the period line is omitted (never an invented N). `"calmest"`/`"driest"` modes are textually and structurally untouched — verified by re-running `WeatherFinderCard.select.test.jsx` unchanged (all 13 pre-existing assertions, including the exact pre-existing rendered strings, still pass) and by new tests asserting the pre-existing text verbatim.
- **`src/components/InstantComparison.jsx`** — `SiteCard` gained a `t` prop and renders a qualifier line directly under the temperature `MetricRow`, gated on the exact same null-check `MetricRow` itself uses (`tempFmt != null`) — so the qualifier is omitted together with the row whenever there's no temperature metric, preserving the existing row-omission behavior exactly. No other row, no delta text, no threshold, no analytics call touched.
- **`src/components/CampsiteComparisonSection.jsx`** — **zero code changes**. `comparisonFactorTemp`'s translated VALUE was changed (see i18n below); this file's own `labelKey: "comparisonFactorTemp"` line (line 91, confirmed via the audit's own citation and re-confirmed this round) was the only reference needed.

### i18n

Confirmed via fresh repo-wide `grep -rln "weatherFinderAvgTemp|comparisonFactorTemp" --include="*.js" --include="*.jsx" --include="*.md" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist` (J8): `weatherFinderAvgTemp` had exactly one real consumer (`WeatherFinderCard.jsx:21`, now replaced); `comparisonFactorTemp` had exactly one (`CampsiteComparisonSection.jsx:91`, unchanged key, new value) — neither appears in blog/landing/pricing or any test asserting the literal old string. `weatherFinderAvgTemp` retired (both `en`/`is`); new keys added with EN/IS parity verified by direct script check (`commonTranslations.en`/`.is`, 404 keys each, no new mismatch — the 3 pre-existing `scoreExplanation_*` EN/IS name differences are unrelated and untouched):

| Key | EN | IS |
|---|---|---|
| `weatherFinderWarmestLabel` | Average daily high | Meðaltal hámarkshita |
| `weatherFinderInsufficientData` | Insufficient data | Ófullnægjandi gögn |
| `weatherFinderPeriodLine` | First {n} forecast days, including today | Fyrstu {n} spádagar, dagurinn í dag meðtalinn |
| `icTempQualifier` | Average daily high, up to 3 days | Meðaltal hámarkshita, allt að 3 dagar |
| `comparisonFactorTemp` (value changed, key kept) | Temp → **High temperature** | Hiti → **Hámarkshiti** |

IS wording is the owner-approved outcome from `approved-prompt-v3.md` §"Owner-approved outcome" — not independently assessed for quality by CC (J8, unchanged policy).

### Isolation (N4) — confirmed empty diff / baseline hash equality

```
git diff -- src/lib/weatherFinderRanking.js src/lib/scoring.js src/lib/comparisonUtils.js \
  src/lib/forecastNormalize.js src/lib/forecastCache.js src/utils/compareCampsiteForecasts.js \
  src/hooks/useLeaderboardScores.js src/hooks/useComparisonState.js \
  src/components/HomeDecisionCard.jsx src/App.jsx
  → (empty)
```

`git hash-object` on all 10 of the above files this round produced the identical hashes recorded in `audit.md` (Phase A) for the 7 files that also appear there (`weatherFinderRanking.js`, `scoring.js`, `comparisonUtils.js`, `forecastNormalize.js`, `useLeaderboardScores.js`, `useComparisonState.js`, `HomeDecisionCard.jsx`) — byte-identical across both the Phase A audit and this Phase B implementation. `forecastCache.js`, `compareCampsiteForecasts.js`, and `App.jsx` (not individually hashed in Phase A) are confirmed untouched this round via the empty `git diff` above. `CampsiteComparisonSection.jsx` itself is also untouched (zero diff) — only its i18n string changed.

### Tests

New files: `src/lib/weatherFinderDisplay.test.js` (18 tests — the acceptance criteria's exact cases: `[2,2,2,10]`→4 never the extrema midpoint 6, `[10,null,10]`, all-missing, short window, missing/undefined row, a genuine sparse-array hole, NaN/Infinity/string, `[0,-5,2]` valid, out-of-window rows ignored, every invalid-`days` shape, non-array input, non-mutation); `src/components/WeatherFinderCard.test.jsx` (10 — complete/incomplete/absent-metadata/malformed-windowLength EN+IS, calmest/driest untouched); `src/components/WeatherFinder.completeness.test.jsx` (10 — Pro 3→5→7 window switch, Free forced-3, completeness keyed by stable id and re-verified after a window-size change, and the **RC-08 parity case**: real `rankWarmest` re-executed inline confirms B-before-A, then the real rendered UI is asserted to preserve that exact order while A's own card now reads "Insufficient data" — J7's required retained-limitation proof); `src/components/InstantComparison.tempQualifier.test.jsx` (4 — EN/IS qualifier, omitted with the row when null, existing delta text unaffected); `src/components/CampsiteComparisonSection.tempLabel.test.jsx` (3 — EN/IS relabel through the real fetch→compare pipeline, raw value unaffected).

```
npx vitest run <13 targeted files>
  Test Files  13 passed (13)
  Tests  205 passed (205)

npm run test:run   (full suite)
  Test Files  192 passed (192)
  Tests  2858 passed (2858)
  (pre-existing "Not implemented: navigation to another Document" jsdom warnings, unrelated baseline noise)

npm run lint
  (clean, no output)

npm run build
  ✓ 3040 modules transformed (one more than the #444 Phase A baseline's 3039 — the new
    weatherFinderDisplay.js helper), built in 5.22s
```

No pre-existing test was weakened; every file listed in the "First read-only check" section above that already covered `calmest`/`driest`/comparison/InstantComparison analytics/`comparisonUtils`/`HomeDecisionCard` behavior was re-run unchanged and stayed green.

### Browser evidence (production build)

New `playwright.ticket444.config.js` (serves the just-built `dist/` via `vite preview` on port 4444, reusing the exact pattern established for ticket #460's `playwright.ticket460.config.js` — every `/api/*` response mocked, no live provider/account probe) + `tests/e2e/temperature-display-ticket-444.spec.js`, 6 scenarios:

```
npx playwright test --config=playwright.ticket444.config.js
  (Playwright 1.59.1, Chromium 147.0.7727.15, Vite 7.3.6 preview)

  ok 1 Weather Finder (Pro, EN, desktop): complete site "18.0°C — Average daily high" + period;
       incomplete site "Insufficient data"; no 0.0°C anywhere in the panel
  ok 2 Weather Finder (Pro, IS, desktop): period switch 3 -> 5 -> 7 updates the Icelandic line;
       "Ófullnægjandi gögn" still shown for the incomplete site at every window size
  ok 3 Weather Finder (Free, EN, desktop): forced 3-day period, no Pro day-count controls present
  ok 4 Weather Finder (Pro, EN, mobile 375px): no horizontal overflow; the place-name button
       stays genuinely clickable (width > 20px) despite the longer period line beside it
  ok 5 Brochure (EN + IS, static demo data, no network mocking needed at all): qualifier visible
       under both site cards in both languages
  ok 6 Campsite comparison (Pro, EN, desktop): real fetch -> compare pipeline shows
       "High temperature", never bare "Temp"
  6 passed (22.1s)
```

Two real failures were hit and fixed during this round, kept here as evidence the assertions are not vacuous: (1) the Weather Finder "show ranking"/"Warmest" buttons mix an aria-hidden icon glyph with the label as sibling text, so an exact `getByText` match found nothing — switched to `getByRole("button", { name })`, which correctly computes the accessible name; (2) an unscoped `/0\.0°C/` regex false-matched the substring inside a different, genuinely-complete site's own "10.0°C" — fixed by scoping the query to `#weather-finder-panel` and anchoring the regex with a digit lookbehind. Both are recorded as real red→green evidence, not left in as permanent mutation tests.

6 screenshots, `results.txt`, and self-contained copies of the spec/config are saved under `outputs/ticket-444-browser-evidence/`.

**Scope note, stated honestly**: this is a representative scenario subset (6 scenarios), not the full language×viewport×scenario cross-product — chosen so every acceptance item (complete/incomplete, Pro period switch, Free display, mobile+desktop, IS+EN, Brochure, comparison factor row) is covered at least once, with the headline complete/incomplete contrast covered most thoroughly (both languages, both viewport classes).

### J7 — retained limitation, restated

Unchanged ranking is a material, deliberately-retained limitation: an incomplete site's own RANK/SCORE still uses the old zero-coerced `avgTemp` (RC-08's A-before-B inversion, re-verified this round both via direct `rankWarmest` re-execution and via the real rendered UI order — `WeatherFinder.completeness.test.jsx`). **Display honesty does not certify ranking correctness.** Fixing the ranking/scoring 0-coercion (Surface 1's Option B) and the `scoring.js` sentinel behavior (Surface 4's Option B) remain separately-scoped follow-up candidates per the Phase A correction round — not touched, not authorized, by this Phase B.

### Scope confirmation

No `.env`/`.vercel`/account/GitHub/provider-key operation, no new API field/provider call, no cache-key change, no scoring/ranking/recommendation/gating file touched (confirmed empty diff above), no instruction-file edit, no new dependency. `.jsx`/`.js` only, extensionless `src` imports preserved. No subagents. No `git add`/`commit`/`push`/`checkout`/`reset`/`stash`/`clean`/`config` run.

**Status: Phase B (presentation-only implementation) complete — tests, lint, build, and browser evidence all green. Owner review next: Jonesy Phase B result review, then Ripley's final assessment. Issue closure is never automatic; the ranking/scoring follow-up candidates remain open, separate work.**

---

## v4 Correction — 2026-10-26 (Jonesy R1/R2 + binding J4 compliance fix)

Executed `docs/ai/tasks/ticket-444/approved-prompt-v4.md` (narrow correction: mobile layout, browser evidence, imperial parent test, J4 fail-closed compliance). **No label/period wording change, no ranking/scoring/provider/API/gating change, no dependency.** No subagents, no commit/push/deploy/GitHub mutation.

### Baseline

- `git rev-parse HEAD` before and after this round: `a7813482dedd5c09d95929338a8cd0dfd1c42d6f` (unchanged).
- `git status --short` before: identical to the v3 round's own end-state.
- `git diff --check`: clean, before and after.

### Binding compliance correction (J4) — fixed before anything else

Jonesy's result review correctly identified that the v3 round's own existing test (`{complete: true, windowLength: null}` → expected the numeric value to render) was itself wrong against J4's actual requirement. **Fixed in `src/components/WeatherFinderCard.jsx`'s `getWarmestDisplay`**: the numeric value now requires `completeness?.complete === true` **AND** a valid positive-integer `windowLength` — `complete: true` with a missing/malformed `windowLength` is itself malformed metadata (a number with no period we could honestly state) and now fails closed to `"Insufficient data"`, exactly like fully-absent metadata. The period line is omitted whenever `windowLength` isn't valid, independent of `complete`. Updated the existing test to assert the corrected (fail-closed) behavior instead of the old (wrong) one; added two new cases: a truthy-but-non-boolean `complete` flag (e.g. `"yes"`) and a non-integer `windowLength` (`3.5`) — both now correctly fail closed.

### R1 — mobile name readability (real layout fix, not a tighter assertion)

`WeatherFinderCard.jsx`'s `"warmest"` mode now renders a **different JSX structure** than `"calmest"`/`"driest"` (which keep the exact pre-#444 markup, verified byte-identical in effect by every pre-existing `calmest`/`driest` test still passing unchanged): below the `sm` breakpoint, the row is `flex-col` — the rank+name occupy their own full-width row, and the metric/period block drops to a second, full-width row underneath (previously the metric block's `max-w-[55%]` cap squeezed the name down to a handful of characters on a 320-375px phone, exactly as Jonesy found). At `sm` and above, `sm:flex-row` restores the original side-by-side layout (metric right-aligned, capped at 55% width) — ~~visually unchanged on desktop~~. **Corrected, v5 (Jonesy R3)**: this claim was wrong — the name wrapper div had no `flex-grow` at `sm`+ (no `sm:flex-1`), so it only took its natural content width instead of filling the row, leaving the metric block sitting beside it rather than pushed to the right edge — a real desktop alignment regression, not actually "unchanged." See the "v5 Correction" section below for the fix and its verification.

**Verified with real DOM geometry, not a width-in-pixels proxy**: the browser spec now asserts each name span's `scrollWidth <= clientWidth` (i.e., genuinely not CSS-truncated) for the fixture names Jonesy flagged (`"Warm Complete"`, `"Gap Valley"`) at 320px, 375px, and desktop, in both languages (12 assertions total across the matrix below) — not the old `button width > 20px` proxy. A separate, deliberately longer but still realistic Icelandic campsite name (`"Tjaldsvæðið við Jökulsárlón Austur"`) is used to document the accepted fallback: at 375px it renders in full; at 320px it ellipsis-truncates — both screenshots retained, and the requirement there is explicitly only "no page-level horizontal overflow, still a real clickable button," not full-text visibility, since this fixture is intentionally long enough to test the documented fallback rather than the must-never-truncate guarantee.

### R2 — corrected browser evidence

**Toast dismissal fixed for real.** The v3 round's `dismissPwaToastIfPresent` targeted a `"Later"`/`"Síðar"` button that belongs to the separate `needRefresh` toast (`usePwaUpdateToast`), which cannot fire on a fresh install/fresh context — so it silently found nothing, every time, and the swallowed `.catch(() => {})` hid that. The toast that **actually** appears in this environment is App.jsx's `onOfflineReady` success toast (real `registerSW`/service-worker precaching against the real production build), dismissed via `ToastHub`'s own generic `aria-label="Dismiss"` control. **Independently verified this round** with a standalone, throwaway diagnostic spec (written, run once, confirmed, then deleted — not part of the retained deliverables): navigating to `/` with only `/api/**` stubbed to `{}` produces a real, visible toast (text: *"Eltum Veðrið er vistað og getur virkað án nettengingar."*) within the timeout window, and clicking the real `"Dismiss"` button genuinely hides it (`toBeHidden` assertion passed). The retained spec's `dismissRealToastIfPresent` helper now targets this real control and — per the correction's explicit instruction — does **not** swallow a failed dismissal: if the toast appears but the click/hide sequence fails, the test fails loudly, it does not silently continue.

**Full matrix, not 6 cherry-picked scenarios.** `tests/e2e/temperature-display-ticket-444.spec.js` was rewritten (not patched) into 12 scenarios:
- **6** — the complete/incomplete Finder-row matrix at every combination of `{320px, 375px, desktop}` × `{EN, IS}`, each asserting: the complete site's honest label+value, the incomplete site's `"Insufficient data"`/`"Ófullnægjandi gögn"` (never a number), both fixture names' real DOM geometry (`scrollWidth <= clientWidth`), no page-level horizontal overflow, and — via the request/response log described below — that the incomplete site's own real network response genuinely contained a missing day.
- **1** — Free, EN, 375px: forced 3-day period, no Pro day-count controls, name still readable.
- **1** — Pro, IS, desktop: the 3→5→7 window switch over **real 7-row fixtures** (both the complete and incomplete site have a full 7-day payload; the incomplete site's hole at index 1 is inside every window size, so it stays `"Ófullnægjandi gögn"` at 3, 5, and 7), with the complete site's value and honest Icelandic period line reasserted at each size.
- **1** — imperial, EN, desktop: sets `units=imperial` via the real `useLocalStorageState` key and reloads — the complete site shows the real Fahrenheit conversion of the real engine value (`18°C → 64°F`), the incomplete site still shows `"Insufficient data"`, and no `0°F` (digit-boundary-anchored, so a different site's real `50°F` doesn't false-match) appears anywhere in the panel.
- **1** — the long-name documentation case described under R1.
- **2** — Brochure (both languages, re-verified; still needs zero network mocking, confirmed again) and the Pro comparison factor row (re-verified).

**Request/response accounting** (new this round): every scenario records each real `/api/forecast` request's matched site id and whether that exact response payload contains a missing day; the matrix tests assert `incompleteRequest.hasMissingDay === true`, directly demonstrating the missing value reached the real parent through the real network layer — not merely that the UI text happens to look right for an unrelated reason.

```
npx playwright test --config=playwright.ticket444.config.js
  (Playwright 1.59.1, Chromium 147.0.7727.15, Vite 7.3.6 preview, fresh context per test)
  12 passed (36.2s)
```

Two real failures were hit and fixed while building this round's spec (kept as evidence the assertions are not vacuous, same as the v3 round's own two): an unscoped `/0°F/` regex false-matched the substring inside Base Camp's own real, complete `"50°F"` row (fixed with the same digit-lookbehind pattern already used for `°C` in the prior round); a dead `.catch()` call on a Playwright `Locator` (not a Promise) threw a `TypeError` in the long-name test (removed, replaced by the already-present conditional `count()` check).

**Superseded screenshots identified and removed, not left stale**: `finder-complete-incomplete-en-desktop.png`, `finder-complete-incomplete-en-mobile375.png`, `finder-free-en-desktop.png` (the v3 round's own screenshots, produced by scenarios this round's spec no longer has under those names) were deleted from `outputs/ticket-444-browser-evidence/`; `finder-period-switch-is-desktop.png` was genuinely regenerated under the same filename by this round's equivalent scenario (not stale). 13 current screenshots remain, all produced by the retained, current spec. Two screenshots (`finder-matrix-375-en.png`, `finder-matrix-320-en.png`) were visually inspected this round (not just asserted on) — both confirm the fix: full readable names stacked above a separate metric/period line, the long-name fixture rendering in full at 375px and ellipsis-truncating (as documented, not asserted as a bug) at 320px, and `finder-imperial-en-desktop.png` confirms the real Fahrenheit values (64°F/61°F/50°F/48°F) and `"Insufficient data"` for Gap Valley.

### Isolation — re-confirmed

```
git diff -- src/lib/weatherFinderRanking.js src/lib/scoring.js src/lib/comparisonUtils.js \
  src/lib/forecastNormalize.js src/lib/forecastCache.js src/utils/compareCampsiteForecasts.js \
  src/hooks/useLeaderboardScores.js src/hooks/useComparisonState.js \
  src/components/HomeDecisionCard.jsx src/App.jsx
  → (empty, same as the v3 round)
```

RC-08 parity re-confirmed unchanged this round (no source edit touched `rankWarmest`'s own logic): `WeatherFinder.completeness.test.jsx`'s existing RC-08 tests still pass without modification.

### Tests

```
npx vitest run <13 targeted files>
  Test Files  13 passed (13)
  Tests  209 passed (209)   (was 205 in the v3 round; +4 net from the J4 fix's corrected/added cases
                              and +2 new imperial-parent-integration tests)

npm run test:run   (full suite — not strictly required by the correction's own "absent broader
                     changes" clause, but run anyway for an honest, current count)
  Test Files  191 passed, 1 failed (192)
  Tests  2861 passed, 1 failed (2862)

npm run lint
  (clean, no output)

npm run build
  ✓ 3040 modules transformed, built in 5.61s (unchanged module count from v3 — no new source file
    this round, only edits to existing ones)
```

**The one full-suite failure is pre-existing and unrelated, reported honestly rather than hidden or waved away**: `src/App.affiliateHolder.test.jsx` ("one impression through a real campsites reload/remount") — `TypeError: Cannot read properties of undefined (reading 'trigger')` on a `FakeIntersectionObserver` instance. Confirmed via: (a) `git diff -- src/App.affiliateHolder.test.jsx src/App.jsx` is empty (neither file touched this session, in any round, on any ticket); (b) `git log -1` on the test file shows its last real commit was 2026-10-14, 12 days before this session; (c) it reproduces identically when run in complete isolation (`npx vitest run src/App.affiliateHolder.test.jsx` alone), ruling out test-order pollution from any file added this round. Not fixed — out of scope (unrelated to temperature display, touches an affiliate-impression/IntersectionObserver feature this ticket never touches).

### Scope confirmation (this round)

Touched only: `src/components/WeatherFinderCard.jsx` (J4 fix + R1 layout), `src/components/WeatherFinderCard.test.jsx` (updated + new malformed-metadata cases), `src/components/WeatherFinder.completeness.test.jsx` (DOM-nesting-aware selector fix + new imperial-parent tests), `tests/e2e/temperature-display-ticket-444.spec.js` (rewritten), `playwright.ticket444.config.js` (`testMatch` only — same webServer/port/pattern as before), `outputs/ticket-444-browser-evidence/` (refreshed), this report, and `docs/ai/CURRENT.md`'s lifecycle fields. No other application file. No label/period/qualifier/comparison WORDING changed (all unchanged from the v3 round, confirmed via the i18n diff still showing only the v3 round's own additions). No scoring/ranking/recommendation/gating/provider/API/cache-key file touched (confirmed empty diff above). No new dependency, no tooling installed. No live provider/account/secret access.

**Status: v4 correction complete. R1 (real layout fix, DOM-geometry-verified), R2 (real toast dismissal, independently diagnosed and confirmed; full 320/375/desktop × EN/IS matrix; imperial parent case; request/response accounting), and the binding J4 fail-closed fix are all reflected in source, tests, and browser evidence. One pre-existing, unrelated full-suite failure reported honestly, not hidden. Owner next: Jonesy re-check, then Ripley's final assessment. Issue closure never automatic.**

---

## v5 Correction — 2026-10-26 (Jonesy R3 — desktop alignment regression; C1 uncertainty record)

Executed `docs/ai/tasks/ticket-444/approved-prompt-v5.md` (single, narrow production correction + evidence + C1 honesty record). No string/ranking/scoring/provider/API/gating change, no dependency, no subagent, no commit/push/deploy/GitHub mutation.

### Baseline

- `git rev-parse HEAD` before and after: `a7813482dedd5c09d95929338a8cd0dfd1c42d6f` (unchanged).
- `git status --short` before/after: identical in shape to the v4 round's own end-state.

### R3 — the single production correction

**Verified the actual source first** (per the approved prompt's own instruction), confirming Jonesy's exact diagnosis: `WeatherFinderCard.jsx`'s warmest-mode name wrapper (`<div className="flex items-center gap-3">`) had no `sm:flex-1`, so at `sm`+ it never grew to fill the row — it just sat at its natural content width beside the metric block, instead of pushing that block to the right edge (visible in the v4 round's own `finder-imperial-en-desktop.png`, now superseded).

**Fix**: added `min-w-0 sm:flex-1` to that one wrapper div. Nothing else in the file changed — mobile stacking, `calmest`/`driest` (both already untouched since the v3 round), and all wording/data paths are exactly as they were. One additional, presentation-only change: added `data-testid="weather-finder-warmest-metric"` to the metric block div itself, so the new alignment assertion can identify it explicitly rather than inferring it from text content/width (per the approved prompt's explicit instruction).

### Evidence

**New desktop geometry assertion** (`tests/e2e/temperature-display-ticket-444.spec.js`, added to the existing matrix test's `"desktop"` case, not a separate weakened scenario): collects every `[data-testid="weather-finder-warmest-metric"]` block's bounding box and asserts `max(rightEdge) - min(rightEdge) <= 1` (px) across all visible rows — i.e. every row's metric block shares the same right edge within 1px, computed from real geometry, not inferred.

**Visually inspected** `finder-matrix-desktop-en.png` this round: all 5 rows' metric text (`"18.0°C — Average daily high"`, `"16.0°C — Average daily high"`, `"10.0°C — Average daily high"`, `"9.0°C — Average daily high"`, `"Insufficient data"`) now sit flush against the same right edge, matching the row-selection arrows' own alignment — confirms the fix visually, not just via the numeric assertion.

```
npm run build
  ✓ 3040 modules transformed, built in 5.12s (unchanged module count — one existing file edited,
    no new source file this round)

npx vitest run src/components/WeatherFinderCard.test.jsx src/components/WeatherFinder.completeness.test.jsx \
  src/lib/weatherFinderDisplay.test.js src/components/WeatherFinderCard.select.test.jsx
  Test Files  4 passed (4)
  Tests  56 passed (56)

npx playwright test --config=playwright.ticket444.config.js
  (full current spec rerun — not a weakened subset, per the approved prompt's explicit instruction;
   same 12 scenarios as v4, now including the new desktop alignment assertion inside scenarios 5/6)
  12 passed (36.2s)
```

All v4-established evidence remains valid and was re-exercised in this same run: real toast dismissal (12/12 scenarios navigate through `gotoHome`/`dismissRealToastIfPresent`, none failed), the 320/375/desktop × EN/IS name-readability matrix (6/6), missing-day request/response accounting, and the imperial parent case. Screenshots regenerated fresh this round for every scenario; none from the v4 round were reused unchanged.

### Isolation — re-confirmed

```
git diff -- src/lib/weatherFinderRanking.js src/lib/scoring.js src/lib/comparisonUtils.js \
  src/lib/forecastNormalize.js src/lib/forecastCache.js src/utils/compareCampsiteForecasts.js \
  src/hooks/useLeaderboardScores.js src/hooks/useComparisonState.js \
  src/components/HomeDecisionCard.jsx src/App.jsx
  → (empty, same as v3/v4)
```

### C1 — recorded honestly, not resolved, not asserted as pre-existing

The v4 round's full-suite run showed one failure in `src/App.affiliateHolder.test.jsx` (`TypeError: Cannot read properties of undefined (reading 'trigger')` on a `FakeIntersectionObserver` instance), reported at the time as "pre-existing and unrelated" based on an empty diff, an old last-commit date, and reproduction in isolation at that moment. Per Jonesy's independent check (recorded in `result-review.md` and `CURRENT.md`'s own handoff) and Ripley's own local runs (`npx vitest run src/App.affiliateHolder.test.jsx src/components/WeatherFinderCard.test.jsx src/components/WeatherFinder.completeness.test.jsx src/lib/weatherFinderDisplay.test.js` → 4 files/46 tests passed; `affiliateHolder` alone → 4/4 passed), **the v4 failure was not reproduced by either reviewer.**

This round's own runs, for the record (not a claim that resolves the uncertainty either way):
- `npm run test:run` (full suite, this round): **192/192 files, 2862/2862 tests — `App.affiliateHolder.test.jsx` passed.**
- `npx vitest run src/App.affiliateHolder.test.jsx` alone (this round): **4/4 passed.**

**This is recorded as an intermittent/unreproduced-on-demand result, not as confirmation that the earlier failure was "pre-existing" (in the sense of a stable, reliably-reproducible bug) or that anything was "fixed."** No file related to the affiliate-impression/IntersectionObserver feature was touched this round, last round, or any prior round this session — the only plausible mechanisms are environment-level (timing/scheduling nondeterminism in the `FakeIntersectionObserver` mock's interaction with React's own update scheduling, or the "known Vitest EPERM temp-file issue" the approved prompt itself names) rather than anything #444's own changes could cause or fix. **No unrelated affiliate-holder fix was attempted or authorized this round.** The owner is not asked to re-run anything as a prerequisite — Ripley's and this round's own checks already stand as the record.

### Scope confirmation (this round)

Touched only: `src/components/WeatherFinderCard.jsx` (one wrapper's class list + one `data-testid` attribute), `tests/e2e/temperature-display-ticket-444.spec.js` (new desktop alignment assertion added to the existing matrix test), `outputs/ticket-444-browser-evidence/` (refreshed screenshots/results/spec copy), this report, and `docs/ai/CURRENT.md`'s lifecycle fields. No wording/label/period/qualifier/comparison string changed. No scoring/ranking/recommendation/gating/provider/API/cache-key file touched (confirmed empty diff above). No new dependency, no tooling installed, no live provider/account/secret access.

**Status: v5 correction complete. R3 (desktop right-alignment, now geometry-verified and visually confirmed) fixed with a single, minimal class addition plus one explicit test-identification attribute. C1 recorded honestly as an unreproduced, intermittent result — neither claimed resolved nor conclusively pre-existing. Owner next: Jonesy's short re-check, then Ripley's final assessment. Issue closure never automatic; the ranking/scoring zero-coercion follow-up candidates remain separate, open work.**
