# #437 — CC report

Status: research completed, documentation only. No production/source/test/config/scoring/threshold/copy change made. No commit/push/deploy/GitHub mutation.

Deliverables (all under `docs/ai/tasks/ticket-437/`): `research-report.md`, `inventory.md`, `reference-cases.md`, `source-register.md`, plus the retained reference-case harness (`reference-cases-script.mjs`, `esm-ext-loader.mjs`, `reference-cases-output.txt`) per J9's "keep baseline hashes and stable finding/inventory IDs" and the general "retain exact commands" validation requirement.

## Baseline (J10)

- `git rev-parse HEAD` **before and after**: `ffb10f3c4dde606d956b54ff83e81a9ec2e2d3aa` (unchanged — confirms no source drift during research).
- Branch: `main`.
- `git status --short` before: `M docs/ai/CURRENT.md` (workflow pointer, expected), `?? docs/ai/tasks/ticket-437/` (task files already placed by Ripley/Jonesy before CC started, expected).
- `git status --short` after: identical, plus this round's own new files under the same untracked `docs/ai/tasks/ticket-437/` directory. No tracked application file appears in `git status` at any point.
- `git diff --check`: clean, before and after.
- SHA-256 of every file cited by file:line in inventory.md/research-report.md (computed directly by CC, cross-verified against the two tracing forks' own independently-computed hashes for the same files — all matched exactly, no discrepancy found):

```
baeeea51f231be6b26de7bab814c421ab588e72b61d2d235a09cd14f0357bd90  src/config/hazards.js
cf1c5d5174cae11fff4c0d737311f408015ba1cd187d96f5f44ce9433116cd45  src/lib/routeRisk.js
b15cd292d693143554ddf33ed61b5cc2eab689cef47e896d2e7952c18ae21ce9  src/lib/hazardWindow.js
c02d1a17e8261d98de65af4bf8e38f4d889405c7afa087ac09e8b40c41e9f044  src/lib/forecastNormalize.js
d6a52d91195dee6ea38cf74a84c1d65ed54502b2bc250a82b48c95b634b385ac  src/lib/weatherVoiceRules.js
6f0730725d4d6a6f7e15336d5fd438c423c0c5609bca6f46944f15ee3af43e04  src/lib/weatherVoiceEngine.js
500daa219f61eb44adf2d7bf50c402acb71ea28f1020066c25be3cfbea9da995  src/lib/auroraScoring.js
50062370fe7a618c076333852ff81dd0e1e79e56d26b7ed267c146538a4f88c6  src/lib/scoring.js
1f6c255cd44165b164104d4a3bf65c9008157af5b9f857fba4a1c3d42f6ef541  src/lib/windUtils.js
ddab24e6fc32a8cbbe1f6e4eea1c7e74187b18211a3599a5f65d4b950c994863  src/lib/routePlannerNarrative.js
4cf5e9b64ac900e9ae7bf09eb1013b41b988b7135f55fa728b139074506c78e0  src/lib/forecastCache.js
907675f4c692e4e311d0cae86feede67cca464825b71f81c0f8ddd8fa1d83f00  src/i18n/weatherVoice/safety.js
1dc9719ea885b04f6c432523355ac17c6b1be3cec3e38905da2f4b40d09c3496  src/i18n/translations.routePlanner.js
42ecb8bde21d8fa2e51d2f8e508422d0d05d37fa9c995098b24cfa32513916ca  src/lib/weatherVoiceShareManifest.generated.js
1c81af478fec1b34a2e97b26fc3cec1e1d1911d699c30a23a720a9e439b508fe  api/forecast.js
ef47c67f199bf9bba97b457b300ca1d333639ebf87935a07d0e6eb0672146804  api/_lib/auroraDecision/openMeteo.js
843a42d00fcf44d81151ece740cf459a8852e94b66de9e4ec0307b9929e89c67  api/_lib/auroraDecision/openMeteo.test.js
```

(Computed via `sha256sum <file>` for each path, run directly in the repo root against this exact HEAD.)

## Commands run (exact)

**Baseline:**
```
git rev-parse HEAD
git branch --show-current
git status --short
git diff --check
```

**Issue history (J11, read-only `gh`, already-configured, no token/env inspection):**
```
gh issue view 437
gh issue view 142
gh issue view 117
gh issue view 117 --json title,body,comments
gh issue view 436 --json title,body,state,number
gh issue view 436 --json title,state,number,labels,projectItems
```

**Repository inventory and tracing**: delegated to three parallel research subagents (forks of this same CC session, inheriting full task context), each independently running `rg`/`Grep`/`Read`/`Bash(sha256sum)` read-only. This was done to keep the primary research transcript free of the very large volume of raw grep/read output such a broad sweep produces, while every citation returned was independently cross-checked by CC itself (hashes above all matched; several specific claims — e.g. the `windspeed_10m_max`/`windgusts_10m_max` field names, the `HAZARDS_V1` values, the `detectHazardWindow` duration tiers — were independently re-read by CC directly, not merely accepted from a fork). No fork modified any file; each was explicitly scoped to read-only research on a disjoint slice of the codebase (grep inventory; weather-voice/threshold trace; aurora/static-content trace), and none overlapped the others' file sets.

**Source reading (J3)** — corrected in v2, R2: `WebFetch` returns a model-processed extract of the page, the same general class of tool used for the fork delegation below, not a raw/unprocessed byte-for-byte fetch. It was used because it was the available tool for reading these pages; short quotes were kept per J3 specifically because of that, and the substantive content (author/date, the Beaufort table rows, the formula, the 3-second/1-second gust sentences) was independently re-confirmed by Jonesy's own re-fetch in the v1 result review, so the extraction is corroborated, not merely asserted:
```
WebFetch https://www.vedur.is/vedur/frodleikur/greinar/nr/349  (×2 — second call specifically for the full 13-row Beaufort table)
WebFetch https://www.vedur.is/vedur/frodleikur/greinar/nr/1098
WebFetch https://www.vedur.is/vedur/frodleikur/greinar/nr/936
WebFetch https://open-meteo.com/en/docs  (×2 — second call specifically for the wind_speed_unit parameter-name question)
```

**Direct code reads (by CC, not delegated), to resolve exact function signatures for the reference-case script and to independently verify fork claims:**
```
Read src/lib/routeRisk.js
Read src/lib/hazardWindow.js
Read src/lib/auroraScoring.js (lines 200-290)
Grep "high_wind|windSpeed.*>=|HIGH_WIND" src/lib/auroraScoring.js
Read src/config/hazards.js
Read src/lib/forecastNormalize.js
Grep "export function classifyRouteRisk|export function detectHazardWindow|export function scoreAuroraVisibility|export function estimateRouteRisk" src
Grep "estimateRouteRisk" src
Grep "export" src/lib/weatherVoiceEngine.js src/lib/forecastNormalize.js src/lib/weatherVoiceRules.js
Read src/lib/weatherVoiceEngine.js (lines 80-140)
Grep "\bN1\b" docs
Read docs/planning/expert-support-2026-10-14-proposal.md
```

**Reference-case script (J9 — read-only, real functions, no application/test mutation):**
```
node docs/ai/tasks/ticket-437/reference-cases-script.mjs
  (first run failed: ERR_MODULE_NOT_FOUND on a relative-path miscount — fixed the import depth)
  (second failure: weatherVoiceEngine.js imports ./weatherPresentation with no extension,
   which plain Node ESM cannot resolve the way Vite does at build time — wrote a tiny
   scratch-only ESM loader, esm-ext-loader.mjs, that appends ".js" only when the default
   resolver fails on an extensionless relative specifier, solely so this read-only script
   could import the real, unmodified functions directly)
node --experimental-loader=./docs/ai/tasks/ticket-437/esm-ext-loader.mjs docs/ai/tasks/ticket-437/reference-cases-script.mjs > docs/ai/tasks/ticket-437/reference-cases-output.txt 2>&1
sha256sum src/components/... (not applicable here; see hash list above)
```
Final exit code `0`; full output retained at `reference-cases-output.txt` and transcribed into `reference-cases.md`.

**Post-research baseline re-check:**
```
git status --short
git diff --check
git rev-parse HEAD
```

## What was NOT examined (explicit, per J14 — unsampled is listed, not omitted)

- Live Open-Meteo request/response behavior for the `windspeed_unit` vs `wind_speed_unit` parameter question (F-01) — no provider API probe performed, per the STOP rule. ~~This is the single most consequential unresolved item~~ **SUPERSEDED by v2, see B1 below and research-report.md F-01**: a retained #450 sample showed this parameter honoured on the public host, so this is now a narrow, low-priority remaining gap (keyed host only), not the top item. The current, accurate framing and the Recommendations it drives are in research-report.md.
- Database-stored blog post content (Postgres `blog_posts` table) — not queried.
- Any CDN/edge-cache layer in front of Vercel — not inspectable from the repository alone.
- `relocationEngine.js`'s `getRoughWeatherWindow` and `RoutePlannerCard.jsx:987`'s `maxSeverity==="high"` consumer — found during tracing, not traced to full depth (time-boxed; flagged rather than guessed at).
- `docs/analytics/`, `docs/lessons/`, `docs/payments/` — not searched in the J7 term sweep.
- The ~60 historical `docs/ai/tasks/**` ticket folders that matched `vind*` — listed as a class (AI-workflow history, not a live product surface), not enumerated per-file.
- A `scoreAuroraVisibility` fixture that reaches the `"scored"` branch with the wind flag isolated — the fixture built for reference-cases.md RC-18 landed in the function's `"not_viewable_tonight"` short-circuit instead; the threshold/comparator itself was still confirmed by direct code read (VERIFIED), just not re-observed via a passing live case in this round.
- Per-term individual hit counts for `kaldi`/`gola`/`allhvass` standalone (folded into a combined regex sweep).
- No live `gh`/GitHub mutation of any kind was performed — issues #437/#142/#117/#436 were only read.

## Limitations

- This is a staged-snapshot research pass against one commit; ~~voice-caller and Open-Meteo live semantics beyond what the public docs state are untraced~~ **SUPERSEDED by v2, see B1 below and research-report.md F-01/F-10**: the voice-caller chain WAS traced (INV-F01a-e) in v1 and confirmed by Jonesy's own independent re-check; what remains untraced is specifically the Open-Meteo keyed-host/post-2026-10-19 behavior, now correctly scoped and narrowed in research-report.md F-01/F-10 rather than described as a broad, general gap.
- The Expert Support meeting excerpt (source-register.md SRC-05) is an owner-supplied paraphrase, not a verified transcript, and is not formal Veðurstofan validation of this app's model — used once, attributed, not relied on as evidence for any finding.
- All **three** forks' tool-call output is not reproduced verbatim in this report (their full transcripts exist in this session's background-task logs, not in the repo) — corrected in v2, R3: v1 inconsistently said "three parallel research subagents" in one place and "three of the four forks" in another; there were three forks throughout, no fourth existed. Every specific claim taken from the forks that feeds a finding was independently cross-checked by CC via direct `Read`/`Grep`/`sha256sum` against the same HEAD, and no unverified fork claim is presented in research-report.md without that cross-check (the one exception, explicitly labelled as such pre-correction in reference-cases.md RC-18, was the aurora wind-flag fixture limitation — now itself fixed in v2, see below). Specifically fork-sourced (not independently re-derived by CC from a direct read in this round): the J7 search-term hit-count table (inventory.md), the `weatherVoiceEngine`/`forecastNormalize` call-chain narrative in INV-F01 (independently spot-checked by CC's own direct reads of `routeRisk.js`, `hazardWindow.js`, `forecastNormalize.js`, `hazards.js`, `auroraScoring.js` for the threshold register), and the static/generated share-page file inventory (F-08) — CC directly re-counted the `wind_extreme`/`wind_strong` manifest entries and `public/share/` files as part of this v2 round's own B3 tracing, confirming the fork's count.
- No full `npm run test:run`/lint/build was run — not required for this docs-only ticket per the validation section of approved-prompt-v1.md, and none was needed since no source file changed (confirmed by the unchanged HEAD and clean `git status`/`git diff --check` above).

## Scope confirmation

No application/test/config file was created, edited, or deleted. The only new files are the five research deliverables plus the three retained reference-case-harness files, all under `docs/ai/tasks/ticket-437/`. No GitHub issue was created, edited, or closed. No commit, push, deploy, or account/provider operation was performed.

---

## v2 Correction — 2026-10-23

Executed `docs/ai/tasks/ticket-437/approved-prompt-v2.md` (B1-B3/R1-R7 from Jonesy's v1 result review). **No new subagents/forks used this round, per the correction prompt's explicit instruction** — all work below was done directly by CC. **No source/test/config/copy/threshold change. No live probe.** Status: research reviewed, no application change, no official endorsement.

### Baseline (re-checked per the correction prompt)

- `git rev-parse HEAD` before this round: `ffb10f3c4dde606d956b54ff83e81a9ec2e2d3aa`. After all edits below: **unchanged**, `ffb10f3c4dde606d956b54ff83e81a9ec2e2d3aa`.
- `git status --short` before and after: identical — `M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-437/`. No tracked application file appears at any point.
- `git diff --check`: clean, before and after.

### B1 disposition (re-graded F-01)

Read `docs/ai/tasks/ticket-450/samples/manifest.md` directly (confirmed the retained sample's own provenance: public host, exact URL with `windspeed_unit=ms`, retrieval UTC 2026-10-19 17:47:22Z, EXACT-graded per the manifest's own grading scheme). Loaded `openmeteo-baseline-4point.json` directly (`node -e` one-liner, repo root) and read all four locations' `hourly_units`/`daily_units` for `windspeed_10m`/`windgusts_10m`/`windspeed_10m_max`/`windgusts_10m_max` — all `"m/s"`. Cross-checked the sample's own SHA-256 against `manifest.md`'s table (`035e26676f2d54a58db5c24436f99850cf5e0afdd3759a40e7834f6566ebf0cd`) — matched. Re-read `api/_lib/openMeteoAuth.js`'s fail-closed production policy (from this session's own earlier #453 work) to state the keyed-host gap correctly, and deliberately did NOT repeat Jonesy's own mistaken aside about a "public-host retry" after keyed failure (Ripley's final assessment flagged that aside as wrong; #453 has no such fallback). Research-report.md's F-01 is re-graded and moved later in reading order (same ID, see that file's v2 correction note and finding text); inventory.md's INV-P01/INV-P02 discrepancy paragraph and the Recommendations table (O-1/O-6) are updated to match.

### B2 disposition (Hvassviðri / Beaufort row 8)

Re-read `src/i18n/weatherVoice/safety.js` in full (hash unchanged from v1, `907675f4…8ddd8fa1d83f00`) to get the exact IS/EN strings and their `condition`/`voice_level` keys. Re-confirmed the trigger thresholds from `weatherVoiceEngine.js:102,110` (already hashed in v1). Re-fetched `https://www.vedur.is/vedur/frodleikur/greinar/nr/349` a third time (first two reads were in v1) specifically to re-confirm all 13 Beaufort rows including row 8 verbatim, now reproduced in full in `source-register.md`. Updated `inventory.md` INV-F03 and `research-report.md`'s F-02 extension; restated recommendation O-2 (previously built on the wrong premise) and added the #436/N1 constraint to O-3/O-4 per J13.

### B3 disposition (missing surfaces)

Direct reads/greps, all by CC in this round:
```
Grep "getWeeklyShelterScore|weatherFinderAvgWind|meðalvindur" src
Read src/lib/shelterUtils.js (lines 60-100)
Read src/components/WeatherFinderCard.jsx (lines 1-35)
Read src/lib/weatherFinderRanking.js (lines 1-56 and context)
Read src/i18n/translations.landing.js (lines 135-170, 340-375, and the landingStat1Value/landingBenefit1Text lines)
Grep "routeWarning|routeRiskMedTooltip|routeEscapeStorm" src/i18n
Grep "routeEscapeStorm|routeRiskMedTooltip|routeWarningHigh" src/components
Grep "nlHighWindNote|high_wind" src --glob "*.jsx"
```
Added `inventory.md`'s new "Additional surfaces" table (INV-A01 through INV-A08) and the two new threshold-register rows (INV-T14 `shelterUtils.js` `WIND_REF=15` on mean-of-daily-maxima; INV-T15 `weatherFinderAvgWind` on the same ambiguous `windMax` basis as F-02). Corrected INV-S04's false "zero matches" claim for campaign/landing copy. Found incidentally, not separately investigated: `comparisonLessWind: "Minni vindur"` on the public landing page appears to be exactly the pattern CLAUDE.md's own "Semantic Weather Labels" section says to avoid (prefers "Rólegra") — flagged in research-report.md's owner-decisions list, not fixed (out of this research's wind-classification scope).

### R1-R7 disposition (non-blocking, all fixed)

- **R1**: re-read `translations.routePlanner.js` lines 245-247 (confirmed EN) and 598-600 (confirmed IS) directly; the v1 report had the language labels swapped. Fixed in research-report.md F-03.
- **R2**: `cc-report.md`'s "direct page reads, not summaries" wording corrected above to describe `WebFetch` accurately as a model-processed extraction.
- **R3**: fork-count language made consistent ("three" throughout, no "fourth" fork ever existed); which specific claims rested on fork output vs. CC's own direct re-reads stated explicitly, above.
- **R4**: `reference-cases.md` RC-18 rebuilt on a real scored-branch fixture reused read-only from `src/lib/auroraScoring.test.js` (hash `0a7699138bf95acb131756691a5078422876a575735a6714f0127bb91c3f5530`); rerun, now explicitly asserts `status==="scored"` before concluding about the `high_wind` flag at 11.9/12/null. See command log below.
- **R5**: research-report.md F-02 corrected from "the mildest active tone" to "a mild, sarcastic-tone result (severity 1)," with an explicit note that `good`/`excellent` (severity 0) are milder still, and that the hour-of-day weighting only applies on the hourly-data-present branch (frequency of the fallback branch in production is UNKNOWN).
- **R6**: the named individual/employer is now stated once, in `source-register.md` SRC-05 only; research-report.md's Provenance section now just cross-references SRC-05.
- **R7**: per-term counts were not produced as a literal one-row-per-term table in v1 or this round; `inventory.md`'s J7 summary table states the exact group definitions used (e.g. "IS storm/rok family (storm*, rok, óveður, ofsaveður, fárviðri, stinnings*, kaldi, gola, strekk*, blást*, allhvass*, hvassviðri, stórviðri)" as one combined 23-file count) — stated here explicitly so the grouping basis, not a false claim of per-term granularity, is the record. Cross-reference added: `source-register.md` SRC-08 now cites `docs/ai/tasks/ticket-450/samples/vedur-parameters-aws-hour.json`'s `f`/`fx`/`fg`/`fgfx` definitions, bearing on F-06/F-07.
- **Challenges section** (Jonesy's non-blocking prose notes): finding order corrected (F-02/F-03 now precede the demoted F-01); F-07's speculative "direction of gust bias" sentence removed, replaced with the sample-duration-vs-aggregation-window distinction from SRC-08; #436/N1 own-assessment-tone caveat added to options O-3 and O-4.

### Commands run this round (exact, in addition to the B1-B3 reads above)

```
git rev-parse HEAD
git status --short
git diff --check
find docs/ai/tasks/ticket-450/samples/ -type f
node -e "<inline script reading manifest.md's own hash table and openmeteo-baseline-4point.json's hourly_units/daily_units fields>"
node -e "<inline script reading vedur-parameters-aws-hour.json's f/fx/fg/fgfx definitions>"
sha256sum src/i18n/weatherVoice/safety.js src/lib/shelterUtils.js src/i18n/translations.common.js \
  src/i18n/translations.landing.js src/i18n/translations.northernLights.js src/components/WeatherFinderCard.jsx \
  src/lib/weatherFinderRanking.js src/components/AuroraNightOutlook.jsx src/components/NorthernLightsCard.jsx \
  src/lib/auroraScoring.test.js docs/ai/tasks/ticket-450/samples/openmeteo-baseline-4point.json \
  docs/ai/tasks/ticket-450/samples/openmeteo-baseline-headers.txt docs/ai/tasks/ticket-450/samples/vedur-parameters-aws-hour.json \
  docs/ai/tasks/ticket-450/samples/manifest.md api/_lib/auroraDecision/openMeteo.js api/forecast.js src/lib/forecastCache.js
node --experimental-loader=./docs/ai/tasks/ticket-437/esm-ext-loader.mjs docs/ai/tasks/ticket-437/reference-cases-script.mjs > docs/ai/tasks/ticket-437/reference-cases-output.txt 2>&1
```
Exit code `0`; full output re-saved to `reference-cases-output.txt`. Post-edit baseline re-check (`git rev-parse HEAD`, `git status --short`, `git diff --check`) repeated and unchanged (see Baseline above).

### Newly cited file hashes (v2 round)

```
907675f4c692e4e311d0cae86feede67cca464825b71f81c0f8ddd8fa1d83f00  src/i18n/weatherVoice/safety.js (unchanged from v1)
58983ee6253fc5ce37fab0ab89418a682c027bd8e50c42c37ae8cfa28bac4b3c  src/lib/shelterUtils.js
6956c6e04424ab61d8eb0934ef60068ab1e4ac8e3e484ae59abf268193da8ebd  src/i18n/translations.common.js
5df1cddb28cf763e1b54e680648bb1e3240d942645bd052d12f2f2e0bac8f3ec  src/i18n/translations.landing.js
6c5cd450752568c75faa9015c7ec900b63050dc54b9f329be941b530eb928461  src/i18n/translations.northernLights.js
2021186f9ed0b7befe510785e4d93b2063231595df490ad0cc31aeaf88579137  src/components/WeatherFinderCard.jsx
47ede9f2cbc7e904e6b979b5e26a7d4af2ae122e9b678f69241456b468b4d9bd  src/lib/weatherFinderRanking.js
f7d88ca25c93f168380bb57d306a58da5eb8ff3949c3c69bea3da1200d8dd328  src/components/AuroraNightOutlook.jsx
3b5157bf4d92b63d8495ea6e96da9dbbe16255c0a32b1a46805ba0b857407f94  src/components/NorthernLightsCard.jsx
0a7699138bf95acb131756691a5078422876a575735a6714f0127bb91c3f5530  src/lib/auroraScoring.test.js
035e26676f2d54a58db5c24436f99850cf5e0afdd3759a40e7834f6566ebf0cd  docs/ai/tasks/ticket-450/samples/openmeteo-baseline-4point.json (matches manifest.md)
76089c4ec503d2a56d804c809311c5f2ca82ddb28cf57c66eea5fe319ea7b364  docs/ai/tasks/ticket-450/samples/openmeteo-baseline-headers.txt
f1b0fd06228e372d51fb9afaf3f1a4b86572f7169033180662384cb71524cfe3  docs/ai/tasks/ticket-450/samples/vedur-parameters-aws-hour.json (matches manifest.md)
1a2a7c868dfbd177481137394527bd77bcf77913da4da4a5ca7e26e9a0600a49  docs/ai/tasks/ticket-450/samples/manifest.md
ef47c67f199bf9bba97b457b300ca1d333639ebf87935a07d0e6eb0672146804  api/_lib/auroraDecision/openMeteo.js (unchanged from v1)
1c81af478fec1b34a2e97b26fc3cec1e1d1911d699c30a23a720a9e439b508fe  api/forecast.js (unchanged from v1)
4cf5e9b64ac900e9ae7bf09eb1013b41b988b7135f55fa728b139074506c78e0  src/lib/forecastCache.js (unchanged from v1)
```

### What was NOT examined this round (in addition to v1's list, still standing)

- A live request to either Open-Meteo host — not performed; F-01's keyed-host question remains open, now correctly scoped as low-priority (see research-report.md Recommendations O-1).
- The CDN/edge-cache question (F-08) — unchanged, still UNKNOWN.
- Database-stored blog content — unchanged, still UNKNOWN.
- Real per-term (as opposed to grouped) search hit counts — not produced; see R7 above for why and what the grouping basis is instead.

**Status: research reviewed. No application change. No official endorsement.**

---

## v3 Correction — 2026-10-23

Executed `docs/ai/tasks/ticket-437/approved-prompt-v3.md` (N1-N4, narrow, from Jonesy's v2 re-check). **No new subagents/forks. No source/test/config/copy/threshold change. No live probe.** Status: research only; no code change or official endorsement.

### Baseline (re-checked)

- `git rev-parse HEAD` before this round: `ffb10f3c4dde606d956b54ff83e81a9ec2e2d3aa`. After all edits below: **unchanged**, `ffb10f3c4dde606d956b54ff83e81a9ec2e2d3aa`.
- `git status --short` before and after: identical — `M docs/ai/CURRENT.md`, `?? docs/ai/tasks/ticket-437/`.
- `git diff --check`: clean, before and after.

### N1 disposition (forecast-table/recommendation surfaces)

Direct reads/greps, all by CC, no fork delegation (per the correction prompt's explicit ban on new subagents this round):
```
Grep "windMaxShort|labelWind|labelGust|comparisonFactorWind|comparisonFactorGusts|comparisonHrCalmerGust|windLabel\b" src
Grep '"windMax"|t?\.\("windMax"\)|"windGust"|t\?\.\("windGust"\)' src --include="*.jsx" --include="*.js"
Read src/components/ForecastTable.jsx (lines 275-315, 375-390, 515-540)
Read src/App.jsx (lines 518-532)
Read src/components/Top5Leaderboard.jsx (lines 445-465)
Read src/components/HourlyForecastModal.jsx (lines 55-100, 395-415, 360-365)
Read src/components/CampsiteComparisonSection.jsx (lines 60-90)
Grep "windMax|windGust|avgWind|wind" src/lib/comparisonUtils.js -i
Read src/lib/comparisonUtils.js (lines 1-55)
Grep "primaryKey" src/components
Grep "icReasonCalmer|icWindDelta|wind: t\(" src
Grep "wind" src/hooks/useFreeRecommendation.js -i   (zero matches — checked-clear, not an omission)
sha256sum src/components/ForecastTable.jsx src/components/HourlyForecastModal.jsx src/components/Top5Leaderboard.jsx \
  src/components/CampsiteComparisonSection.jsx src/lib/comparisonUtils.js src/components/HomeDecisionCard.jsx \
  src/components/InstantComparison.jsx src/hooks/useFreeRecommendation.js src/App.jsx
```
Found: `ForecastTable.jsx`'s main homepage wind column is a 7th consumer of F-02's ambiguous `windMax` basis (previously untraced); a previously-unregistered 15 m/s gust-badge-visibility threshold (INV-T16); `HourlyForecastModal.jsx`'s hourly wind/gust rows are raw, unambiguous (a clean contrast case); `Top5Leaderboard.jsx`'s `windLabel` is a direction label, not speed (confirmed benign); `CampsiteComparisonSection.jsx` uses the already-documented (CLAUDE.md) raw-daily-field path; and, most significantly, `comparisonUtils.js`'s `avgWind` (feeding the homepage's own canonical `HomeDecisionCard`/`InstantComparison` decision surface) is an 8th-9th consumer of the same ambiguous basis, gated by a previously-unregistered 1.5 m/s threshold (INV-T17) the file's own comment says is deliberately independent of every other threshold in this register. Also found, incidentally: `icWindDelta: "{pct}% minni vindur"` sits directly next to the CLAUDE.md-compliant `icReasonCalmer: "Rólegra"` on that same canonical card — the same discouraged pattern as the landing page's `comparisonLessWind` (found in v2), now also on the primary homepage surface. Added as inventory.md INV-A09 through INV-A15 and INV-T16/INV-T17; `useFreeRecommendation.js` recorded as checked-and-clear, not silently omitted. No consumer was left untraced within this bounded correction's scope — the N1 surfaces named in the correction prompt are now either in the matrix or (none were) left as UNKNOWN.

### N2 disposition (arithmetic correction)

Recomputed by hand and verified: cautious trigger `10 < windMax <= 15` → deficit from 17,2 in **[2,2, 7,2)**; serious trigger `windMax > 15` (no upper bound) → deficit is in **(0, 2,2)** only for `15 < windMax < 17,2`, and is **zero or negative** (i.e. AT or ABOVE row 8) for `windMax >= 17,2`. research-report.md's F-02 extension rewritten with these exact inequalities, replacing the v2 "6-9 m/s short" claim, and explicitly states that "Mjög hvassviðri" does not correspond to any single bounded severity range, since its trigger is open-ended above 15.

### N3 disposition (visible supersession markers)

Two specific v1 bullets in this file, identified by Jonesy as still reading as current advice, now carry inline `~~strikethrough~~` + **SUPERSEDED by v2, see B1** markers pointing to the corrected text: the "single most consequential unresolved item" line (under "What was NOT examined") and the "voice-caller and Open-Meteo live semantics... untraced" line (under "Limitations"). See those two sections above for the exact wording.

### N4 disposition (Production/keyed-host framing)

research-report.md's F-10 reworded (it previously could read as if `windspeed_unit` behavior were un-probed in general; now explicit that only the keyed-host/post-2026-10-19 case is unprobed, the public-host 2026-10-19 case is VERIFIED SAMPLE). F-01 itself gained an explicit "Precise Production framing" paragraph: `openMeteoAuth.js` routes to the keyed host when a key is configured and fails closed in Production with no public-host fallback when no key is present (re-confirmed directly from that file, not merely asserted); the retained SRC-07 sample is public-host evidence only, describing the non-production (or misconfigured, fail-closed) path, not proof of current production behavior when a key IS configured; whether a key is actually configured in live production, and what the keyed host currently returns, are owner-reported operational facts this research cannot independently verify. The "Unresolved questions" list's F-01 bullet updated to match.

### Files touched this round

Only `research-report.md`, `inventory.md`, and `cc-report.md` under `docs/ai/tasks/ticket-437/` — no new hashes needed beyond the N1 surface files listed above (`source-register.md` was not edited this round; no new primary source was read, per the correction prompt's "no new sources" instruction). No reference-case script rerun — its content/input claims did not change this round, per the validation note's "no rerun needed unless" clause.

### What remains (unchanged from v2, restated for completeness)

- F-01's keyed-host/post-2026-10-19 question — UNKNOWN, now precisely scoped (N4).
- Database-stored blog content — UNKNOWN.
- The CDN/edge-cache question (F-08) — UNKNOWN.
- Real per-term (vs. grouped) search hit counts — not produced (R7, v2).

**Status: research only. No code change. No official endorsement.**
