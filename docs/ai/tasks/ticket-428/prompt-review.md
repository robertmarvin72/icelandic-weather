# #428 — Wind/rain coupling investigation — Round 1

Date: 2026-09-29. Ripley. Discussion/review only, not executable.
Issue: https://github.com/robertmarvin72/icelandic-weather/issues/428

## Preflight findings

#427 is CLOSED; working tree clean at preflight. The issue alleges windPen is multiplied by precipTimingMultiplier. Current source contradicts that premise: scoring.js computes windPen = Math.round(windPenRaw * cfg.windWeight), and applies precipTimingMultiplier only to rainPen. docs/model-baseline-v1.0.md sections C.3/C.4 already document this separation.

Read-only Node reproduction with tmax=15, windMax=18, windGust=18, rain=[0,0.9,1,4], dates 2026-07-15 and 2026-01-15 yields windPen=10 in every case. rainPen is respectively 0,0,2,5. This confirms repository behavior, not which revision is deployed live.

Git blame traces the independent wind formula to 4e72d4927 (2026-02-19). Commit dfe7ac17ba0de7e5e0801a2b9d2afa4d26e079c9 (#174, 2026-03-18) introduced the timing multiplier on rain only; inspected diff does not couple wind to rain. An exact-string git-log search found no windPenRaw * precipTimingMultiplier occurrence; absence from this narrow search is not proof across all historical spellings or deployed versions.

Initial consumer map: useForecast and MapView normalize daily/hourly via forecastNormalize before scoreSiteDay; useLeaderboardScores constructs raw daily rows and sums clamped points; relocationEngine normalizes, adds shelter and invokes scoreDaysWithRainStreak, which wraps scoreSiteDay. scoreDay is a legacy wrapper. Intentional hourly weighting can change wind inputs; do not confuse that with rain coupling or require equal scores across raw/weighted paths.

## Proposed task — evidence and regression protection first

1. Independently audit scoreSiteDay, windPenaltyPoints, rainPenaltyPoints, getPrecipTimingMultiplier, rounding and all direct/indirect consumers before writing code. Record exact revision and a source-to-UI matrix for campsite detail/forecast, map, Top 5 and route planner, including input field names, normalization, aggregation, shelter/rain streak and relevant caches. Follow actual callers and aliases, not just this initial map. Existing UI entrypoints already exist; no new UI needed.
2. Inspect relevant git history (including multiplier introduction and later edits) to distinguish an actual defect, already-fixed defect, or unsupported audit premise. Cite inspected hashes and formulas; do not invent intent or claim production deployment parity without evidence. If deployment revision is unavailable, explicitly limit the conclusion to the checked repository revision.
3. If current separation is confirmed, leave production scoring and normalization untouched. Add focused regression tests proving rain cannot suppress the wind component: dry windy day at 18 m/s, summer/winter, rain 0/sub-1/1/4 with fixed other inputs. Assert windPen and components.wind as well as raw/clamped score contracts; isolate rain-only score deltas so clamping cannot hide a failure. Cover the existing one-decimal rounding boundary near 1 mm (0.94/0.95) without changing its semantics. Include appropriate calm/control and gust cases, preserving season thresholds, pleasantness and shelter behavior.
4. Verify each named consumer's real path with deterministic input fixtures and actual scorer, not a mocked scorer that returns expected values. Reuse focused existing tests/harnesses where possible; cover raw daily and hourly-normalized inputs plus daily fallback. Demonstrate unchanged wind contribution when only precipitation changes while retaining intentional normalization differences. For route planner distinguish underlying wind component from streak/aggregate outcomes. Keep tests proportional; do not force identical final rankings across different inputs.
5. Write an evidence-backed task investigation report with the verdict, reproductions, consumer matrix and history. If no model change is required, explain that existing model documentation is already accurate and do not manufacture a formula change. If documentation contains a related factual error, correct only that error with evidence.

## Boundaries / STOP

Default expected deliverable: targeted tests and investigation documentation, no production model change. If a real coupling is found despite preflight, document the exact source and reproduction and stop for a revised fix prompt before changing scoring. Stop for owner approval if the required fix reaches beyond this issue's wind/rain coupling scope. Do not fix adjacent normalization/missing-data/cache/model issues in this ticket; record them separately.

No changed wind thresholds, weights, rain thresholds, season behavior, rounding, hourly weighting, shelter, gust, pleasantness, streak, gating, recommendation policy or cache behavior. No backend, new libraries, TypeScript, explicit import extensions, new UI or unrelated refactor. Preserve shared Free/Pro forecast inputs. Do not remove the currently redundant rain multiplier as cleanup. No commit, push, deploy or issue closure.

## Validation and handoff

Run scoring and edge-case suites plus affected forecast/map/leaderboard/relocation tests, changed-file lint and build if executable files change. Identify actual suite paths from repo. Record exact commands/results and any test gaps; existing green tests alone are not evidence of the new invariant. No live weather dependency needed for deterministic regression tests.

Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT. Jonesy reviews this proposal at PROMPT_REVIEW. Following APPROVED, Ripley creates approved-prompt-v1.md and READY_FOR_CC. CC must verify pointer, set CC_IN_PROGRESS, execute the approved prompt, write docs/ai/tasks/ticket-428/cc-report.md and set CC_COMPLETE. Jonesy review path: docs/ai/tasks/ticket-428/result-review.md. Preserve earlier history.

---

## Jonesy Round 1 review — 2026-09-29

**Verdict: APPROVED. No required clarifications.**

### Standing limitation

`device_bash` was unavailable for most of this review (it appeared briefly, mid-review,
then disconnected again before I could use it). I could not independently run `git
blame`/`git log` myself, so the specific commit hashes (`4e72d4927`, `dfe7ac17ba0d...`)
and the claim that an exact-string search found no coupling are taken on Ripley's word,
not reproduced. Everything else below — the actual live formula, the actual
reproduction numbers, the actual documentation, the actual consumer call sites — was
independently verified against the live source and doc files on the device, not
inferred from the prompt's narrative.

### What I verified

**The core premise (`src/lib/scoring.js`, read in full).** Confirmed exactly as
claimed: `windPen = Math.round(windPenRaw * cfg.windWeight)` (line 330) never
references `rain` or `precipTimingMultiplier` in any form; `rainPen = Math.round(
rainPenBase * precipTimingMultiplier * cfg.rainWeight)` (line 331) is the only place
`precipTimingMultiplier` is used. `windPenaltyPoints()` takes only `(w, season)` — rain
cannot reach it through any path in this function. The premise in issue #428 is
contradicted by the current source, exactly as Ripley's preflight states.

**The cited reproduction numbers.** I hand-derived them independently from the formula
rather than trusting the stated results: for `windMax=18` in both summer and winter,
`windPenaltyPoints` returns 10 in both season branches (18 > 16 summer tier, 18 > 15
winter tier), and since neither `windPenaltyPoints` nor `cfg.windWeight` (1.0 in both
seasons) depends on rain, `windPen=10` in all four rain cases follows directly — not
coincidentally. For `rain=[0, 0.9, 1, 4]`: `rainPenaltyPoints` gives `[0, 0, 2, 5]` and
`getPrecipTimingMultiplier` gives `[0, 0, 1, 1]` (gate at `mm < 1`), so
`rainPen = rainPenBase × multiplier` gives exactly `[0, 0, 2, 5]` — matching the
preflight's stated results exactly, digit for digit.

**Documentation cross-check (`docs/model-baseline-v1.0.md` §C.3/C.4).** Independently
confirmed the formulas documented there match the live source precisely, and — notably
— the doc already states the `precipTimingMultiplier` gate is "redundant with the
0-penalty tier in `rainPenaltyPoints`... the multiplier field exists for future
extension," which is exactly consistent with the prompt's boundary instruction not to
remove it as cleanup. This isn't a new discovery CC needs to make; it's already on
record, and the prompt correctly treats it as settled.

**Consumer map, verified call-by-call, not just read from the preflight summary:**
- `useForecast.js`: `normalizeDailyToScoreInput(data.daily, data.hourly)` then
  `scoreSiteDay(row)` per row — matches.
- `MapView.jsx`: same two-call pattern (`normalizeDailyToScoreInput` →
  `scoreSiteDay`) — matches.
- `useLeaderboardScores.js`: builds raw daily rows directly from `data.daily` arrays
  (no `forecastNormalize` step), calls `scoreSiteDay(r)` per row, sums `r.points` (the
  clamped 0–10 value, not `totalRaw`) via `reduce` — matches "constructs raw daily rows
  and sums clamped points" exactly.
- `relocationEngine.js`: `normalizeDailyToScoreInput` → attaches `shelter` per day →
  `scoreDaysWithRainStreak(daysWithShelter, {...})`, which (confirmed in `scoring.js`)
  internally spreads `scoreSiteDay(d)` per day before applying the streak penalty to
  raw points — matches "normalizes, adds shelter and invokes scoreDaysWithRainStreak,
  which wraps scoreSiteDay" exactly.
- `scoreDay` (the legacy alias): confirmed by grep to have zero call sites anywhere in
  `src` outside its own definition — it's currently dead code. Not a blocker (the
  prompt's boundaries correctly forbid unrelated cleanup, and step 1 already instructs
  CC to "follow actual callers and aliases, not just this initial map," which covers
  confirming this), but worth CC stating plainly in the report rather than leaving
  "legacy wrapper" ambiguous about whether it's still reachable.

