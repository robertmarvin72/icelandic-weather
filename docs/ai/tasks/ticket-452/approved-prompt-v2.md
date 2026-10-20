# #452 — Approved correction prompt v2

2026-10-20. Documentation-only result-review correction. Jonesy required Y1 in result-review.md; Ripley independently confirmed it and added the arithmetic correction below. V1 is immutable; do not reimplement it.

## Scope

Edit only docs/ai/tasks/ticket-452/cc-report.md plus the required CURRENT.md lifecycle updates. Preserve the implementation, all tests, prior review history and browser evidence. No code, scoring, threshold, UI, provider, cache or dependency changes. No live requests, commit, push, deployment or GitHub changes.

## Required corrections

1. Rewrite Old-tab limit (N6) accurately: all three nights are requested on mount by the three fixed useAuroraDecision calls. Switching selected night only displays an already-loaded slot; it does not change request keys or refetch. Retry controls are only in error branches, not success/all-poor. A hook-level retry test proves the mechanism, not a reachable refresh button in successful states. Refresh opportunities are a page reload, a calendar rollover producing changed slot dates/keys, or remount after the five-minute cache reuse window. TTL expiration alone does not refresh rendered state; remount within TTL can reuse old decisions. Do not promise every overlapping date is fetched on rollover if existing date-key cache entries are still eligible for reuse.
2. Correct the UI-trace arithmetic: old effective threshold 12 km/h versus unchanged intended 12 m/s (43.2 km/h) is a factor of 3.6 in physical speed, not roughly 13. Keep the existing threshold and intended fewer-notes explanation.
3. Append a dated correction note identifying Y1 and the arithmetic correction; preserve earlier validation counts as attributed historical results. Do not describe old test runs as fresh runs.

## Acceptance and validation

Read the hooks, cache and retry branches to confirm wording. Check the report for remaining contradictory refresh/factor claims. Show documentation diff and git diff --check. No test, build or screenshot rerun required for these text-only edits. Do not recapture Y2 or add Y3 telemetry. Stop if application changes seem necessary.

## Lifecycle

On owner Prompt approved, verify CURRENT is READY_FOR_CC and references this file; set CC_IN_PROGRESS. Make only the documentation corrections, append their outcome to cc-report.md, retain the report path in CURRENT and set CC_COMPLETE. Owner then requests Jonesy result review and Ripley final assessment. No commit/push/deploy.
