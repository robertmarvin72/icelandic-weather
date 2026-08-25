# Prompt Review — Ticket 390 (Ticket 2: Northern Lights scoring)

Source ticket: GitHub issue #390 — `Ticket 2 Northern lights scoring`

## Round 1 — Ripley

### Repository audit before prompt creation

- `api/_lib/aurora/parseAurora.js` already implements the Ticket 1 normalized night contract. Every field except a valid `eveningDate` is independently nullable; `auroraActivity: 0` is distinct from `null`; unknown numeric `scheduleType` values are preserved without guessed meaning.
- `api/forecast.js` already requests hourly `cloudcover`, `cloudcover_low`, `cloudcover_mid`, `cloudcover_high`, `precipitation`, wind and visibility fields. Its comments explicitly reserve them as groundwork for Tickets 2/3; no existing score consumes them.
- Existing campsite scoring lives in `src/lib/scoring.js`. Ticket 390 must not modify or couple to that model.
- Ticket 390 can be developed entirely against fixtures. No live Aurora fetch, Neon access, cron change, API endpoint, UI, ranking or entitlement work is required.
- The Aurora feed's sun times are national reference values with no location metadata. The implementation must not describe them as location-specific astronomy.
- No blocking contradiction was found between Ticket 390, Ticket 1 and the current repository.

### Proposed prompt

Implement only GitHub issue #390, **Ticket 2 — Northern Lights Score v0.1**.

The goal is one pure, deterministic, canonical Aurora visibility result for a location and night. The same input must always produce exactly the same output. Free/Pro tier, user identity, subscription state and feature flags must have no effect on inputs, weights, thresholds or output.

Do not commit. Do not push.

#### 1. Confirm repository state before writing

Read and confirm the current implementation and data contracts in at least:

- `api/_lib/aurora/parseAurora.js`
- `api/_lib/aurora/parseAurora.test.js`
- `api/forecast.js`
- `src/lib/scoring.js` only to understand existing project style and to avoid coupling to campsite scoring
- relevant Vitest/ESLint configuration and neighboring pure-module test conventions

Record any material mismatch in `cc-report.md`.

STOP before implementation if:

- the Ticket 1 normalized Aurora contract requires a breaking change;
- correct scoring requires guessed or unverified `scheduleType` semantics;
- the implementation would present national Aurora-feed darkness times as location-specific astronomical precision;
- preventing cloud/precipitation double-counting cannot be expressed as a clear deterministic model;
- the solution requires tier/entitlement state, UI, an API endpoint, Neon, cron, ranking, Ticket 3 integration, or changes to existing campsite scoring.

#### 2. Scope and file placement

Create a new, isolated pure scoring module and colocated targeted tests following existing `.js` project conventions. Prefer a focused name such as:

- `src/lib/auroraScoring.js`
- `src/lib/auroraScoring.test.js`

Do not add dependencies. Do not modify `src/lib/scoring.js`. Do not add UI, routes, translations, analytics, backend endpoints, persistence, cache changes or live-network tests.

#### 3. Explicit input contract

Export one canonical public scoring function. Choose a clear function name and document its contract in code.

The function must accept a single object containing:

- one normalized Aurora night in the existing Ticket 1 shape:

```js
{
  eveningDate,
  auroraActivity,
  sun: { sunset, darknessStart, dawn, sunrise },
  moon: { ageDays, rise, set, scheduleType }
}
```

- location-specific hourly forecast rows for the night, normalized by the caller into a small explicit fixture-friendly shape containing timestamps plus the relevant weather values: total/low/mid/high cloud cover, precipitation and wind; visibility may be accepted defensively but must not become a primary v0.1 signal without demonstrated incremental value;
- an explicit proposed viewing-window boundary or similarly explicit time range sufficient to calculate overlap deterministically.

Do not read system time, locale, browser timezone, environment variables, global state or external services. Do not mutate any input object or array.

Define and test time semantics explicitly, including intervals crossing midnight. Avoid host-timezone-dependent parsing. The Aurora feed's darkness values are national reference values, not location-specific astronomy; encode/document that limitation without inventing local precision.

