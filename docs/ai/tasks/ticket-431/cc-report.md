# #431 — CC report (approved-prompt-v1.md)

`CURRENT.md` moved READY_FOR_CC → CC_IN_PROGRESS first. Working tree at start: clean except the ticket-431 workflow documents. No commit, push, deployment or issue closure performed.

## 1. Pre-write audit (§1 of the approved prompt)

Independently re-read, before any write, exactly the files the preflight named plus two it didn't:

- `src/config/features.js`: confirmed `northernLights: { tier: "pro", preview: true, label: "Northern Lights" }` and the comment "the underlying `/api/aurora-decision` request/response is identical for both" tiers.
- `src/components/NorthernLightsThreeNight.jsx`: confirmed the exact conflation — `const gate = isFeatureAvailable(...); const isPro = !!gate.available; const tier = isPro ? "pro" : "free";` (then-current lines 146-148) — and confirmed `northern_lights_ranking_viewed`/`northern_lights_map_viewed` hardcoded the literal `"pro"` directly, with no `tier` variable involved at those two call sites at all.
- `src/components/AuroraNightOutlook.jsx`: confirmed `isPro` gates reason summaries, the "best on {when} at {name}" line vs. generic copy, the entire details/ranking/map block, and both teaser paths (`LockedValue` for landing, `FreeValueBlock` for homepage, the latter additionally gated `!loadingMe`).
- `src/lib/auroraDisplaySelection.js`: confirmed `selectAuroraDisplay`'s own doc comment already states its `isPro` parameter is "presentation-only... never affects which locations qualify."
- `src/hooks/useAuroraThreeNight.js`: grepped for `isPro`/`entitlements`/`tier` — zero matches, confirming the three-night controller is structurally tier-independent.
- Mounting: confirmed via grep that `App.jsx` and `NorthernLightsLanding.jsx` are the only two mount sites for `NorthernLightsThreeNight`, and `NorthernLightsCard` (legacy) is imported nowhere outside its own file except for the re-exported `CARD_SHELL_CLASS` constant.
- **Beyond the preflight**: read `src/pages/Pricing.jsx`, `src/pages/PricingInfo.jsx`, and `src/i18n/translations.pricing.js` in full to confirm Jonesy's four flagged strings (`pricingInfoAuroraFreeBody`/`ProBody`/`Title`, `pricingFeatureAurora`, `pricingAuroraLearnMoreLink`) in their actual rendered context. Also found, independently (not flagged by Jonesy), a fifth directly contradictory claim: `aboutAuroraProNote` ("Pro adds named locations, reasons and place comparison when results support them.") in `src/i18n/translations.common.js`, rendered on `About.jsx` — audited and corrected alongside the other four.
- Read `src/components/NorthernLightsCard.jsx` and its two test files in full: confirmed it independently re-derives the same `isPro`-from-gate pattern and hardcodes `tier: "pro"` on its own ranking/map events — i.e. the same conflation bug exists in this unmounted legacy component. Decision: left its production code untouched (out of this ticket's stated scope — it is not part of the active journey), but updated its tests, since they exercise the real, now-changed `isFeatureAvailable` registry function directly (see §5).

## 2. Implementation (§1-§3 of the approved prompt)

**`src/config/features.js`**: added `export const NL_FREE_EXPERIMENT_ID = "northern_lights_free_v1"`; added `freeDuringExperiment: true, experimentId: NL_FREE_EXPERIMENT_ID` to the `northernLights` entry (`tier: "pro"` left in place as the documented real entitlement model, for rollback); `isFeatureAvailable()` now checks `def.freeDuringExperiment` before the `requires_pro` denial, returning `{available: true, reason: "experiment_free", experimentId}`. No other feature touched; no global Pro grant; no entitlements mutation.

**`src/components/NorthernLightsThreeNight.jsx`**: `hasNLAccess` (renamed from the conflated `isPro`) now comes from the gate above; `tier` now comes from `getUserTier(entitlements)` directly, never derived from access. The two hardcoded `tier: "pro"` literals on `ranking_viewed`/`map_viewed` now use the real `tier`. `business_model_experiment: NL_FREE_EXPERIMENT_ID` added to all nine events in the experiment note's table. `handleUpgrade` and the `onUpgrade` prop are removed entirely; `hasNLAccess` is passed to `AuroraNightOutlook` as its existing `isPro` prop (that prop's own name/contract was already correctly "presentation-only," per its doc comment, so it was not renamed downstream — only the upstream variable that fed it, which is where the conflation actually lived).

