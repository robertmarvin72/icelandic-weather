# #423 — Approved Phase 2 implementation prompt v4 — 2026-09-25

**Jonesy APPROVED Round 4 on 2026-09-25. This is the sole active execution prompt.** Phase 1 is PASS. Owner requested implementation-prompt preparation and explicitly approved: (1) near ties mean at most 5 points out of 100, presentation only; (2) ship the three-night view on the existing English landing page first, preserve homepage tonight behavior, provide EN/IS translation keys. Execute this approved-prompt-v4.md only when CURRENT is READY_FOR_CC. Never execute v1/v2/v3 again.

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/423

### 1. Scope and audited implementation choice

Implement issue Phases 2–5 using **Shape A**, three existing single-evening API requests, the same six configured candidates for both tiers, canonical server scoring unchanged. Existing parser/storage/date-aware orchestrator already support each evening. Up to eighteen Open-Meteo requests on a cold complete three-night load is an accepted cost of this proposed scope, not six; existing five-minute per-key promise reuse remains. No backend batching, new endpoint, provider, library, SQL, cron or forecast-input changes. Do not refetch merely because a user switches tabs. Do not copy the scorer into the browser.

Preflight evidence re-read by Ripley: useAuroraDecision.js, auroraDecisionCache.js, auroraDecisionClassify.js, auroraDisplaySelection.js, NorthernLightsCard.jsx, NorthernLightsLanding.jsx, auroraSeason.js, auroraVisualState.js; issue fetched with gh issue view 423. The actual translation file is src/i18n/translations.northernLights.js (earlier audit suggestions of translations.common.js are not the current owner of these strings). Existing hook rejects obsolete completions but returns old outcome/status until its effect runs after a key change; this requires identity-safe presentation for date rollover, not an assumption that keyRef alone solves it.

Read AGENTS.md, CLAUDE.md, docs/ai/README.md, CURRENT.md, accepted data-audit.md and Ripley's final Phase 1 assessment before implementation. Confirm current source still matches these data-flow assumptions before writing. If it would require backend/entitlement/scoring changes, stop and report the specific conflict instead of broadening scope.

### 2. Reachability and UI composition

Existing entrypoint: /en/northern-lights in AppRoutes.jsx. The page remains forced-English regardless of saved language; no new route or homepage expansion. Add compact three-night controls to its current Northern Lights module. Preserve the default homepage card's one-night request and presentation, existing seasonal visibility, dark card design and upgrade wiring. Outside the existing current-date Aurora season, no Aurora request is made and the existing off-season landing state remains. When currently in season, the three requested evenings may cross a month/year/season boundary; evaluate their real API outcomes rather than inventing darkness from the month.

Prefer a small landing-only controller/view with reusable existing selected-night rendering. Do not mount three full NorthernLightsCards (three maps and duplicate effects), and do not mount an extra fetch-owning selected card that repeats the controller's requests. Refactor the shared card narrowly into data-owning wrappers and reusable presentation if needed; preserve homepage defaults and callbacks. One set of ranked results and at most one map instance are rendered for the selected night. Keep React hooks unconditional; three fixed hook calls are allowed, hooks inside a loop are not.

The selector contains tonight, tomorrow night, and localized weekday/date for day 2. All three slots remain selectable, including pending/unavailable, so their reason/retry can be reached. Default to tonight; async completion never changes a user's selection to the best night. Use real buttons with aria-pressed and visible keyboard focus (or a complete accessible tabs implementation). Selected heading, overall band, reasons, best location, ranking, map and timestamp must all reflect the same selected evening. A summary CTA may select a unique recommended night and open its existing details; its label must name that night. Do not introduce a second paywall or three large cards.

### 3. Date-aware client model and request identity

Build three consecutive UTC evening dates from one captured clock reading: today + 0/1/2 calendar days, using existing todayEveningUtc conventions. Model each slot as its date, request identity, loading/resolved state, canonical classification/body and retry action. This is an adapter over existing responses, not the illustrative TypeScript issue model; do not fabricate auroraActivity, updatedAt, score or viewingWindow fields absent from the response. The server already selects each night's own XML activity, darkness and weather window by evening.

Reuse the six AURORA_CANDIDATE_LOCATION_IDS and existing cache key normalization/TTL. Entitlement must never affect dates, candidates, requests or aggregation. Inactive homepage extra slots must cause zero extra requests. A selected slot's loading/error state must never display another slot's prior success. An outcome is usable only when bound to its exact current request identity; fix the shared hook's returned identity if necessary with targeted regressions, or isolate controller instances by the full three-date/candidate identity. Match success bodies to requested evening as an additional guard. Old completion after rollover/unmount/retry must not replace newer results; cover same-key retry ordering if hook changes touch it.

