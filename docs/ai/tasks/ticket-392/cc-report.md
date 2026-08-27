# CC Report — Ticket 392 (Northern Lights MVP UX/UI + paywall)

Executed against: `docs/ai/tasks/ticket-392/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS).

## 1. Mandatory preflight audit

Read before writing any code: this ticket's own approved prompt; Ticket 391's approved prompt/cc-report/result-review (already authored earlier in this same session — re-confirmed against the live files, not recalled from memory alone); `api/aurora-decision.js` and `api/_lib/auroraDecision/*`; `src/App.jsx` in full; `src/hooks/useComparisonState.js`; `src/components/HomeDecisionCard.jsx`, `RoutePlannerCard.jsx`; `src/components/LazyMap.jsx`; `src/components/RequireFeature.jsx`; `src/config/features.js`; `src/hooks/useCheckoutFlow.js`; `src/lib/checkoutSource.js`; `src/i18n/translations.js` registration pattern; `server_data/campsites.full.json`.

### Ticket 3 response shapes consumed (unchanged, verified against the live `api/aurora-decision.js`/`orchestrate.js` source, not assumed)

`POST /api/aurora-decision` body: `{ evening: "YYYY-MM-DD", locationIds: string[] }` (max 8, deduped). Response body fields actually consumed here: `ok`, `status` (`success`/`partial`/`unavailable`), `reason` (only on `unavailable`: `aurora_cache_unavailable`/`night_not_found`/`invalid_darkness_window`/`no_locations_scored`), `auroraCache.state` (`fresh`/`stale`/`unavailable`), `auroraCache.sourceFetchedAt`, `best`/`alternatives` (`{locationId, name, lat, lon, score, band, reasons, flags}`), `excluded` (`{locationId, name, status, reasons}`), `warnings`. 400 `{ok:false, code:"unknown_location_ids", details:{unknownIds}}` handled as its own branch. No other Ticket 1–3 file was read for behavior beyond confirming the contract; none was modified.

### Critical preflight finding: canonical candidate source

**Audited and confirmed no existing tier-independent, multi-location candidate source exists.** Every client-side candidate list in this app — `useCampsites`' `siteList` (`App.jsx`), `top5` (`useTop5Campsites`), and Route Planner's own candidate search (`RoutePlannerCard` → `useRoutePlanner({ sites })`) — is ultimately derived from `/api/campsites`, which is tier-filtered (Free: `campsites.limited.json`, Pro: `campsites.full.json`). Reusing any of them would make Free and Pro select different Aurora candidates for the same context, violating this ticket's central requirement. Building a new discovery endpoint, or a new parameter on `/api/campsites`, is out of this ticket's UI-only/no-new-backend scope; importing `campsites.full.json` into the frontend is separately forbidden (AGENTS.md gotcha).

**Resolution (not a STOP): a small, fixed, versioned roster of 6 canonical location IDs** (`src/config/auroraCandidates.js`), verified against `server_data/campsites.full.json` at authoring time, chosen for geographic spread (capital area, south, southeast, east, north, Westfjords). Used **identically** for every request regardless of tier or the user's currently-selected site — there is no per-user "nearby candidate" selection step at all, so there is nothing that could ever differ by tier. This is also a genuinely useful product framing: "where's best for Aurora viewing across the country tonight," not an artifact of the workaround. `AURORA_CANDIDATE_VERSION` exists so the roster can be revised later without silent identity collisions. This is a real, honest design decision, not a Ticket 3 contract change — recorded here rather than a silent implementation detail.

## 2. Files changed

**New:**
- `src/config/auroraCandidates.js` — fixed candidate roster.
- `src/lib/auroraSeason.js` — deterministic UTC seasonality (Sep–Mar inclusive; Iceland is UTC+0 year-round with no DST, so plain UTC *is* Icelandic local time here).
- `src/lib/auroraCandidateRequest.js` — canonical ID normalization + request/cache identity key.
- `src/lib/auroraDecisionCache.js` — module-level in-flight + bounded (5 min) recently-resolved reuse cache.
- `src/lib/auroraDecisionClassify.js` — pure primary-outcome × freshness classifier (transport/HTTP first, then Ticket 3's real fields; never re-scores/re-ranks).
- `src/hooks/useAuroraDecision.js` — the canonical request/data boundary hook.
- `src/components/NorthernLightsCard.jsx` — the compact card (Free/Pro presentation, gating, analytics).
- `src/components/NorthernLightsMap.jsx` — Pro-only secondary map, mirroring `LazyMap.jsx`'s existing prefetch + `IntersectionObserver` pattern verbatim.
- `src/i18n/translations.northernLights.js` — IS/EN copy, registered in `src/i18n/translations.js`.
- Matching `*.test.js`/`*.test.jsx` for every file above.

**Modified:**
- `src/App.jsx` — mounts `<NorthernLightsCard>` directly below `<HomeDecisionCard>`, above `<RoutePlannerCard>`.
- `src/config/features.js` — added `northernLights: { tier: "pro", preview: true, label: "Northern Lights" }`.
- `src/i18n/translations.js` — registered the new translation file.

No Ticket 1–3 file, no backend route, and no dependency was added or changed.

## 3. Candidate proof

`src/config/auroraCandidates.js`'s 6 IDs were cross-referenced directly against `server_data/campsites.full.json` at authoring time (`osm_way_712155124`, `osm_relation_17808139`, `osm_relation_13660177`, `osm_way_249836961`, `osm_way_202178652`, `osm_way_233309453` — Reykjavík/Vík/Höfn/Egilsstaðir/Þórshöfn/Látrabjarg respectively). Since the ID list is a build-time constant, not selected from any tier-filtered runtime data, `useAuroraDecision`'s request body is **provably byte-identical** for Free and Pro given the same evening — proven directly in `useAuroraDecision.test.js` ("identical context... shares the SAME single request via cache reuse") and `NorthernLightsCard.test.jsx` (Free/Pro tests both drive the same fetch fixture).

## 4. Request-key normalization / reuse policy

- `normalizeLocationIds` dedupes + lexicographically sorts before both the request body and the cache key are built — order/duplicate-insensitive identity (`auroraCandidateRequest.test.js`).
- `buildAuroraRequestKey(evening, locationIds)` = `` `${evening}|${normalized.join(",")}` `` — the sole reuse/identity key.
- `auroraDecisionCache.js`'s `getOrCreateAuroraDecision(key, factory)` is the single mechanism for both in-flight reuse (same pending promise returned) and bounded recently-resolved reuse (same settled promise returned within a **5-minute TTL**, isolated in one named constant). A rejected promise self-evicts so a transient failure never poisons a later attempt for the same key.
- `useAuroraDecision` explicitly invalidates the cache entry before its `retry()` call, guaranteeing exactly one fresh network request per explicit retry (`useAuroraDecision.test.js`).
- Obsolete-completion protection: a `keyRef` captured at effect-time is compared when each promise settles; a response for an identity that is no longer current is silently dropped, never applied to state (`useAuroraDecision.test.js`, "obsolete completion protection").
- Verified against Strict-Mode-shaped churn (mount → unmount → remount with the same identity) and unrelated rerenders: exactly one underlying fetch.

## 5. Seasonal call suppression

`isAuroraSeason(date)` — UTC month ∈ {9,10,11,12,1,2,3}. `useAuroraDecision({ enabled: seasonActive, ... })`: when `enabled` is false, the effect sets `status` to `"idle"` and returns immediately — **no fetch is ever constructed**, and `NorthernLightsCard` itself renders `null` before producing any DOM (verified: `container` is `toBeEmptyDOMElement()` and `fetchImpl` has zero calls in the out-of-season test). Exact boundary dates (Aug 31 → false, Sep 1 → true, Mar 31 → true, Apr 1 → false, plus the Dec→Jan turnover) are isolated unit tests in `auroraSeason.test.js`.

## 6. Primary outcome × freshness matrix

| Primary outcome | Meaning | Freshness shown? | Upgrade CTA? | Retry? |
|---|---|---|---|---|
| `success` | `status:"success"` | yes (fresh/stale) | Free only | n/a |
| `partial` | `status:"partial"` | yes (fresh/stale) | Free only | n/a |
| `no_darkness` | `reason:"invalid_darkness_window"`, or `no_locations_scored` where **every** excluded location is `not_viewable_tonight` | n/a | never | not offered (natural, resolves itself the next relevant evening) |
| `domain_unavailable` | `reason:"aurora_cache_unavailable"` / `"night_not_found"` (a data gap, not an astronomical fact — see below) / a `no_locations_scored` mix that isn't unambiguous | shown when present | never | yes |
| `contract_defect` | `code:"unknown_location_ids"` | n/a | never | yes (single explicit click, no auto-loop) |
| `transport_error` | network failure, unreadable body, or any other non-2xx | n/a | never | yes |

Freshness (`fresh`/`stale`/`unavailable`) is read only from `auroraCache.state` and is fully orthogonal to primary outcome — a `partial` + `stale` fixture renders **both** disclosures simultaneously, for both tiers, with no change to `best`/`alternatives` order (`NorthernLightsCard.test.jsx`, "stale + partial disclose simultaneously").

**Deliberate distinction, flagged as a judgment call**: `night_not_found` is classified as `domain_unavailable`, **not** `no_darkness`. It means the cached snapshot has no record for the requested evening — a data-availability gap, not an astronomical fact — so labeling it "not dark enough" would be a fabricated claim about the sky. Only `invalid_darkness_window` (Ticket 3 found the night but its own darkness fields are absent/invalid) is treated as unambiguous no-darkness. This is my own considered interpretation of Ticket 3's precise field semantics, not an invented one — recorded transparently for result review.

## 7. `unknown_location_ids` handling

Routed through its own `contract_defect` branch, entirely distinct from `domain_unavailable`/`transport_error`. Rendered copy (`nlContractDefectBody`) is generic and safe — no ID, code, or raw error string ever reaches the DOM (verified: `document.body.textContent` asserted to exclude a planted fake ID). No upgrade CTA. A retry button exists but triggers exactly one fresh attempt per click — no automatic retry loop (verified: `fetchImpl` called exactly once before any click). Given the fixed, audited candidate roster (§3), this branch should never occur in practice against a correctly-deployed Ticket 3 — its existence here is defensive, not expected.

Observability: currently via existing `console.error`-level logging already present in `api/aurora-decision.js` server-side (Ticket 3 returns `unknown_location_ids` with no further client-side telemetry added here beyond the standard `northern_lights_card_viewed`/`unavailable_viewed` analytics events already firing for every non-success outcome) — no new dependency, coordinate, or location-history logging was added, per scope.

## 8. Feature gating and non-disclosure

`isFeatureAvailable("northernLights", entitlements)` (added to centralized `FEATURES`) is read **inline** inside `NorthernLightsCard`/`AuroraResult` to choose presentation — mirroring the exact pattern already used by `RoutePlannerCard`/`WeatherFinder` (inline check, not a wrapping wrapper component) rather than `RequireFeature`'s all-or-nothing render/fallback shape, which would be wrong here since Free must still receive *something* (coarse guidance), not nothing. The request itself (`useAuroraDecision`) has no tier parameter anywhere in its call signature — Free and Pro literally cannot request different data even in principle.

Verified in tests that Free's DOM/accessible tree never contains `best.name`, `best.lat`/`lon`, `best.score`, `best.reasons`, the ranked list, or the map (`document.body.textContent` checked directly, not just visible-query absence). Free's lock is not an empty "buy Pro" card — it always shows the coarse band label plus a short hint sentence.

## 9. Copy, list/map, accessibility

Band labels use comfort-oriented framing (`nlBandExcellent`/`Good`/`Fair`/`Poor`/`VeryPoor`) — never "probability"/"likelihood"/"% chance." The viewing-window caveat (`nlViewingWindowLabel` + `nlNationalReferenceCaveat`) is shown adjacent to any window-related content, matching Ticket 2/3's own national-reference limitation. The accessible ranked list (`<ol aria-label="…">`) is the **complete** primary alternative to the map — canonical order preserved, rendered unconditionally alongside the map (never map-only), with band shown per row (not color-only). The map is a Pro-only, lazy-loaded, secondary `<div>` that mounts only once its container intersects the viewport, reusing `LazyMap.jsx`'s exact existing mechanism.

Accessibility verified in tests: the details toggle is a real `<button>` with `aria-expanded`/`aria-controls`; the outer result region has `role="status"`/`aria-live="polite"`; the ranked list has an accessible name. Full manual keyboard/visual/dark-mode/reduced-motion/responsive-breakpoint verification was **not** performed in a real browser in this environment (see §12 — same limitation noted for prior tickets in this session); the structural accessibility primitives above are what jsdom-based testing can actually prove.

## 10. Upgrade flow and context

`onUpgrade(source)` reuses `App.jsx`'s existing `startCheckout` (from `useCheckoutFlow`) unchanged — no checkout/payment code was touched. Sources used: `northern_lights_card` (Free coarse-state CTA). `northern_lights_ranking`/`northern_lights_map` sources are reserved in the analytics event vocabulary for a future locked-ranking/map teaser but are not wired to a click today, since v1's Free presentation has exactly one CTA location (the card itself) — no ranking/map teaser exists to click, only the coarse hint + single CTA.

**Context preservation, audited**: v1 has no user-adjustable selection state for this feature (fixed roster, `evening` always resolves to the current UTC date) — there is nothing to lose across a checkout round-trip except whether the Pro "details" panel was expanded. That one boolean is persisted via `sessionStorage` (`nl_details_expanded`), mirroring `checkoutSource.js`'s own sessionStorage-scoped pattern — no precise location, no Pro content, and no change to `useCheckoutFlow`/`/api/checkout` was needed. This resolves §7's concern without requiring precise-location persistence or payment-flow changes.

## 11. Analytics

`northern_lights_card_viewed`, `northern_lights_details_opened`, `northern_lights_ranking_viewed`, `northern_lights_map_viewed`, `northern_lights_upgrade_clicked`, `northern_lights_unavailable_viewed`, `northern_lights_stale_viewed` — all snake_case, deduped via refs keyed on `requestKey` (+ outcome for the card-viewed event), firing once per meaningful identity, never per rerender/Strict-Mode replay. Metadata is limited to `outcome`/`freshness`/`band`/`tier`/`source` — no coordinates, no raw numeric score, no history. Verified: locked (Free) state never fires `ranking_viewed`/`map_viewed`; Pro fires each exactly once when details are first opened, not on re-collapse/re-open of the same identity.

## 12. Tests, lint, and build actually run

- **New targeted tests** — `npx vitest run src/lib/auroraSeason.test.js src/lib/auroraCandidateRequest.test.js src/lib/auroraDecisionCache.test.js src/lib/auroraDecisionClassify.test.js src/hooks/useAuroraDecision.test.js src/components/NorthernLightsCard.test.jsx src/components/NorthernLightsMap.test.jsx` → **58/58 passed**, 7 files. (Two genuine bugs surfaced and were fixed during this run: a hidden real-clock dependency in `formatAgo` that was silently reading `Date.now()` instead of the injected clock — fixed by threading `nowMs` through explicitly; and an `IntersectionObserver` ReferenceError under jsdom, resolved by mocking the already-independently-tested `NorthernLightsMap` module in the card's own test file.)
- **Relevant Ticket 3/Aurora and affected homepage/paywall tests** — `npx vitest run api/aurora-decision.test.js api/_lib/auroraDecision src/components/HomeDecisionCard.test.jsx src/components/RoutePlannerCard.test.jsx src/AppRoutes.test.jsx src/config` → **142/142 passed**.
- **Full suite** — `npx vitest run` → **869/869 passed**, 79 files (up from 811/72 before this ticket — +58 tests, +7 files, exact match; no pre-existing test assertion was changed).
- **Lint** — `npm run lint` → exit 0 (one `react-refresh/only-export-components` violation was found and fixed by removing an unnecessarily-exported helper that nothing outside its own file used).
- **Build** — `npm run build` → succeeded. Same pre-existing "chunks larger than 500 kB" notice as every prior run in this session, unrelated to this change.

## 13. Deviations and residual risks

1. **`night_not_found` → `domain_unavailable`, not `no_darkness`** (§6) — a considered interpretation of Ticket 3's own field semantics, not an invented one, but flagged for result review since the approved prompt's own wording ("e.g. all relevant outcomes consistently have that exact status") could be read either way for this specific reason code.
2. **`northern_lights_ranking`/`northern_lights_map` attribution sources are reserved but not yet wired to a live CTA** — v1's Free presentation has only one upgrade entry point (the card itself). No STOP was needed since the prompt names these as "surfaces... as appropriate," and v1 genuinely has only one.
3. **Full manual accessibility/responsive/dark-mode verification in a real browser was not performed** in this environment — only the structural primitives (roles, `aria-*`, real buttons) that automated testing can prove were verified. Documented here rather than claimed.
4. **The fixed 6-site candidate roster (§1/§3) is the core architectural resolution of this ticket's central preflight gate** — not a temporary placeholder. If a future ticket wants per-user "nearby" Aurora candidates instead of a fixed national roster, that will require a deliberate, separately-scoped canonical-candidate-discovery mechanism (a new endpoint or an existing-endpoint extension), which is exactly the kind of change this ticket's own scope boundaries defer.
5. **`northern_lights_upgrade_clicked`/`_card_viewed` etc. carry `band` but never the numeric `score`**, by design (§8) — if a future ticket wants score-based analytics segmentation, that is a new, separate product decision, not an oversight here.

No STOP condition was ultimately triggered — the one gate the prompt anticipated (candidate source safety) was resolved concretely per §1/§3.

## 14. Confirmation

Ticket 1–3 code/contracts unchanged; no new backend route or API; no persisted rankings; no client-side scoring/re-ranking (`best`/`alternatives` are rendered in the exact order Ticket 3 returns them, verified in tests); no new npm dependency; no `.tsx`/TypeScript. `docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**
