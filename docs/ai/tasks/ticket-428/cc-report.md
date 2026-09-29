# #428 — CC report (approved-prompt-v1.md)

`CURRENT.md` moved READY_FOR_CC → CC_IN_PROGRESS first. Working tree at start: clean except the ticket-428 workflow documents (prompt-review.md, approved-prompt-v1.md, CURRENT.md pointer). No commit, push, deployment or issue closure performed. Audited revision: `82994d3e6a0098a4f800e9f9f870ce703d826755` (HEAD at task start), working tree otherwise clean.

## 1. Verdict

**The issue #428 premise is not reproducible against current source. No coupling between `windPen` and `precipTimingMultiplier`/rain exists anywhere in the scoring pipeline, in any consumer, or at any point in the inspected git history.** This confirms the preflight and Jonesy's Round 1 review exactly; no production model change was made, per the approved prompt's default expected deliverable.

## 2. Independent source audit (§1 of the approved prompt)

Re-read `src/lib/scoring.js` in full, independently of the preflight's citations. Confirmed at current line numbers:

- `scoreSiteDay()` (`src/lib/scoring.js:305-375`): `windPen = Math.round(windPenRaw * cfg.windWeight)` (line 330) and `rainPen = Math.round(rainPenBase * precipTimingMultiplier * cfg.rainWeight)` (line 331). `windPen`'s expression contains no reference to `rain`, `rainPenBase`, or `precipTimingMultiplier` in any form. `precipTimingMultiplier` (line 326-328, from `getPrecipTimingMultiplier({rain: _rain})`, line 292-300) is used exactly once, in the `rainPen` expression, and nowhere else in the function.
- `windPenaltyPoints(w, season)` (line 56-70): takes only `(w, season)`. Rain cannot reach it through any argument.
- `gustPenaltyPoints(gust, windMax, season)` (line 128-157): takes `(gust, windMax, season)`. No rain parameter.
- `getPrecipTimingMultiplier({rain})` (line 292-300): reads only `rain`; gates `mm < 1 → 0, else → 1`. Applied only inside the `rainPen` expression (line 331).
- `round1()` (line 253-255) is applied to `_windMax`/`_windGust` and separately to `_rain` (lines 308-311) — each field is independently rounded to 1 decimal before use; rounding one does not touch or derive from another.

**One correction to my own prior (separate, unrelated) session's audit document for this repo**: in an earlier, unrelated read-only architecture audit this session, I had stated that `cfg.windWeight`/`cfg.rainWeight` are "defined but never consumed" in `scoreSiteDay`. Re-reading the live source for this ticket shows that is wrong — lines 330-331 do multiply by both weights; they are simply both `1.0` in the current `getSeasonConfig` for both seasons (line 17-32), so the multiplication is a currently-inert no-op, not literally unused code. I will correct that separate document; it does not affect this ticket's verdict (windPen still never references rain either way).

Confirmed no additional wind-penalty call sites exist: `grep -rn "windPenaltyPoints("` finds only the definition and the one call at line 322.

## 3. Consumer map, verified against current source (§1)