**`src/components/AuroraNightOutlook.jsx`**: `LockedValue` and `FreeValueBlock` components deleted, along with the `onUpgrade`/`surface`/`loadingMe` props and the `isHomepage`/`showHomepageFreeValue` variables that became fully unused once those two render branches were removed (confirmed via grep: zero remaining references after the edit).

**`src/pages/NorthernLightsLanding.jsx`**: the Free-only lower conversion `<section>` and its `handleValueSectionCta` function are removed. Since nothing else on this route needed login/checkout, `useLoginFlow`, `useCheckoutFlow`, `LoginModal`, `useToast`/`ToastHub`, and `useNavigate` are also removed as a direct, mechanical consequence (not independent cleanup) — `useMe`/`entitlements`/`loadingMe` are kept, since `aurora_landing_viewed`'s genuine-tier attribution and the module's own entitlement-resolution gating still need them. `business_model_experiment` added to `aurora_landing_viewed`.

**`src/App.jsx`**: removed `onUpgrade={startCheckout}` from the one Northern Lights mount site only; `startCheckout` itself is untouched and still passed to every other Pro feature on the page (Route Planner, comparison, leaderboard, forecast table) — confirmed via grep that those five other call sites are unmodified.

**Pricing copy** (§2's "audit user-facing NL copy... for false promises that payment is required"):
- `Pricing.jsx`: removed the `pricingFeatureAurora` bullet from all four plan feature arrays (yearly/monthly/pass30/passyear) — a structural fix, not a wording fix, since no rewording of a line *inside a paid plan's own benefit list* can make it non-misleading once the benefit is free for everyone.
- `pricingAuroraLearnMoreLink` (EN/IS): "...on Pro" → dropped, in both the translation file and as the literal default-text fallback in `Pricing.jsx`.
- `pricingInfoAuroraTitle`: "same assessment, more detail in Pro" → "same assessment and detail for everyone" (EN/IS). `pricingInfoAuroraFreeBody` now equals `pricingInfoAuroraProBody` (both EN/IS) — the two-column Free/Pro tile in `PricingInfo.jsx` is left structurally unchanged (no JSX edit), now showing identical, truthful content in both columns.
- `auroraInfoSameAssessment` (shared key, `translations.northernLights.js`): "Pro reveals more information and comparison, not a better prediction" → "with the same level of detail and comparison" (EN/IS) — this single shared-string edit also fixes the identical sentence on `About.jsx` and the `Pricing.jsx` fine-print, with no further file changes needed there.
- `aboutAuroraProNote` (EN/IS, found independently, not in Jonesy's list): "Pro adds named locations..." → "Named locations, reasons and place comparison, when results support them." (dropped the "Pro" framing).

No other NL-adjacent copy was touched; no layout/redesign; `pricingFeatureAurora`'s translation string itself is left defined (unused) rather than deleted, to keep the diff to exactly the contradiction.

## 3. Scope boundaries confirmed held

No scoring/recommendation algorithm, normalization, raw data, or backend change. `useAuroraThreeNight.js`, `selectAuroraDisplay`'s qualifying-band/canonical-order/map rules, the six-candidate set, the three-night window, and freshness-expiry policy are byte-for-byte untouched (confirmed: `git diff` shows zero changes to any of `useAuroraThreeNight.js`, `auroraDisplaySelection.js`, `auroraDecisionClassify.js`, `auroraMultiNightPolicy.js`, `auroraFreshnessPolicy.js`, `hazardWindow.js`, or any `/api/aurora-decision` server file). No new libraries, no TypeScript, no explicit import extensions. No affiliate CTA or campaign. Unrelated premium features (`windDirection`, `shelterIndex`, `campsiteComparison`, `bestRoutePlanner`, `topSitesCount`, `forecastDays`, `weatherFinderResultsCount`) confirmed exactly unchanged, both by code inspection and by a new dedicated test file (§5).

## 4. Validation — exact commands and results

- `npx vitest run` (full suite) → **147 test files, 2036 tests, all passed.**
- `npm run lint` (whole repo) → exit 0, no output.
- `npm run build` → succeeded, `built in 7.63s` (pre-existing >500kB chunk-size warning, unrelated to this ticket).
- New/updated test files touching Northern Lights, pricing, or the feature registry (all included in the full-suite run above, also independently re-run in isolation after each edit): `src/config/features.test.js` (new, 12 tests), `src/components/NorthernLightsThreeNight.test.jsx`, `src/components/NorthernLightsThreeNight.round5.test.jsx`, `src/pages/NorthernLightsLanding.test.jsx`, `src/pages/NorthernLightsLanding.cardWiring.test.jsx`, `src/pages/NorthernLightsLanding.homeHandoff.test.jsx`, `src/pages/NorthernLightsLanding.metadata.test.jsx`, `src/components/NorthernLightsCard.test.jsx`, `src/components/NorthernLightsCard.landingVariant.test.jsx`, `src/pages/Pricing.auroraFeature.test.jsx`, `src/pages/PricingInfo.auroraSection.test.jsx`, `src/pages/About.test.jsx`, `src/App.northernLightsAnchor.test.jsx`, `src/App.northernLightsHomepageCheckout.test.jsx`.
- Prior-ticket regressions (#423/#425/#426/#427) are covered by the full-suite run above — all their dedicated files (e.g. `NorthernLightsThreeNight.round5.test.jsx`, `NorthernLightsLanding.homeHandoff.test.jsx`, `App.northernLightsAnchor.test.jsx`, `auroraNightLabel.test.js`) pass unchanged in substance (only payload/content assertions updated where this ticket's own change required it, per §5).

## 5. Test changes, explicitly itemized (§"Tests and validation")

- **New**: `src/config/features.test.js` — anonymous/Free/Pro access to `northernLights`; unrelated limit- and tier-type features' gating proven exactly unchanged; unknown-feature-key behavior.
- **Obsolete Free-lock assertions updated** (old assumption: Free is locked out of detail/ranking/map/best-location-name → new assumption: Free matches Pro) in: `NorthernLightsThreeNight.test.jsx`, `NorthernLightsThreeNight.round5.test.jsx`, `NorthernLightsLanding.test.jsx`, `NorthernLightsLanding.homeHandoff.test.jsx`, `NorthernLightsCard.test.jsx`, `NorthernLightsCard.landingVariant.test.jsx`, `App.northernLightsAnchor.test.jsx`, `App.northernLightsHomepageCheckout.test.jsx` (the last of these was rewritten in full — its entire original purpose, verifying the now-removed real checkout/login adapter wiring, no longer applies, so it now verifies the adapter is never reached instead).
- **Removed** (tested a mechanism that no longer exists, not merely re-asserted): the Free-upgrade-click test in `NorthernLightsThreeNight.test.jsx`; the landing CTA/onUpgrade describe block in `NorthernLightsLanding.cardWiring.test.jsx`; the value-section CTA describe block in `NorthernLightsLanding.homeHandoff.test.jsx`; the "entitlement-loading guard" describe block (Free-value-block show/hide) in the same file, replaced with a narrower "selection survives entitlement resolution" block that keeps the still-real state/date preservation coverage.
- **Independent (not state/date/freshness) protections explicitly preserved, unchanged**: loading/expired/stale/unavailable/no-darkness classification branching, tab-selection atomicity, details-expanded persistence across night switches, the IS-homepage no-English-link rule, the forced-English landing contract, deep-link date normalization, browser back/forward re-selection, and the #427 deterministic-weekday assertions (only their `nl3-free-value`-testid lookups were redirected to the main result body, since that testid's element no longer exists — the underlying weekday-translation assertion itself is unchanged).
- Real shared-module/homepage/landing tests (`NorthernLightsLanding.homeHandoff.test.jsx`) confirm, with the real (unmocked) `NorthernLightsThreeNight`/`AuroraNightOutlook`/`selectAuroraDisplay`, that anonymous and logged-in Free match Pro on identical deterministic fixtures: same named best location, same reason tiles, same ranked list once details are opened, same map, same IS-homepage no-link rule, same EN-homepage/landing hand-off.
- Analytics tests assert: `business_model_experiment` present on the nine events listed in the experiment note; `northern_lights_ranking_viewed`/`_map_viewed` report the genuine tier (not a hardcoded `"pro"`) for both a Free and a Pro render; no purchase-click event of any kind fires from any Northern Lights surface any more; unrelated events (`northern_lights_card_viewed`'s other fields, `aurora_landing_viewed`'s dedup/timing) unchanged.

## 6. Browser verification

Real Vite dev server (`npm run dev`) + Playwright Chromium, driven by an ad hoc script (not a committed spec file — removed after the run; evidence retained under `outputs/ticket-431-browser-evidence/`). Network stubbed deterministically: `/api/aurora-decision` (six fixed candidates, bands excellent/good/good/fair/fair/fair), `/api/me` (Free: `user: null`, `entitlements.pro: false`; Pro: a logged-in user with `entitlements.pro: true`), `/api/campsites`, `/api/forecast`. Clock pinned to `2026-10-01T20:00:00Z`.

12 runs: {mobile 375px, desktop 1280px} × {IS homepage, EN homepage, EN landing (`/en/northern-lights`)} × {Free, Pro}.

**Result for all 12 combinations, identically**: no paywall wording detected in the initial render (`hasPaywallWordBefore: false` — checked for "Pro"/"með Pro"/"on Pro"/"í Pro" adjacent to any Northern Lights mention); clicking the real details toggle opened details successfully (`detailsOpened: true`) with no login dialog ever appearing (`hasLoginDialogAfterOpeningDetails: false`); the ranked-location map rendered (`mapPresent: true`).

Two screenshots examined directly (not just the programmatic flags above):
- `desktop-free-is-homepage-2-details.png`: IS homepage, Free, desktop — shows "Bestu skilyrðin í kvöld: Test Spot 1" (named best location), the full 6-location ranked list with names and comfort labels, and the map with a "Test Spot 1" marker. No lock icon, no "Pro" text, no upgrade button anywhere in the module.
- `mobile-free-en-landing-2-details.png`: EN landing, Free, mobile (375px) — shows "Best conditions tonight: Test Spot 1", reason tiles ("Meaningful aurora activity forecast", "Clear sky"), and an expanded details list. No lower conversion section renders on this route any more (confirmed both by this screenshot's absence of it and by the removed-section tests in §5).

`results.json` (all 12 runs' structured flags) and all 24 screenshots (`*-1-initial.png`/`*-2-details.png` per combination) are retained in `outputs/ticket-431-browser-evidence/`.

## 7. Experiment documentation and launch status

Full event inventory, payload changes, before/after comparability limitations, rollback scope (including the explicit caveat that the fast flag-flip rollback does **not** restore the deleted Free upgrade CTA, only the pre-#431 access gate), baseline (as supplied in the issue, not independently fetched), and launch checklist are in `docs/ai/tasks/ticket-431/experiment-note.md`.

**Launch status: NOT DEPLOYED.** No deployment, no affiliate/campaign action, and no external GA4 configuration change was performed in this execution. Exact UTC launch datetime, commit SHA, and deployment identity remain pending fields in the experiment note until an owner-controlled deployment happens. The GA4 custom-dimension registration needed for `business_model_experiment` to be usable in GA4 Explore/reports is flagged as a separate, pending, owner-controlled action — code emission alone does not register it.

## 8. Status (v1)

Not committed, not pushed. `git status --short` confirms the file list matches §2/§5/§6/§7 above exactly, plus `docs/ai/tasks/ticket-431/` and `outputs/ticket-431-browser-evidence/` (both untracked). `CURRENT.md` set to CC_COMPLETE with this report's path populated. Result review: `docs/ai/tasks/ticket-431/result-review.md`. Task not closed by CC.

---

# v2 — corrective execution (approved-prompt-v2.md)

v1 above is left unmodified; this section documents the two corrections required by Ripley's post-PASS REVISE final-assessment (see `result-review.md` Round 1: "loading-time interaction tier is guessed as Free and existing map location clicks are untracked"). `CURRENT.md` moved READY_FOR_CC (v2) → CC_IN_PROGRESS before any edit.

## v2.1 Scope

Two corrections only, both within the already-approved v1 scope:

1. **Interaction-tier guessing while `loadingMe` is true.** The three *immediate*-interaction events — `northern_lights_night_selected`, `northern_lights_details_opened`, and the recommended-night CTA's pair of calls — previously recorded the real `tier` (`getUserTier(entitlements)`), which defaults to `"free"` before `/api/me` resolves, i.e. a logged-in Pro user clicking fast enough was mislabeled `"free"`. Fixed by introducing `const interactionTier = loadingMe ? "unknown" : tier;` in `NorthernLightsThreeNight.jsx`, used only at these interaction call sites. No retroactive relabeling, no event deduplication change — the event still fires once, immediately, just with an honest `"unknown"` value when the real tier isn't known yet, resolving to the genuine tier on the next interaction after `/api/me` returns.
2. **Untracked map marker click.** The aurora map's `onSelect` was wired to a no-op (`() => {}`) in `AuroraNightOutlook.jsx`. Added `handleLocationSelect(locationId)` in `NorthernLightsThreeNight.jsx`, firing a new event `northern_lights_location_selected` with `{ location_id, selected_date, days_ahead, source: surface, user_tier: interactionTier, business_model_experiment: NL_FREE_EXPERIMENT_ID }`, wired through `AuroraNightOutlook`'s new `onLocationSelect` prop to the real, pre-existing, unmodified `NorthernLightsMap.jsx` → `MapView.jsx` marker click handler. Fires only on an actual user click on a real Leaflet marker — never on map mount, render, popup-open, or any exposure path.

**Explicitly preserved, unchanged**: all five exposure effects (`card_viewed`/`unavailable_viewed`/`stale_viewed`, `ranking_viewed`, `map_viewed`, `best_night_viewed`) keep their existing `if (loadingMe) return;` guard and the genuine `tier` (not `interactionTier`) — they were already correct in v1 and the approved v2 prompt explicitly required leaving them untouched. No changes to `MapView.jsx` (generic campsite-map click/forecast-load behavior fully preserved), no changes to scoring/ranking/eligibility, no changes to any other feature's gate, no backend/library/TypeScript changes.

## v2.2 Files changed

- `src/config/features.js` — unchanged (v1 only).
- `src/components/NorthernLightsThreeNight.jsx` — added `interactionTier`; `night_selected`/`details_opened`/recommended-night-CTA call sites now use `interactionTier` instead of `tier`; added `handleLocationSelect`; passes `onLocationSelect={handleLocationSelect}` to `AuroraNightOutlook`; header comment extended documenting both v2 corrections and their Round-1-REVISE origin.
- `src/components/AuroraNightOutlook.jsx` — added `onLocationSelect` prop (default no-op), forwarded to `NorthernLightsMap`'s `onSelect` in place of the previous inline no-op; header comment notes this component still never calls `trackEvent` itself.
- `src/components/NorthernLightsMap.jsx`, `src/MapView.jsx` — read-only confirmation, zero changes. `MapView.jsx`'s existing `eventHandlers.click` (`onSelect?.(site.id)` then, for non-aurora mode only, forecast load) is the exact, pre-existing mechanism the new event now rides on.
- **New**: `src/components/NorthernLightsThreeNight.interactionTier.test.jsx` — 10 tests across two groups (see v2.3).

## v2.3 Validation — exact commands and results

- `npx vitest run` (full suite) → **148 test files, 2046 tests, all passed** (10 new tests over the v1 baseline of 147/2036).
- Targeted re-runs (all included in the full-suite count above, also run in isolation during iteration): `NorthernLightsThreeNight.interactionTier.test.jsx` (new, 10/10), `NorthernLightsThreeNight.test.jsx`, `NorthernLightsThreeNight.round5.test.jsx`, `NorthernLightsLanding.homeHandoff.test.jsx`, `AuroraNightOutlook`-adjacent suites — all pass unchanged, since their own fixtures default to `loadingMe: false`, where `interactionTier === tier` exactly as in v1.
- `npm run lint` → exit 0, no output.
- `npm run build` → succeeded.

New test file, two groups:
1. **"interaction events never guess a tier while `loadingMe` is true"** (5 tests) — `night_selected` and `details_opened` record `"unknown"` while loading and the genuine tier (free or pro) once `/api/me` resolves, tested via `rerender()` with the *same* `fetchImpl` reference (not a fresh mock) to simulate an in-place entitlement-resolution update without resetting the underlying hook state; the recommended-night CTA fires both its events as `"unknown"` while loading; pre-existing exposure events remain correctly suppressed while loading (unaffected by v2, confirming no regression).
2. **"`northern_lights_location_selected`: the real aurora map marker click"** (5 tests) — fires exactly once with correct `location_id`/`selected_date`/`days_ahead`/`source` on an actual marker click and never on exposure alone; records `"unknown"` tier for a click before resolution; reflects the currently-selected night at click time; `source` reflects the actual mount surface; generic map wiring (locations/selectedId props) confirmed unchanged.

## v2.4 Browser verification

Real Vite dev server + Playwright Chromium, ad hoc script (`ticket-431-v2-marker-check.mjs`, run from the project root for module resolution against the project's own `node_modules`, then deleted after the run — not a committed spec file, same convention as v1). `/api/aurora-decision` stubbed with six fixed candidates; `/api/me` stubbed Free (`user: null`, `entitlements.pro: false`) and Pro (`entitlements.pro: true`) per run. Clock pinned to `2026-10-01T20:00:00Z`. Route: `/en/northern-lights`.

**Methodology note, stated plainly**: the first four attempts failed and are worth recording so the fixture choice isn't mistaken for an accident. Six fixture candidates originally used tightly-clustered coordinates (~0.01° apart); Leaflet's `MarkerClusterGroup` collapsed them into a single cluster icon in headless Chromium that does not forward individual-marker clicks (`markerCount: 1`, zero events). Zooming in programmatically before clicking (up to 8× on the "+" control) partially un-clustered markers but scattered them toward the map edges, and a subsequent raw-coordinate click (`force: true`, which skips Playwright's auto-scroll) landed outside the 900px viewport entirely. The fix: replaced the fixture's coordinates with six real, geographically separated Iceland towns (Reykjavik/Akureyri/Egilsstaðir/Ísafjörður/Höfn/Mývatn), so Leaflet renders six genuinely distinct, individually clickable markers at the default view with no zooming required, then used a plain `scrollIntoViewIfNeeded()` + `click()` with no forcing.

**Result, both tiers**: `markerCount: 6`, `markerClicked: true`, exactly one new `northern_lights_location_selected` console event per run (`eventsBeforeClick: 5` → `totalEventsAfterClick: 6`), with the correct `location_id`, `selected_date: "2026-10-01"`, `days_ahead: 0`, `source: "landing"`, and the genuine `user_tier` (`"free"` / `"pro"` respectively). Full structured results retained at `outputs/ticket-431-browser-evidence/v2-marker-click-results.json`.

Four screenshots examined directly, all retained in `outputs/ticket-431-browser-evidence/`: `v2-free-landing-map-before-click.png` and `v2-pro-landing-map-before-click.png` (module renders correctly — tabs, status pill, named best location, reason tiles, expanded ranked location list, map visible, no marker popup open yet); `v2-free-landing-map-after-click.png` and `v2-pro-landing-map-after-click.png` (identical for both tiers — clicking the Test Spot 1 marker opens its popup: "Test Spot 1 — Aurora-viewing conditions: Excellent viewing conditions", confirming the click is real, lands on the correct marker, and is visually consistent with the console-event evidence above).

**Honest discrepancy noted, not resolved by further investigation**: the captured console preview text for `northern_lights_location_selected` does not visibly show `business_model_experiment` in its printed object (e.g. `"...source: landing, user_tier: free}"` with no trailing field), while the production code does pass `business_model_experiment: NL_FREE_EXPERIMENT_ID` as the call's last property. Working hypothesis: Chrome/Playwright's console object-preview truncates sufficiently wide inline previews — this is a *display* artifact of the capture method, not evidence of a missing field, because the equivalent **exact-match** Vitest assertion (v2.3's second test group, test 1) checks the full literal payload object including `business_model_experiment: NL_FREE_EXPERIMENT_ID` and passes. Flagged here rather than silently omitted; not independently re-verified beyond the unit-test cross-check and this reasoning.

Do not claim live GA4 ingestion from any of the above — this is local DEV-mode `console.log` capture only, exactly as in v1.

## v2.5 Documentation updated

`docs/ai/tasks/ticket-431/experiment-note.md` — added `northern_lights_location_selected` to the event inventory with its explicit no-previous-baseline caveat; documented the new `"unknown"` interaction-tier semantics for `night_selected`/`details_opened`/the recommended-night CTA/`location_selected` while `loadingMe` is true. v1 content retained, not overwritten.

## v2.6 Status

Not committed, not pushed, not deployed. No scoring/candidate/freshness, unrelated premium-gate, backend, checkout, library, or global-analytics change. `git status --short` additions beyond v1: `src/components/NorthernLightsThreeNight.interactionTier.test.jsx` (new), modifications to `NorthernLightsThreeNight.jsx`/`AuroraNightOutlook.jsx`, new files under `outputs/ticket-431-browser-evidence/` (`v2-*`), this report and `experiment-note.md` updates, `docs/ai/CURRENT.md`. `CURRENT.md` set to CC_COMPLETE with this report's path. Jonesy appends the next result review. Task not closed by CC.
