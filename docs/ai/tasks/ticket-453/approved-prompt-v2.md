# #453 — Approved correction prompt v2

2026-10-20. Bounded result-review correction for Jonesy T1/D1/D2/D3. V1 remains immutable. Execute only on owner Prompt approved with CURRENT READY_FOR_CC pointing here. Existing owner Q1 option 2 and Q2 dev bypass decision remain binding.

## Required changes

1. T1: strengthen both thrown-fetch-error redaction tests in api/forecast.test.js and api/_lib/auroraDecision/openMeteo.test.js. Format console call arguments with Node util.format(...args) or an equivalent inspector that includes Error message/stack; JSON.stringify(Error) is not adequate. Capture relevant console methods and ensure fake key/keyed URL cannot reach responses/logs. Include a positive test of the capture formatter demonstrating it exposes the fake sentinel when handed a raw Error; otherwise a negative assertion against empty output is insufficient.
2. Prove the regression test is effective: temporarily restore unsafe raw-error logging in the forecast generic catch and temporarily inject raw-error logging in the aurora catch (aurora previously logged nothing, so call this a synthetic unsafe mutation, not historical behavior). Run the specific strengthened tests and record expected failure caused by the fake sentinel. Restore safe implementation immediately, then rerun the tests green. Never leave mutations in final source; inspect the final diff. No real key, network request or committed mutation.
3. D1: replace console.error of raw parseErr in api/forecast.js invalid-JSON branch with a static message, optionally numeric upstream status. Add a malformed non-JSON upstream-body test containing a fake sentinel and assert formatted console output and response do not expose it. Preserve forecast_invalid_json status/body and request behavior.
4. D2 Ripley decision: retain the stricter binding Q5 rule. Remove arbitrary err.name from generic error logging; use a fixed static diagnostic instead, while preserving the existing AbortError branch and public error shapes. A thrown object can supply any name, so do not treat it as a fixed classification. Add a test with fake-sentinel-bearing name/message/stack or thrown object proving those fields are not logged. No changes to timeout/error classification semantics.
5. D3: correct the report's original aurora test addition count from +10 to +9 for v1 (1 URL +8 fetch). Describe current added tests separately with fresh counts. Reword setup docs to state diagnostics/warnings may be per affected request/location (up to fanout multiplicity), not one global line. Do not add deduplication or change fanout behavior.

## Scope and invariants

Only api/forecast.js logging, the two affected test files, docs/open-meteo-auth.md, cc-report.md and required CURRENT lifecycle changes. No auth policy/helper redesign, host allowlist work, new reasons, UI, scoring, provider/unit/date/field/cache changes, new dependency or Vite change. No success-payload scanner. Existing customer selection, Production-only missing-key fail-closed, no public retry and #452 unit guard retained. STOP if wider changes seem necessary. No .env reads, Vercel/account operations, live probes, commit, push or deploy.

## Validation and report

Run strengthened targeted tests including helper and both request suites after restoring mutations. Run full npm run test:run and npm run lint after final edits. A new build is not required for these server-log/test/docs changes; explicitly attribute previous build/bundle checks to v1, not a fresh run. Record exact commands, expected-red mutation failures (with only fake credentials), final green counts, final diff/scope and git diff --check. Preserve history in cc-report.md; add a dated v2 correction section and update current claims so raw err.name or vacuous redaction assertions are not described as accepted validation. Operational checks remain unverified/incomplete owner-side, never passed by mocks.

## Lifecycle

Verify CURRENT READY_FOR_CC and this path, set CC_IN_PROGRESS before execution, make only this correction, update docs/ai/tasks/ticket-453/cc-report.md, populate its path and set CC_COMPLETE. Owner then requests Jonesy result review and Ripley final assessment. No commit/push/deploy/GitHub mutation.
