# Ticket 406 — Approved correction prompt v2

Approved by Jonesy in Round 3. This is the correction prompt for the existing #406 implementation. Execute only after Róbert says `Prompt approved` and CURRENT.md references this file at READY_FOR_CC. Read `docs/ai/tasks/ticket-406/result-review.md`, Ripley Round 1 REVISE, for the reproduced defects. The original `docs/ai/tasks/ticket-406/approved-prompt-v1.md` remains immutable and supplies the inherited requirements; do not replay its initial implementation as a new task.

### Objective and scope

Correct only two exposure-history defects in the current #406 implementation: malformed known-ID presentations can be recorded, and record-first use of a fresh adapter overwrites persisted history. The complete original approved specification remains applicable except for the clarified requirements below. Keep all 27 IDs/texts, content-selection behavior, Phase 1 engine/rules, cooldown defaults, language behavior, storage key/version/shape and out-of-scope boundaries unchanged.

Before edits, read README/CURRENT, approved v1, CC report, both reviewers' result findings, history implementation/tests, content metadata and presentation types. Reproduce the two failures with targeted regression tests. Limit production edits to weatherVoiceHistory.js and a minimal read-only content-metadata/validation helper if needed to avoid duplicating metadata; update related tests and append a revision to the CC report. No UI, hooks, new libraries or unrelated refactor. Follow CC lifecycle transitions only after an approved v2 is referenced and Róbert says Prompt approved.

### 1. Validate a shown presentation before any side effect

Reject silent or malformed presentations before changing memory or acquiring/reading/writing storage. Require a valid active-presentation shape: show:true; known canonical ID; condition/mood matching that ID's existing metadata; integer severity 0–3 within that entry's resolved severity bounds; nonempty string comment text; and null/valid CTA matching the entry's resolved CTA metadata. Do not require text equality to the IS string: history remains language-independent. Do not duplicate weather thresholds or add a condition-to-mood table; reuse existing per-ID content metadata through a small read-only lookup/helper if necessary. Missing required fields, wrong field types, invalid severity, blank text and mismatched ID/condition/mood must be no-ops even when the ID is known. Preserve the existing nonfatal storage behavior.

Update positive history-test fixtures to use real selected presentations or canonical metadata for the specific ID; the current helper assigns rain metadata to every ID, including wind IDs, and is not a valid positive fixture under this contract.

### 2. Hydrate before the first valid write

After presentation/time validation and before upsert/serialization, initialize this adapter's memory from safely parsed persisted history if it has not already been initialized. This must also work when recordShown is the first public operation. Preserve other valid known IDs and expired known timestamps; use the same existing sanitization policy. Then apply the existing idempotent/same-timestamp and later-wins rules. Valid persistence must not be overwritten by an empty, unhydrated memory map. Storage acquisition/read failure must still allow in-memory recording and guarded best-effort writing.

Keep this a sequential initialization fix. No cross-tab synchronization/locking/event listeners or generalized storage primitive. Same-instance older calls must still never replace newer in-memory timestamps. Persisted timestamps beyond the injected time remain invalid under the original contract; this fix does not alter clock policy. Invalid presentations must not trigger hydration or writes.

### Regression and validation requirements

- Known ID with only `{show:true,comment:{id}}` creates no record and performs no storage access. Cover each missing required field, invalid field type, out-of-range/noninteger severity, blank text and mismatched ID/condition/mood/CTA; memory remains unchanged as well as storage.
- A valid presentation obtained from the real engine -> IS library -> selector records correctly. Valid non-IS text with identical metadata can also be recorded without storing text/language.
- Seed two known IDs at valid timestamps, create a fresh adapter and call recordShown first for one ID; the other persists unchanged and the updated ID takes the new timestamp. Cover adding a third ID, expired known entries, and same-timestamp idempotence on initial hydration.
- Preserve existing same-instance older-write protection, sanitized unknown/invalid/future persisted values, throwing storage acquisition/read/write, and memory fallback. Test the localStorage property getter throwing explicitly if absent from existing coverage.
- Run history/content/selector/types suites, Phase 1 engine/rules and scoring invariance, targeted lint and build. Report exact per-file counts from actual output. Append corrected audit wording: Phase 1 engine/rules unchanged, types and types tests intentionally extended. Do not overwrite original reports or review history.

Completion requires both regressions passing plus retained original behavior, appended CC revision report, and CURRENT -> CC_COMPLETE. No commit/push. Jonesy then reviews the revision result before Ripley's final assessment.
