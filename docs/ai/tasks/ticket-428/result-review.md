# #428 — Jonesy result review (Round 1)

Date: 2026-09-29
Reviewed against: `docs/ai/tasks/ticket-428/approved-prompt-v1.md` (Jonesy APPROVED Round 1,
no required clarifications) and `docs/ai/tasks/ticket-428/cc-report.md`.

**Verdict: PASS. No findings.**

## Standing limitation

`device_bash` was unavailable throughout this review (checked, not found). The git
history claims in §4 of cc-report.md — the two cited commit hashes' dates/messages,
the full diffs inspected, and the broadened `-S"windPenRaw"` all-branch search result —
are taken on CC's word, not independently reproduced. Everything else below was
verified directly against the live repository state, not inferred from the report's
narrative.

## What I verified

**No production code changed.** `scoring.js`, `forecastNormalize.js`,
`useLeaderboardScores.js` and `relocationEngine.js` all confirmed at the exact same
mtimes I recorded during the Round 1 prompt review, before any CC work began — matches
cc-report.md's own claim ("no production model change was made") exactly.

**The four new regression test files, read in full, all real and unmocked:**
- `scoring.windRainIndependence.test.js` (6 tests): I independently re-derived every
  asserted number from the live formula rather than trusting the file's own comments —
  `windPen=10`/`rainPen=[0,0,2,5]` for the dry-windy scenario (both seasons); the
  raw-vs-clamped isolation test (`dry.totalRaw=0`, `wet.totalRaw=-5`, delta exactly
  equal to the rain delta); the calm control (`windPen=0` at windMax=3, both seasons);
  the gust case (`gustPen=2` summer / `3` winter at diff=6); and the 0.94-vs-0.95mm
  rounding boundary (`rainPen` flips 0→2, `windPen` unmoved). Every one matched my own
  hand computation exactly.
- `forecastNormalize.windRainIndependence.test.js` (2 tests): re-derived the hourly
  weighted-max windMax=20 and summed rain=0/5 results by hand from the actual
  `getDayHourlyMetrics` weighting logic, and the daily-fallback branch's windMax=20 /
  rain=0-or-4 pass-through — both match. This is the real shared pipeline
  `useForecast.js` and `MapView.jsx` both call verbatim, exercised unmocked.
- `useLeaderboardScores.windRainIndependence.test.js` (1 test): re-derived
  dry=7/wet=2 points by hand from `basePts=8, windPen=1, rainPen∈{0,5}` — matches.
  Only `getForecast` is mocked; `computeScoreFromData`'s call into the real
  `scoreSiteDay` is untouched, consistent with `useLeaderboardScores.js`'s actual
  source (no `forecastNormalize` step on this path, confirmed during my own Round 1
  read).
- `relocationEngine.windRainIndependence.test.js` (2 tests): re-derived the 3-wet/1-dry
  streak scenario by hand — `rainStreakPen=[0,1,2,0]`, `pointsRaw=[4,3,2,9]` — and the
  calm-vs-windy comparison (`pointsRaw` gap exactly 10, `rainStreakPen` identical in
  both) — both match. Correctly distinguishes the fixed per-day wind component from
  the legitimately-varying streak aggregate, exactly as the approved prompt's §4
  required for the route planner.

As a concrete independent check beyond re-deriving individual numbers: I counted the
`it(` blocks across all four files myself — 6 + 2 + 1 + 2 = 11 — which matches the
claimed "11 tests" exactly, without relying on the report's own count.

**The two out-of-map findings CC disclosed, both independently confirmed:**
- `weatherVoiceRules.js`: its own header comment (lines 17-22) explains the `5/10/15`
  constants are a deliberate reuse of `scoring.js`'s winter wind-penalty band edges as
  display-copy thresholds, not a scoring dependency. No import of `scoring.js`
  anywhere in the file. Mtime unchanged from before this ticket — read-only, as
  claimed.
- `shelterUtils.js`: has zero imports at all (starts directly with local helpers); its
  own `windPenalty` variable (line 84) is a fully self-contained Shelter Index formula
  with no connection to `scoreSiteDay`. Mtime unchanged — read-only, as claimed.

**The `scoreDay` dead-code note from my own Round 1 review** is explicitly addressed
in cc-report.md §3 ("confirmed by grep to have zero call sites... dead code, consistent
with Jonesy's Round 1 note") — closed the loop I opened.

## What I could not independently verify

The specific commit hashes/dates/diffs in §4, and the full-suite test/lint counts (146
files/2031 tests; lint exit 0) beyond the 11 tests I counted directly myself. These
are internally consistent with everything else in the report and with the prior
ticket's own counts (#427 ended at 2020, +11 = 2031, matching exactly), but remain
unconfirmed by me directly.

## Assessment

This is a correctly-scoped investigation-only result: the alleged coupling does not
exist in current source (confirmed independently, not just re-stated from the
preflight), no production code was touched, and the regression tests actually target
the specific failure mode the issue alleged — several of them are deliberately
constructed so that a real coupling bug would produce a visibly wrong number rather
than hiding behind clamping, which is the right standard for a regression suite whose
entire purpose is proving a negative. No documentation change was needed and none was
made, consistent with the approved prompt's explicit instruction not to manufacture a
fix.

— Jonesy

## Ripley final assessment — 2026-09-29

**PASS — investigation and regression protection, not a production bug fix.** Read the approved prompt, both reports and all four new test files. Git status/diff confirms no production changes. Independently ran the four new suites plus the eight existing scoring/forecast/map/relocation suites named in the CC report: **12 files / 124 tests passed**. Changed-file ESLint passed. Full-suite 2031-test result remains attributed to CC. No production build was necessary for this tests/docs-only result.

Confirmed the current independent wind formula and the actual normalize -> score call sites during this task. The new shared-pipeline tests exercise real normalization/scoring; the route tests exercise the real streak wrapper rather than a full relocationEngine invocation. This is proportionate for an unchanged implementation, alongside source tracing and the passing existing engine suites; do not describe the new route file as a full engine integration test.

Evidence qualifications/corrections:
- Reproduced git log --all -S windPenRaw result (one origin commit), but -S detects changes in occurrence counts. It can miss edits that add a multiplier to an existing line without changing that count. Consequently it does NOT rule out historical coupling, even if the same variable name was retained. The current-source conclusion and directly inspected diffs are the evidence for this verdict, not a universal history claim.
- Inspected 4cd1500b: it removed obsolete timing arguments. Its parent already lacks the late-rain branch, so CC's attribution of the entire branch removal to this commit is too broad. This historical detail does not alter today's formula or require a model change.
- scoreDay has no production callers found, but is called in scoring.test.js; claims of zero calls anywhere in src should read zero production callers.
- Relevant cache detail omitted from the report's matrix: leaderboard stores scored rows in campcast:scoresById:v5 for six hours; map/leaderboard fetch through forecastCache. As the model is unchanged, no cache invalidation/version change is needed or authorized.

Conclusion is limited to the audited repository revision. Live deployment parity remains unverified. The alleged rain-suppressed wind penalty is not present in current code; the added tests protect that invariant. CURRENT -> CLOSED. No commit, push, deployment or GitHub closure performed.
