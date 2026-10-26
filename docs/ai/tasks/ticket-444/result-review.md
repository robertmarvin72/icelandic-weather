# Result review — ticket #444 Phase A (audit + proposal)

Reviewer: Jonesy (Claude, technical peer reviewer). Date: 2026-10-26.
Reviewed: `approved-prompt-v1.md` vs `cc-report.md`, `audit.md`, `implementation-proposal.md`, `reference-cases.md`, and the retained `scratch/` files, checked against staged live source and my own execution of the pure functions in a sandbox (labelled as sandbox).

## Verdict: REVISE (narrow, LOW-MEDIUM)

The audit is thorough, correctly graded and stays read-only. The finder / `calcMetrics` / hourly-vs-daily findings reproduce exactly. One headline finding (RC-06) is overstated because it is season-dependent, and the surface inventory is not as complete as the report says. Both are documentation corrections before Ripley presents the proposal to the owner; no new audit scope.

## Independently verified (VERIFIED SOURCE + VERIFIED SAMPLE in my sandbox)

- RC-01 to RC-05 reproduce exactly with the real staged modules (`weatherFinderRanking`, `comparisonUtils`, `scoring`, `forecastNormalize`, `geo`), run in a scratch directory with only a `.js` suffix added to one import: `[2,2,2,10]` finder 4 vs midpoint 6; `[10,null,10]` finder 6.667 vs `calcMetrics` 10; all-null finder 0 vs `calcMetrics` null; `basePointsFromTemp(0/-5/null)` = 1/0/0; cold-wind/wintry penalties 3/0/3/2. Also: `undefined`, `NaN` and non-numeric strings are coerced to 0 by the finder.
- Source claims confirmed by reading: finder `toNum` 0-coercion and shared display/ranking number; `useLeaderboardScores` and `forecastNormalize` build `tmax`/`tmin` identically (`?? null`); `scoresById[site.id].rows` feeds `WeatherFinder`; `useComparisonState` -> `calcMetrics` -> `classifyMetrics` -> `icReasonWarmer` chip on `HomeDecisionCard` (no raw number shown there); `InstantComparison` is imported only by `Brochure.jsx`; `ForecastTable` labels min/max correctly; share image says "High"/"Hámark"; sole `/api/forecast` caller passes `Atlantic/Reykjavik`, API `"auto"` fallback is defensive only.
- Scratch script imports four pure modules only, writes nothing, touches no network/localStorage; loader shim is a resolve hook only. Files retained as the report states. J7 satisfied.
- CC honestly corrected J1's UNKNOWN about `HomeDecisionCard` (indirect consumption via `useComparisonState`). Good.
- Proposal options are separated by what they change, state ranking/score effects, and mark IS wording as needing the owner. No code, scoring or ranking change proposed silently.

## Required corrections

**R1 (MEDIUM) - RC-06 and "Surface 4" overstate the impact; the result is season-dependent.**
`scoreSiteDay` derives `season` from the date (`getSeasonForDate`: Oct-Apr = winter, May-Sep = summer). CC's RC-06 used `2026-06-15` (summer): `tmax 12` -> 8 / Good, `tmax null` -> 0 / Bad. I reproduced that for 2026-06-01, 2026-07-15 and 2026-09-20. For winter dates (2026-10-27, 2027-01-10) the same two inputs both give 3 / Fair: in winter the config has `tempWeight 0.35` and `baseFloor 4`, so a missing `tmax` changes nothing in my run (and in that run `tmax 2` and `tmax 12` also score the same). Today's date, 2026-10-26, is winter. So "the single clearest, most concrete finding", "the highest-impact single option" and "any day where tmax is missing" are true only for May-Sep scoring; as written, the owner would weigh Decision 4 against an impact that does not exist for Oct-Apr.
Fix: state the season dependence in `audit.md` 1.4, `reference-cases.md` RC-06 (add a winter-date run and quote it) and `implementation-proposal.md` Surface 4 and its decision text (impact applies to summer-season dates; winter-season effect observed as none in this synthetic case; production data frequency of null `tmax` UNKNOWN). Keep it unfixed. A short rerun of the scratch script with a winter date is enough; keep the same safety rules.

