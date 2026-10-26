# #444 — Reference cases

All numbered cases below marked **OBSERVED** were produced by actually executing this repository's real, unmodified, exported functions this session — not hand-calculated or guessed. Script: `docs/ai/tasks/ticket-444/scratch/reference-cases-script.mjs`. Loader shim: `docs/ai/tasks/ticket-444/scratch/extensionless-loader.mjs` (see "Script safety" below for why it exists and what it does/doesn't do). Full raw output: `docs/ai/tasks/ticket-444/scratch/reference-cases-output.txt`.

Exact commands run, in order:

```
git status --short                      # before — confirmed clean except this ticket's own new files
node docs/ai/tasks/ticket-444/scratch/reference-cases-script.mjs
  → failed: ERR_MODULE_NOT_FOUND (relative import depth miscalculated on first attempt)
  [fixed the script's own import paths — no source file touched]
node docs/ai/tasks/ticket-444/scratch/reference-cases-script.mjs
  → failed: ERR_MODULE_NOT_FOUND 'C:\...\src\lib\geo' — comparisonUtils.js's own
    extensionless relative import (`import { haversine } from "./geo"`, Vite-bundler
    style) cannot be resolved by plain Node ESM
  [wrote extensionless-loader.mjs, a resolve-hook shim using only Node's built-in
   node:module `register()` API — no new dependency, no src/ file touched]
node --import ./docs/ai/tasks/ticket-444/scratch/extensionless-loader.mjs docs/ai/tasks/ticket-444/scratch/reference-cases-script.mjs > docs/ai/tasks/ticket-444/scratch/reference-cases-output.txt 2>&1
  → exit code 0, full output below
git status --short                      # after — identical to before (only this ticket's own
                                           docs/ai/tasks/ticket-444/ tree changed; no src/app file touched)
```

**v2 correction round (2026-10-26, Jonesy R1/R2)** — the script was extended (RC-06 now runs on 3 dates instead of 1; new RC-08 added) and re-run with the identical command above (same loader, same invocation):

```
git status --short                      # before this round — unchanged from the v1 round's own end-state
node --import ./docs/ai/tasks/ticket-444/scratch/extensionless-loader.mjs docs/ai/tasks/ticket-444/scratch/reference-cases-script.mjs > docs/ai/tasks/ticket-444/scratch/reference-cases-output.txt 2>&1
  → exit code 0, full corrected output below (overwrites the v1 output file — the v1 numbers
    for RC-01..RC-05/RC-07 are unchanged by this round, confirmed by inspection of the new output)
git status --short                      # after — identical; no src/app file touched this round either
```

Additionally, two directory-wide `rg` searches were run this round (R2) — their exact commands/counts are recorded in `audit.md` §3, not duplicated here.

## Script safety (J7)

The script imports only four pure modules by their real exported names: `rankWarmest` (`weatherFinderRanking.js`), `calcMetrics` (`comparisonUtils.js`), `basePointsFromTemp`/`getColdWindPenalty`/`getWintryPrecipPenalty`/`scoreSiteDay` (`scoring.js`), `normalizeDailyToScoreInput` (`forecastNormalize.js`). None of these four modules was found, on inspection, to touch `localStorage`, `fetch`, the DOM, or the filesystem — confirmed by reading each file in full before writing the script (see `audit.md` §1 for the per-file reads). `comparisonUtils.js` has a transitive import of `./geo` (`haversine`), which is also a pure, side-effect-free module (geographic distance math) — not independently re-read line-by-line this session beyond confirming it loaded and executed without error or any observable side effect. `forecastCache.js` and all React components were deliberately NOT imported, per J7's explicit instruction. The `extensionless-loader.mjs` shim only participates in Node's own `import` specifier RESOLUTION (retrying a failed resolution with `.js` appended) — it does not read, write, or execute anything beyond that; it is `node:module`'s own built-in, stable-since-Node-20.6 `register()` hook, not a new package.

Both scratch files (`reference-cases-script.mjs`, `extensionless-loader.mjs`) and the output (`reference-cases-output.txt`) are **retained** under `docs/ai/tasks/ticket-444/scratch/` as the report requires — none deleted.

---

## RC-01 — asymmetric multi-day period, mean vs. midpoint-of-extrema (OBSERVED + hand-computed contrast)

**Provenance**: the `tmax` input array `[2, 2, 2, 10]` is a synthetic, hypothetical 4-day period chosen to make the Expert Support paraphrase's distinction concrete — it is explicitly **4 forecast days, not a 24-hour day** (the paraphrase's own "midpoint of extrema ≠ period mean" point applies at any period length; this ticket's actual surfaces operate on multi-day windows, not single 24h clock-hours, so a 4-day period is the representative shape).

| Quantity | Value | Source |
|---|---|---|
| `computeMetrics`'s mean-of-maxima (via `rankWarmest`) | **4.0** | OBSERVED — real function |
| Midpoint of extrema `(min+max)/2` | **6.0** | hand-computed from the same 4 inputs — NOT any function in this codebase |
| Mode | not computed by any surface in this app | — |

