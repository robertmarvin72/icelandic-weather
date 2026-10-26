# #444 — Approved Phase B correction v4

2026-10-26. Ripley REVISE following Jonesy's Phase B result review R1/R2. Execute on owner Prompt approved only with CURRENT READY_FOR_CC referencing here. Read approved-prompt-v3.md for the original implementation contract and result-review.md's latest Phase B review. All prior versions remain immutable. This correction supersedes conflicting layout/evidence decisions, not owner-approved wording or engine isolation.

## Scope

Narrow correction: warmest-row mobile layout, stronger browser evidence, imperial parent integration test, and malformed-metadata fail-closed compliance. No label/period wording changes, ranking/scoring/provider/API/gating changes, dependencies, unrelated cleanup, subagents, commit/push/deploy or GitHub changes. Preserve current implementation and unrelated working changes. Set CURRENT CC_IN_PROGRESS before editing, append a v4 cc-report after validation, set CC_COMPLETE, then Jonesy re-check.

## R1 — mobile name readability

Inspect current WeatherFinderCard warmest layout (shrink-0 metric block capped at 55%). At narrow widths give the site-name control enough width for actual readability, e.g. place metric/period beneath the name below sm. Keep desktop and calmest/driest behavior/layout unchanged. Do not change ranking/selection or translated strings. At 320 and 375px, fixture names Warm Complete, Compare Other, Gap Valley and Base Camp must not be truncated: assert actual name span scrollWidth <= clientWidth, not button width >20px. Add a realistic long-name fixture and document wrap/ellipsis behavior explicitly; no horizontal overflow, name remains a functional selection button. Inspect screenshots as well as geometry assertions.

## R2 — complete the required evidence

Repair toast dismissal using actual ToastHub Dismiss control, assert toast absent before screenshots; do not swallow failed dismissal. Wait for the actual warmest list/selected mode before captures (Jonesy N5 possible transition artifact); if styling is truly wrong beyond this correction, report rather than broaden scope.

Run complete/incomplete Finder rows at 320, 375 and desktop in both EN/IS; rank-1 and both relevant metric states must be visible and unobscured in evidence. Cover Free at 375px, Pro 3->5->7 with seven-row fixtures, and metric/imperial complete/incomplete where reachable. Add a real-parent imperial integration case proving complete Fahrenheit display and no numeric fallback in the incomplete card. If browser units cannot be reached, explain the concrete reason and keep parent-level coverage; do not silently omit it.

Retain/recheck Brochure both cards in both languages and Pro comparison high-temperature row. Use existing production-preview Playwright setup, deterministic API mocks/fresh contexts and request/response accounting to demonstrate missing values reach the real parent. Save corrected scenarios/commands/results/screenshots, identify superseded screenshots and inspect new ones. Previous six passing scenarios alone do not establish this matrix. No live provider/account/secret access or tooling installation.

## Small binding compliance correction

J4 explicitly requires malformed metadata to fail closed. Warmest complete display requires complete === true AND valid positive integer windowLength; absent/malformed metadata must show Insufficient data, with period omitted if invalid. Update the existing test that currently expects a number for {complete:true, windowLength:null}; add malformed truthy flag coverage. This remains downstream presentation only. Preserve numeric engine value for valid complete metadata. Do not modify pure ranking/forecast/scoring inputs.

## Validation and reporting

Rerun targeted helper/card/parent/qualifier/comparison and relevant existing interaction suites, lint/build, then the corrected browser scenarios. Full-suite repetition is not required absent broader changes/new failures. Maintain real rankWarmest vs UI order parity (RC-08 remains B before A), no mutation and unchanged selected windows. Show empty production diff for the engine/App/hooks files named in v3. Report exact outcomes and limitations, not a blanket browser PASS for omitted scenarios.

Retain J7 limitation: incomplete sites still rank using the old zero-coerced mean; display does not fix ranking/scoring. Follow-ups remain separate and unauthorized here. Note prior v3 appended J1-J10 block accidentally repeated Phase A conditions: the reviewed Phase B Round 1 section in prompt-review.md and v3 Binding resolutions govern Phase B; v4 R1/R2 above spell out the required browser matrix. Do not edit immutable v3 to conceal that historical documentation mistake. Append corrections to reports/history instead. English fallback/other unrelated cosmetic notes do not require expansion.

Acceptance: readable names at both narrow widths, unobscured and inspected full required browser evidence, imperial parent proof, J4 fail-closed behavior, unchanged strings/ranking/scoring/provider/gating, honest retained limitations. No automatic issue closure.