**R2 (LOW) - Inventory completeness is overstated; add the extrema-only consumers CC did not list.**
The negative searches covered named files plus `src/pages`, `src/hooks`, `src/data`, blog components, `api` and a few config/i18n files, but not `src/lib` or `src/components` as directories. From my own greps I found `tmax` consumers not in `audit.md`: `relocationEngine.js` (lines ~173-225: heat hazard `tempHigh` from `tmax` at 24/28 with a comment that cold warnings lack `tmin`, and `tmax` copied into day objects) and `weatherVoiceRules.js` (tmax thresholds `TEMP_COLD_MAX_C` 6, `TEMP_GOOD_MIN_C` 12, `TEMP_EXCELLENT_MIN_C` 14, consumed through `useWeatherVoice`, which CC mentions only as a single-day consumer). Also `CampsiteComparisonSection.jsx` hard-codes `unit: "°C"` (line ~94) and "m/s" with no units handling, which is missing from the unit/rounding table and makes the proposal's "InstantComparison has no imperial handling" look unique when it is not.
Fix: run the directory-wide search over `src/lib` and `src/components` (excluding tests), record the exact command and hit count, and add an "extrema-only / hazard consumers (no mean)" subsection to `audit.md` plus the extra unit row. None of these is an averaging surface, so I expect no change to the options; the correction is about the audit's completeness claim.

## Notes (non-blocking)

- N1: I could not independently verify the Open-Meteo `temperature_2m_mean` claim (my fetch of the docs page was refused by provenance rules). CC's WebFetch result is VERIFIED SAMPLE from CC only, one page, one date; D2 should keep that grade. The averaging/completeness method stays UNKNOWN as CC says.
- N2: A concrete ranking example would help the owner decide Option 1-B: with the real `rankWarmest`, site A `[10, null, 10]` scores 4.67 and site B `[8, 8, 8]` scores 5.60, so B outranks A although A's known days are warmer (sandbox run, `days: 3`, no wind/rain). Suggest adding it as RC-08 in `reference-cases.md`, labelled hypothetical input.
- N3: The `icReasonWarmer` chip on the canonical homepage card rests on the 3-day mean of daily highs differing by >= 1.5 degC; "warmer" therefore means higher daytime highs, not warmer overall. Surface 2 options only offer a Brochure caption (A) or leave (E); consider noting this for the owner, no change required.
- N4: Cosmetic: `cc-report.md` line 45 (a garbled grep entry) and the sentence at line 50 are hard to read; tidy when correcting.
- N5: Option D1 "no API/cache change needed" holds only because hourly `temperature_2m` for 7 days is already requested; the completeness rule (24 valid hourly points per local day, date-prefix matching as in existing code) is a Phase B design item, as CC says.

## Limits of this review

- Staged snapshots only. I ran no tests, lint, build, git or browser on the owner's machine. The sandbox execution used copies of the staged `src/lib` files in a scratch directory (one import suffix patched); it is a sandbox check, not the owner's repo.
- Git baseline (HEAD `a7813482...`, unchanged, clean `git diff --check`), blob hashes, `git status` before/after and the claim that all searches were re-run are CC-attributed; I did not verify them.
- My greps cover the staged subset of `src` only; unstaged files remain UNKNOWN to me, which is why R2 asks CC for a directory-wide search.
- Open-Meteo semantics and production data completeness are UNKNOWN; I did not read the live GitHub issue or #400/#402.
- Icelandic wording quality is not assessed. No commit, push, deploy or GitHub mutation is implied.

## Next

Ripley: decide whether to send R1/R2 to CC as a narrow documentation-only correction (no code, no new audit scope), then a quick Jonesy re-check before the owner-facing proposal. #444 stays open: Phase B needs the owner's decisions and a normal prompt review.

## Ripley final assessment — 2026-10-26: REVISE

Accepted Jonesy R1/R2. Read the canonical workflow, active pointer, approved v1, CC report and result review; inspected the proposal headline/options and local git status. The summer-only fixture does not support the unqualified impact claim, and the inventory/unit gaps need correction before an owner decision. No application test rerun was necessary for this documentation-only assessment; Jonesy sandbox results and CC execution/provider claims remain attributed, not represented as my own runs.

Created approved-prompt-v2.md for the narrow Phase A correction, preserving v1. It also clarifies existing scope: ranking/scoring fixes require separate follow-up scope, provider mean semantics remain unverified, and a relabel cannot repair missing-to-zero arithmetic. CURRENT -> READY_FOR_CC. Owner sends Prompt approved to CC; Jonesy re-check follows. No code or GitHub changes; #444 remains open and Phase B requires owner approval plus normal prompt review.

---

# Re-check of correction v2 (R1/R2) — 2026-10-26

Reviewed: `approved-prompt-v2.md` vs the "v2 Correction" section of `cc-report.md`, the corrected `audit.md` (1.3, 1.4, new 1.4a, section 3), `reference-cases.md` (RC-06, RC-08, unit table), `implementation-proposal.md`, and the retained `scratch/` script and output. Source checked against staged snapshots; sandbox runs are labelled.

## Verdict: PASS (R1 and R2 resolved, Phase A only), with non-blocking notes

Phase A documentation is now consistent and bounded. This is not closure of #444: the ticket stays open until the owner decides and an approved Phase B passes normal prompt and result review.

