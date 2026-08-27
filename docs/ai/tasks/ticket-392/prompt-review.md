# Prompt Review — Ticket 392 (Northern Lights MVP UX/UI + paywall)

## Round 1 — Ripley initial prompt

Implement GitHub issue #392, **Ticket 4 — Northern Lights MVP UX/UI + paywall**, as a seasonal supporting surface on the homepage. Consume the canonical, tier-independent Ticket 3 response unchanged; do not add or duplicate Aurora scoring/ranking logic in React.

### 1. Mandatory preflight audit before writing code

Read the issue and inspect the current implementation/data flow before editing, including at minimum:

- `docs/ai/tasks/ticket-391/approved-prompt-v1.md`, `cc-report.md`, and `result-review.md`;
- `api/aurora-decision.js` and all directly used modules in `api/_lib/auroraDecision/`, especially request validation, orchestration, ranking, freshness, location resolution, and tests;
- `src/App.jsx`, `src/hooks/useCampsites.js`, `src/hooks/useMe.js`, and the current homepage ordering;
- `src/components/HomeDecisionCard.jsx`, `RoutePlannerCard.jsx`, `LazyMap.jsx`, and `MapView.jsx` plus relevant tests;
- `src/config/features.js`, `src/components/RequireFeature.jsx`, `src/hooks/useCheckoutFlow.js`, `src/lib/checkoutSource.js`, `src/lib/analytics.js`, and pricing/upgrade-source tests;
- the current translation composition in `src/i18n/` and the testing conventions used by comparable homepage cards/hooks.

Document the audited Ticket 3 response shapes and the chosen request/candidate-selection path in `cc-report.md` before describing implementation results.

This preflight is mandatory because `/api/campsites` is tier-filtered while `/api/aurora-decision` accepts an explicit bounded `locationIds` selection. Confirm a concrete way for Free and Pro to send the **same canonical candidate IDs for the same user/context**, without importing `campsites.full.json` into the frontend, exposing hidden Pro campsite data, adding tier-dependent selection, or changing Ticket 1–3. If no such path exists in the current code/contract, STOP and report findings before any implementation.

### 2. Scope and placement

Add one Northern Lights feature entrypoint to the existing homepage, directly below the canonical `HomeDecisionCard` and before other supporting/detail surfaces. It must remain visually subordinate to the stay/move decision: no new hero, no dashboard-style first screen, and no rearrangement or redesign of the canonical decision.

Render the feature only when seasonally relevant. Derive this through a small, deterministic, timezone-explicit rule or an existing trustworthy domain signal; isolate and test the boundary dates. Do not confuse seasonality/no darkness with Aurora activity or data availability.

Keep the first view compact and decision-oriented. Use progressive disclosure for ranking, technical details, and map/list presentation.

### 3. Canonical data boundary and request lifecycle

Create a focused hook/service boundary for `POST /api/aurora-decision` that:

- sends an explicit evening and a bounded, deduplicated, canonical location-ID set accepted by Ticket 3;
- uses exactly the same request and canonical response for Free and Pro for the same context;
- branches on the response body `status`, `reason`, `auroraCache.state`, `warnings`, and per-location outcomes rather than assuming non-200 means domain unavailability;
- never calculates, adjusts, reorders, filters before ranking, or reinterprets the canonical score/ranking in the client;
- preserves Ticket 3 ordering exactly (`best`, then `alternatives`) for every rendered list/map;
- cancels or ignores obsolete requests when inputs change and does not flash the previous result as current;
- exposes explicit idle/seasonally-hidden, loading, success, partial/degraded, stale, no-darkness, unavailable, and transport/error states;
- provides a real retry path for unavailable/transport failure.

Do not change Ticket 1–3 scoring, cache, endpoint, or ranking implementation. Do not add new libraries or backend routes.

If `not_viewable_tonight` is only available through Ticket 3's `excluded` entries, the client may classify no-darkness only when the audited response makes that conclusion unambiguous (for example, all relevant outcomes consistently report that exact status). It must not infer no darkness from a low score, missing data, or generic `no_locations_scored`. If the contract cannot distinguish it reliably, STOP rather than inventing semantics.

### 4. Feature gating and tier invariants

Add the Northern Lights feature to the centralized `FEATURES` configuration and gate its presentation through `RequireFeature`/existing feature helpers. Do not scatter raw Pro checks through the new feature.

