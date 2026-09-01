# CC Report — Ticket 398 (Northern Lights card: dark "evening sky" visual/information-hierarchy redesign)

Executed against: `docs/ai/tasks/ticket-398/approved-prompt-v1.md` (v1, READY_FOR_CC → CC_IN_PROGRESS).

## 1. Mandatory preflight audit

Read before editing: `src/components/NorthernLightsCard.jsx` + `NorthernLightsCard.test.jsx` (Ticket 397 state), `src/components/NorthernLightsMap.jsx`, `src/MapView.jsx`, `src/lib/auroraDisplaySelection.js` + its tests, `src/lib/auroraBandPresentation.js`, `src/hooks/useAuroraDecision.js`, `src/lib/auroraDecisionClassify.js`, `src/lib/auroraSeason.js`, `src/config/auroraCandidates.js`, `src/i18n/translations.northernLights.js`, `src/config/features.js`, `src/hooks/useThemeClass.js`, `src/hooks/useLanguage.js`, `src/hooks/useLocalStorageState.js`, `src/hooks/useMe.js`, `src/hooks/useCampsites.js`, `playwright.config.js`, `tests/e2e/footer-blog-link.spec.js`, `package.json` (dependency list), `ls src/components/icons/weather/`.

### Confirmed audit findings (not assumed)

- **No Aurora-specific icon precedent exists.** The only hand-rolled icon components in the repo (`src/components/icons/weather/Icon*.tsx`, `index.ts`) are all `.tsx` — replicating that pattern is forbidden by the project's absolute `.jsx`-only / no-TypeScript rule. `lucide-react@^1.7.0` is already an installed dependency and already used elsewhere (`src/pages/Landing.jsx` imports `MapPin, CloudRain, Wind, ArrowRight, Route, ShieldCheck, Check, AlertTriangle`). Resolution: use `lucide-react`'s `Sparkles`, decorative (`aria-hidden`) since the adjacent card title already names the feature. No new dependency added.
- **Free/Pro disclosure (pre-398)**: Free received only the coarse headline/body text and an upgrade CTA; Pro could expand a details panel showing the ranked list, map, and full reasons. This shape is preserved unchanged by this ticket — only the presentation styling and the collapsed-state hierarchy around it changed.
- **Canonical reason codes** (from `src/lib/auroraScoring.js`, consumed unchanged): `meaningful_activity`, `low_activity`, `clear_sky`, `partial_cloud`, `heavy_cloud`, `cloud_hard_cap_applied`, `precipitation_reduced_visibility`, `moonlight_reduced_visibility`. Per approved prompt §5 ("preferably activity and sky/cloud visibility"), the new reason-summary tiles deliberately narrow this to activity + sky/cloud codes only (`src/lib/auroraReasonSummaries.js`) — precipitation/moonlight remain visible in the existing expanded full-reasons list, just never summarized into a tile.
- **Playwright feasibility for the mandatory §12 visual verification**: `playwright.config.js`'s `webServer` runs plain `npm run dev` (Vite only, no real backend/Neon). `tests/e2e/footer-blog-link.spec.js` established the exact reusable pattern needed — a broad `page.route("**/api/**")` catch-all plus specific overrides, evaluated last-registered-first. This is sufficient to stub `/api/aurora-decision` with controlled fixture bodies and `/api/me` with a controlled `entitlements.pro` value, so a full real-browser visual pass was feasible with zero new infrastructure. **No STOP was required.**

## 2. Scope confirmation

This is a presentation/copy-only change. `src/lib/auroraDisplaySelection.js`, `src/lib/auroraBandPresentation.js`, `src/hooks/useAuroraDecision.js`, `src/lib/auroraDecisionClassify.js`, `src/lib/auroraSeason.js`, `src/config/auroraCandidates.js`, `src/MapView.jsx`, `src/components/NorthernLightsMap.jsx`, and every Ticket 1–3 backend file were re-diffed against their pre-398 versions after finishing — **none were modified**. No new score/probability/verdict is computed in React; every visual-state grouping and reason-tile selection reads only fields the canonical response already provides. Free/Pro gating remains presentation-only — the request itself is unchanged. No STOP condition was triggered.

## 3. Files changed

