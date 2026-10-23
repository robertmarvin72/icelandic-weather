# #437 — Result review (Jonesy)

## Jonesy result review v1 — 2026-10-23

**Verdict: REVISE (documentation only, targeted).** Scope discipline, baseline hygiene and most evidence are good. Two of the report's headline conclusions do not hold against material that is already in the repo or in the report's own source register, and the inventory misses surfaces the approved prompt named. Nothing here needs code, a provider probe or new sources beyond re-reading pages CC already read. Fix B1–B3 and R1–R7 in a v2 of the deliverables; I will re-check narrowly.

Grades: VERIFIED SOURCE = read in the staged checkout this turn; VERIFIED SAMPLE = retained repo sample or web fetch through a summarising tool; INFERRED; UNKNOWN.

### What I verified (holds)

- **Hashes:** I re-staged all 17 files in cc-report's SHA-256 table from the owner's checkout and ran `sha256sum -c`: **17/17 OK**. So file:line citations are reviewable against the same bytes. VERIFIED SOURCE.
- **Scope:** `docs/ai/tasks/ticket-437/` holds only the five research deliverables, the three harness files (`reference-cases-script.mjs`, `esm-ext-loader.mjs`, `reference-cases-output.txt`), my/Ripley's review files and the pre-existing ticket-440 pointer. The staged `src/`, `api/` and `vercel.json` files I read all have modification times earlier than the approved prompt (latest: `api/forecast.js`), consistent with CC's "no source change". I did not run git; HEAD and `git status` are CC's statement only.
- **Reference cases reproduced.** I staged `weatherPresentation.js` plus the files the script imports and ran CC's own `reference-cases-script.mjs` with the same loader in my sandbox (Node 22, not the owner's machine and not the app build). Output is **identical** to `reference-cases-output.txt` apart from where Node's loader warning went (stderr vs stdout). RC-03/05 (14 → MED, 18 → HIGH), RC-15a/b/c (six hazard hours from wind 14 and from rain 12 alone both give `stormyPeriod`, 2 h at 20.8 gives `passingStorm`), RC-16, RC-17 (all fetches null → `LOW`, 0/0/0) and RC-21a/b/c (18 m/s at 14:00 → `extreme_wind`/`wrecked`/3; at 02:00 weighted to 8.1 → `sun_wind`/`suspicious`/1; no hourly → `extreme_wind`) all reproduce. I also re-read `forecastNormalize.js:16-21,55-66`, `weatherVoiceEngine.js:102,110` and `weatherVoiceRules.js:23-25`: the mechanism matches F-02/F-03/F-04. Findings F-02, F-03 (mechanism), F-04, F-05 (all five patterns; I confirmed `scoring.js:57` `const v = w ?? 0`) are **VERIFIED**.
- **Call chain (INV-F01a–d):** `App.jsx:310`, `useForecast.js:158`, `useWeatherVoice.js:166-170` match. The voice runs on the home page for today's row only (`enabled: … page === "home"`), which is useful exposure context.
- **Official sources:** I re-fetched nr/349 and nr/936. Author/date (Baldur Ragnarsson 10.8.2006; Trausti Jónsson 22.5.2007), the formula `V = 0,836·B^(3/2)`, `1 m/s = 3,6 km/klst = 1,944 hnútar`, the *vindhviða* entry ("Skammvinn vindgusa") and the 3-second / 1-second sentences all match SRC-01 and SRC-03. VERIFIED SAMPLE (same summarising tool class as CC's; see R3).
- **F-08:** manifest has 0 `wind_extreme`/`wind_strong` entries and 176 `sun_wind` mentions; `public/share/tjaldur/v1/en/` contains `wind_extreme_01–05` and `wind_strong_01–03` as html+png (16 per language, 32 total); `vercel.json` has no rule gating `/share/`. Matches the report. VERIFIED SOURCE (CDN layer not examined, as stated).
- Honest limitation handling is good: RC-18's failed aurora fixture, the unexamined blog DB and `relocationEngine` are all disclosed.

### Blocking

**B1 — F-01 (HIGH, "UNKNOWN provider behaviour", owner decision #1, O-1/O-6) is contradicted by retained evidence the report did not consult.**
The report says the main forecast path sends the "legacy" `windspeed_unit=ms`, that Open-Meteo's behaviour for it is unresolvable without a live probe, and that if it is ignored the app would see 3.6× values in a "severe, systemic" bug. But `docs/ai/tasks/ticket-450/samples/openmeteo-baseline-4point.json` is a retained live response (manifest: `api.open-meteo.com`, public host, **exact URL with `temperature_unit=celsius&windspeed_unit=ms&precipitation_unit=mm`**, response `Date` 2026-10-19 17:47:22Z). I loaded it: all four returned points have `hourly_units.windspeed_10m`, `hourly_units.windgusts_10m`, `daily_units.windspeed_10m_max` and `daily_units.windgusts_10m_max` = **"m/s"**, with daily maxima between 1.18 and 16.9 (km/h-scale values would be 3.6× larger). My #452 Round 1 review recorded exactly this ("VERIFIED SAMPLE for the legacy name only", `ticket-452/prompt-review.md:68`), and the approved prompt told CC that #450/#452 histories are retained. CC cited neither. VERIFIED SAMPLE.
What remains genuinely open is narrower: (a) the **keyed** host. `api/forecast.js` now builds the upstream from `auth.host` (#453, customer-api when a key is set, with public-host retry) and the sample covers the public host only; (b) behaviour after 2026-10-19; (c) the main path has no `hourly_units` runtime guard while the aurora path does (defence-in-depth gap, VERIFIED SOURCE). The test comment at `openMeteo.test.js:61` ("legacy … must never be sent") is a #452 design rule for the aurora module, not evidence of a provider failure.
Required: re-grade F-01 to "parameter-name inconsistency + no runtime unit guard on the main path; legacy name VERIFIED SAMPLE honoured on the public host 2026-10-19; keyed-host behaviour UNKNOWN"; drop "severe, systemic over-sensitivity bug" and the 3.6× scenario as the headline; move it out of the top rank; rewrite owner decision #1 and O-1/O-6 accordingly. A concrete zero-new-probe check to offer the owner: open the production app, read `daily_units`/`hourly_units` in the existing `/api/forecast` response in the browser Network tab. That is observation of normal traffic, not a provider probe, and it covers the keyed path. CC was right to be careful about live probes; the error is not reading the repo's own evidence.

**B2 — J4 case 1 (`safety.js`) was not assessed, and the report's "cleaner / no Beaufort-named term" grade is contradicted by SRC-01.**
*Hvassviðri* is a Beaufort row (**8, Hvassviðri (hvasst), 17,2–20,7 m/s**) in nr/349 and nr/1098. The report calls `safety.js`'s copy "cleaner — no Beaufort-named term used" (INV-F03, F-03 last paragraph) and builds **O-2** ("retain wording that already avoids defined terms") on it. Both are wrong on the report's own source. In addition, the actual trigger was never put next to the table: the cautious copy "Hvassviðri er í spánni" fires at time-weighted `windMax > 10` (table: kaldi 8,0–10,7 / stinningskaldi 10,8–13,8) and the serious copy "Mjög hvassviðri" at `> 15` (table: 15 m/s falls in allhvass vindur 13,9–17,1; hvassviðri starts at 17,2), on today's row on the home page. This was my Round 1 gap 3 and J4 required both cases graded separately for (a) copy+rule and (b) user exposure. The register also quotes only Beaufort rows 9–12 and says "full table in research-report.md §Beaufort reference table"; **no such section exists** (grep), so the 13-row table is not in any deliverable.
Required: add the full 13-row Beaufort table with the source's decimal notation to SRC-01; add a finding (or extend F-02/F-03) for the voice-copy term/threshold ambiguity, graded (a) VERIFIED copy and rule, (b) exposure per the traced chain; keep the wording "term/colloquial ambiguity", note that *hvassviðri* has an everyday sense (the glossary says so for *ofsaveður*); fix INV-F03; restate O-2 so it does not claim safety.js avoids defined terms (it may still be the milder pattern; say why on evidence). No threshold proposal.

**B3 — Inventory/register incomplete against J2, J6, J7 and the prompt's named entrypoints.**
- `src/lib/shelterUtils.js:76-86` (`getWeeklyShelterScore`): literal `WIND_REF = 15 // m/s where we treat it as "very windy"`, applied to `avgWind = mean(daily windspeed_10m_max)`, returned as `avgWind`. A wind cut-off on a fifth quantity (mean of daily maxima) with an "avg" name. Not in the threshold register. VERIFIED SOURCE.
- `weatherFinderAvgWind` (`translations.common.js:460` EN "avg wind" / `:1053` IS "meðalvindur"): not traced anywhere in the deliverables (grep: no hit). *Meðalvindhraði* is a defined concept in SRC-03; I flagged this in Round 1 item 5. Need what number is averaged and where it is displayed.
- `INV-S04` says `CampaignLandingPage.jsx` has "zero wind/storm matches". The campaign/landing **copy** lives in `src/i18n/translations.landing.js`: `landingStat1Value`, `landingBenefit1Text`, mock figures `comparisonCurrentGust "20 m/s"` / `comparisonBetterGust "10 m/s"` (lines 158/163 EN, 363/368 IS), campaign headlines about wind and gusts, and the "stormy period" demo line (`landingAdvisorMoveExtra`, EN 141 / IS 347: "A longer storm period is likely on Route 1…" / "Lengra stormaskeið er líklegt…"). That is public marketing exposure of the same *stormaskeið* wording and must be recorded. The "zero matches" row is a false negative.
- Aurora copy `nlHighWindNote` ("Windy conditions expected…", `translations.northernLights.js` EN 78 / IS 295) is the user-visible output of the 12 m/s flag; the threshold row (INV-T09) has no copy/exposure link.
- The inventory is a set of thematic tables, not the per-surface matrix J2/contract item 2 describes. Missing rows include the forecast table and recommendation surfaces, `routeWarning*` and `routeRiskMedTooltip` copy ("Wind may affect driving conditions along the route."), `routeEscapeStorm*` ("Escape the storm" / "Forðastu óveðrið"), and the aurora flag copy. One row per surface with IS/EN copy, key, quantity and status is enough; unsampled surfaces must be listed UNKNOWN.

### Required, non-blocking (fix in the same v2)

- **R1.** F-03 cites the EN copy "A longer stormy period is expected" at `translations.routePlanner.js:598-600`. Those lines are the **IS** strings; EN is `:245-247`. (INV-F02 has both ranges but attaches the wrong language label.)
- **R2.** `cc-report.md` calls the Veðurstofan reads "direct page reads, not summaries". `WebFetch` returns a model-processed extract (the same class of tool I used), which is why J3 asked for short quotes. State it as "extracted via WebFetch; quotes short; I rechecked" and drop the "not summaries" claim. My re-fetch confirmed the substantive content (see above), so this is wording, not substance.
- **R3.** `cc-report.md` says "three parallel research subagents" and later "three of the four forks". Make the count consistent and say which claims rested on fork output; you already cross-checked the hashes, which I confirmed.
- **R4.** RC-18 never reached the `"scored"` branch, so the `>= 12` flag comparator was not observed. `src/lib/auroraScoring.test.js` has scored-branch fixtures; reuse one (read-only) and add the 11.9 / 12 / null cases. J9 listed `scoreAuroraVisibility`.
- **R5.** F-02 says the night case yields "the mildest active tone"; `good`/`excellent` are severity 0. Say "a mild sarcastic tone (severity 1)". Also state that the hour-of-day dependence only applies when hourly data is present (that is the branch where the weights apply); how often hourly is absent is UNKNOWN.
- **R6.** J12: the named individual and employer appear in both `research-report.md` (Provenance) and `source-register.md` SRC-05. One attribution line in one file was the instruction; keep SRC-05, reduce the report to "owner-supplied Expert Support paraphrase (SRC-05)". Ripley's clarification allows the owner-supplied timestamps; that part is fine.
- **R7.** J7 asked for hit counts per term; the inventory gives grouped counts. Acceptable if the group definitions are exact and a per-term table is in `cc-report.md`; otherwise say per-term counts were not produced. (Cross-reference suggestion, non-blocking: `ticket-450/samples/vedur-parameters-aws-hour.json` defines Veðurstofan's own observation fields: `f` = 10-min average, `fx` = highest 10-min average in the hour, `fg` = highest 3-s value in the hour. It is a retained primary-source sample that bears directly on F-06/F-07 and on forecast-vs-observation; cite it in the register.)

### Challenges

- The report ranks an unresolved provider-contract question above two reproduced behaviours (F-02, F-03). With B1 corrected, the order should be F-02/voice term-threshold ambiguity, F-03, F-04/F-05, then the unit-guard gap. The owner's first decision should be about wording and basis, not about a probe.
- F-07's last sentence ("can be lower than some sharp 3-second bursts … or can appear to linger") is speculation about direction; the supported claim is only the time-basis difference. Trim it.
- Options table: O-4 ("show neutral numeric gust values") and O-3 each deserve one line on #436 own-assessment tone (shown numbers next to a link to vedur.is must not read as an official alert). J13 asked for this; it is only implied.

### Acceptance for v2

B1–B3 corrected in `research-report.md`, `inventory.md`, `source-register.md` (and `reference-cases.md` for R4/R5); `cc-report.md` updated with the commands for anything new (including the re-read of the #450 sample and the new greps), updated hashes for any newly cited file (`shelterUtils.js`, `translations.landing.js`, `translations.northernLights.js`, `translations.common.js`), and a repeat of the git baseline. No source, test or config change; no probe; no GitHub mutation.

### Limits of this review

- I read a staged snapshot of the owner's files; I did not run git, tests, lint, build or a browser on the owner's machine. HEAD/clean-tree statements are CC's.
- I did not open `relocationEngine.js`, `RoutePlannerCard.jsx`, `api/` beyond `forecast.js` and the aurora `openMeteo.js`, the `public/` pages' contents, or the blog database. I did not check issue text for #437/#142/#117/#436 (SRC-06 rests on CC's `gh` reads).
- My sandbox re-run used the staged files and Node 22; it shows the script is deterministic over those bytes, not that the app behaves the same in a browser build.
- Veðurstofan pages were read through a summarising fetch tool; Open-Meteo docs were not re-read by me. The #450 sample is a point-in-time response for the public host.
- This is a research review. Nothing here approves a wording, threshold or code change.


## Ripley final assessment — 2026-10-23

Verdict: REVISE, research-only. B1–B3 and R1–R7 accepted. Independently parsed #450 retained response: 4 points, hourly windspeed_10m and windgusts_10m all m/s. This contradicts the broad public-host unknown headline; current keyed behavior still unknown. Hvassviðri/source-table and omitted-surface corrections are necessary before research acceptance. Clarification: Jonesy's B1 parenthesis mentioning public-host retry is mistaken; #453 forbids that fallback. v2 must not propagate it.

Read CURRENT, Jonesy review and CC report; inspected affected research claims and script header. No full tests/build needed for documentation-only review; reference-script reproduction in Jonesy's sandbox remains Jonesy-attributed, not independently rerun by Ripley. git status shows CURRENT plus task folder only. Created approved-prompt-v2.md; CURRENT -> READY_FOR_CC. No application edits/probe/commit/push/deploy/GitHub action. No new subagents authorized.


---

## Jonesy v2 re-check — 2026-10-23

**Verdict: REVISE (narrow, documentation only).** B1, B2 and R1–R7 are closed on the evidence. One blocking item remains (N1: required surfaces still missing and not declared UNKNOWN), plus three non-blocking fixes. No code, probe or new source is needed.

Grades as in v1 of this review.

### Correction to my own v1 review

My B1(a) said `api/forecast.js` uses the customer host "with public-host retry". That was wrong, and Ripley's final assessment is right. `api/forecast.js:40-43` says the proxy "never retries on the public host after any keyed-request failure" (my earlier grep truncated the comment before "never"), and `api/_lib/openMeteoAuth.js` returns `failClosed` in Production when the key is missing; its only public-host fallback is a missing key in a non-production environment (`:65-68`). CC's v2 handled this correctly. The keyed-host gap in F-01 stands as CC restated it; the retry clause was my error.

### Verified this round

- **Hashes:** I re-staged the 17 files in the v2 hash list from the owner's checkout (including `shelterUtils.js`, the three translation files, the two Aurora components, `WeatherFinderCard.jsx`, `weatherFinderRanking.js`, `auroraScoring.test.js`, the #450 sample, its headers and manifest, and `safety.js`, `forecast.js`, `forecastCache.js`, `openMeteo.js`): `sha256sum -c` **17/17 OK**. VERIFIED SOURCE.
- **Scope:** `docs/ai/tasks/ticket-437/` contains only research files, the three harness files, `approved-prompt-v2.md` and the review files. All source and api files I staged have modification times earlier than the v1 approved prompt. I did not run git.
- **B1 (F-01):** The report now states: legacy `windspeed_unit=ms` honoured on the public host on 2026-10-19 (VERIFIED SAMPLE, my own parse of the retained sample agrees: all four points `m/s` for hourly and daily wind and gust); keyed-host and post-2026-10-19 behaviour UNKNOWN; the main path still lacks a runtime unit guard (VERIFIED SOURCE); impact LOW-MEDIUM; reading order F-02, F-03, F-04, F-05, F-01. O-1 is now an owner-side look at the existing `/api/forecast` response in the Network tab, not a probe; O-6 is reframed as consistency/defence-in-depth. The old claim is visibly struck, not silently rewritten. CLOSED.
- **B2 (Hvassviðri):** `source-register.md` SRC-01 now holds the full 13-row Beaufort table; I compared it row by row with my own fetch of nr/349 (decimal-comma notation and all ranges identical, row 8 `Hvassviðri (hvasst) 17,2-20,7` marked). F-02's extension places the `safety.js` strings next to the actual triggers (`> 10` and `> 15`, time-weighted or raw fallback), grades it term/colloquial ambiguity, notes the EN strings use no Beaufort-named word, keeps the "by analogy, INFERRED" qualifier for an everyday sense of *hvassviðri*, and restates O-2 without the false premise. INV-F03 corrected. CLOSED, apart from the arithmetic in N2.
- **B3 (partly):** `shelterUtils.js` `WIND_REF = 15` (I read `:83-84`; mean of daily maxima, so INV-T14's "sixth quantity" is right), `weatherFinderAvgWind` (I read `weatherFinderRanking.js` `computeMetrics`: `avgWind = windSum / n` of `day.windMax`, displayed as "meðalvindur"; INV-T15 is accurate), the landing copy (`comparisonCurrentGust` / `comparisonBetterGust`, `landingAdvisorMoveExtra` with "stormaskeið"), `nlHighWindNote` and its two live consumers, `routeWarning*`, `routeRiskMedTooltip`, `routeEscapeStorm*` are now rows INV-A01–A08 / INV-T14–T15, and INV-S04's false "zero matches" is corrected with the reason. `CLAUDE.md` does list "Minni vindur" under labels to avoid, so INV-A03 is accurate (and correctly kept out of the wind-classification findings).
- **R4/R5:** I re-ran the updated `reference-cases-script.mjs` with the same loader in my sandbox (Node 22, staged files, not the owner's machine): output is **identical** to `reference-cases-output.txt`. RC-18 now reaches `status: "scored"` in all three cases (`reachedScoredBranch: true`): 11.9 → no `high_wind`, 12 → `high_wind`, `null` → none. The script imports only the real modules and has no file-write or network calls (`grep`). The R5 wording is fixed.
- **R1–R3, R6, R7:** EN/IS lines now attributed correctly (EN `:245-247`, IS `:598-600`); `cc-report.md` describes WebFetch as processed extraction; fork count is "three"; the individual is named once, in SRC-05; J7 grouping basis stated; SRC-07/SRC-08 added (the #450 `f`/`fx`/`fg` definitions are now used in F-06/F-07, and F-07 now separates the shared 1-hour aggregation window from the differing stated sample duration, which is a better analysis than v1). F-07's speculative sentence is removed. #436/N1 constraints added to O-3/O-4.

### Remaining

**N1 (blocking, small) — forecast table and recommendation surfaces are still neither in the matrix nor declared UNKNOWN.** `approved-prompt-v2.md` B3 named "forecast table/recommendation" and required "explicit UNKNOWN for unsampled surfaces, no false zero-match claim". INV-A01–A08 contain none of them, and the inventory's "Not examined" list does not mention them either (grep for ForecastTable / recommendation / comparison finds nothing relevant). The keys exist in `translations.common.js` (`windMax` "Max wind" / "Mesti vindur", `windMaxShort`, `windGust` "Wind gust" / "Vindhviða", `labelWind`, `labelGust`, `comparisonFactorWind`, `comparisonFactorGusts`, `comparisonHrCalmerGust` "{diff} m/s calmer gusts", and the Pro `windLabel`), so a reader will assume these were covered. I did not trace their consumers; CC should. Required: either add one row per consumer surface (key, IS/EN copy, quantity/unit, status, grade) or add them to the "Not examined" list as UNKNOWN with the key names. Either is acceptable; a silent omission is not. Also add `Free recommendation` / `useFreeRecommendation` and `comparisonUtils` if they show wind values.

**N2 (non-blocking) — arithmetic in F-02's extension.** "can appear for a value still 6-9 m/s short of the Beaufort row it names" is not right. The cautious string "Hvassviðri er í spánni" fires only for `10 < windMax <= 15`, which is 2.2–7.2 m/s below row 8's 17,2; the serious string fires above 15, so at most 2.2 m/s below. State the range as 2.2–7.2 (cautious) and ≤ 2.2 (serious), or drop the number. The conclusion (both fire below row 8) is unchanged.

**N3 (non-blocking) — superseded v1 text still reads as current in `cc-report.md`.** The v1 section still says F-01 is "the single most consequential unresolved item" (under "What was NOT examined") and that voice-caller/Open-Meteo semantics are untraced "see UNKNOWN items … F-01/F-10". The v2 section corrects this, but the approved prompt asked for superseded claims to be marked visibly. Add a one-line "superseded by v2, see B1" marker on those two bullets.

**N4 (non-blocking) — F-10 and the open-questions list.** F-10 still reads as if the `windspeed_unit` behaviour were un-probed in general; reword to "keyed host and post-2026-10-19 behaviour not probed" to match F-01. Also mention in the keyed-host note that in Production the proxy is keyed and fail-closed, so the public-host sample explains non-production only; that is the actual reason O-1 is worth doing.

### Limits

- Staged snapshot only. I did not run git, tests, lint, build or a browser on the owner's machine; HEAD and clean-tree statements are CC's.
- My sandbox re-run shows determinism over the staged bytes; it does not show browser-build behaviour. RC-18 is a fixture-based observation, not live traffic.
- I did not trace the consumers of the INV-A rows (I read the translation files and the finder ranking code, not the Aurora or Route Planner components), and I did not open `relocationEngine.js`, `RoutePlannerCard.jsx`, `ForecastTable` or the blog database.
- Veðurstofan pages: my row-by-row comparison used a summarising fetch. Open-Meteo documentation was not re-read by me.
- This is a research review. Nothing here approves a wording, threshold or code change, and no official endorsement is implied.


## Ripley final assessment — v2 — 2026-10-23

Verdict: REVISE, narrow docs-only N1–N4. Accept confirmed B1/B2/R1–R7 resolution. Forecast/recommendation missing surfaces require either trace rows or explicit named UNKNOWN, not an unbounded fresh audit. Numerical clarification: cautious trigger10<x<=15 gives deficit17.2-x in [2.2,7.2); serious x>15 may be below or above17.2, so qualify any deficit instead of saying the whole trigger lies below row8. Approved correction prompt v3 uses this precision and retains provider/Production caveats.

Read CURRENT, Jonesy's detailed re-check and corrected CC report. git status: CURRENT plus untracked research task folder only; no application modifications. No tests/build rerun appropriate for docs-only review. Jonesy's sandbox script/hash verification remains attributed, not independently rerun here. CURRENT -> READY_FOR_CC. No code/probe/subagent/commit/push/deploy/GitHub action by Ripley.


---

## Jonesy v3 re-check — 2026-10-23

**Verdict: PASS (narrow, documentation only).** N1–N4 are closed on the evidence. Two small gaps remain (Y1 hashes, Y2 one unregistered threshold); neither changes a finding or a grade, and I supply the missing data below so the record is reviewable without another CC round. Ripley can fold Y1/Y2 into the final assessment or ask CC for a one-line addition.

### Verified this round

- **Scope and files:** `docs/ai/tasks/ticket-437/` now also holds `approved-prompt-v3.md`; only `research-report.md`, `inventory.md` and `cc-report.md` changed (modification times later than v2; `source-register.md`, `reference-cases*` and the harness are unchanged since v2). The nine application files I staged for this check all have modification times well before the research started. I did not run git; HEAD/clean-tree is CC's statement. `reference-cases` needed no rerun (no input claim changed).
- **N1.** I re-staged the consumers CC read and checked each new row against the bytes:
  - INV-A09 / T-surface: `ForecastTable.jsx:291-292` headers `windMaxShort` / `windMax`, value cell `formatNumber(convertWind(r.windMax, units))` at `:522`; `rows={rowsWithDay}` passed from `App.jsx:521-532`. Same `windMax` basis as F-02. Correct.
  - INV-A10 / INV-T16: `ForecastTable.jsx:525-537` shows the 🌬 gust figure only when `Number(r.windGust) >= 15`. Correct, and a genuinely unregistered display-gating cut-off.
  - INV-A11: `HourlyForecastModal.jsx:62-63` builds `wind`/`gust` directly from `hourly.windspeed_10m[i]` / `hourly.windgusts_10m[i]`. Correct; raw hourly, a useful contrast case.
  - INV-A12: `Top5Leaderboard.jsx:456` `windLabel` sits next to a compass icon / `RequireFeature feature="windDirection"`; direction, not speed. Correct.
  - INV-A13: `CampsiteComparisonSection.jsx:48-51` reads raw `windspeed_10m_max` / `windgusts_10m_max`, factor keys at `:73`, threshold `WIND_DIFF_THRESHOLD`. Correct.
  - INV-A14 / INV-T17: `comparisonUtils.js` `calcMetrics` averages `r.windMax` over the first three days; `classifyMetrics` uses `diff >= 1.5` / `<= -1.5`; the file comment says these are display-layer thresholds, not the frozen baseline. Correct.
  - INV-A15: `useFreeRecommendation.js` is a 613-byte file; zero wind references. Correct.
  - Not in doubt: every N1 key named in the prompt now has a row, and `useFreeRecommendation.js` is declared checked-clear rather than omitted. CC says no N1 surface was left UNKNOWN; that holds for the named keys (see Y3 for what "all surfaces" does not mean).
- **N2.** `research-report.md` now gives exact inequalities: cautious `10 < windMax <= 15` → deficit from 17,2 in **[2,2, 7,2)**; serious `windMax > 15` has deficit in **(0, 2,2)** only for `15 < windMax < 17,2` and is zero or negative (at or above row 8) beyond that, and says "Mjög hvassviðri" does not correspond to one bounded range. Ripley's clarification is right and also corrects my v2 wording ("serious … at most 2,2 below … both fire below row 8"): the serious trigger is open-ended above 15, so it is not confined below row 8. CLOSED.
- **N3.** The two v1 bullets in `cc-report.md` (`:107`, `:119`) carry `~~strikethrough~~` plus **SUPERSEDED by v2, see B1** pointers. CLOSED.
- **N4.** F-10 is reworded to the keyed-host / post-2026-10-19 question; F-01 has a "Precise Production framing" paragraph that matches `openMeteoAuth.js` as I read it (key → customer host; production without a key → `failClosed`; public host only for a missing key outside production) and states that the key being configured in live production is owner-reported, not verified; no public retry after a keyed failure; O-1 recommended, not performed. CLOSED. One wording nit (Y3).

### Small remaining items (non-blocking)

**Y1 — SHA-256 of the files cited in the new rows are not recorded in the deliverables.** `cc-report.md` lists the `sha256sum` command for the N1 files but I found no output (no 64-hex values for these files in `cc-report.md` or `inventory.md`), while `approved-prompt-v3.md` asked for "source hash+line". I computed them from the owner's checkout, so the record can be completed by copying this block into `cc-report.md`'s hash section (reviewer-computed, same snapshot as my line checks):

```
f5b8949166a39e9917409e97f4a8c28ebb369130864630680adf2df92ea20b08  src/components/ForecastTable.jsx
1d87d61e5993272a80a8235d3e3009df9ffdefd7430df385c069d9d37e43b3e0  src/components/HourlyForecastModal.jsx
c7a41b839952c5e5cec2fc4b8f5803ce6bd01e715896118f2f158e9475f8f069  src/components/Top5Leaderboard.jsx
af7c9d5b0be930eadee78503fa05c968f8d005fa71a78686b3cf5d7a0844741f  src/components/CampsiteComparisonSection.jsx
d2c6048e44f49593e934e000ed5c1dfd9fc8953caaf365785877dacef2fd4dec  src/lib/comparisonUtils.js
1a09d3499dcd31981bf8139dca86d1933cb0caffa45e2172cc53a6bf37b14c85  src/components/HomeDecisionCard.jsx
9260b19be7079fca05a294eea708305481038101e32b97ea6bf7c37cf579a6f1  src/components/InstantComparison.jsx
a4b47cea19653a462651157a6470abd70acd7b2d92ae5dc6d72f8255cbef2806  src/hooks/useFreeRecommendation.js
6fcc55ae5ea545c07dc068bafdeb392cde5d52ba60726bbe73ff9213cfc9a293  src/App.jsx
aa7a045600397b27dd314c7450a7fd4165124b6ee6edbb09bf5de348d342a3dc  src/utils/compareCampsiteForecasts.js
```

**Y2 — one numeric wind cut-off is mentioned in prose but not registered.** `src/utils/compareCampsiteForecasts.js:7-14`: `WIND_DIFF_THRESHOLD = 2` m/s (shared by wind and gust differences), weights `WIND_WEIGHT = 3`, `GUST_WEIGHT = 1`, applied in `getDailyComparisonWinner` to normalized `windMax` / `windGust` (the same ambiguous basis as F-02) and, in `CampsiteComparisonSection`, to raw daily fields. INV-A13 mentions "2 m/s" in a cell but the threshold register (INV-T01…T17) has no row for it. It is a *difference* threshold, not an absolute wind classification, so it does not alter any finding; add one INV-T18 row (value, `<` comparison on absolute difference, quantity per consumer, literal, consumers) or state that difference thresholds are intentionally out of the register.

**Y3 — nits.** (a) The "Precise Production framing" sentence says the public-host sample describes "a non-production environment, or … a misconfigured production that would otherwise fail closed". A production without a key fails closed and never reaches the public host; drop the second clause. (b) Consumer numbering ("7th", "8th", "9th") is not consistent between INV-A09, INV-A14, INV-T17 and the cc-report summary ("8th-9th"); say "at least nine consumers" or list them. (c) "No consumer was left untraced" should read "no named N1 surface was left untraced"; unsampled surfaces elsewhere stay in "Not examined" (`relocationEngine.js` `getRoughWeatherWindow`, `RoutePlannerCard.jsx:987`, blog DB, CDN), which the report still lists.

### Overall status of the research

- Findings stand as: F-02 (voice `windMax` basis and the *Hvassviðri* term/threshold ambiguity), F-03 (duration-gated "storm" label, now also in public marketing copy), F-04/F-05 (silent "calm" defaults), F-06/F-07 (time-basis differences, separated), F-01 (demoted: naming inconsistency and missing main-path unit guard; keyed host UNKNOWN), F-08 (retired share pages inactive but reachable), F-09/F-10. Incidental: "Minni vindur" on the homepage `icWindDelta` and landing page against CLAUDE.md's label guidance (outside this ticket's scope).
- Every grade I could check against source or a re-run held; the two I overturned (F-01 headline, safety.js "cleaner") were corrected in the documents with visible supersession.
- Nothing here approves a wording, threshold or code change; follow-ups are owner decisions.

### Limits

- Staged snapshot only; no git, tests, lint, build or browser on the owner's machine. HEAD and clean-tree statements are CC's. The earlier sandbox re-run of the reference script is unchanged by this round.
- I verified the new rows by reading the consumers' source, not by loading the app; "VERIFIED live" for a surface means the code path is rendered by the app's own components, as CC states, and I did not trace routing or feature gating beyond what the rows cite.
- I did not open `relocationEngine.js`, `RoutePlannerCard.jsx`, `HomeDecisionCard.jsx` internals beyond the hash, the blog database, or any CDN layer. Veðurstofan and Open-Meteo pages were not re-read this round.
- This is a research review. No official endorsement is implied.


## Ripley final assessment — v3 — 2026-10-23

Verdict: PASS, research only. Jonesy's N1–N4 closure accepted. Independently reran the retained read-only reference script with the loader: exit0; observed weighted18 ->8.1 night case, voice severity3 vs1 and all-failed route LOW/0/0/0. This is synthetic function evidence, not live weather or browser/production behavior. Experimental-loader deprecation warning only. No full tests/lint/build needed for research-only changes.

Command: node --experimental-loader=./docs/ai/tasks/ticket-437/esm-ext-loader.mjs docs/ai/tasks/ticket-437/reference-cases-script.mjs

Y1 completion: independently computed new-surface hashes for citation snapshot below. Y2 completion: compareCampsiteForecasts.js:6 defines WIND_DIFF_THRESHOLD=2m/s, shared by wind/gust differences; compareMetric:24 ignores abs(diff)<2 (equality participates), daily consumers:55/60, hourly:84/89. It is a difference/display-comparison threshold, not an absolute meteorological class. Weights WIND3/GUST1 at:11/12. This supplements the threshold register without changing findings.

Y3 clarifications supersede imprecise report language: public-host sample proves only that host/date; missing-key Production with VERCEL_ENV=production fails closed and does not access public host. Deployment configuration/exposure remains owner-reported or unverified. No named N1 surface remains untraced; that is not a claim all possible surfaces were audited. Consumer ordinal counts are informal, not a completeness metric; use stable inventory row IDs. Unsampled relocation/card/database/CDN surfaces remain explicit limitations.

No app/threshold/copy/provider change approved by this PASS, and no official endorsement implied. git status shows only CURRENT and task-folder documents; git diff --check clean. CURRENT -> CLOSED for completed research workflow. Implementation follow-ups and live checks remain owner decisions. No commit, push, deploy or GitHub action.

### Independently computed citation hashes (Y1)

```
f5b8949166a39e9917409e97f4a8c28ebb369130864630680adf2df92ea20b08  src/components/ForecastTable.jsx
1d87d61e5993272a80a8235d3e3009df9ffdefd7430df385c069d9d37e43b3e0  src/components/HourlyForecastModal.jsx
c7a41b839952c5e5cec2fc4b8f5803ce6bd01e715896118f2f158e9475f8f069  src/components/Top5Leaderboard.jsx
af7c9d5b0be930eadee78503fa05c968f8d005fa71a78686b3cf5d7a0844741f  src/components/CampsiteComparisonSection.jsx
d2c6048e44f49593e934e000ed5c1dfd9fc8953caaf365785877dacef2fd4dec  src/lib/comparisonUtils.js
1a09d3499dcd31981bf8139dca86d1933cb0caffa45e2172cc53a6bf37b14c85  src/components/HomeDecisionCard.jsx
9260b19be7079fca05a294eea708305481038101e32b97ea6bf7c37cf579a6f1  src/components/InstantComparison.jsx
a4b47cea19653a462651157a6470abd70acd7b2d92ae5dc6d72f8255cbef2806  src/hooks/useFreeRecommendation.js
6fcc55ae5ea545c07dc068bafdeb392cde5d52ba60726bbe73ff9213cfc9a293  src/App.jsx
aa7a045600397b27dd314c7450a7fd4165124b6ee6edbb09bf5de348d342a3dc  src/utils/compareCampsiteForecasts.js
```
