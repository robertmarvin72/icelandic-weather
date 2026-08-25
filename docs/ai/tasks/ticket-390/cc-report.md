# CC Report — Ticket 390 (Ticket 2: Northern Lights Score v0.1)

Executed against: `docs/ai/tasks/ticket-390/approved-prompt-v1.md` (v1, Jonesy: APPROVED).

## 1. Repository audit and pre-existence check

Read before writing any code:

- `api/_lib/aurora/parseAurora.js` — confirmed the Ticket 1 normalized night contract exactly:
  `{ eveningDate, auroraActivity, sun: { sunset, darknessStart, dawn, sunrise }, moon: { ageDays, rise, set, scheduleType } }`.
  No breaking change was required — the scoring module's input contract for `night` matches this shape verbatim.
- `api/_lib/aurora/parseAurora.test.js` — confirmed field semantics: empty tags parse to `null`, not omitted; `0` is preserved as a real value; a night is dropped only when `evening_date` itself is invalid.
- `api/forecast.js` — read for existing Open-Meteo integration/style; not modified.
- `src/lib/scoring.js` (lines 1–60 and export list) — read for style only (plain named exports, small pure helper functions, documented threshold tables). No import from, coupling to, or modification of this file.
- Vitest/ESLint conventions and neighboring test files — confirmed colocated `*.test.js` convention (e.g. `comparisonUtils.js` / `comparisonUtils.test.js`) and followed it.

**Pre-existence check:** searched the repository (glob + content search) for `auroraScoring`, similarly named modules, and any existing Aurora/Northern-Lights scoring logic. **No existing Aurora scoring module or materially equivalent implementation was found.** No STOP condition was triggered on this ground.

No other STOP condition was triggered: the Ticket 1 contract needed no breaking change; no scoring decision required guessing `scheduleType` semantics (see §6); no output presents national-feed times as location-specific (see §7 risks); cloud/precipitation double-counting was prevented with an explicit deterministic model (see §3); the solution required no tier/entitlement state, UI, API endpoint, Neon, cron, ranking, Ticket 3 integration, or changes to existing campsite scoring.

## 2. Files changed

- `src/lib/auroraScoring.js` (new) — the scoring module, single export `scoreAuroraVisibility`.
- `src/lib/auroraScoring.test.js` (new) — 31 tests covering all 21 required cases from the approved prompt §7.

No other files were modified. No dependencies were added. `src/lib/scoring.js` is untouched.

## 3. Input contract (as implemented)

```js
scoreAuroraVisibility({ night, hourlyRows, viewingWindow })
```

- `night` — one normalized Ticket 1 Aurora night, exactly the contract in §1 above (no change from Ticket 1).
- `hourlyRows` — caller-normalized array of `{ time, cloudTotal, cloudLow, cloudMid, cloudHigh, precipitation, windSpeed, visibility }`. `time` is a full ISO 8601 UTC string; every other field is independently nullable. `cloudTotal` is the canonical cloud signal; `cloudLow/Mid/High` are accepted but never read by the scoring logic (supporting evidence only, never summed into an artificial total). `visibility` is accepted but never read — explicitly ignored per §5/§9, since no test demonstrated incremental value over cloud/precipitation.
- `viewingWindow` — explicit `{ start, end }` ISO 8601 range.

