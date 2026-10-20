# Ticket #452 — Result review (Jonesy)

Date: 2026-10-20. Reviewed: `cc-report.md` against `approved-prompt-v1.md` (Round 1 + N1–N10 + Ripley binding decisions), and the live files I could stage: `openMeteo.js`, `openMeteo.test.js`, `auroraScoring.js`, `auroraScoring.test.js`, `useAuroraDecision.js` (+ test), `useAuroraThreeNight.js`, `AuroraNightOutlook.jsx`, `NorthernLightsThreeNight.test.jsx` (new block), `auroraDecisionCache.js`, `orchestrate.js`, `aurora/cache.js`, `cron/refresh-aurora.js`, `vite.config.js`, `api/aurora-decision.test.js`, and 6 of the 8 evidence screenshots (01, 02, 03, 04, 07, 08 staged; I viewed 01, 03, 08).

## Verdict: REVISE (one documentation correction in cc-report.md; no application, test or scope change required)

The implementation is correct and tightly scoped. One claim in the report's "Old-tab limit" section is contradicted by the code, and it is exactly the section the owner would rely on when deciding what to expect after deploy. Fix the text; no re-run of tests/build is needed.

## Independently verified (by me, from source)

- **Fix (N1):** `buildOpenMeteoUrl` sets `wind_speed_unit` = `"ms"` (const `WIND_SPEED_UNIT`) as the only change to the URL; no legacy `windspeed_unit` anywhere in this module; origin, lat/lon (toFixed 4), hourly list, dates, `timezone=UTC` untouched.
- **Guard (N2):** `windUnitIsSuspect(payload)` = `hourly_units?.windspeed_10m` is `!== undefined` and `!== "m/s"` → every row's `windSpeed` is `null`; no conversion, no throw. Absent `hourly_units` or absent property → pass-through. `numOrNull` unchanged, so null/NaN/undefined stay null. Matches Ripley's binding text exactly (including present-`null` → null).
- **Scorer untouched (N8):** `HIGH_WIND_MS_THRESHOLD = 12` (line 70) and `maxWind != null && maxWind >= HIGH_WIND_MS_THRESHOLD` (lines 334–335) intact; the file's mtime (1787681745742) predates the task start and every edited file, which is consistent with zero diff. I cannot run `git diff`, so byte-identity rests on the CC-reported `git diff --stat` plus this mtime evidence.
- **Tests exist and say what the report says:** `openMeteo.test.js` — canonical-param test (asserts `wind_speed_unit=ms`, `windspeed_unit` null, other params exact), 6 guard tests (m/s, absent `hourly_units`, absent property, km/h two rows, present `null`, other fields unaffected), and 3 real-pipeline tests (`fetchLocationWeather` → `normalizeOpenMeteoHourly` → `scoreAuroraVisibility`). The mock `fetchImpl` returns 18 when `wind_speed_unit` is not `ms` and 5 when it is, and throws if a legacy param is sent, so the "after" assertion fails if the parameter is dropped or misspelled (N3 met). Before/after asserts identical `score`, `band`, `reasons` (N4 met); boundary 11.9/12/12.1 and null-stays-null covered. `auroraScoring.test.js`: 11.9/12/12.1 with score/band parity, single-hour max at 12, null-mix never flags. `useAuroraDecision.test.js`: old `high_wind` body → `retry()` → corrected body, score unchanged. `NorthernLightsThreeNight.test.jsx`: real EN/IS dictionary, note present for flagged qualifying best / absent for unflagged, lower-ranked flagged alternative does not leak, all-poor (Pro, details expanded) shows none.
- **Test count arithmetic:** 10 (openMeteo) + 3 (scorer) + 1 (hook) + 4 (UI) = 18 = the reported +18 (2676 → 2694). Not run by me.
- **Cache matrix citations check out:** `cache.js:57` `persistAuroraSnapshot`, `:74` `readAuroraSnapshot`, lease at `:27–36/43–49`; `refresh-aurora.js:48` persists `{nights, sourceFetchedAt}`; `orchestrate.js:66` reads the snapshot; `useAuroraDecision.js:37` and `auroraDecisionCache.js:19` as cited; `vite.config.js` `runtimeCaching` starts line 47 and matches only browser GET `api.open-meteo.com/v1/forecast`. No wind/weather in `cache.js` or `refresh-aurora.js`. Conclusion "no wind-bearing persisted store" is consistent with what I read; the repo-wide SQL/wind greps are CC-reported (I did not re-run them).
- **UI trace:** `nl3-result` renders `nlHighWindNote` only from `display.qualifyingLocations[0].flags`; `nl3-all-poor` branch (lines ~193–233) never reads flags. No UI/translation file edited (no diff evidence beyond CC's list; mtimes of `AuroraNightOutlook.jsx` and the scorer are old).
- **Screenshots 01/03/08:** 01 (IS desktop) shows "Búast má við vindasömu veðri…" under the best; 03 (EN, 320 px) shows "Windy conditions expected — dress warmly if you go out to look." with no horizontal overflow visible; 08 (all-poor) shows no wind text. All are mocked, as the report labels them.

## Findings

### Y1 — "Old-tab limit" section describes refresh paths the code does not have (MEDIUM, documentation only; N6)

`cc-report.md` "Old-tab limit (N6)" says an already-resolved tab keeps its result until one of: **(a)** the user switches to a different night ("new `key` → fresh `load()`"), (b) midnight rollover, **(c)** an explicit retry "wired in several `AuroraNightOutlook` branches", or (d) reload.

- **(a) is wrong.** `useAuroraThreeNight.js` calls `useAuroraDecision` three times unconditionally, once per slot date (`hook0/1/2`), so all three nights are fetched at mount. `setSelectedDate` only changes which already-loaded slot is displayed; it changes no hook `key`, so switching night triggers no request. An old tab therefore keeps showing the old (over-flagged) result for every night after a tab switch. This is the opposite of what the report tells the owner.
- **(c) is true but misleading.** `onRetry` / "Try again" buttons exist only in the error-type branches (`AuroraNightOutlook.jsx` lines 132, 143, 154, 176). `nl3-result` and `nl3-all-poor` have no retry control, so a tab showing an over-flagged *success* result has no user-visible retry path. The hook-level `retry()` test proves the mechanism, not a reachable control for that state.
- **(b)** is correct (midnight rollover / visibility return with a new UTC date changes the slot dates; same date → string-identical keys → no request, which the hook comments confirm). **(d)** is correct, and a remount within the same page session after more than 5 minutes also refetches; within 5 minutes it reuses the cached promise.
- Net effect for the owner: an already-open tab keeps the old note until a **reload**, a date rollover, or a remount after the 5-minute TTL. No code or test change is needed for #452 (Ripley's contract says do not add polling/purge); only the statement must be corrected. Whether a user-reachable refresh for success states is wanted is an owner/Ripley product question outside #452.

Required fix: rewrite the Old-tab limit paragraph so that (a) is removed and replaced by "switching night does not refetch — all three nights load on mount", (c) says retry controls exist only in error branches and not on success/all-poor results, and the list of real refresh events is: reload, date rollover producing new slot dates, a fresh mount after the 5-minute reuse window. Also correct item 9 of the read-only trace only if it implies tab switch loads (it does not; the trace itself is fine). The CURRENT.md handoff does not repeat (a), so only the report needs the edit.

### Non-blocking notes

- **Y2 (LOW, evidence quality):** in screenshots 01 and 08 the "Chase the Weather is cached and can work offline" PWA toast overlaps part of the Northern Lights card (in 01 it covers the "Sjá bestu staðina" button row). The wind-note assertions are unaffected (they were also checked via accessible text), but a re-capture with the toast dismissed would be cleaner if the screenshots are kept as evidence.
- **Y3 (LOW, residual, Ripley accepted):** the unit guard silently drops the wind flag when units disagree; there is no log or signal, so a future provider unit change would degrade quietly (no false "windy", but also no wind note). Out of #452 scope; mention only as a possible later hardening.
- **Y4 (LOW):** the "before" half of the equivalence test simulates the old request by deleting the param from the URL and feeding the mock; it demonstrates the contract, not historical code. The "after" half is the real regression guard. Fine as labelled ("simulated provider contract").
- Provider behaviour remains docs-backed only (VERIFIED DOCUMENTATION); the report says so plainly. First post-deploy check is an owner-side, separately approved step.

## What passed

N1–N10 and the binding decisions: parameter name and evidence grade stated; no legacy param; guard exactly as specified; real-pipeline tests with a unit-honouring mock; identical score/band/reasons; cache matrix with file:line and repo-wide grep (CC-reported); STOP list respected (one app file changed, plus tests and CURRENT); UI claims limited to traced behaviour including the intended "far fewer wind notes" effect; scorer unchanged; test discovery reported (`AuroraNightOutlook` has no dedicated test, disclosed); mocked browser evidence labelled; status "implemented, reviewed", no production claim; no commit/push/deploy/GitHub action.

## Required to reach PASS

1. Correct the Old-tab limit paragraph (Y1) as described. No code, test, build or screenshot re-run required.
2. Optional: re-capture screenshots 01/08 without the toast overlay (Y2).

## Limits of this review

- I have no shell, git, test, lint, build or browser access on the owner's machine and ran none. I did not verify: `HEAD` hash, `git status`/`git diff --stat`, the 30-file/383-test and 182-file/2694-test results, lint/build outcomes, the repo-wide SQL/wind greps, the deleted capture script, or the claim that all 10 browser assertions passed. Those are CC-reported.
- Source reads are of staged snapshots taken at review time; the scorer's zero-diff status is inferred from CC's diff stat plus its old mtime, not from a byte comparison.
- I viewed screenshots 01, 03 and 08 only (02, 04, 07 staged, not opened; 05 and 06 not staged).
- Open-Meteo documentation not independently fetched; no provider probe made. Other test files in the 30-file list were not read.
- This review is not approval to commit, push or deploy; those remain with the owner.


## Ripley final assessment — 2026-10-20

Verdict: REVISE, documentation only. Independently read approved v1, CC report, Jonesy review, application diff and useAuroraThreeNight/retry branches. Confirm Y1: night selection changes display only; successful/all-poor states have no retry control. Also found report arithmetic error: 12 m/s versus 12 km/h is a 3.6x physical threshold, not 13x. Both corrections specified in approved-prompt-v2.md; no implementation edits requested. Scorer implementation has no diff in the changed-file list.

Independent command: npx vitest run api/_lib/auroraDecision/openMeteo.test.js src/lib/auroraScoring.test.js src/hooks/useAuroraDecision.test.js src/hooks/useAuroraThreeNight.test.js src/components/NorthernLightsThreeNight.test.jsx — 5 files, 101 tests passed. First sandbox attempt ran no tests due to EPERM renaming Vitest temporary files; rerun with escalated execution passed. Full 2694-test suite, lint, build and browser evidence remain CC-reported, not independently rerun. No live provider check. CURRENT -> READY_FOR_CC for documentation-only v2. No application edits, commit, push or deployment by Ripley.

## Jonesy narrow re-check — v2 correction — 2026-10-20

Scope: only what `approved-prompt-v2.md` and my Y1 required. Read the current `cc-report.md` (sections "UI trace and claims (N7)", "Old-tab limit (N6)", "v2 Correction", "Lifecycle"), `approved-prompt-v2.md`, Ripley's final assessment above, `useAuroraThreeNight.js`, `useAuroraDecision.js`, the `onRetry` branches in `AuroraNightOutlook.jsx`, and `NorthernLightsThreeNight.test.jsx` (new block and tab-switch tests).

### Verdict: PASS (one non-blocking wording note, Z1)

### Y1 — resolved
- The Old-tab limit section now says all three nights are requested at mount by three fixed `useAuroraDecision` calls (`useAuroraThreeNight.js:91–93`, which I re-read) and that `selectedDate` only chooses the displayed slot, so tab switching refetches nothing. Correct.
- Retry: `onRetry` is only in the `expired` / `transport_error` / `contract_defect` / `domain_unavailable` branches (lines 132, 143, 154, 176; the first two correspond to the `classification?.expired` and `transport_error` branches I read), never in `nl3-result` or `nl3-all-poor`. The report now says the hook-level retry test proves the mechanism, not a reachable button on a successful result. Correct.
- Refresh events listed — reload, calendar rollover changing the slot dates, remount after the five-minute reuse window — match the code, and "TTL expiry alone never refreshes rendered state; remount within the TTL can reuse an old decision" is stated. On the rollover bullet: the hooks are positional (`hook0` follows `slotDates[0]`), so on rollover all three hooks change key and call `load`; overlapping dates may then be served from a still-unexpired cache entry. The report's conclusion ("not guaranteed fresh for overlapping dates") is right even though "only for whichever date changed identity" is loosely phrased. Not a defect.
- The correction is marked visibly in place, and the "v2 Correction" section preserves v1 counts as historical, not fresh runs. No application, test, scoring, UI, provider, cache or dependency change claimed; I cannot verify the CC-reported `git diff --check`/`git status`, but the staged source files I re-read are unchanged in the parts that matter (`useAuroraThreeNight.js`, `AuroraNightOutlook.jsx`).

### Arithmetic — resolved, and I missed it in my first review
Old effective flag point 12 km/h = 3.33 m/s; intended 12 m/s = 43.2 km/h; ratio 3.6, not "roughly 13" (the 13 came from dividing 43.2 km/h by 3.33 m/s). The corrected text is right. Ripley caught this; I read that sentence in the v1 report and did not flag it, even though my own N7 text had the two figures (≈3.3 m/s, ≈43 km/h) that make the error visible. Noted.

### Z1 (LOW, non-blocking) — unsupported test claim left in the N7 night-switch bullet
The N7 bullet still says night selection is "confirmed by a new test (tonight calm/no-note → switch tab → tomorrow windy/note-present, both fixtures supplied up front)". In `NorthernLightsThreeNight.test.jsx` the new #452 block contains exactly four tests (EN present/absent, IS, lower-ranked alternative, all-poor); none switches tabs, and the tab-switch tests (lines ~105, 130, 193, 268, 399) are pre-existing and do not involve `high_wind`. That scenario is covered only by the mocked browser evidence (screenshots 06/07, which I did not open) and by source reading. This came from the v1 report and I did not catch it in round 1 either (my first review listed only the four tests but did not cross-check that sentence). Suggested wording for the close-out (Ripley's final assessment, or a one-line edit): "night selection is evidenced by the mocked browser screenshots 06/07 and the pre-existing tab-switch tests; there is no unit test combining a tab switch with the wind note." No re-run or re-review needed.

### Still true (unchanged by this round)
- Y2 (PWA toast overlapping screenshots 01/08) and Y3 (silent guard, no telemetry) remain non-blocking and were explicitly not in scope for v2.
- Provider behaviour remains docs-backed only; no live probe; production unit correctness unverified until a post-deploy response is observed (owner-side, separately approved).
- Ripley's independent run (5 suites / 101 tests passed) is Ripley-reported; the full 2694-test suite, lint, build and browser run remain CC-reported.

### Limits of this re-check
No shell, git, test, lint, build or browser on the owner's machine; nothing run. I did not diff `cc-report.md` against its previous version beyond the sections named above (I read the full text of those sections; other sections were reviewed in the first pass and I did not re-read them line by line). I cannot confirm `git diff --check` or that no other file was touched since my last staging. Not approval to commit, push or deploy; those remain with the owner. #452 can be treated as locally CLOSED/PASS only after Ripley's final assessment, subject to owner commit/push/deploy decisions.


## Ripley final assessment — v2 — 2026-10-20

Verdict: PASS. Read approved-prompt-v2.md, the corrected report and Jonesy's narrow PASS. Y1 and the 3.6x arithmetic correction are resolved. Independently checked changed-file names and zero diff for auroraScoring.js, useAuroraThreeNight.js and AuroraNightOutlook.jsx. No further implementation changes required.

Z1 evidence clarification: the night-switch wind-note scenario is supported by the mocked browser screenshots 06/07 and source trace; the pre-existing tab-switch tests cover selection behavior. There is no unit test combining a tab switch with the wind note. This clarification supersedes the report's unsupported claim of a new combined test; no new test or review cycle is needed. Y2 screenshot overlay and Y3 missing guard telemetry remain accepted, non-blocking limitations.

Validation: Ripley's prior independent 5-suite / 101-test pass remains applicable; no tests rerun for documentation-only v2. Full 2694 tests, lint, build and browser assertions remain historical CC-reported results. git diff --check initially flagged CRLF as trailing whitespace in CURRENT.md; normalized that workflow file to LF during the required final stage update. No application changes. Live provider behavior remains documentation-backed and not independently verified in production.

CURRENT -> CLOSED for local workflow completion. No commit, push, deployment or GitHub issue closure performed; those remain owner-controlled.