Gating controls only presentation:

- Free and Pro must use the same full canonical Ticket 3 response and candidate selection.
- Never request fewer/different locations, different weather/scoring inputs, or different rankings by tier.
- Never use the tier-filtered `siteList` in a way that causes a different Aurora candidate set between Free and Pro.
- Never expose hidden Pro location names, coordinates, scores, reasons, accessible labels, DOM content, or map data in the Free locked rendering.

Free receives a useful coarse teaser: band/verdict, darkness or viewing context, whether location meaningfully matters, and (only when supported by the canonical response) a truthful signal that better conditions may exist. Free must not receive the exact best-location name, exact numeric score, full reasons/ranking/comparison, or result map in rendered/accessible output. The locked state must not be a content-free “buy Pro” box.

Pro receives the exact best location, canonical score and band, short data-driven reasons, viewing window, ordered alternatives, accessible list view, map view, and progressive technical detail. Presentation toggles must never trigger alternative scoring/ranking.

### 5. State semantics and copy

Implement distinct, truthful states:

- **Loading:** stable-height calm skeleton/status with an accessible status message; no stale prior result presented as fresh and no premature paywall.
- **Stale:** show only when Ticket 3 says the cache is stale/usable, retain the result, visibly disclose human-formatted `sourceFetchedAt`, and disclose freshness equally to Free and Pro.
- **Partial/degraded:** show available canonical results, clearly state comparison is limited, preserve exclusions, and never fabricate alternatives or claim a complete ranking.
- **Unavailable:** no score/verdict/default “bad evening”; neutral error plus retry; never present upgrade as the remedy.
- **No darkness:** a natural, non-error, non-paywalled `not_viewable_tonight` outcome; never a low score or upgrade prompt.
- **Poor conditions:** remain distinct from missing/insufficient/unavailable data.

Do not describe score as probability, likelihood, or a percentage chance of seeing aurora. Do not claim Ticket 3's national reference window is campsite-specific. Primary copy should be plain, practical, and comfort/decision oriented; technical inputs belong behind progressive disclosure.

Add real English and Icelandic keys in the existing i18n structure. Do not hardcode user-facing IS/EN strings in components, hooks, loading fallbacks, errors, accessible labels, or map/list controls.

### 6. List, map, accessibility, and responsive behavior

The accessible list is the complete primary alternative to the map. It must show canonical order, location, band/score as allowed, main reason, useful viewing-window differences if actually present, relevant flags, and a clear action. Do not rely on color alone.

The map must be secondary/lazy-loaded, show only the same Pro-visible ordered result set, clearly identify the canonical best without changing it, and synchronize selection/focus with the list where feasible using the existing Leaflet patterns. Do not make the map the only way to use the feature and do not import Leaflet eagerly.

Verify semantic headings, keyboard operation, visible focus, accessible names, appropriate live-region behavior, locked-content isolation from screen readers, reduced-motion behavior for any animation, and usability on small mobile, larger mobile, tablet, and desktop in light and dark modes. On mobile the compact decision and list controls must precede the map and remain reachable.

### 7. Upgrade flow and context preservation

Reuse the existing login/pricing/checkout flow. Use specific attribution values from the issue (`northern_lights_card`, `northern_lights_ranking`, or `northern_lights_map`) according to the CTA surface, preserving the separation between analytics `source` and checkout `upgrade_source`.

Preserve enough non-sensitive Northern Lights UI context across login/pricing/upgrade return to restore the same evening/view/selection intent without persisting precise user location or leaking Pro-only result content. Audit the actual existing return behavior first; do not claim preservation merely because `checkout_source` survives.

### 8. Analytics

Add only the issue's semantically useful GA4 events where the corresponding surface/state truly occurs, following current snake_case conventions. At minimum cover card viewed, details opened, full ranking viewed, map viewed, upgrade clicked, unavailable viewed, and stale viewed when those states exist.

- Fire each impression/state event once per meaningful result/request identity, not on every render, language toggle, tab toggle, Strict Mode effect replay, or unrelated rerender.
- A locked teaser is not a full-ranking or map view.
- Keep parameters lightweight and non-PII: stable tier/freshness/band/source/experiment metadata only as applicable.
- Do not send precise coordinates, location history, user-provided location trails, or raw numeric score as identifying analytics metadata.
- Add focused analytics tests proving exact-once behavior and negative cases.

