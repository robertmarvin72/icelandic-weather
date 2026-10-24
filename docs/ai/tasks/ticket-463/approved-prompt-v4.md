# #463 — Approved final documentation correction v4

2026-10-24. Narrow Jonesy Phase B R1/R2 correction. Prior versions immutable. Execute only on owner Prompt approved with CURRENT READY_FOR_CC referencing this file. All established scope/safety restrictions retained, no subagents.

## R1 exact wording

In BOTH CLAUDE.md and AGENTS.md replace only the Gotchas bullet that states the real reason is tier gating/not raw size with:

> `api/campsites.js` serves `server_data/campsites.limited.json` to Free and `server_data/campsites.full.json` to Pro. Do not import `server_data/*.json` directly into the frontend bundle; use the existing `/api/campsites` flow.

This is an observed serving fact plus retained no-direct-import constraint, not an assertion of undocumented original intent. No data/API/gating behavior changes. A21 rationale and hunk map must match this wording; historical inferred-reason prose explicitly superseded. Everything else in the real instruction files stays byte-identical to post-v3. Execution discipline and all exact owner-approved rules untouched.

## R2 historical annotation-only corrections

Mark stale cc-report v1 statements visibly superseded, not deleted: all four MatrixB items pointer-only; none of J7 refuted; future PhaseB named approved-prompt-v2 (actual v3); requireAdmin10-call-site claim (actual9 call sites excluding definition/comment). Correct/annotate decision-summary stale add7 missing handlers/open-question1 references by explicit accurate path/action/table-row explanation, not guessed count. Do not rewrite original transcripts/history as if always correct. Append dated v4 disposition. No new audit/policy expansion.

## Application and validation

Allowed: two instruction-file single-bullet edits, A21/summary/report/preservation artifacts in task463, required CURRENT lifecycle. Retain all PhaseA/B patches and original scratch. Make distinct v4 proposed copies/diff artifact, verify exact one-bullet difference per real file from post-v3, then apply by normal file edit tools with LF/0CR retained. Save correction diff and final instruction diff as separate versioned artifacts. Verify real bytes equal v4 proposed copies, canonical README unchanged, hashes before/after, no off-scope git status and git diff --check. Do not run build/lint/tests/npm/services/browser/repo scripts; plain text/hash tools only. No .env/.vercel/account or GitHub operations, commit/push/deploy/index/git-config changes. Prior read-only Git allowlist plus instruction-file git diff applies.

## Lifecycle

Verify CURRENT READY_FOR_CC points here; set CC_IN_PROGRESS, perform only correction, append cc-report with evidence and populate report path, set CC_COMPLETE. Owner then requests Jonesy quick review and Ripley final whole-ticket assessment. No automatic CLOSED.