## R1 - resolved (VERIFIED SOURCE + VERIFIED SAMPLE)

- The retained script now runs the RC-06 pair on 2026-06-15 (summer), 2026-10-27 and 2027-01-10 (winter), and logs season, `tempWeight` and `basePts`. Output retained: summer 8/Good vs 0/Bad; both winter dates 3/Fair both ways with `basePts` 4. This matches my own earlier sandbox runs.
- The explanation is correct: I ran `basePointsFromTemp` over -30..40 degC in 0.1 steps; the maximum is 10 in both seasons, `round(10 * 0.35) = 4`, so the winter `baseFloor` of 4 pins `basePts` for any `tmax`.
- The overclaims ("clearest finding", "highest-impact", "any day") are struck through or replaced in `audit.md` 1.4, `reference-cases.md` RC-06 and the cc-report headline. `implementation-proposal.md` Surface 4 now states season dependence, production frequency UNKNOWN, and that other winter inputs were not tested.

## R2 - resolved

- Directory-wide searches (`src/lib` 64 hits / 11 files; `src/components` 28 hits / 3 files, tests excluded) are recorded with exact commands and counts, and the report separates search coverage from lines actually read. The counts themselves are CC-attributed; I did not re-run them on the owner's machine.
- New 1.4a matches the source I read: `relocationEngine` heat warnings from `tmax` (24/28) with the documented skip of cold warnings because `tmin` is not in the engine's day objects, `tmax` passed through into the explain day; `weatherVoiceRules` thresholds 6/12/14 consumed as single-day values via `weatherVoiceEngine`/`useWeatherVoice`/`weatherVoiceShareSnapshot`. No option touches them.
- `CampsiteComparisonSection` hard-coded degC / m/s / mm with no units handling is now in the unit tables.

## Proposal accuracy - resolved

- `temperature_2m_mean` is attributed to CC's single fetch only, "cheapest/correct" language removed, completeness method UNKNOWN.
- D1 no longer implies a 24-sample design or a mandatory cache bump; D2 states the provider's aggregation is not fully documented.
- Surface 1 Option B (0-coercion) and Surface 4 Option B (scoring sentinels) are explicitly outside #444's own implementation scope and described as separate follow-up candidates; #444 Phase B must preserve scores/ranks/verdicts for identical inputs. Relabel-only limitation, "extrema of daily highs is not the period's true minimum" caveat for Option C, and the homepage "warmer" chip semantics are added.
- RC-08 added and matches my numbers: `rankWarmest` ranks B `[8,8,8]` above A `[10,null,10]` (avgTemp 8.0 vs 6.67), while `calcMetrics` would rank A first (10.0 vs 8.0); labelled hypothetical.
- Scratch safety unchanged: same four pure imports, same resolve-hook shim, no writes beyond the output file in the task folder.

## Notes (non-blocking, optional wording fixes)

- N1: Winter missing `tmax` is not "no effect" in general; it behaves like a mild day. In my sandbox (scratch copy of staged `scoring.js`, date 2027-01-10, wind 5, gust 6, weather code 1): `tmax` -10 and 0 give 4 points, `tmax` 6 to 25 and `null` give 5. With weather code 71: -10 and 0 give 0, 6 to 25 and `null` give 2. So `null` scores like a mild day in winter (via the `10` sentinel in the pleasantness/cold-penalty paths) but like a freezing floor in summer (via `-999` in `basePointsFromTemp`). CC's text is correctly hedged ("other winter inputs not tested"), but the Surface 4 line "silently scored as if it were colder than any realistic reading" is only true for summer base points; one sentence adding the winter behaviour would make it complete. Sandbox evidence, hypothetical inputs, production frequency UNKNOWN.
- N2: `cc-report.md` says `implementation-proposal.md` was corrected "struck through"; the file contains no strikethrough (old wording was replaced). `audit.md` also says my fetch was refused because network access was unavailable; the actual cause was a provenance restriction on the fetch tool. Both are cosmetic.
- N3: Earlier notes N2-N5 from the first review are addressed or accepted; the 2-3-site rank example now exists as RC-08.

## Limits of this re-check

- Staged snapshots only. I did not run tests, git, lint, build or a browser on the owner's machine. HEAD `a7813482...`, `git status`/`git diff --check` results, blob hashes, the search counts and the claim that the scratch script was re-run are CC-attributed.
- My sandbox runs used copies of staged `src/lib` files in a scratch directory (one import suffix patched) and are not the owner's repo state.
- Open-Meteo `temperature_2m_mean` and its averaging/completeness semantics remain UNKNOWN to me (no independent fetch); production data completeness UNKNOWN; live issue thread and #400/#402 history not read by me.
- Icelandic wording quality not assessed. No commit, push, deploy or GitHub mutation is implied.

