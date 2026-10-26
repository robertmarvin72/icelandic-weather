# Result review — ticket #464 Round 1 (research) — Jonesy, 2026-10-26

## Verdict: REVISE (narrow, MEDIUM — documentation and one small re-run, no code)

The research is thorough and the harness is valid: the real `scoring.js`/`forecastNormalize.js` were executed and the real `HourlyForecastModal` was rendered with only `getForecast` mocked, as J1 required. But the headline finding rests on an assumed weather code and is stated more strongly than the evidence allows (R1), and one "verified general finding" is wrong (R2). Both are fixable without new investigation.

## Verification basis

- **Read myself (staged):** approved-prompt-v1 (J-conditions), cc-report.md, research-report.md (whole), reproduction-cases.md, next-steps-proposal.md, vitest config, the harness spec (first third), vitest-output.txt and vitest-midnight-output.txt, and the staged source files `HourlyForecastModal.jsx`, `ForecastTable.jsx` (tooltip at ~379–386, gust gate at ~525–527), `scoring.js`, `forecastNormalize.js`, `useForecast.js`, `forecastCache.js`, `api/forecast.js`.
- **Blob hashes recomputed by me** (LF-normalized) for those source files: `HourlyForecastModal.jsx d5dbffd6…`, `scoring.js 5db18656…`, `forecastNormalize.js 0372916c…`, `useForecast.js 263e5824…`, `ForecastTable.jsx e60d5b47…`, `forecastCache.js 39201c0c…`, `api/forecast.js d0307cf7…` — all equal the hashes in cc-report.md.
- **Sandbox (mine, synthetic, Node copies of the staged `scoring.js` and `forecastNormalize.js`):** reproduced CC's Oct-27/28 breakdown (Oct-27 "Ok", Oct-28 "Fair" at code 1), the 11.1 m/s gust threshold at code 1, and the `normalizeDailyToScoreInput` proof (provider 9/20 → normalized 11/14, "Bad"). I also ran what CC did not (see R1, R2). Not re-run by me: the Vitest harness itself.
- **CC-attributed, not verified by me:** HEAD and clean status, `git diff --check`, `git log` counts, the live `gh issue view` text (the checklist), the harness run (17/17), and the Node script run.

## Required corrections

**R1 — Medium. The central finding depends on an assumed weather code and overstates the gust needed.**
CC's Oct-28 breakdown uses `weatherCode = 1` ("mainly clear", "að mestu heiðskírt") and concludes that an unreported gust of about 11.1 m/s or more is the most parsimonious sufficient driver. But (a) the scoring input is the raw `daily.weathercode` (`row.code`), while a displayed label such as "að mestu heiðskírt" comes from the separate display-only `summaryCode`, which the report itself documents in §2; the report does not say where the label came from or why it can stand in for the scoring input. The raw daily code is UNKNOWN. (b) The result flips with the code. My sweep over the staged `scoring.js` (tmax 5.8, wind 5.1, rain 0, winter), first gust that reaches "Bad":

| raw daily code | no gust | first "Bad" gust |
|---|---|---|
| 0, 1 (clear) | Fair | 11.1 m/s |
| null, 2, 3, 45, 51, 61, 95 | Fair | **8.0 m/s** (gust − wind ≥ 2.9) |
| 66, 67, 71, 77, 85 (freezing rain / snow) | **Bad** | 5.1 (no gust needed) |

So the claim "sky/pleasantness alone never reaches Bad" holds only for the four codes CC swept (0, 1, 3, 45), and the "hidden" gust band is 8.0–14.9 m/s for most codes, not 11.1–14.9. My earlier lead ("gust − wind ≥ 2.9 with a non-clear sky") was correct for those codes; the report's "refines Jonesy's lead" framing only holds for clear codes. Oct-27 is also explained by one assumption: with raw code 3 (overcast, −1) it computes "Fair", matching the report, with no gust at all; CC left that UNKNOWN.
Fix (documentation plus one task-local re-run in the existing script): state the source and status of the code-1 assumption; extend the sweep to the code set above; restate the finding as a conditional ("consistent with: a gust ≥ wind + 2.9 and a non-clear raw code, or ≥ 11.1 with a clear code, or a wintry raw code"); remove "most parsimonious" and the 11.1–14.9 band wherever it appears (research-report §4a/§6a/§9, reproduction-cases table, next-steps §4, cc-report, and the CURRENT handoff line); call the Oct-28 tooltip breakdown synthetic, not "real"; add the Oct-27 overcast case. Keep the main message: the owner's rounded numbers alone do not reach "Bad", and an unreported input is required.

