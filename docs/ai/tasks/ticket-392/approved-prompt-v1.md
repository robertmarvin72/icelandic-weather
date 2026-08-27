# Approved Prompt v1 — Ticket 392 (Northern Lights MVP UX/UI + paywall)

Implement GitHub issue #392 as a seasonal, secondary Northern Lights decision surface on the homepage. Consume Ticket 3's canonical tier-independent response unchanged. Do not add or duplicate Aurora scoring/ranking logic in React.

## 1. Mandatory preflight audit

Before editing, read the issue and inspect:

- Ticket 391's approved prompt, CC report, and result review;
- `api/aurora-decision.js` and all directly used `api/_lib/auroraDecision/` modules/tests;
- `src/App.jsx`, `useCampsites`, `useMe`, and homepage ordering;
- `HomeDecisionCard`, `RoutePlannerCard`, `LazyMap`, `MapView`, and relevant tests;
- `features.js`, `RequireFeature`, `useCheckoutFlow`, `checkoutSource`, `analytics`, pricing/attribution tests, translations, and comparable card/hook tests.

Document Ticket 3 response shapes and the chosen candidate-selection/request path in `cc-report.md`.

Critical preflight: `/api/campsites` is tier-filtered while `/api/aurora-decision` accepts up to eight explicit canonical `locationIds`. Confirm a concrete way for Free and Pro to send the same canonical candidate IDs for the same user/context without importing `campsites.full.json` into the frontend, exposing hidden Pro data, tier-dependent selection, or changing Ticket 1–3. If none exists, STOP before implementation and report findings.

## 2. Placement and seasonality

Add one compact feature entrypoint directly below `HomeDecisionCard` and before other supporting/detail surfaces. Keep it visually subordinate: no hero, dashboard, canonical-decision redesign, or homepage reordering.

Render only when seasonally relevant using a deterministic, timezone-explicit rule or trustworthy existing domain signal; isolate and test exact boundary dates. Seasonality/no darkness, Aurora activity, and data availability are distinct. When hidden seasonally, do not mount/invoke the request path: suppress both UI and network work.

Use progressive disclosure; technical data, ranking, and map must not dominate the first view.

## 3. Canonical request/data boundary

Create a focused hook/service for `POST /api/aurora-decision` that:

- sends explicit evening plus a bounded, deduplicated canonical ID set;
- uses the identical request/response for Free and Pro for identical context;
- normalizes IDs into the audited deterministic canonical order before request-body/key creation;
- derives a stable identity from normalized `(evening, locationIds)`;
- reuses identical in-flight and safely bounded recently-resolved work across Strict Mode replay, language/theme/view toggles, and unrelated rerenders;
- documents reuse lifetime/invalidation; never caches indefinitely or displays another identity's data;
- makes explicit retry invalidate/bypass reuse and issue exactly one fresh request;
- cancels or ignores obsolete completions after identity changes and never flashes a prior result as current;
- branches on transport/HTTP first, then real Ticket 3 fields: `ok`, `code`, `status`, `reason`, `auroraCache.state`, `warnings`, and per-location outcomes;
- never scores, re-ranks, mutates, adjusts, or reinterprets the canonical result;
- preserves exact `best`, then `alternatives` order in list and map.

Do not change Ticket 1–3 code/contracts, add backend routes, or add libraries.

## 4. State model

Model at least two independent dimensions:

- Primary outcome: success, partial/degraded, unambiguous no-darkness, domain unavailable, invalid-request/contract defect, or transport error.
- Freshness: fresh, stale-but-usable, or unavailable as reported by `auroraCache.state`.

Stale composes with usable outcomes, including partial. A `status:"partial"` + `auroraCache.state:"stale"` response with both warnings must disclose both older data and limited comparison simultaneously. Show human-formatted `sourceFetchedAt` for stale usable data equally to Free and Pro. Cache `state:"unavailable"` is domain unavailable, never usable stale data.

Implement truthful UI behavior:

- Loading: stable-height calm skeleton/status, accessible status, no old result shown as current, no premature paywall.
- Partial/degraded: show available canonical results, disclose limitation, preserve exclusions, fabricate nothing.
- Domain unavailable: no score/verdict/default bad evening; neutral error and real retry; no upgrade remedy.
- Poor conditions: distinct from insufficient/unavailable data.
- No darkness: only when Ticket 3's outcomes make `not_viewable_tonight` unambiguous (e.g. all relevant outcomes consistently have that exact status); natural non-error, no low-score treatment or upgrade. Generic `no_locations_scored` remains unavailable otherwise. STOP if reliable distinction is impossible.
- Transport error: localized neutral error and retry.

Ticket 3's `400 {ok:false, code:"unknown_location_ids", details:{unknownIds}}` is an all-or-nothing contract defect, not domain unavailability:

- route it separately and report through existing error observability without new dependencies, coordinates, or location history;
- show safe localized generic copy without IDs, paywall, or an endless identical retry loop;
- treat it as candidate-source invariant failure; correct audited selection must prevent it;
- STOP if canonical ID compatibility cannot be guaranteed.

## 5. Feature gating and non-disclosure

Add the feature to centralized `FEATURES` and gate presentation through `RequireFeature`/existing helpers; do not scatter new raw Pro checks.

Gating changes presentation only. Never vary candidates, inputs, requests, ranking, or scoring by tier. Never use tier-filtered `siteList` so Free and Pro select different Aurora candidates.

Free must receive useful coarse guidance: band/verdict, darkness/viewing context, whether location meaningfully matters, and only a truthful canonical signal that better conditions may exist. Free rendered/accessible output must not expose exact best name, coordinates, numeric score, full reasons/ranking/comparison, or result map. Hidden Pro data must not exist in Free DOM, accessibility labels, or map props. The lock cannot be an empty “buy Pro” card.

Pro receives exact best location, canonical score/band, concise data-driven reasons, viewing window, ordered alternatives, accessible list, secondary map, and progressive technical details. Presentation toggles never recompute anything.

## 6. Copy, list/map, accessibility, and responsive UI

Never describe score as probability, likelihood, or sighting percentage. Never claim the national reference window is campsite-specific. Distinguish poor conditions, insufficient data, no darkness, and unavailable data. Keep primary language human and practical.

Add genuine IS/EN translation keys in the existing structure. No hardcoded user-facing strings in components, hooks, fallbacks, errors, labels, or controls.

The accessible list is a complete primary alternative to the map and preserves canonical order. Show allowed location/band/score, main reason, useful window differences if actually present, relevant flags, and clear actions. Do not rely on color alone.

The map is Pro-only, secondary and lazy-loaded through existing Leaflet patterns. It uses exactly the same ordered result set, identifies canonical best without changing it, and synchronizes list/map selection/focus where feasible. It is never the only interaction path.

Verify semantic headings, keyboard operation, visible focus, accessible names, appropriate live regions, locked-content isolation, reduced motion, and small-mobile through desktop behavior in light/dark mode. Compact decision/list controls precede the map on mobile.

## 7. Upgrade flow and context

Reuse existing login/pricing/checkout. Attribute CTA surfaces with `northern_lights_card`, `northern_lights_ranking`, or `northern_lights_map` as appropriate. Keep analytics `source` semantically separate from checkout `upgrade_source`.

Preserve non-sensitive UI context across login/pricing/upgrade return (same evening/view/selection intent) without precise user location or Pro content. Audit actual return behavior; `checkout_source` alone is not proof of restoration. STOP if this requires precise-location persistence or checkout/payment changes beyond existing source/return patterns.

## 8. Analytics

Add semantically applicable snake_case events for card viewed, details opened, full ranking viewed, map viewed, upgrade clicked, unavailable viewed, and stale viewed.

Fire once per meaningful request/result identity, not per render, Strict Mode replay, language/theme/view toggle, or unrelated rerender. Locked teaser is not ranking/map viewed. Use lightweight non-PII tier/freshness/band/source/experiment metadata only; no precise coordinates/history or raw numeric score. Add exact-once and negative tests.