## Next

Ripley: present the corrected owner-facing proposal (`implementation-proposal.md`) and its five decisions to Róbert. Phase B, if any, needs an approved Phase B prompt and normal Jonesy review; the two scoring/ranking follow-ups need their own scoped tickets.

## Ripley final assessment — 2026-10-26: PASS (Phase A only)

Read the approved v2 contract, corrected CC report/proposal and Jonesy's v2 PASS. Independently ran `node --import ./docs/ai/tasks/ticket-444/scratch/extensionless-loader.mjs ./docs/ai/tasks/ticket-444/scratch/reference-cases-script.mjs` in the owner's checkout (exit 0). Confirmed RC-01..08 output, including summer 8/Good vs 0/Bad, winter 3/Fair for both RC-06 inputs, and hypothetical B-before-A rank inversion. These are synthetic reference runs, not production frequency or full-suite evidence. Search counts/provider fetch remain CC-attributed. Local git status contains only CURRENT and this task directory.

R1/R2 resolved. Jonesy's optional winter-penalty note remains relevant: unchanged winter base points do not establish unchanged overall scoring for other fixtures; missing temperature can take the mild-day fallback in penalty paths. Provider mean semantics remain unverified. No application implementation authorized or completed. CURRENT CLOSED records completion of this Phase A review only; GitHub #444 remains open.

Owner-facing recommendation for a separately approved Phase B: presentation-only clarification of daily-high averages and periods; when the Weather Finder selected window has missing/non-finite maxima, show an explicit unavailable/incomplete display instead of presenting its zero-coerced ranking metric as an observed mean, without changing engine inputs or ranking. This missing-display refinement is a new proposal for owner approval, not CC work already performed. Add Brochure period/high qualifier and comparison high label. Proposed IS label: Meðaltal hámarkshita; EN: Average daily high. Retain scoring/ranking bugs as separate follow-up candidates, no automatic ticket creation. No new provider mean fetch recommended for this first bounded phase. Owner approval of exact scope is required by #444 and approved-prompt-v1 mandatory staging; then normal Phase B prompt review.

## Phase B result review (Jonesy) — 2026-10-26: REVISE (narrow, presentation/evidence only)

Scope reviewed: CC's Phase B implementation under approved-prompt-v3.md (cc-report.md "Phase B" section) against the staged snapshot of the repo. No code defect in the engine, helper or wiring was found; the REVISE is for one visible mobile layout regression (R1) and browser evidence that does not meet the binding J6/J10 list (R2).

### Verification basis

