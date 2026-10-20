# #453 — Approved correction prompt v3

2026-10-20. Narrow correction for Jonesy v2 Z1. Prior approved versions are immutable; owner auth policy and all scope invariants remain unchanged. Execute only on owner Prompt approved with CURRENT READY_FOR_CC pointing here.

## Required changes

Only edit api/forecast.test.js, cc-report.md and required CURRENT lifecycle fields. Final application source must remain unchanged from v2.

Strengthen the D1 malformed-JSON test to reject raw parse-error logging independent of V8 message truncation: assert the exact safe console call (static invalid-JSON message plus numeric status), assert no Error instance in logged arguments, and retain response-contract assertions. Set an explicit mock status (e.g. 200) so the expected status object is meaningful. Optional sentinel-first short-prefix assertion may supplement this, but must not be the sole runtime-version-dependent guarantee. Existing fake sentinel only; no real credentials.

Prove the strengthened test fails: temporarily restore catch(parseErr) with console.error("Forecast upstream returned invalid JSON:", parseErr) in api/forecast.js, run only the D1 test, capture expected-red failure caused by the raw error/unsafe call. Restore v2's static logging immediately, rerun green, and verify final api/forecast.js byte content equals its pre-v3 content. Temporary mutation is solely test evidence, not a final source change. Do not alter generic/aurora catches or repeat their prior mutation proofs.

Correct the report's inaccurate claim that JSON.parse errors do not echo upstream text: runtimes may quote a truncated excerpt of the parsed input, potentially including a credential prefix. State runtime/version dependence rather than promising an exact excerpt length. Document why the old test could pass with unsafe logging, the strengthened structural assertions and expected-red proof, and preserve v1/v2 validation as historical.

## Validation

Run api/forecast.test.js, full npm run test:run and npm run lint after restoration/final edits; exact fresh commands/counts and git diff --check. No build needed; explicitly say not rerun, prior build/bundle evidence remains v1-attributed. No new source behavior, tests outside this file, dependencies, cache/unit/scoring/UI/auth/proxy changes. No .env reads, live requests, Vercel/account changes, commit, push, deploy or GitHub mutation. STOP on need for wider scope. Production/Preview/key validity/unit metadata checks remain incomplete owner-side.

## Lifecycle

Verify CURRENT READY_FOR_CC and this path; set CC_IN_PROGRESS. Perform only this correction; update docs/ai/tasks/ticket-453/cc-report.md, retain report path and set CC_COMPLETE. Owner requests Jonesy narrow result review then Ripley final assessment.