These genuinely differ (4.0 vs 6.0) for the same input — the exact Expert Support point, now demonstrated with this codebase's own real numbers rather than asserted abstractly.

## RC-02 — missing value, partial series `[10, null, 10]` (OBSERVED, both real policies)

Same 3 rows run through BOTH of the app's own real functions:

| Function | Result |
|---|---|
| `weatherFinderRanking`'s `avgTemp` (missing → `0`) | **6.666...** (°C) |
| `comparisonUtils`'s `avgHighTemp` (missing excluded) | **10.0** (°C) |

This is the exact divergence Jonesy's J2 predicted, now confirmed by direct execution rather than code-reading inference.

## RC-03 — all-null `tmax` for one site (OBSERVED)

| Function | Result |
|---|---|
| `weatherFinderRanking`'s `avgTemp` | **0.0** (°C) — Weather Finder would display and rank this site as a confident, exact 0.0°C average, indistinguishable from a verified 0.0°C day |
| `comparisonUtils`'s `avgHighTemp` | **null** — correctly reports "no data," the comparison skips temperature for this site entirely |

**Provenance**: the all-`null` input is itself hypothetical (not a confirmed real production payload — this repository cannot verify live provider completeness, per `audit.md` §5) but the FUNCTION BEHAVIOR shown is real/observed, not inferred.

## RC-04 — no data at all (OBSERVED)

`rankWarmest` with an empty `forecast` array: the site never appears in the ranked output at all (`computeMetrics` returns `null` for an empty slice; `filterSites` already excludes it via `hasForecast`). `calcMetrics([])` also returns `null`. Neither function silently reports a `0`.

## RC-05 — legitimate `0`/negative values vs. `scoring.js`'s own missing-data sentinels (OBSERVED)

| Call | Result |
|---|---|
| `basePointsFromTemp(0)` | 1 |
| `basePointsFromTemp(-5)` | 0 |
| `basePointsFromTemp(null)` (missing → internal `-999`) | 0 |
| `getColdWindPenalty(0, windMax=10)` | 3 |
| `getColdWindPenalty(undefined, windMax=10)` (missing → internal `10`) | 0 |
| `getWintryPrecipPenalty(code=71, tmax=0)` | 3 |
| `getWintryPrecipPenalty(code=71, tmax=undefined)` (missing → internal `10`) | 2 |

**Correction to a plausible first assumption**: `basePointsFromTemp(-5)` and `basePointsFromTemp(null)` land on the SAME result (`0`) — not because `-999` is being compared against `-5` in any special way, but because `scoring.js`'s own threshold ladder already returns `0` for ANY summer `tmax < 0` (see `audit.md` §1.4) — so the `-999` sentinel's exact magnitude turns out not to matter here; "any negative value, real or missing" already floors at `0`. No `0`/negative/sentinel value collision risk was found (`-999` is far outside any realistic Icelandic air temperature either way).

## RC-06 — full `scoreSiteDay`, complete vs. missing `tmax`, otherwise identical day (OBSERVED, season-dependent — corrected v2, Jonesy R1)

~~**This is the single clearest, most concrete finding in this audit.**~~ **Superseded**: the original run used only one date (2026-06-15, summer). Re-run this round on 3 real dates, same wind (5), rain (0), weatherCode (1), only `date` and whether `tmax` is present varied:

| Date | Season | `tempWeight` | Complete day (`tmax: 12`) | Missing `tmax` | Differ? |
|---|---|---|---|---|---|
| 2026-06-15 | summer | 1 | **8 pts / "Good"** (`basePts` 8) | **0 pts / "Bad"** (`basePts` 0) | **Yes** |
| 2026-10-27 | winter | 0.35 | 3 pts / "Fair" (`basePts` 4) | 3 pts / "Fair" (`basePts` 4) | **No — identical** |
| 2027-01-10 | winter | 0.35 | 3 pts / "Fair" (`basePts` 4) | 3 pts / "Fair" (`basePts` 4) | **No — identical** |

**Why winter differs from summer**: `getSeasonConfig("winter")`'s `baseFloor` is `4`, and `basePointsFromTemp`'s maximum possible return is `10`, so the winter-scaled `baseScaled = round(baseRaw * 0.35)` can reach at most `4` — meaning `basePts = max(4, ...)` is pinned at exactly `4` for ANY valid winter `tmax`, missing or not. This is a direct, confirmed consequence of the existing winter floor design (not something this audit proposes changing), and it means **the dramatic "Good→Bad" result is a summer-specific artifact of this fixture, not a universal "missing tmax always matters" finding.** Whether some OTHER wind/rain/weatherCode/date combination could still show a difference in winter via a different code path, and how often `tmax` is actually missing in real production data, both remain **UNKNOWN** — this case demonstrates season/config dependence, it does not prove or disprove any production frequency claim. Recorded as a finding per the contract's item 6; not fixed in Phase A; placed outside #444's own implementation scope as a separately-scoped follow-up candidate (`implementation-proposal.md`).