If a smaller or safer input contract is found during the initial audit, use it only if it still makes all temporal and weather semantics explicit and document the reason in `cc-report.md`.

#### 4. Output contract

Return one of three structurally stable states.

Scored:

```js
{
  status: "scored",
  score: 0,
  band: "provisional-band",
  reasons: [],
  flags: []
}
```

Insufficient primary data:

```js
{
  status: "insufficient_data",
  score: null,
  band: null,
  reasons: [],
  flags: []
}
```

No usable darkness/viewing overlap:

```js
{
  status: "not_viewable_tonight",
  score: null,
  band: null,
  reasons: [],
  flags: []
}
```

Use stable machine-readable reason and flag identifiers, not localized UI prose. Reasons and flags must be derived from actual inputs and scoring branches, have deterministic ordering, and contain no fixture-specific special cases.

Band names and thresholds are provisional v0.1 constants. Keep them isolated, documented and easy to revise. Do not present them as permanently locked domain truth.

#### 5. Scoring requirements

Implement and document one bounded numeric scale. A `0..100` integer scale is preferred for clarity, but another bounded scale is acceptable only if it is simpler and fully tested. Clamp and round in exactly one documented place.

Primary requirements:

- `auroraActivity` is the activity signal. `null` or invalid/missing primary activity produces `insufficient_data`; numeric `0` remains valid data.
- Relevant hourly cloud cover during the intersection of viewing window and darkness is the principal local visibility signal.
- High activity must not overcome a fully overcast window. Full/near-full total cloud cover applies an explicit hard score cap regardless of activity.
- Low activity with a clear sky must not reach the highest provisional band.
- If there is no darkness or no meaningful overlap between viewing window, darkness and available hourly observations, return `not_viewable_tonight` rather than a low numeric score.
- Precipitation is a secondary refinement. It must not stack as a second full penalty when heavy precipitation coincides with already-severe cloud obstruction. Implement this as an explicit cap, attenuation, combined-obstruction rule or another directly testable deterministic mechanism.
- Moonlight is a secondary modifier only when the moon is actually above the horizon during the relevant dark viewing interval. Moon age alone must have no effect when the moon is not visible.
- Do not guess unknown `scheduleType` meanings. Determine moon-up overlap from verified rise/set time semantics when those fields are sufficient. If they are not sufficient for a case, handle it defensively without fabricating visibility; STOP if correct handling fundamentally requires unverified `scheduleType` semantics.
- Wind must not reduce the Aurora visibility score. Strong wind may add a stable comfort/safety flag and/or reason while preserving the otherwise identical numeric score.
- Visibility must not be a primary v0.1 input. Include it only if tests demonstrate additional information beyond cloud and precipitation; otherwise ignore it explicitly.
- Missing secondary values must never crash, become fabricated defaults, or automatically force `insufficient_data` when the primary inputs and usable observation window are sufficient.

Use explicit named constants and small pure helpers where they improve auditability. Avoid false scientific precision: thresholds and weights are provisional product-model choices and should be documented as such.

#### 6. Deterministic aggregation

Define exactly how multiple hourly rows inside the relevant window are aggregated. The method must be order-independent or must explicitly sort a copied array without mutating the caller's input. It must not depend on the machine clock or iteration accident.

Document and test:

- inclusion/exclusion at time boundaries;
- cross-midnight darkness and moon intervals;
- handling of missing values inside otherwise usable hourly rows;
- whether total cloud cover is canonical and layer fields are supporting evidence, ensuring layers are not summed into artificial cloud cover;
- stable reason/flag ordering;
- repeated calls and permuted equivalent hourly inputs.

#### 7. Required targeted tests

At minimum, implement fixture-driven tests for:

1. high activity + clear sky + good darkness -> high result;
2. high activity + full cloud -> low result with hard cap;
3. low activity + clear sky -> medium result, never highest band;
4. `auroraActivity: null` -> `insufficient_data`, never a fabricated score;
5. `auroraActivity: 0` remains a valid scored input when other required inputs exist;
6. no darkness or no viewing/darkness overlap -> `not_viewable_tonight`;
7. a valid selected night from a partial multi-night Aurora snapshot can be scored independently;
8. moon above horizon during the relevant dark window -> moon modifier may apply;
9. moon not above horizon -> changing moon age does not change score;
10. heavy precipitation + severe cloud -> no duplicated full obstruction penalty;
11. high wind + otherwise good visibility -> same numeric score as calm equivalent plus comfort/safety flag or reason;
12. unknown/missing secondary fields -> defensive handling without crash or invented values;
13. unknown `scheduleType` -> no guessed semantics and no crash;
14. same deeply frozen or cloned inputs called repeatedly -> exactly equal output;
15. input objects and arrays remain unchanged;
16. equivalent hourly rows in different input order -> exactly equal output;
17. boundary and cross-midnight cases for darkness, viewing window and moon rise/set;
18. reasons/flags are data-driven and deterministically ordered;
19. the exported function signature contains no `tier`, `isPro`, user, subscription or feature-flag argument;
20. existing campsite scoring remains unchanged and its relevant tests continue to pass.

Tests must assert concrete score/cap/band relationships and output contracts, not merely snapshots or `does not throw`.

#### 8. Validation

Run:

- the new targeted test file;
- relevant Aurora parser tests;
- relevant existing scoring tests as regression protection;
- the full test suite;
- lint;
- production build.

Do not claim a command passed if it was not run successfully. If unrelated pre-existing failures occur, distinguish them with evidence.

#### 9. Scope exclusions

Do not implement:

- UI, maps, copy or translations;
- Free/Pro gating or differentiated scores;
- ranking or multi-location aggregation;
- backend ranking/score endpoints;
- persisted score rows or schema changes;
- Ticket 1 cache/cron/parser contract changes unless a STOP finding is reported instead;
- Ticket 3 integration;
- light pollution;
- modifications to existing campsite weather Model v1.0;
- final permanent band branding or scientific claims.

#### 10. Completion report

Write the factual workflow report to `docs/ai/tasks/ticket-390/cc-report.md` using the repository workflow format. Include:

- repository audit result;
- exact scoring contract and formula/aggregation decisions;
- provisional thresholds, caps and their rationale;
- files changed;
- tests, lint and build actually run with results;
- input immutability/determinism evidence;
- deviations from this approved prompt;
- STOP conditions encountered;
- remaining risks, especially national darkness-time limitations and provisional product-model constants;
- commit status and push status.

Do not implement anything outside this prompt merely because it appears adjacent or useful.

---

## Round 1 — Jonesy

### Technical review

Re-verified Ripley's repository audit independently against `api/_lib/aurora/parseAurora.js`, `api/forecast.js`, and `src/lib/scoring.js` — all three claims check out against the actual files, not just against the earlier read-only audit doc.

The prompt is well-scoped, self-contained, and correctly enforces the project's existing "scoring-rock" invariant (no tier/subscription/user argument anywhere in the function signature, and this is directly tested — required test 19). The STOP list is thorough and the scope-exclusion list correctly keeps this out of Ticket 3/4 territory. Three material issues, all additive clarifications rather than a change of approach:

1. **National-reference caveat is written for sun/darkness only, not moon.** Section 3 requires documenting that the Aurora feed's darkness values are national-reference, not location-specific astronomy. `moon.rise`/`moon.set` come from the exact same single-location feed and carry the identical limitation — the feed ties neither block to a location. As written, a compliant implementation could correctly caveat sun times while silently treating moon times as location-accurate, which would understate the moon modifier's real confidence in `cc-report.md`'s "remaining risks" section (required by Section 10).
   → Fix: extend the national-reference-only language in Section 3 and Section 10 to explicitly cover `moon.rise`/`moon.set`, not only `sun.*`.