**R2 — Low-Medium. §6e's timezone finding is wrong.** The report says the hourly label can "silently diverge" for viewers outside UTC+0 because `new Date("…T00:00")` is parsed as local time. It is parsed as local and then formatted as local, so the wall-clock hour is unchanged. I ran `Intl.DateTimeFormat("en-GB", {hour12:false})` under `TZ=America/New_York` and `TZ=Asia/Tokyo`: "2026-10-28T00:00" → "00:00", "T21:00" → "21:00" in both. Only a local time that does not exist (spring-forward gap, e.g. "2026-03-08T02:00" in New York → "03:00") shifts. Remove or correct the claim and its "verified, general" label. For J6, which CC left unexecuted, the same TZ run shows `getSeasonForDate`'s month flipping west of UTC (`new Date("2026-10-01").getMonth()+1` is 9 in New York, 10 in Reykjavik/Tokyo; May 1 gives 4 vs 5), so CC can either re-run with `TZ=America/New_York` or cite this as my sandbox result. It still does not apply to Oct 27/28.

**R3 — Low. Labelling.** next-steps §4 calls the `>= 15` gust display gate a "verified bug". The gate and its effect are verified; that it is a defect is not (intent UNKNOWN, no doc). Relabel as a verified display gap with intent unknown, and fix the range per R1. The tooltip omission (gust, shelter, pleasantness) is verified and the copy proposal stands.

## Notes (non-blocking)

- The harness's own "all calm" fixture (wind 5, gust 8) is hourly "Good" yet has gust − wind = 3.0, which the daily formula penalizes (winter gust penalty 2). That is a direct illustration of the rule gap and worth one sentence in §8: hourly Good tolerates wind ≤ 10 and gust ≤ 15; the winter daily formula penalizes wind > 5 and gustiness ≥ 2.9.
- The J4 test is a mock-sequence mechanism demonstration and is labelled as such; acceptable.
- J8's issue checklist is present in the report; I could not verify it against the live issue text.

## Checked and fine

