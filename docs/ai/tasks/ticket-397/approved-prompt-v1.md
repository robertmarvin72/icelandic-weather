# Approved Prompt v1 — Ticket 397

Implement GitHub issue #397, **UX: Bæta framsetningu norðurljósaspár þegar engir góðir staðir finnast**, as a focused correction to the existing Northern Lights homepage card from Ticket 392.

The outcome must stop presenting a fixed six-place checklist when canonical Aurora conditions are poor, make the no-useful-place state honest and useful, remove the awkward secondary-copy framing, and ensure every Aurora label/color/map marker describes the same Aurora dimension. Keep Ticket 1–3 data, scoring, ranking, request, and tier-independence unchanged.

### 1. Mandatory preflight audit

Before editing, read the issue and inspect at minimum:

- `docs/ai/tasks/ticket-391/approved-prompt-v1.md`, `cc-report.md`, and `result-review.md`;
- `docs/ai/tasks/ticket-392/approved-prompt-v1.md`, `cc-report.md`, and `result-review.md`, including the owner-approved bounded six-ID disclosure exception;
- `src/components/NorthernLightsCard.jsx` and its tests;
- `src/components/NorthernLightsMap.jsx` and its tests;
- `src/MapView.jsx`, `LazyMap.jsx`, forecast/scoring imports it uses, and relevant map tests;
- `src/lib/auroraScoring.js`, `auroraDecisionClassify.js`, `api/_lib/auroraDecision/rankDecision.js`, and the real Ticket 3 response shape;
- `src/i18n/translations.northernLights.js`, analytics helpers/conventions, and feature gating.

Record the audited current behavior and exact changed files in `cc-report.md`.

Known audit finding to verify, not assume silently: `NorthernLightsMap` currently passes Aurora-ranked locations into the generic `MapView`, but that map independently fetches forecast data and assigns `Good/Fair/Rough` from the generic seven-day campsite weather score. That is a different dimension from the canonical Aurora `excellent/good/fair/poor/very-poor` band and is the source of the Höfn contradiction described in the issue.

### 2. Canonical data and scope boundaries

This is a presentation-selection and labeling change only:

- Do not change Aurora cache/cron, `scoreAuroraVisibility`, band thresholds, reasons, flags, Ticket 3 endpoint/ranking, candidate roster, request body, cache identity, or Free/Pro computation.
- Continue consuming the canonical response as `best`, then `alternatives`; never re-score, re-rank, mutate, or reinterpret raw weather data in React.
- Derive display eligibility only from each canonical result's existing `band`.
- The acceptable/recommendable display bands for this ticket are `excellent`, `good`, and `fair`, matching the issue's “góðir eða sæmilegir” requirement. `poor` and `very-poor` are non-qualifying.
- Preserve canonical server order by stable filtering only. Show at most six qualifying entries. Do not backfill the list with poor entries merely to reach six.
- Keep the fixed six-candidate roster and Ticket 392's narrow owner-approved ID disclosure exception exactly bounded as-is. Do not expand it or expose Pro names, coordinates, scores, reasons, ranking, or map data to Free.

If satisfying the issue requires changing canonical scoring/bands, the server ranking contract, candidate discovery/roster, Free/Pro request inputs, or backend code, **STOP before implementation** and report the exact conflict.

### 3. Pure, testable presentation model

Put the display decision behind a small pure helper or similarly narrow testable boundary; do not scatter band checks through JSX. Given Ticket 3's already ordered `best + alternatives`, it must derive:

- `qualifyingLocations`: canonical-order entries whose band is `excellent`, `good`, or `fair`, capped at six;
- `hasQualifyingLocations`;
- `bestAvailable`: the canonical `best`, used only for the explicitly poor fallback where tier disclosure permits it;
- whether the ranking/list is actually rendered;
- whether an Aurora map provides a meaningful comparison under the deterministic rule below.

Do not turn the all-poor condition into `domain_unavailable`, `no_darkness`, a transport error, or a new API outcome. It is a usable `success`/`partial` result with poor conditions. Freshness and partial/exclusion disclosures must continue composing with it unchanged.

### 4. Honest result states

#### A. One or more qualifying locations

- Keep the canonical best summary.
- In expanded Pro details, show only `qualifyingLocations`, in exact canonical order, up to six.
- Use a heading/copy that describes actual recommended or worthwhile places, not “all locations checked.”
- Never show poor/very-poor entries in this recommendation list.
- Continue showing stale, partial, exclusion, high-wind, reasons, and national-window caveats where applicable and truthful.

