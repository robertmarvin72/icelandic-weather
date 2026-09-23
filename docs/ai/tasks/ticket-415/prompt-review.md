# #415 — Clickable recommended destination

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/415
Title: Gera ráðlagðan betri stað smellanlegan

## Ripley — Read-only preflight (2026-09-23)

Stage: PROMPT_DRAFT. Not an implementation prompt and not ready for Jonesy approval until the destination contract below is resolved.

### Requested outcome

For a displayed move recommendation, make the recommended place name an accessible, visibly identifiable link to that place's page. Do not make the whole card clickable. Preserve plain text if destination URL/slug is missing. Emit recommendation_destination_clicked with destination_id, destination_name, recommendation_type and reason.

### Current implementation audit

- Checkout: bbfcac27 (#416); worktree clean at initial audit. #416's local workflow is CLOSED.
- Homepage uses HomeDecisionCard.jsx, not the standalone InstantComparison marketing component. Its candidate row currently renders best.site.name as a span.
- Canonical display tone is model.tone; raw move can be overridden to stay by comparisonState.direction. Any new interaction must use canonical tone, not raw verdict.
- Candidate identity is comparisonState.best.site. showCandidate requires a candidate and !model.locked; Free move/consider is locked. Preserve identity gating and all other CTAs. Never derive a replacement destination from top5[0].
- useComparisonState carries the candidate's original site object from siteList, with comparison primaryKey/improvements derived by existing classification. The new action must not re-score, change candidate selection or alter forecast/gating inputs.
- HomeDecisionCard has disableAnalytics for the research quiz; new analytics must respect it. Other events must remain unchanged.
- No dedicated campsite/detail route exists in AppRoutes.jsx. The shipped limited/full campsite JSON searches found no website/url/slug fields. /api/campsites returns those records directly and useCampsites preserves them. Building guessed links would either lead nowhere or leave every real destination as inert fallback text.
- Existing interaction precedent: Top5Leaderboard selects a site through onSelectSite; App's handleSelectSite sets siteId and scrolls to the map anchor. This is site selection within the current view, not a place-page URL. It must not be silently substituted for the requested link behavior.

### Owner decision requested

Asked whether the destination should (a) select the place and show its existing weather overview, (b) open the campsite's external website, or (c) introduce a dedicated place page. Recommended (a) as the smallest useful existing product path, but it changes the issue's explicit page-link contract and needs the owner's answer.

No implementation or guessed route/data addition is authorized by this draft. After the answer, specify the exact navigation/URL or selection semantics and missing-destination fallback before Jonesy review.

### Requirements to carry into the implementation prompt

- Canonical move only; preserve stay/consider behavior and locked Free state. Link/control applies to the place name only, with visible affordance, keyboard focus and Enter activation; no whole-card click handler.
- Destination ID/name and action must describe the same displayed comparisonState.best.site; no alternative candidate source or fabricated URL/slug.
- Proposed event semantics for review: recommendation_type = canonical move; reason = existing primaryKey (wind/rain/temp) or a documented null if unavailable, not localized prose or new classification. Exactly one event per intentional activation, no effect/rerender firing, disabled in research. Public campsite metadata only; no user coordinates or identifiers.
- Targeted tests for raw-move/canonical-stay override, locked Free, valid destination, absent/malformed destination, click and Enter, unrelated CTAs, reason metadata, and disableAnalytics. Verify IS/EN and mobile/desktop light/dark with real navigation/selection evidence once the contract is settled.
- Read-only data-flow audit before edits; STOP before changes to gating, scores, ranking, candidate selection, forecast data, backend or checkout. No new libraries, TypeScript, commit/push/deploy, or issue closure.

No final execution scope has been approved; complete the draft after the owner's destination decision.

## Ripley — Initial implementation prompt, Round 1 (2026-09-23)

**Status: ready for Jonesy review. Not execution authorization.** This section supersedes the preflight's assumed HomeDecisionCard target and unresolved page-link question. Preserve that preflight as history only.

### Owner clarification and authoritative scope

The owner supplied a screenshot of the expanded WeatherFinder panel ("Skoða staði eftir veðurskilyrðum", calmest/warmest/driest tabs) and explicitly said selecting its recommended places must behave exactly like selecting a place in the top list. Thus the target is WeatherFinder/WeatherFinderCard, and the destination action is existing site selection plus map scrolling, not a new place page or external URL. This explicit clarification supersedes the original issue's move-only/page-URL framing. No change to HomeDecisionCard is requested.

### Confirmed current implementation

- WeatherFinder.jsx derives sites from existing siteList/scoresById, ranks them via weatherFinderRanking, and renders WeatherFinderCard for visibleResults. It has no onSelectSite prop today.
- WeatherFinderCard.jsx renders rank, site name and metric as noninteractive divs; the screenshot matches this layout and its controls.
- Top5Leaderboard calls onSelectSite(item.site.id). App passes handleSelectSite, which calls setSiteId(id) and mapAnchorRef.current?.scrollIntoView({behavior:"smooth", block:"start"}). Reuse this exact callback for equivalent product behavior; do not duplicate its logic or introduce different navigation.
- WeatherFinder's existing Free limit, Pro controls, effectiveDays/effectiveRadius, showAll and ranking computations are independent presentation/ranking behavior to preserve. New selection must only activate already-visible eligible results; it must not reveal additional locked results or fetch a full campsite list.

### Implementation requirements

1. Read repository instructions, current App/WeatherFinder/WeatherFinderCard/Top5Leaderboard, feature limits, ranking helpers and existing tests before editing. Confirm the above data flow read-only. Follow the normal approved-prompt workflow transitions once an approved execution file exists.
2. Pass onSelectSite={handleSelectSite} from App into WeatherFinder, then provide a result-selection callback to WeatherFinderCard. Activate the exact displayed result.id. Reuse the existing App callback unchanged; selection, persistence and map scrolling must match the top list.
3. Make the place NAME a real type=button control (this is an in-page action, not navigation to a URL). Give it visible interactive styling/arrow, hover and visible keyboard focus, accessible name containing the place name, and native Enter/Space activation. Keep the row/panel itself noninteractive so metrics, filters, expand/collapse and upsell remain independent. Preserve compact row layout, rank and metric alignment, mobile truncation and theme styles. Any new labels belong in both real translation dictionaries; decorative arrows must be hidden from accessibility names when appropriate.
4. If result.id is missing/empty or the selection callback is unavailable, retain ordinary name text with no misleading control and no click event. Do not require a URL/slug: the owner's chosen interaction uses the existing ID-based selector. Do not invent destinations, map URLs or a new route. In the normal App path ranked IDs originate from siteList.
5. All currently visible results must work in calmest/warmest/driest, for Free and Pro, and after showing the full ranking. No new entitlement check beyond existing result visibility. Do not alter scoring, ordering, radius/day parameters, counts or candidate sources.

### Analytics contract proposed for Jonesy review

Retain the requested event name recommendation_destination_clicked, but describe the actual WeatherFinder action honestly:
- destination_id: selected result.id;
- destination_name: selected result.name;
- recommendation_type: fixed `weather_finder` (this list has no canonical stay/move verdict);
- reason: current mode, one of `calmest`, `warmest`, `driest`.

Fire once per genuine activation before invoking onSelectSite, using trackEvent. Repeated intentional activations each count once. No event on rendering, reranking, filter changes, disclosure/expansion or fallback text. Do not emit weekly_ranking_site_clicked for this different surface, and do not modify existing analytics. Existing campsite_selected emitted by App remains normal behavior, not a duplicate of this action event. Document these bounded semantics briefly. Do not claim this event proves a move recommendation was followed, an actual journey occurred or a booking was made. No user-location/PII or forecast arrays in metadata.

### Scope and STOP rules

Allowed: minimal App callback plumbing, WeatherFinder and WeatherFinderCard interaction, necessary bilingual labels, targeted tests and brief event documentation. No HomeDecisionCard/RoutePlanner recommendation changes, ranking/scoring/candidate or shared forecast modifications, feature-gate changes, new routes/backend/libraries, checkout/attribution changes or top-list redesign. If audit reveals wider changes are required, STOP and explain before implementation. Preserve unrelated work. No commit, push, deployment or issue closure.

### Acceptance and validation

- Component tests must render the REAL WeatherFinderCard when asserting interaction, not the existing analytics suite's inert card mock. Select a non-first row and assert its exact ID, exactly one callback and the exact event payload. Cover all three modes, repeated intentional activation and no event on unrelated controls/rerenders.
- Cover Free visible results and unchanged hidden-result limits; Pro full-ranking expansion must allow selecting a row beyond the initial ten. Confirm ranking/filter/day behavior stays unchanged.
- Missing/empty ID and absent callback render noninteractive text without events or errors. Existing upgrade and filter/disclosure actions still work independently.
- Integration test must prove App wires WeatherFinder to the same existing selection behavior as Top5Leaderboard: chosen site state updates and the map anchor receives the same scroll options. A standalone mocked callback assertion alone is insufficient for this requirement. Do not change handleSelectSite to make tests pass.
- Verify keyboard focus and Enter/Space using real-browser interaction or an existing suitable testing utility; a fireEvent.click alone does not prove keyboard behavior. Check IS/EN, mobile/desktop, light/dark, long names and metric alignment. Retain concise screenshots and interaction results; read hook contracts before API fixtures.
- Run new tests, existing WeatherFinder analytics/ranking and relevant App/Top5 regressions, lint, build and git diff --check; then the full test suite once. Report commands/results and pre-existing failures separately. Do not equate local event emission with production GA4 receipt.
- Write cc-report.md with changed files, owner scope clarification, event semantics, validation and evidence; update CURRENT.md to CC_COMPLETE after writing the report. Preserve prior task history.

### Jonesy handoff

Review against the owner's screenshot/clarification, not the superseded HomeDecisionCard interpretation. Check exact callback reuse, name-only accessible action, unchanged result gating/ranking and truthful analytics taxonomy. Return APPROVED or REVISE; do not implement. No destination question remains pending with the owner.


## Jonesy — Initial prompt review, Round 1 (2026-09-23)

**Verdict: APPROVED**, no notes required. Every factual claim in this prompt checked out exactly against live source — including several I specifically tried to poke holes in — and the scope correctly reflects the owner's screenshot clarification over the superseded HomeDecisionCard/page-link preflight.

### Audit verified line by line against live code

- **`WeatherFinder.jsx` has no `onSelectSite` prop today, confirmed exactly** — its full prop list is `{ siteList, scoresById, userLoc, entitlements, units, t, onUpgrade }`. The current homepage render call (`App.jsx` line 512) passes no `onSelectSite` either.
- **`WeatherFinderCard.jsx` renders the name as a noninteractive div, confirmed exactly** — `<div className="min-w-0 flex-1 truncate text-sm font-medium">{result.name}</div>`, no button, no click handler, no row-level interactivity at all (unlike Top5Leaderboard's row).
- **The exact reuse target, confirmed exactly.** `Top5Leaderboard.jsx` line 281: `onSelectSite(item.site.id)`. `App.jsx`'s `handleSelectSite`: `useCallback((id) => { setSiteId(id); mapAnchorRef.current?.scrollIntoView({behavior:"smooth", block:"start"}); }, [setSiteId])` — byte-for-byte what the prompt describes, and `mapAnchorRef`'s target div sits immediately below WeatherFinder in the page (line 524, right after WeatherFinder at 512) — the scroll target is spatially sensible for this new call site too.
- **`result.id` genuinely traces back to `siteList`, confirmed exactly.** `weatherFinderRanking.js`'s `buildResult(site, score, metrics)` sets `id: site.id`, and `WeatherFinder.jsx`'s own `sites` memo builds each entry as `{ id: site.id, ... }` directly from the `siteList` prop — so "in the normal App path ranked IDs originate from siteList" is literally true, not just presentationally true. No fabricated destination is possible through this path.
- **The two existing analytics events, confirmed distinct and correctly not to be touched.** `campsite_selected` (`App.jsx` line 312) fires from a `useEffect` watching `siteId`/`site` state — an automatic side effect of *any* selection source, not something `handleSelectSite` or this new action needs to emit itself; it will keep firing normally and is correctly identified as "not a duplicate." `weekly_ranking_site_clicked` (`Top5Leaderboard.jsx` line 276) is that component's own distinct event with a `{siteId, siteName, rank}` payload — confirming it's the right call to give WeatherFinder's action its own event name rather than reusing this one for a genuinely different surface.
- **`disableAnalytics`, confirmed correctly scoped out of this prompt.** Grepped the whole `src` tree: it's a prop specific to `HomeDecisionCard`/`DecisionQuizResearch.jsx` only. `WeatherFinder` is never rendered inside the research-quiz flow at all, so Round 1 correctly drops the preflight's now-inapplicable `disableAnalytics` requirement rather than carrying over a HomeDecisionCard-specific constraint that doesn't apply to this component.
- **The "inert mock" testing requirement, confirmed to be a real, necessary correction.** `WeatherFinder.analytics.test.jsx` does `vi.mock("./WeatherFinderCard", () => ({ default: ({result, rank}) => <div data-testid={\`card-${rank}\`}>{result.name}</div> }))` — a genuinely inert stub with no interactive elements. The prompt's insistence that new interaction tests render the real `WeatherFinderCard` (not this mock) is catching a real gap, not a hypothetical one.
- **Free/Pro result-set claims, confirmed exactly.** `resultsLimit = getFeatureLimit("weatherFinderResultsCount", entitlements) ?? 3`, `effectiveDays`/`effectiveRadius` gated on `isPro`, `showAll` toggles the full ranked list past `INITIAL_VISIBLE_COUNT` (10) — all real, independent presentation logic the prompt correctly says must stay untouched.

### Design read

Requirement 3's separation is the right call and internally consistent: reuse `handleSelectSite` as the *callback* (requirement 2), but deliberately do not reuse Top5Leaderboard's whole-row `<tr onClick>` *UI pattern* — the row/panel must stay noninteractive and only the name becomes a real `type="button"`. That's exactly what the original issue asked for ("do not make the whole card clickable") and the prompt states it explicitly enough that CC shouldn't be tempted to copy the row-click precedent wholesale along with the callback.

The analytics contract is honestly scoped to what this surface actually is — `recommendation_type: "weather_finder"` (fixed, since there's no canonical stay/move verdict here) and `reason` as the active mode, rather than forcing the original issue's move-recommendation taxonomy (primaryKey/canonical tone) onto a feature that has neither. Given the owner's explicit screenshot clarification superseded the original page-link framing, reusing the event *name* while being honest about materially different semantics in the payload is the right resolution, not scope creep.

No open product question remains, no STOP-boundary gap found, and the acceptance criteria (real-component tests, non-first-row selection, Free/Pro visibility boundaries, keyboard activation via real interaction rather than `fireEvent.click` alone, IS/EN + mobile/desktop + light/dark, unchanged ranking/App regressions) are thorough and consistent with this workflow's established bar.

Ready for CC once approved.