Handle UTC day rollover while the page stays open: recompute on a bounded next-midnight timer and on tab visibility return, with cleanup and injectable clock for tests. Preserve a selected calendar date if still in the new window, otherwise reset to tonight. No periodic forecast polling; use existing caching and explicit retry. A retry invalidates only the intended key; while it loads, final comparison is pending. No automatic refresh loop attempting to force equal snapshot timestamps.

### 4. Pure cross-night presentation policy

Create a small pure helper consuming canonical classified responses and configured IDs. It never changes scores, canonical bands, within-night ordering, weather input or server verdicts. Each night's comparison value is its canonical best.score/band. Validate usable finite score/known band/date before comparing; missing/malformed data cannot win. Use raw best + alternatives for completeness (not the Pro-gated qualifying display list), requiring exactly the complete expected ID set with no excluded candidates for every compared night.

Apply this precedence explicitly:

1. Any requested slot pending: per-night results remain usable but final comparison says pending. No winner or final all-three-poor event/copy.
2. All resolved, zero usable scored nights: own unavailable/no-darkness/error states; never low chance.
3. Exactly one usable scored night: its outlook only, explicitly the only available result, no cross-night winner.
4. Two or more usable nights: require equal non-null valid auroraCache.sourceFetchedAt AND complete configured candidate sets in every usable night. If either fails, visibly say a reliable best-night comparison is unavailable; retain each night's own result. Do not silently drop an incomplete scored night to manufacture a winner among the others.
5. Eligible comparison: unavailable nights remain unknown. With only two usable nights, label conclusions as among available nights. Stale-but-usable results retain current stale policy and visible disclosure. Matching Aurora retrieval timestamps do not prove matching weather-model issuance.
6. If all three nights are eligible and very-poor, the issue's all-three low-chance copy is allowed. Also handle the distinct case where all eligible nights are poor/very-poor with no fair/good/excellent: show no favorable conditions among available nights, never promote the least bad night as a recommendation. Only claim all three when all three are usable and eligible. This presentation rule reuses existing non-qualifying bands; no thresholds change.
7. Otherwise, the top-score group contains every eligible night whose score is within **5 points inclusive of the maximum**. Compare against maximum, not transitive pairwise chaining. Two or more in this group -> similar conditions, list their dates without a unique winner; 0 difference is an exact tie. A sole top night -> best conditions expected on its date, qualified to available nights when needed. Never claim guaranteed visibility. Canonical bands stay unchanged even when a near tie crosses a band boundary. If a near-tie group includes a non-qualifying night, neutral similarity wording must not describe that night as favorable.

The accepted audit's nine examples remain acceptance cases; clarify that all-three means literally all three requested slots and pending always wins over any final subset conclusion.

### 5. Selected-night display, Free/Pro and freshness

Free sees all three coarse canonical outlooks and comparison summary. Pro gets the existing selected-night detail presentation. Preserve isFeatureAvailable/features.js and selectAuroraDisplay's existing limits: only fair/good/excellent qualify, cap six, map only with at least two qualifying locations and two distinct canonical bands. Poor-state Pro details remain the existing clearly labeled best-of-poor treatment; no new poor rankings/map. Free must not leak location names, coordinates, ranked items, detailed reasons or map data through DOM, attributes, accessibility labels or hidden content. No entitlement/payment/checkout attribution changes.

Audit every reused visible string for tonight references: title, subtitle, headline/body, best-location label, no-darkness copy, CTA and any map labels. Future-night selections must read the correct date or date-neutral wording. Add EN and IS keys in translations.northernLights.js; do not globally replace tonight copy used by the homepage. Preserve excellent pill styling from #414.

Show the actual Aurora sourceFetchedAt for each resolved night's data, labeled as Aurora data update time (not weather issuance). Never use fetch completion/Date.now as source update time. Unavailable timestamp stays absent or clearly unknown. Show existing stale treatment on usable stale results; avoid presenting expired cached classification as fresh merely because the browser stayed open. Do not alter server freshness thresholds; make freshness presentation truthful on subsequent render/visibility return using existing policy or invalidate/reload expired local presentation without new polling. If this cannot be achieved within the existing contract, report the exact limitation rather than inventing a timestamp.

### 6. Analytics

Use trackEvent only. Keep existing event names, click forwarding and homepage behavior. Existing selected-detail exposure events must correspond to the selected visible content, never background-loaded other nights. New events are landing multi-night only:

- northern_lights_night_selected: once on deliberate selection of a different date (including summary CTA selection), not initial/default/rollover selection or repeat click. Params selected_date, days_ahead (0/1/2), forecast_status (canonical classification.primary, or loading for pending), user_tier (free/pro).
- northern_lights_best_night_viewed: only when a unique eligible favorable best-night statement is actually displayed. No event for pending, tie/similar, unavailable, sole-available or no-favorable state. selected_date identifies the recommended date, not an unrelated selected tab. Deduplicate by displayed recommendation identity (date, comparison tone, available-date set) during this mounted view; no duplicate on rerender, individual fetch completion, tier resolution or tab switching. Do not use raw snapshot timestamp alone to generate another view event.
- northern_lights_multi_day_upgrade_clicked: once per actual existing upgrade click inside this multi-night module, with the selected slot's date/status and real tier. Preserve existing upgrade events and source callback; those are separate semantic events. Do not attach this event to unrelated page CTAs outside the module.

Resolve entitlement loading truthfully before new viewed events; do not record a premature free guess while useMe is loading. Keep metadata bounded and free of PII. Tests must distinguish recommendation date from selected date where relevant.

### 7. Verification and deliverables

Add meaningful tests for new behavior; do not rewrite working scorer/parser tests merely to mirror unchanged implementation. Reuse existing fixtures following the actual hook response contract. Required checks:

- Three distinct dates and POST evening payloads, identical Free/Pro requests, correct each-night canonical score/window association, no fourth selection fetch, cache/StrictMode reuse. December 31 rollover and midnight/visibility reset, delayed old responses, error/retry, season disabled -> zero requests, homepage -> one night only.
- All nine accepted audit table examples plus two usable/one unavailable, invalid/missing timestamp, duplicate/missing candidate IDs, timestamp refresh boundary, no-favorable poor + very-poor combination, score gaps 0/5/>5, near-tie across canonical bands, non-transitive grouping, sole available night and pending overriding every final result.
- Real component integration: selecting dates changes headline, reasons, rank list and map props atomically; at most one map; visibility constraints unchanged; unavailable selection never retains prior map; Free DOM contains no detailed location data; forced EN with saved IS; both new translation dictionaries populated; default homepage unchanged.
- New analytics exact payloads/counts, no mount selection event, no false winner events, rerender/StrictMode/completion dedupe, selected-vs-recommended date distinction, actual upgrade callback/source preservation.
- Run targeted Aurora suites (existing Phase 1 baseline was 23 files /256 tests; report actual new totals), including any new suites. Run npm run build and lint changed JS/JSX files. Run broader existing checks only if dependencies/refactoring justify it; document pre-existing failures separately.
- Browser verification with deterministic API stubs and real components on /en/northern-lights: 375px mobile and desktop, Free and Pro, three distinct dates, keyboard selection, overflow, map synchronization, loading/unavailable/stale/tie. Inspect the browser result; capture useful screenshots. Never claim a browser check from unit tests. No live provider/DB/cron needed for fixture validation; record live-provider validation as unverified if not run.

Keep changes limited to Aurora frontend components/helpers/hooks, existing translations, targeted tests and this task's docs. Tests may exercise existing server/date code without modifying production backend. No new libraries/TypeScript/import extensions. No unrelated refactors. Update outdated comments about landing/default behavior when changing that behavior. Report exact changed files, tests/commands, request cost, browser evidence and remaining limits.

### 8. Workflow and STOP conditions

Only execute after Jonesy APPROVED and CURRENT references approved-prompt-v4.md at READY_FOR_CC. Set CC_IN_PROGRESS first; append Phase 2 implementation report to cc-report.md preserving Phase 1 history; set CC_COMPLETE with report path. Jonesy appends Phase 2 result review to result-review.md. No commit, push, deployment or GitHub closure.

STOP if implementation requires changing canonical scoring/bands/thresholds (the owner-approved 5-point comparison-only tolerance is explicitly allowed), backend contract/parser/storage/provider/cron, shared weather inputs, candidates, entitlement/pricing/checkout, a new language route/homepage expansion, or scope beyond these frontend boundaries. State evidence and smallest proposed revision. Unverified production DB status alone is not an implementation blocker. Do not rerun the completed Phase 1 audit. No further owner approval gate for routine frontend implementation choices within this prompt after Jonesy's approval.

### Consolidated non-blocking review note: details disclosure

Make the landing disclosure policy explicit: preserve the user''s expanded/collapsed preference when switching nights, while rendering only the selected night''s current, identity-matched content. Pending/error/unavailable selections must show their own state and no prior ranking/map. Keep the homepage sessionStorage behavior unchanged. Cover switching with details already expanded in the selected-night integration test and state this choice in the implementation report. This resolves Jonesy''s non-blocking note within the approved reuse/identity-safety scope.
