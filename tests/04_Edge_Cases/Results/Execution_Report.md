# Model v1.0 Edge-Case Test Execution Report

## Run summary

| Field                   | Value                                                    |
|-------------------------|----------------------------------------------------------|
| Commit tested (git rev-parse HEAD) | `6eec37cf93ae92df4e3b191a07434f2067cefa43` |
| Commit (xlsx/vector baseline)      | `597386c44a27f84428a0b204713de056a2f8e6cc` |
| Run date                | 2026-07-21                                               |
| Test framework          | Vitest 4.0.16                                            |
| Node.js                 | v24.11.0                                                 |
| Test vectors            | tests/04_Edge_Cases/Test_Vectors/model_v1_edge_cases.json |
| Vector count            | 193 (189 automated + 4 review)                           |

## Commit mismatch note

HEAD (`6eec37cf`) is one commit ahead of the vector baseline (`597386c4`).
The only file changed between those two commits is `docs/model-baseline-v1.0.md`
(documentation only). No scoring logic under `src/` changed. `src/` was clean
at test time (`git status -- src/` returned nothing).

## Test command

```
npx vitest run \
  --config tests/04_Edge_Cases/vitest.edge-cases.config.js \
  --reporter=verbose \
  2>&1 | tee tests/04_Edge_Cases/Results/console_output.txt
```

The vitest.config.js `include` pattern (`src/**/*.test.js`) does not cover
`tests/`. A dedicated config at `tests/04_Edge_Cases/vitest.edge-cases.config.js`
was created (NOT modifying the existing vitest.config.js) and passed via
`--config`.

## Results

| Status | Count |
|--------|-------|
| PASS   | 187   |
| FAIL   | 2     |
| REVIEW | 4     |
| Total  | 193   |

---

## Failed tests

### EC-180 — Round input -0.04 to one decimal

- **Group:** Rounding
- **Function:** round1 (internal to scoring.js, not exported — tested inline)
- **Input:** -0.04
- **Expected:** `+0` (0.0)
- **Actual:** `-0` (negative zero)

**Code path:**

```
Math.round(Number("-0.04") * 10) / 10
= Math.round(-0.4) / 10
```

ECMAScript spec (ECMA-262 §20.3.2.28): for `x` in `(-0.5, 0)`,
`Math.round(x)` returns `-0`. For x = −0.4: x ∈ (−0.5, 0) → returns `-0`.
Then `-0 / 10 = -0`.

The production `round1` in `src/lib/scoring.js` (line 253) uses the same
expression (`Math.round(v * 10) / 10`) and would produce the same `-0`.

The test vector expected value `0.0` represents JSON `+0`. JavaScript's
strict deep-equality (`Object.is(-0, 0) === false`) distinguishes them.
Vitest's `toEqual` uses this distinction → FAIL.

**Implication for scoring:** `-0` and `+0` are numerically equal in all
comparisons (`-0 >= 0` is `true`; `-0 === 0` is `true`). When `-0` reaches
`basePointsFromTemp`, it hits the `t >= 0` branch → returns `1` (same as
`+0`). No production scoring impact.

---

### EC-181 — Round input -0.05 to one decimal

- **Group:** Rounding
- **Function:** round1 (internal)
- **Input:** -0.05
- **Expected:** `+0` (0.0)
- **Actual:** `-0` (negative zero)

**Code path:** same as EC-180. x = -0.05 ∈ (−0.5, 0) → `Math.round(-0.5)`

Note: for input exactly `-0.5`, ECMAScript specifies rounding toward +∞, so
`Math.round(-0.5) = 0`. But the sign of the zero: for `-0.05 * 10 ≈ -0.5`,
the result is `-0` for the same reason.

In IEEE 754 double precision: `-0.05 * 10` may be exactly `-0.5` or slightly
above/below. Either way Math.round yields 0 or -0. The actual execution
produced `-0`, consistent with EC-180.

**Implication for scoring:** same as EC-180 — no production impact.

---

## Review cases (malformed inputs — not failures)

These were executed with literal JS inputs not representable in JSON.
Recorded as "Review"; they do not count toward pass/fail.

| Test ID | Call                            | Actual output | Observed behavior                                           |
|---------|---------------------------------|---------------|-------------------------------------------------------------|
| EC-190  | `basePointsFromTemp("12", null)` | `8`           | JS coerces string "12" to number 12. Hits `t >= 12` band → returns 8. Summer tempWeight=1.0 → basePts=8. No explicit validation. |
| EC-191  | `windPenaltyPoints(NaN, null)`  | `10`          | `v = NaN ?? 0 = NaN`. All `<=` comparisons with NaN are false → falls through to maximum penalty (`return 10`). NaN produces worst-case wind penalty. |
| EC-192  | `rainPenaltyPoints(Infinity)`   | `5`           | `r = Infinity ?? 0 = Infinity`. `Infinity < 1` is false, `Infinity < 4` is false → maximum penalty (`return 5`). Expected behavior. |
| EC-193  | `getSkyComfortModifier({})`     | `0`           | `{} == null` is false. `{} === 0`, `{} === 1`, etc. all false → falls through to `return 0`. Safe default. |

---

## Import / export limitations

- `round1` is an internal function in `src/lib/scoring.js` (not exported).
  The runner tests it by reimplementing the same expression inline
  (`Math.round(Number(input) * 10) / 10`). This faithfully reproduces the
  production logic.

- `getSeasonConfig`, `getPleasantnessModifier`, `normalizeShelter`,
  `windSeverity01`, `computeShelterBonus`, `getPrecipTimingMultiplier`,
  `scoreDay` are exported but not individually tested by the vectors (they are
  covered indirectly via `scoreSiteDay`).

- The vitest.config.js `include` pattern does not cover `tests/`. A separate
  config was created at `tests/04_Edge_Cases/vitest.edge-cases.config.js`
  to allow running without editing the project config.

- `import.meta.url` returns a non-`file:` URL in the jsdom environment.
  Paths were resolved via `process.cwd()` (project root) instead.

---

## Production code changes

**None.** No file under `src/`, `api/`, `server_data/`, or any other
production path was modified during this test run.

Files created or modified during this run (all under `tests/` or root):

| File | Action |
|------|--------|
| `tests/04_Edge_Cases/Runner_Templates/model-v1-edge-cases.test.js` | Adapted (import depth, path resolution, malformed-input handling, afterAll flush) |
| `tests/04_Edge_Cases/vitest.edge-cases.config.js` | Created (run config, does not modify vitest.config.js) |
| `tests/04_Edge_Cases/Results/edge_case_results.json` | Created (test output) |
| `tests/04_Edge_Cases/Results/console_output.txt` | Created (captured stdout/stderr) |
| `tests/04_Edge_Cases/Results/Model_v1.0_Edge_Case_Test_Cases_RESULTS.xlsx` | Created (xlsx copy with results populated) |
| `tests/04_Edge_Cases/Results/Execution_Report.md` | Created (this file) |