### 9. Tests and validation

Add targeted tests for every new branch and semantic promise, including:

1. seasonal visibility and exact boundary dates with timezone-stable fixtures;
2. one tier-independent request/candidate selection for identical Free/Pro context;
3. no client sorting/scoring and exact preservation of Ticket 3 order;
4. Free value plus non-disclosure in visible and accessible/DOM output;
5. Pro best/list/map/detail rendering from the same response;
6. loading stability and obsolete-request protection;
7. fresh, stale-with-source-time, partial/degraded, unavailable/transport retry, poor-conditions, and unambiguous no-darkness states;
8. unavailable/no-darkness never showing upgrade as the solution;
9. IS/EN runtime copy and no hardcoded user-facing fallback paths;
10. keyboard/focus/list alternative and color-independent band/ranking cues;
11. upgrade-source attribution for each CTA surface and context restoration behavior;
12. analytics exact-once and non-firing cases, including locked ranking/map;
13. responsive/light/dark presentation at component level where practical.

Use Ticket 3-shaped fixtures that match the hook's parsed contract, not an invented shorthand. Run the new targeted tests, relevant existing Aurora/Ticket 3 tests, affected homepage/paywall/analytics tests, then the full Vitest suite, lint, and production build. Record exact commands and outcomes. Do not weaken existing tests, lint, or coverage configuration.

### 10. Acceptance criteria

- A seasonally appropriate compact Aurora card appears immediately below the canonical homepage decision and remains secondary.
- The current Ticket 3 API is consumed unchanged; React contains no scoring or ranking logic.
- Identical user/context inputs produce the same canonical request/candidate set and response regardless of tier.
- Free provides useful coarse guidance without leaking best-location identity, exact score, full reasons/ranking/comparison, coordinates, or map data.
- Pro provides exact best location, canonical score/band/reasons/window, preserved-order alternatives, accessible list, and secondary map.
- Loading, stale, partial/degraded, unavailable, poor-conditions, and no-darkness meanings are distinct and truthful.
- Stale is never shown as fresh; unavailable/no darkness never becomes a paywall.
- List and map preserve the same server order and decision.
- IS/EN, accessibility, focus/keyboard, reduced-motion, responsive layouts, light mode, and dark mode are covered.
- Upgrade attribution and context restoration are verified without conflating analytics source with entitlement or checkout semantics.
- Analytics fire once at the correct semantic moments and contain no unnecessary precise location data.
- Targeted tests, relevant existing tests, full suite, lint, and build pass.

### 11. Out of scope

- Any change to Ticket 1 cache/cron, Ticket 2 scoring, or Ticket 3 endpoint/ranking contract.
- A new backend endpoint, persisted score/ranking rows, alternative score weights, or tier-specific canonical computation.
- Light-pollution data/map, push notifications, native app, photo forecast, or future-date planning.
- A generic weather dashboard or redesign/reordering of the canonical stay/move decision.
- New dependencies or TypeScript/`.tsx` files.

### 12. STOP conditions

STOP before implementation and report concrete findings if:

- Ticket 3 cannot support the UI without a breaking or behavioral change;
- the current repo provides no tier-independent way to select the same bounded canonical candidate IDs for Free and Pro without exposing/importing the full campsite dataset or changing Ticket 1–3;
- reliable no-darkness classification would require interpreting generic unavailability or inventing new semantics;
- the client would need to score, re-rank, or mutate canonical results;
- Free/Pro presentation would require different scoring inputs, candidate selection, or requests;
- hidden Pro location/result data cannot be kept out of Free DOM/accessibility/map output;
- context preservation requires persisting precise user location or changing checkout/payment plumbing beyond existing source/return patterns;
- map-only interaction, homepage decision displacement, or inaccessible locked content would be unavoidable;
- any required solution exceeds this ticket's UI-only/no-new-backend/no-new-library scope.

### 13. Workflow and git safety

Follow repository conventions: `.jsx`, extensionless imports, centralized translations/gating, lazy Leaflet usage, and no hardcoded UI copy. If the audit reveals an adjacent change beyond this approved scope, STOP for explicit approval rather than broadening the ticket. Write `cc-report.md` with files changed, audited contracts, state mapping, candidate-selection proof, deviations, test commands/results, and remaining risks. Do not commit and do not push. Complete the required `CURRENT.md` transitions only when an approved prompt is later executed.

---

