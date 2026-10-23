# #437 — Approved research correction prompt v3

2026-10-23. Narrow Jonesy N1–N4 correction. Earlier prompts immutable. Research/documentation only; no app/test/config/copy/threshold changes, no subagents or live probes. Execute only on owner Prompt approved and CURRENT READY_FOR_CC referencing here.

## Required correction

N1: complete or explicitly bound the missing forecast-table/recommendation wind surfaces. Read consumers of windMax/windMaxShort/windGust/labelWind/labelGust/comparisonFactorWind/comparisonFactorGusts/comparisonHrCalmerGust/windLabel, ForecastTable and recommendation/comparison surfaces including useFreeRecommendation and comparisonUtils. Add stable per-surface matrix rows with source hash+line, IS/EN copy/key, quantity/unit/aggregation, active status and evidence grade. Do not confuse a translation-key hit with active exposure. If a consumer cannot be traced within this bounded correction, put it explicitly in Not examined as UNKNOWN with exact surface/key names and missing evidence. No silent omission, no need for a new comprehensive audit or UI test. Existing application files read only.

N2: remove the imprecise 6–9m/s distance claim. Prefer qualitative wording: cautious copy begins below row8's lower bound; serious copy can also occur below that bound but continues above it. If numerical intervals are retained, derive exact >10/<=15 and >15 inequalities: cautious deficit from17.2 spans [2.2,7.2) m/s; serious deficit is positive only for15<x<17.2 and lies (0,2.2). Do not imply every serious-trigger value is below row8 or that a weighted quantity is a valid Beaufort mean. No new thresholds proposed.

N3: visibly mark superseded v1 cc-report bullets (single-most-consequential unit uncertainty and untraced voice/provider wording) with links to corrected v2/F-01 findings. Preserve history, do not leave the old claim as current advice.

N4: align F-10/open questions/owner decision language: public-host legacy behavior VERIFIED point-in-time sample2026-10-19; keyed host and subsequent behavior unverified. Production uses customer host when key configured and fails closed when VERCEL_ENV=production and key missing; owner-reported configuration/system-variable exposure/live validity are not independently verified. The retained sample is public-host evidence, not proof of current non-production or production behavior. No public retry after keyed failure. Owner observation of normal app response may be recommended, not performed.

## Validation/report

Update research-report.md/inventory.md/cc-report.md and source-register only as required for new hashes/citations, all under this task folder. Retain current confirmed B1/B2/R1–R7 conclusions. Add dated v3 N1–N4 disposition, exact read/search/hash commands, HEAD/branch/status before/after and git diff --check. Verify crosslinks/stable IDs and no source changes. No full test/lint/build needed for documentation-only changes, and no reference-script rerun needed unless its content/input claims change. Unknowns remain explicit; no unsupported all-surfaces-covered claim. No new sources/account/provider requests, package, GitHub mutation, commit/push/deploy.

## Lifecycle

Verify pointer, set CC_IN_PROGRESS, execute only this correction, update docs/ai/tasks/ticket-437/cc-report.md, populate report path and set CC_COMPLETE. Jonesy narrow review then Ripley final assessment. Status research only; no code change or official endorsement.