| Consumer | Path | Coupling found |
|---|---|---|
| `useForecast.js` | `normalizeDailyToScoreInput(daily, hourly)` → `scoreSiteDay(row)` per row | None |
| `MapView.jsx` (`fetchForecastAndScore`, lines 34-41) | Identical two-call pattern to `useForecast.js`, independently re-read this ticket | None |
| `useLeaderboardScores.js` (`computeScoreFromData`, lines 65-84) | Builds raw daily rows directly from `data.daily.*` (no `forecastNormalize` step) → `scoreSiteDay(r)` per row → sums `r.points` (clamped) | None |
| `relocationEngine.js` (Route Planner) | `normalizeDailyToScoreInput` → attaches `shelter` → `scoreDaysWithRainStreak(days, opts)`, which spreads `scoreSiteDay(d)` per day before applying the *separate* rain-streak penalty (`scoring.js:181-237`) | None in the wind component; the streak penalty is an intentional, separate, rain-only aggregate mechanism — see §5 |
| `scoreDay` (legacy alias, `scoring.js:378-380`) | `scoreDay({tmax,rain,windMax,windGust,date})` just calls `scoreSiteDay` with the same shape, dropping `shelter`/`weatherCode`/`code` | None; confirmed by grep to have **zero call sites** anywhere in `src` outside its own definition — dead code, consistent with Jonesy's Round 1 note |
| `forecastNormalize.js` hourly path (`getDayHourlyMetrics`, lines 23-106) | Wind (`windMax`/`windGust`, from `hourly.windspeed_10m`/`windgusts_10m`) and rain (`rain`, from `hourly.precipitation`) are accumulated in the same per-hour loop from three separate arrays, with no cross-term between them; the "severe" weight-floor override (line 59-60, `rawWind>=22 \|\| rawGust>=28`) depends only on wind/gust, never on rain | None |
| `src/lib/weatherVoiceRules.js` | Not in the original consumer map; found via a repo-wide grep for `windPen` while following "actual callers and aliases, not just this initial map" (§1). Re-uses the *numeric constants* `5`/`10`/`15` (winter `windPenaltyPoints` band edges) as its own independent expressive-copy thresholds, explicitly documented in its own header comment as a deliberate constant reuse, not a scoring dependency. It does not call `scoreSiteDay`, `windPenaltyPoints`, or any rain-related scoring function. | None — out of scope (display copy, not scoring), noted for completeness |
| `shelterUtils.js` | Has an unrelated local variable also named `windPenalty` (the Shelter Index's own `avgWind/15*70` display formula) — confirmed structurally unrelated to `scoreSiteDay`'s wind penalty; no shared code, no rain reference either | None |
| `ForecastTable.jsx`, `RoutePlannerDetailsModal.jsx` | Pure display consumers of the already-computed `windPen` field (table cell / debug row rendering) | None — no recomputation |

## 4. Git history inspection (§2)

Both hashes Ripley cited were independently confirmed to exist and re-derived from scratch (Jonesy's Round 1 review could not do this — `device_bash` was unavailable to that session):

```
git cat-file -t 4e72d492... / dfe7ac17...   -> both "commit"
git show -s --format="%H %ad %s" --date=iso 4e72d492 dfe7ac17
  4e72d49277669b26627903fd997208ad985ea26b 2026-02-19 19:35:11 +0000 Fixes #115 sesonal logic og winter mode
  dfe7ac17ba0de7e5e0801a2b9d2afa4d26e079c9 2026-03-18 18:04:16 +0000 Fix: #174 Time-Aware Scoring (Late Precipitation Impact)
```

- **`4e72d492` (2026-02-19)** introduced the independent-weight formula at its origin: `windPen = Math.round(windPenRaw * cfg.windWeight)` and `rainPen = Math.round(rainPenRaw * cfg.rainWeight)`, already two separately-weighted, non-cross-referencing expressions from the very first commit that added per-season weighting. Full diff inspected.
- **`dfe7ac17` (2026-03-18, #174)** introduced `getPrecipTimingMultiplier` and wired it into `rainPen` only: `rainPen = Math.round(rainPenBase * precipTimingMultiplier * cfg.rainWeight)`. The `windPen` line in this diff is untouched — still `windPen = Math.round(windPenRaw * cfg.windWeight)`, no rain reference added. Full diff inspected; confirms the preflight's claim exactly.
- **A history detail beyond the preflight's citation, found while inspecting `dfe7ac17`'s full diff**: the original `getPrecipTimingMultiplier` from #174 also took `precipStartHour`/`precipDurationHours` and had a `0.5`-multiplier branch for "late, short, minor" rain (a genuine time-of-day rain feature). Commit **`4cd1500b` (2026-03-26, "Fix: #185 Refactor RoutePlannerCard.jsx")** later simplified this down to the current `{rain} → mm<1?0:1` form, removing the time-of-day branch entirely. This is why `getPrecipTimingMultiplier` is now redundant with `rainPenaltyPoints`'s own `<1mm` tier — exactly as `docs/model-baseline-v1.0.md` already documents ("the multiplier field exists for future extension"). This is rain-only history; it never touched `windPen` at any point. No documentation change needed — the existing doc's characterization is accurate and now has an exact commit citation to back it.
- **Broadened history search** (going beyond the preflight's own narrow exact-string search, per §2's instruction not to rely solely on it): `git log --all --oneline -S"windPenRaw" -- '*.js' '*.jsx'` across all branches returns exactly one commit — `4e72d492`, the origin. No other commit on any branch has ever added or removed a `windPenRaw` reference, meaning no historical coupling was ever introduced and later silently reverted, as far as this token-level search can detect. This is stronger evidence than the original exact-string search reported in the preflight, but is still a token-level search, not a formal proof — see Limitations.

## 5. Regression tests added (§3, §4)

No production code was changed (default expected deliverable — no coupling found). Four new, focused test files, all using the real, unmocked scorer per §4's explicit requirement:

1. **`src/lib/scoring.windRainIndependence.test.js`** (6 tests) — core formula-level regression on `scoreSiteDay`. Dry-windy day at 18 m/s, summer and winter, rain ∈ {0, 0.9, 1, 4}: `windPen`/`components.wind` asserted identical across all four rain values in both seasons, while `rainPen` is asserted to vary `[0, 0, 2, 5]` (proving the assertion isn't vacuous). A dedicated test isolates the rain-only delta on `totalRaw`/`pointsRaw` (not the clamped `points`, which floors to 0 in both the dry and wet case here) — `dry.totalRaw - wet.totalRaw` is asserted to equal exactly `wet.rainPen - dry.rainPen`, so a wind regression could not hide behind the 0-clamp the way this specific scenario's own rain effect does. A calm-control case (windMax=3, non-saturated) rules out the independence being an artifact of wind already sitting at its ceiling. A gust case (windMax=10, windGust=16) confirms `gustPen` is equally rain-independent, both seasons. A dedicated test locks down the existing 0.94-vs-0.95mm `round1()` boundary (`rainPen` flips `0→2`; `windPen` does not move) — this documents current rounding semantics without changing them, per §3's explicit requirement.
2. **`src/lib/forecastNormalize.windRainIndependence.test.js`** (2 tests) — the hourly-normalized path shared verbatim by `useForecast.js` and `MapView.jsx` (both call `normalizeDailyToScoreInput` then `scoreSiteDay` in identical order; testing the shared function once covers both call sites proportionally rather than duplicating a full React-hook/component harness for each). One test drives two hourly fixtures with identical wind/gust series and different rain series through the real `normalizeDailyToScoreInput` → `scoreSiteDay`, asserting identical `windMax`/`windPen`/`components.wind` and differing `rain`/`rainPen`. A second test covers the **daily-fallback branch** (no hourly data for the date) the same way, per §4's explicit requirement to cover "raw daily and hourly-normalized inputs plus daily fallback."
3. **`src/hooks/useLeaderboardScores.windRainIndependence.test.js`** (1 test) — the leaderboard's own raw-daily-row path, through the real (unmocked) hook and its internal `computeScoreFromData`, with only `getForecast` mocked. Uses a mid-range, non-clamped scenario (tmax=12, windMax=8 → hand-derived dry=7 points, wet(rain=4mm)=2 points) specifically chosen so that if `windPen` were coupled to rain the dry-site score would come out wrong and visibly different (8 instead of 7) — not silently pass behind a clamp.
4. **`src/lib/relocationEngine.windRainIndependence.test.js`** (2 tests) — the Route Planner's `scoreDaysWithRainStreak` (used internally by `relocationEngine.js`), explicitly distinguishing the underlying per-day wind component (`windPen`/`components.wind`, fixed at every day of a 3-day wet streak) from the streak/aggregate outcome (`rainStreakPen`/`pointsRaw`/`points`, which legitimately increases day over day as the streak lengthens — `[0,1,2,0]` and `[4,3,2,9]` respectively). A second test holds a wet streak fixed and varies only wind between two runs, showing the streak penalty is identical in both while the wind-driven point gap is exactly the expected `10` points.

No final-ranking/rankings-must-match assertions were added anywhere (§4's "do not force identical final rankings across different inputs" — not applicable here since no two different-input scenarios were expected to rank identically; each test isolates one variable at a time).

## 6. Validation — exact commands and results

- `npx vitest run src/lib/scoring.windRainIndependence.test.js src/lib/forecastNormalize.windRainIndependence.test.js src/hooks/useLeaderboardScores.windRainIndependence.test.js src/lib/relocationEngine.windRainIndependence.test.js` → **4 test files, 11 tests, all passed** (one `-0` vs `0` `Object.is` assertion had to be corrected to `=== 0` during authoring — a test-assertion artifact of JS's signed-zero semantics on `-windPen` when `windPen` is `0`, not a scoring defect; fixed before this final run).
- `npx vitest run src/lib/scoring.test.js src/hooks/useForecast.scoringInvariance.test.js src/MapView.test.jsx src/lib/relocationEngine.test.js src/lib/relocationEngine.regression.test.js src/lib/relocationEngine.timeWeight.test.js src/lib/relocationEngine.badDayVeto.test.js src/lib/relocationEngine.roughWindow.test.js` → **8 test files, 113 tests, all passed** (existing scoring/forecast/map/relocation suites, unaffected).
- `npx eslint` on all 4 new test files → exit 0, no output.
- Full project `npx vitest run` → **146 test files, 2031 tests, all passed** (up from #427's 2020 — the delta is exactly this ticket's 11 new tests across 4 new files; no existing test's count changed).
- `npm run build` **not run**: no production/executable file was changed (only 4 new `*.test.js` files were added; `scoring.js`, `forecastNormalize.js`, `useLeaderboardScores.js`, `relocationEngine.js` are all untouched), so the approved prompt's own "build if executable files change" condition does not apply. `git status --short` confirms only test files plus the ticket-428 workflow docs and `CURRENT.md`'s pointer changed.

## 7. Documentation check (§5)

`docs/model-baseline-v1.0.md` §C.3/§C.4 already documents the wind/rain separation and the `precipTimingMultiplier`'s redundancy accurately — independently re-confirmed against live source and now additionally cross-referenced against the exact commit (`4cd1500b`) that produced the current redundant form (§4 above). No documentation error was found; no doc change made, per §5's "do not manufacture a formula change" / correct only a found error instruction.

## 8. Boundaries confirmed not touched

No change to wind thresholds, weights, rain thresholds, season behavior, rounding, hourly weighting, shelter, gust, pleasantness, streak, gating, recommendation policy, or cache behavior. No backend, new libraries, TypeScript, explicit import extensions, new UI, or unrelated refactor. No adjacent normalization/missing-data/cache/model issue was fixed (none was found in scope of this investigation to begin with). The redundant `getPrecipTimingMultiplier` gate was left in place, not removed as cleanup, per the explicit boundary. The only files touched are the 4 new test files listed in §5, plus this task's own `docs/ai/tasks/ticket-428/` directory and `CURRENT.md`'s pointer.

## 9. Limitations

- The broadened `-S"windPenRaw"` history search (§4) is a token-level, exact-string `git log` search across all local branches; it cannot detect a coupling that used different variable names, was expressed without that exact token, or exists only in a branch/remote not present in this local clone. It is stronger evidence than the preflight's original narrower search, but still not an exhaustive proof.
- This audit covers the checked repository revision (`82994d3e...`) only. Per CLAUDE.md, deployment is automatic on push to `main`; this report does not itself confirm which revision is currently live in production — consistent with the preflight's own stated limitation.
- `weatherVoiceRules.js`'s constant reuse was checked and found unrelated to actual scoring, but it was not in the original prompt's consumer list; flagging it here in case its existence is itself new information for the reviewers.

## 10. Status

Not committed, not pushed. `CURRENT.md` set to CC_COMPLETE with this report's path populated. `git status --short`: `docs/ai/CURRENT.md` (modified), `docs/ai/tasks/ticket-428/` and the 4 new test files (untracked). Jonesy review path: `docs/ai/tasks/ticket-428/result-review.md`. Task not closed by CC.