2. **Reasons/flags for the two non-scored states are ambiguous.** Section 4's example JSON shows `reasons: []` and `flags: []` for both `insufficient_data` and `not_viewable_tonight`, but the sentence immediately after those examples ("reasons and flags must be derived from actual inputs and scoring branches") reads as a general rule that would imply these should be populated — e.g. identifying which field was missing, or why there was no darkness/window overlap. As written this is genuinely ambiguous, and none of the 20 required tests would catch either interpretation — CC could implement either reading and still pass every listed test.
   → Fix: state explicitly whether `insufficient_data` / `not_viewable_tonight` must carry a machine-readable cause code (e.g. `missing_activity`, `no_darkness_window`), and add at least one test asserting it. Recommend requiring it — an "insufficient data" state with no cause code loses exactly the diagnostic value the state exists to provide.

3. **No pre-existence check for the target module.** This project already has one confirmed precedent — Ticket 1 (`api/_lib/aurora/*`) — of an aurora-related implementation landing in the working tree ahead of its own ticket paperwork. Section 1's "confirm repository state before writing" list should explicitly include checking whether `src/lib/auroraScoring.js` (or a similarly-named module) already exists before creating it, with an explicit STOP if it does, rather than assuming a clean slate.

### Verdict

REVISE

---

## Round 2 — Ripley

### Response to Jonesy

All three findings are accepted:

1. The national-reference limitation now explicitly covers both `sun.*` and `moon.rise`/`moon.set`, including the required remaining-risk report.
2. Both non-scored states must now include a stable machine-readable cause in `reasons`, with explicit tests for `missing_activity` and `no_darkness_overlap` (or equivalently named documented identifiers).
3. The pre-write audit must search for an existing Aurora scoring implementation; finding one is a STOP condition rather than permission to overwrite, duplicate or silently reshape it.

### Revised prompt

Implement only GitHub issue #390, **Ticket 2 — Northern Lights Score v0.1**.

The goal is one pure, deterministic, canonical Aurora visibility result for a location and night. The same input must always produce exactly the same output. Free/Pro tier, user identity, subscription state and feature flags must have no effect on inputs, weights, thresholds or output.

Do not commit. Do not push.

#### 1. Confirm repository state before writing

Read and confirm the current implementation and data contracts in at least:

- `api/_lib/aurora/parseAurora.js`
- `api/_lib/aurora/parseAurora.test.js`
- `api/forecast.js`
- `src/lib/scoring.js` only to understand project style and avoid coupling to campsite scoring
- relevant Vitest/ESLint configuration and neighboring pure-module test conventions

Search for any existing Aurora/Northern Lights scoring implementation, including `src/lib/auroraScoring.js`, similarly named modules and tests, before creating files.

Record material findings in `cc-report.md`.

STOP before implementation if:

- an Aurora scoring module or materially equivalent implementation already exists; do not overwrite, duplicate or silently reshape it;
- the Ticket 1 normalized Aurora contract requires a breaking change;
- correct scoring requires guessed or unverified `scheduleType` semantics;
- the implementation would present national-feed sun, darkness, moonrise or moonset times as location-specific astronomical precision;
- cloud/precipitation double-counting cannot be prevented with a clear deterministic model;
- the solution requires tier/entitlement state, UI, an API endpoint, Neon, cron, ranking, Ticket 3 integration or changes to existing campsite scoring.

#### 2. Scope and file placement

Create a new isolated pure scoring module and colocated targeted tests following existing `.js` conventions. Prefer:

- `src/lib/auroraScoring.js`
- `src/lib/auroraScoring.test.js`

Do not add dependencies or modify `src/lib/scoring.js`. Do not add UI, routes, translations, analytics, backend endpoints, persistence, cache changes or live-network tests.

#### 3. Explicit input contract

Export one canonical public scoring function with a documented contract. It must accept a single object containing:

- one normalized Ticket 1 Aurora night:

```js
{
  eveningDate,
  auroraActivity,
  sun: { sunset, darknessStart, dawn, sunrise },
  moon: { ageDays, rise, set, scheduleType }
}
```

- location-specific hourly forecast rows normalized by the caller into a small fixture-friendly shape with timestamps and relevant total/low/mid/high cloud cover, precipitation and wind values; visibility may be accepted defensively but must not become a primary v0.1 signal without demonstrated incremental value;
- an explicit proposed viewing-window boundary or equivalent explicit range sufficient to calculate overlap deterministically.

Do not read system time, locale, browser timezone, environment variables, global state or external services. Do not mutate input objects or arrays.