**New:**
- `src/lib/auroraVisualState.js` — pure grouping of the canonical band (`excellent`/`good`/`fair`/`poor`/`very-poor`) into a four-value visual-state model (`good`/`fair`/`poor`/`neutral`) plus per-state pill/headline/body translation-key + Tailwind class tokens. Deliberately independent of `auroraBandPresentation.js`'s `DEFAULT_BAND="fair"` fallback — an unknown/missing band gets its own explicit `neutral` state, never silently inherited as `fair` (verified by a dedicated test).
- `src/lib/auroraReasonSummaries.js` — deterministic selection of at most two reason-summary codes (one activity, one sky/cloud) from the canonical `reasons` array, capped, never fabricated.
- `src/config/auroraNewBadge.js` — single named constant `AURORA_NEW_BADGE_ENABLED` (default `true`) controlling the temporary "New"/"Nýtt" badge, with a documented review date (`AURORA_NEW_BADGE_REVIEW_DATE = "2026-09-30"`) next to the flag. Deliberately not wall-clock/date-conditional logic, to keep rendering deterministic for tests/screenshots.
- `src/lib/auroraVisualState.test.js` (8 tests), `src/lib/auroraReasonSummaries.test.js` (8 tests).
- `tests/e2e/northern-lights-card-visual.spec.js` — the mandatory real-browser visual verification spec (7 tests; see §7/§8).

**Modified:**
- `src/components/NorthernLightsCard.jsx` — full visual/structural rewrite (logic/hooks/analytics/gating semantics unchanged, see §5): dark "evening sky" shell (`CARD_SHELL_CLASS`) used in every state including loading/error; new `CardHeader` (Sparkles icon + title + New badge + status pill); a restrained `aria-hidden` accent glow shown only for resolved success/partial states, colored per visual state; qualifying-result hierarchy is header → headline → supporting sentence (Pro: `nlBestTonight` with the real best-location name, kept visible while collapsed; Free: the shared visual-state body copy) → up to two Pro-only reason-summary tiles (visible collapsed) → high-wind note → stale/partial notices → one primary action (Free: upgrade CTA; Pro: `nlCtaGood`/`nlCtaFair` collapsed toggle, `nlDetailsHide` when expanded); all-poor path reuses the shared `poor` visual-state tokens instead of separate copy (see §9.1) and keeps the best-of-poor identity behind the same details disclosure, never promoted into the headline.
- `src/i18n/translations.northernLights.js` — added (EN+IS): `nlNewBadge`, `nlPillGood`/`nlHeadlineGood`/`nlBodyGood`/`nlCtaGood`, `nlPillFair`/`nlHeadlineFair`/`nlBodyFair`/`nlCtaFair`, `nlPillPoor`/`nlHeadlinePoor`/`nlBodyPoor`, `nlPillNeutral`/`nlHeadlineNeutral`/`nlBodyNeutral`, `nlBestTonight` (`{name}` interpolation). Removed (EN+IS, confirmed no remaining consumer via `grep -rln` before deletion): `nlAllPoorTitle`, `nlAllPoorBody` (see §9.1). All other keys — `nlBandExcellent`…`nlBandVeryPoor` (precise per-location band labels, still shown in the ranked list and the all-poor best-of-poor line), `nlReason*`, `nlFreeHint`, `nlUpgradeCta`, `nlDetailsShow`/`nlDetailsHide`, `nlViewingWindowLabel`/`nlNationalReferenceCaveat`, `nlQualifyingHeading`, `nlWarningPartial`/`nlWarningStale`, `nlNoDarknessTitle`/`nlNoDarknessBody`, `nlUnavailableBody`/`nlContractDefectBody`/`nlTransportErrorBody`/`nlRetry`, `mapAuroraConditionLabel`/`mapAuroraLegendTitle` — unchanged.
- `src/components/NorthernLightsCard.test.jsx` — fully rewritten for the new render structure and the approved prompt's 14 required test categories (see §6).

No dependency was added (only an already-installed one, `lucide-react`, gained a new import site). No `.tsx`/TypeScript. `MapView.jsx`, `NorthernLightsMap.jsx`, `auroraDisplaySelection.js`, `auroraBandPresentation.js`, the six-location roster, and every Ticket 1–3 file are byte-for-byte unchanged.

## 4. Visual-state model — exact behavior

`auroraVisualState(band)`: `excellent`/`good` → `good`; `fair` → `fair`; `poor`/`very-poor` → `poor`; anything else (`undefined`/`null`/unrecognized string) → `neutral`, via its own `?? AURORA_VISUAL_STATES.NEUTRAL` fallback, independent of `auroraBandPresentation.js`'s `DEFAULT_BAND="fair"`. This grouping is display-only: canonical band, list eligibility (`selectAuroraDisplay`'s `excellent|good|fair` qualifying rule), map visibility rule, analytics `band`/`resultState` values, and scoring are all read from the untouched canonical value elsewhere in the same component — the visual-state grouping never substitutes for or mutates them. The precise band label (`nlBandExcellent`…`nlBandVeryPoor`) is still shown verbatim in the ranked list and the all-poor best-of-poor line, per §4's "preserve precise band label wherever currently disclosed."

