# Result Review — Ticket 390

## Jonesy Review

### Approved prompt

approved-prompt-v1.md

### CC report

cc-report.md

### Compliance with approved prompt

Read the actual implementation (`src/lib/auroraScoring.js`, 369 lines) and test file (`src/lib/auroraScoring.test.js`, 558 lines) directly — not only the prose report — and checked them against every numbered requirement in the approved prompt.

- **Scope containment confirmed independently, not just asserted.** Compared file mtimes against the pre-existing repository state: `src/lib/scoring.js` and `package.json` are byte-for-byte unchanged (identical mtimes to before this ticket started). Only the two new files exist. No dependency was added. This matches §2 and §9 of the approved prompt.
- **Input contract matches §3 exactly**, including the Ticket 1 night shape verbatim, caller-normalized hourly rows, and an explicit `viewingWindow`. No system time, locale, or global state is read anywhere in the module.
- **Output contract matches §4**, including the hard compliance rule from Round 2 review — both non-scored states carry a populated `reasons` array (verified in code, not just in the report: the early-return branches literally construct `reasons: ["missing_activity"]` / `reasons: ["no_darkness_overlap"]` / `reasons: ["no_observation_data"]`).
- **Scoring rock invariant (test 19) verified by reading the test, not trusting its name**: it asserts against `scoreAuroraVisibility.toString()` that the signature is exactly `{ night, hourlyRows, viewingWindow }` and separately proves an extraneous `tier`/`isPro` property on the input has zero effect on output. Sound.

### Technical assessment

Manually re-derived the arithmetic for six representative cases directly from the source (not the report's prose) and confirmed every one matches its test's expected value exactly:

- Activity 9 / 0% cloud → 45 (activity) + 55 (cloud) = 100, band `excellent`, reasons `["meaningful_activity","clear_sky"]`. Matches.
- Activity 9 / 100% cloud → 45 + 0 = 45, hard-capped to 15, band `very-poor`. Matches.
- Activity 2 / 0% cloud → (2/9)×45 + 55 = 65, low-activity-capped to exactly 60, which lands in band `fair` (not `good`) under `bandForScore`'s `score <= b.max` boundary rule. This is the one boundary I specifically wanted to hand-verify (a cap sitting exactly on a band edge is a classic off-by-one risk) — it is correct and is explicitly asserted by test 3.
- Activity 0 / 50% cloud → 0 + 27.5 = 27.5 → `Math.round(27.5)` = 28 in JS (rounds half toward +∞) — matches test 5's expected `28` exactly.
- All-fields-missing hourly rows → both cloud and precipitation components correctly skipped (flagged `*_data_unavailable`, not fabricated as either extreme), final score is activity-only (45). Matches test 12.
- Reason/flag push order in code (activity → cloud → precipitation → moon → hard-cap) matches the exact array asserted by the ordering test.

No discrepancy found between the code, the tests, and the approved prompt's requirements in any of the cases traced. The 31-test count in the report matches an actual count of `it(...)` blocks in the file.

One item worth a decision, not a defect: the `national_reference_times` flag is attached only to `"scored"` outputs, not to `"not_viewable_tonight"`. CC flagged this itself as a judgment call (cc-report §7, deviation 2). Having now looked at the code: the `not_viewable_tonight` / `no_darkness_overlap` path is reached precisely because `computeDarknessWindowMs` — itself built entirely from the feed's national-reference `sun.*` fields — produced no usable window. That determination rests on the same non-local-precision limitation as a scored result does, arguably more so, since a real location could plausibly have actual darkness while the national feed's window says none. I'd lean toward adding the flag there too in a follow-up, but this doesn't misrepresent anything currently — no score or location-precise claim is made in that state — so it is not a defect against the approved prompt, which never specified per-state flag placement.

### Test and validation assessment

Verified directly by reading source: tests 1, 2, 3, 5, 12, and 18 (hand-traced above) are accurate. Tests 4, 6, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21 were read and are correctly targeted at their required case each is meant to cover, with no snapshot-only or does-not-throw-only assertions (all assert concrete values, per §7's requirement).

**Caveat, stated plainly:** I do not have shell/execution access to Róbert's machine in this session, so I could not independently re-run `npx vitest run`, `npm run lint`, or `npm run build` myself. The 31/31, 98/98, and 655/655 pass counts and the lint/build results in cc-report.md §9 are CC's self-report, not independently re-executed by this review. What I *did* independently verify is that the code and tests are internally consistent, that the arithmetic the tests assert is actually correct by hand, and that no unrelated file was touched. Given that level of agreement across six independently hand-traced cases with zero discrepancies, I have high confidence the reported run results are accurate, but this is corroboration, not a second execution.

### Outstanding material issues

None that block this ticket. One non-blocking follow-up worth a deliberate decision later: whether `not_viewable_tonight` should also carry `national_reference_times` (see Technical assessment above).

Separately, a small process note rather than a code issue: `CURRENT.md` was still showing `Stage: READY_FOR_CC` with `CC report: Not available` at the point Róbert sent "CC búinn", even though `cc-report.md` exists and is dated after `approved-prompt-v1.md`. Per the workflow's own Section 14, CC is expected to set `CURRENT.md → CC_COMPLETE` itself once `cc-report.md` is written. That update was skipped. This review corrects `CURRENT.md` directly (see below) — worth keeping an eye on in future tickets since the source-of-truth rule depends on this pointer actually being kept current.

### Verdict

PASS

---

## Ripley Final Review

### Assessment

PASS. The implementation satisfies the material requirements of `approved-prompt-v1.md` and remains within Ticket 390 scope.

Ripley independently checked the working tree and the implemented contract after reading the approved prompt, CC report and Jonesy review. The only application changes are the new isolated Aurora scoring module and its colocated tests; existing campsite scoring remains untouched. The implementation exposes one pure tier-independent function, preserves input immutability and deterministic ordering, distinguishes the two non-scored statuses with stable machine-readable causes, enforces cloud and low-activity caps, avoids duplicated full cloud/precipitation penalties, keeps wind flag-only, and does not interpret `scheduleType`.

Ripley also independently ran:

```text
npx vitest run src/lib/auroraScoring.test.js api/_lib/aurora/parseAurora.test.js src/lib/scoring.test.js
```

Result: 3 test files passed, 129 tests passed, 0 failed.

The first sandboxed attempt failed before Vitest could load because the sandbox denied access needed by the build tool. The same command was rerun with approved execution access and passed; this was an environment restriction, not a repository test failure.

### Response to Jonesy findings

Accepted: `no_observation_data` is a useful deterministic refinement of `not_viewable_tonight` and remains compliant with the approved requirement for a stable diagnostic cause.

Accepted as non-blocking follow-up consideration: `national_reference_times` currently appears only on scored outputs. A `not_viewable_tonight` result can also depend on national-reference darkness times, so a future consumer-contract review should decide whether that state should carry the same flag. The approved prompt did not prescribe flag placement by state, the current output makes no location-precision claim, and this does not require another implementation iteration for Ticket 390.

Process finding: CC wrote `cc-report.md` but did not update `CURRENT.md` through `CC_IN_PROGRESS` / `CC_COMPLETE` as required. Jonesy corrected the pointer to `RESULT_REVIEW`. This did not affect implementation correctness, but future CC runs must treat pointer updates as required workflow actions rather than report-only bookkeeping.

### Final verdict

PASS

### Next step

Ticket 390 is complete. Preserve the prompt, report and review history. Róbert may review and commit the implementation and workflow artifacts; nothing has been pushed.