**One thing I checked beyond the stated map, since the bug report's exact wording made
me want to rule out a nearby but different concept before trusting the "no coupling"
conclusion:** `forecastNormalize.js` computes both `windMax` (via per-hour `Math.max`)
and `rain` (via per-hour sum) from the same weighted-by-time-of-day hourly series, and
separately produces a `precipTimingBucket` field ("overnight"/"early"/"midday"/"late")
based on when rain started. The name is close enough to `precipTimingMultiplier` that
I wanted to confirm they don't secretly connect. Grepped the whole `src` tree for both
names: `precipTimingBucket` is produced only in `forecastNormalize.js` and re-exposed
by `useForecast.js`'s row spread for display purposes — it is never read by
`scoreSiteDay` or anything in `scoring.js`, and `precipTimingMultiplier` never reads
`precipTimingBucket`. They are two unconnected concepts that happen to share a word.
No coupling here either, at the normalization layer or the scoring layer.

### Assessment of the proposed task

The plan is well-scoped for what it actually is — an investigation with regression
protection, not a fix. Step 3's regression-test list already encodes exactly the
reproduction numbers I independently re-derived above, which is the right target: a
test that would fail if the alleged coupling existed. The 0.94/0.95 rounding-boundary
requirement is a real, sharp edge (both `rainPenaltyPoints` and
`getPrecipTimingMultiplier` gate at the same `round1()`-rounded `1mm` boundary, so a
0.01mm difference in raw input can flip `rainPen` from 0 to 2) — correctly scoped as a
rain-only boundary to lock down, not conflated with the wind/rain coupling question.
The STOP conditions (revised fix prompt if real coupling is found; owner approval if
required fix exceeds this issue's scope) are clear and appropriately conservative given
the preflight already shows no coupling. The "no mocked scorer" requirement in step 4
is consistent with this project's established testing norms from #426/#427.

I have no required clarifications this round. This is the cleanest preflight I've
reviewed in this workflow so far — no case where I could independently check a claim
and find it inaccurate.

— Jonesy