Define and test time semantics, including midnight crossings, without host-timezone-dependent parsing. The Aurora feed has no location metadata: its `sun.*` values and `moon.rise`/`moon.set` values are national reference times, not location-specific astronomical calculations. Encode and document this limitation for both sun and moon inputs; do not invent local precision.

If the initial audit finds a smaller or safer input contract, use it only if every temporal/weather semantic remains explicit and explain it in `cc-report.md`.

#### 4. Output contract and diagnostic causes

Return one of three structurally stable states.

Scored:

```js
{
  status: "scored",
  score: 0,
  band: "provisional-band",
  reasons: [],
  flags: []
}
```

Insufficient primary data:

```js
{
  status: "insufficient_data",
  score: null,
  band: null,
  reasons: ["missing_activity"],
  flags: []
}
```

No usable darkness/viewing overlap:

```js
{
  status: "not_viewable_tonight",
  score: null,
  band: null,
  reasons: ["no_darkness_overlap"],
  flags: []
}
```

The exact identifiers may differ only if their names are equally stable and documented. Both non-scored states **must contain at least one machine-readable cause in `reasons`** explaining why no score exists. Empty reasons are not compliant for these states.

Use stable machine-readable identifiers, not localized prose. Reasons and flags must derive from actual inputs/branches, use deterministic ordering and contain no fixture-specific cases.

Band names and thresholds are provisional v0.1 constants. Keep them isolated, documented and easy to revise; do not present them as permanently locked domain truth.

#### 5. Scoring requirements

Implement one documented bounded numeric scale. Prefer integer `0..100`; another scale is acceptable only if simpler and fully tested. Clamp and round in one documented place.

- `auroraActivity` is the activity signal. `null` or invalid/missing activity produces `insufficient_data` with an explicit cause; numeric `0` remains valid.
- Relevant hourly total cloud cover during the viewing-window/darkness intersection is the principal local visibility signal.
- High activity cannot overcome fully overcast conditions. Full/near-full total cloud applies an explicit hard cap regardless of activity.
- Low activity with clear sky cannot reach the highest provisional band.
- No darkness or no meaningful overlap among viewing window, darkness and available observations returns `not_viewable_tonight` with an explicit cause, not a low numeric score.
- Precipitation is secondary and must not stack as another full penalty on severe cloud obstruction. Use an explicit cap, attenuation, combined-obstruction rule or equivalent deterministic mechanism.
- Moonlight is secondary and applies only when the moon is above the horizon during the relevant dark interval. Moon age alone has no effect when the moon is not visible.
- Never guess unknown `scheduleType` meanings. Use verified rise/set semantics when sufficient; otherwise handle defensively without fabricating visibility. STOP if correct handling fundamentally requires unverified `scheduleType` semantics.
- Moon rise/set calculations remain subject to the national-reference limitation and must not be described as location-accurate astronomy.
- Wind never reduces visibility score. Strong wind may add a stable comfort/safety reason or flag while preserving the otherwise identical score.
- Visibility is not a primary v0.1 signal. Use it only if tests prove incremental value beyond cloud/precipitation; otherwise ignore it explicitly.
- Missing secondary values must not crash, become fabricated defaults or force `insufficient_data` when primary inputs and a usable observation window are sufficient.

Use named constants and small pure helpers where useful. Thresholds/weights are provisional product-model choices, not false scientific precision.

#### 6. Deterministic aggregation

Define exactly how hourly rows inside the relevant interval are aggregated. The result must be order-independent, or the function must sort a copied array without mutating caller input. Never depend on machine clock or iteration accident.

Document and test:

- inclusion/exclusion at boundaries;
- cross-midnight darkness and moon intervals;
- missing values within otherwise usable rows;
- total cloud as canonical with layer fields only as supporting evidence, never summed into artificial cloud cover;
- stable reason/flag ordering;
- repeated calls and permuted equivalent hourly inputs.

#### 7. Required targeted tests

At minimum, add fixture-driven tests for:

1. high activity + clear sky + good darkness -> high result;
2. high activity + full cloud -> low result with hard cap;
3. low activity + clear sky -> medium result, never highest band;
4. `auroraActivity: null` -> `insufficient_data`, `score: null`, and an explicit machine-readable missing-activity reason;
5. `auroraActivity: 0` remains valid scored input when other required inputs exist;
6. no darkness or no viewing/darkness overlap -> `not_viewable_tonight`, `score: null`, and an explicit no-darkness/no-overlap reason;
7. a valid selected night from a partial multi-night snapshot scores independently;
8. moon above horizon during the dark window -> modifier may apply, while code/docs preserve the national-reference caveat;
9. moon not above horizon -> changing moon age does not change score;
10. heavy precipitation + severe cloud -> no duplicated full obstruction penalty;
11. high wind + otherwise identical conditions -> identical numeric score plus comfort/safety reason or flag;
12. unknown/missing secondary fields -> defensive handling without crash or invented values;
13. unknown `scheduleType` -> no guessed semantics and no crash;
14. repeated calls with deeply frozen/cloned identical inputs -> exactly equal output;
15. input objects and arrays remain unchanged;
16. equivalent hourly rows in different order -> exactly equal output;
17. boundary and cross-midnight cases for darkness, viewing window and moon rise/set;
18. reasons/flags are data-driven and deterministically ordered;
19. the public function input contains no `tier`, `isPro`, user, subscription or feature-flag argument;
20. existing campsite scoring remains unchanged and relevant regression tests pass;
21. both non-scored statuses always contain a stable machine-readable cause in `reasons`.

Assert concrete score/cap/band relationships and output contracts, not only snapshots or `does not throw`.

#### 8. Validation

Run:

- the new targeted test file;
- relevant Aurora parser tests;
- relevant existing scoring tests;
- the full test suite;
- lint;
- production build.

Do not claim an unrun or failed command passed. Separate unrelated pre-existing failures with evidence.

#### 9. Scope exclusions

Do not implement UI, maps, copy, translations, Free/Pro gating, differentiated scores, ranking, multi-location aggregation, backend score endpoints, persisted scores, schema changes, Ticket 1 cache/cron/parser contract changes, Ticket 3 integration, light pollution, existing campsite Model v1.0 changes, or final permanent band branding/scientific claims. If a Ticket 1 contract change is needed, report a STOP finding instead.

#### 10. Completion report

Write the factual workflow report to `docs/ai/tasks/ticket-390/cc-report.md`. Include:

- repository audit and explicit pre-existence check result;
- exact input/output contract and formula/aggregation decisions;
- provisional thresholds/caps and rationale;
- files changed;
- tests, lint and build actually run with results;
- determinism and input-immutability evidence;
- deviations and STOP conditions;
- remaining risks, explicitly including that national Aurora-feed `sun.*` **and** `moon.rise`/`moon.set` values are not location-specific astronomical precision;
- commit and push status.

Do not implement anything outside this prompt merely because it appears adjacent or useful.

---

## Round 2 — Jonesy

### Technical review

All three Round 1 findings are correctly and fully incorporated, each in more than one place (contract text, scoring requirements, required tests, and the completion-report requirements), not just patched in isolation:

1. National-reference limitation now explicitly names both `sun.*` and `moon.rise`/`moon.set` in Section 3, Section 5, test 8, and Section 10's remaining-risks requirement. Resolved.
2. Both non-scored states now require a populated, documented `reasons` cause (`missing_activity`, `no_darkness_overlap`), with the requirement stated as a hard compliance rule ("Empty reasons are not compliant for these states") and backed by tests 4, 6, and the new cross-cutting test 21. Resolved.
3. Section 1 now requires searching for an existing Aurora scoring module before writing, and the STOP list correctly treats a materially equivalent existing implementation as a stop condition ("do not overwrite, duplicate or silently reshape it") rather than leaving CC to guess what to do if one is found. Resolved.

Re-reviewed the full revised prompt fresh, not only the diff against Round 1 — no regressions and no new ambiguities introduced by the revision. Scope, STOP conditions, determinism/purity requirements, and the scoring-rock invariant (test 19) are unchanged and still sound.

### Verdict

APPROVED