- **Read myself (staged snapshot):** weatherFinderDisplay.js, WeatherFinderCard.jsx (whole), WeatherFinder.jsx wiring, InstantComparison.jsx change and both call sites, translations.common.js keys, all five new test files, the e2e spec and Playwright config, ToastHub.jsx, results.txt, and the screenshots finder-complete-incomplete-en-mobile375, finder-period-switch-is-desktop, brochure-qualifier-is-desktop and comparison-temp-label-en-desktop (cropped). Not viewed: finder-complete-incomplete-en-desktop, finder-free-en-desktop, brochure-qualifier-en-desktop.
- **Sandbox (not the owner's machine):** Node copies of the staged weatherFinderRanking.js and weatherFinderDisplay.js. 20,000 randomized windows (lengths 0–8, days in {3,5,7,0,-1,2.5,undefined,null,"3"}, tmax drawn from valid, null, undefined, NaN, Infinity, string, 0, negative): whenever the helper reports complete, real rankWarmest avgTemp equals the plain mean of exactly the first N rows — 0 mismatches. RC-08 re-executed: B avgTemp 8.00 / score 5.60 ranks before A 6.67 / 4.67; helper says A incomplete, B complete. Display fix does not change engine behaviour.
- **Isolation on the snapshot:** blob hashes of weatherFinderRanking.js, scoring.js, comparisonUtils.js, forecastNormalize.js, useComparisonState.js, useLeaderboardScores.js and HomeDecisionCard.jsx equal the hashes recorded in Phase A audit.md (scoring/normalize/leaderboard match after LF normalization of the CRLF checkout). InstantComparison.jsx differs from its Phase A hash, as expected. forecastCache.js, compareCampsiteForecasts.js and App.jsx had no Phase A hash, so I cannot confirm them beyond CC's empty-diff claim.
- **i18n:** weatherFinderAvgTemp has no definition left in translations.common.js (only an explanatory comment); EN/IS each 404 keys, the only mismatches are the 3 pre-existing scoreExplanation_* names. comparisonFactorTemp has one consumer (CampsiteComparisonSection.jsx:91), file untouched.
- **CC-attributed, not verified by me:** test counts (205/205, 2858/2858), lint, build, the Playwright run itself, git status/HEAD/diff --check, and the repo-wide greps. I only saw the saved results.txt and screenshots.

### Required fixes

**R1 — Medium. Finder warmest row makes site names unreadable at 375 px (J6).** The metric block is `shrink-0 max-w-[55%]` and now wraps to 2–3 lines ("16.0°C — Average / daily high" plus a two-line period text). In finder-complete-incomplete-en-mobile375.png the names render as "Compar… →", "Base Ca… →", "Gap Vall… →" — about seven characters each, with short fixture names. Realistic campsite names are longer and 320 px (never measured) is narrower. CC's check (`name button width > 20px`) cannot detect this, so the test passes while J6's "readable/clickable names" is not met. The full name remains in the button's aria-label, so this is a sighted-user regression, not an a11y one.
Fix, scoped to the warmest row only and desktop unchanged: let the name keep the row's width at narrow viewports (for example stack the metric block under the name below `sm`, or drop the 55% cap and allow the name to wrap), without changing any wording, key, period line or ordering. Acceptance: at 320 and 375 px the fixture names "Warm Complete", "Compare Other", "Gap Valley", "Base Camp" are not truncated (assert name element scrollWidth <= clientWidth, not a width > 20 px proxy); add one long-name fixture and state what happens to it (wrap or ellipsis beyond a stated length); no horizontal overflow; button still clickable; calmest/driest rows visually unchanged.

**R2 — Medium (evidence). Browser verification does not meet binding J6/J10.**
- **Toast not actually dismissed.** Three of six screenshots show the offline toast on top of content: it covers the rank-1 row in the 375 px shot, so the 18.0°C complete row is not visible in the mobile evidence, and it covers row 2 in the IS desktop shot and part of the list in the comparison shot. `dismissPwaToastIfPresent` clicks a "Later"/"Síðar" button that this toast does not have; ToastHub.jsx renders a "Dismiss" (✕) button, and `.catch(() => {})` hides the miss. J10 asked for actual dismissal.
- **Viewport/language matrix below the binding text.** Only 375 px, EN, Pro was run on mobile. Missing: 320 px; IS at narrow width; incomplete state in IS at narrow width; Free on mobile. The cc-report states it ran a "representative subset" honestly, but J6/J10 name 320/375/desktop, both languages and the incomplete state.
- **Imperial.** The card unit test covers imperial complete only; the parent integration tests use `units="metric"` only, and no browser scenario exercises imperial although the contract asks for metric/imperial valid and incomplete cases "where reachable".
Fix: dismiss the toast via its "Dismiss" button and assert it is gone before every screenshot; run the Finder warmest scenario (complete and incomplete rows visible, rank 1 visible) at 320, 375 and desktop in EN and IS, Free at 375; add a parent-level imperial case (complete shows °F, incomplete shows no number); re-save screenshots and results.txt. If imperial is not reachable in the browser, say so with the reason rather than leaving it silent.

### Notes (non-blocking)

- **N1.** WeatherFinderCard.test.jsx pins `{complete: true, windowLength: null}` → shows the engine value. J4 says malformed metadata is incomplete. Unreachable through the real parent (helper never returns that shape), so low risk, but either fail closed or state the deliberate exception in the test comment.
- **N2.** InstantComparison uses `t?.("icTempQualifier") || "Average daily high, up to 3 days"`; an English fallback would show in IS if a key were missing. Parity makes it unreachable; low.
- **N3 (J7, visible in evidence).** In finder-period-switch-is-desktop.png the "Ófullnægjandi gögn" row (Gap Valley) is ranked above a complete 10.0°C row, because ranking still uses the zero-coerced mean. This is the owner-approved retained limitation; keep the scoring/ranking follow-up candidate open.
- **N4.** approved-prompt-v3.md: the appended "Jonesy J1–J10 — accepted in full" block repeats the Phase A J1–J9 text and points to a "J10 below" that is not there. The "Binding resolutions" section is what governs; doc glitch only, Ripley may tidy.
- **N5.** In the 375 px shot the Calmest tab looks selected while the list is Warmest. Probably a transition artifact; UNKNOWN, check when re-shooting.
- The Brochure qualifier text is small and faint (`text-[10px]`, slate-400); I did not measure contrast.

### Checked and fine

Helper is completeness-only and fails closed for invalid days, holes, NaN/Infinity/strings; 0 and negative tmax valid; later rows ignored. Metadata is built from the same sites/options.days and keyed by id. Card shows the unchanged engine value when complete, "Insufficient data" otherwise, never a number; calmest/driest untouched. Pro 3→5→7 and Free-3 are covered through the real parent with seven-row fixtures. RC-08 order is asserted through the real UI. Brochure qualifier is gated on the same null check as the row; comparison label changed by value only. No new dependency or scoring/provider/cache change visible.

### Limits of this review

Staged snapshot only; nothing run on the owner's machine (no tests, lint, build, git or browser). Test counts, lint, build, git claims and the Playwright run are CC-attributed. My greps cover the staged subset of src. Production data completeness and Open-Meteo behaviour are UNKNOWN. IS wording quality is not assessed. The three screenshots I did not view are unreviewed. No commit, push, deploy or GitHub change is implied; #444 is not closed.

### Next

Ripley: send R1/R2 to CC as a narrow correction (layout of the warmest row only, spec/evidence improvements, imperial parent test; no wording, ranking or scoring change), then a quick Jonesy re-check.

## Ripley final assessment — 2026-10-26: REVISE (Phase B)

Accepted Jonesy R1/R2 after inspecting current card/helper and browser-spec assertions. Name width >20px is insufficient evidence of readable names; the retained six-scenario subset does not satisfy the approved mobile/language matrix or actual toast dismissal. Independently ran the five new targeted Vitest files: 45/45 passed. First sandbox attempt failed before tests with temporary-file rename EPERM; rerun outside sandbox passed. Full suite/lint/build/browser results remain CC-attributed; I did not independently rerun those. No fresh browser verification claimed.

Created approved-prompt-v4.md for warmest mobile layout, corrected browser evidence, imperial parent test and the existing binding malformed-metadata fail-closed requirement. v3 is immutable; its mistaken repeated Phase A condition block is acknowledged rather than rewritten. CURRENT READY_FOR_CC. No implementation edits by Ripley; owner sends Prompt approved to CC, then Jonesy re-check. #444 remains open; no git/GitHub mutation.

# Phase B re-check of correction v4 — Jonesy, 2026-10-26

## Verdict: REVISE (very narrow, LOW-MEDIUM — one class on one element, plus one owner-side check)

R1, R2 and the J4 fix are resolved. I found one new, small desktop layout regression introduced by the R1 fix (R3) and one unexplained full-suite failure that CC labels pre-existing (C1). Neither touches ranking, scoring, wording or data.

## Verification basis

- **Read myself (staged snapshot):** WeatherFinderCard.jsx (whole), WeatherFinderCard.test.jsx and WeatherFinder.completeness.test.jsx test lists, the rewritten e2e spec (whole), playwright.ticket444.config.js, results.txt, v4 cc-report section, App.affiliateHolder.test.jsx (grep). Screenshots viewed: finder-matrix-320-en, finder-matrix-320-is, finder-long-name-375, finder-free-en-375, finder-imperial-en-desktop. Not viewed: finder-matrix-375-en/-is, finder-matrix-desktop-en/-is, finder-period-switch-is-desktop, Brochure and comparison shots (only re-run, previously reviewed).
- **Unchanged since my last review (device mtimes and hash):** weatherFinderRanking.js hash 5538db26… (equals Phase A), weatherFinderDisplay.js, WeatherFinder.jsx and translations.common.js mtimes equal the v3-round values, so v4 did not touch helper, parent wiring or strings. My earlier sandbox parity result (20,000 windows, RC-08) therefore still applies.
- **CC-attributed, not verified by me:** vitest 209/209 on 13 files, full suite counts, lint, build, empty git diff, HEAD unchanged, and the 12/12 Playwright run (I saw only results.txt and screenshots). Ripley separately reports 45/45 on the five new targeted files (his run, not mine).

## Resolved

- **R1 (names readable).** Warmest rows now stack below `sm`. 320 px EN and IS screenshots show "Warm Complete", "Compare Other", "Base Camp", "Gap Valley" in full, metric and period on their own line, no horizontal overflow. The long fixture "Tjaldsvæðið við Jökulsárlón Austur" shows in full at 375 px and ellipsizes at 320 px (documented, button still visible); assertions now use name-span scrollWidth <= clientWidth.
- **R2 (evidence).** Toast helper targets the real "Dismiss" control and fails loudly; no toast appears in any screenshot I viewed, and rank 1 is unobscured. Matrix 320/375/desktop × EN/IS is present (6 scenarios), plus Free 375, Pro IS 3→5→7 with seven-row fixtures, imperial desktop (64°F, 61°F, 50°F, 48°F, "Insufficient data" for the incomplete site), request accounting showing the null day reached the parent, Brochure both languages and comparison row. The imperial parent-level Vitest cases exist.
- **J4.** Card shows the number only for `complete === true` with a valid positive-integer windowLength; the old malformed test is corrected and extra malformed cases are added.
- **Isolation.** Engine hash equal; i18n, helper and parent untouched in v4; calmest/driest keep their previous markup.

## Required fix

**R3 — Low-Medium. Desktop warmest rows are no longer right-aligned, contrary to CC's "visually unchanged on desktop".** In finder-imperial-en-desktop.png the metric/period block sits directly next to each name at a different x position per row ("Warm Complete → 🔥 64°F …", "Gap Valley → 🔥 Insufficient data"), instead of the right edge as in the v3-round desktop screenshot and as calmest/driest still render. Cause in the code: the new name wrapper `<div className="flex items-center gap-3">` has no growth class, so at `sm:flex-row` it shrinks to content and `sm:text-right` on an auto-width block has no effect. Fix: give that wrapper `min-w-0 sm:flex-1` (name keeps its truncate behaviour) and nothing else; mobile stacking unchanged. Acceptance: one desktop screenshot where all five metric blocks align to the right edge, plus a spec assertion (for example right edges of the metric blocks equal within 1 px, or a metric left edge greater than the name wrapper's right edge by the free space); re-run the 320/375 name-geometry assertions to show they still pass. The spec's desktop scenarios did not catch this because they assert text and truncation only.

