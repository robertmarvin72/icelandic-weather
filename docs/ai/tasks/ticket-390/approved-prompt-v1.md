# Approved Prompt — Ticket 390 (Ticket 2: Northern Lights scoring)

Status: APPROVED_FOR_CC
Version: 1

Reviewed by:
- Jonesy: APPROVED

Source:
`docs/ai/tasks/ticket-390/prompt-review.md` — Round 2, Ripley

## Prompt

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