#### B. No qualifying locations

- Show a clear localized result that no good or fair Aurora-viewing place was found among the checked places tonight.
- Explain concisely that cloud or other conditions are poor and suggest checking again later; do not imply missing data, danger, or a guaranteed future improvement.
- Hide the six-place ranking/list completely.
- Hide the map completely.
- Pro may show **at most one** canonical `bestAvailable` location, clearly labeled as the best of the checked poor options and still poor—not as a recommendation or “better place.” Its canonical band and concise canonical reasons may be shown under the existing details disclosure.
- Free must retain coarse band/condition guidance without location identity or other Pro data. Do not show an upgrade CTA or copy that implies Pro will reveal a good/better destination when none qualifies.
- A persisted expanded-details preference must not cause hidden list/map content or related analytics to appear/fire in this state.

The no-qualifying state is separate from existing unavailable, no-darkness, contract-defect, transport, stale, and partial branches. Do not regress those semantics or retries.

### 5. Subtitle and product tone

Replace the awkward subtitle (“Fljótleg, aukaleg athugun — ekki aðalráðleggingin hér að ofan.” and its English equivalent) with concise, natural IS/EN copy that explains the feature directly. Suggested intent:

- IS title/subtitle: “Norðurljós í kvöld” / “Við berum saman skýjahulu og norðurljósaskilyrði á nokkrum stöðum.”
- EN must express the same meaning naturally, not translate mechanically.

Use practical, calm language. Do not describe the score as probability, guarantee, or sighting percentage. Do not use generic campsite-weather wording for Aurora conditions. Add/update genuine translation keys only in the established i18n file; no hardcoded user-facing strings or untranslated-key fallbacks.

### 6. Aurora-consistent map

When a map is rendered, it must visualize the canonical Aurora result—not independently calculated generic camping weather:

- Pass the same qualifying canonical entries and their existing Aurora bands to the map in the same order.
- Marker color, popup condition text, legend, and selected/best marker must all use the canonical Aurora band carried by the Ticket 3 result.
- Label the dimension explicitly as Aurora-viewing conditions in both IS and EN.
- Do not fetch or score a second generic seven-day forecast for the Northern Lights map path.
- Do not let a place display `poor` in the card and generic `Fair/Sæmilegt` in its Aurora map popup.
- Preserve the normal `MapView` behavior everywhere outside this explicit Aurora mode. Prefer a minimal explicit externally supplied presentation mode/adapter over copying scoring or changing global map semantics. Keep lazy loading, accessible list-first behavior, selection, and no-new-library constraints.

The map is useful only when there are at least **two** qualifying locations and at least **two distinct canonical Aurora bands** among the shown locations. Otherwise hide it. This conservative rule uses existing canonical categories and introduces no new numeric/scoring threshold. The accessible list remains primary whenever qualifying locations exist.

If the existing map cannot accept canonical Aurora marker presentation without broad generic-map regressions, duplicated Leaflet architecture, a new dependency, or any re-scoring, **STOP before implementation** and report the smallest safe design boundary needed.

### 7. Analytics truthfulness

Preserve existing event names and exact-once identity behavior, but align firing with actual rendered exposure:

- `northern_lights_ranking_viewed` fires only when a qualifying ranking/list is actually displayed to Pro.
- `northern_lights_map_viewed` fires only when the Aurora map is actually rendered/displayed, never merely because details are expanded.
- The all-poor state, a single qualifying entry, or same-band entries must not emit a map-view event when the map is hidden.
- Free never emits ranking/map viewed events.
- Do not add PII, coordinates, names, raw provider payloads, or location history to analytics.

If adding a dedicated coarse result-state property to the existing card-view event materially improves observability, keep it low-cardinality (`qualifying` / `all_poor`) and test exact-once behavior. Do not add an event merely for volume.

### 8. Accessibility, responsive behavior, and visual semantics

- Do not rely on color alone: every band/marker state needs visible text or an accessible equivalent.
- Preserve semantic headings, ordered list behavior, keyboard operation, visible focus, live-region behavior, and locked-content isolation.
- Ensure the all-poor message and optional Pro best-available detail read in the correct order to assistive technology.
- Verify small mobile through desktop, light/dark themes, and that hidden list/map elements are absent from the DOM rather than only visually concealed.
- Keep the card secondary to `HomeDecisionCard`; do not redesign or reorder the homepage.