## Jonesy review — Round 1

The central risk this ticket itself identifies (§1: tier-independent candidate-ID selection without importing `campsites.full.json` or exposing hidden Pro data) is correctly treated as an audit question with its own STOP condition, not assumed away — good instinct, no note needed there. Three findings below come from directly knowing Ticket 3's actual, already-reviewed response contract (`api/_lib/auroraDecision/*`), not from generic UI-review checklist items.

### Findings

1. **The `unknown_location_ids` 400 response has no place in §3/§5's state list, and it's a meaningfully different failure mode than "unavailable."** Ticket 3's `orchestrate.js` rejects the *entire* request with `400 {ok:false, code:"unknown_location_ids", error, details:{unknownIds}}` if even one requested ID isn't in the canonical `campsites.full.json` the server loads — this is all-or-nothing, not partial. That's categorically different from the 200-status domain states (`success`/`partial`/`unavailable`) §3 and §5 enumerate: it means the *client sent a bad request* (a stale candidate list, an ID typo, a Free/Pro selection-path bug), not that the Aurora domain is transiently unavailable. If this response gets funneled into the same "unavailable, show neutral error + retry" bucket as a real cache-unavailable state, retrying will just 400 forever with no way for the user or a real transient-condition retry to fix it, and a real client bug could hide indefinitely behind an innocuous "try again later" message. This needs its own explicit branch — treated as a defect signal (report/log distinctly, and ideally exercised as a test case proving it never reaches production for a correctly-selected candidate set), not folded into the general unavailable/retry UX. Add it explicitly to §3 or §9's required test list.

