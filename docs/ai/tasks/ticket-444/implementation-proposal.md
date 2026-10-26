# #444 — Implementation proposal (owner decision, Phase A only — NOT implemented)

This is a menu of options for Róbert to choose from, per surface. **Nothing in this document has been applied.** Phase B will implement whichever combination is approved, through a normal Jonesy prompt review. IS wording below is a proposal only — flagged `[IS — needs Róbert's approval]`; this report does not assess Icelandic quality (J8).

## The one new fact that should shape this decision

Open-Meteo's API documentation lists a daily mean-temperature field, `temperature_2m_mean` ("Mean Temperature (2 m)"), separate from `temperature_2m_max`/`_min` (`audit.md` §2, attributed solely to CC's own `WebFetch` against `https://open-meteo.com/en/docs`, accessed 2026-10-26 — not independently re-verified by Jonesy, whose own attempt to re-fetch it was refused). **This app does not currently request it.** Its exact averaging method and how it handles an incomplete/partial day are **UNKNOWN** — the documentation does not state a formula beyond a general "24 hour aggregation from hourly values" sentence (`audit.md` §2). **This proposal does not claim requesting this field would be "the cheapest" or "the correct" path** — only that it exists and is unused; see Option D2 below for what choosing it would actually cost. This is a Phase B cost either way (an `api/forecast.js` whitelist edit + a `forecastCache.js` cache-key version bump), not something Phase A changes.

---

## Surface 1 — Weather Finder's "avg temp"/"meðalhiti" (`weatherFinderRanking.js` → `WeatherFinderCard.jsx`)

**Current**: mean of each day's `tmax` over the selected window, **missing days counted as 0°C** in both the sum and the count. Same number is both displayed and used to rank "warmest." Labelled "avg temp" (EN) / **"meðalhiti"** (IS — literally "average temperature," the strongest claim of a true mean anywhere in the app).

| Option | What changes | `rankWarmest` output changes for identical inputs? | Other surfaces touched |
|---|---|---|---|
| **A — relabel only** | Wording becomes an honest description of what's actually computed (e.g. a mean of each day's own *high*, over the stated window) | **No** | None |
| **B — fix the 0-coercion** (exclude missing, like `comparisonUtils` already does) — **outside #444's own implementation scope, see note below** | A site with any missing day no longer has its average dragged toward 0 | **Yes — ranking can change for any site with missing data.** Owner decision required (J2/J6). | `weatherFinderRanking.test.js` (asserts current behavior; would need updating) |
| **C — add a separate min/max row, unlinked from ranking** | Show the window's actual lowest/highest *daily tmax* alongside (or instead of) the single average number, via a new presentation-only helper that never feeds `rankCalmest`/`rankWarmest`/`rankDriest` — **this would be the extrema of each day's own high, NOT the period's true overall minimum temperature** (that would require `tmin`, which this surface doesn't use at all; see the Surface-4 note on `tmin` being unused in scoring too) | No | `WeatherFinderCard.jsx` (new row) |
| **D1 — true mean, computed from hourly, client-side** | Uses hourly `temperature_2m` the app already fetches (no new provider field needed for the raw data itself) — **but a valid period/sample-cadence/completeness contract (what counts as "enough" coverage for a day) is still a future design task, not something this app already has**; no particular sample count (e.g. 24) is prescribed here, and this option does not require a cache-key bump on its own since the underlying raw hourly data is unchanged | No (if kept purely presentational, not fed back into `rankWarmest`) | New helper; Phase B cost: completeness-rule design (owner input needed) |
| **D2 — true mean, from the provider's own `temperature_2m_mean`** | Provider performs whatever aggregation it documents (exact method UNKNOWN, see above) — this option trades "we must design completeness rules" for "we must trust the provider's own, not-fully-documented ones" | No (if kept presentational) | Phase B cost: `api/forecast.js`'s hardcoded daily field list (lines 56-67) + `forecastCache.js`'s request/cache-key version (currently `v8`, a new field DOES need a bump since existing cached entries lack it) |
| **E — leave as is** | No change | — | — |

