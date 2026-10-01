# Current AI Task

Task: ticket-431
Stage: CLOSED

Task directory:
docs/ai/tasks/ticket-431/

Prompt review:
docs/ai/tasks/ticket-431/prompt-review.md (Ripley Round 1: full Northern Lights access for Free, separate access from actual analytics tier, preserve model and other Pro gates, document experiment and pending launch. Jonesy APPROVED Round 1 with no required clarifications. Ripley consolidated approved-prompt-v1.md on 2026-10-01.)

Approved prompt:
docs/ai/tasks/ticket-431/approved-prompt-v2.md (Ripley corrective execution for missing v1 analytics requirements, within already-approved v1 scope; v1 immutable. Launch/GA4 verification pending.)

CC report:
docs/ai/tasks/ticket-431/cc-report.md (v1 section: northernLights opened to every tier via a narrow freeDuringExperiment flag in features.js, access/tier conflation fixed, Free-only teaser/checkout UI removed, 5 contradictory pricing/about strings corrected, business_model_experiment added to 9 events. Full suite 147 files / 2036 tests passing, lint clean, build succeeds. 12-combination real-browser evidence confirms no paywall and working details/ranking/map for Free. v2 section appended: corrective execution per Ripley's post-PASS REVISE — immediate interaction events now record interactionTier = "unknown" while loadingMe is true instead of guessing "free"; new northern_lights_location_selected event wired to the real, unmodified aurora map marker click. New test file (10 tests), full suite now 148 files / 2046 tests, lint clean, build succeeds. Real-browser marker-click evidence for Free + Pro (v2-*), including a self-flagged, cross-checked-and-resolved console-truncation discrepancy. experiment-note.md updated with unknown-tier semantics and the new event's no-baseline caveat. Launch NOT DEPLOYED, GA4 custom-dimension registration pending.)

Result review:
docs/ai/tasks/ticket-431/result-review.md (Jonesy Round 1: PASS, no findings — but missed two measurement-integrity gaps later caught by Ripley's final assessment (REVISE): interaction-tier guessed as Free during loadingMe, and the map marker click left untracked. Jonesy v2: PASS, no findings. Both REVISE items independently verified against live source — interactionTier correctly scoped to only the four interaction call sites, exposure effects unchanged; new location_selected event rides the real, unmodified MapView marker-click handler; new 10-test file exercises the real callback chain, not just prop presence; CC's self-flagged console-truncation discrepancy cross-checked against the unit test's exact-match assertion and confirmed to be a display artifact, not a missing field. No device_bash either round; full-suite/lint/build counts taken on CC's word beyond directly-counted new test files. Ripley v2 PASS: 10 focused suites / 139 tests, lint and build independently passed; both measurement findings resolved. Local implementation CLOSED; launch and live GA4 verification pending.)

## Previous tasks and sequencing

Owner selected #431 on 2026-10-01 after #428 CLOSED/PASS; working tree clean at preflight. #423/#425/#426/#427/#428 remain CLOSED. #431 intentionally supersedes NL paywall presentation from #426; preserves its IS homepage no-English-link decision since full details are available in the shared homepage module. Prior live-provider/login-continuation limitations remain outside scope. #417 locally CLOSED with external verification outstanding; #415/#416/#411/#410 CLOSED; #409 unfinished/BLOCKED. #431 CLOSED/PASS locally; no active implementation task. Launch remains pending.

## Rule

Read this file before workflow actions. No automatic commit, push, deployment or GitHub closure. Actual experiment launch timestamp and live GA4 verification remain pending until deployment.
