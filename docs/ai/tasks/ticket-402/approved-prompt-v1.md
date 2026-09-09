# Approved Prompt v1 — Ticket 402

### Role and objective

You are Claude Code, the execution layer for GitHub issue #402: **“UX: Láta dagsyfirlit endurspegla nothæfan hluta dagsins.”**

Improve the daily forecast card's presentation-only weather summary so it tells a coherent story about the usable part of the day and meaningful changes over time. In particular, a short wet spell early followed by a long dry period must not be presented simply as “Heavy drizzle.” Keep the full-day numeric metrics truthful and unchanged, and do not change scoring, recommendation, raw forecast data, or provider requests.

This is a follow-up to ticket #400. Treat #400's canonical weather-code mapping, null-safety, hourly-derived presentation boundary, and scoring invariance as established. Ticket #402 is allowed to revise only #400's **presentation summarization rule** where the existing “single heavy observation overrides the day” behavior conflicts with the new temporal-summary requirement.

Before editing, read `AGENTS.md`, `CLAUDE.md`, `docs/ai/README.md`, `docs/ai/CURRENT.md`, this approved prompt, GitHub issue #402, and the complete current implementations/tests for:

- `src/lib/dailyWeatherSummary.js` and its tests;
- `src/lib/weatherPresentation.js` and its tests;
- `src/hooks/useForecast.js`, `forecastNormalize.js`, and scoring-invariance tests;
- `src/components/ForecastTable.jsx` and its presentation tests;
- `src/components/HourlyForecastModal.jsx`, including its best-window calculation and 3-hour display sampling;
- `src/utils/precipitation.js` and all precipitation timing fields/copy;
- EN/IS translation keys used by daily and hourly weather presentation;
- ticket #400's approved prompts, CC report, and result reviews.

Document the pre-edit data flow in `cc-report.md`: where raw Open-Meteo daily `weathercode` enters, how `summaryCode` is currently derived from all hourly rows, why the issue fixture still becomes heavy drizzle, how the ForecastTable chooses its icon/headline/caption, how the hourly modal derives its best weather window, and why scoring continues to use raw `row.code` before presentation fields are added.

Preserve unrelated owner changes. Do not commit or push.

### Required implementation

#### 1. Introduce a pure temporal daily-summary result

Evolve the presentation-only summary boundary so it can return both:

- a representative WMO code for the icon/fallback presentation; and
- an optional semantic translation key describing a meaningful wet/dry transition or brief precipitation episode.

Use a small explicit object contract (for example `{ code, textKey }`) or an equivalently clear pure representation. Keep `summarizeDailyWeatherCode` as a backward-compatible wrapper if existing consumers/tests benefit from it; do not force unrelated consumers onto the richer contract.

The summary must be computed from the selected date's own valid hourly observations, in chronological order, using the full-resolution hourly payload—not the modal's every-third-hour display rows. It must not mutate inputs. Continue to ignore malformed timestamps and missing/non-finite/unsupported weather codes safely; `null`/`undefined` must never coerce to WMO 0.

Do not reuse `forecastNormalize`'s current `precipStartHour`/`precipEndHour` as sufficient evidence for a transition: those fields lose gaps and can make intermittent rain look continuous. Derive the presentation pattern from the actual hourly sequence. Prefer existing weather-family definitions and precipitation values; do not duplicate WMO family tables.

#### 2. Make the temporal rules deterministic and conservative

Define named constants/helpers and document the thresholds in code and `cc-report.md`. The implementation must distinguish at least:

- precipitation early, followed by a long usable dry period → EN `Rain early, dry later` and an idiomatic IS equivalent;
- a long usable dry period followed by precipitation later → EN `Dry early, rain later` (or an equally concise reviewed wording) and IS equivalent;
- precipitation throughout most/all of the usable day → retain a truthful precipitation-family/intensity summary, not a dry-transition phrase;
- a brief isolated but potentially intense precipitation episode within an otherwise dry usable day → a truthful brief/showery phrase, not an all-day “Heavy rain/drizzle” headline;
- a consistently dry day → retain the existing dominant clear/cloud/fog presentation;
- mixed/intermittent patterns without a clear directional change → retain a neutral truthful existing/fallback presentation rather than inventing a false “improving” or “worsening” story.