## RC-08 — hypothetical `rankWarmest` rank-distortion example, A `[10, null, 10]` vs B `[8, 8, 8]` (OBSERVED, new this round — Jonesy's suggestion)

No rain/wind inputs (both candidates identical on those factors, isolating the temperature effect):

| Candidate | `tmax` inputs | `rankWarmest`'s `avgTemp` (0-coercion) | `calcMetrics`'s `avgHighTemp` (missing excluded) |
|---|---|---|---|
| A | `[10, null, 10]` | **6.67** | **10.0** |
| B | `[8, 8, 8]` | **8.0** | **8.0** |

**Observed `rankWarmest` order: B, then A** — B ranks "warmest" ahead of A, even though A's two genuinely-observed days (10°C) are both warmer than every one of B's three days (8°C). Had `calcMetrics`'s exclude-missing policy been used instead, A (10.0) would rank ahead of B (8.0) — the opposite order. **This is a hypothetical, synthetic 3-day example chosen to make the rank-distortion concrete, not a claim about how often this pattern occurs in production** (production frequency/completeness remains UNKNOWN throughout this audit).

## RC-07 — `tmax` through `forecastNormalize.js`: no hourly coverage vs. partial hourly coverage (OBSERVED)

| Scenario | `tmax` (both days) | `windMax` (day 1, no hourly for its date) | `windMax` (day 2, has hourly) |
|---|---|---|---|
| No `hourly` object at all | `[12, 14]` | 5 (raw daily fallback) | 6 (raw daily fallback) |
| `hourly` present, but only covers day 2 | `[12, 14]` — **unchanged** | 5 (raw daily fallback — day 1 still has no matching hourly rows) | 4 (time-weighted from the synthetic hourly rows) |

`tmax` is byte-identical across both runs — confirms directly, by execution, that temperature is NEVER time-weighted and NEVER depends on hourly completeness in this file, unlike `windMax` which visibly changes behavior based on hourly coverage. This directly supports `audit.md` §1.8's claim with an executed, not merely read, proof.

## Cases addressed by code-reading analysis rather than a script run (no function exists to execute)

- **Partial day / midnight-exclusive end / date rollover**: Open-Meteo's own documentation (quoted in `audit.md` §2) does not give an explicit midnight-to-midnight statement; this repository's code does not itself implement day-boundary logic for `temperature_2m_max/min` (it simply indexes whatever `daily.time[]`/`temperature_2m_max[]` pair the provider returns for the requested `timezone`). No local function exists to execute for this case; treated as a documentation/provider question, graded INFERRED, not asserted as a confirmed daily-mean/midnight guarantee.
- **Daily-provider mismatch to subperiod**: `CampsiteComparisonSection.jsx`'s 3-hourly subsample (`audit.md` §1.3) is a UI-level filter on raw hourly data, not a function with a numeric "mismatch" to execute — the finding is structural (a third time definition exists), not a numeric discrepancy to demonstrate.
- **Duplicate/irregular timestamps**: `forecastNormalize.js`'s `getDayHourlyMetrics` loop (lines 46-76) would sum/max over however many hourly rows match a given date prefix, including duplicates if the provider ever sent them — but since `tmax` itself never consults the hourly array at all (RC-07), a duplicate-timestamp scenario cannot affect `tmax` specifically. Not executed separately since RC-07 already establishes `tmax`'s independence from the hourly array's contents.

## Unit handling (Celsius/Fahrenheit) and rounding — labelled vs. stored precision (code-read, cross-referenced to `audit.md` §1)

| Surface | Metric unit, precision | Imperial unit, precision |
|---|---|---|
| `WeatherFinderCard.jsx` ("avg temp"/"meðalhiti") | °C, `toFixed(1)` | °F, `toFixed(0)` |
| `InstantComparison.jsx` (icon-only row) | °C hardcoded, `toFixed(1)` | **no imperial handling at all** — no `units` prop in this file |
| `ForecastTable.jsx` (min/max) | via `convertTemp`/`formatNumber`, default `toFixed(1)` | same `convertTemp` formula, same default precision |
| `HourlyForecastModal.jsx` (per-hour) | via `convertTemp`/`formatNumber(..., 0)` | `toFixed(0)` |
| `weatherVoiceShareImage.js` ("High") | `Math.round()` (0 decimals) | not applicable (share image is a fixed presentation, not unit-toggled in the read code) |
| `CampsiteComparisonSection.jsx` (Pro comparison "Temp"/"Hiti" row) — **added v2 R2** | °C hardcoded, no rounding applied before display (raw provider value) | **no imperial handling at all** — same file also hardcodes `m/s` (wind) and `mm` (rain); confirmed via a direct grep for `units\|imperial\|convertTemp\|convertWind` in this file returning zero matches |

No claim is made here that real production data ever exercises a full 24-hour window, a fully complete day, or a verified provider-mean — per the contract's explicit instruction, completeness is stated as UNKNOWN wherever it was not directly observed.