## 9. Required targeted tests

Cover:

1. seasonal visibility/boundaries and zero calls while hidden;
2. identical normalized candidate request for identical Free/Pro context;
3. stable request-key normalization, in-flight/recent reuse, Strict Mode/rerender protection, obsolete completion protection, and exactly one fresh explicit retry;
4. no client scoring/sorting and exact Ticket 3 order;
5. Free value plus visible/DOM/accessibility non-disclosure;
6. Pro best/list/map/details from the same response;
7. loading, success, poor, partial, unavailable, transport retry, unambiguous no-darkness, and stale-with-source-time;
8. stale + partial fixture showing both disclosures for Free and Pro without result/order changes;
9. correct canonical candidates never yielding `unknown_location_ids`;
10. Ticket 3-shaped `unknown_location_ids` selecting the distinct defect branch, observability, no ID leak/paywall/automatic retry;
11. unavailable/no-darkness never presenting upgrade as solution;
12. runtime IS/EN and no hardcoded fallback path;
13. keyboard/focus/list alternative/color-independent cues;
14. upgrade attribution and context restoration;
15. analytics exact-once/non-firing including locked ranking/map;
16. responsive/light/dark behavior where practical.

Fixtures must match Ticket 3's real parsed contract. Run new targeted tests, relevant Ticket 3/Aurora and affected homepage/paywall/analytics tests, full Vitest suite, lint, and production build. Record exact commands/outcomes; do not weaken tests, lint, or coverage.

## 10. Acceptance criteria

- Compact seasonal card is directly below and secondary to canonical decision.
- Ticket 3 is unchanged; React has no Aurora scoring/ranking.
- Same context produces same canonical candidates/request/response regardless of tier.
- No request fires while seasonally hidden.
- Identical normalized requests reuse bounded work; retry makes exactly one fresh call.
- Free is useful without leaking Pro identity/score/ranking/reasons/coordinates/map.
- Pro shows exact canonical best, details, preserved-order list, and secondary map.
- Primary outcome and freshness remain orthogonal; stale+partial displays both.
- `unknown_location_ids` is a distinct defect path, never normal unavailable/retry/paywall.
- Unavailable/no-darkness/poor/partial/loading semantics remain truthful.
- List/map order matches the server; IS/EN, accessibility, responsive and themes pass.
- Upgrade attribution/context and analytics exact-once/non-PII behavior are verified.
- Targeted/relevant/full tests, lint, and build pass.

## 11. Out of scope and STOP conditions

Out of scope: Ticket 1 cache/cron, Ticket 2 scoring, Ticket 3 endpoint/ranking, new backend/API, persisted rankings, alternate weights, tier-specific computation, light pollution, notifications, native/photo/future planning, generic dashboard, canonical decision redesign, new dependencies, TypeScript/`.tsx`.

STOP and report before implementation if any of these is required or if:

- Ticket 3 needs breaking/behavioral change;
- no safe tier-independent canonical candidate source exists;
- no-darkness cannot be distinguished without invented semantics;
- client scoring/re-ranking/mutation or tier-specific inputs/candidates/requests are needed;
- Free output cannot exclude hidden Pro data;
- context requires precise-location persistence or broader payment changes;
- map-only use, canonical-decision displacement, or inaccessible locks are unavoidable;
- solution exceeds the UI-only/no-new-backend/no-library scope.

## 12. Workflow and report

Follow `.jsx`, extensionless imports, centralized i18n/gating, lazy Leaflet, and existing patterns. Do not broaden scope; STOP for approval. Write `cc-report.md` with audited contracts, files changed, candidate proof, request-key normalization/reuse policy, seasonal call suppression, primary-outcome × freshness matrix, `unknown_location_ids` handling, deviations, commands/results, and risks.

Do not commit. Do not push. Follow all required `CURRENT.md` transitions for CC execution.
