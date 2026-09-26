# #423 — Approved Phase 1 comparison-policy correction v3

Jonesy APPROVED Round 3 on 2026-09-25. This is the sole execution prompt for this correction. Read AGENTS.md, CLAUDE.md, docs/ai/README.md and CURRENT.md. Verify READY_FOR_CC references this file, then set CC_IN_PROGRESS before work. Read data-audit.md, cc-report.md and result-review.md. After the correction, append CC Round 3 to cc-report.md, populate the report path in CURRENT.md and set CC_COMPLETE. The accepted architecture and surface findings are not reopened. Documentation only; no production changes, new tests, provider probes, DB access, cron, commit, push or deployment. Preserve approved v1/v2 and prior reports/reviews.

Correct data-audit.md §5 into one internally consistent decision table. Use this concrete conservative recommendation for Phase 2 review (not implementation authorization):

- Pending requested nights: preserve each resolved night's usable details, but show comparison pending and emit no final best-night or all-three-poor conclusion/event.
- Zero scored nights: show unavailable/no-darkness reasons, never low chance or best night.
- One scored night: show its outlook as the only available result; no cross-night winner. Missing nights remain unknown.
- Two or more scored nights: a definitive comparison requires equal non-null aurora sourceFetchedAt and the same complete configured candidate set successfully scored in every compared night. Compare existing scores/bands only after those checks. Keep stale data within existing validity rules and visibly identify stale results; never infer Open-Meteo issuance consistency from aurora timestamps.
- Mismatched snapshot timestamps or incomplete/different successful candidate sets: keep per-night results, visibly say a reliable best-night comparison is unavailable, and suppress definitive winner/all-three-poor claims. No silent warning-only qualifier. This deliberately separates useful per-night results from comparable nights; no rescoring or new backend fields assumed.
- All-three-poor copy is permitted only when all three requested nights are resolved, scored, comparable as above, and each has the existing poorest band. If only a subset is available, copy must explicitly limit its claim to those available nights; unknown nights never count as poor. Preserve no-darkness as its own state.
- Keep exact/near-tie product policy explicitly proposed and unresolved; do not introduce a tolerance constant or modify scoring in this audit.

Include table examples for: all pending; zero scored; one poor plus two missing; two scored plus one pending; three poor with complete comparable data; a missing candidate on one night; identical incomplete candidate sets; refresh-straddling timestamps; and comparable but stale results. Distinguish final comparison eligibility from within-night usability in every row. Update the proposed test list to match this table, without running or adding tests.

Remove the contradictory production-DB prerequisite from §9: schema deployment remains unverified operational context, not a gate to writing/reviewing Phase 2 code. Remove unsupported git-history preservation claims; prior approved prompts and review/report history are retained, not necessarily the original audit text. Attribute the literal landing-page requirement to the issue and `/en/northern-lights` route identification to source inspection.

Read existing source only where needed to verify fields/bands. If the existing response cannot support the proposed candidate-completeness check, document the exact missing evidence and required Phase 2 contract consideration instead of claiming it can. Append CC Round 3 report with corrections and remaining decisions. Follow READY_FOR_CC → CC_IN_PROGRESS → CC_COMPLETE when executing the eventual approved v3. Phase 2 still needs its own reviewed implementation prompt.