Path mapping with file:line matches the source I read (useForecast scoring-before-summary, `scoreSiteDay` composition and rounding order, winter config, `getWindowState` thresholds and null handling, `hour % 3` before state and summary, strict `>` tie rule, modal's own `getForecast`, cache key/TTL, API passthrough). Weighted-hourly provenance proof reproduced. Hourly edge cases (all-null Good, NaN neutral, Infinity Rough, numeric string absent, unsampled spike, duplicate/out-of-order) match source and the retained output. NOT HISTORICALLY REPRODUCED is stated accurately; harness is task-local; no repo file edits claimed or visible in what I read.

## Limits of this review

Staged snapshots only; nothing run on your machine (no Vitest, no git, no browser). My sandbox runs are synthetic and use the staged source. I did not read the whole harness spec or script, the live issue, or the screenshots. Product intent is UNKNOWN. No commit, push, deploy or issue change is implied; PASS here would mean research delivered, not a fix.

## Next

Ripley: send R1–R3 to CC as a documentation correction with one script re-run (code sweep, optional `TZ` run), then a short Jonesy re-check. Root-cause confirmation still needs the owner's raw gust/weather code for Oct-28 (next-steps §6).

## Ripley final assessment — 2026-10-26: REVISE

Accepted Jonesy R1–R3. Independently reran the retained real-component task-local harness using `npx vitest run --config docs/ai/tasks/ticket-464/harness/vitest.config.ticket464.mjs` outside sandbox:17/17 passed. Read report/review and proposal; local status contains only CURRENT and task464 artifacts. Passing harness does not validate the assumed raw code or unsupported timezone conclusion. Jonesy's synthetic grid remains reviewer evidence until CC extends the retained script.

Created approved-prompt-v2.md: conditional raw-code/gust sweep incl. Oct27 overcast, corrected timezone checks and display-gap intent wording. No production edits by Ripley. CURRENT READY_FOR_CC; owner sends Prompt approved to CC, then Jonesy re-check. Historical payload remains unavailable; no definitive screenshot cause or implementation claimed.

## Jonesy re-check of correction v2 — 2026-10-26: REVISE (very narrow, LOW, text-only)

R1–R3 are substantively resolved. Two small factual slips remain in the new text, both cheap to fix. No further research or script re-run is needed beyond the one-line harness typo.

### Verification basis

I read approved-prompt-v2.md, the cc-report Round 2 appendix, reference-cases-output-v2.txt, rule-gap-check-output.txt, tz-check.mjs plus its output, and research-report §4a/§6a/§6e/§6f/§9 corrections. I grepped all five deliverables for stale claims. I compared CC's 14-code sweep against my own sandbox grid (synthetic, from the staged source).

### Resolved

- **R1 (code/gust conditionality):** CC's 14-code sweep matches my grid exactly. Clear codes 0/1: first Bad gust 11.1 m/s. Codes null/2/3/45/51/61/95: 8.0 m/s. Wintry codes 66/67/71/77/85: Bad with no gust. Oct-27 (tmax 6.7, wind 4.8, rain 0.2) is now covered: code null or 1 gives Ok, code 3 gives Fair. The old "11.1–14.9" and "most parsimonious" headline is struck or qualified everywhere I grepped; no unqualified copy remains. The raw weather code is correctly marked UNKNOWN.
- **R2 (timezone):** the §6e retraction is correct. A timezone-less local parse plus local Intl formatting preserves the wall-clock hour; only a nonexistent DST-gap local time shifts. The J6 `getSeasonForDate` execution (New York flips Oct 1 and May 1; Reykjavik and Tokyo do not; Oct 27/28 unaffected) matches my own run.
- **R3 (labelling):** next-steps item 4 is now "verified display gap, intent UNKNOWN". The rule-gap example (hourly "Good" fixture wind 5 / gust 8 versus the daily winter gust penalty) is present and executes as described.

### Remaining required fixes (text-only)

1. **Wrong count in the owner-facing corrected summary (cc-report.md, the superseding paragraph).** It says the owner's reported rounded numbers "alone do not reach 'Bad' for 13 of the 14 codes checked". The sweep shows 9 of 14 stay at Fair without a gust; the 5 wintry codes (66/67/71/77/85) already reach Bad with no gust. Correct to "9 of the 14" (or "all non-wintry codes"). The research-report notice wording ("except the wintry ones") is already right, so the two documents currently disagree. This is the paragraph the owner reads, so it should be exact.
2. **tz-check.mjs typo.** The is-IS DST-gap line formats `"2026-03-08T02:30"` instead of `"2026-03-08T02:00"`, so the printed "is-IS=02:30/03:30" is an input artifact, not a finding. Fix the literal and re-run, or add a one-line note in the output file that the is-IS value used a different input. The conclusion (only the nonexistent local time shifts) is unaffected; the en-GB line, run with T02:00, supports it.

### Wording notes (also fix, same pass)

- "most likely a separate, display-only field (`summaryCode`)" (cc-report line 9; research-report §4a): the code path shows `summaryCode` is display-only, but that the screenshot label comes from it is INFERRED, not verified. Use "possibly" or "consistent with".
- "wintry codes … already reach 'Bad' from temperature/sky alone" (cc-report line 9): the cause is the wintry-precipitation penalty (pleasantness wintry = 2, or 3 at t ≤ 2), not temperature or sky. Say "from the wintry-code penalty".

### Notes (non-blocking)

- Whether Oct-28's raw code and gust are in the wintry or non-wintry group is still unknown. The displayed "að mestu heiðskírt" makes wintry unlikely, but that is inference.
- Item 6 in next-steps (owner supplies raw gust and weathercode for Oct-28) remains the only way to move from "consistent with" to a cause.

### Checked and fine

Source blob hashes recomputed earlier equal to cc-report. CURRENT handoffs from CC and Ripley are consistent with the corrected state. Harness files listed in cc-report exist. Reproduction-cases Round 2 rows and next-steps items 1–4 agree with the corrected conditional.

### Limits of this review

Staged snapshots only; nothing run on your machine (no Vitest, no git, no browser). CC-attributed, not independently verified by me: HEAD/status/git diff --check output, git log counts, the live issue text, the Node and PowerShell runs on your machine, and Ripley's 17/17 harness run. My sandbox is synthetic and uses the staged source. I did not read every line of the harness files or the screenshots. IS wording is not assessed. Product intent is UNKNOWN. No commit, push, deploy or issue change is implied. A later PASS would mean the research is delivered correctly, not that anything is fixed or that the root cause is confirmed.

### Next

Ripley: send fixes 1–2 plus the two wording notes to CC as a text-only correction (no new research), then a short Jonesy confirmation, or accept the findings with those conditions recorded. Root cause needs the owner's raw gust and weathercode for Oct-28.

## Ripley final assessment — 2026-10-26: REVISE (very narrow v2 re-check)

R1–R3 substantively resolved; accepted remaining count/input/wording corrections. Independently executed `node docs/ai/tasks/ticket-464/harness/reference-cases-script-v2.mjs` (exit0):9 of14 Fair without gust,5 wintry Bad, clear first-Bad11.1 vs other sampled non-wintry8.0, Oct27 overcast Fair. Read tz-check and verified the is-IS02:30 vs en-GB02:00 input mismatch. These are synthetic source evidence, not historic reconstruction.

Created approved-prompt-v3.md for these exact factual corrections and the three-TZ re-run only; no broader research or production change. Prior17/17 component harness stands, no redundant rerun. CURRENT READY_FOR_CC, owner -> CC Prompt approved, then Jonesy short confirmation.

## Jonesy confirmation of correction v3 — 2026-10-26: PASS with 3 text-only conditions (LOW)

The substantive v3 corrections are done and verified. Three small residual text items remain; none changes a finding, and none needs new research, a re-run or another full review.

### Verification basis

I read approved-prompt-v3.md, the cc-report Round 3 appendix and the rewritten owner-facing summary, research-report lines 5, 112, 125, 166 and 235, the corrected tz-check.mjs and tz-check-output.txt, and CURRENT. I grepped all four deliverables for "13 of 14", "most likely", "almost certainly", "temperature/sky", "02:30" and "03:30". I re-ran the DST-gap label check in my sandbox (Node Intl, `TZ` per process, identical input `2026-03-08T02:00` for en-GB and is-IS): New York gives 03:00/03:00, Reykjavik and Tokyo give 02:00/02:00. That matches the retained output.

### Verified

- **Count:** the owner-facing summary now says 9 of the 14 codes (`0,1,2,3,45,51,61,95,null`) stay Fair without a gust, and the 5 wintry codes (66/67/71/77/85) already reach Bad. The correction is visible, not silent. research-report line 125 agrees. The retained grid matches my own sweep and Ripley's independent run (attributed).
- **Penalty attribution:** cc-report and research-report line 125 now say Bad comes from the `getWintryPrecipPenalty` wintry-precipitation term, not temperature or sky. The summary also states the synthetic-baseline context ("not a claim about the unknown historic raw code").
- **Inference wording:** cc-report and research-report line 112 now say the `summaryCode` link is an inference from the code path, not confirmed ("possibly"). The raw historic code stays UNKNOWN.
- **tz-check.mjs:** both locales now get the identical `T02:00` literal; correction note added in the script and in research-report line 235; output consistent across the three timezones. The run itself is CC-attributed (PowerShell `$env:TZ`); my sandbox result agrees.
- **Scope:** no new research or sweep; CC states task-only edits, HEAD unchanged and `git diff --check` clean (CC-attributed, not verified by me).

### Conditions (text-only, no re-review needed beyond a grep)

1. **research-report.md line 5 (the top "Round 2 correction notice") still says "almost certainly the separate, display-only `summaryCode`".** This is the first paragraph a reader sees and contradicts v3 item 2 and CC's own Round 3 item 3. Replace with "possibly (an inference from the code path, not confirmed)".
2. **research-report.md line 166 says wintry codes reach Bad "from temperature/sky/wintry-precipitation alone".** Say "via the wintry-precipitation penalty" so it matches line 125 and the cc-report.
3. **tz-check.mjs header comment (lines ~6–8) says it is "invoked via a small bash loop".** CC's own appendix says Git Bash `TZ=` did not propagate and the runs used PowerShell `$env:TZ`. v3 item 3 asked to tidy misleading invocation comments. Change to "one process per `TZ`, set via PowerShell `$env:TZ`" (comment only; no re-run).

### Limits of this review

Staged snapshots only; nothing run on your machine (no Vitest, no git, no browser, no PowerShell). CC-attributed, not verified by me: HEAD, `git status`, `git diff --check`, the three-timezone PowerShell run, shell `TZ` restore, the Node outputs, the 17/17 component harness and the live issue text. Ripley's independent run of `reference-cases-script-v2.mjs` is likewise attributed. My sandbox checks are synthetic. IS wording not assessed. Product intent is UNKNOWN. This PASS means the research and corrections are delivered accurately; it does not mean anything is fixed, and the root cause is not confirmed: that needs the owner's raw `weathercode` and `windGust` for Oct-28 (next-steps item 6). No commit, push, deploy or issue closure is implied.

### Next

Ripley: accept the three conditions (CC applies them as a comment/text edit, or record them as accepted residuals), then final assessment. #464 closure is not automatic.

## Ripley final assessment — 2026-10-26: PASS (research delivered)

Accepted Jonesy's v3 PASS and applied its three exact text-only conditions directly: research notice now marks summaryCode provenance as inference, section6a names the wintry-precipitation penalty, and the task-local TZ script comment now describes PowerShell invocation. No executable statement changed. Verified the stale phrases absent by scoped search; no further peer review required per Jonesy's conditions. Read corrected report and retained TZ output. Earlier independent17/17 real-component harness run and real v2 score sweep stand; no redundant rerun for prose/comment-only changes. Three-TZ execution remains CC-attributed.

Research establishes distinct daily/hourly features, thresholds and sampling/aggregation, plus a sampled best-window run that cannot establish continuous24h quality. It demonstrates conditional explanations, not the historic screenshot cause: raw daily code/gust and original payload remain UNKNOWN. No scoring/production behavior changed or fix implemented. Only CURRENT/task464 changes present; git diff --check clean. CURRENT CLOSED records completed research workflow only, no commit/push/deploy/GitHub closure. Owner can review report and choose separately scoped follow-ups.