Use the existing primary usable-day convention (`06:00 <= hour < 22:00`) unless the audit proves a different canonical boundary is already shared. The issue's motivating shape—wet around 00:00/03:00/06:00 and dry from 09:00 through 21:00—must produce a dry-later narrative, not `Heavy drizzle`.

Do not key the rule to array element counts alone. Sort valid observations and reason in elapsed/covered time so sparse or reordered input cannot fabricate duration. A transition phrase requires meaningful evidence on both sides and a substantial continuous dry span; choose and test an explicit minimum (recommended: at least six covered hours) rather than treating one dry observation as “dry later/early.” Missing precipitation amounts must not be silently treated as zero; supported precipitation-family WMO codes may provide precipitation evidence when amount data is unavailable. Conversely, a dry-family weather code with a missing amount is not proof of measured zero rainfall.

Thunder/hail, freezing precipitation, and snow are safety-significant. Do not hide a sustained or meaningful episode behind a generic dry narrative. If a brief significant episode is summarized temporally, the copy and representative icon must still communicate the precipitation/hazard family truthfully; existing daily hazard badges and numeric metrics remain visible and unchanged.

The representative icon/code and headline must tell the same story. Do not show a heavy-drizzle icon beside copy that implies an entirely clear day, or a clear icon beside an unqualified heavy-precipitation headline. Unknown/insufficient data must retain the neutral unknown/fallback behavior from #400.

#### 3. Integrate without disturbing numeric or decision data

Add the richer presentation result in `useForecast` only **after** `scoreSiteDay(row)` has consumed the untouched normalized row, exactly as #400 established. Return any new presentation field alongside—not instead of—raw `row.code`, daily `rain`, temperatures, wind, gusts, timing fields, points, class, and penalties.

In `ForecastTable`, prefer the new semantic text key when present. Otherwise preserve the current canonical WMO presentation and precipitation-label fallback. Ensure `getPrecipitationLabel` cannot overwrite a more specific temporal narrative with a generic amount label. Continue to use the same resolved representative code/family for the icon and ordinary precipitation caption.

Do not change:

- Open-Meteo query parameters or response shapes;
- `forecastNormalize`'s raw/daily metric calculations;
- `scoreSiteDay`, penalties, time weights, hazard thresholds, warning badges, ranking, relocation, or recommendation paths;
- the hourly forecast rows, their values, or the existing best-weather-window algorithm/copy;
- Free/Pro gating, analytics, checkout, or backend behavior.

The daily card and hourly modal must describe the same observed sequence coherently. They need not use identical wording, and #402 does not authorize redesigning or extracting the modal's wind/rain best-window algorithm solely to drive the daily headline.

#### 4. Add bilingual product copy

Add the minimum required EN and idiomatic IS translation keys for the temporal summaries. Never construct user-visible sentences by concatenating fragments in JSX. Keep copy short enough for the existing mobile table/card layout.

The exact English examples above may be refined only for clarity, but tests must assert the final approved EN and IS outputs for each supported semantic state. Do not hardcode English or Icelandic in components.

### Acceptance criteria

