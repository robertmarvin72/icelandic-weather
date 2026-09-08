# Result Review — Ticket 401

## Jonesy review — Round 1 (CC búinn)

**Verdict: PASS**

## Method

Read `approved-prompt-v1.md` (confirmed it carries the full Round 1 text plus the "Approved Round 2 analytics clarification" section exactly as I approved it) and `cc-report.md` in full. Independently staged and read the live implementation rather than trusting the report:

- `vercel.json`, `api/_lib/auroraDecision/constants.js`, `src/components/NorthernLightsCard.jsx` — the three files claimed changed.
- New test files: `api/cron/vercel.cron.test.js`, `api/_lib/auroraDecision/constants.test.js`.
- Modified test files: `api/_lib/auroraDecision/freshness.test.js`, `api/cron/refresh-aurora.test.js`, `api/_lib/auroraDecision/orchestrate.test.js`, `src/components/NorthernLightsCard.test.jsx`.
- `device_list_dir` scope/mtime checks across `api/_lib/auroraDecision`, `api/_lib/aurora`, `api/cron`, `src/lib`, `src/hooks`.

## Findings

- **Cron schedule**: `vercel.json`'s single `/api/cron/refresh-aurora` entry now reads `"0 8,14,20 * * *"`; the blog-draft cron (`"0 8 * * 1"`) is untouched and still present — exactly two entries, as claimed.
- **Freshness threshold**: `constants.js` now exports `AURORA_FRESH_MAX_AGE_MINUTES = 480` and `AURORA_STALE_MAX_AGE_MINUTES = 1440` (unchanged), with the module comment rewritten to describe the new three-run cadence honestly. `freshness.js` itself is untouched (mtime predates this ticket) — the inclusive-at-exactly-480 boundary genuinely falls out of the existing unchanged `>` comparisons, not a new special case, matching the report's reasoning.
- **The Round 2 analytics fix is present verbatim, at the correct location**: `NorthernLightsCard.jsx`'s stale-event branch now reads `if (isResultOutcome && classification.freshness === "stale")`, reusing the `isResultOutcome` boolean already computed earlier in the same effect (line 153) rather than introducing a second classifier — exactly what Round 2 required and exactly what I verified was genuinely available to reuse. Nothing else in the effect changed: the ref-guard, event name, payload shape, and dependency array are all intact.
- **Regression coverage for the Round 2 fix is genuine, not decorative.** I read all six new cases in `NorthernLightsCard.test.jsx`'s "Round 2: stale event gated on rendered usable-stale exposure" describe block: `success + stale` and `partial + stale` correctly assert the notice renders and the event fires exactly once with the right payload; the `night_not_found`, `invalid_darkness_window`, and both `no_locations_scored` sub-shapes (unambiguous-no-darkness vs. ambiguous/mixed) correctly assert the existing non-result UI renders, no stale notice appears, and the event does **not** fire; the rerender case asserts exact-once across theme and language changes with unchanged payload. All six use real orchestrator-shaped response bodies (the same field shapes `orchestrate.js` actually returns), not hand-built classification objects — matching Round 2's explicit instruction. The `no_locations_scored` split correctly reflects `auroraDecisionClassify.js`'s actual `isUnambiguousNoDarkness` branch (every excluded location `not_viewable_tonight` → no-darkness; any other status mixed in → domain-unavailable).
- **Boundary and clock-skew tests are real.** `freshness.test.js`'s two new cases correctly test the 480-minute-plus-1-millisecond crossing (asserting `stale`, not `fresh`) and the future-clock-skew clamp-to-zero case — both read `AURORA_FRESH_MAX_AGE_MINUTES` from the constants module rather than hardcoding, so they'll track any future threshold change automatically, as claimed.
- **The deterministic-timestamp proof in `refresh-aurora.test.js` is genuine**: a new test freezes the clock with `vi.useFakeTimers()`/`vi.setSystemTime()`, runs the handler, and asserts `persistAuroraSnapshot`'s `sourceFetchedAt` argument is exactly `frozenNow.toISOString()` — properly wrapped in try/finally to restore real timers.
- **`orchestrate.test.js`'s claimed "comment-only" edit is confirmed comment-only.** No `"360"` string remains in the file; the only change is the inline comment on the stale-fixture line now reading `480 < age <= 1440 min`. The fixture itself is still 10h/600 minutes after fetch — comfortably stale under both the old and new threshold — and no assertion value changed.
- **Scope discipline confirmed independently via mtime, not asserted.** `freshness.js`, `orchestrate.js` (logic), `api/cron/refresh-aurora.js`, `api/_lib/aurora/cache.js`, `src/lib/auroraDecisionClassify.js`, `src/hooks/useAuroraDecision.js`, `darknessWindow.js`, `fanout.js`, `rankDecision.js`, `resolveLocations.js`, `validateRequest.js` all carry mtimes from well before this ticket's work began. Ticket 400's files (`dailyWeatherSummary.js`, `weatherPresentation.js`, etc.) are similarly untouched, confirming no cross-ticket bleed.
- **`AURORA_FRESH_MAX_AGE_MINUTES`/`AURORA_STALE_MAX_AGE_MINUTES` have no other consumer** beyond `freshness.js` and `constants.js`'s own comments (matches the report's grep claim; I did not find a reason to doubt it given the narrow, well-isolated module boundary already established by Ticket 3).
- The UTC/Reykjavík timezone reasoning (Vercel Cron runs in UTC, Iceland has no DST) is factually sound and correctly recorded rather than silently assumed, matching both the approved prompt's requirement and reality.

## Verdict

**PASS.** The exact Round 1 finding and Round 2 clarification are implemented precisely, at the correct call site, with genuine and well-targeted regression coverage — including for the specific non-result-state gap that was the whole point of Round 2. No unrelated file changed. No new gap found.

## Ripley final assessment — Revision 1

**Verdict: PASS**

Ripley reviewed the approved prompt, CC report, Jonesy result review, and the live implementation diff. The implementation matches the approved scope:

- The Aurora refresh cron is exactly `0 8,14,20 * * *`; unrelated cron entries are unchanged.
- The fresh threshold is 480 minutes and the hard stale cutoff remains 1440 minutes.
- Successful refresh timestamps, failure preservation, and single-flight behavior remain intact.
- `northern_lights_card_viewed` reports `stale` only for usable `success` or `partial` results; non-result outcomes do not create false stale exposure.
- The approved client-clock-skew residual risk remains documented and is not a blocker.

Ripley independently ran the targeted eight-file verification set covering cron configuration, thresholds, freshness boundaries, refresh behavior, cache/single-flight behavior, orchestration, classification, and UI analytics: **117/117 tests passed**.

Separately, CC reports that the full suite passed (**1063/1063**), lint exited successfully, the production build succeeded, and the implementation diff check was clean.

No remaining prompt conflict, correctness issue, or scope violation was found. Ticket 401 is complete. No commit or push was performed.
