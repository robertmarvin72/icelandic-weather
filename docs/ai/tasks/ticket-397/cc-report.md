# CC Report — Ticket 397 (UX: Bæta framsetningu norðurljósaspár þegar engir góðir staðir finnast)

Executed against: `docs/ai/tasks/ticket-397/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS).

## 1. Mandatory preflight audit

Read before editing: `docs/ai/tasks/ticket-391/{approved-prompt-v1.md,cc-report.md,result-review.md}`, `docs/ai/tasks/ticket-392/{approved-prompt-v1.md,cc-report.md,result-review.md}` (including the owner-approved bounded six-ID candidate roster exception), `src/components/NorthernLightsCard.jsx` + its test file, `src/components/NorthernLightsMap.jsx` + its test file, `src/MapView.jsx`, `src/components/LazyMap.jsx`, `src/lib/auroraScoring.js`, `src/lib/auroraDecisionClassify.js`, `api/_lib/auroraDecision/rankDecision.js`, `src/i18n/translations.northernLights.js`, `src/lib/analytics.js`, `src/config/features.js`.

### Confirmed audit finding (was not assumed)

`NorthernLightsMap.jsx` passed Ticket 3's ranked Aurora locations into the generic `MapView`, which — independently of the Aurora band already computed by Ticket 2/3 — fetches each site's own 7-day forecast (`src/lib/forecastCache.js`'s `getForecast`) and computes a SEPARATE generic weekly score via `scoreSiteDay`/`normalizeDailyToScoreInput`, then colors/labels markers from that second, unrelated computation (`colorForScore`/`labelForScore`, 0–70 scale, thresholds 35/20). This is a structurally different dimension from the canonical Aurora `excellent/good/fair/poor/very-poor` band and is exactly the source of the Höfn-style contradiction described in issue #397 — a place could show `poor` in the card and an independently-computed `Fair`/`Sæmilegt` in its map popup, with no shared source of truth between the two.

## 2. Scope confirmation

This is a presentation-selection and labeling change only. No Aurora cache/cron, `scoreAuroraVisibility`, band thresholds/reasons/flags, Ticket 3 endpoint/ranking, candidate roster, request body, cache identity, or Free/Pro computation was touched — confirmed by re-reading `api/_lib/auroraDecision/rankDecision.js` and `src/lib/auroraScoring.js` against the pre-ticket versions; neither file was modified. No STOP condition was triggered.

## 3. Files changed

**New:**
- `src/lib/auroraDisplaySelection.js` — pure presentation-selection helper: filters canonical `best`/`alternatives` to qualifying (`excellent`/`good`/`fair`) bands, canonical order preserved, capped at six, no backfill; derives `hasQualifyingLocations`, `bestAvailable` (raw canonical `best`, any band), `showRanking` (Pro + qualifying), `showMap` (≥2 qualifying AND ≥2 distinct bands).
- `src/lib/auroraBandPresentation.js` — single source of truth mapping a canonical band to its translation-key label and marker color, shared by `NorthernLightsCard.jsx` (text) and `MapView.jsx`'s new Aurora mode (markers/legend) — the direct fix for the Höfn contradiction: one shared table, not two independent mappings.
- `src/MapView.test.jsx` — no test file existed for `MapView.jsx` before this ticket; added both baseline (normal-mode, unchanged behavior) and Aurora-mode coverage.
- `src/lib/auroraDisplaySelection.test.js`, `src/lib/auroraBandPresentation.test.js`.

**Modified:**
- `src/components/NorthernLightsCard.jsx` — computes `display = selectAuroraDisplay(...)` once per render; branches into the existing qualifying-result presentation (now driven by `display.qualifyingLocations`/`display.showMap`, heading renamed) or a new `AllPoorResult` component when nothing qualifies; `northern_lights_ranking_viewed`/`northern_lights_map_viewed` now gate on `display.showRanking`/`display.showMap` (actual rendered exposure) instead of `isPro && detailsExpanded` alone; `northern_lights_card_viewed` gained an optional low-cardinality `resultState: "qualifying" | "all_poor" | null` property.
- `src/components/NorthernLightsMap.jsx` — passes `mode="aurora"` to `MapView` and forwards each location's `band`.
- `src/MapView.jsx` — added the `mode` prop (`"weather"` default, unchanged; `"aurora"` new). In Aurora mode: skips the forecast-preload effect and the marker-click forecast fetch entirely; marker/cluster color and popup content come from `auroraBandColor`/`auroraBandLabelKey` applied to `campsites[i].band`, never from `fetchForecastAndScore`; the generic weather-color toggle button and legend are replaced by a fixed Aurora legend (excellent/good/fair — the only bands that can ever reach the map, since `showMap` is qualifying-only). Normal mode's every code path is unchanged (verified: `mode` defaults to `"weather"`, and every new branch is `isAuroraMode`-gated with the pre-existing behavior as the untouched `else`).
- `src/i18n/translations.northernLights.js` — subtitle replaced; `nlAlternativesHeading` renamed to `nlQualifyingHeading` with reworded copy (no longer implies "all locations checked"); added `nlAllPoorTitle`/`nlAllPoorBody`/`nlAllPoorBestLabel` and `mapAuroraConditionLabel`/`mapAuroraLegendTitle`, EN + IS.
- `src/components/NorthernLightsCard.test.jsx`, `src/components/NorthernLightsMap.test.jsx` — updated for the rename and extended with the full #397 test matrix (§6 below).

No dependency was added. No `.tsx`/TypeScript.

## 4. The map dimension correction, explained

Before: `NorthernLightsMap` → `MapView(campsites=[{id,name,lat,lon}])` (default mode) → `MapView` fetches+scores its own generic 7-day forecast per site → colors/labels from that unrelated computation.

After: `NorthernLightsMap` → `MapView(campsites=[{id,name,lat,lon,band}], mode="aurora")` → `MapView` never fetches/scores anything; every marker's color (`auroraBandColor`), popup text (`mapAuroraConditionLabel` + `auroraBandLabelKey`), and the legend all read directly from the SAME canonical `band` the card itself displays, through the SAME shared `auroraBandPresentation.js` table. The Höfn-style contradiction is now structurally impossible within the Aurora surface: there is only one Aurora band value flowing into both the card text and the map, never two independently-computed ones.

## 5. Honest result states — exact behavior

- **Qualifying** (`display.hasQualifyingLocations`): unchanged canonical best summary; Pro's expanded details show `display.qualifyingLocations` (stable-filtered, canonical order, capped at six) under the reworded `nlQualifyingHeading` ("Recommended locations tonight" / "Mælt með þessum stöðum í kvöld"); map shown only when `display.showMap` (≥2 qualifying, ≥2 distinct bands); stale/partial/exclusion/high-wind/reasons/national-window disclosures unchanged.
- **All-poor** (`!display.hasQualifyingLocations`): a new, distinct `AllPoorResult` render path — `nlAllPoorTitle`/`nlAllPoorBody` (honest, no danger/data-gap implication, no guaranteed-improvement claim), the six-place ranking list and map are structurally absent from this branch (not merely hidden by CSS — a different component tree entirely, verified via `queryByRole("list")`/`queryByTestId("nl-map-container")` returning null), Free gets coarse guidance with **no upgrade CTA at all** (no copy could honestly entice an upgrade when nothing qualifies), Pro may reveal **at most one** `display.bestAvailable` location (still labeled with its real poor/very-poor band, framed as "best of the checked options (still poor)", never as a recommendation) behind the same details-disclosure toggle. A `sessionStorage`-persisted `detailsExpanded=true` from an earlier qualifying session cannot leak list/map content or fire their analytics here — verified directly (test: "a persisted expanded-details preference does not leak list/map content or fire their analytics in the all-poor state").
- Existing `domain_unavailable`/`no_darkness`/`transport_error`/`contract_defect` branches are untouched — confirmed unchanged in the diff and re-verified green in the existing test suite.

## 6. Required targeted tests — status

All eleven categories from approved-prompt §9 are covered:

1. Mixed bands filter stably, canonical order, capped at six, no backfill — `auroraDisplaySelection.test.js` (pure) + `NorthernLightsCard.test.jsx` (rendered, 8-entry fixture, 7th qualifying dropped).
2. All-poor produces the dedicated state, no list, no map — both test files.
3. Pro all-poor shows at most `bestAvailable`; Free all-poor leaks no identity/score/reasons/coordinates, no misleading CTA — `NorthernLightsCard.test.jsx`.
4. Partial + stale composes with both qualifying and all-poor — both test files.
5. Map visibility (≥2 qualifying + ≥2 distinct bands; hidden for 0/1/same-band) — `auroraDisplaySelection.test.js` + `NorthernLightsCard.test.jsx`.
6. Aurora map receives exact stable-filtered order + bands, uses Aurora labels/colors, never invokes generic forecast/scoring — `MapView.test.jsx` (`getForecastMock`/`scoreSiteDayMock` asserted never called in Aurora mode) + `NorthernLightsCard.test.jsx` (map-container content asserts `id:band` pairs in order).
7. Normal non-Aurora `MapView` behavior unchanged — `MapView.test.jsx`'s dedicated "normal (weather) mode" describe block (a genuinely new baseline, since no `MapView` test existed before this ticket).
8. Ranking/map analytics fire exactly once only when actually shown; persisted expansion cannot fabricate events — `NorthernLightsCard.test.jsx`.
9. Existing unavailable/no-darkness/transport/contract-defect and Free non-disclosure branches unchanged — pre-existing tests re-verified green, unmodified in assertion intent.
10. Revised IS/EN copy resolves to real text; obsolete subtitle/heading language absent — `NorthernLightsCard.test.jsx` i18n-completeness block, explicitly asserting the old "not the main recommendation"/"ekki aðalráðleggingin" phrasing and the `nlAlternativesHeading` key are both gone.
11. Marker/list semantics don't rely on color alone; hidden content absent from the accessible DOM — band text is always rendered alongside color (`MapView.test.jsx` popup-text assertions); `NorthernLightsCard.test.jsx` asserts `queryByRole`/`queryByTestId` return `null` (DOM-absent), not merely visually hidden.

No existing test, lint rule, or coverage configuration was weakened.

## 7. Tests, lint, and build actually run

- **New pure-helper tests** — `npx vitest run src/lib/auroraDisplaySelection.test.js src/lib/auroraBandPresentation.test.js` → part of the combined run below.
- **`NorthernLightsCard.test.jsx` + `NorthernLightsMap.test.jsx` + `MapView.test.jsx`** — `npx vitest run src/lib/auroraDisplaySelection.test.js src/lib/auroraBandPresentation.test.js src/components/NorthernLightsCard.test.jsx src/components/NorthernLightsMap.test.jsx src/MapView.test.jsx` → **60/60 passed**, 5 files. Two genuine test-authoring bugs were caught and fixed on the first real run: (a) a `getByText` call against text split across sibling DOM nodes (needed a container-`textContent` check instead), and (b) a test that reused the SAME `(evening, locationIds)` request identity for two renders in one test without clearing the module-level reuse cache, so the second render silently replayed the first's cached (wrong) fixture — fixed by calling `clearAuroraDecisionCache()` between the two renders.
- **Affected homepage/feature-gating/i18n tests** — `npx vitest run src/config src/components/HomeDecisionCard.test.jsx src/AppRoutes.test.jsx` → **72/72 passed** (none of these files were modified by this ticket; run to confirm no regression).
- **Full suite** — `npx vitest run` → **939/939 passed**, 82 files (up from 899/79 before this ticket — +40 tests, +3 files [`auroraDisplaySelection.test.js`, `auroraBandPresentation.test.js`, `MapView.test.jsx`]).
- **Lint** — `npm run lint` → exit 0, no output.
- **Build** — `npm run build` → succeeded. Same pre-existing unrelated "chunks larger than 500 kB" notice as every prior run this session.

No command was skipped or reported as passing without actually running.

## 8. Independently run validation vs. inspection (§10 requirement)

Everything in §7 was **independently run in this session** — real `vitest`/`eslint`/`vite build` invocations, real output captured above, not narrated from memory.

**Not independently run: a real-browser visual inspection at mobile/desktop widths, IS/EN, and light/dark.** This environment has no interactive browser and no live Neon-backed `/api/aurora-decision` deployment to hit for a deterministic qualifying/all-poor fixture (Playwright is configured in this repo for unrelated e2e specs, but standing up a mocked-network Playwright run for this one card was judged disproportionate new test infrastructure for a presentation-selection ticket, per §10's own documented-limitation allowance). The strongest verification actually performed instead:

- Every render-state (qualifying with 2–8 mixed-band entries, all-poor, stale+partial composed with each) is exercised through React Testing Library's real DOM, asserting element presence/absence (not just visibility), `aria-expanded`/`aria-controls`, and exact text content.
- Both IS and EN are exercised: the i18n-completeness tests read the real `northernLightsTranslations` dictionary directly (not a `t=(k)=>k` stub) for every new/changed key, in both languages, and assert real translated copy — not just presence of a key.
- Dark-mode classes were not independently re-verified live: the new `AllPoorResult` markup reuses the exact same `text-slate-700 dark:text-slate-200`-style Tailwind class pairs already used throughout the rest of this same file (unchanged elsewhere in this diff), so this is a static-consistency argument, not a claimed live-render verification — flagged honestly here rather than asserted as tested.

## 9. Deviations and residual risks

1. **`nlAlternativesHeading` was renamed to `nlQualifyingHeading`** rather than only having its value changed — a deliberate choice so the code itself (not just the copy) reflects "these are recommended places," reducing the chance of a future regression silently reintroducing "all locations checked" framing. Flagged since a rename is a slightly larger diff than a pure value edit.
2. **Free's all-poor state shows no upgrade CTA at all**, rather than a differently-worded one — the safest reading of "do not show an upgrade CTA... that implies Pro will reveal a good/better destination when none qualifies": since no CTA copy could honestly gesture at unrevealed value here, omitting the CTA entirely (rather than inventing hedged copy for it) was judged the more honest choice.
3. **`northern_lights_card_viewed`'s new `resultState` property** is `null` for non-result outcomes (unavailable/no-darkness/transport/contract-defect) and only `"qualifying"`/`"all_poor"` for success/partial — kept deliberately low-cardinality per §7's own instruction, not added merely for volume.
4. **No live-browser visual inspection was performed** (§8) — documented as a real, acknowledged limitation, not silently skipped.
5. No other risk identified: Ticket 1–3 contracts, candidate roster, request identity, tier independence, and normal (non-Aurora) `MapView` behavior are all unchanged and directly tested, not merely asserted.

## 10. Confirmation

`docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**