- The pre-existing selection/data flow and the #400 override conflict are documented accurately.
- The motivating #402 fixture no longer renders simply as `Heavy drizzle`; it communicates that precipitation is early and the long later period is dry.
- The inverse pattern communicates that conditions worsen later.
- All-day precipitation remains precipitation-led, while a short intense episode does not falsely characterize the whole day as continuously heavy.
- Stable dry and ambiguous/intermittent days retain conservative, truthful summaries.
- Daily headline, icon, hourly rows, and best-window message do not tell materially contradictory stories.
- Full-day numeric temperature, wind, gust, rain, hazard, score, class, and penalty values are unchanged.
- Raw `row.code` remains the provider daily code and never receives the presentation result.
- Existing #400 null/unknown safety, family mapping, day/night icon behavior, and default fallback remain intact.
- EN and IS render localized semantic text with no raw translation-key leakage.
- No scoring/recommendation, provider/API, entitlement, analytics, or checkout code changes.

### Required tests

Add focused, discriminating tests for at least:

1. the exact #402 fixture: light rain/drizzle/heavy drizzle at 00:00/03:00/06:00 and dry at 09:00–21:00 → dry-later narrative, never plain `Heavy drizzle`;
2. the inverse dry-early/rain-later pattern;
3. precipitation through most/all of the usable day;
4. one short intense rain/drizzle episode surrounded by a long dry span;
5. persistent dry/clear or dry/cloudy conditions;
6. intermittent wet/dry/wet input with no honest directional narrative;
7. snow, freezing precipitation, and thunder/hail patterns, including brief versus sustained evidence;
8. boundary hours around 06:00 and 22:00;
9. reordered hourly arrays producing the same result after chronological normalization;
10. sparse observations, uneven gaps, missing precipitation arrays/amounts, malformed timestamps, unsupported codes, and literal null codes;
11. no same-date usable hourly observations preserving the existing safe fallback;
12. ForecastTable rendering the new semantic key and a compatible icon, with no generic precipitation caption overwriting it;
13. exact EN and IS rendering without untranslated keys;
14. scoring invariance: changing only the hourly temporal pattern may change presentation fields, but not `code`, `points`, `class`, any penalty, or any daily numeric metric;
15. existing HourlyForecastModal rows and best-window behavior remaining unchanged for the motivating fixture.

Where a #400 test encodes “a single heavy precipitation observation always overrides the whole day's headline,” revise it explicitly as a superseded **presentation-only** expectation under #402; do not silently delete or weaken unrelated #400 coverage. Include a red→green proof for the motivating fixture.

### Validation

Run, in order:

1. focused tests for the temporal summarizer and ForecastTable rendering;
2. #400's complete presentation/null-safety/scoring-invariance test set;
3. HourlyForecastModal and relevant forecast normalization/scoring tests;
4. `npm test -- --run`;
5. `npm run lint`;
6. `npm run build`;
7. `git diff --check` and a final scope/data-flow inspection;
8. real-browser verification of the motivating fixture and its inverse in EN and IS, at a narrow mobile viewport and in light/dark mode. Confirm headline/icon coherence, unchanged numeric metrics, no clipping, and that opening hourly detail tells the same temporal story.

Record exact commands/results and any skipped visual combination or environment limitation in `docs/ai/tasks/ticket-402/cc-report.md`. Update `docs/ai/CURRENT.md` through the required CC lifecycle.

### STOP conditions

STOP and report before implementation if:

- the issue cannot be fixed without changing scoring, penalties, hazards, rankings, recommendations, or shared forecast inputs;
- truthful temporal summaries require changing provider/API requests, response contracts, timezone interpretation, or adding forecast data not already present;
- daily numeric metrics must change to make the headline pass;
- the implementation would reuse lossy start/end timing fields as if they represented continuity, or would duplicate WMO-family mappings;
- a new headline cannot be kept coherent with the displayed icon and precipitation caption through the presentation-only boundary;
- satisfying #402 requires redesigning the HourlyForecastModal best-window algorithm rather than merely preserving/coherently aligning with it;
- a new dependency, backend change, entitlement/gating change, analytics change, or checkout change is required;
- ambiguous owner changes overlap the required files or the work materially exceeds this summary-semantics ticket.

If stopped, make no speculative workaround. Document the evidence and the smallest product/architecture decision required from Róbert.