2. **§5's state list treats "stale" as mutually exclusive with "partial/degraded," but Ticket 3's real contract allows both simultaneously.** `auroraCache.state` (`fresh`/`stale`/`unavailable`) and top-level `status` (`success`/`partial`/`unavailable`) are independent dimensions of the same response — a real response can be `status: "partial"` *and* `auroraCache.state: "stale"` *and* carry both `aurora_data_stale` and `some_locations_excluded` in `warnings` at once (verified directly against `orchestrate.js`'s warning-assembly logic during the Ticket 3 result review). If the UI is built as a single switch/enum over "Loading / Stale / Partial / Unavailable / No darkness / Poor conditions" as §5 phrases it, there's no way to represent "stale AND partial" without either dropping one disclosure or picking an arbitrary priority order the prompt never specifies. Clarify that staleness is a composable flag layered on top of whichever primary state applies (success/partial/no-locations-scored), not a fifth exclusive state, and require a test for the stale+partial combination specifically.

3. **No requirement to dedupe/memoize identical in-flight or just-completed requests, and Ticket 3 does not cache per-location weather fetches.** Only the Aurora snapshot itself is cached server-side (Ticket 1); every `/api/aurora-decision` call fans out fresh Open-Meteo requests for every requested location (up to `MAX_LOCATIONS_PER_REQUEST = 8`) with no request-level caching. §8 already shows real awareness of this class of problem for analytics ("not on every render... Strict Mode effect replay"), but §3's request lifecycle doesn't extend the same discipline to the network call itself — a React 18 Strict Mode double-invoke in dev, a language toggle, or an unrelated parent rerender could each trigger a full redundant 8-location Open-Meteo fan-out with real external-API and latency cost, which is more expensive than a duplicated analytics event. Add an explicit requirement: dedupe/memoize by `(evening, locationIds)` so an identical in-flight or recently-resolved request is reused rather than refired, and add a test proving it.

### Minor / non-blocking

- Process note, recurring from Ticket 395: `docs/ai/CURRENT.md`'s `CC report:` and `Result review:` fields already name concrete paths (`docs/ai/tasks/ticket-392/cc-report.md`, `.../result-review.md`) that don't exist yet — confirmed via directory listing, only `prompt-review.md` exists. This is the same premature-path issue flagged and "fixed" during Ticket 395; it recurred here, so the fix evidently isn't being applied consistently by whoever populates `CURRENT.md` for a new task. Recommend those two fields read "Not created yet" until written, per `docs/ai/README.md`'s own "Locating result-review.md" section.
- Worth an explicit line (not blocking): the hook should not fire the Aurora request at all while the feature is seasonally hidden — §2 covers *rendering* only, and a hook can still run independently of what's visually rendered depending on where it's mounted.

### Verdict: REVISE

Findings 1 and 2 are real gaps against Ticket 3's actual, already-verified contract — not generic UI concerns — and finding 3 is a concrete cost/correctness risk given Ticket 3's lack of per-request caching. Please fold fixes into a new draft round for Jonesy re-review.

---

## Round 2 — Ripley revised prompt

Round 1 remains the complete implementation prompt except where the following revisions explicitly replace or extend it. These revisions are normative and must be included verbatim in any approved-prompt artifact.

### Revision A — request lifecycle, deduplication, and hidden-season behavior

Replace the request-lifecycle requirements in Round 1 §3 with the following expanded requirements:

- Send an explicit evening and a bounded, deduplicated, canonical location-ID set accepted by Ticket 3.
- Use exactly the same request and canonical response for Free and Pro for the same context.
- Do not mount or invoke the Aurora request path while the feature is seasonally hidden. Seasonal invisibility suppresses both rendering and network work.
- Derive a stable request identity from the normalized `(evening, locationIds)` tuple. Location IDs must be deduplicated and normalized into the one deterministic canonical order chosen by the audited candidate-selection path before building the key or request body; React render order must not create distinct request identities.
- Reuse an identical in-flight request and a safely bounded recently-resolved result rather than refiring the Ticket 3 endpoint. This protection must survive React Strict Mode effect replay, language/theme changes, tab/view toggles, and unrelated parent rerenders. Do not introduce indefinite caching, show a prior request's data under a new identity, or weaken explicit retry: retry must intentionally invalidate/bypass the reusable result for that identity and issue one new request.
- Cancel or ignore obsolete requests when the request identity changes; never let an older completion replace the current identity's state.
- Branch on HTTP/transport outcome first, then the actual Ticket 3 body dimensions (`ok`, `code`, `status`, `reason`, `auroraCache.state`, `warnings`, and per-location outcomes). Do not assume every HTTP 200 is a visible result, and do not assume every non-200 is transient domain unavailability.
- Never calculate, adjust, re-rank, mutate, or reinterpret the canonical score/ranking in the client. Preserve Ticket 3 ordering exactly (`best`, then `alternatives`) for list and map.
- Expose explicit idle/seasonally-hidden, loading, success, partial/degraded, no-darkness, domain-unavailable, invalid-request/contract-defect, and transport/error states, with staleness represented as the independent composable freshness dimension defined in Revision C.

The existing Round 1 prohibition on Ticket 1–3 changes, new backend routes, and new libraries remains unchanged.

### Revision B — `unknown_location_ids` is a contract defect, not domain unavailability

Ticket 3's `400 { ok:false, code:"unknown_location_ids", details:{unknownIds} }` response is all-or-nothing and must have its own explicit client branch. It means the client candidate source has drifted or is invalid; it is not Aurora unavailability, degraded weather coverage, or a user-fixable transient error.

- Never map `unknown_location_ids` to the normal unavailable copy or an ordinary retry-only experience.
- Report/log it distinctly through the repository's existing error-observability boundary without sending unnecessary location history or user coordinates. Do not add a new observability dependency.
- Show safe localized generic failure copy to the user; do not expose internal IDs, suggest that Pro fixes it, or create an endless retry loop that resends the unchanged bad request.
- Treat it as proof that the candidate-selection invariant failed. Correct implementation should prevent it for the audited canonical candidate set.
- If the selected tier-independent candidate source cannot guarantee that its IDs match Ticket 3's canonical dataset, trigger the existing STOP condition before implementation rather than relying on runtime handling.

Extend Round 1 §9 with targeted tests proving:

1. a correct canonical candidate set never produces/simulates `unknown_location_ids`;
2. an explicit Ticket 3-shaped `unknown_location_ids` response selects the defect branch, is observably distinct from domain unavailable/transport failure, does not show an upgrade remedy, does not leak IDs, and does not automatically retry the identical invalid request.

### Revision C — freshness and result status are orthogonal

Replace any reading of Round 1 §3/§5 that treats stale as a mutually exclusive primary state. Model the response with at least two independent dimensions:

- **Primary outcome:** success, partial/degraded, no-darkness (only when unambiguous), domain unavailable, invalid-request/contract defect, or transport error.
- **Freshness:** fresh, stale-but-usable, or unavailable as reported by `auroraCache.state`.

Stale is a composable disclosure on any usable primary result, including partial/degraded. For example, Ticket 3 may validly return `status:"partial"`, `auroraCache.state:"stale"`, plus both `aurora_data_stale` and `some_locations_excluded`; the UI must simultaneously disclose older data **and** limited comparison, without arbitrarily suppressing either. `sourceFetchedAt` must be shown whenever stale usable data is rendered, equally for Free and Pro.

Aurora cache `state:"unavailable"` belongs to the domain-unavailable outcome and must not be rendered as usable stale data. Generic `no_locations_scored` remains unavailable unless the audited excluded outcomes make `not_viewable_tonight` unambiguous under Round 1's no-darkness rule.

Extend Round 1 §9 with a Ticket 3-shaped stale-plus-partial fixture and an assertion that both disclosures remain visible and semantically accessible at the same time for Free and Pro, without changing the canonical result/order.

### Revision D — acceptance and reporting additions

Add these acceptance criteria to Round 1 §10:

- No Aurora request fires when the feature is seasonally hidden.
- Identical normalized `(evening, locationIds)` inputs reuse in-flight/recent work across Strict Mode and unrelated rerenders; explicit retry performs exactly one fresh request.
- `unknown_location_ids` is surfaced as a distinct contract-defect path, never ordinary Aurora unavailability or a retry/paywall loop.
- Stale and partial/degraded can coexist; both disclosures render together and remain available to Free and Pro.

Add to `cc-report.md`: the exact request-key normalization and reuse lifetime/invalidation policy; proof that seasonal hiding suppresses calls; a response-state matrix showing primary outcome versus freshness; and the observed handling of `unknown_location_ids`.

### Revision E — unchanged safeguards

All other Round 1 scope boundaries, Free/Pro invariants, non-disclosure rules, accessibility/i18n requirements, analytics rules, tests, STOP conditions, validation commands, workflow transitions, and no-commit/no-push rule remain fully in force.

Ripley disposition of Jonesy's findings:

1. `unknown_location_ids`: accepted and resolved by Revision B plus targeted tests.
2. stale + partial orthogonality: accepted and resolved by Revision C plus a combined-state fixture.
3. redundant Open-Meteo fan-out: accepted and resolved by Revision A's stable-key in-flight/recent-result reuse and retry invalidation requirements.
4. Premature future-artifact paths: accepted; `CURRENT.md` now uses `Not created yet` until those artifacts actually exist.
5. Seasonally hidden network activity: accepted and made explicit in Revision A and acceptance criteria.

---

## Jonesy review — Round 2 (Round 1 + Revisions A–E)

All three Round 1 findings are correctly and precisely resolved, not just acknowledged:

1. **`unknown_location_ids`** — Revision B gives it its own explicit contract-defect branch, forbids treating it as ordinary unavailability or a retry loop, requires it route through the existing error-observability boundary (Sentry, already a dependency here) without a new one, and adds exactly the two tests needed: a correct canonical set never produces it, and a simulated occurrence is observably distinct from domain-unavailable/transport-error and never auto-retries.
2. **Stale/partial orthogonality** — Revision C correctly re-models the response as two independent dimensions (primary outcome × freshness) rather than a flat exclusive enum, explicitly requires the stale+partial combination to render both disclosures simultaneously, and correctly keeps `auroraCache.state:"unavailable"` out of the "usable stale data" bucket. This matches Ticket 3's real, verified response shape exactly.
3. **Redundant Open-Meteo fan-out** — Revision A's normalized-tuple request identity (with explicit canonical-ordering-before-keying, closing a subtle cache-key-instability path I hadn't even asked for), in-flight/recent-result reuse surviving Strict Mode/language/theme/rerender, and an explicit "retry always invalidates and issues exactly one fresh request" carve-out together close this cleanly — the retry carve-out matters because a naive dedupe implementation could otherwise make explicit retry a no-op, which would have been a new bug traded for the old one.

No new issues found in Round 2 itself. The exact reuse-lifetime value is left undocumated in the prompt (by design — "safely bounded" rather than a fixed number), but Revision D correctly requires `cc-report.md` to document the actual chosen lifetime/invalidation policy, which is the right level: the number is CC's implementation judgment, the requirement to justify it in the report is what lets result review actually check it.

### Verdict: APPROVED

Round 1 + Revisions A–E together are approved for execution. Ripley: create `approved-prompt-v1.md` from the effective combined content and set `CURRENT.md → READY_FOR_CC`.