## Condition for the owner (not a code change)

**C1 — unexplained full-suite failure.** CC reports `src/App.affiliateHolder.test.jsx` ("one impression through a real campsites reload/remount", FakeIntersectionObserver instance undefined) failing in v4, while its own v3 round reported 192/192 and 2858/2858 the same day. CC's evidence that it is pre-existing is real but incomplete: the file and App.jsx are untouched, the test's last commit is 2026-10-14, and it fails in isolation. In my reading the test mocks WeatherFinder entirely (line 57), so #444's changes cannot reach it; I cannot see what differs between the two runs, and I did not run it. Please run that single file a few times on your machine, ideally once on a clean checkout without the #444 working-tree changes, and record the result (flaky, date/time-dependent, or environmental). Until then, do not describe the full suite as green.

## Notes (non-blocking)

- The mode tabs look mid-transition in several screenshots (Calmest dark while Warmest grey). The class logic in WeatherFinder.jsx is correct and the list title says Warmest, so I treat this as a screenshot timing artifact (N5, not a product bug); not verified in a live browser.
- Geometry assertions cover "Warm Complete" and "Gap Valley" only (v4 listed four names); the 320 screenshots show all four in full, so I accept it.
- The floating scroll-to-top button overlaps the right edge of rank 1 in full-page screenshots; it is a fixed element, not part of this change.
- J7 limitation unchanged and still visible: Gap Valley (insufficient data) is ranked above complete lower-temperature sites.

