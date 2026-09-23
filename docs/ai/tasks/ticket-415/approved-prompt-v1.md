# #415 — Approved execution prompt v1

Issue: https://github.com/robertmarvin72/icelandic-weather/issues/415

Jonesy APPROVED Round 1 on 2026-09-23, without notes. Consolidated by Ripley from the owner-clarified WeatherFinder scope. This is the sole execution prompt; the superseded HomeDecisionCard/page-link preflight in prompt-review.md is not execution scope.

## Required workflow

Read repository instructions, docs/ai/README.md and CURRENT.md. Verify stage READY_FOR_CC references this file and set CC_IN_PROGRESS before implementation. After implementation and validation, write docs/ai/tasks/ticket-415/cc-report.md, populate its path in CURRENT.md and set CC_COMPLETE. Preserve all review history and unrelated work. No commit, push, deployment or issue closure.
### Owner clarification and authoritative scope

The owner supplied a screenshot of the expanded WeatherFinder panel ("Skoða staði eftir veðurskilyrðum", calmest/warmest/driest tabs) and explicitly said selecting its recommended places must behave exactly like selecting a place in the top list. Thus the target is WeatherFinder/WeatherFinderCard, and the destination action is existing site selection plus map scrolling, not a new place page or external URL. This explicit clarification supersedes the original issue's move-only/page-URL framing. No change to HomeDecisionCard is requested.

### Confirmed current implementation

- WeatherFinder.jsx derives sites from existing siteList/scoresById, ranks them via weatherFinderRanking, and renders WeatherFinderCard for visibleResults. It has no onSelectSite prop today.
- WeatherFinderCard.jsx renders rank, site name and metric as noninteractive divs; the screenshot matches this layout and its controls.
- Top5Leaderboard calls onSelectSite(item.site.id). App passes handleSelectSite, which calls setSiteId(id) and mapAnchorRef.current?.scrollIntoView({behavior:"smooth", block:"start"}). Reuse this exact callback for equivalent product behavior; do not duplicate its logic or introduce different navigation.
- WeatherFinder's existing Free limit, Pro controls, effectiveDays/effectiveRadius, showAll and ranking computations are independent presentation/ranking behavior to preserve. New selection must only activate already-visible eligible results; it must not reveal additional locked results or fetch a full campsite list.

### Implementation requirements

1. Read repository instructions, current App/WeatherFinder/WeatherFinderCard/Top5Leaderboard, feature limits, ranking helpers and existing tests before editing. Confirm the above data flow read-only. Follow the required execution transitions below.
2. Pass onSelectSite={handleSelectSite} from App into WeatherFinder, then provide a result-selection callback to WeatherFinderCard. Activate the exact displayed result.id. Reuse the existing App callback unchanged; selection, persistence and map scrolling must match the top list.
3. Make the place NAME a real type=button control (this is an in-page action, not navigation to a URL). Give it visible interactive styling/arrow, hover and visible keyboard focus, accessible name containing the place name, and native Enter/Space activation. Keep the row/panel itself noninteractive so metrics, filters, expand/collapse and upsell remain independent. Preserve compact row layout, rank and metric alignment, mobile truncation and theme styles. Any new labels belong in both real translation dictionaries; decorative arrows must be hidden from accessibility names when appropriate.
4. If result.id is missing/empty or the selection callback is unavailable, retain ordinary name text with no misleading control and no click event. Do not require a URL/slug: the owner's chosen interaction uses the existing ID-based selector. Do not invent destinations, map URLs or a new route. In the normal App path ranked IDs originate from siteList.
5. All currently visible results must work in calmest/warmest/driest, for Free and Pro, and after showing the full ranking. No new entitlement check beyond existing result visibility. Do not alter scoring, ordering, radius/day parameters, counts or candidate sources.

### Approved analytics contract

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
