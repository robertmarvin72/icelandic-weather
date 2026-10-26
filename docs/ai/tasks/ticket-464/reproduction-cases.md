# #464 — Reproduction cases

2026-10-26. CC. Companion to `research-report.md`. Lists every retained script/spec/output under `docs/ai/tasks/ticket-464/harness/`, the exact command used, and what each one proves. All fixtures below are **synthetic**, built from the owner's own rounded, reported numbers where stated — none of it is the owner's original raw payload (see `research-report.md` §7: **NOT HISTORICALLY REPRODUCED**, no original screenshot/payload exists anywhere in scope).

> **Round 2 correction (2026-10-26, R1/R2):** three rows below (gust feasibility, sky/pleasantness sweep, season-boundary) and the Oct-27 note in the first row were corrected per Jonesy's result-review. See `research-report.md`'s own Round 2 correction notice for the full detail; this file's corrections are the same facts, restated for the reproduction-case table.

## Harness files (all under `docs/ai/tasks/ticket-464/harness/`, none touching the repo's own config/tests)

| File | Purpose |
|---|---|
| `esm-ext-loader.mjs` | Node ESM resolver hook so a standalone script can import this repo's extensionless `src/lib/*.js` modules under plain Node (same pattern used in ticket #444). Resolves `./scoring` → `./scoring.js` etc., relative to the importer, only inside this script's own process. |
| `reference-cases-script.mjs` | Imports the real, unmodified `src/lib/scoring.js` and `src/lib/forecastNormalize.js` and runs the Oct-27/Oct-28 breakdown, the gust/sky feasibility sweeps, the wind-boundary and edge-case counterfactuals, the season-boundary check, and the `normalizeDailyToScoreInput` provenance proof. |
| `reference-cases-output.txt` | Full captured stdout of the script above. VERIFIED EXECUTION. |
| `vitest.config.ticket464.mjs` | Task-local Vitest config (J1/J9): sets `root` to the real repo root (five directories up from this file) so imports/aliases resolve exactly as production, but restricts `include` to this task's own spec file only. Never referenced by `package.json` or the repo's own `vitest.config.js`. |
| `HourlyForecastModal.ticket464.spec.jsx` | 17 real React Testing Library renders of the unmodified `src/components/HourlyForecastModal.jsx`, with only the network/cache boundary (`../lib/forecastCache`'s `getForecast`) mocked — same mocking pattern as the repo's own `HourlyForecastModal.test.jsx`. Never calls the real `forecastCache`/`getForecast`, never touches `localStorage`, never makes a network request. |
| `vitest-output.txt` | Full captured output of the harness spec run (verbose reporter), 17/17 passed, including the real React duplicate-key warning and the two real `console.log` midnight-label outputs. |
| `vitest-midnight-output.txt` | Isolated rerun (`-t "midnight"`) used only to force the two `console.log` lines (`MIDNIGHT_LABEL_EN`/`MIDNIGHT_LABEL_IS`) to the top level of the output for easy citation; same two tests, same result. |
| `reference-cases-script-v2.mjs` (Round 2) | Extends the Round 1 script: sweeps the real, unmodified `scoring.js` over 14 candidate raw `weatherCode` values for Oct-28, finds the first gust that reaches "Bad" for each, checks Oct-27 with raw code 3 (overcast) and no gust, and compares `windGust:null` vs. `windGust:windMax` explicitly. |
| `reference-cases-output-v2.txt` (Round 2) | Full captured stdout of the script above. VERIFIED EXECUTION. |
| `tz-check.mjs` (Round 2) | Formats `"2026-10-28T00:00"`/`"T21:00"` via the exact `formatHourLabel` logic, and calls the real `getSeasonForDate`, reading whatever `TZ` the host process was started with. |
| `tz-check-output.txt` (Round 2) | Output of the script above, run as three separate OS processes under `TZ=Atlantic/Reykjavik`, `TZ=America/New_York`, `TZ=Asia/Tokyo` (PowerShell `$env:TZ`, not Git Bash — see `research-report.md` §6e). VERIFIED EXECUTION. |
| `rule-gap-check.mjs` (Round 2) | Confirms `gustPenaltyPoints(8,5,"winter")` is non-zero even though `wind=5,gust=8` is hourly "Good" — the R3 rule-gap example. |
| `rule-gap-check-output.txt` (Round 2) | Output of the script above. VERIFIED EXECUTION. |

## Exact commands (all read-only, no repo file touched by execution)

```bash
# Real scoring/normalization execution (Round 1)
node --import ./docs/ai/tasks/ticket-464/harness/esm-ext-loader.mjs \
  docs/ai/tasks/ticket-464/harness/reference-cases-script.mjs

# Real component render harness
npx vitest run --config docs/ai/tasks/ticket-464/harness/vitest.config.ticket464.mjs --reporter=verbose

# Real code-sweep / Oct-27 overcast re-run (Round 2, R1)
node --import ./docs/ai/tasks/ticket-464/harness/esm-ext-loader.mjs \
  docs/ai/tasks/ticket-464/harness/reference-cases-script-v2.mjs

# Real rule-gap confirmation (Round 2, R3)
node --import ./docs/ai/tasks/ticket-464/harness/esm-ext-loader.mjs \
  docs/ai/tasks/ticket-464/harness/rule-gap-check.mjs
```

```powershell
# Real TZ-dependent format/season check (Round 2, R2) — PowerShell, not Git Bash;
# Git Bash's TZ=... prefix and `export TZ=...` did not propagate to node.exe on
# this Windows machine, so this specific check requires $env:TZ in PowerShell.
foreach ($z in "Atlantic/Reykjavik","America/New_York","Asia/Tokyo") {
  $env:TZ = $z
  node --import ./docs/ai/tasks/ticket-464/harness/esm-ext-loader.mjs `
    docs/ai/tasks/ticket-464/harness/tz-check.mjs
}
```

Both were run from the repo root, against the checked-out worktree at HEAD `24dcd8925287893249d6d5fd70edd6b4ce84158f`, with blob hashes as recorded in `cc-report.md`.

## What each case proves, and its evidence grade

| Case | Grade | What it shows |
|---|---|---|
| Oct-27/Oct-28 synthetic daily breakdown (owner-reported rounded values) | VERIFIED EXECUTION | The real formula, fed the owner's own numbers with raw `weatherCode` UNKNOWN (one illustrative code tried per date), computes **"Fair"** for Oct-28 (code 1 example), not the owner's reported "Bad" — establishing the gap this ticket exists to explain. ~~Oct-27 similarly computes "Ok", not "Fair/Sæm".~~ **Corrected (R1):** with raw code 3 (overcast) and no gust, Oct-27 computes exactly **"Fair"**, matching the owner's report with no unreported input needed for that one date/code combination (see the Round-2 row below). |
| Gust feasibility sweep, 14 raw codes (Round 2, R1) | VERIFIED EXECUTION | ~~From the Oct-28 baseline, `windGust >= windMax + 6 ≈ 11.1 m/s` is both necessary and sufficient (in this sweep) to reach "Bad"~~. **Corrected:** the first gust that reaches "Bad" is code-dependent — **≈11.1 m/s** for clear codes (0/1), **≈8.0 m/s** (`diff ≥ 2.9`) for `null`/2/3/45/51/61/95, and **not needed at all** for wintry codes (66/67/71/77/85), which are already "Bad". No single "most parsimonious" number exists; **consistent with**, not proof of, the real cause, and conditional on the unknown raw code. |
| Oct-27 overcast, no gust (Round 2, R1) | VERIFIED EXECUTION | Raw code 3, owner's reported rounded baseline, `windGust:null` → real `scoreSiteDay` returns exactly **"Fair" (3 pts)** — matches the owner's report with zero unreported inputs for this date. |
| No-gust vs. gust-equal-to-windMax (Round 2, R1) | VERIFIED EXECUTION | `windGust:null` and `windGust:5.1` (== windMax) both give `gustPen=0`/"Fair" for code 1 — not materially different for this input, via two different early-return branches of `gustPenaltyPoints`. |
| Sky/pleasantness-only sweep | VERIFIED EXECUTION | Without any gust, varying only weatherCode (clear/overcast/fog, codes 0/1/3/45) bottoms out at "Fair" — never reaches "Bad" alone. This holds only for the four non-wintry codes originally swept; the Round-2 sweep above shows the wintry codes (66/67/71/77/85) *do* reach "Bad" with no gust, via the `wintry` term rather than `sky`. |
| Rule-gap example: hourly-Good vs. daily-gustiness-penalized (Round 2, R3) | VERIFIED EXECUTION | `wind=5, gust=8` (the harness's own "all-calm" hourly fixture) is badged hourly "Good" but real `gustPenaltyPoints(8,5,"winter")=2` (non-zero) and a full `scoreSiteDay` call returns `components.gust=-2` — the same two numbers are simultaneously calm (hourly) and gusty-penalized (daily). |
| Winter wind-boundary counterfactual (4.9/5.0/5.0001/5.1/10/10.1) | VERIFIED EXECUTION | Confirms the exact bracket edges, and that `scoreSiteDay`'s internal 1-decimal rounding happens **before** the threshold check, so a raw value that rounds down to the boundary does not cross it even though the un-rounded value nominally would. |
| Zero/negative/NaN/Infinity/string/missing-date edge sweep | VERIFIED EXECUTION | Surfaces a real internal inconsistency: `rainPenaltyPoints` and `getPrecipTimingMultiplier` disagree on how to treat `NaN` (one has an `isFinite` guard, the other doesn't), and a numeric string is accepted by relational-operator coercion in `windPenaltyPoints` but rejected by a strict `typeof` check in `getColdWindPenalty`/`gustPenaltyPoints`. |
| `normalizeDailyToScoreInput` provenance proof (provider daily max 9/20 vs. normalized 11/14 from a single unsampled-hour spike) | VERIFIED EXECUTION | Proves the daily score's own wind/gust inputs are time-weighted hourly maxima, not the provider's own daily fields, and that the specific hour responsible can be one the 3-hourly modal never samples. |
| Oct-28 hourly all-calm render (8×Good, window "00:00-21:00") | VERIFIED EXECUTION (real component render) | Reproduces the *shape* of the owner's hourly screenshot from purely synthetic calm inputs — not proof the owner's real hourly values were this calm. |
| Daily/hourly data-run asymmetry (two synthetic `getForecast` payloads, one calm, one rough, behind two separate modal opens) | VERIFIED EXECUTION (mechanism demonstration only) | Shows the modal re-resolves `getForecast` on every open and renders exactly what that call returns, independent of any previously-rendered daily data — a real, general mechanism, not evidence that this is what happened in the screenshots. |
| 11 hourly-predicate edge cases (null/NaN/Infinity/string/negative/missing-pop/unsampled-peak/mixed-run/tie/duplicate-key/out-of-order/cross-date) | VERIFIED EXECUTION (real component render) | Each one is a distinct, real, rendered outcome — not inferred from reading the source. Full list and expected-vs-actual per case in `research-report.md` §6d. |
| Midnight label under en-GB and is-IS | VERIFIED EXECUTION | Node v24.11.0's bundled ICU renders midnight as `"00:00"` under both locales with `hour12:false` — not `"24:00"`. Browser engines unverified. |
| Timezone-label round-trip, 3 real `TZ`s (Round 2, R2) | VERIFIED EXECUTION | ~~`formatHourLabel` can silently diverge for a viewer outside UTC+0~~. **Corrected: it does not.** Under `TZ=Atlantic/Reykjavik`, `America/New_York`, and `Asia/Tokyo`, `"2026-10-28T00:00"`/`"T21:00"` all format to `"00:00"`/`"21:00"` in both en-GB and is-IS — the original "silent divergence" claim was wrong and is retracted. |
| DST spring-forward gap (labelled edge case, Round 2, R2) | VERIFIED EXECUTION | `"2026-03-08T02:00"` (a nonexistent local time under US DST) formats as `"03:00"` under `TZ=America/New_York`, vs. `"02:00"` under non-DST-observing `Atlantic/Reykjavik`/`Asia/Tokyo`. A real edge case; not an October observation and not Iceland-applicable (no DST). |
| Season-boundary (Oct 1/May 1), 3 real `TZ`s (Round 2, R2 — J6 completed) | VERIFIED EXECUTION | ~~Not re-executed under an altered `TZ` this round~~. **Completed:** under `TZ=America/New_York`, `getSeasonForDate("2026-10-01")` flips to **"summer"** (month reads as 9) and `("2026-05-01")` flips to **"winter"** (month reads as 4) — confirming the UTC-parse/local-`getMonth()` bug is real for timezones west of UTC. `Atlantic/Reykjavik` and `Asia/Tokyo` both resolve correctly. Confirmed **not** to apply to Oct 27/28 under any of the three timezones tested (both stay "winter" everywhere). |

## Explicit synthetic-vs-original labelling

Every fixture file, test name, and script input above is built from scratch for this ticket. None of it is read from, or claims to be, the owner's original forecast response for Oct 27/28 2026 — that payload is **NOT HISTORICALLY REPRODUCED** (research-report.md §7). Where a synthetic case is built to match the owner's *reported, rounded* numbers (e.g. tmax 5.8, windMax 5.1), the report says so explicitly each time; where a case explores a hypothetical/unreported input (gust, weatherCode), the report says "consistent with", never "the cause".