### 9. Required targeted tests

Add focused tests using real Ticket 3-shaped fixtures for at least:

1. Mixed canonical bands filter stably to only excellent/good/fair, preserve order, and cap at six without backfill.
2. All `poor`/`very-poor` produces the dedicated no-qualifying state, no six-place list, and no map.
3. Pro all-poor shows at most canonical `best` as clearly poor; Free all-poor leaks no identity/score/reasons/coordinates and has no misleading upgrade CTA.
4. Partial + stale composes with both qualifying and all-poor presentation states.
5. Map visibility: shown for at least two qualifying entries with distinct canonical bands; hidden for zero, one, and same-band-only qualifying entries.
6. Aurora map receives exact stable-filtered order plus canonical bands, uses Aurora labels/colors, and does not invoke generic forecast/scoring work.
7. Normal non-Aurora `MapView` behavior remains unchanged.
8. Ranking/map analytics fire exactly once only when their corresponding surfaces are actually shown; persisted expansion cannot create false events.
9. Existing unavailable/no-darkness/transport/contract-defect and Free non-disclosure branches remain unchanged.
10. Revised IS and EN copy resolves to real text; obsolete subtitle/list language is absent.
11. Marker/list semantics do not rely on color alone, and hidden content is absent from the accessible DOM.

Do not weaken existing tests, lint rules, coverage, or assertions to make the change pass.

### 10. Validation and report

Run and record exact commands/outcomes for:

- the new pure presentation-helper tests;
- `src/components/NorthernLightsCard.test.jsx` and `src/components/NorthernLightsMap.test.jsx`;
- affected `MapView` tests and directly related Aurora/Ticket 3 tests;
- affected homepage, feature-gating, analytics, and i18n tests;
- the full Vitest suite;
- `npm run lint`;
- `npm run build`.

Inspect the rendered card at representative mobile and desktop widths in both IS/EN and light/dark for (a) mixed qualifying results and (b) all-poor results. If deterministic browser fixtures are not already available and adding them would require production-only hooks or broad test infrastructure, document the limitation and perform the strongest component/render verification available without weakening the scope.

The `cc-report.md` must distinguish independently run validation from inspection, list changed files, explain the map dimension correction, and record any deviation or residual risk.

### 11. Acceptance criteria

- The UI no longer automatically displays six checked places.
- Only canonical `excellent`/`good`/`fair` entries appear in the recommendation list, in server order, up to six.
- When all scored places are poor/very-poor, the user gets a clear honest no-good-place result; the six-place list and map are absent.
- At most one Pro-only canonical best-of-poor option may appear, and it is never phrased or styled as a good recommendation.
- Free all-poor guidance remains useful and does not tease a nonexistent better destination or leak Pro data.
- The subtitle is natural and directly explains the feature in both IS and EN.
- Any displayed Aurora map uses the same canonical bands/order as the card and never generic seven-day campsite-weather labels or scoring.
- The Höfn-style contradiction cannot occur within the Aurora surface.
- Map visibility follows the explicit meaningful-comparison rule; analytics reflect actual surface exposure.
- Ticket 1–3, candidate roster, scoring thresholds, ranking, request identity, tier independence, gating, and unrelated map behavior are unchanged.
- Accessibility, responsive layouts, translations, targeted/relevant/full tests, lint, and production build pass.

### 12. Out of scope and STOP conditions

Out of scope: Aurora provider/cache/cron changes, Ticket 2 scoring or band changes, Ticket 3 API/ranking changes, candidate expansion/discovery, new backend/API, general campsite score changes, canonical homepage stay/move decision changes, checkout/payment changes, notifications, future-night planning, light-pollution modeling, new dependencies, TypeScript/`.tsx`, commit, or push.

STOP and report before implementation if:

- any canonical scorer/band/ranking/API/candidate behavior must change;
- Free and Pro would receive different computation or request inputs;
- the all-poor state cannot be derived solely from canonical bands;
- the map correction requires broad generic-map behavior changes, duplicated scoring/Leaflet architecture, or a new dependency;
- existing response fields cannot support truthful copy without guessing;
- work reaches checkout/payment, backend, or another ticket's unresolved architecture.

Default git safety applies: do not commit and do not push.