## Limits of this re-check

Staged snapshots only; nothing run on your machine (no tests, lint, build, git, browser). CC's counts, lint, build, git and Playwright run are CC-attributed. Seven of the screenshots were not viewed (listed above). The App.affiliateHolder failure is not reproduced or explained by me. Open-Meteo/production data and IS wording quality remain outside this review. No commit, push, deploy or GitHub change is implied; #444 is not closed.

## Next

Ripley: send R3 to CC as a one-class correction with the screenshot and assertion above; ask Róbert to do C1. Then a short Jonesy re-check. If Ripley prefers, R3 can instead be accepted as a documented cosmetic deviation, but the claim "unchanged on desktop" must then be corrected in the report.

## Ripley final assessment — 2026-10-26: REVISE (v4 re-check)

Accepted resolved R1/R2/J4 and Jonesy's remaining R3: current name wrapper lacks desktop flex growth, so approved desktop alignment is not preserved. Created approved-prompt-v5.md for the one-wrapper class correction plus desktop geometry evidence and mobile regression rechecks. No production edits by Ripley.

Independently checked empty diff for all ten protected engine/App/hooks files. Independently ran helper/card/parent plus App.affiliateHolder: 4 files, 46/46 tests passed. Then ran App.affiliateHolder alone: 4/4 passed. Both commands executed outside sandbox for the known Vitest temp-file limitation. C1 failure not reproduced, cause UNKNOWN; neither a full-suite PASS nor conclusive pre-existing classification follows. No owner rerun required merely to duplicate these checks. Browser/lint/build and v4 full-suite counts remain CC-attributed.

CURRENT READY_FOR_CC referencing v5; owner sends Prompt approved to CC, then Jonesy re-check. No git/GitHub changes; #444 remains open.

# Phase B re-check of correction v5 — Jonesy, 2026-10-26

## Verdict: PASS (Phase B, presentation-only), with non-blocking notes and C1 left UNKNOWN

R3 is resolved. No new defect found. This is a PASS of the #444 Phase B implementation as a whole (v3 + v4 + v5) from my side; it is not issue closure, a commit approval or a claim that the whole suite is green.

## Verification basis