The `neutral` visual state's tokens exist in `auroraVisualState.js` but are not currently reachable through `NorthernLightsCard.jsx`'s render logic, because the pill/headline/body driven by `visualTokens` is only computed for `isResultState` (`success`/`partial`), and a resolved success/partial outcome's displayed band is always either `display.qualifyingLocations[0].band` (guaranteed `excellent/good/fair` by `selectAuroraDisplay`'s own filter) or `display.bestAvailable.band` (the canonical `best.band`, which Ticket 3's contract always populates for `success`/`partial`). The `neutral` case's non-inheritance is nonetheless directly tested at the helper level (`auroraVisualState.test.js`) per approved-prompt §11's explicit requirement to prove no silent `fair`-fallback inheritance, independent of whether today's component wiring can currently reach it end-to-end.

## 5. Required targeted tests — status (approved prompt §11, 14 categories)

All 14 are covered, in `NorthernLightsCard.test.jsx` unless noted:

1. Band → visual-state mapping incl. explicit neutral case, proven distinct from `fair` — `auroraVisualState.test.js`.
2. Pill/headline/body/accent/CTA agreement per state × IS/EN — the `#398 visual-state...IS and EN` describe block (real translation dictionary, not the identity `t`).
3. Dark-shell identity in both themes — shell-class assertions (background/text stable, `dark:` border/shadow variants present and distinct from the light-mode values) + real-browser screenshots (§7).
4. Pro qualifying: best-name-visible-while-collapsed + Ticket-397-compliant expanded details (ranked list order, map, full reasons, viewing-window caveat) — `Pro: keeps the best-location name visible while collapsed` block.
5. Free non-disclosure — name/score/coordinates/reasons/map/ranked-list all asserted absent, including from `document.body.textContent` (not just a hidden DOM check for a specific query).
6. All-poor Free/Pro correctness — Free gets no identity/CTA; Pro gets at most one `bestAvailable` behind the disclosure, never the six-place list/map, even with a persisted `detailsExpanded=true` from an earlier session.
7. Deterministic capped-at-two reason-summary selection — `auroraReasonSummaries.test.js` (priority order, cap, empty/no-match, purity, determinism) + a component-level "omits reason tiles when none supported" test.
8. Loading/no-darkness/unavailable/transport/contract-defect neutral treatment — dedicated describe block; no pill, no accent glow, no upgrade CTA for any of these; contract-defect never leaks the raw unknown-ID list into the DOM.
9. Fresh/stale/partial/stale+partial truthfulness — both disclosures shown together for Free and Pro, and composed correctly with the all-poor path too.
10. New-badge flag-controlled, no analytics event — badge renders (flag default `true`), `trackEvent` mock asserted to contain no badge-related call name.
11. Exact-once analytics across rerender/language/theme/expansion — `card_viewed` fires once per resolved identity even across a `rerender` with different `lang`/`theme` props; `ranking_viewed`/`map_viewed` fire exactly once on first expand and not again on collapse/re-expand.
12. Accessibility — decorative icon `aria-hidden` with no competing `aria-label`; `role="status"`/`aria-live="polite"` on the result region; `aria-expanded`/`aria-controls` on both toggle buttons; text always carries state (asserted via real text content, not class/color alone).
13. Responsive structure — verified live in the browser at 320px (§7), no fixed-width assumptions in the component (`max-w`/`w-` classes are absent from the card shell).
14. Ticket 397 regression — mixed-band filter/order/cap-at-six, all-poor structural absence of list/map, map visibility rule (≥2 qualifying + ≥2 distinct bands shown, same-band hidden), map-analytics-only-when-shown — all re-verified against the redesigned component, still green.

## 6. Tests, lint, and build actually run

- **New pure-helper tests** — `npx vitest run src/lib/auroraVisualState.test.js src/lib/auroraReasonSummaries.test.js` → **16/16 passed**, 2 files.
- **`NorthernLightsCard.test.jsx`** (rewritten) — `npx vitest run src/components/NorthernLightsCard.test.jsx` → **44/44 passed**, 1 file. Three genuine test-authoring bugs were caught and fixed on the first real run against the finished component (not component bugs): (a) a leftover placeholder assertion (`not.toContain("a")`) in the all-poor visual-state test, replaced with a real `nlBodyPoor` assertion; (b) an incorrect assumption that reason-summary tiles are gated behind the details toggle — they are visible while collapsed by design (hierarchy item 4 is independent of item 5), so the test was corrected to assert the tile IS present collapsed and only the ranked list/map are gated; (c) after expanding, `nlReasonClearSky` legitimately appears twice (once as the collapsed tile, once in the expanded full-reasons list) — changed `getByText` to `getAllByText(...).toHaveLength(2)`.
- **`NorthernLightsMap.test.jsx`, `MapView.test.jsx`, `auroraDisplaySelection.test.js`, `auroraBandPresentation.test.js`, `auroraDecisionClassify.test.js`, `auroraSeason.test.js`, `features.test.js`** (none modified by this ticket) — `npx vitest run src/components/NorthernLightsMap.test.jsx src/MapView.test.jsx src/lib/auroraDisplaySelection.test.js src/lib/auroraBandPresentation.test.js src/lib/auroraDecisionClassify.test.js src/lib/auroraSeason.test.js src/config/features.test.js` → **48/48 passed**, 6 files — confirms no regression in Ticket 391/392/397's unchanged logic.
- **Full suite** — `npx vitest run` → **967/967 passed**, 84 files (up from 939/82 before this ticket — +28 tests, +2 files: `auroraVisualState.test.js`, `auroraReasonSummaries.test.js`).
- **Lint** — `npm run lint` → exit 0, no output.
- **Build** — `npm run build` → succeeded (`✓ built in 4.69s`). Same pre-existing "chunks larger than 500 kB" advisory notice as every prior run this session — unrelated to this ticket.
- **`git diff --check`** → exit 0. Output is only the repo's pre-existing "LF will be replaced by CRLF" autocrlf notices (on `docs/ai/CURRENT.md`, `NorthernLightsCard.jsx`, `NorthernLightsCard.test.jsx`, `translations.northernLights.js`) — these are informational `git` line-ending notices, not whitespace-error findings; `git diff --check` reported zero actual whitespace errors. `MapView.jsx` was not touched by this ticket and does not appear in this list at all, so its own pre-existing CRLF behavior (noted as a risk in the approved prompt) was never a factor here.

No command was skipped or reported as passing without actually running.

## 7. Mandatory real-browser visual verification (approved prompt §12)

Component DOM tests alone were judged insufficient for this explicitly visual ticket, per §12. A new Playwright spec, `tests/e2e/northern-lights-card-visual.spec.js`, was written using 100% pre-existing infrastructure (the `webServer`/`page.route()` pattern from `tests/e2e/footer-blog-link.spec.js` — no new route, page, or dependency) and **actually run**, not just written:

```
npx playwright test tests/e2e/northern-lights-card-visual.spec.js --reporter=list
```
Result: **7/7 passed** (after fixing one strict-mode locator collision on the first run — a same-named "See details" button exists elsewhere on the homepage in EN, `RoutePlannerCard`'s own disclosure toggle; the test now scopes its query to `page.getByTestId("nl-card")`).

Fixtures/viewports/states actually exercised, each with a real screenshot saved to `test-results/ticket-398/` (gitignored, not committed):

| State | Tier | Lang | Theme | Viewport | Screenshot |
|---|---|---|---|---|---|
| Good (excellent band) | Free | IS | light | 1280×900 | `good-free-is-light-desktop.png` |
| Good (excellent band), collapsed → expanded | Pro | EN | dark | 1280×900 | `good-pro-en-dark-desktop-{collapsed,expanded}.png` |
| Fair | Pro | IS | light | 320×720 | `fair-pro-is-light-mobile320.png` |
| All-poor | Free | EN | light | 1280×900 | `all-poor-free-en-light-desktop.png` |
| All-poor, expanded | Pro | EN | light | 1280×900 | `all-poor-pro-en-light-desktop-expanded.png` |
| Loading (5s artificial delay) | Free | IS | light | 1280×900 | `loading-is-light-desktop.png` |
| Unavailable (`domain_unavailable`) | Free | EN | dark | 1280×900 | `unavailable-free-en-dark-desktop.png` |

Language/theme were set deterministically via `page.addInitScript()` writing the app's real `localStorage` keys (`lang`, `theme` — confirmed exact JSON-encoded format by reading `useLocalStorageState.js`/`useLanguage.js`/`App.jsx`), plus `page.emulateMedia({ colorScheme })` for the dark-mode runs. The in-season date requirement was made deterministic with `page.clock.install({ time: new Date("2026-09-01T20:00:00.000Z") })` rather than relying on the real run date. `/api/aurora-decision` and `/api/me` (for `entitlements.pro`) were stubbed per-test with realistic fixture bodies built from the six real candidate IDs/names in `src/config/auroraCandidates.js`.

**I inspected four of the seven screenshots directly** (good/Free/light, good/Pro/dark/expanded, fair/Pro/mobile-320, all-poor/Pro/expanded) via the Read tool, confirming: the dark "evening sky" shell renders with visible border/shadow separation against both a light-mode and a dark-mode page background (never swapping to a light card background); the Sparkles icon, title, and "New"/"Nýtt" badge render in the header in every state; the status pill, headline, and (Pro) interpolated best-location name render correctly; reason tiles render collapsed; the expanded panel shows the full reasons list, viewing-window caveat, and correctly-ordered/labeled ranked list; at 320px the card has no horizontal overflow and the header wraps sensibly; the all-poor state shows the "Little hope tonight" / "Low chance tonight" poor-visual-state copy with the best-of-poor identity correctly hidden until expanded, then shown as "Best of the checked options (still poor): Camper Resort Reykjavík — Poor viewing conditions"; the unavailable state shows neutral copy with a real "Try again" retry control and no pill/no upgrade CTA. The remaining three screenshots (good/Free/desktop pill+headline, all-poor/Free/desktop, loading skeleton) were verified via the spec's own in-browser assertions (text visibility, absence of the location name, absence of the accent-glow selector) but not separately opened as images.

## 8. Analytics/gating preservation — verified unchanged

- `northern_lights_card_viewed` still fires exactly once per `${requestKey}:${primary}` identity, now re-verified stable across a `rerender` with different `lang`/`theme` props (a scenario Ticket 397's test suite didn't specifically cover, added here since theme is new to this ticket's props).
- `northern_lights_ranking_viewed`/`northern_lights_map_viewed` still gate on `display.showRanking`/`display.showMap` AND `detailsExpanded` — fire exactly once on first genuine expansion, not on collapse/re-expand, and never for the all-poor path (re-verified, including with a persisted `detailsExpanded=true`).
- `northern_lights_upgrade_clicked` still carries `source: "northern_lights_card"`.
- The temporary "New" badge fires no analytics event of its own (asserted directly: no `trackEvent` call name contains "badge").
- No new analytics event was added or removed by this ticket.

## 9. Deviations and residual risks

1. **`nlAllPoorTitle`/`nlAllPoorBody` were removed rather than kept alongside the new visual-state tokens.** Reasoning: qualifying results are always `excellent`/`good`/`fair` by construction (`selectAuroraDisplay`'s own filter), so the all-poor branch's band is always grouped to the `poor` visual state — there is no separate "qualifying but poor" case that would need its own distinct copy. Consolidating onto the shared `nlPillPoor`/`nlHeadlinePoor`/`nlBodyPoor` tokens avoids two near-duplicate copy pairs drifting apart over time. Confirmed via `grep -rln "nlAllPoorTitle\|nlAllPoorBody" src/` that no consumer remained before deleting. `nlAllPoorBestLabel` (the "Best of the checked options (still poor):" prefix) was kept as-is since it serves a distinct, still-needed purpose.
2. **A pre-existing naming typo, `StaleParialNotices`** (should read `StalePartialNotices`), was left as-is in `NorthernLightsCard.jsx`. It is internally consistent — the sole component definition is called correctly at both of its use sites (`AuroraResult`, `AllPoorResult`) — and has no functional or test impact. Flagged here rather than silently fixed, since renaming an internal-only identifier was judged outside this ticket's presentation-only scope; trivial to fix in a follow-up if desired.
3. **A pre-existing, unrelated e2e failure was observed during full-suite validation and is NOT caused by this ticket**: `tests/e2e/blog-draft-preview.spec.js`'s "non-admin visiting a draft slug sees not-found UI" test fails both when run alongside the new spec and in complete isolation (`npx playwright test tests/e2e/blog-draft-preview.spec.js`, reproduced independently). This file has no relationship to `NorthernLightsCard`, Aurora, or anything touched by this ticket's diff — it exercises `BlogPostPage`'s draft/admin-preview access control. Not investigated further as fixing it is out of this ticket's scope; noting it here so it isn't mistaken for a regression this ticket introduced.
4. No other risk identified: Ticket 1–3 contracts, the six-location roster, request/cache identity, seasonality, `selectAuroraDisplay`'s filtering/map-visibility rule, and `auroraBandPresentation.js`'s label/color table are all unchanged and directly re-verified green, not merely assumed.

## 10. Confirmation

`docs/ai/CURRENT.md` has been updated: CC report path set to this file, stage set to `CC_COMPLETE`. **Not committed. Not pushed.**