**Option B is explicitly placed OUTSIDE #444's own implementation scope** (per the correction round's binding instruction): fixing the 0-coercion changes `rankWarmest`'s output for identical inputs, and **this ticket's own Phase B must preserve scores/ranks/verdicts for identical inputs** — a scoring/ranking behavior change is a separately-scoped follow-up candidate for the owner to open as its own ticket, not something choosing it here authorizes.

**Proposed wording if A is chosen** (does **not** fix the 0-coercion — a relabel alone does not make a missing-day-coerced-to-zero number a genuine "observed mean"; it only states honestly what the *current* computation already is, limitation included):
- EN: `"average daily high"` (replacing `"avg temp"`)
- IS: `"meðalhæsti hiti"` **[IS — needs Róbert's approval]** (replacing `"meðalhiti"`)

**Key-parity note (J8)**: `weatherFinderAvgTemp` exists today in both `en`/`is` blocks of `translations.common.js`; a relabel keeps the same key, same shape, no parity risk. Tests referencing this exact string: none found asserting the literal word "meðalhiti"/"avg temp" itself in `WeatherFinderCard.select.test.jsx`/`weatherFinderRanking.test.js` (those assert the `metrics.avgTemp` number and shape, not the label text) — low regression risk for a pure relabel, but Phase B must re-check before changing.

---

## Surface 2 — `comparisonUtils.js`'s `avgHighTemp` (icon-only row on `InstantComparison.jsx`, Brochure-only; qualitative "warmer" exposure on `HomeDecisionCard.jsx`)

**Current**: mean of up to 3 days' `tmax`, **missing days excluded** (not coerced to 0) — already the more defensible of the two missing-data policies. No "average" word is shown anywhere near the number (icon-only row); the homepage (`HomeDecisionCard.jsx`) never shows the raw number at all, only a qualitative "warmer"/"hlýrra" chip when the difference clears a threshold.

**For the owner's awareness, not a change proposed**: the homepage "warmer" chip's actual semantics are "the nearby site's mean of its own daily HIGHS (up to 3 days, missing excluded) is at least 1.5°C above the current site's same metric" — it is a comparison of daytime highs, not a claim about how the nights or the whole day compare. This is stated here so the decision on Surface 2's option below is made with the real semantics in view, not a guess.

| Option | What changes | Ranking/comparison-tone changes for identical inputs? |
|---|---|---|
| **A — add a tiny qualifier near the icon-only row** (Brochure only) | e.g. a caption "3-day avg high" next to the existing 🌡 row | No |
| **E — leave as is** | No change — arguably already the safer of the two labelled-number surfaces, since no literal "average" word is shown | — |

This surface's missing-data POLICY is already the one Option 1-B would move Weather Finder toward; no coercion fix is proposed here since none is needed.

---

## Surface 3 — `CampsiteComparisonSection.jsx`'s "Temp"/"Hiti" factor row

**Current**: raw provider daily max, labelled bare "Temp"/"Hiti" — accurate (it IS the day's own temp reading) but doesn't say *which* reading (max, not min, not current, not average).

| Option | What changes |
|---|---|
| **A — relabel to say "high"** | EN `"High"` (or `"Temp (high)"`), IS `"Hiti (hámark)"` **[IS — needs Róbert's approval]** |
| **E — leave as is** | Already not claiming "average" — lowest-severity finding in this audit |

No ranking/scoring surface touched either way (this factor row only drives this file's own A/B "better" verdict via the separately-governed `compareCampsiteForecasts.js`, which this proposal does not touch).

---

## Surface 4 — `scoring.js`'s missing-`tmax` sentinels (`-999` in `basePointsFromTemp`, `10` in the cold-wind/wintry-precip penalties)

**Current**: a missing `tmax` is NOT labelled anywhere as missing — it is silently scored as if it were colder than any realistic reading. In **summer** this produces the observed "Good" → "Bad" reclassification (`reference-cases.md` RC-06) for an otherwise-pleasant day; in **winter**, the same RC-06 fixture shows NO difference at all (the winter `baseFloor` of `4` already pins `basePts` to `4` regardless of `tmax`'s value or presence — `audit.md` §1.4, corrected this round). **This is a season-dependent behavior, not a universal "any day" finding** — production frequency of missing `tmax`, and whether other input combinations behave differently in winter, remain UNKNOWN.

This is **not a labelling problem** — it is a scoring-input behavior, and per the contract's item 6 and J6, **no option here may be "mere relabelling" that leaves this silently wrong**, and changing it necessarily changes `scoreSiteDay`'s points/class output (feeding Top5Leaderboard, Weather Finder's underlying `rows`, and every per-day class shown anywhere) for any day where `tmax` is missing.

| Option | What changes | Scores/classes change for identical inputs? |
|---|---|---|
| **B — treat missing `tmax` as "insufficient data" rather than a cold-floor sentinel** (e.g. skip the day, or return a distinct "Unknown" class instead of "Bad") — **outside #444's own implementation scope, see note below** | Every consumer of `scoreSiteDay`/`scoreDay` output needs to handle a new "insufficient data" state | **Yes, in summer-like conditions — a day currently scored "Bad" (0 points) due to missing tmax would no longer be "Bad."** Confirmed to make no difference for the specific winter fixture tested (RC-06); other winter inputs not tested. Owner decision required. |
| **E — leave as is, but document it** | No code change; this audit's own finding stands as the documentation | No |

No "relabel only" option is offered for this surface — there is no user-facing label to relabel; the problem is purely in the computed `finalClass`/`points`, not in any displayed word.

**Option B is explicitly placed OUTSIDE #444's own implementation scope**, same as Surface 1's Option B and for the identical reason: it changes `scoreSiteDay`'s output for identical inputs, and #444's own Phase B must preserve scores/ranks/verdicts for identical inputs. If the owner wants this fixed, it is a separately-scoped follow-up ticket — selecting it in this proposal does not authorize implementing it under #444.

---

## Cross-cutting notes (apply to any option chosen)

- **No option may silently change `rankWarmest`/`calcMetrics`'s `strength`/`primaryKey`/`scoring`'s point outputs for identical inputs without being flagged as such above** (J6's own instruction) — every row in the tables above states explicitly whether it does.
- **Imperial-mode coverage is uneven** (`audit.md` §1.1/§1.6, `reference-cases.md`'s unit table): `InstantComparison.jsx` has no imperial handling at all (hardcoded °C/m/s/mm). This is a related but SEPARATE gap from the temperature-averaging question this ticket is actually about — flagged here for the owner's awareness, not folded into any option above, and not proposed for a fix in this ticket.
- **Any option touching `translations.common.js`** must preserve EN/IS key parity (both blocks already have every key used above) and must be re-checked against the three test files that reference these keys/behaviors (`HomeDecisionCard.test.jsx`, `InstantComparison.analytics.test.jsx`, `comparisonUtils.test.js`, `weatherFinderRanking.test.js`, `WeatherFinderCard.select.test.jsx`) before Phase B is considered complete.
- **No mode (statistical) is computed anywhere in this app.** The Expert Support paraphrase's three-way distinction (mean / midpoint-of-extrema / mode) is fully demonstrated in `reference-cases.md` RC-01, but no option above proposes adding a mode computation — none of the surfaces audited would benefit from one, and the contract explicitly says "mode not a substitute" rather than "add mode."

## What Róbert needs to decide

1. **Surface 1 (Weather Finder)**: A, C, D1, D2, or E now under #444 — Option B (fix the 0-coercion) is out of #444's own scope; note it as a follow-up candidate if wanted.
2. **Surface 2 (comparisonUtils/InstantComparison)**: A or E.
3. **Surface 3 (CampsiteComparisonSection)**: A or E.
4. **Surface 4 (scoring.js sentinels)**: E (document only) under #444 — Option B (fix the sentinels) is likewise out of #444's own scope; it is a real, season-dependent (not universal) scoring-input behavior, confirmed by execution, and NOT a wording decision; note it as a follow-up candidate if wanted.
5. **IS wording** for any chosen relabel (A options above) — explicitly needs Róbert's own review, not mine.

Once decided, Phase B goes through a normal Jonesy prompt review before any code is written, per the contract's lifecycle.