- **Read myself (staged snapshot):** the v5 prompt, the v5 cc-report section, WeatherFinderCard.jsx around the changed wrapper, the new alignment assertion in the e2e spec, results.txt. Screenshots viewed: finder-matrix-desktop-is, finder-imperial-en-desktop, finder-matrix-375-en. Not viewed this round: finder-matrix-desktop-en, 320 shots (unchanged by CSS that applies only at `sm`+, and reviewed in v4), Brochure, comparison, Free, period-switch, long-name.
- **Unchanged (hash/mtime):** weatherFinderRanking.js hash 5538db26… (equals Phase A); weatherFinderDisplay.js, WeatherFinder.jsx and translations.common.js mtimes equal the v3-round values. Earlier sandbox parity (20,000 windows, RC-08) still applies.
- **CC-attributed, not verified by me:** build, vitest 56/56 on four files, full suite 192/192 files and 2862/2862 tests, Playwright 12/12, empty engine diff, HEAD unchanged.

## R3 — resolved

The warmest name wrapper now has `min-w-0 sm:flex-1`; the metric block carries `data-testid="weather-finder-warmest-metric"`. In the IS and imperial desktop screenshots all five metric blocks (including "Ófullnægjandi gögn"/"Insufficient data") share the right edge, as calmest/driest do. The new assertion collects every testid'd block on desktop, requires more than one, and bounds `max(right) - min(right) <= 1`; it would have failed on the v4 layout, so it has teeth. The 375 px screenshot still shows names in full with metric and period stacked underneath, so v4's R1 fix is intact (the `sm:`-only class does not change mobile).

## C1 — remains UNKNOWN

CC now records the v4 `App.affiliateHolder` failure as unreproduced and intermittent-or-environmental, neither fixed nor proven pre-existing, and reports it passing in this round's full run. That wording is acceptable. One correction to its attribution: I did not run that test; my earlier statement was a reading of the code (the test mocks WeatherFinder, so #444 cannot reach it), not an independent execution. Ripley's local runs are his own. Cause stays UNKNOWN; any later recurrence should be handled as its own ticket, not under #444.

## Notes (non-blocking)

- The alignment assertion runs only in the desktop case, by design.
- Name-geometry assertions cover "Warm Complete" and "Gap Valley"; screenshots show all four fixture names in full at 320/375.
- Mode tabs look mid-transition in some screenshots (class logic is correct; screenshot timing artifact, not verified live).
- J7 limitation unchanged and visible: an "insufficient data" site still ranks by the old zero-coerced mean (Gap Valley appears last here only because of the fixture values, and appeared above complete sites in earlier IS evidence). Zero-coercion in `rankWarmest` and the `scoring.js` sentinels remain separate follow-up candidates.
- approved-prompt-v3.md still contains the repeated Phase A conditions block (documented by Ripley; not edited).

## Limits of this review

Staged snapshots only; nothing run on your machine (no tests, lint, build, git, browser). CC's test, build, git and Playwright results are CC-attributed. Several screenshots were not viewed this round (listed above). Production data, Open-Meteo behaviour and IS wording quality are outside this review. No commit, push, deploy or GitHub change is implied; #444 is not closed.

## Next

Ripley: final assessment of Phase B. Róbert decides on commit/push/deploy through the normal flow and on whether to open the separate zero-coercion/scoring follow-up tickets.

## Ripley final assessment — 2026-10-26: PASS (Phase B complete)

Accepted Jonesy's v5 PASS for the combined v3/v4/v5 presentation implementation. Read current workflow, v5 report/review and actual wrapper/alignment assertion. Independently reran `npx vitest run src/components/WeatherFinderCard.test.jsx src/components/WeatherFinder.completeness.test.jsx src/lib/weatherFinderDisplay.test.js src/components/WeatherFinderCard.select.test.jsx` outside sandbox: 4 files, 56/56 tests passed. Independently inspected retained finder-matrix-desktop-is.png: metric/period blocks share the right edge, readable names and the incomplete state are visible. This is inspection of CC's retained screenshot, not an independent live browser run. Protected ten-file engine/App/hooks diff is empty. git diff --check checked separately.

CC's current 12/12 Chromium scenarios, successful build and 2862/2862 full-suite run remain CC-attributed; no independent rerun of the entire suite/browser/build claimed. R1/R2/R3/J4 are resolved. C1 earlier affiliate test failure remains unexplained and not fixed/proven pre-existing; my prior local passes and CC's latest full-suite pass are recorded evidence only. No unsupported production/provider or cross-browser claims.

Owner-approved result: daily-high labels and periods clarified, incomplete Finder values withheld, Brochure qualifier and comparison label corrected; scoring/ranking/provider inputs unchanged. Retained limitation: incomplete candidates still rank using the existing zero-coerced metric. Ranking missing-data and scoring sentinels remain separate follow-up candidates, no issues created. CURRENT CLOSED; no commit/push/deploy or GitHub closure. Owner reviews/commits and pushes manually.
