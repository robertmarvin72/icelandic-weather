# #429 — Approved research correction v2

2026-10-27. Ripley REVISE following Jonesy's R1–R9 result review. Execute only on owner Prompt approved and CURRENT READY_FOR_CC referencing this file. Read immutable v1 and full result-review. No production implementation authorized. All v1 constraints persist; only task429 and CURRENT may change. No subagents, dependencies, secrets/account access, git/GitHub mutation, DB/production changes.

## Decision on R5 — retained samples only

NO new external requests in this correction (data, documentation/catalog, GitHub, HTTPS probe or retries). Re-analyse retained samples first. The budget was not exhausted (data14/30, docs4/20 per ledger); do not use 'within budget' as an explanation for skipped local work or unused allocations. Distinguish NOT ATTEMPTED (with factual reason), actual TIMEOUT, absent evidence, access/licence uncertainty and demonstrated gap. Do not rewrite the frozen pre-sample plan or pretend it was fully executed. Any future additional geometry/history/observation/HTTPS/terms checks are named remaining prerequisites, not performed results. A bounded research conclusion may be PARTIAL/NO-GO with honest limits.

## R1 — reproducible local evidence package

Deliver task-local scripts and saved exact stdout for road-state corridor lookup, state counts, freshness, WFS ID join counts/per-ID extents, DATEX site/value matching and available ID overlap, CSV/report count consistency. Read-only inputs from retained files; pure parsing with installed/built-in tools, no production imports that touch cache/network. Clearly separate sample-derived numbers from manually selected corridor association. Script output includes input filenames/SHA256, method and assumptions. A reviewer must be able to regenerate every headline numeric claim, not rely on unretained node-e commands. Reuse samples unchanged; use new output files for correction and preserve superseded outputs/history.

## R2 / R6 — actual closures and freshness

Recount full retained legacy708 records: reviewer lead49 OTHEKKT,1 LOKAD903270037 (Nesjavallaleid, ALLUR_AKSTUR_BANN, EKKI_MOKAD), plus other categories. Read full DATEX RoadCondition sample: reviewer lead271 situations,80 roadClosed,89 closedPermanentlyForTheWinter and Not known/Storm conditions. Verify actual enum paths/counting unit; records can contain multiple attributes, do not conflate situation counts with individual conditions. Demonstrate real closed/unknown parsing from sample, separate from the corridor sample where no closure was observed. Direction/time-validity remains UNKNOWN unless source supports it; a missing DATEX record never establishes open/checked. No live or synthetic event invented.

Recompute DagsSkrad exact range and cohort: reviewer lead340/708 at02:55:00Z or02:55:01Z. Ripley independently confirmed counts49/1/340 and range02:55:00Z–18:19:41Z from retained JSON. Compute age against the recorded fetch timestamp, distinguishing DagsKeyrtUt export age from record assessment age. Nightly-batch/reset explanation is UNKNOWN, not inferred fact. Reflect these in source register/report/CSV/proposal/CC summary consistently.

## R3 / R7 — observation matching and crosswalk

Use retained DATEX site coordinates and measurementSiteIdentification, not exact-name absence alone. Verify Sandskeid IRCA_MP_17/31488, Holtavorduheidi MP_3/32097, Vatnsskard MP_24/33431 and relevant southern sites MP_6/MP_29/MP_53 against actual retained measured values/individual times/units. Distinguish station present, matching measurement present and representativeness. Correct blanket 'no station in any network' claims to actual searched scope and nearby candidates with distance evidence. Preserve conflicting/missing values.

Where RouteA geometry supports it, calculate nearest station-to-road distances in explicitly supported CRS/units/axis order with documented method and limitations; not checkpoint-to-itself distance0. No new dependency or guessed coordinate transformation. If accurate transform unavailable, retain distance UNKNOWN and list concrete blocker, not misleading0. Report terrain/elevation mismatch separately. Do not promote planar fragment sums (possible overlapping/alternate/directional geometry) to unique corridor geodesic length. Point out duplicated/overlapping features and unjoined spans explicitly.

Check set overlap of271 DATEX road-condition IDs and predefined-location-reference suffixes against legacy708 IDs using actual structure. Shared suffix membership is VERIFIED SAMPLE evidence, not full semantic crosswalk proof while PredefinedLocations geometry unresolved. Keep cardinality/duplicate/missing counts. No coincident-ID equivalence assumption.

## R4 / R9 — reconcile grades and next task

Build a single consistent checkpoint-count table from coverage.csv: rows vs unique identities, route-specific definitions, coordinates from station vs actual road checkpoint, road-state matched, geometry join demonstrated, measured values present, forecast tested. Initial CSV21 rows(A9/B9/C3); reviewer notes20 unique checkpoints, verify chosen identity key rather than count strings blindly. Report forecast4/9 onA if unchanged, not route-wide coverage. Make current page1 counts match corrected CSV and script output. Choose exactly PASS, PARTIAL or FAIL for each route, cite frozen capability rubric and explicit blockers; do not use PASS/PARTIAL hybrid. All PARTIAL is a plausible reviewer lead, not a mandated positive result. Overall one GO/PARTIAL/NO-GO for clearly named reduced/original scope, no implementation approval. Unknown/unperformed geometry or permissions cannot be silently accepted as safe capability.

Revise next-task draft counts and scope from the corrected evidence. Station coordinates must not become hardcoded road checkpoints without route association. List unmatched spans/corridor connectors, not just endpoint names. Add Vegagerdin licence/reuse confirmation and Open-Meteo production-rights uncertainty as prerequisites; a public GET does not establish licence. No contact/email/GitHub creation authorized. Note retained HTTP feed transport and HTTPS NOT TESTED as prerequisite here (v2 forbids new probe). If blockers prevent development recommendation, propose smallest research/contract task instead of claiming 'no dependencies'. Keep single-developer work estimate explicitly assumption-based. SafeTravel optional/unconfirmed, DMI unresolved in456,450 immutable and reused.

## R8 / reporting hygiene

64hex values currently labelled git-blob SHA1 must be re-labelled file-byte SHA256 when that is the method used; verify without inventing source provenance. Record claimed plan freeze timestamp versus file metadata discrepancy, preserving known ordering/hash proof and source of each clock rather than asserting a measured freeze time. Do not alter frozen input. Preserve prior findings with clear superseding correction notice (not contradictory current guidance).

## Validation and lifecycle

Set CURRENT CC_IN_PROGRESS before work. Run new local analysis scripts, retain exact outputs and manifest/hash checks, reconcile all current counts/grades across research-report, coverage.csv, source-register, next-task, cc-report and CURRENT. Show no source/API/DB/test/config/instruction changes, baseline/after HEAD/status and git diff --check. No full-suite/browser/build required. Append correction report listing R1–R9 and unperformed requests, set CC_COMPLETE with report path; Jonesy re-check then Ripley final assessment. Research PASS is not MVP approval/GitHub closure or any claim roads are safe.