No system time, locale, environment variable, global state, or external service is read anywhere in the module. No `tier`/`isPro`/user/subscription/feature-flag argument exists in the signature (`auroraScoring.test.js` asserts this structurally against the function's own source text, and asserts an extraneous tier-like property on the input object has zero effect on output).

The full contract, including the national-reference-time limitation, is documented in the module's header comment and JSDoc.

## 4. Output contract (as implemented)

Exactly one of three shapes, matching the approved prompt §4 verbatim except for one addition (see §6, deviation 1):

```js
{ status: "scored", score: 0..100 (integer), band: "very-poor"|"poor"|"fair"|"good"|"excellent", reasons: [...], flags: [...] }
{ status: "insufficient_data", score: null, band: null, reasons: ["missing_activity"], flags: [] }
{ status: "not_viewable_tonight", score: null, band: null, reasons: ["no_darkness_overlap"] | ["no_observation_data"], flags: [] }
```

Both non-scored states always carry exactly one machine-readable reason (never empty) — verified by dedicated tests (#4, #6, #21).

## 5. Formula and aggregation decisions

**Time reconstruction (host-timezone-independent).** The feed gives bare `HH:MM` strings tied to one `eveningDate`. Rule, applied uniformly to every sun/moon field: hour `< 12` → `eveningDate + 1`; hour `>= 12` → `eveningDate` itself. This matches the live feed sample confirmed during the Ticket 1 audit (sunset 21:13/darkness 22:10 same day; dawn 04:52/sunrise 05:49 next day; moonrise 21:39 same day; moonset 00:41 next day). All arithmetic uses `Date.parse` against an explicit `T00:00:00Z` base and epoch-millisecond offsets — no `getHours()` or other host-timezone-dependent `Date` methods are used anywhere.

**Darkness window** = `darknessStart .. dawn` (true astronomical darkness — the narrower interval within civil `sunset..sunrise`, where most aurora visibility already exists).

**Effective window** = intersection of the darkness window and the caller's `viewingWindow`. If empty → `not_viewable_tonight` / `no_darkness_overlap`. If non-empty but zero hourly rows fall inside it → `not_viewable_tonight` / `no_observation_data` (see §6, deviation 1).

**Row inclusion** is `>= start && < end` (half-open interval) — the boundary-inclusion test (`auroraScoring.test.js`, "boundary and cross-midnight handling") proves a row exactly at `start` is included and a row exactly at `end` is excluded. Rows are never mutated: `rowsWithinWindow` maps to `{row, ms}` pairs, filters, and sorts a new array — the caller's array and its objects are never touched (proven by the "input immutability" test, which deep-compares inputs before/after the call, and by the "row order independence" test, which asserts identical output regardless of input order).

**Score = `activityComponent + cloudComponent`, then secondary modifiers, then caps, then round.**

- `activityComponent = (clamp(auroraActivity, 0, 9) / 9) * 45`
- `cloudComponent = (1 - clamp(avgCloudTotalInWindow, 0, 100) / 100) * 55`, only added when cloud data is present; if entirely missing, no component is added (not fabricated as either clear or overcast) — the score simply stays at the activity-only component, flagged `cloud_data_unavailable`.
- The two weights sum to 100 so a perfect night (activity 9, 0% cloud) scores exactly 100.
- **Precipitation** attenuates the running score multiplicatively, capped at a 25% maximum reduction of whatever remains after the cloud component (`applyPrecipitationAttenuation`) — bounded so it can never add a second full obstruction penalty on top of cloud.
- **Moon** applies an 8-point penalty only when a moon window (both `rise` and `set` present and reconstructible) overlaps the effective window, and the moon's age is within 5 days of exact full (age ≈ 14.75, wrapped across the ~29.5-day synodic cycle). If `rise`/`set` are absent (any `scheduleType`, including unknown values), no moon window exists and age has zero effect, regardless of value.
- **Wind** never reassigns `score`; it only adds a `high_wind` flag at ≥12 m/s.
- Then, in order: clamp to `[0,100]` → cloud hard cap (`cloudTotal >= 90` ⇒ `score = min(score, 15)`, reason `cloud_hard_cap_applied`) → low-activity cap (`auroraActivity <= 2` ⇒ `score = min(score, 60)`) → final clamp + `Math.round`.

`reasons`/`flags` are pushed in a single fixed code order per branch outcome (activity → cloud → precipitation → moon → hard-cap), so they are deterministic and data-driven, never fixture-specific — verified by the ordering test asserting an exact reasons array for a fixed scenario, and by the determinism test (frozen/cloned identical inputs across repeated calls produce `toEqual` results).

## 6. Provisional thresholds/caps and rationale

All isolated as named constants at the top of `auroraScoring.js`, explicitly commented as v0.1 product-model choices, not scientific precision:

| Constant | Value | Rationale |
|---|---|---|
| `ACTIVITY_WEIGHT_POINTS` / `CLOUD_WEIGHT_POINTS` | 45 / 55 | Sum to 100; cloud weighted slightly higher since it is the principal *local* signal per §5, while activity is itself a national-reference input. |
| `CLOUD_HARD_CAP_THRESHOLD` / `CLOUD_HARD_CAP_SCORE` | 90% / 15 | "High activity cannot overcome fully overcast conditions" (§5) — verified as an actively-binding cap (test: activity 9 + 40% cloud vs. activity 9 + 100% cloud — the capped case scores strictly lower even though the uncapped formula alone would have put it higher). |
| `LOW_ACTIVITY_THRESHOLD` / `LOW_ACTIVITY_SCORE_CAP` | ≤2 / 60 | "Low activity with clear sky cannot reach the highest band" (§5). Chosen below the natural formula ceiling for activity=2 (65) so the cap is an actively-binding, tested mechanism (test: raw 65 → capped to exactly 60), not a dead/redundant constant. |
| `PRECIPITATION_MAX_ATTENUATION` / `PRECIPITATION_MM_FOR_MAX_EFFECT` | 25% / 3mm | Bounds precipitation to a fraction of whatever score remains after cloud, so it can never duplicate a full obstruction penalty (test: at the cloud hard cap, precipitation makes no difference to the final score at all). |
| `HIGH_WIND_MS_THRESHOLD` | 12 m/s | Flag-only threshold; never affects score by construction. |
| `MOON_BRIGHT_WINDOW_DAYS` / `MOON_PENALTY_POINTS` | 5 days / 8 points | Crude v0.1 illumination proxy — full-moon-adjacent nights lose a fixed, secondary penalty only when the moon is confirmed above the horizon in-window. |
| `BANDS` | very-poor ≤20, poor ≤40, fair ≤60, good ≤80, excellent ≤100 | Provisional labels only, isolated in one array, explicitly not final branding per §9. |

## 7. Deviations from the approved prompt

1. **Added a second `not_viewable_tonight` reason code, `no_observation_data`**, distinct from `no_darkness_overlap`. The approved prompt's §4 gives `no_darkness_overlap` as *an example* identifier and states in §5 "no meaningful overlap among viewing window, darkness and available observations" as one combined rule. I split this into two reasons for diagnosability: `no_darkness_overlap` when darkness and the viewing window themselves don't intersect (or darkness doesn't exist), and `no_observation_data` when they do intersect but zero hourly rows are available inside that intersection. Both are stable, machine-readable, and satisfy "at least one cause" in every case (tests #6, #21). This is a judgment call, not explicitly dictated verbatim — flagging it here per the prompt's own instruction to record such decisions.
2. **The `national_reference_times` flag is present only on `"scored"` outputs**, not on the two non-scored states. Rationale: the non-scored states either never reached sun/moon reconstruction (`insufficient_data`, activity missing before any time math runs) or found no usable darkness/observation window at all (`not_viewable_tonight`), so no national-reference-time value was actually used in producing that output. This is a design choice, not explicitly mandated either way by the prompt.

No STOP condition was triggered; no Ticket 1 contract change was needed.

## 8. Determinism and input-immutability evidence

- `auroraScoring.test.js` → "determinism": identical, deep-frozen (`Object.freeze`) `night`/`hourlyRows`/`viewingWindow` passed across two separate calls produce `toEqual` results.
- `auroraScoring.test.js` → "input immutability": `night`, `hourlyRows`, and `viewingWindow` are deep-compared (via JSON snapshot) before and after a call; all three are unchanged.
- `auroraScoring.test.js` → "row order independence": reversing the `hourlyRows` array produces an identical result (the function sorts a copy internally, never the caller's array).
- `auroraScoring.test.js` → "night selected from a multi-night snapshot": selecting one night out of a 10-night array and scoring it produces the same result as scoring an equivalent standalone night object — confirms no dependency on sibling nights or array position.

## 9. Tests, lint, and build actually run

All commands below were executed in this session; results are as shown, not assumed.

- **Targeted test file** — `npx vitest run src/lib/auroraScoring.test.js` → **31/31 passed** (one assertion was corrected after the first real run surfaced a genuine reasons-array mismatch — the fix was to correct the test's expected array, not the source; see run transcript).
- **Aurora parser tests + existing campsite scoring tests** — `npx vitest run api/_lib/aurora/parseAurora.test.js src/lib/scoring.test.js` → **98/98 passed**.
- **Full test suite** — `npx vitest run` → **655 tests / 55 files, all passed** (up from the 624 recorded after Ticket 1, i.e. +31, exactly the new file — no other test count changed). Output included several pre-existing, unrelated `Not implemented: navigation to another Document` jsdom console warnings; these are not failures and existed before this change.
- **Lint** — `npm run lint` → exit 0, no output, no warnings.
- **Build** — `npm run build` → succeeded (`✓ built in 9.34s`, PWA precache generated). The only warning was the pre-existing "chunks larger than 500 kB" notice, unrelated to this change — `auroraScoring.js` has no consumer yet in this ticket and is not part of any route's bundle.

No command was skipped, and no failing/unrun command is reported as passing.

## 10. Scope exclusions — confirmed not touched

No UI, maps, copy, translations, Free/Pro gating, differentiated scores, ranking, multi-location aggregation, backend score endpoint, persisted scores, schema changes, Ticket 1 cache/cron/parser contract changes, Ticket 3 integration, light pollution, campsite Model v1.0 changes, or final permanent band branding were implemented.

## 11. Remaining risks

- **Both `sun.*` (sunset/darknessStart/dawn/sunrise) and `moon.rise`/`moon.set` are national-reference times, not location-specific astronomical calculations.** The Vedur.is feed carries no location metadata (confirmed during the Ticket 1 audit via live fetch). This module uses those values exactly as provided and does not correct them for any specific campsite's actual coordinates. Every `"scored"` result carries the `national_reference_times` flag as a standing, machine-readable reminder; any future UI/consumer must not present darkness or moonrise/moonset times as location-precise.
- The v0.1 scoring weights, caps, and band thresholds are product-model choices (§6), not physically calibrated — they are isolated and documented for easy revision once real-world validation data exists.
- `visibility` is accepted in the input contract but currently unused; if a future ticket wants to use it as a signal, that requires a new deliberate decision and tests, not a silent addition.
- The `no_observation_data` reason (deviation 1, §7) is new vocabulary beyond what the approved prompt's examples named explicitly — worth explicit confirmation in result review that this is an acceptable interpretation.

## 12. Commit and push status

**Not committed. Not pushed.** Per the approved prompt and the workflow's default, no git operations were performed.
